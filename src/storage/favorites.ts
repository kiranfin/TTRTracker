import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FavoriteItem, FavoriteType } from '../types/tttracker';

const STORAGE_KEY = 'tttracker:favorites';

export async function getFavorites(): Promise<FavoriteItem[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export async function saveFavorite(item: Omit<FavoriteItem, 'createdAt'>) {
    const favorites = await getFavorites();

    const withoutDuplicate = favorites.filter(
        (favorite) => !(favorite.type === item.type && favorite.id === item.id)
    );

    const next: FavoriteItem[] = [
        {
            ...item,
            createdAt: new Date().toISOString(),
        },
        ...withoutDuplicate,
    ];

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
}

export async function removeFavorite(type: FavoriteType, id: string) {
    const favorites = await getFavorites();
    const next = favorites.filter((favorite) => !(favorite.type === type && favorite.id === id));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
}

export async function isFavorite(type: FavoriteType, id: string) {
    const favorites = await getFavorites();
    return favorites.some((favorite) => favorite.type === type && favorite.id === id);
}