import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { ttApi } from '../../../src/api/tttracker';
import { Badge } from '../../../src/components/Badge';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { Screen } from '../../../src/components/Screen';
import { SegmentedTabs } from '../../../src/components/SegmentedTabs';
import { addFavorite, favoriteKey, getFavorites, removeFavorite } from '../../../src/storage/favorites';
import { useTheme } from '../../../src/theme/ThemeProvider';
import type { ScheduleMatch, TableRow } from '../../../src/types/tttracker';
import {
    formatDate,
    matchStatusLabel,
    normalizeSchedule,
    normalizeTable,
} from '../../../src/utils/normalizers';

type DetailTab = 'table' | 'matches';
type SchedulePeriodFilter = 'all' | 'past30' | 'next30';
type ScheduleRound = 'vr' | 'rr';
type RoundFilter = 'all' | ScheduleRound;
type EnrichedScheduleMatch = ScheduleMatch & {
    scheduleRound: ScheduleRound;
};

type TeamScheduleStats = {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    tablePointsWon: number;
    tablePointsLost: number;
    matchesWon: number;
    matchesLost: number;
};

type RichTableRow = TableRow & Record<string, unknown>;

type LeagueInfo = {
    title: string;
    association?: string;
    groupId?: string;
    season: string;
    leagueSlug: string;
    favoriteId: string;
};

const periodOptions: { value: SchedulePeriodFilter; label: string }[] = [
    { value: 'all', label: 'Alle' },
    { value: 'past30', label: 'Letzte 30 Tage' },
    { value: 'next30', label: 'Nächste 30 Tage' },
];

const roundOptions: { value: RoundFilter; label: string }[] = [
    { value: 'all', label: 'Alle' },
    { value: 'vr', label: 'Hinrunde' },
    { value: 'rr', label: 'Rückrunde' },
];

const LEAGUE_FAVORITE_TYPE = 'league' as const;

