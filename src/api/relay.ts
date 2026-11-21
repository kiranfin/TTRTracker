import { isDevicePaused, parseRetryAfterMs, pauseDevice } from './devicePause';
import { noteQuota, runOnDevice } from './deviceQueue';

// Device Relay: Fehlen dem Backend Daten von myTischtennis, beschreibt es der App die nötigen Requests.
// Die App ruft sie von ihrer eigenen IP ab (eigenes Kontingent) und lädt die Rohantworten hoch. Das Backend
// baut weiter allein die URLs, parst und prüft die Daten. Die App führt nur Requests an myTischtennis aus,
// sendet nie Cookies oder Tokens und lädt bei 429 oder /verify nichts hoch. Das Captcha wird nie umgangen.

// Fest im Code, nicht vom Backend übernommen: ein manipuliertes Backend kann die App nicht umleiten.
const MYTT_ORIGIN = 'https://www.mytischtennis.de';

const MAX_ROUNDS = 4;
const MAX_REQUESTS_PER_ROUND = 4;
const MAX_REDIRECTS = 3;
const REQUEST_TIMEOUT_MS = 10_000;
const VERIFY_PAUSE_MS = 30 * 60 * 1000;

const RELAY_HEADERS = { 'x-tt-relay': '1' };

export type RelayRequest = {
  id: string;
  method: 'GET' | 'POST';
  url: string;
  headers: Record<string, string>;
  body?: string;
};

export type RelayResponse = {
  id: string;
  status: number;
  contentType: string;
  body: string;
  finalUrl: string;
  remixError?: boolean;
};

/** Wie relayGet mit dem Backend spricht. Entkoppelt von client.ts, um zirkuläre Importe zu vermeiden. */
export type RelayTransport<T> = {
  // GET des ursprünglichen Pfades, optional mit zusätzlichen Headern.
  get: (headers?: Record<string, string>) => Promise<T>;
  // POST /api/relay
  upload: (body: { responses: RelayResponse[] }) => Promise<unknown>;
};

function isRelayEnabled() {
  // Muss genau so geschrieben sein, damit Expo den Wert beim Build einsetzt.
  return process.env.EXPO_PUBLIC_RELAY_ENABLED !== 'false';
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
}

function toRequests(value: unknown): RelayRequest[] | null {
  const requests = asRecord(value)?.requests;

  return Array.isArray(requests) && requests.length > 0 ? (requests as RelayRequest[]) : null;
}

// Die Antwort ohne das `relay` Feld und die Requests daraus. Der Aufrufer sieht `relay` nie.
function splitRelay<T>(response: T): { clean: T; requests: RelayRequest[] | null } {
  const record = asRecord(response);

  if (!record || !('relay' in record)) {
    return { clean: response, requests: null };
  }

  const { relay, ...rest } = record;

  return { clean: rest as T, requests: toRequests(relay) };
}

function relayRequestsFromError(error: unknown): RelayRequest[] | null {
  const { code, details } = (error ?? {}) as { code?: unknown; details?: unknown };

  return code === 'RELAY_REQUIRED' ? toRequests(details) : null;
}

function isAllowed(request: RelayRequest) {
  try {
    return (
        (request.method === 'GET' || request.method === 'POST') &&
        typeof request.id === 'string' &&
        new URL(request.url).origin === MYTT_ORIGIN
    );
  } catch {
    return false;
  }
}

function safeHeaders(headers: Record<string, string> | undefined) {
  const result: Record<string, string> = {};

  for (const [name, value] of Object.entries(headers ?? {})) {
    const lower = name.toLowerCase();

    if (typeof value === 'string' && !['cookie', 'authorization', 'host', 'content-length'].includes(lower)) {
      result[name] = value;
    }
  }

  return result;
}

function isVerifyPath(url: string) {
  try {
    const { pathname } = new URL(url, MYTT_ORIGIN);

    return pathname === '/verify' || pathname.startsWith('/verify/');
  } catch {
    return false;
  }
}

type Fetched = { status: number; headers: Headers; url: string; body: string };

// Ein einzelner Abruf innerhalb der gemeinsamen Warteschlange des Geräts. Der Timeout läuft erst ab dem Start.
function send(url: string, method: 'GET' | 'POST', headers: Record<string, string>, body?: string) {
  return runOnDevice(async (): Promise<Fetched> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const startedAt = Date.now();

    try {
      const response = await fetch(url, {
        method,
        // credentials: 'omit', damit auf iOS nicht der Cookie Speicher der Plattform Header ergänzt.
        credentials: 'omit',
        headers,
        body: method === 'POST' ? body : undefined,
        signal: controller.signal,
      });

      // Die Antwort ist noch gut, danach schont das Gerät bei knappem Kontingent die Anfragen bis zum Reset.
      noteQuota(response.headers.get('ratelimit'), { method, url, status: response.status, durationMs: Date.now() - startedAt });

      return {
        status: response.status,
        headers: response.headers,
        url: response.url || url,
        body: await response.text(),
      };
    } finally {
      clearTimeout(timer);
    }
  });
}

// myTischtennis beantwortet eine Weiterleitung auf einen ?_data= Request mit 204 und x-remix-redirect.
// Das Gerät folgt ihr selbst (wie das Backend: höchstens MAX_REDIRECTS, nur gleiche Origin, danach GET ohne Body).
// null: keine Weiterleitung. '': ein unbrauchbares Ziel.
function remixTarget(fetched: Fetched): string | null {
  const location = fetched.headers.get('x-remix-redirect');

  if (location === null) return null;

  try {
    return new URL(location, fetched.url).toString();
  } catch {
    return '';
  }
}

