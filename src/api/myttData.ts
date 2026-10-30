import { clearLocalMyttCookie, getLocalMyttCookie, saveLocalMyttCookie } from '../storage/myttSession';
import {
  clearSnapshots,
  getSnapshot,
  saveSnapshot,
  toStaleResponse,
  type SnapshotKind,
} from '../storage/myttSnapshots';
import { ApiError } from './client';

// Gleiche Dauer wie die Frische der Startseite: derselbe Wert wird nicht öfter von myTischtennis geholt.
const CACHE_TTL_MS = 30 * 60 * 1000;

const cache = new Map<string, { value: unknown; expiresAt: number }>();

// Läuft die lokale Session ab, wird sie bis zum nächsten Login übersprungen. Nur im Speicher, denn nach
// einem App Neustart reicht ein einzelner Aufruf, um es erneut festzustellen.
let localSessionExpired = false;

// Nach einem 429 von myTischtennis fragt das Gerät bis dahin nicht erneut.
let directPausedUntil = 0;

export async function saveLocalMyttSession(cookie: string) {
  await saveLocalMyttCookie(cookie);
  localSessionExpired = false;
  cache.clear();
}

export async function clearLocalMyttSession() {
  await clearLocalMyttCookie();
  localSessionExpired = false;
  cache.clear();
  // Die gespeicherten Stände gehören zur Verbindung und gehen mit ihr.
  await clearSnapshots();
}

export async function hasLocalMyttSession() {
  const cookie = await getLocalMyttCookie();

  return Boolean(cookie) && !localSessionExpired;
}

function isExpiredError(error: unknown) {
  return error instanceof ApiError && error.code === 'MYTT_AUTH_EXPIRED';
}

function isRateLimitedError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.code === 'MYTT_RATE_LIMITED';
}

function getRetryAfterMs(error: ApiError) {
  const value = (error.details as { retryAfterMs?: unknown } | undefined)?.retryAfterMs;

  return typeof value === 'number' ? value : 0;
}

type Snapshotted = { data?: { error?: unknown | null }; meta?: { fetchedAt?: string | number } };

function fetchedAtOf(value: unknown) {
  const fetchedAt = (value as Snapshotted).meta?.fetchedAt;
  const timestamp = typeof fetchedAt === 'number' ? fetchedAt : Date.parse(String(fetchedAt ?? ''));

  return Number.isFinite(timestamp) ? timestamp : Date.now();
}

/**
 * Daten, die einen myTischtennis Login brauchen, holt nur das Gerät: direkt von myTischtennis mit dem
 * Cookie vom Gerät, nie über das Backend. Ohne Cookie kommt MYTT_ACCOUNT_REQUIRED zurück (die App zeigt dann
 * den öffentlichen Wert und den Hinweis zum Verbinden), bei abgelaufenem Cookie MYTT_AUTH_EXPIRED.
 *
 * Mit `snapshot` wird jeder erfolgreiche Abruf auf dem Gerät gespeichert. Bremst myTischtennis oder fehlt
 * das Netz, liefert die Funktion den letzten Stand als "stale" mit dem echten Datenstand.
 */
export async function withMyttSession<T>(params: {
  key: string;
  snapshot?: { kind: SnapshotKind; nuid: string };
  direct: (cookie: string) => Promise<T>;
}): Promise<T> {
  const cookie = await getLocalMyttCookie();

  if (!cookie) {
    throw new ApiError('Keine myTischtennis-Verbindung auf diesem Gerät.', 401, 'MYTT_ACCOUNT_REQUIRED');
  }

  if (localSessionExpired) {
    throw new ApiError('myTischtennis-Session ist abgelaufen.', 401, 'MYTT_AUTH_EXPIRED');
  }

  const cached = cache.get(params.key);

  if (cached && cached.expiresAt > Date.now()) return cached.value as T;

  async function lastKnown(error: unknown): Promise<T> {
    const snapshot = params.snapshot ? await getSnapshot<T>(params.snapshot.kind, params.snapshot.nuid) : null;

    if (!snapshot) throw error;

    return toStaleResponse(snapshot);
  }

  if (Date.now() < directPausedUntil) {
    return lastKnown(
        new ApiError('myTischtennis ist gerade rate-limited. Bitte später erneut versuchen.', 429, 'MYTT_RATE_LIMITED'),
    );
  }

  try {
    const value = await params.direct(cookie);

    cache.set(params.key, { value, expiresAt: Date.now() + CACHE_TTL_MS });

    if (params.snapshot && !(value as Snapshotted).data?.error) {
      saveSnapshot(params.snapshot.kind, params.snapshot.nuid, value, fetchedAtOf(value)).catch(() => undefined);
    }

    return value;
  } catch (error) {
    if (isExpiredError(error)) {
      localSessionExpired = true;
      cache.clear();

      throw error;
    }

    if (isRateLimitedError(error)) {
      directPausedUntil = Date.now() + getRetryAfterMs(error);
    }

    // Rate Limit, Netzfehler, Störung bei myTischtennis: lieber der letzte bekannte Stand als ein Fehler.
    return lastKnown(error);
  }
}
