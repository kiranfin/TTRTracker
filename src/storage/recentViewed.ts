import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'tttracker.recentViewed';
const MAX_ITEMS = 10;

export type RecentViewedType = 'player' | 'club';

export type RecentViewedItem = {
    type: RecentViewedType;
    id: string;
    title: string;
    subtitle?: string;
    // Route-Parameter, mit denen das Profil bzw. der Verein wieder geöffnet wird
    params: Record<string, string>;
    viewedAt: string;
};

function isRecentItem(value: unknown): value is RecentViewedItem {
    if (!value || typeof value !== 'object') return false;

    const item = value as Partial<RecentViewedItem>;

    return (
        (item.type === 'player' || item.type === 'club') &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.params === 'object' &&
        item.params !== null
    );
}

export async function getRecentViewed(): Promise<RecentViewedItem[]> {
    try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : [];

        return Array.isArray(parsed) ? parsed.filter(isRecentItem) : [];
    } catch {
        return [];
    }
}

export async function addRecentViewed(item: Omit<RecentViewedItem, 'viewedAt'>) {
    try {
        const items = await getRecentViewed();

        const next = [
            { ...item, viewedAt: new Date().toISOString() },
            ...items.filter((candidate) => !(candidate.type === item.type && candidate.id === item.id)),
        ].slice(0, MAX_ITEMS);

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        // Der Verlauf ist nur eine Komfortfunktion, Fehler dürfen das Öffnen nicht blockieren.
    }
}

export async function clearRecentViewed() {
    await AsyncStorage.removeItem(STORAGE_KEY);
}
