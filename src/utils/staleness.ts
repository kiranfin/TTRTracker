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
