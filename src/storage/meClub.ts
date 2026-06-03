import AsyncStorage from '@react-native-async-storage/async-storage';

const ME_CLUB_KEY = 'tttracker.meClub';

export type MeClub = {
    organization: string;
    clubNumber: string;
    title?: string;
    clubName?: string;
    state?: string;
    season?: string;
    clubSlug?: string;
};

function clean(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
}

export async function getMeClub(): Promise<MeClub | null> {
    const raw = await AsyncStorage.getItem(ME_CLUB_KEY);

    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw) as Partial<MeClub>;

        const organization = clean(parsed.organization);
        const clubNumber = clean(parsed.clubNumber);

        if (!organization || !clubNumber) {
            return null;
        }

        return {
            organization,
            clubNumber,
            title: clean(parsed.title) || undefined,
            clubName: clean(parsed.clubName) || undefined,
            state: clean(parsed.state) || undefined,
            season: clean(parsed.season) || undefined,
            clubSlug: clean(parsed.clubSlug) || undefined,
        };
    } catch {
        return null;
    }
}

export async function setMeClub(club: MeClub) {
    const organization = clean(club.organization);
    const clubNumber = clean(club.clubNumber);

    if (!organization || !clubNumber) {
        throw new Error('Für diesen Verein fehlen Verband oder Vereinsnummer.');
    }

    const normalized: MeClub = {
        organization,
        clubNumber,
        title: clean(club.title) || undefined,
        clubName: clean(club.clubName) || undefined,
        state: clean(club.state) || undefined,
        season: clean(club.season) || undefined,
        clubSlug: clean(club.clubSlug) || undefined,
    };

    await AsyncStorage.setItem(ME_CLUB_KEY, JSON.stringify(normalized));

    return normalized;
}

export async function clearMeClub() {
    await AsyncStorage.removeItem(ME_CLUB_KEY);
}