import AsyncStorage from '@react-native-async-storage/async-storage';

// Zwischenspeicher für GET Antworten des Backends. Ein Tab Wechsel innerhalb der Frische Zeit löst keine
// Anfrage mehr aus. Bremst das Backend (429, 5xx, kein Netz), liefert der Speicher den letzten Stand als
// "stale", dann zeigt der vorhandene StaleNotice den Hinweis.

const INDEX_KEY = 'tttracker.apiCache.index';
const ENTRY_KEY_PREFIX = 'tttracker.apiCache.entry.';

const MAX_ENTRIES = 200;
const FLUSH_DELAY_MS = 2000;
// Ein Eintrag, der älter ist, taugt auch als Notnagel nicht mehr (wie CACHE_STALE_MAX_AGE_MS im Backend).
const STALE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
// Längere Pausen nach einem 429 sind nicht sinnvoll, das Kontingent von myTischtennis läuft in 30 Minuten ab.
const MAX_PAUSE_MS = 30 * 60 * 1000;
// Größere Antworten bleiben nur im Arbeitsspeicher, AsyncStorage tut sich mit sehr großen Einträgen schwer.
const MAX_PERSISTED_CHARS = 500_000;

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const DAY_MS = 24 * 60 * MINUTE_MS;

type FreshMs = number | ((response: unknown) => number);

// Frische Zeiten, angelehnt an CACHE_TTL im Backend. Was nicht in der Tabelle steht (z.B. /health), wird
// nicht zwischengespeichert.
const FRESHNESS_RULES: [RegExp, FreshMs][] = [
  [/^\/api\/search\//, 5 * MINUTE_MS],
  [/^\/api\/players\/[^/]+\/rating$/, 15 * MINUTE_MS],
  // Eine unvollständige Schätzung (pending) ist nie frisch, damit die nächste Etappe geladen wird.
  [/^\/api\/players\/[^/]+\/ttr-estimate$/, (response) => (getEstimatePending(response) > 0 ? 0 : 15 * MINUTE_MS)],
  [/^\/api\/clubs\/[^/]+\/[^/]+\/(teams|players|info)$/, 30 * MINUTE_MS],
  [/^\/api\/clubs\/[^/]+\/[^/]+\/schedule$/, 30 * MINUTE_MS],
  [/^\/api\/leagues\/[^/]+\/[^/]+\/[^/]+\/table$/, 10 * MINUTE_MS],
  [/^\/api\/leagues\/[^/]+\/[^/]+\/[^/]+\/schedule$/, 30 * MINUTE_MS],
  [/^\/api\/teams\/.+\/(schedule|simple-schedule)$/, 30 * MINUTE_MS],
  [/^\/api\/teams\/.+\/(infos|balances|players)$/, 30 * MINUTE_MS],
  [/^\/api\/events(\/[^/]+)?$/, 30 * MINUTE_MS],
  [/^\/api\/meetings\/[^/]+\/live$/, getMeetingFreshMs],
];

type Entry = {
  key: string;
  path: string;
  savedAt: number;
  data: unknown;
};

type IndexItem = { path: string; savedAt: number };

export type ResponseCacheStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
};

export type CachedGetRequest<T> = {
  baseUrl: string;
  path: string;
  params?: Record<string, string | number | undefined>;
  load: () => Promise<T>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
}

function getEstimatePending(response: unknown) {
  const coverage = asRecord(asRecord(asRecord(response)?.data)?.coverage);

  return typeof coverage?.pending === 'number' ? coverage.pending : 0;
}

function getMeetingFreshMs(response: unknown) {
  const data = asRecord(asRecord(response)?.data);

  if (data?.live === true) return 30 * SECOND_MS;

  return data?.is_completed === true ? 7 * DAY_MS : 2 * MINUTE_MS;
}

function getFreshMs(path: string, response: unknown) {
  // Das Backend hat selbst nur einen älteren Stand geliefert: bald wieder nachfragen.
  if (asRecord(asRecord(response)?.meta)?.source === 'stale') return 0;

  const rule = FRESHNESS_RULES.find(([pattern]) => pattern.test(path));

  if (!rule) return 0;

  return typeof rule[1] === 'function' ? rule[1](response) : rule[1];
}

function isCacheable(path: string) {
  return FRESHNESS_RULES.some(([pattern]) => pattern.test(path));
}

function buildKey(baseUrl: string, path: string, params?: Record<string, string | number | undefined>) {
  const query = Object.entries(params ?? {})
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([name, value]) => [name, String(value)] as const)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
      .join('&');

  // Mit der Basis URL im Key mischt ein Wechsel des API Ziels keine Daten.
  return `${baseUrl.replace(/\/$/, '')}${path}${query ? `?${query}` : ''}`;
}

