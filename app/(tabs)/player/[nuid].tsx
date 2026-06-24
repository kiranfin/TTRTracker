import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, LayoutAnimation, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ttApi } from '@/src/api/tttracker';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { Screen } from '@/src/components/Screen';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { NormalizedPlayerTtrHistory, NormalizedTtrHistoryEvent } from '@/src/types/tttracker';
import { getMePlayerNuid, clearMePlayerNuid, normalizeMePlayerNuid, setMePlayerNuid as saveMePlayerNuid } from '@/src/storage/mePlayer';
import { addFavorite, isFavorite, removeFavorite } from '@/src/storage/favorites';
import { formatDate, normalizeClub, normalizePlayerTtrHistory } from '@/src/utils/normalizers';
import { BackButton, MarkAsMeButton, FavoritePlayerButton, OpenClubButton, HeadToHeadButton, OverviewFact, StatTile, ChartRangeButton, TtrLineChart, LeagueOption, PaginationIconButton, HistoryEventCard } from '../../../src/features/player-details/components';
import { styles } from '../../../src/features/player-details/styles';
import { getPlayerHistoryData, normalizeClubLookupText, PLAYER_FAVORITE_TYPE, parseOptionalNumber, historyEventMatchesSearch, PAGE_SIZE, getEventTtr, CHART_RANGES, parseDateTimestamp, subtractMonths, isFiniteNumber, getEventWinLoss, formatOptionalNumber, formatPercent, formatSignedAverage, formatSignedNumber } from '../../../src/features/player-details/utils';
import type { ClubRouteParams, ChartRangeId, PlayerStats } from '../../../src/features/player-details/types';

