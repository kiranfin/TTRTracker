import AsyncStorage from '@react-native-async-storage/async-storage';
import { ttApi } from '../api/tttracker';

// Vereinslogos pro "VERBAND:VEREINSNUMMER". Die Suche liefert keine Logos mit, deshalb sammelt der Speicher
// alle angefragten Vereine eines Render-Durchgangs und holt sie gebündelt über /api/clubs/logos.
// null heißt "Verein hat kein Logo" und wird genauso gemerkt, damit nicht ständig neu gefragt wird.

const STORAGE_KEY = 'tttracker.clubLogos';
const LOGO_BASE_URL = 'https://ttde-portal.liga.nu/rs/2014/images/';
const TTL_MS = 14 * 24 * 60 * 60 * 1000;
const RETRY_AFTER_MS = 5 * 60 * 1000;
const BATCH_DELAY_MS = 40;
const BATCH_SIZE = 30;

type LogoEntry = { url: string | null; savedAt: number };

const entries = new Map<string, LogoEntry>();
const listeners = new Set<() => void>();
const queued = new Set<string>();
const inFlight = new Set<string>();
const failedAt = new Map<string, number>();

let loadPromise: Promise<void> | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

// Logo ID von click-tt (z. B. home_image_url im Spielbericht) zur Bild URL, gleiche Größe wie im Backend.
export function buildClubLogoUrl(logoId?: string | null) {
  const id = logoId?.trim();
  if (!id) return undefined;
  if (/^https?:\/\//i.test(id)) return id;

  return `${LOGO_BASE_URL}${encodeURIComponent(id)}?pixelHeight=160&onlyScaleSmaller=true&quality=0.9`;
}

export function clubLogoRef(organization?: string, clubNumber?: string) {
  const org = organization?.trim().toUpperCase();
  const number = clubNumber?.trim();

  return org && number && /^\d+$/.test(number) ? `${org}:${number}` : undefined;
}

function notify() {
  listeners.forEach((listener) => listener());
}

function isFresh(entry: LogoEntry | undefined) {
  return Boolean(entry) && Date.now() - entry!.savedAt < TTL_MS;
}

function loadStored() {
  loadPromise ??= AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;

        const parsed = JSON.parse(raw) as Record<string, LogoEntry>;

        Object.entries(parsed).forEach(([ref, entry]) => {
          if (!entries.has(ref) && entry && typeof entry.savedAt === 'number') {
            entries.set(ref, { url: typeof entry.url === 'string' ? entry.url : null, savedAt: entry.savedAt });
          }
        });

        notify();
      })
      .catch(() => undefined);

  return loadPromise;
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
    const fresh = Object.fromEntries([...entries].filter(([, entry]) => isFresh(entry)));
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh)).catch(() => undefined);
  }, 500);
}

export function subscribeClubLogos(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// undefined: noch unbekannt, null: Verein hat kein Logo
export function getCachedClubLogo(ref: string) {
  return entries.get(ref)?.url;
}

export function rememberClubLogo(ref: string, url: string | null) {
  const current = entries.get(ref);
  if (current && current.url === url && isFresh(current)) return;

  entries.set(ref, { url, savedAt: Date.now() });
  notify();
  scheduleSave();
}

async function flush() {
  flushTimer = null;
  await loadStored();

  const refs = [...queued].filter((ref) => !isFresh(entries.get(ref)));
  queued.clear();

  for (let index = 0; index < refs.length; index += BATCH_SIZE) {
    const chunk = refs.slice(index, index + BATCH_SIZE);
    chunk.forEach((ref) => inFlight.add(ref));

    try {
      const response = (await ttApi.getClubLogos(chunk)) as { data?: Record<string, string | null> };
      const data = response?.data ?? {};

      chunk.forEach((ref) => {
        if (ref in data) {
          rememberClubLogo(ref, typeof data[ref] === 'string' ? data[ref] : null);
        } else {
          failedAt.set(ref, Date.now());
        }
      });
    } catch {
      chunk.forEach((ref) => failedAt.set(ref, Date.now()));
    } finally {
      chunk.forEach((ref) => inFlight.delete(ref));
    }
  }
}

// Fordert das Logo an, falls es nicht frisch im Speicher liegt. Mehrere Aufrufe kurz hintereinander landen in einer Anfrage.
export function requestClubLogo(ref: string) {
  if (isFresh(entries.get(ref)) || inFlight.has(ref) || queued.has(ref)) return;

  const lastFailure = failedAt.get(ref);
  if (lastFailure && Date.now() - lastFailure < RETRY_AFTER_MS) return;

  queued.add(ref);
  flushTimer ??= setTimeout(() => {
    flush().catch(() => undefined);
  }, BATCH_DELAY_MS);
}

loadStored().catch(() => undefined);