function storageKeyFor(key: string) {
  // Kurzer Hash, der Originalschlüssel steht im Eintrag und wird beim Lesen geprüft.
  let hash = 5381;

  for (let index = 0; index < key.length; index += 1) {
    hash = ((hash << 5) + hash + key.charCodeAt(index)) | 0;
  }

  return `${ENTRY_KEY_PREFIX}${(hash >>> 0).toString(16)}-${key.length}`;
}

type ErrorLike = { name?: unknown; status?: unknown; code?: unknown; retryAfterSeconds?: unknown };

// Vorübergehend: Backend oder myTischtennis bremst oder hängt, oder das Netz fehlt. Alles andere
// (400, 404, Login) bleibt ein Fehler, auch wenn ein alter Stand da wäre.
function isTransientError(error: unknown) {
  const { name, status, code } = (error ?? {}) as ErrorLike;

  if (typeof status === 'number') {
    return status === 429 || status >= 500;
  }

  if (typeof code === 'string') {
    return code === 'RATE_LIMITED' || code.startsWith('UPSTREAM_');
  }

  // ApiError ohne Status ist ein Konfigurationsfehler (z.B. fehlende Basis URL), kein Netzwerkfehler.
  return name !== 'ApiError';
}

function getRetryAfterMs(error: unknown) {
  const { status, code, retryAfterSeconds } = (error ?? {}) as ErrorLike;

  if ((status === 429 || code === 'RATE_LIMITED') && typeof retryAfterSeconds === 'number' && retryAfterSeconds > 0) {
    return Math.min(retryAfterSeconds * SECOND_MS, MAX_PAUSE_MS);
  }

  return 0;
}

function toTimestamp(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp) ? timestamp : null;
}

// Hat die Antwort die Form { data, meta }, wird sie als "stale" markiert, mit dem älteren Stand von
// meta.fetchedAt und savedAt. So zeigt getStaleSince den Hinweis ohne weitere Änderung.
function toStaleResponse(entry: Entry): unknown {
  const response = asRecord(entry.data);
  const meta = asRecord(response?.meta);

  if (!response || !meta) return entry.data;

  const fetchedAt = toTimestamp(meta.fetchedAt);
  const staleSince = fetchedAt === null ? entry.savedAt : Math.min(fetchedAt, entry.savedAt);

  return {
    ...response,
    meta: { ...meta, source: 'stale', fetchedAt: new Date(staleSince).toISOString() },
  };
}

