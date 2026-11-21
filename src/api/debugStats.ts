import { useSyncExternalStore } from 'react';

// Kleine Statistik für den Debug Bereich der Einstellungen. Nur Arbeitsspeicher, nur für diese Sitzung und nur für
// dieses Gerät: letztes Kontingent bei myTischtennis, Zähler, die letzten Abrufe und die aktiven Live Abfragen.
// Ohne weitere Imports, damit jeder Teil der App sie ohne zirkuläre Abhängigkeit melden kann.

export const MAX_RECENT_CALLS = 30;

export type DebugCallSource = 'backend' | 'device';

export type DebugCall = {
  at: number;
  source: DebugCallSource;
  method: string;
  path: string;
  // HTTP Status, "ERR" bei Netzfehlern
  status: number | 'ERR';
  durationMs: number;
};

export type DebugQuota = {
  remaining: number;
  // Sekunden bis zum Reset, wie vom Header gemeldet
  resetSeconds?: number;
  raw: string;
  at: number;
};

export type DebugLiveActivity = {
  count: number;
  lastAt: number;
};

export type DebugSnapshot = {
  quota: DebugQuota | null;
  backendRequests: number;
  deviceRequests: number;
  cacheFresh: number;
  cacheStale: number;
  cacheLoads: number;
  calls: DebugCall[];
  live: Record<string, DebugLiveActivity>;
};

function emptySnapshot(live: DebugSnapshot['live'] = {}): DebugSnapshot {
  return {
    quota: null,
    backendRequests: 0,
    deviceRequests: 0,
    cacheFresh: 0,
    cacheStale: 0,
    cacheLoads: 0,
    calls: [],
    live,
  };
}

let snapshot = emptySnapshot();
const listeners = new Set<() => void>();

function update(change: (current: DebugSnapshot) => Partial<DebugSnapshot>) {
  snapshot = { ...snapshot, ...change(snapshot) };
  listeners.forEach((listener) => listener());
}

function withCall(current: DebugSnapshot, call: DebugCall) {
  return [call, ...current.calls].slice(0, MAX_RECENT_CALLS);
}

function pathOnly(value: string) {
  const index = value.indexOf('?');

  return index === -1 ? value : value.slice(0, index);
}

export function subscribeDebugStats(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getDebugSnapshot() {
  return snapshot;
}

export function useDebugStats() {
  return useSyncExternalStore(subscribeDebugStats, getDebugSnapshot, getDebugSnapshot);
}

/** Kontingent aus dem ratelimit Header einer myTischtennis Antwort ("r=12, t=900"). */
export function recordQuota(raw: string, remaining: number, resetSeconds?: number) {
  update(() => ({ quota: { remaining, resetSeconds, raw, at: Date.now() } }));
}

/** Ein Abruf des Backends (ohne Query, die kann Namen enthalten). */
export function recordBackendRequest(call: { method: string; path: string; status: number | 'ERR'; durationMs: number }) {
  update((current) => ({
    backendRequests: current.backendRequests + 1,
    calls: withCall(current, { ...call, path: pathOnly(call.path), at: Date.now(), source: 'backend' }),
  }));
}

/** Ein Abruf des Geräts bei myTischtennis (Device Relay oder Login Daten). */
export function recordDeviceRequest(call: { method: string; url: string; status?: number | 'ERR'; durationMs?: number }) {
  let path = call.url;

  try {
    path = new URL(call.url).pathname;
  } catch {
    path = pathOnly(call.url);
  }

  update((current) => ({
    deviceRequests: current.deviceRequests + 1,
    calls: withCall(current, {
      at: Date.now(),
      source: 'device',
      method: call.method,
      path,
      status: call.status ?? 'ERR',
      durationMs: call.durationMs ?? 0,
    }),
  }));
}

/** fresh: frischer Treffer, stale: alter Stand geliefert (abgelaufen oder in einer Pause), load: es wurde geladen. */
export function recordCacheEvent(kind: 'fresh' | 'stale' | 'load') {
  update((current) =>
      kind === 'fresh'
          ? { cacheFresh: current.cacheFresh + 1 }
          : kind === 'stale'
              ? { cacheStale: current.cacheStale + 1 }
              : { cacheLoads: current.cacheLoads + 1 },
  );
}

/** Wie viele Spiele die Hook Instanz `id` gerade live abfragt (0 entfernt sie). */
export function setLiveActivity(id: string, count: number) {
  update((current) => {
    const live = { ...current.live };

    if (count > 0) {
      live[id] = { count, lastAt: Date.now() };
    } else {
      delete live[id];
    }

    return { live };
  });
}

/** Setzt die Zähler zurück. Kontingent und aktive Live Abfragen bleiben, sie gehören zum laufenden Zustand. */
export function resetDebugStats() {
  update((current) => ({ ...emptySnapshot(current.live), quota: current.quota }));
}