export default function LeagueDetailsScreen() {
    const params = useLocalSearchParams<Record<string, string>>();
    const { colors } = useTheme();

    const [activeTab, setActiveTab] = useState<DetailTab>('table');
    const [tableRows, setTableRows] = useState<TableRow[]>([]);
    const [matches, setMatches] = useState<EnrichedScheduleMatch[]>([]);
    const [periodFilter, setPeriodFilter] = useState<SchedulePeriodFilter>('all');
    const [roundFilter, setRoundFilter] = useState<RoundFilter>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [favoriteLeagueLoading, setFavoriteLeagueLoading] = useState(false);
    const [isFavoriteLeague, setIsFavoriteLeague] = useState(false);
    const [favoriteLeagueIds, setFavoriteLeagueIds] = useState<string[]>([]);

    const league = useMemo<LeagueInfo>(() => {
        const groupId = params.groupId ?? params.leagueKey;

        return {
            title: params.title ?? 'Ligadetails',
            association: params.association,
            groupId,
            season: params.season ?? '25/26',
            leagueSlug: params.leagueSlug ?? 'x',
            favoriteId: getLeagueFavoriteId({
                favoriteId: params.favoriteId ?? params.id ?? params.leagueId,
                association: params.association,
                groupId,
                season: params.season,
                leagueSlug: params.leagueSlug,
                title: params.title,
            }),
        };
    }, [
        params.association,
        params.favoriteId,
        params.groupId,
        params.id,
        params.leagueId,
        params.leagueKey,
        params.leagueSlug,
        params.season,
        params.title,
    ]);


    const loadFavoriteState = useCallback(async () => {
        const favorites = await getFavorites();
        const fallbackKey = favoriteKey(LEAGUE_FAVORITE_TYPE, league.favoriteId);

        const matchingFavoriteIds = favorites
            .filter((item) => {
                if (item.type !== LEAGUE_FAVORITE_TYPE) return false;
                if (favoriteKey(item.type, item.id) === fallbackKey) return true;
                return isSameLeagueFavorite(item, league);
            })
            .map((item) => item.id);

        setFavoriteLeagueIds([...new Set(matchingFavoriteIds)]);
        setIsFavoriteLeague(matchingFavoriteIds.length > 0);
    }, [league]);

    useFocusEffect(
        useCallback(() => {
            loadFavoriteState().catch(() => undefined);
        }, [loadFavoriteState]),
    );

    async function handleToggleFavoriteLeague() {
        if (!league.favoriteId) return;

        setFavoriteLeagueLoading(true);

        try {
            if (isFavoriteLeague) {
                const idsToRemove = favoriteLeagueIds.length > 0 ? favoriteLeagueIds : [league.favoriteId];

                await Promise.all(idsToRemove.map((id) => removeFavorite(LEAGUE_FAVORITE_TYPE, id)));
                setFavoriteLeagueIds([]);
                setIsFavoriteLeague(false);
                return;
            }

            await addFavorite({
                id: league.favoriteId,
                type: LEAGUE_FAVORITE_TYPE,
                title: league.title,
                subtitle: `${league.association ?? 'Verband unbekannt'} • Saison ${formatSeasonLabel(league.season)}`,
                params: {
                    association: league.association,
                    groupId: league.groupId,
                    season: league.season,
                    leagueSlug: league.leagueSlug ?? 'x',
                    title: league.title,
                    favoriteId: league.favoriteId,
                },
            });

            setFavoriteLeagueIds([league.favoriteId]);
            setIsFavoriteLeague(true);
        } catch {
            // Keine sichtbare Statusmeldung: Button bleibt einfach im bisherigen Zustand.
        } finally {
            setFavoriteLeagueLoading(false);
        }
    }

    useEffect(() => {
        async function loadLeague() {
            if (!league.association || !league.groupId) {
                setLoading(false);
                setError('Für diese Liga fehlen association oder groupId.');
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const [tableResponse, scheduleResponse] = await Promise.all([
                    ttApi.getLeagueTable(
                        league.association,
                        league.season,
                        league.groupId,
                        league.leagueSlug,
                        'gesamt',
                    ),
                    ttApi.getLeagueSchedule(
                        league.association,
                        league.season,
                        league.groupId,
                        league.leagueSlug,
                    ),
                ]);

                setTableRows(normalizeTable(tableResponse));
                setMatches(normalizeSchedule(scheduleResponse).map(enrichScheduleMatch));
            } catch (loadError) {
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : 'Ligadaten konnten nicht geladen werden',
                );
            } finally {
                setLoading(false);
            }
        }

        loadLeague().catch(() => undefined);
    }, [league.association, league.groupId, league.leagueSlug, league.season]);

    const filteredMatches = useMemo(
        () =>
            matches.filter(
                (match) =>
                    matchesPeriodFilter(match, periodFilter) &&
                    matchesRoundFilter(match, roundFilter),
            ),
        [matches, periodFilter, roundFilter],
    );

    const upcoming = useMemo(
        () => filteredMatches.filter((match) => match.status !== 'completed'),
        [filteredMatches],
    );

    const completed = useMemo(
        () => filteredMatches.filter((match) => match.status === 'completed'),
        [filteredMatches],
    );

    const scheduleStatsByTeam = useMemo(() => buildScheduleStats(matches), [matches]);

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                    <BackButton />

                    <FavoriteLeagueButton
                        active={isFavoriteLeague}
                        loading={favoriteLeagueLoading}
                        onPress={handleToggleFavoriteLeague}
                    />
                </View>

                <View style={styles.headerText}>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                        {league.title}
                    </Text>

                    <View style={styles.headerMetaRow}>
                        <Badge tone="outline" icon="calendar-outline">
                            Saison {league.season}
                        </Badge>

                        {league.association ? <Badge tone="secondary">{league.association}</Badge> : null}
                        {league.groupId ? <Badge tone="outline">Gruppe {league.groupId}</Badge> : null}
                    </View>
                </View>

                <SegmentedTabs
                    value={activeTab}
                    onChange={setActiveTab}
                    options={[
                        { value: 'table', label: 'Tabelle', icon: 'podium-outline' },
                        { value: 'matches', label: 'Spielplan', icon: 'calendar-outline' },
                    ]}
                />

                {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
                {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

                {!loading && !error && activeTab === 'table' ? (
                    <Card style={styles.tableCard}>
                        <View style={styles.sectionHeader}>
                            <View
                                style={[
                                    styles.sectionIcon,
                                    {
                                        backgroundColor: colors.primarySoft,
                                        borderColor: colors.primarySoftBorder,
                                    },
                                ]}
                            >
                                <Ionicons name="podium-outline" size={18} color={colors.primary} />
                            </View>

                            <View>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Tabelle</Text>
                                <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                                    Punkte, Spiele, Bilanz und Verhältnis
                                </Text>
                            </View>
                        </View>

                        {tableRows.length === 0 ? (
                            <EmptyState icon="list-outline" title="Keine Tabelle gefunden" />
                        ) : (
                            <View style={styles.teamCardList}>
                                {tableRows.map((row, index) => {
                                    const scheduleStats = scheduleStatsByTeam.get(normalizeTeamKey(row.teamName));

                                    return (
                                        <TableTeamRow
                                            key={getTableRowKey(row, index)}
                                            row={row}
                                            index={index}
                                            league={league}
                                            scheduleStats={scheduleStats}
                                        />
                                    );
                                })}
                            </View>
                        )}
                    </Card>
                ) : null}

                {!loading && !error && activeTab === 'matches' ? (
                    <View style={styles.stack}>
                        <Card style={styles.filterCard}>
                            <View style={styles.sectionHeaderCompact}>
                                <Ionicons name="filter-outline" size={18} color={colors.primary} />
                                <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>Filter</Text>
                            </View>

                            <View style={styles.filterBlock}>
                                <Text style={[styles.filterLabel, { color: colors.mutedText }]}>Zeitraum</Text>
                                <View style={styles.filterChipRow}>
                                    {periodOptions.map((option) => (
                                        <FilterChip
                                            key={option.value}
                                            label={option.label}
                                            active={periodFilter === option.value}
                                            onPress={() => setPeriodFilter(option.value)}
                                        />
                                    ))}
                                </View>
                            </View>

                            <View style={styles.filterBlock}>
                                <Text style={[styles.filterLabel, { color: colors.mutedText }]}>
                                    Hin-/Rückrunde
                                </Text>
                                <View style={styles.filterChipRow}>
                                    {roundOptions.map((option) => (
                                        <FilterChip
                                            key={option.value}
                                            label={option.label}
                                            active={roundFilter === option.value}
                                            onPress={() => setRoundFilter(option.value)}
                                        />
                                    ))}
                                </View>
                            </View>

                            <Text style={[styles.filterHint, { color: colors.mutedText }]}>
                                {filteredMatches.length} von {matches.length} Spielen sichtbar
                            </Text>
                        </Card>

                        {filteredMatches.length === 0 ? (
                            <EmptyState icon="calendar-outline" title="Keine Spiele für diesen Filter gefunden" />
                        ) : null}

                        {upcoming.length > 0 ? (
                            <Card style={styles.sectionCard}>
                                <View style={styles.sectionHeaderCompact}>
                                    <Ionicons name="time-outline" size={18} color={colors.primary} />
                                    <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>
                                        Offene Spiele ({upcoming.length})
                                    </Text>
                                </View>

                                <View style={styles.stack}>
                                    {upcoming.map((match, index) => (
                                        <MatchCard
                                            key={`upcoming-${match.id ?? 'no-id'}-${index}`}
                                            match={match}
                                            highlighted
                                        />
                                    ))}
                                </View>
                            </Card>
                        ) : null}

                        {completed.length > 0 ? (
                            <Card style={styles.sectionCard}>
                                <View style={styles.sectionHeaderCompact}>
                                    <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                                    <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>
                                        Abgeschlossene Spiele ({completed.length})
                                    </Text>
                                </View>

                                <View style={styles.stack}>
                                    {completed.map((match, index) => (
                                        <MatchCard
                                            key={`completed-${match.id ?? 'no-id'}-${index}`}
                                            match={match}
                                        />
                                    ))}
                                </View>
                            </Card>
                        ) : null}
                    </View>
                ) : null}
            </ScrollView>
        </Screen>
    );
}

