import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ttApi } from '../../src/api/tttracker';
import { ActionButton } from '../../src/components/ActionButton';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { isFavorite, saveFavorite } from '../../src/storage/favorites';
import { AppTheme, useTheme } from '../../src/theme/ThemeProvider';

type Tab = 'table' | 'schedule';
type Filter = 'gesamt' | 'vr' | 'rr';

type Styles = {
    loading: ViewStyle;
    list: ViewStyle;
    headline: TextStyle;
    segment: ViewStyle;
    segmentButton: ViewStyle;
    segmentButtonActive: ViewStyle;
    segmentText: TextStyle;
    segmentTextActive: TextStyle;
    filterRow: ViewStyle;
    filterButton: ViewStyle;
    filterButtonActive: ViewStyle;
    filterText: TextStyle;
    filterTextActive: TextStyle;
};

function param(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function findRows(value: unknown): any[] {
    const root = value as any;

    if (Array.isArray(root)) return root;
    if (Array.isArray(root?.data)) return root.data;
    if (Array.isArray(root?.data?.data)) return root.data.data;
    if (Array.isArray(root?.table)) return root.table;
    if (Array.isArray(root?.data?.table)) return root.data.table;
    if (Array.isArray(root?.schedule)) return root.schedule;
    if (Array.isArray(root?.data?.schedule)) return root.data.schedule;
    if (Array.isArray(root?.meetings)) return root.meetings;
    if (Array.isArray(root?.data?.meetings)) return root.data.meetings;
    if (Array.isArray(root?.rows)) return root.rows;
    if (Array.isArray(root?.items)) return root.items;

    return [];
}

function text(value: unknown) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
}

function pick(row: any, keys: string[]) {
    for (const key of keys) {
        const value = text(row?.[key]);
        if (value) return value;
    }

    return '';
}

function getTableName(row: any, index: number) {
    return (
        pick(row, ['team_name', 'teamName', 'team', 'name', 'club_name', 'clubName']) ||
        `Team ${index + 1}`
    );
}

function getMatchTitle(row: any) {
    const home = pick(row, [
        'home_team_name',
        'homeTeamName',
        'home_team',
        'homeTeam',
        'team_home',
        'teamHome',
    ]);

    const away = pick(row, [
        'guest_team_name',
        'away_team_name',
        'awayTeamName',
        'guestTeamName',
        'away_team',
        'guest_team',
        'awayTeam',
        'guestTeam',
        'team_away',
        'teamAway',
    ]);

    if (home || away) return `${home || 'Heim'} – ${away || 'Gast'}`;

    return pick(row, ['name', 'title', 'meeting_name']) || 'Begegnung';
}

function getMatchDate(row: any) {
    const date = pick(row, [
        'date',
        'match_date',
        'meeting_date',
        'scheduled_date',
        'datetime',
        'start_time',
    ]);

    const time = pick(row, ['time', 'match_time', 'meeting_time']);

    return [date, time].filter(Boolean).join(' · ');
}

function getMatchResult(row: any) {
    return (
        pick(row, [
            'result',
            'score',
            'match_result',
            'meeting_result',
            'sets',
            'games',
        ]) || undefined
    );
}