export default function PlayerDetailsScreen() {
    const params = useLocalSearchParams<Record<string, string>>();
    const { colors } = useTheme();
    const { t } = useI18n();

    const [history, setHistory] = useState<NormalizedPlayerTtrHistory | null>(null);
    const [apiHistoryData, setApiHistoryData] = useState<Record<string, unknown> | null>(null);
    const [resolvedClubRouteParams, setResolvedClubRouteParams] = useState<ClubRouteParams | null>(null);
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
    const [chartRange, setChartRange] = useState<ChartRangeId>('12m');
    const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [leagueDropdownOpen, setLeagueDropdownOpen] = useState(false);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [storedMePlayerNuid, setStoredMePlayerNuid] = useState<string | null>(null);
    const [mePlayerLoading, setMePlayerLoading] = useState(false);

    const [favoritePlayerLoading, setFavoritePlayerLoading] = useState(false);
    const [isFavoritePlayer, setIsFavoritePlayer] = useState(false);

    const nuid = params.nuid;
    const routeClubKey = params.clubKey?.trim() ?? '';
    const normalizedCurrentNuid = normalizeMePlayerNuid(nuid);
    const isMeProfile =
        normalizedCurrentNuid.length > 0 &&
        normalizeMePlayerNuid(storedMePlayerNuid) === normalizedCurrentNuid;
    const title = params.title ?? t('player.defaultTitle');

    const displayName = history?.personName ?? title;
    const clubName = history?.clubName ?? params.clubName;

    const routeClubRouteParams: ClubRouteParams | null = routeClubKey
        ? {
            clubKey: routeClubKey,
            title: clubName ?? t('entities.club'),
            organization: params.organization ?? '',
            organizationName: params.organizationName ?? '',
            clubNumber: params.clubNumber ?? '',
            state: params.state ?? '',
            externalId: params.externalId ?? '',
        }
        : null;

    const clubRouteParams = routeClubRouteParams ?? resolvedClubRouteParams;
    const effectiveClubKey = clubRouteParams?.clubKey?.trim() ?? '';

    useEffect(() => {
        async function load() {
            if (!nuid) {
                setLoading(false);
                setError(t('player.missingNuid'));
                setApiHistoryData(null);
                return;
            }

            setLoading(true);
            setError(null);
            setPage(0);
            setExpandedEventId(null);
            setLeagueDropdownOpen(false);
            setApiHistoryData(null);

            try {
                const response = await ttApi.getPlayerTtrHistory(nuid);
                setApiHistoryData(getPlayerHistoryData(response));
                setHistory(normalizePlayerTtrHistory(response));
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : t('player.historyLoadError'));
            } finally {
                setLoading(false);
            }
        }

        load().catch(() => undefined);
    }, [nuid]);

    useEffect(() => {
        let active = true;

        async function resolveClubKeyFromClubName() {
            setResolvedClubRouteParams(null);

            if (routeClubKey) return;

            const searchName = clubName?.trim();

            if (!searchName) return;

            try {
                const rows = await ttApi.searchClubs(searchName);

                if (!active) return;

                const normalizedClubs = Array.isArray(rows)
                    ? rows.map((row) => normalizeClub(row))
                    : [];

                const wantedName = normalizeClubLookupText(searchName);

                const exactMatch = normalizedClubs.find((club) => {
                    return normalizeClubLookupText(club.name) === wantedName;
                });

                const fuzzyMatch = exactMatch ?? normalizedClubs.find((club) => {
                    const candidateName = normalizeClubLookupText(club.name);

                    return (
                        candidateName.includes(wantedName) ||
                        wantedName.includes(candidateName)
                    );
                });

                if (!fuzzyMatch) return;

                setResolvedClubRouteParams({
                    clubKey: fuzzyMatch.id,
                    title: fuzzyMatch.name,
                    organization: fuzzyMatch.organization ?? '',
                    organizationName: fuzzyMatch.organizationName ?? '',
                    clubNumber: fuzzyMatch.clubNumber ?? '',
                    state: fuzzyMatch.state ?? '',
                    externalId: fuzzyMatch.externalId ?? '',
                });
            } catch {
                if (!active) return;

                setResolvedClubRouteParams(null);
            }
        }

        resolveClubKeyFromClubName().catch(() => undefined);

        return () => {
            active = false;
        };
    }, [routeClubKey, clubName]);

    useEffect(() => {
        setPage(0);
        setExpandedEventId(null);
    }, [selectedLeague, historySearchQuery]);

    useEffect(() => {
        let active = true;

        async function loadMePlayer() {
            try {
                const stored = await getMePlayerNuid();

                if (!active) return;

                setStoredMePlayerNuid(stored);
            } catch {
                if (!active) return;

                setStoredMePlayerNuid(null);
            }
        }

        loadMePlayer().catch(() => undefined);

        return () => {
            active = false;
        };
    }, [nuid]);

    useEffect(() => {
        let active = true;

        async function loadFavoriteState() {
            if (!normalizedCurrentNuid) {
                setIsFavoritePlayer(false);
                return;
            }

            try {
                const favorite = await isFavorite(PLAYER_FAVORITE_TYPE, normalizedCurrentNuid);

                if (!active) return;

                setIsFavoritePlayer(favorite);
            } catch {
                if (!active) return;

                setIsFavoritePlayer(false);
            }
        }

        loadFavoriteState().catch(() => undefined);

        return () => {
            active = false;
        };
    }, [normalizedCurrentNuid]);

    async function handleMarkAsMe() {
        if (!nuid) return;

        setMePlayerLoading(true);

        try {
            if (isMeProfile) {
                await clearMePlayerNuid();
                setStoredMePlayerNuid(null);
                return;
            }

            const saved = await saveMePlayerNuid(normalizedCurrentNuid);
            setStoredMePlayerNuid(saved);
        } catch {
            // Keine sichtbare Statusmeldung: Button bleibt einfach im bisherigen Zustand.
        } finally {
            setMePlayerLoading(false);
        }
    }

    const currentTtr =
        parseOptionalNumber(history?.ttr) ??
        parseOptionalNumber(apiHistoryData?.ttr) ??
        parseOptionalNumber(params.ttr);

    const qTtr =
        parseOptionalNumber(history?.qttr) ??
        parseOptionalNumber(apiHistoryData?.qttr);

    const maxTtr =
        parseOptionalNumber(history?.maxTtr) ??
        parseOptionalNumber(apiHistoryData?.maxTtr);

    async function handleToggleFavoritePlayer() {
        if (!normalizedCurrentNuid) return;

        setFavoritePlayerLoading(true);

        try {
            if (isFavoritePlayer) {
                await removeFavorite(PLAYER_FAVORITE_TYPE, normalizedCurrentNuid);
                setIsFavoritePlayer(false);
                return;
            }

            await addFavorite({
                type: PLAYER_FAVORITE_TYPE,
                id: normalizedCurrentNuid,
                title: displayName,
                name: displayName,
                label: displayName,
                subtitle: clubName ?? t('entities.clubUnknown'),
                description: clubName,
                clubName,
                nuid: normalizedCurrentNuid,
                ttr: currentTtr,
                qttr: qTtr,
                meta: currentTtr !== undefined ? `TTR ${currentTtr}` : undefined,
            } as Parameters<typeof addFavorite>[0]);

            setIsFavoritePlayer(true);
        } catch {
            // Keine sichtbare Statusmeldung: Button bleibt einfach im bisherigen Zustand.
        } finally {
            setFavoritePlayerLoading(false);
        }
    }

    function handleOpenHeadToHead() {
        const meNuid = normalizeMePlayerNuid(storedMePlayerNuid);
        const otherNuid = normalizeMePlayerNuid(nuid);

        if (!otherNuid) {
            setError(t('player.missingNuid'));
            return;
        }

        if (!meNuid) {
            setError(t('player.comparisonNeedsMe'));
            return;
        }

        router.push({
            pathname: '/player/player-compare',
            params: {
                leftNuid: meNuid,
                rightNuid: otherNuid,
                leftTitle: t('player.meShort'),
                rightTitle: displayName,
            },
        });
    }

    function handleOpenClubDetails() {
        if (!effectiveClubKey) {
            setError(t('player.missingClubKey'));
            return;
        }

        router.push({
            pathname: '/club/[clubKey]',
            params: {
                clubKey: effectiveClubKey,
                title: clubRouteParams?.title ?? clubName ?? t('entities.club'),
                organization: clubRouteParams?.organization ?? params.organization ?? '',
                organizationName: clubRouteParams?.organizationName ?? params.organizationName ?? '',
                clubNumber: clubRouteParams?.clubNumber ?? params.clubNumber ?? '',
                state: clubRouteParams?.state ?? params.state ?? '',
                externalId: clubRouteParams?.externalId ?? params.externalId ?? '',
            },
        });
    }

    const allEventsNewestFirst = useMemo(() => {
        return [...(history?.events ?? [])].reverse();
    }, [history?.events]);

    const leagueOptions = useMemo(() => {
        const leagues = new Set<string>();

        allEventsNewestFirst.forEach((event) => {
            if (event.leagueName) {
                leagues.add(event.leagueName);
            }
        });

        return [...leagues].sort((a, b) => a.localeCompare(b));
    }, [allEventsNewestFirst]);

    const filteredEventsNewestFirst = useMemo(() => {
        return allEventsNewestFirst.filter((event) => {
            const matchesLeague = !selectedLeague || event.leagueName === selectedLeague;
            const matchesSearch = historyEventMatchesSearch(event, historySearchQuery);

            return matchesLeague && matchesSearch;
        });
    }, [allEventsNewestFirst, selectedLeague, historySearchQuery]);

    const pageCount = Math.max(1, Math.ceil(filteredEventsNewestFirst.length / PAGE_SIZE));

    useEffect(() => {
        setPage((current) => Math.min(current, pageCount - 1));
    }, [pageCount]);

    const pageEvents = useMemo(() => {
        const start = page * PAGE_SIZE;
        return filteredEventsNewestFirst.slice(start, start + PAGE_SIZE);
    }, [filteredEventsNewestFirst, page]);

    const allChartEvents = useMemo(() => {
        return [...(history?.events ?? [])].filter((event) => getEventTtr(event) !== undefined);
    }, [history?.events]);

    const chartEvents = useMemo(() => {
        const selectedRange = CHART_RANGES.find((range) => range.id === chartRange);

        if (!selectedRange?.months) {
            return allChartEvents;
        }

        const latestTimestamp = allChartEvents.reduce((latest, event) => {
            const timestamp = parseDateTimestamp(event.date);
            if (timestamp === undefined) return latest;
            return Math.max(latest, timestamp);
        }, 0);

        if (!latestTimestamp) {
            return allChartEvents;
        }

        const cutoff = subtractMonths(new Date(latestTimestamp), selectedRange.months).getTime();

        return allChartEvents.filter((event) => {
            const timestamp = parseDateTimestamp(event.date);
            return timestamp !== undefined && timestamp >= cutoff;
        });
    }, [allChartEvents, chartRange]);

    const chartTopEvent = useMemo(() => {
        return chartEvents.reduce<NormalizedTtrHistoryEvent | null>((top, event) => {
            const eventTtr = getEventTtr(event);
            const topTtr = top ? getEventTtr(top) : undefined;

            if (eventTtr === undefined) return top;
            if (!top || topTtr === undefined || topTtr < eventTtr) return event;
            return top;
        }, null);
    }, [chartEvents]);

    const stats = useMemo<PlayerStats>(() => {
        const events = history?.events ?? [];

        const deltas = events
            .map((event) => event.delta)
            .filter((value): value is number => isFiniteNumber(value));

        const winLoss = events.reduce(
            (sum, event) => {
                const eventWinLoss = getEventWinLoss(event);

                return {
                    won: sum.won + eventWinLoss.won,
                    lost: sum.lost + eventWinLoss.lost,
                };
            },
            { won: 0, lost: 0 },
        );

        const ratedMatchCount = winLoss.won + winLoss.lost;

        const matchCount = events.reduce((sum, event) => {
            const eventWinLoss = getEventWinLoss(event);
            const ratioTotal = eventWinLoss.won + eventWinLoss.lost;
            const eventMatchCount = parseOptionalNumber(event.matchCount);

            if (eventMatchCount !== undefined) return sum + eventMatchCount;
            if (ratioTotal > 0) return sum + ratioTotal;

            return sum + event.matches.length;
        }, 0);

        const totalDelta = deltas.length > 0
            ? deltas.reduce((sum, value) => sum + value, 0)
            : undefined;

        const averageDelta = totalDelta !== undefined && deltas.length > 0
            ? totalDelta / deltas.length
            : undefined;

        return {
            eventCount: events.length,
            matchCount,
            matchesWon: winLoss.won,
            ratedMatchCount,
            winRate: ratedMatchCount > 0 ? (winLoss.won / ratedMatchCount) * 100 : undefined,
            averageDelta,
            bestGain: deltas.length > 0 ? Math.max(...deltas) : undefined,
            worstLoss: deltas.length > 0 ? Math.min(...deltas) : undefined,
        };
    }, [history?.events]);

    function goFirstPage() {
        setPage(0);
        setExpandedEventId(null);
    }

    function goPreviousPage() {
        setPage((current) => Math.max(0, current - 1));
        setExpandedEventId(null);
    }

    function goNextPage() {
        setPage((current) => Math.min(pageCount - 1, current + 1));
        setExpandedEventId(null);
    }

    function goLastPage() {
        setPage(pageCount - 1);
        setExpandedEventId(null);
    }

    function toggleExpanded(eventId: string) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedEventId((current) => (current === eventId ? null : eventId));
    }

    function clearHistoryFilters() {
        setSelectedLeague(null);
        setHistorySearchQuery('');
        setLeagueDropdownOpen(false);
    }

    const chartRangeLabels: Record<ChartRangeId, string> = {
        '6m': t('player.chartRange6m'),
        '12m': t('player.chartRange12m'),
        '24m': t('player.chartRange24m'),
        all: t('player.chartRangeAll'),
    };
    const selectedChartRangeLabel = chartRangeLabels[chartRange] ?? t('player.chartRange12m');
    const filtersActive = selectedLeague !== null || historySearchQuery.trim().length > 0;

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                    <BackButton />

                    <View style={styles.headerActions}>
                        <MarkAsMeButton
                            active={isMeProfile}
                            loading={mePlayerLoading}
                            onPress={handleMarkAsMe}
                        />

                        <FavoritePlayerButton
                            active={isFavoritePlayer}
                            loading={favoritePlayerLoading}
                            onPress={handleToggleFavoritePlayer}
                        />

                        <OpenClubButton
                            disabled={!effectiveClubKey}
                            onPress={handleOpenClubDetails}
                        />

                        <HeadToHeadButton onPress={handleOpenHeadToHead} />
                    </View>
                </View>

                <View style={styles.profileTitleBlock}>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                        {displayName}
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={1}>
                        {clubName ?? t('entities.clubUnknown')}
                    </Text>
                </View>

                {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
                {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

                {!loading && !error ? (
                    <>
                        <Card style={styles.overviewCard}>
                            <View style={styles.overviewHeader}>
                                <View style={[styles.overviewIcon, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder }]}>
                                    <Ionicons name="analytics-outline" size={24} color={colors.primary} />
                                </View>

                                <View style={styles.overviewHeaderText}>
                                    <Text style={[styles.overviewLabel, { color: colors.mutedText }]}>{t('player.overview')}</Text>
                                    <Text style={[styles.overviewTitle, { color: colors.text }]}>
                                        {currentTtr !== undefined ? currentTtr : '—'}
                                    </Text>
                                    <Text style={[styles.overviewSubtitle, { color: colors.mutedText }]}>
                                        {history?.ttrDate ? t('player.currentTtrWithDate', { date: formatDate(history.ttrDate) }) : t('home.currentTtr')}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.overviewFacts}>
                                <OverviewFact
                                    label="Q-TTR"
                                    value={formatOptionalNumber(qTtr)}
                                    helper={t('player.quarterValue')}
                                />

                                <OverviewFact
                                    label={t('player.peak')}
                                    value={formatOptionalNumber(maxTtr)}
                                    helper={history?.maxTtrDate ? formatDate(history.maxTtrDate) : t('player.bestValue')}
                                />

                                <OverviewFact
                                    label={t('player.history')}
                                    value={String(stats.eventCount)}
                                    helper={t('player.entries')}
                                />
                            </View>
                        </Card>

                        <Card style={styles.statsCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="stats-chart-outline" size={19} color={colors.primary} />
                                <View>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('player.statistics')}</Text>
                                </View>
                            </View>

                            <View style={styles.statGrid}>
                                <StatTile
                                    icon="tennisball-outline"
                                    label={t('player.games')}
                                    value={String(stats.matchCount)}
                                    helper={t('player.fromTtrHistory')}
                                />

                                <StatTile
                                    icon="calendar-outline"
                                    label={t('player.entries')}
                                    value={String(stats.eventCount)}
                                    helper={t('player.historyEntries')}
                                />

                                <StatTile
                                    icon="pie-chart-outline"
                                    label={t('player.quote')}
                                    value={formatPercent(stats.winRate)}
                                    helper={
                                        stats.ratedMatchCount > 0
                                            ? t('player.gamesWonRatio', { won: stats.matchesWon, total: stats.ratedMatchCount })
                                            : t('player.noRatedGames')
                                    }
                                    positive={isFiniteNumber(stats.winRate) && stats.winRate >= 50}
                                    negative={isFiniteNumber(stats.winRate) && stats.winRate < 50}
                                />

                                <StatTile
                                    icon="swap-vertical-outline"
                                    label={t('player.averageChange')}
                                    value={formatSignedAverage(stats.averageDelta)}
                                    helper={t('player.perHistoryEntry')}
                                    positive={isFiniteNumber(stats.averageDelta) && stats.averageDelta > 0}
                                    negative={isFiniteNumber(stats.averageDelta) && stats.averageDelta < 0}
                                />

                                <StatTile
                                    icon="arrow-up-circle-outline"
                                    label={t('player.bestJump')}
                                    value={formatSignedNumber(stats.bestGain)}
                                    helper={t('player.biggestGain')}
                                    positive={isFiniteNumber(stats.bestGain) && stats.bestGain > 0}
                                />

                                <StatTile
                                    icon="arrow-down-circle-outline"
                                    label={t('player.biggestLoss')}
                                    value={formatSignedNumber(stats.worstLoss)}
                                    helper={t('player.biggestDeduction')}
                                    negative={isFiniteNumber(stats.worstLoss) && stats.worstLoss < 0}
                                />
                            </View>
                        </Card>

                        <Card style={styles.chartCard}>
                            <View style={styles.chartTitleRow}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="trending-up-outline" size={19} color={colors.primary} />
                                    <View>
                                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('player.chartTitle')}</Text>
                                        <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                                            {t('player.chartSubtitle', { range: selectedChartRangeLabel, count: chartEvents.length })}
                                        </Text>
                                    </View>
                                </View>

                                <View style={[styles.rangeControl, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                                    {CHART_RANGES.map((range) => (
                                        <ChartRangeButton
                                            key={range.id}
                                            label={chartRangeLabels[range.id]}
                                            selected={chartRange === range.id}
                                            onPress={() => setChartRange(range.id)}
                                        />
                                    ))}
                                </View>
                            </View>

                            {chartEvents.length > 1 ? (
                                <TtrLineChart events={chartEvents} highlightedEvent={chartTopEvent} />
                            ) : (
                                <Text style={[styles.mutedText, { color: colors.mutedText }]}>
                                    {t('player.notEnoughValues')}
                                </Text>
                            )}
                        </Card>

                        <Card style={styles.historyControlsCard}>
                            <View style={styles.historyControlsTopRow}>
                                <View>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('player.history')}</Text>
                                    <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                                        {t('player.historyCount', { filtered: filteredEventsNewestFirst.length, total: allEventsNewestFirst.length })}
                                    </Text>
                                </View>

                                {filtersActive ? (
                                    <Pressable onPress={clearHistoryFilters} hitSlop={8}>
                                        <Text style={[styles.clearFiltersText, { color: colors.primary }]}>{t('common.reset')}</Text>
                                    </Pressable>
                                ) : null}
                            </View>

                            <View style={styles.filterStack}>
                                <View style={[styles.searchInputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                                    <Ionicons name="search-outline" size={16} color={colors.mutedText} />
                                    <TextInput
                                        value={historySearchQuery}
                                        onChangeText={setHistorySearchQuery}
                                        placeholder={t('player.searchPlaceholder')}
                                        placeholderTextColor={colors.mutedText}
                                        style={[styles.searchInput, { color: colors.text }]}
                                        autoCorrect={false}
                                        autoCapitalize="none"
                                    />
                                    {historySearchQuery.trim().length > 0 ? (
                                        <Pressable onPress={() => setHistorySearchQuery('')} hitSlop={8}>
                                            <Ionicons name="close-circle" size={17} color={colors.mutedText} />
                                        </Pressable>
                                    ) : null}
                                </View>

                                <View style={styles.leagueFilterWrap}>
                                    <Pressable
                                        onPress={() => setLeagueDropdownOpen((current) => !current)}
                                        style={[styles.leagueSelect, { backgroundColor: colors.muted, borderColor: colors.border }]}
                                    >
                                        <Ionicons name="filter-outline" size={16} color={colors.mutedText} />
                                        <Text style={[styles.leagueSelectText, { color: colors.text }]} numberOfLines={1}>
                                            {selectedLeague ?? t('player.allLeagues')}
                                        </Text>
                                        <Ionicons
                                            name={leagueDropdownOpen ? 'chevron-up' : 'chevron-down'}
                                            size={16}
                                            color={colors.mutedText}
                                        />
                                    </Pressable>

                                    {leagueDropdownOpen ? (
                                        <View style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                            <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                                                <LeagueOption
                                                    label={t('player.allLeagues')}
                                                    selected={selectedLeague === null}
                                                    onPress={() => {
                                                        setSelectedLeague(null);
                                                        setLeagueDropdownOpen(false);
                                                    }}
                                                />

                                                {leagueOptions.map((league) => (
                                                    <LeagueOption
                                                        key={league}
                                                        label={league}
                                                        selected={selectedLeague === league}
                                                        onPress={() => {
                                                            setSelectedLeague(league);
                                                            setLeagueDropdownOpen(false);
                                                        }}
                                                    />
                                                ))}
                                            </ScrollView>
                                        </View>
                                    ) : null}
                                </View>

                                <View style={styles.compactPaginationRow}>
                                    <PaginationIconButton
                                        icon="chevron-back"
                                        double
                                        disabled={page === 0}
                                        onPress={goFirstPage}
                                        accessibilityLabel={t('player.firstPage')}
                                    />

                                    <PaginationIconButton
                                        icon="chevron-back"
                                        disabled={page === 0}
                                        onPress={goPreviousPage}
                                        accessibilityLabel={t('player.previousPage')}
                                    />

                                    <View style={styles.pageInfo}>
                                        <Text style={[styles.pageText, { color: colors.text }]}>
                                            {page + 1} / {pageCount}
                                        </Text>
                                        <Text style={[styles.pageSubtext, { color: colors.mutedText }]}>
                                            {pageEvents.length}/{filteredEventsNewestFirst.length}
                                        </Text>
                                    </View>

                                    <PaginationIconButton
                                        icon="chevron-forward"
                                        disabled={page >= pageCount - 1}
                                        onPress={goNextPage}
                                        accessibilityLabel={t('player.nextPage')}
                                    />

                                    <PaginationIconButton
                                        icon="chevron-forward"
                                        double
                                        disabled={page >= pageCount - 1}
                                        onPress={goLastPage}
                                        accessibilityLabel={t('player.lastPage')}
                                    />
                                </View>
                            </View>
                        </Card>

                        {allEventsNewestFirst.length === 0 ? (
                            <EmptyState icon="time-outline" title={t('player.noHistory')} />
                        ) : filteredEventsNewestFirst.length === 0 ? (
                            <EmptyState icon="search-outline" title={t('player.noSearchResults')} />
                        ) : (
                            <View style={styles.stack}>
                                {pageEvents.map((event) => (
                                    <HistoryEventCard
                                        key={event.id}
                                        event={event}
                                        expanded={expandedEventId === event.id}
                                        onPress={() => toggleExpanded(event.id)}
                                    />
                                ))}
                            </View>
                        )}
                    </>
                ) : null}
            </ScrollView>
        </Screen>
    );
}