function BackButton() {
    const { colors } = useTheme();
    const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {};

    return (
        <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [
                styles.backButton,
                noWebOutline,
                {
                    backgroundColor: pressed ? colors.primarySoft : 'transparent',
                    borderColor: pressed ? colors.primarySoftBorder : colors.border,
                },
            ]}
        >
            <Ionicons name="arrow-back" size={23} color={colors.text} />
        </Pressable>
    );
}

function FavoriteLeagueButton({
                                  active,
                                  loading,
                                  onPress,
                              }: {
    active: boolean;
    loading: boolean;
    onPress: () => void;
}) {
    const { colors } = useTheme();
    const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {};

    return (
        <Pressable
            onPress={onPress}
            disabled={loading}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={active ? 'Liga aus Favoriten entfernen' : 'Liga zu Favoriten hinzufügen'}
            style={({ pressed }) => [
                styles.headerActionButton,
                noWebOutline,
                {
                    backgroundColor: active || pressed ? colors.primarySoft : 'transparent',
                    borderColor: active || pressed ? colors.primarySoftBorder : colors.border,
                    opacity: loading ? 0.65 : 1,
                },
            ]}
        >
            {loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
            ) : (
                <Ionicons
                    name={active ? 'star' : 'star-outline'}
                    size={22}
                    color={active ? colors.primary : colors.text}
                />
            )}
        </Pressable>
    );
}

function TableTeamRow({
                          row,
                          index,
                          league,
                          scheduleStats,
                      }: {
    row: TableRow;
    index: number;
    league: LeagueInfo;
    scheduleStats?: TeamScheduleStats;
}) {
    const { colors } = useTheme();
    const stats = getTableStats(row, index, scheduleStats);
    const teamId = getTeamRouteId(row, stats.teamName);
    const accent = getTableCardAccent(row, colors);

    return (
        <Pressable
            onPress={() =>
                router.push({
                    pathname: '/team/[teamId]',
                    params: {
                        teamId,
                        teamName: stats.teamName,
                        leagueTitle: league.title,
                        season: league.season,
                        association: league.association ?? '',
                        groupId: league.groupId ?? '',
                        leagueSlug: league.leagueSlug,
                    },
                })
            }
            style={({ pressed }) => [
                styles.leagueTeamCard,
                {
                    backgroundColor: accent.background,
                    borderColor: accent.border,
                },
                pressed ? styles.leagueTeamCardPressed : null,
            ]}
        >
            <View style={styles.leagueTeamHeader}>
                <View
                    style={[
                        styles.leagueRankBadge,
                        {
                            backgroundColor: accent.rankBackground,
                            borderColor: accent.rankBorder,
                        },
                    ]}
                >
                    <Text style={[styles.leagueRankText, { color: accent.rankText }]}>
                        {stats.position}
                    </Text>
                </View>

                <View style={styles.leagueTeamTitleBlock}>
                    <Text style={[styles.leagueTeamName, { color: colors.text }]} numberOfLines={2}>
                        {stats.teamName}
                    </Text>
                </View>
            </View>

            <View style={styles.leagueStatGrid}>
                <TableStatTile
                    label="Punkte"
                    value={formatTablePoints(stats.points)}
                    tone="points"
                    strong
                />

                <TableStatTile label="Spiele" value={stats.games} tone="games" />
                <TableStatTile label="S/U/N" value={stats.record} tone="record" />
                <TableStatTile label="Verh." value={stats.ratio} tone="ratio" />
            </View>
        </Pressable>
    );
}