export function createResponseCache(deps: { storage: ResponseCacheStorage; now?: () => number }) {
  const { storage } = deps;
  const now = deps.now ?? Date.now;

  const memory = new Map<string, Entry>();
  const index = new Map<string, IndexItem>();
  const inFlight = new Map<string, Promise<unknown>>();
  // Eintrag per Hand veraltet (z.B. "Erneut versuchen"): wird neu geladen, bleibt aber als Notnagel.
  const invalidated = new Set<string>();
  const dirty = new Set<string>();
  const removed = new Set<string>();

  let indexLoaded: Promise<void> | null = null;
  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let pausedUntil = 0;

  function loadIndex() {
    indexLoaded ??= (async () => {
      try {
        const stored = await storage.getItem(INDEX_KEY);
        const parsed = stored ? (JSON.parse(stored) as Record<string, IndexItem>) : {};

        for (const [key, item] of Object.entries(parsed)) {
          // Was schon im Speicher steht (neuer), bleibt.
          if (!index.has(key) && typeof item?.savedAt === 'number' && typeof item.path === 'string') {
            index.set(key, item);
          }
        }
      } catch {
        // Ohne Index startet der Zwischenspeicher leer.
      }
    })();

    return indexLoaded;
  }

  async function readEntry(key: string): Promise<Entry | null> {
    const cached = memory.get(key);

    if (cached) return cached;
    if (!index.has(key)) return null;

    try {
      const stored = await storage.getItem(storageKeyFor(key));
      const parsed = stored ? (JSON.parse(stored) as Entry) : null;

      if (parsed?.key === key && typeof parsed.savedAt === 'number') {
        memory.set(key, parsed);

        return parsed;
      }
    } catch {
      // Kaputter Eintrag zählt als nicht vorhanden.
    }

    return null;
  }

  function scheduleFlush() {
    if (flushTimer) return;

    flushTimer = setTimeout(() => {
      flushTimer = null;
      flush().catch(() => undefined);
    }, FLUSH_DELAY_MS);
  }

  async function flush() {
    const toWrite = [...dirty];
    const toRemove = [...removed];

    dirty.clear();
    removed.clear();

    try {
      if (toRemove.length > 0) {
        await storage.multiRemove(toRemove.map(storageKeyFor));
      }

      for (const key of toWrite) {
        const entry = memory.get(key);
        const serialized = entry ? JSON.stringify(entry) : null;

        if (serialized && serialized.length <= MAX_PERSISTED_CHARS) {
          await storage.setItem(storageKeyFor(key), serialized);
        }
      }

      await storage.setItem(INDEX_KEY, JSON.stringify(Object.fromEntries(index)));
    } catch {
      // Ein Speicherfehler lässt nie eine Anfrage scheitern, der Eintrag bleibt im Arbeitsspeicher.
    }
  }

  function drop(key: string) {
    memory.delete(key);
    invalidated.delete(key);
    dirty.delete(key);

    if (index.delete(key)) {
      removed.add(key);
    }
  }

  function evict() {
    if (index.size <= MAX_ENTRIES) return;

    const oldestFirst = [...index.entries()].sort(([, left], [, right]) => left.savedAt - right.savedAt);

    for (const [key] of oldestFirst) {
      if (index.size <= MAX_ENTRIES) break;

      drop(key);
    }
  }

  function save(key: string, path: string, data: unknown) {
    const entry: Entry = { key, path, savedAt: now(), data };

    memory.set(key, entry);
    invalidated.delete(key);
    removed.delete(key);
    index.set(key, { path, savedAt: entry.savedAt });
    dirty.add(key);

    evict();
    scheduleFlush();
  }

  async function cachedGet<T>(request: CachedGetRequest<T>): Promise<T> {
    const { baseUrl, path, params, load } = request;

    if (!isCacheable(path)) {
      return load();
    }

    const key = buildKey(baseUrl, path, params);
    let entry: Entry | null = null;

    try {
      await loadIndex();
      entry = await readEntry(key);
    } catch {
      entry = null;
    }

    const age = entry ? now() - entry.savedAt : Infinity;
    // Als Notnagel taugt der Eintrag nur, solange er nicht zu alt ist.
    const fallback = entry && age <= STALE_MAX_AGE_MS ? entry : null;

    // 1. Frischer Eintrag: sofort zurück.
    if (entry && !invalidated.has(key) && age < getFreshMs(path, entry.data)) {
      return entry.data as T;
    }

    // Das Backend hat uns gerade ein 429 gemeldet: bis zum Ende der Pause nicht erneut fragen.
    if (fallback && now() < pausedUntil) {
      return toStaleResponse(fallback) as T;
    }

    // 2. Läuft schon eine Anfrage mit demselben Key, dranhängen.
    const running = inFlight.get(key);

    if (running) {
      return running as Promise<T>;
    }

    // 3. Laden und speichern, 4. bei vorübergehendem Fehler den alten Stand liefern.
    const promise = (async () => {
      try {
        const data = await load();

        if (data !== null && data !== undefined) {
          save(key, path, data);
        }

        return data;
      } catch (error) {
        if (!isTransientError(error)) throw error;

        const retryAfterMs = getRetryAfterMs(error);

        if (retryAfterMs > 0) {
          pausedUntil = Math.max(pausedUntil, now() + retryAfterMs);
        }

        if (!fallback) throw error;

        return toStaleResponse(fallback) as T;
      }
    })();

    inFlight.set(key, promise);

    const clear = () => {
      if (inFlight.get(key) === promise) inFlight.delete(key);
    };

    promise.then(clear, clear);

    return promise;
  }

  /**
   * Markiert Einträge als veraltet, damit der nächste Zugriff wirklich neu lädt (z.B. "Erneut versuchen").
   * `prefix` bezieht sich auf den Pfad ohne Basis URL, z.B. "/api/players". Ohne Prefix gilt es für alle.
   * Die Einträge bleiben als Notnagel erhalten, und eine laufende Pause nach einem 429 endet.
   */
  async function invalidate(prefix?: string) {
    pausedUntil = 0;

    await loadIndex();

    for (const [key, item] of index) {
      if (!prefix || item.path.startsWith(prefix)) {
        invalidated.add(key);
      }
    }
  }

  /** Löscht den gesamten Zwischenspeicher, auch auf dem Gerät. */
  async function clear() {
    pausedUntil = 0;

    await loadIndex();

    for (const key of [...index.keys()]) {
      drop(key);
    }

    memory.clear();
    invalidated.clear();
    dirty.clear();

    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }

    await flush();
  }

  return { cachedGet, invalidate, clear, flush };
}

const defaultCache = createResponseCache({ storage: AsyncStorage });

export function cachedGet<T>(request: CachedGetRequest<T>) {
  return defaultCache.cachedGet(request);
}

export function invalidateApiCache(prefix?: string) {
  return defaultCache.invalidate(prefix).catch(() => undefined);
}

export function clearApiCache() {
  return defaultCache.clear().catch(() => undefined);
}
