import { recordDeviceRequest, recordQuota } from './debugStats';
import { DEFAULT_PAUSE_MS, pauseDevice } from './devicePause';

// Gemeinsame Warteschlange für alle Abrufe, die das Gerät selbst bei myTischtennis macht (Login Daten in
// myttDirect und Device Relay in relay). Alle teilen sich dieselbe IP und damit dasselbe Kontingent.
// Höchstens MAX_CONCURRENT Abrufe gleichzeitig, Starts mindestens MIN_INTERVAL_MS auseinander.

const MIN_INTERVAL_MS = 400;
const MAX_CONCURRENT = 2;
// Bleiben so viele Anfragen im Kontingent von myTischtennis übrig, pausiert das Gerät danach.
const QUOTA_RESERVE = 20;

let active = 0;
let nextStartAt = 0;
const waiters: (() => void)[] = [];

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

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

/** Führt einen Abruf bei myTischtennis innerhalb der gemeinsamen Warteschlange aus. */
export async function runOnDevice<T>(task: () => Promise<T>): Promise<T> {
  await acquire();

  try {
    return await task();
  } finally {
    release();
  }
}

function parseQuota(header: string | null) {
  const remaining = header?.match(/\br=(\d+)/)?.[1];
  const resetSeconds = header?.match(/\bt=(\d+)/)?.[1];

  return remaining === undefined ? null : { remaining: Number(remaining), resetMs: Number(resetSeconds ?? 0) * 1000 };
}

/**
 * Liest das Kontingent aus dem ratelimit Header einer myTischtennis Antwort. Ist fast nichts mehr übrig,
 * schont das Gerät das Kontingent bis zum Reset. Im Entwicklungsmodus steht pro Abruf eine Zeile im Log
 * (ohne Query und ohne Cookies), damit sich die Requests pro Screen zählen lassen.
 */
export function noteQuota(
    header: string | null,
    request?: { method: string; url: string; status?: number; durationMs?: number },
) {
  const quota = parseQuota(header);

  if (quota && header) recordQuota(header, quota.remaining, quota.resetMs > 0 ? Math.round(quota.resetMs / 1000) : undefined);
  if (request) recordDeviceRequest(request);

  if (__DEV__ && request) {
    let pathname = request.url;

    try {
      pathname = new URL(request.url).pathname;
    } catch {
      // Die URL bleibt dann unverändert im Log.
    }

    console.log('[myTT]', request.method, pathname, `r=${quota?.remaining ?? '?'}`);
  }

  if (quota && quota.remaining < QUOTA_RESERVE) {
    pauseDevice(quota.resetMs > 0 ? quota.resetMs : DEFAULT_PAUSE_MS);
  }
}
