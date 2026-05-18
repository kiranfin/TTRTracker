import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { ttApi } from '../../src/api/tttracker';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { useTheme } from '../../src/theme/ThemeProvider';
import type {
    ClubSearchResult,
    PlayerSearchResult,
    SearchCategory,
} from '../../src/types/tttracker';

type ResultItem = {
    id: string;
    title: string;
    subtitle?: string;
    meta?: string;
    organization?: string;
    clubNumber?: string;
};

const categories: { key: SearchCategory; label: string; placeholder: string }[] = [
    {
        key: 'players',
        label: 'Spieler',
        placeholder: 'Name suchen',
    },
    {
        key: 'clubs',
        label: 'Vereine',
        placeholder: 'Verein suchen',
    },
];

function deepPickString(value: unknown, keys: string[], depth = 0): string {
    if (depth > 4 || !value || typeof value !== 'object') return '';

    const record = value as Record<string, unknown>;

    for (const key of keys) {
        const direct = record[key];

        if (typeof direct === 'string' && direct.trim()) {
            return direct.trim();
        }

        if (typeof direct === 'number') {
            return String(direct);
        }
    }

    for (const nested of Object.values(record)) {
        if (nested && typeof nested === 'object') {
            const found = deepPickString(nested, keys, depth + 1);
            if (found) return found;
        }
    }

    return '';
}

