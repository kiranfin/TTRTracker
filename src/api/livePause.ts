import { ApiError } from './client';
import { getDevicePausedUntil, DEFAULT_PAUSE_MS } from './devicePause';
import { getApiPausedUntil } from './responseCache';

// Gemeinsame Bremse für das Live Polling: solange das Backend (429) oder das Gerät selbst bei myTischtennis
// pausiert, würden Abrufe nur den alten Stand aus dem Zwischenspeicher liefern. Dann lieber gar nicht erst fragen.

/** Ende der längeren der beiden Pausen, 0 ohne Pause. */
export function getSharedPausedUntil() {
  return Math.max(getApiPausedUntil(), getDevicePausedUntil());
}

/** Bei einem 429 das Ende der eigenen Pause (nach Retry-After, sonst fünf Minuten), sonst null. */
export function getPauseUntilFromError(error: unknown): number | null {
  if (!(error instanceof ApiError) || error.status !== 429) return null;

  const ms = error.retryAfterSeconds && error.retryAfterSeconds > 0 ? error.retryAfterSeconds * 1000 : DEFAULT_PAUSE_MS;

  return Date.now() + ms;
}

/** Ist eine der Pausen (oder die übergebene eigene) noch nicht vorbei? */
export function isLivePaused(ownPausedUntil = 0) {
  return Date.now() < Math.max(ownPausedUntil, getSharedPausedUntil());
}
