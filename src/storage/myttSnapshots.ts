import AsyncStorage from '@react-native-async-storage/async-storage';

// Letzter erfolgreich vom Gerät geholter Stand der myTischtennis Login Daten (aktueller TTR, Verlauf),
// pro Spieler. Bremst myTischtennis oder fehlt das Netz, zeigt die App diesen Stand mit Hinweis statt eines
// Fehlers. Die Daten liegen nur auf dem Gerät. Sie werden beim Trennen der Verbindung gelöscht.

const STORAGE_KEY = 'tttracker.myttSnapshots';
const MAX_ENTRIES = 40;

export type SnapshotKind = 'ttr' | 'history';

export type StoredSnapshot<T = unknown> = {
  kind: SnapshotKind;
  nuid: string;
  // Stand der Daten (wann myTischtennis sie geliefert hat).
  savedAt: number;
  // Wann die App sie zuletzt von myTischtennis geholt hat.
  checkedAt: number;
  response: T;
};

type SnapshotMap = Record<string, StoredSnapshot>;

// So lange gilt ein geholter Stand als frisch: Tab Wechsel und App Start fragen nicht erneut an.
export const SNAPSHOT_FRESH_MS = 15 * 60 * 1000;

let memory: SnapshotMap | null = null;

function keyOf(kind: SnapshotKind, nuid: string) {
  return `${kind}:${nuid.trim().toUpperCase()}`;
}

async function load(): Promise<SnapshotMap> {
  if (memory) return memory;

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as SnapshotMap) : {};

    memory = parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    memory = {};
  }

  return memory;
}

async function persist(map: SnapshotMap) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ein Speicherfehler lässt nie eine Anfrage scheitern, der Stand bleibt im Arbeitsspeicher.
  }
}

export async function getSnapshot<T = unknown>(kind: SnapshotKind, nuid: string): Promise<StoredSnapshot<T> | null> {
  const map = await load();
  const entry = map[keyOf(kind, nuid)];

  return entry && typeof entry.savedAt === 'number' && entry.response ? (entry as StoredSnapshot<T>) : null;
}

export function isSnapshotFresh(snapshot: StoredSnapshot, now = Date.now()) {
  return typeof snapshot.checkedAt === 'number' && now - snapshot.checkedAt < SNAPSHOT_FRESH_MS;
}

// `raw` (die rohe Antwort für den Upload) wird nie gespeichert.
function withoutRaw<T>(response: T): T {
  if (!response || typeof response !== 'object') return response;

  const { raw: _raw, ...rest } = response as Record<string, unknown>;

  return rest as T;
}

// savedAt ist der Stand der Daten, nicht der Zeitpunkt des Speicherns.
export async function saveSnapshot(kind: SnapshotKind, nuid: string, response: unknown, savedAt: number) {
  const map = await load();

  map[keyOf(kind, nuid)] = {
    kind,
    nuid: nuid.trim().toUpperCase(),
    savedAt,
    checkedAt: Date.now(),
    response: withoutRaw(response),
  };

  const keys = Object.keys(map);

  if (keys.length > MAX_ENTRIES) {
    keys
        .sort((left, right) => map[left]!.checkedAt - map[right]!.checkedAt)
        .slice(0, keys.length - MAX_ENTRIES)
        .forEach((key) => delete map[key]);
  }

  await persist(map);
}

/** Löscht alle Stände, z.B. beim Trennen der myTischtennis Verbindung. */
export async function clearSnapshots() {
  memory = {};

  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nichts mehr zu retten.
  }
}

/** Die Antwort mit dem Hinweis, dass sie aus dem letzten bekannten Stand kommt. */
export function toStaleResponse<T>(snapshot: StoredSnapshot<T>): T {
  const response = snapshot.response as Record<string, unknown>;
  const meta = (response.meta as Record<string, unknown> | undefined) ?? {};

  return {
    ...response,
    meta: { ...meta, source: 'stale', fetchedAt: new Date(snapshot.savedAt).toISOString() },
  } as T;
}
