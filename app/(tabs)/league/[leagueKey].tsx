import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { ttApi } from '@/src/api/tttracker';
import { Badge } from '@/src/components/Badge';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { Screen } from '@/src/components/Screen';
import { SegmentedTabs } from '@/src/components/SegmentedTabs';
import { addFavorite, favoriteKey, getFavorites, removeFavorite } from '@/src/storage/favorites';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { TableRow } from '@/src/types/tttracker';
import { normalizeSchedule, normalizeTable } from '@/src/utils/normalizers';
import { BackButton, FavoriteLeagueButton, TableTeamRow, FilterChip, MatchCard } from '../../../src/features/league-details/components';
import { styles } from '../../../src/features/league-details/styles';
import { getLeagueFavoriteId, LEAGUE_FAVORITE_TYPE, isSameLeagueFavorite, formatSeasonLabel, enrichScheduleMatch, matchesPeriodFilter, matchesRoundFilter, buildScheduleStats, periodFilters, periodFilterLabel, roundFilters, roundFilterLabel, normalizeTeamKey, getTableRowKey } from '../../../src/features/league-details/utils';
import type { DetailTab, EnrichedScheduleMatch, SchedulePeriodFilter, RoundFilter, LeagueInfo } from '../../../src/features/league-details/types';

export default function LeagueDetailsScreen() {
    const params = useLocalSearchParams<Record<string, string>>();
    const { colors } = useTheme();
    const { t } = useI18n();

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
            title: params.title ?? t('league.defaultTitle'),
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
        t,
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
                subtitle: `${league.association ?? t('league.associationUnknown')} • ${t('favorites.seasonValue', { season: formatSeasonLabel(league.season) })}`,
                params: {
                    association: league.association ?? '',
                    groupId: league.groupId ?? '',
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
                setError(t('league.missingLeagueData'));
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
                        : t('league.loadError'),
                );
            } finally {
                setLoading(false);
            }
        }

        loadLeague().catch(() => undefined);
    }, [league.association, league.groupId, league.leagueSlug, league.season, t]);

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

    const localizedTabOptions = useMemo(
        () => [
            { value: 'table' as const, label: t('league.table'), icon: 'podium-outline' as const },
            { value: 'matches' as const, label: t('league.schedule'), icon: 'calendar-outline' as const },
        ],
        [t],
    );

    const localizedPeriodOptions = useMemo(
        () =>
            periodFilters.map((value) => ({
                value,
                label: periodFilterLabel(value, t),
            })),
        [t],
    );

    const localizedRoundOptions = useMemo(
        () =>
            roundFilters.map((value) => ({
                value,
                label: roundFilterLabel(value, t),
            })),
        [t],
    );

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
                            {t('favorites.seasonValue', { season: league.season })}
                        </Badge>

                        {league.association ? <Badge tone="secondary">{league.association}</Badge> : null}
                        {league.groupId ? <Badge tone="outline">{t('team.groupValue', { groupId: league.groupId })}</Badge> : null}
                    </View>
                </View>

                <SegmentedTabs
                    value={activeTab}
                    onChange={setActiveTab}
                    options={localizedTabOptions}
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
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('league.table')}</Text>
                                <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                                    {t('league.tableSubtitle')}
                                </Text>
                            </View>
                        </View>

                        {tableRows.length === 0 ? (
                            <EmptyState icon="list-outline" title={t('league.noTable')} />
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
                                <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>{t('league.filter')}</Text>
                            </View>

                            <View style={styles.filterBlock}>
                                <Text style={[styles.filterLabel, { color: colors.mutedText }]}>{t('league.period')}</Text>
                                <View style={styles.filterChipRow}>
                                    {localizedPeriodOptions.map((option) => (
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
                                    {t('league.halfSeries')}
                                </Text>
                                <View style={styles.filterChipRow}>
                                    {localizedRoundOptions.map((option) => (
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
                                {t('league.visibleGames', { filtered: filteredMatches.length, total: matches.length })}
                            </Text>
                        </Card>

                        {filteredMatches.length === 0 ? (
                            <EmptyState icon="calendar-outline" title={t('league.noGamesForFilter')} />
                        ) : null}

                        {upcoming.length > 0 ? (
                            <Card style={styles.sectionCard}>
                                <View style={styles.sectionHeaderCompact}>
                                    <Ionicons name="time-outline" size={18} color={colors.primary} />
                                    <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>
                                        {t('league.openGames')} ({upcoming.length})
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
                                        {t('league.completedGames')} ({completed.length})
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
