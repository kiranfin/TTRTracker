import { getMyttUnavailableReason } from '../features/mytt/utils/errors';
import { clearLocalMyttCookie, getLocalMyttCookie, saveLocalMyttCookie } from '../storage/myttSession';
import { ApiError } from './client';

// Gleiche Dauer wie CACHE_TTL.PLAYER_TTR im Backend.
const CACHE_TTL_MS = 30 * 60 * 1000;

const cache = new Map<string, { value: unknown; expiresAt: number }>();

// Läuft die lokale Session ab, wird sie bis zum nächsten Login übersprungen. Nur im Speicher, denn nach
// einem App Neustart reicht ein einzelner Aufruf, um es erneut festzustellen.
let localSessionExpired = false;

// Nach einem 429 von myTischtennis fragt das Gerät bis dahin nicht selbst, sondern nur das Backend.
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

// Das Backend fragt myTischtennis von seiner eigenen IP. Hat es keine Session für den User, bleibt es beim 429.
async function backendWhileRateLimited<T>(backend: () => Promise<T>, rateLimitError: ApiError): Promise<T> {
    try {
        return await backend();
    } catch {
        throw rateLimitError;
    }
}

/**
 * Daten, die einen myTischtennis Login brauchen: mit lokaler Session direkt von myTischtennis, sonst über
 * das Backend (eigene Server Session oder Freigabe). Ist die lokale Session abgelaufen und das Backend
 * kann auch nichts liefern, kommt der Ablauf Fehler zurück, damit die App "Verbindung erneuern" zeigt.
 */
export async function withMyttSession<T>(params: {
    key: string;
    direct: (cookie: string) => Promise<T>;
    backend: () => Promise<T>;
}): Promise<T> {
    const cookie = await getLocalMyttCookie();

    if (!cookie) return params.backend();

    let expiredError: unknown = null;

    if (localSessionExpired) {
        expiredError = new ApiError('myTischtennis-Session ist abgelaufen.', 401, 'MYTT_AUTH_EXPIRED');
    } else {
        const cached = cache.get(params.key);

        if (cached && cached.expiresAt > Date.now()) return cached.value as T;

        if (Date.now() < directPausedUntil) {
            return backendWhileRateLimited(
                params.backend,
                new ApiError('myTischtennis ist gerade rate-limited. Bitte später erneut versuchen.', 429, 'MYTT_RATE_LIMITED'),
            );
        }

        try {
            const value = await params.direct(cookie);

            cache.set(params.key, { value, expiresAt: Date.now() + CACHE_TTL_MS });

            return value;
        } catch (error) {
            if (isRateLimitedError(error)) {
                directPausedUntil = Date.now() + getRetryAfterMs(error);
                return backendWhileRateLimited(params.backend, error);
            }

            if (!isExpiredError(error)) throw error;

            localSessionExpired = true;
            cache.clear();
            expiredError = error;
        }
    }

    try {
        return await params.backend();
    } catch (backendError) {
        if (getMyttUnavailableReason(backendError)) throw expiredError;

        throw backendError;
    }
}
