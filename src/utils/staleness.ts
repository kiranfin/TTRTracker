import type { TranslationKey, TranslationParams } from '../i18n';

// `meta` aus den Backend Antworten. source "stale" heißt: myTischtennis hat nicht geliefert, das
// Backend gibt den letzten bekannten Stand aus dem Cache zurück.
export type ResponseMeta = {
  source?: string;
  fetchedAt?: string | number;
};

// Die Backend Caches für Ranglisten und Schätzung laufen nach spätestens anderthalb Stunden ab. Ist ein
// Wert deutlich älter, kam er aus dem Notfall Cache, auch wenn die Antwort selbst frisch berechnet ist.
const STALE_AFTER_MS = 2 * 60 * 60 * 1000;

function toTimestamp(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return null;

  const timestamp = typeof value === 'number' ? value : Date.parse(value);

  return Number.isFinite(timestamp) ? timestamp : null;
}

/**
 * Zeitpunkt des ältesten beteiligten Stands, wenn die Daten als veraltet gelten sollen, sonst null.
 * `asOf` sind weitere Zeitpunkte aus den Daten selbst, z.B. wann die Vereinsliste geholt wurde.
 */
export function getStaleSince(
    meta: ResponseMeta | null | undefined,
    ...asOf: (string | number | null | undefined)[]
): number | null {
  const timestamps = [meta?.fetchedAt, ...asOf]
      .map(toTimestamp)
      .filter((value): value is number => value !== null);

  if (timestamps.length === 0) return null;

  const oldest = Math.min(...timestamps);

  if (meta?.source === 'stale' || Date.now() - oldest > STALE_AFTER_MS) return oldest;

  return null;
}

/** Ältester von mehreren Ständen, null wenn keiner veraltet ist. */
export function oldestStaleSince(...values: (number | null | undefined)[]): number | null {
  const stale = values.filter((value): value is number => typeof value === 'number');

  return stale.length > 0 ? Math.min(...stale) : null;
}

/**
 * Alter der angezeigten Daten. `since` ist der Zeitpunkt des Stands, `stale` heißt: myTischtennis hat
 * nicht geliefert oder der Stand ist deutlich älter als die Backend Caches erlauben.
 */
export type Freshness = {
  since: number;
  stale: boolean;
};

/**
 * Stand der Daten für die Anzeige "Stand: vor X". Anders als getStaleSince liefert es immer einen
 * Zeitpunkt, sobald das Backend einen kennt. `asOf` sind weitere Zeitpunkte aus den Daten selbst.
 */
export function getFreshness(
    meta: ResponseMeta | null | undefined,
    ...asOf: (string | number | null | undefined)[]
): Freshness | null {
  const timestamps = [meta?.fetchedAt, ...asOf]
      .map(toTimestamp)
      .filter((value): value is number => value !== null);

  if (timestamps.length === 0) return null;

  const since = Math.min(...timestamps);

  return { since, stale: getStaleSince(meta, ...asOf) !== null };
}

/** Wie getFreshness, für Antworten, deren Typ `meta` nicht kennt (apiGet<unknown>). */
export function getResponseFreshness(response: unknown, ...asOf: (string | number | null | undefined)[]) {
  const meta = (typeof response === 'object' && response !== null ? (response as { meta?: ResponseMeta }).meta : undefined);

  return getFreshness(meta, ...asOf);
}

/** Ältester von mehreren Ständen. Veraltet, sobald einer davon veraltet ist. */
export function oldestFreshness(...values: (Freshness | null | undefined)[]): Freshness | null {
  const known = values.filter((value): value is Freshness => !!value);

  if (known.length === 0) return null;

  return {
    since: Math.min(...known.map((value) => value.since)),
    stale: known.some((value) => value.stale),
  };
}

/** Veralteter Stand aus einer gespeicherten Momentaufnahme, z.B. dem Ich Snapshot. */
export function freshnessFromSavedAt(savedAt: number): Freshness {
  return { since: savedAt, stale: true };
}

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

type Translate = (key: TranslationKey, params?: TranslationParams) => string;

/** "vor 5 Minuten", "vor 2 Stunden", "vor 3 Tagen". */
export function formatAge(t: Translate, since: number) {
  const ageMs = Math.max(0, Date.now() - since);

  if (ageMs < HOUR_MS) {
    const minutes = Math.max(1, Math.round(ageMs / MINUTE_MS));
    return t(minutes === 1 ? 'common.ageMinute' : 'common.ageMinutes', { count: minutes });
  }

  if (ageMs < DAY_MS) {
    const hours = Math.round(ageMs / HOUR_MS);
    return t(hours === 1 ? 'common.ageHour' : 'common.ageHours', { count: hours });
  }

  const days = Math.round(ageMs / DAY_MS);
  return t(days === 1 ? 'common.ageDay' : 'common.ageDays', { count: days });
}
