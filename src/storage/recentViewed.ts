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

// Vereine werden über Verband und Vereinsnummer erkannt, die rohe id kann je nach Treffer variieren.
function recentIdentity(item: Pick<RecentViewedItem, 'type' | 'id' | 'params'>) {
    if (item.type === 'club') {
        const organization = item.params.organization?.trim();
        const clubNumber = item.params.clubNumber?.trim();

        if (organization && clubNumber) return `club:${organization}:${clubNumber}`;
    }

    return `${item.type}:${item.id}`;
}

function dedupeRecent(items: RecentViewedItem[]) {
    const seen = new Set<string>();

    return items.filter((item) => {
        const key = recentIdentity(item);

        if (seen.has(key)) return false;

        seen.add(key);
        return true;
    });
}

export async function getRecentViewed(): Promise<RecentViewedItem[]> {
    try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : [];

        // Auch bereits gespeicherte Doppelungen verschwinden hier
        return Array.isArray(parsed) ? dedupeRecent(parsed.filter(isRecentItem)) : [];
    } catch {
        return [];
    }
}

export async function addRecentViewed(item: Omit<RecentViewedItem, 'viewedAt'>) {
    try {
        const items = await getRecentViewed();
        const identity = recentIdentity(item);

        const next = [
            { ...item, viewedAt: new Date().toISOString() },
            ...items.filter((candidate) => recentIdentity(candidate) !== identity),
        ].slice(0, MAX_ITEMS);

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        // Der Verlauf ist nur eine Komfortfunktion, Fehler dürfen das Öffnen nicht blockieren.
    }
}

export async function clearRecentViewed() {
    await AsyncStorage.removeItem(STORAGE_KEY);
}
