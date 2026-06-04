import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FavoriteItem, FavoriteType } from '../types/tttracker';

const STORAGE_KEY = 'tttracker.favorites';

type FavoriteWithLooseFields = FavoriteItem & {
  organization?: string;
  organizationName?: string;
  clubNumber?: string;
  clubName?: string;
  state?: string;
  season?: string;
  clubSlug?: string;
  params?: Record<string, any>;
};

export async function getFavorites(): Promise<FavoriteItem[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalized = dedupeFavorites(parsed as FavoriteItem[]);

    if (JSON.stringify(normalized) !== JSON.stringify(parsed)) {
      await setFavorites(normalized);
    }

    return normalized;
  } catch {
    return [];
  }
}

export async function setFavorites(items: FavoriteItem[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function isFavorite(type: FavoriteType, id: string) {
  const items = await getFavorites();
  const lookupIds = getFavoriteLookupIds({ type, id } as FavoriteItem);

  return items.some((item) => {
    if (item.type !== type) return false;

    return setsOverlap(getFavoriteLookupIds(item), lookupIds);
  });
}

export async function addFavorite(item: Omit<FavoriteItem, 'createdAt'>) {
  const items = await getFavorites();

  const normalizedItem = normalizeFavoriteItem({
    ...item,
    createdAt: new Date().toISOString(),
  } as FavoriteItem);

  const lookupIds = getFavoriteLookupIds(normalizedItem);

  const next = [
    normalizedItem,
    ...items.filter((candidate) => {
      if (candidate.type !== normalizedItem.type) return true;

      return !setsOverlap(getFavoriteLookupIds(candidate), lookupIds);
    }),
  ];

  await setFavorites(next);
}

export async function removeFavorite(type: FavoriteType, id: string) {
  const items = await getFavorites();
  const lookupIds = getFavoriteLookupIds({ type, id } as FavoriteItem);

  await setFavorites(
      items.filter((item) => {
        if (item.type !== type) return true;

        return !setsOverlap(getFavoriteLookupIds(item), lookupIds);
      }),
  );
}

export function favoriteKey(type: FavoriteType, id: string) {
  return `${type}:${id}`;
}

function dedupeFavorites(items: FavoriteItem[]) {
  const result: FavoriteItem[] = [];
  const seenKeys = new Set<string>();

  for (const item of items) {
    const normalized = normalizeFavoriteItem(item);
    const dedupeKey = getFavoriteDedupeKey(normalized);

    if (seenKeys.has(dedupeKey)) {
      continue;
    }

    seenKeys.add(dedupeKey);
    result.push(normalized);
  }

  return result;
}

function normalizeFavoriteItem(item: FavoriteItem): FavoriteItem {
  if (item.type !== 'club') {
    return item;
  }

  const loose = item as FavoriteWithLooseFields;

  const parsedFromId = parseClubFavoriteId(item.id);

  const organization =
      emptyToUndefined(loose.params?.organization) ??
      emptyToUndefined(loose.organization) ??
      parsedFromId.organization;

  const clubNumber =
      emptyToUndefined(loose.params?.clubNumber) ??
      emptyToUndefined(loose.clubNumber) ??
      parsedFromId.clubNumber;

  const canonicalId =
      organization && clubNumber
          ? `${organization}:${clubNumber}`
          : item.id;

  return {
    ...loose,
    id: canonicalId,
    organization,
    clubNumber,
    params: {
      ...(loose.params ?? {}),
      organization: organization ?? loose.params?.organization ?? '',
      organizationName: loose.params?.organizationName ?? loose.organizationName ?? '',
      clubNumber: clubNumber ?? loose.params?.clubNumber ?? '',
      clubName: loose.params?.clubName ?? loose.clubName ?? '',
      state: loose.params?.state ?? loose.state ?? '',
      season: loose.params?.season ?? loose.season ?? '',
      clubSlug: loose.params?.clubSlug ?? loose.clubSlug ?? 'x',
    },
  } as FavoriteItem;
}

function getFavoriteDedupeKey(item: FavoriteItem) {
  if (item.type !== 'club') {
    return `${item.type}:${item.id}`;
  }

  const ids = [...getFavoriteLookupIds(item)].sort();

  return `${item.type}:${ids[0] ?? item.id}`;
}

function getFavoriteLookupIds(item: FavoriteItem) {
  const ids = new Set<string>();
  const rawId = emptyToUndefined(item.id);

  if (rawId) {
    ids.add(rawId);
  }

  if (item.type !== 'club') {
    return ids;
  }

  const loose = item as FavoriteWithLooseFields;
  const parsedFromId = parseClubFavoriteId(item.id);

  const organization =
      emptyToUndefined(loose.params?.organization) ??
      emptyToUndefined(loose.organization) ??
      parsedFromId.organization;

  const clubNumber =
      emptyToUndefined(loose.params?.clubNumber) ??
      emptyToUndefined(loose.clubNumber) ??
      parsedFromId.clubNumber;

  if (organization && clubNumber) {
    ids.add(`${organization}:${clubNumber}`);
  }

  if (clubNumber) {
    ids.add(clubNumber);
  }

  return ids;
}

function parseClubFavoriteId(value?: string) {
  const raw = emptyToUndefined(value);

  if (!raw) {
    return {} as { organization?: string; clubNumber?: string };
  }

  const parts = raw.split(':');

  if (parts.length >= 2) {
    return {
      organization: emptyToUndefined(parts[0]),
      clubNumber: emptyToUndefined(parts[1]),
    };
  }

  return {
    clubNumber: raw,
  };
}

function setsOverlap(left: Set<string>, right: Set<string>) {
  for (const value of left) {
    if (right.has(value)) {
      return true;
    }
  }

  return false;
}

function emptyToUndefined(value?: unknown) {
  const raw = String(value ?? '').trim();
  return raw.length > 0 ? raw : undefined;
}