function deepPickNumber(value: unknown, keys: string[]): number | undefined {
    const raw = deepPickString(value, keys);
    if (!raw) return undefined;

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function mapPlayers(players: PlayerSearchResult[]): ResultItem[] {
    return players.map((player, index) => {
        const firstName = deepPickString(player, [
            'firstname',
            'firstName',
            'first_name',
            'vorname',
        ]);

        const lastName = deepPickString(player, [
            'lastname',
            'lastName',
            'last_name',
            'nachname',
        ]);

        const name =
            deepPickString(player, [
                'name',
                'fullName',
                'full_name',
                'displayName',
                'display_name',
                'player_name',
                'person_name',
                'label',
            ]) ||
            [firstName, lastName].filter(Boolean).join(' ') ||
            'Unbekannter Spieler';

        const club =
            deepPickString(player, [
                'clubName',
                'club_name',
                'club',
                'verein',
                'clubLabel',
                'club_label',
            ]) || undefined;

        const ageGroup =
            deepPickString(player, [
                'ageGroup',
                'age_group',
                'class',
                'klasse',
                'category',
            ]) || undefined;

        const ttr = deepPickNumber(player, [
            'ttr',
            'qttr',
            'rating',
            'punkte',
        ]);

        const id =
            deepPickString(player, [
                'id',
                'playerId',
                'player_id',
                'personId',
                'person_id',
                'clickttId',
                'clicktt_id',
                'nr',
            ]) || `${name}-${index}`;

        return {
            id,
            title: name,
            subtitle: [club, ageGroup].filter(Boolean).join(' · ') || undefined,
            meta: ttr ? `TTR ${ttr}` : 'Spieler',
        };
    });
}

function mapClubs(clubs: ClubSearchResult[]): ResultItem[] {
    return clubs.map((club, index) => {
        const name =
            deepPickString(club, [
                'name',
                'clubName',
                'club_name',
                'clubname',
                'club',
                'verein',
                'verein_name',
                'vereinsname',
                'displayName',
                'display_name',
                'label',
                'title',
            ]) || 'Unbekannter Verein';

        const city =
            deepPickString(club, [
                'city',
                'ort',
                'location',
                'district',
                'city_name',
                'place',
            ]) || undefined;

        const organization =
            deepPickString(club, [
                'organization',
                'organisation',
                'org',
                'association',
                'verband',
                'team_organisation_short',
                'club_organisation_short',
                'organisation_short',
                'organization_short',
                'association_short',
            ]) || undefined;

        const clubNumber =
            deepPickString(club, [
                'clubNumber',
                'club_number',
                'club_no',
                'clubNo',
                'club_nr',
                'clubnr',
                'number',
                'nr',
                'clubId',
                'club_id',
                'id',
                'vereinsnummer',
            ]) || undefined;

        const id =
            [organization, clubNumber].filter(Boolean).join(':') ||
            deepPickString(club, ['id', 'clubId', 'club_id', 'clubNumber', 'club_number']) ||
            `${name}-${index}`;

        return {
            id,
            title: name,
            subtitle: [city, organization].filter(Boolean).join(' · ') || undefined,
            meta: 'Verein',
            organization,
            clubNumber,
        };
    });
}

export default function SearchScreen() {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const [category, setCategory] = useState<SearchCategory>('players');
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ResultItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const activeCategory = categories.find((item) => item.key === category) ?? categories[0];

    async function runSearch() {
        const trimmed = query.trim();

        if (trimmed.length < 3) {
            setResults([]);
            setMessage('Mindestens 3 Zeichen.');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            if (category === 'players') {
                const players = await ttApi.searchPlayers(trimmed);
                const mapped = mapPlayers(players);

                setResults(mapped);
                setMessage(mapped.length === 0 ? 'Keine Treffer.' : '');
            }

            if (category === 'clubs') {
                const clubs = await ttApi.searchClubs(trimmed);
                const mapped = mapClubs(clubs);

                setResults(mapped);
                setMessage(mapped.length === 0 ? 'Keine Treffer.' : '');
            }
        } catch (error) {
            setResults([]);
            setMessage(error instanceof Error ? error.message : 'Suche fehlgeschlagen.');
        } finally {
            setLoading(false);
        }
    }

    function openResult(item: ResultItem) {
        if (category === 'players') {
            router.push({
                pathname: '/player/[id]',
                params: {
                    id: item.id,
                    title: item.title,
                    subtitle: item.subtitle ?? '',
                    meta: item.meta ?? '',
                },
            } as any);
            return;
        }

        router.push({
            pathname: '/club/[id]',
            params: {
                id: item.id,
                title: item.title,
                subtitle: item.subtitle ?? '',
                organization: item.organization ?? '',
                clubNumber: item.clubNumber ?? '',
            },
        } as any);
    }

    function changeCategory(nextCategory: SearchCategory) {
        setCategory(nextCategory);
        setResults([]);
        setMessage('');
    }

    return (
        <Screen title="Suche">
            <View style={styles.segment}>
                {categories.map((item) => {
                    const active = item.key === category;

                    return (
                        <Pressable
                            key={item.key}
                            style={[styles.segmentButton, active && styles.segmentButtonActive]}
                            onPress={() => changeCategory(item.key)}
                        >
                            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                                {item.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <View style={styles.searchBox}>
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder={activeCategory.placeholder}
                    placeholderTextColor={theme.colors.muted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                    onSubmitEditing={runSearch}
                    style={styles.input}
                />

                <Pressable style={styles.searchButton} onPress={runSearch} disabled={loading}>
                    <Text style={styles.searchButtonText}>Suchen</Text>
                </Pressable>
            </View>

            {loading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator color={theme.colors.accent} />
                </View>
            ) : null}

            {!loading && message ? <Card title={message} /> : null}

            {!loading && results.length > 0 ? (
                <View style={styles.results}>
                    {results.map((item) => (
                        <Card
                            key={`${category}:${item.id}`}
                            title={item.title}
                            subtitle={item.subtitle}
                            meta={item.meta}
                            onPress={() => openResult(item)}
                        />
                    ))}
                </View>
            ) : null}
        </Screen>
    );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
    return StyleSheet.create({
        segment: {
            flexDirection: 'row',
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.xl,
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: 4,
            gap: 4,
        },
        segmentButton: {
            flex: 1,
            paddingVertical: 12,
            borderRadius: 999,
            alignItems: 'center',
        },
        segmentButtonActive: {
            backgroundColor: theme.colors.accent,
        },
        segmentText: {
            color: theme.colors.muted,
            fontWeight: '900',
            fontSize: 14,
        },
        segmentTextActive: {
            color: theme.colors.accentText,
        },
        searchBox: {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.xl,
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: 10,
            gap: 10,
        },
        input: {
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: theme.radius.lg,
            paddingHorizontal: 15,
            paddingVertical: 14,
            fontSize: 16,
            color: theme.colors.text,
        },
        searchButton: {
            backgroundColor: theme.colors.accent,
            paddingVertical: 14,
            borderRadius: theme.radius.lg,
            alignItems: 'center',
        },
        searchButtonText: {
            color: theme.colors.accentText,
            fontWeight: '900',
            fontSize: 15,
        },
        loadingBox: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 24,
        },
        results: {
            gap: 12,
        },
    });
}