export default function LeagueDetailScreen() {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const params = useLocalSearchParams<{
        id: string;
        title?: string;
        subtitle?: string;
        association?: string;
        season?: string;
        groupId?: string;
        leagueSlug?: string;
    }>();

    const id = param(params.id);
    const title = param(params.title) || 'Liga';
    const subtitle = param(params.subtitle);
    const association = param(params.association);
    const season = param(params.season);
    const groupId = param(params.groupId) || id;
    const leagueSlug = param(params.leagueSlug) || 'x';

    const [saved, setSaved] = useState(false);
    const [tab, setTab] = useState<Tab>('table');
    const [filter, setFilter] = useState<Filter>('gesamt');

    const [tableRows, setTableRows] = useState<any[]>([]);
    const [scheduleRows, setScheduleRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        isFavorite('league', id).then(setSaved);
    }, [id]);

    useEffect(() => {
        async function load() {
            if (!association || !groupId) {
                setMessage('Liga-Daten fehlen.');
                return;
            }

            setLoading(true);
            setMessage('');

            try {
                if (tab === 'table') {
                    const response = await ttApi.getLeagueTable(association, groupId);
                    const rows = findRows(response);
                    setTableRows(rows);
                    setMessage(rows.length === 0 ? 'Keine Tabelle gefunden.' : '');
                } else {
                    if (!season) {
                        setMessage('Saison fehlt.');
                        return;
                    }

                    const response = await ttApi.getLeagueSchedule(
                        association,
                        season,
                        groupId,
                        leagueSlug,
                        filter
                    );

                    const rows = findRows(response);
                    setScheduleRows(rows);
                    setMessage(rows.length === 0 ? 'Keine Spiele gefunden.' : '');
                }
            } catch (error) {
                setMessage(error instanceof Error ? error.message : 'Laden fehlgeschlagen.');
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [association, groupId, season, leagueSlug, tab, filter]);

    async function addFavorite() {
        await saveFavorite({
            id,
            type: 'league',
            title,
            subtitle,
            params: {
                id,
                title,
                subtitle,
                association,
                season,
                groupId,
                leagueSlug,
            },
        });

        setSaved(true);
    }

    function openMeeting(row: any) {
        const meetingId = pick(row, [
            'meeting_id',
            'meetingId',
            'match_id',
            'matchId',
            'id',
        ]);

        if (!meetingId) return;

        router.push({
            pathname: '/match/[id]',
            params: {
                id: meetingId,
                title: getMatchTitle(row),
            },
        } as any);
    }

    return (
        <Screen title={title}>
            <Card title="Liga" subtitle={subtitle || season || groupId} meta={association} />

            <ActionButton
                label={saved ? 'Gespeichert' : 'Als Favorit speichern'}
                onPress={addFavorite}
                disabled={saved}
            />

            <View style={styles.segment}>
                <Pressable
                    style={[styles.segmentButton, tab === 'table' && styles.segmentButtonActive]}
                    onPress={() => setTab('table')}
                >
                    <Text style={[styles.segmentText, tab === 'table' && styles.segmentTextActive]}>
                        Tabelle
                    </Text>
                </Pressable>

                <Pressable
                    style={[styles.segmentButton, tab === 'schedule' && styles.segmentButtonActive]}
                    onPress={() => setTab('schedule')}
                >
                    <Text style={[styles.segmentText, tab === 'schedule' && styles.segmentTextActive]}>
                        Spielplan
                    </Text>
                </Pressable>
            </View>

            {tab === 'schedule' ? (
                <View style={styles.filterRow}>
                    {(['gesamt', 'vr', 'rr'] as Filter[]).map((item) => (
                        <Pressable
                            key={item}
                            style={[styles.filterButton, filter === item && styles.filterButtonActive]}
                            onPress={() => setFilter(item)}
                        >
                            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                                {item === 'gesamt' ? 'Alle' : item.toUpperCase()}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            ) : null}

            {loading ? (
                <View style={styles.loading}>
                    <ActivityIndicator color={theme.colors.accent} />
                </View>
            ) : null}

            {!loading && message ? <Card title={message} /> : null}

            {!loading && tab === 'table' && tableRows.length > 0 ? (
                <View style={styles.list}>
                    <Text style={styles.headline}>Tabelle</Text>

                    {tableRows.map((row, index) => {
                        const rank =
                            pick(row, ['table_rank', 'rank', 'position', 'platz']) ||
                            String(index + 1);

                        const name = getTableName(row, index);

                        const won = pick(row, ['points_won', 'won', 'punkte_plus']);
                        const lost = pick(row, ['points_lost', 'lost', 'punkte_minus']);
                        const points =
                            pick(row, ['points', 'punkte', 'score']) ||
                            (won || lost ? `${won}:${lost}` : '');

                        return (
                            <Card
                                key={`${rank}-${name}-${index}`}
                                title={`${rank}. ${name}`}
                                subtitle={points ? `${points} Punkte` : undefined}
                            />
                        );
                    })}
                </View>
            ) : null}

            {!loading && tab === 'schedule' && scheduleRows.length > 0 ? (
                <View style={styles.list}>
                    <Text style={styles.headline}>Spielplan</Text>

                    {scheduleRows.map((row, index) => {
                        const result = getMatchResult(row);
                        const title = getMatchTitle(row);
                        const date = getMatchDate(row);

                        return (
                            <Card
                                key={`${title}-${index}`}
                                title={title}
                                subtitle={date || undefined}
                                meta={result}
                                onPress={() => openMeeting(row)}
                            />
                        );
                    })}
                </View>
            ) : null}
        </Screen>
    );
}

function createStyles(theme: AppTheme) {
    return StyleSheet.create<Styles>({
        loading: {
            paddingVertical: 20,
            alignItems: 'center',
        },
        list: {
            gap: 12,
        },
        headline: {
            color: theme.colors.text,
            fontSize: 20,
            fontWeight: '900',
            letterSpacing: -0.4,
        },
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
        },
        segmentTextActive: {
            color: theme.colors.accentText,
        },
        filterRow: {
            flexDirection: 'row',
            gap: 8,
        },
        filterButton: {
            flex: 1,
            backgroundColor: theme.colors.surface,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: theme.colors.border,
            paddingVertical: 10,
            alignItems: 'center',
        },
        filterButtonActive: {
            backgroundColor: theme.colors.accentSoft,
        },
        filterText: {
            color: theme.colors.muted,
            fontWeight: '900',
        },
        filterTextActive: {
            color: theme.colors.accent,
        },
    });
}