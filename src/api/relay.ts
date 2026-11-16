import { DEFAULT_PAUSE_MS, isDevicePaused, parseRetryAfterMs, pauseDevice } from './devicePause';

// Device Relay: Fehlen dem Backend Daten von myTischtennis, beschreibt es der App die nötigen Requests.
// Die App ruft sie von ihrer eigenen IP ab (eigenes Kontingent) und lädt die Rohantworten hoch. Das Backend
// baut weiter allein die URLs, parst und prüft die Daten. Die App führt nur Requests an myTischtennis aus,
// sendet nie Cookies oder Tokens und lädt bei 429 oder /verify nichts hoch. Das Captcha wird nie umgangen.

// Fest im Code, nicht vom Backend übernommen: ein manipuliertes Backend kann die App nicht umleiten.
const MYTT_ORIGIN = 'https://www.mytischtennis.de';

const MAX_ROUNDS = 4;
const MAX_REQUESTS_PER_ROUND = 4;
const MIN_INTERVAL_MS = 400;
const MAX_CONCURRENT = 2;
const REQUEST_TIMEOUT_MS = 10_000;
const VERIFY_PAUSE_MS = 30 * 60 * 1000;
// Bleiben so viele Anfragen im Kontingent von myTischtennis übrig, pausiert das Gerät danach.
const QUOTA_RESERVE = 20;

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

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// Warteschlange: höchstens MAX_CONCURRENT Abrufe gleichzeitig, Starts mindestens MIN_INTERVAL_MS auseinander.
let active = 0;
let nextStartAt = 0;
const waiters: (() => void)[] = [];

async function acquire() {
  while (active >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => waiters.push(resolve));
  }

  active += 1;

  const startAt = Math.max(Date.now(), nextStartAt);

  nextStartAt = startAt + MIN_INTERVAL_MS;

  if (startAt > Date.now()) {
    await sleep(startAt - Date.now());
  }
}

function release() {
  active -= 1;
  waiters.shift()?.();
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

function parseQuota(header: string | null) {
  const remaining = header?.match(/\br=(\d+)/)?.[1];
  const resetSeconds = header?.match(/\bt=(\d+)/)?.[1];

  return remaining === undefined ? null : { remaining: Number(remaining), resetMs: Number(resetSeconds ?? 0) * 1000 };
}

// null: das Gerät ist selbst gebremst oder der Abruf ging schief. Dann wird nichts hochgeladen.
async function fetchOne(request: RelayRequest): Promise<RelayResponse | null> {
  await acquire();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(request.url, {
      method: request.method,
      // credentials: 'omit', damit auf iOS nicht der Cookie Speicher der Plattform Header ergänzt.
      credentials: 'omit',
      headers: safeHeaders(request.headers),
      body: request.method === 'POST' ? request.body : undefined,
      signal: controller.signal,
    });

    const finalUrl = response.url || request.url;
    const remixRedirect = response.headers.get('x-remix-redirect');

    if (response.status === 429) {
      pauseDevice(parseRetryAfterMs(response.headers.get('retry-after')));

      return null;
    }

    if (isVerifyPath(finalUrl) || (remixRedirect !== null && isVerifyPath(remixRedirect))) {
      pauseDevice(VERIFY_PAUSE_MS);

      return null;
    }

    const quota = parseQuota(response.headers.get('ratelimit'));

    // Die Antwort ist noch gut, danach schont das Gerät das Kontingent bis zum Reset.
    if (quota && quota.remaining < QUOTA_RESERVE) {
      pauseDevice(quota.resetMs > 0 ? quota.resetMs : DEFAULT_PAUSE_MS);
    }

    return {
      id: request.id,
      status: response.status,
      contentType: response.headers.get('content-type') ?? '',
      body: await response.text(),
      finalUrl,
      ...(response.headers.has('x-remix-error') ? { remixError: true } : {}),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    release();
  }
}

// Eine Runde: alle Requests abrufen. null bei jedem Problem, dann gilt der Fallback.
async function runRound(requests: RelayRequest[]): Promise<RelayResponse[] | null> {
  if (requests.length > MAX_REQUESTS_PER_ROUND || !requests.every(isAllowed)) {
    return null;
  }

  const results = await Promise.all(requests.map(fetchOne));
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