// Laufen zwei Backend Aufrufe gleichzeitig in denselben Miss (z.B. Home und Spielerseite holen dasselbe Rating),
// holt das Gerät ihn nur einmal. Eine gute Antwort bleibt kurz liegen, falls die zweite Runde etwas später startet.
// Das Backend hält Antworten ohnehin 2 Minuten in seiner Inbox, der Wert ist also nicht zu alt.
const SHARED_RESULT_MS = 10_000;
const shared = new Map<string, Promise<RelayResponse | null>>();

function sharedKey(request: RelayRequest) {
  return `${request.method} ${request.url}\n${request.body ?? ''}`;
}

function fetchShared(request: RelayRequest): Promise<RelayResponse | null> {
  const key = sharedKey(request);
  const pending = shared.get(key);

  // Die id gehört zum jeweiligen Aufrufer, der Rest der Antwort ist derselbe.
  if (pending) return pending.then((result) => (result ? { ...result, id: request.id } : null));

  const promise = fetchOne(request);

  shared.set(key, promise);
  promise.then((result) => {
    if (!result) {
      shared.delete(key);
      return;
    }

    setTimeout(() => {
      if (shared.get(key) === promise) shared.delete(key);
    }, SHARED_RESULT_MS);
  });

  return promise;
}

// null: das Gerät ist selbst gebremst oder der Abruf ging schief. Dann wird nichts hochgeladen.
async function fetchOne(request: RelayRequest): Promise<RelayResponse | null> {
  const headers = safeHeaders(request.headers);

  try {
    let fetched = await send(request.url, request.method, headers, request.body);

    for (let hops = 0; ; hops += 1) {
      const redirect = remixTarget(fetched);

      if (fetched.status === 429) {
        pauseDevice(parseRetryAfterMs(fetched.headers.get('retry-after')));

        return null;
      }

      if (isVerifyPath(fetched.url) || (redirect !== null && isVerifyPath(redirect))) {
        pauseDevice(VERIFY_PAUSE_MS);

        return null;
      }

      if (redirect === null) {
        // Hochgeladen wird die letzte Antwort unter der ursprünglichen request.id.
        return {
          id: request.id,
          status: fetched.status,
          contentType: fetched.headers.get('content-type') ?? '',
          body: fetched.body,
          finalUrl: fetched.url,
          ...(fetched.headers.has('x-remix-error') ? { remixError: true } : {}),
        };
      }

      // Zu viele Sprünge oder ein Ziel außerhalb von myTischtennis: der Server holt es selbst.
      if (hops >= MAX_REDIRECTS || !redirect || new URL(redirect).origin !== MYTT_ORIGIN) {
        return null;
      }

      fetched = await send(redirect, 'GET', headers);
    }
  } catch {
    return null;
  }
}

// Eine Runde: alle Requests abrufen. null bei jedem Problem, dann gilt der Fallback.
async function runRound(requests: RelayRequest[]): Promise<RelayResponse[] | null> {
  if (requests.length > MAX_REQUESTS_PER_ROUND || !requests.every(isAllowed)) {
    return null;
  }

  const results = await Promise.all(requests.map(fetchShared));
  const responses = results.filter((result): result is RelayResponse => result !== null);

  return responses.length === requests.length ? responses : null;
}

/**
 * GET über das Device Relay. Das Backend liefert entweder gleich die Daten oder die Requests, die das Gerät
 * bei myTischtennis abrufen soll. Danach werden die Antworten hochgeladen und der GET wiederholt (höchstens
 * MAX_ROUNDS Runden, weil manche Daten mehrere Abrufe nacheinander brauchen).
 *
 * Fallback bei jedem Problem (Gerät gebremst, Netzfehler, Upload abgelehnt): ein alter Stand, den das Backend
 * schon mitgeliefert hat, sonst der normale GET ohne Header, bei dem der Server selbst abruft.
 */
export async function relayGet<T>(transport: RelayTransport<T>): Promise<T> {
  if (!isRelayEnabled() || isDevicePaused()) {
    return transport.get();
  }

  let stale: T | undefined;
  let hasStale = false;
  let requests: RelayRequest[];

  try {
    const first = splitRelay(await transport.get(RELAY_HEADERS));

    if (!first.requests) return first.clean;

    stale = first.clean;
    hasStale = true;
    requests = first.requests;
  } catch (error) {
    const pending = relayRequestsFromError(error);

    if (!pending) throw error;

    requests = pending;
  }

  for (let round = 0; round < MAX_ROUNDS; round += 1) {
    const responses = await runRound(requests);

    if (!responses) break;

    try {
      const result = asRecord(await transport.upload({ responses }));

      if (!result || result.accepted === 0) break;
    } catch {
      break;
    }

    try {
      const next = splitRelay(await transport.get(RELAY_HEADERS));

      if (!next.requests) return next.clean;

      stale = next.clean;
      hasStale = true;
      requests = next.requests;
    } catch (error) {
      const pending = relayRequestsFromError(error);

      if (!pending) {
        // Ein anderer Fehler (z.B. Backend gesperrt): lieber der alte Stand als ein Fehler.
        if (hasStale) return stale as T;

        throw error;
      }

      requests = pending;
    }
  }

  return hasStale ? (stale as T) : transport.get();
}
