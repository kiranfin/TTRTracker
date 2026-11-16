import AsyncStorage from '@react-native-async-storage/async-storage';

const ME_PLAYER_NUID_KEY = 'tttracker.mePlayerNuid';

export function normalizeMePlayerNuid(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
}

export async function getMePlayerNuid() {
    const stored = await AsyncStorage.getItem(ME_PLAYER_NUID_KEY);
    const normalized = normalizeMePlayerNuid(stored);

    return normalized.length > 0 ? normalized : null;
}

export async function setMePlayerNuid(nuid: string) {
    const normalized = normalizeMePlayerNuid(nuid);

    if (!normalized) {
        throw new Error('Bitte gib eine gültige NUID ein.');
    }

    await AsyncStorage.setItem(ME_PLAYER_NUID_KEY, normalized);
    return normalized;
}

export async function clearMePlayerNuid() {
    await AsyncStorage.removeItem(ME_PLAYER_NUID_KEY);
    await AsyncStorage.removeItem('tttracker.mePlayerName');
}

const ME_PLAYER_NAME_KEY = 'tttracker.mePlayerName';

// Anzeigename zum gespeicherten Profil, damit Einstellungen und Start ohne Request den Namen zeigen.
export async function getMePlayerName() {
    const stored = await AsyncStorage.getItem(ME_PLAYER_NAME_KEY);
    return stored && stored.trim() ? stored.trim() : null;
}

export async function setMePlayerName(name?: string | null) {
    const trimmed = name?.trim();

    if (trimmed) {
        await AsyncStorage.setItem(ME_PLAYER_NAME_KEY, trimmed);
    } else {
        await AsyncStorage.removeItem(ME_PLAYER_NAME_KEY);
    }
}
