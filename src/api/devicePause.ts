// Gemeinsame Pause für alle Abrufe, die das Gerät selbst bei myTischtennis macht (Login Daten in myttDirect
// und Device Relay in relay). Beide teilen sich dieselbe IP und damit dasselbe Kontingent. Nur im
// Arbeitsspeicher: nach einem App Neustart reicht ein einzelner Aufruf, um eine Bremse erneut festzustellen.

// Ohne Retry-After pausieren die Abrufe so lange, ehe das Gerät es wieder selbst versucht.
export const DEFAULT_PAUSE_MS = 5 * 60 * 1000;

let pausedUntil = 0;

export function pauseDevice(ms: number) {
  if (ms > 0) {
    pausedUntil = Math.max(pausedUntil, Date.now() + ms);
  }
}

/** Ende der Pause, 0 ohne Pause. */
export function getDevicePausedUntil() {
  return pausedUntil;
}

export function isDevicePaused() {
  return Date.now() < pausedUntil;
}

/** Dauer aus einem Retry-After Header (Sekunden oder Datum), sonst die Standardpause. */
export function parseRetryAfterMs(header: string | null) {
  if (!header) return DEFAULT_PAUSE_MS;

  const seconds = Number(header);

  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;

  const date = Date.parse(header);

  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : DEFAULT_PAUSE_MS;
}