function TableStatTile({
                           label,
                           value,
                           tone,
                           strong,
                       }: {
    label: string;
    value: string;
    tone: 'points' | 'games' | 'record' | 'ratio';
    strong?: boolean;
}) {
    const { colors: themeColors } = useTheme();
    const colors = getStatTileColors(tone, themeColors);

    return (
        <View
            style={[
                styles.leagueStatTile,
                {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                },
            ]}
        >
            <Text style={[styles.leagueStatLabel, { color: colors.label }]} numberOfLines={1}>
                {label}
            </Text>

            <Text
                style={[
                    styles.leagueStatValue,
                    strong ? styles.leagueStatValueStrong : null,
                    { color: colors.value },
                ]}
                numberOfLines={1}
            >
                {value}
            </Text>
        </View>
    );
}

function FilterChip({
                        label,
                        active,
                        onPress,
                    }: {
    label: string;
    active: boolean;
    onPress: () => void;
}) {
    const { colors } = useTheme();

    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.filterChip,
                {
                    backgroundColor: active ? colors.primarySoft : colors.card,
                    borderColor: active ? colors.primarySoftBorder : colors.border,
                },
            ]}
        >
            <Text
                style={[
                    styles.filterChipText,
                    {
                        color: active ? colors.primary : colors.mutedText,
                    },
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}

function MatchCard({ match, highlighted }: { match: ScheduleMatch; highlighted?: boolean }) {
    const { colors } = useTheme();
    const canOpen = Boolean(match.id) && match.status !== 'free';

    return (
        <Card
            pressable={canOpen}
            onPress={
                canOpen
                    ? () =>
                        router.push({
                            pathname: '/match/[meetingId]',
                            params: {
                                meetingId: match.id!,
                                homeTeam: match.homeTeam,
                                awayTeam: match.awayTeam,
                            },
                        })
                    : undefined
            }
            style={[
                styles.matchCard,
                highlighted && {
                    backgroundColor: colors.primarySoft,
                    borderColor: colors.primarySoftBorder,
                },
            ]}
        >
            <View style={styles.matchTopMeta}>
                <View style={styles.metaLine}>
                    <Ionicons name="calendar-outline" size={13} color={colors.mutedText} />
                    <Text style={[styles.metaText, { color: colors.mutedText }]}>
                        {formatDate(match.date)}
                        {match.time ? ` • ${match.time}` : ''}
                        {match.endTime ? `–${match.endTime}` : ''}
                    </Text>
                </View>

                <Badge
                    tone={
                        match.status === 'completed'
                            ? 'green'
                            : match.status === 'free'
                                ? 'secondary'
                                : 'outline'
                    }
                >
                    {matchStatusLabel(match.status)}
                </Badge>
            </View>

            <View style={styles.matchScoreRow}>
                <Text style={[styles.matchTeam, { color: colors.text }]} numberOfLines={2}>
                    {match.homeTeam}
                </Text>

                {match.status === 'completed' ? (
                    <View style={[styles.scoreBox, { backgroundColor: colors.muted }]}>
                        <Text style={[styles.scoreText, { color: colors.text }]}>
                            {match.homeScore ?? '-'}
                        </Text>
                        <Text style={[styles.scoreDivider, { color: colors.mutedText }]}>:</Text>
                        <Text style={[styles.scoreText, { color: colors.text }]}>
                            {match.awayScore ?? '-'}
                        </Text>
                    </View>
                ) : (
                    <View style={[styles.vsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.vsText, { color: colors.mutedText }]}>
                            {match.status === 'free' ? 'FREI' : 'VS'}
                        </Text>
                    </View>
                )}

                <Text style={[styles.matchTeam, styles.awayTeam, { color: colors.text }]} numberOfLines={2}>
                    {match.awayTeam}
                </Text>
            </View>

            <View style={styles.matchMetaRow}>
                {match.roundName || match.meetingNumber ? (
                    <View style={styles.metaLine}>
                        <Ionicons name="flag-outline" size={13} color={colors.mutedText} />
                        <Text style={[styles.metaText, { color: colors.mutedText }]}>
                            {[match.roundName, match.meetingNumber ? `Spiel ${match.meetingNumber}` : undefined]
                                .filter(Boolean)
                                .join(' • ')}
                        </Text>
                    </View>
                ) : null}

                {match.confirmed !== undefined ? (
                    <View style={styles.metaLine}>
                        <Ionicons
                            name={match.confirmed ? 'shield-checkmark-outline' : 'alert-circle-outline'}
                            size={13}
                            color={colors.mutedText}
                        />
                        <Text style={[styles.metaText, { color: colors.mutedText }]}>
                            {match.confirmed ? 'Bestätigt' : 'Nicht bestätigt'}
                        </Text>
                    </View>
                ) : null}
            </View>
        </Card>
    );
}

function getLeagueFavoriteId({
                                 favoriteId,
                                 association,
                                 groupId,
                                 season,
                                 leagueSlug,
                                 title,
                             }: {
    favoriteId?: string;
    association?: string;
    groupId?: string;
    season?: string;
    leagueSlug?: string;
    title?: string;
}) {
    const directId = String(favoriteId ?? '').trim();
    if (directId) return directId;

    const directGroupId = String(groupId ?? '').trim();
    if (directGroupId) return directGroupId;

    return [association, formatSeasonLabel(season), leagueSlug ?? 'x', title]
        .map((part) => String(part ?? '').trim())
        .filter(Boolean)
        .join(':');
}

function isSameLeagueFavorite(item: unknown, league: LeagueInfo) {
    const favorite = item as {
        id?: string;
        type?: string;
        title?: string;
        params?: Record<string, unknown>;
    };

    if (favorite.type !== LEAGUE_FAVORITE_TYPE) return false;

    const params = favorite.params ?? {};
    const association = valueToString(params.association);
    const groupId = valueToString(params.groupId) ?? valueToString(params.leagueKey);
    const season = valueToString(params.season);
    const leagueSlug = valueToString(params.leagueSlug);
    const title = valueToString(params.title) ?? valueToString(favorite.title);

    const sameAssociation = normalizeComparable(association) === normalizeComparable(league.association);
    const sameGroup = normalizeComparable(groupId) === normalizeComparable(league.groupId);
    const sameSeason = normalizeSeasonLabel(season) === normalizeSeasonLabel(league.season);
    const sameSlug = normalizeComparable(leagueSlug ?? 'x') === normalizeComparable(league.leagueSlug ?? 'x');
    const sameTitle = normalizeComparable(title) === normalizeComparable(league.title);

    return sameAssociation && sameGroup && sameSeason && (sameSlug || sameTitle);
}

function normalizeComparable(value?: string) {
    return String(value ?? '').trim().toLowerCase();
}

function normalizeSeasonLabel(value?: string) {
    return formatSeasonLabel(value).trim().toLowerCase();
}

function formatSeasonLabel(value?: string) {
    return String(value ?? '25/26').replace(/--/g, '/');
}

function getTableStats(row: TableRow, index: number, scheduleStats?: TeamScheduleStats) {
    const raw = row as RichTableRow;

    const position =
        valueToString(row.position) ??
        pickString(raw, ['position', 'tableRank', 'table_rank', 'rank']) ??
        String(index + 1);

    const teamName =
        valueToString(row.teamName) ??
        pickString(raw, ['teamName', 'team_name', 'name']) ??
        'Unbekannte Mannschaft';

    const officialPoints =
        valueToString(row.points) ??
        joinPair(valueToString(row.pointsWon), valueToString(row.pointsLost)) ??
        pickString(raw, ['tablePoints', 'table_points', 'pointsText', 'score']);

    const schedulePoints = scheduleStats
        ? `${scheduleStats.tablePointsWon}:${scheduleStats.tablePointsLost}`
        : undefined;

    const games =
        valueToString(row.matches) ??
        pickString(raw, [
            'played',
            'playedGames',
            'played_games',
            'meetings',
            'meetingsPlayed',
            'meetings_played',
            'matchesPlayed',
            'matches_played',
            'anzahl_spiele',
        ]) ??
        (scheduleStats ? String(scheduleStats.played) : undefined);

    const wins = valueToString(row.wins) ?? pickString(raw, ['won', 'meetingsWon', 'meetings_won']);
    const draws = valueToString(row.draws) ?? pickString(raw, ['ties', 'meetingsDraw', 'meetings_draw']);
    const losses = valueToString(row.losses) ?? pickString(raw, ['lost', 'meetingsLost', 'meetings_lost']);

    const record =
        joinRecord(wins, draws, losses) ??
        (scheduleStats ? `${scheduleStats.wins}-${scheduleStats.draws}-${scheduleStats.losses}` : undefined);

    const ratio =
        pickString(raw, [
            'ratio',
            'matchRatio',
            'match_ratio',
            'matchesRatio',
            'matches_ratio',
            'gamesRatio',
            'games_ratio',
            'balance',
        ]) ??
        joinPair(
            pickString(raw, ['matchesWon', 'matches_won', 'gamesWon', 'games_won']),
            pickString(raw, ['matchesLost', 'matches_lost', 'gamesLost', 'games_lost']),
        ) ??
        (scheduleStats ? `${scheduleStats.matchesWon}:${scheduleStats.matchesLost}` : undefined) ??
        valueToString(row.games);

    return {
        position,
        teamName,
        points: officialPoints ?? schedulePoints ?? '-',
        games: games ?? '-',
        record: record ?? '-',
        ratio: ratio ?? '-',
    };
}

function buildScheduleStats(matches: ScheduleMatch[]) {
    const statsByTeam = new Map<string, TeamScheduleStats>();

    for (const match of matches) {
        if (match.status !== 'completed') continue;
        if (isFreeTeam(match.homeTeam) || isFreeTeam(match.awayTeam)) continue;

        const homeScore = toNumber(match.homeScore);
        const awayScore = toNumber(match.awayScore);

        if (homeScore === undefined || awayScore === undefined) continue;

        addTeamScheduleResult(statsByTeam, match.homeTeam, homeScore, awayScore);
        addTeamScheduleResult(statsByTeam, match.awayTeam, awayScore, homeScore);
    }

    return statsByTeam;
}

function addTeamScheduleResult(
    statsByTeam: Map<string, TeamScheduleStats>,
    teamName: string,
    ownScore: number,
    opponentScore: number,
) {
    const key = normalizeTeamKey(teamName);
    if (!key) return;

    const current =
        statsByTeam.get(key) ??
        {
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            tablePointsWon: 0,
            tablePointsLost: 0,
            matchesWon: 0,
            matchesLost: 0,
        };

    current.played += 1;
    current.matchesWon += ownScore;
    current.matchesLost += opponentScore;

    if (ownScore > opponentScore) {
        current.wins += 1;
        current.tablePointsWon += 2;
    } else if (ownScore < opponentScore) {
        current.losses += 1;
        current.tablePointsLost += 2;
    } else {
        current.draws += 1;
        current.tablePointsWon += 1;
        current.tablePointsLost += 1;
    }

    statsByTeam.set(key, current);
}

function getTableRowKey(row: TableRow, index: number) {
    const raw = row as RichTableRow;

    return [
        valueToString(row.id),
        valueToString(row.teamName),
        valueToString(row.clubId),
        pickString(raw, ['teamId', 'team_id']),
        index,
    ]
        .filter(Boolean)
        .join('-');
}

function getTeamRouteId(row: TableRow, teamName: string) {
    const raw = row as RichTableRow;

    return (
        valueToString(row.id) ??
        pickString(raw, ['teamId', 'team_id', 'teamUuid', 'team_uuid', 'id']) ??
        slugifyTeamName(teamName)
    );
}

function slugifyTeamName(teamName: string) {
    return (
        normalizeTeamKey(teamName)
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || 'team'
    );
}

function formatTablePoints(value?: string) {
    if (!value) return '-';

    const normalized = value.trim();

    if (/^\d+\.\d+$/.test(normalized)) {
        return normalized.replace('.', ':');
    }

    return normalized;
}

type PromotionState = 'promotion' | 'relegation' | 'none';

function getPromotionState(row: TableRow): PromotionState {
    const raw = row as RichTableRow;

    const value = String(
        raw.promotionState ??
        raw.promotion_state ??
        ''
    )
        .trim()
        .toLowerCase();

    if (
        value === 'promotion' ||
        value === 'rise' ||
        value === 'up' ||
        value === 'promoted'
    ) {
        return 'promotion';
    }

    if (
        value === 'relegation' ||
        value === 'fall' ||
        value === 'down' ||
        value === 'relegated'
    ) {
        return 'relegation';
    }

    return 'none';
}

type ThemeColors = ReturnType<typeof useTheme>['colors'];

function getTableCardAccent(row: TableRow, colors: ThemeColors) {
    const promotionState = getPromotionState(row);
    const dark = isDarkTheme(colors);

    if (promotionState === 'promotion') {
        return dark
            ? {
                background: 'rgba(34, 197, 94, 0.15)',
                border: 'rgba(74, 222, 128, 0.55)',
                rankBackground: 'rgba(34, 197, 94, 0.22)',
                rankBorder: 'rgba(74, 222, 128, 0.75)',
                rankText: '#86EFAC',
            }
            : {
                background: 'rgba(34, 197, 94, 0.11)',
                border: 'rgba(22, 163, 74, 0.38)',
                rankBackground: 'rgba(34, 197, 94, 0.16)',
                rankBorder: 'rgba(22, 163, 74, 0.45)',
                rankText: '#15803D',
            };
    }

    if (promotionState === 'relegation') {
        return dark
            ? {
                background: 'rgba(239, 68, 68, 0.14)',
                border: 'rgba(248, 113, 113, 0.58)',
                rankBackground: 'rgba(239, 68, 68, 0.22)',
                rankBorder: 'rgba(248, 113, 113, 0.78)',
                rankText: '#FCA5A5',
            }
            : {
                background: 'rgba(239, 68, 68, 0.11)',
                border: 'rgba(220, 38, 38, 0.38)',
                rankBackground: 'rgba(239, 68, 68, 0.17)',
                rankBorder: 'rgba(220, 38, 38, 0.45)',
                rankText: '#DC2626',
            };
    }

    return dark
        ? {
            background: 'rgba(255, 255, 255, 0.035)',
            border: 'rgba(255, 255, 255, 0.09)',
            rankBackground: 'rgba(255, 255, 255, 0.06)',
            rankBorder: 'rgba(255, 255, 255, 0.12)',
            rankText: '#CBD5E1',
        }
        : {
            background: colors.card,
            border: colors.border,
            rankBackground: colors.muted,
            rankBorder: colors.border,
            rankText: colors.mutedText,
        };
}

function getStatTileColors(
    tone: 'points' | 'games' | 'record' | 'ratio',
    themeColors: ThemeColors,
) {
    const dark = isDarkTheme(themeColors);

    switch (tone) {
        case 'points':
            return dark
                ? {
                    background: 'rgba(59, 130, 246, 0.16)',
                    border: 'rgba(96, 165, 250, 0.4)',
                    label: '#93C5FD',
                    value: '#FFFFFF',
                }
                : {
                    background: 'rgba(59, 130, 246, 0.12)',
                    border: 'rgba(37, 99, 235, 0.3)',
                    label: '#2563EB',
                    value: '#1D4ED8',
                };

        case 'games':
            return dark
                ? {
                    background: 'rgba(34, 197, 94, 0.14)',
                    border: 'rgba(74, 222, 128, 0.35)',
                    label: '#86EFAC',
                    value: '#FFFFFF',
                }
                : {
                    background: 'rgba(34, 197, 94, 0.12)',
                    border: 'rgba(22, 163, 74, 0.3)',
                    label: '#16A34A',
                    value: '#15803D',
                };

        case 'record':
            return dark
                ? {
                    background: 'rgba(168, 85, 247, 0.16)',
                    border: 'rgba(192, 132, 252, 0.38)',
                    label: '#D8B4FE',
                    value: '#FFFFFF',
                }
                : {
                    background: 'rgba(168, 85, 247, 0.12)',
                    border: 'rgba(147, 51, 234, 0.3)',
                    label: '#9333EA',
                    value: '#7E22CE',
                };

        case 'ratio':
            return dark
                ? {
                    background: 'rgba(249, 115, 22, 0.14)',
                    border: 'rgba(251, 146, 60, 0.38)',
                    label: '#FDBA74',
                    value: '#FFFFFF',
                }
                : {
                    background: 'rgba(249, 115, 22, 0.12)',
                    border: 'rgba(234, 88, 12, 0.3)',
                    label: '#EA580C',
                    value: '#C2410C',
                };
    }
}

function isDarkTheme(colors: ThemeColors) {
    return getRelativeLuminance(colors.background) < 0.45;
}

function getRelativeLuminance(color: string) {
    const hex = color.trim();

    if (!hex.startsWith('#')) {
        return 1;
    }

    const normalized =
        hex.length === 4
            ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
            : hex;

    const red = parseInt(normalized.slice(1, 3), 16);
    const green = parseInt(normalized.slice(3, 5), 16);
    const blue = parseInt(normalized.slice(5, 7), 16);

    if ([red, green, blue].some((value) => Number.isNaN(value))) {
        return 1;
    }

    const [r, g, b] = [red, green, blue].map((value) => {
        const channel = value / 255;
        return channel <= 0.03928
            ? channel / 12.92
            : Math.pow((channel + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function matchesPeriodFilter(match: ScheduleMatch, filter: SchedulePeriodFilter) {
    if (filter === 'all') return true;

    const date = parseMatchDate(match.date);
    if (!date) return false;

    const today = startOfDay(new Date());

    if (filter === 'past30') {
        return date >= addDays(today, -30) && date <= today;
    }

    if (filter === 'next30') {
        return date >= today && date <= addDays(today, 30);
    }

    return true;
}

function enrichScheduleMatch(match: ScheduleMatch): EnrichedScheduleMatch {
    return {
        ...match,
        scheduleRound: inferScheduleRound(match),
    };
}

function matchesRoundFilter(match: EnrichedScheduleMatch, filter: RoundFilter) {
    if (filter === 'all') return true;
    return match.scheduleRound === filter;
}

function inferScheduleRound(match: ScheduleMatch): ScheduleRound {
    const roundName = String(match.roundName ?? '').toLowerCase();

    if (
        roundName.includes('rück') ||
        roundName.includes('rueck') ||
        roundName.includes('rr')
    ) {
        return 'rr';
    }

    if (
        roundName.includes('hin') ||
        roundName.includes('vor') ||
        roundName.includes('vr')
    ) {
        return 'vr';
    }

    const date = parseMatchDate(match.date);

    if (date) {
        const month = date.getMonth() + 1;

        // Typische Saisonlogik: Juli-Dezember = Vorrunde, Januar-Juni = Rückrunde
        return month >= 7 && month <= 12 ? 'vr' : 'rr';
    }

    // Fallback, falls gar nichts erkennbar ist
    return 'vr';
}

function parseMatchDate(value?: string) {
    const raw = String(value ?? '').trim();
    if (!raw) return undefined;

    const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
        return startOfDay(
            new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])),
        );
    }

    const germanMatch = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
    if (germanMatch) {
        const year =
            germanMatch[3].length === 2 ? 2000 + Number(germanMatch[3]) : Number(germanMatch[3]);

        return startOfDay(new Date(year, Number(germanMatch[2]) - 1, Number(germanMatch[1])));
    }

    const fallback = new Date(raw);
    return Number.isNaN(fallback.getTime()) ? undefined : startOfDay(fallback);
}

function startOfDay(date: Date) {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
}

function addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

function normalizeTeamKey(teamName?: string) {
    return (teamName ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function isFreeTeam(teamName?: string) {
    return normalizeTeamKey(teamName).includes('spielfrei');
}

function pickString(row: RichTableRow, keys: string[]) {
    for (const key of keys) {
        const value = valueToString(row[key]);
        if (value !== undefined) return value;
    }

    return undefined;
}

function valueToString(value: unknown) {
    if (value === undefined || value === null || value === '') return undefined;
    return String(value);
}

function joinPair(left?: string, right?: string) {
    if (!left && !right) return undefined;
    return `${left ?? '0'}:${right ?? '0'}`;
}

function joinRecord(wins?: string, draws?: string, losses?: string) {
    if (!wins && !draws && !losses) return undefined;
    return `${wins ?? '0'}-${draws ?? '0'}-${losses ?? '0'}`;
}

function toNumber(value: unknown) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : undefined;
}

const styles = StyleSheet.create({
    content: {
        padding: 16,
        paddingTop: 20,
        paddingBottom: 112,
        gap: 16,
    },
    headerRow: {
        minHeight: 42,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerActionButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
        flex: 1,
        gap: 8,
    },
    title: {
        fontSize: 24,
        lineHeight: 31,
        fontWeight: '900',
    },
    headerMetaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    loader: {
        paddingVertical: 22,
    },
    error: {
        fontSize: 14,
        lineHeight: 20,
    },
    stack: {
        gap: 12,
    },
    tableCard: {
        paddingTop: 16,
        paddingHorizontal: 0,
        paddingBottom: 0,
        overflow: 'hidden',
    },
    teamCardList: {
        paddingHorizontal: 10,
        paddingBottom: 10,
        gap: 9,
    },
    leagueTeamCard: {
        borderWidth: 1,
        borderRadius: 24,
        padding: 12,
        gap: 12,
    },
    leagueTeamCardPressed: {
        opacity: 0.78,
        transform: [{ scale: 0.992 }],
    },
    leagueTeamHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
    },
    leagueRankBadge: {
        width: 38,
        height: 38,
        borderRadius: 999,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    leagueRankText: {
        fontSize: 14,
        lineHeight: 18,
        fontWeight: '900',
    },
    leagueTeamTitleBlock: {
        flex: 1,
        minWidth: 0,
    },
    leagueTeamName: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '900',
    },
    leagueStatGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    leagueStatTile: {
        flex: 1,
        minWidth: 0,
        minHeight: 52,
        borderRadius: 15,
        borderWidth: 1,
        paddingHorizontal: 7,
        paddingVertical: 7,
        justifyContent: 'center',
    },
    leagueStatLabel: {
        fontSize: 9,
        lineHeight: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    leagueStatValue: {
        marginTop: 3,
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '800',
    },
    leagueStatValueStrong: {
        fontSize: 15,
        lineHeight: 19,
        fontWeight: '900',
    },
    filterCard: {
        padding: 16,
        gap: 14,
    },
    filterBlock: {
        gap: 8,
    },
    filterLabel: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '900',
    },
    filterChipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    filterChipText: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '900',
    },
    filterHint: {
        fontSize: 12,
        lineHeight: 16,
    },
    sectionCard: {
        padding: 16,
        gap: 12,
    },
    sectionHeader: {
        paddingHorizontal: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
    },
    sectionHeaderCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionIcon: {
        width: 34,
        height: 34,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: '900',
    },
    sectionSubtitle: {
        marginTop: 1,
        fontSize: 12,
        lineHeight: 17,
    },
    sectionTitleCompact: {
        fontSize: 17,
        lineHeight: 23,
        fontWeight: '900',
    },
    matchCard: {
        padding: 14,
        gap: 11,
    },
    matchTopMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    matchScoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 9,
    },
    matchTeam: {
        flex: 1,
        fontSize: 14,
        lineHeight: 19,
        fontWeight: '900',
    },
    awayTeam: {
        textAlign: 'right',
    },
    scoreBox: {
        minWidth: 76,
        minHeight: 38,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingHorizontal: 8,
    },
    scoreText: {
        fontSize: 21,
        lineHeight: 27,
        fontWeight: '900',
    },
    scoreDivider: {
        fontSize: 18,
        lineHeight: 24,
    },
    vsBox: {
        minWidth: 54,
        minHeight: 34,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    vsText: {
        fontSize: 11,
        lineHeight: 15,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    matchMetaRow: {
        gap: 5,
    },
    metaLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flexShrink: 1,
    },
    metaText: {
        flexShrink: 1,
        fontSize: 13,
        lineHeight: 18,
    },
});