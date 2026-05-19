import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FavoriteItem, FavoriteType } from '../types/tttracker';

const STORAGE_KEY = 'tttracker.favorites';

export async function getFavorites(): Promise<FavoriteItem[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function setFavorites(items: FavoriteItem[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function isFavorite(type: FavoriteType, id: string) {
  const items = await getFavorites();
  return items.some((item) => item.type === type && item.id === id);
}

export async function addFavorite(item: Omit<FavoriteItem, 'createdAt'>) {
  const items = await getFavorites();
  if (items.some((candidate) => candidate.type === item.type && candidate.id === item.id)) return;

  const next = [
    {
      ...item,
      createdAt: new Date().toISOString(),
    },
    ...items,
  ];

  await setFavorites(next);
}

export async function removeFavorite(type: FavoriteType, id: string) {
  const items = await getFavorites();
  await setFavorites(items.filter((item) => !(item.type === type && item.id === id)));
}

export function favoriteKey(type: FavoriteType, id: string) {
  return `${type}:${id}`;
}
