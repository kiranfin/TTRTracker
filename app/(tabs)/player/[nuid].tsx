import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    LayoutAnimation,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { ttApi } from '../../../src/api/tttracker';
import { Badge } from '../../../src/components/Badge';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { Screen } from '../../../src/components/Screen';
import { useTheme } from '../../../src/theme/ThemeProvider';
import type {
    NormalizedPlayerTtrHistory,
    NormalizedTtrHistoryEvent,
    NormalizedTtrHistoryMatch,
} from '../../../src/types/tttracker';
import {
    formatDate,
    normalizePlayerTtrHistory,
} from '../../../src/utils/normalizers';

const PAGE_SIZE = 10;

type ChartRangeId = '6m' | '12m' | '24m' | 'all';

const CHART_RANGES: Array<{
    id: ChartRangeId;
    label: string;
    months?: number;
}> = [
    { id: '6m', label: '6M', months: 6 },
    { id: '12m', label: '12M', months: 12 },
    { id: '24m', label: '24M', months: 24 },
    { id: 'all', label: 'Alle' },
];

type PlayerStats = {
    eventCount: number;
    matchCount: number;
    matchesWon: number;
    ratedMatchCount: number;
    winRate?: number;
    averageDelta?: number;
    bestGain?: number;
    worstLoss?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function parseOptionalNumber(value: unknown) {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined;
    }

    if (typeof value !== 'string') return undefined;

    const cleaned = value
        .trim()
        .replace(/[^\d,.-]/g, '');

    if (!cleaned) return undefined;

    const normalized = cleaned.includes(',') && cleaned.includes('.')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.includes(',') && !cleaned.includes('.')
            ? cleaned.replace(',', '.')
            : /^\d{1,3}(\.\d{3})+$/.test(cleaned)
                ? cleaned.replace(/\./g, '')
                : cleaned;

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function getPlayerHistoryData(response: unknown) {
    if (isRecord(response) && isRecord(response.data)) {
        return response.data;
    }

    if (isRecord(response)) {
        return response;
    }

    return null;
}

function formatOptionalNumber(value: number | null | undefined) {
    return isFiniteNumber(value) ? String(value) : '—';
}

function formatSignedNumber(value: number | null | undefined) {
    if (!isFiniteNumber(value)) return '—';
    return value > 0 ? `+${value}` : String(value);
}

function formatSignedAverage(value: number | null | undefined) {
    if (!isFiniteNumber(value)) return '—';

    const rounded = Math.round(value * 10) / 10;
    const formatted = Number.isInteger(rounded)
        ? String(rounded)
        : rounded.toFixed(1).replace('.', ',');

    return rounded > 0 ? `+${formatted}` : formatted;
}

function formatPercent(value: number | null | undefined) {
    if (!isFiniteNumber(value)) return '—';
    return `${Math.round(value)} %`;
}

function parseDateTimestamp(value?: string | null) {
    if (!value) return undefined;

    const direct = new Date(value).getTime();
    if (Number.isFinite(direct)) return direct;

    const germanDateMatch = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (germanDateMatch) {
        const [, day, month, year] = germanDateMatch;
        const parsed = new Date(Number(year), Number(month) - 1, Number(day)).getTime();
        return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
}

function subtractMonths(date: Date, months: number) {
    const copy = new Date(date);
    copy.setMonth(copy.getMonth() - months);
    return copy;
}

function getEventTtr(event: NormalizedTtrHistoryEvent) {
    return event.ttrAfter ?? event.ttr;
}

function parseRatioFromString(value: unknown, maxMatches?: number) {
    if (typeof value !== 'string') return undefined;

    const match = value.match(/\b(\d{1,3})\s*:\s*(\d{1,3})\b/);
    if (!match) return undefined;

    const won = Number(match[1]);
    const lost = Number(match[2]);
    const total = won + lost;

    if (!Number.isFinite(won) || !Number.isFinite(lost) || total <= 0) {
        return undefined;
    }

    if (maxMatches !== undefined && total > maxMatches) {
        return undefined;
    }

    if (maxMatches === undefined && (won > 10 || lost > 10)) {
        return undefined;
    }

    return { won, lost };
}

function getEventWinLoss(event: NormalizedTtrHistoryEvent) {
    const eventRecord = event as Record<string, unknown>;
    const matchCount = parseOptionalNumber(event.matchCount);

    const wonFromField = parseOptionalNumber(event.matchesWon);
    const lostFromField = parseOptionalNumber(event.matchesLost);

    if (wonFromField !== undefined || lostFromField !== undefined) {
        const won = wonFromField ?? 0;
        const lost = lostFromField ?? 0;

        if (won + lost > 0) {
            return { won, lost };
        }
    }

    const possibleRatioValues: unknown[] = [
        eventRecord.ratio,
        eventRecord.record,
        eventRecord.bilanz,
        eventRecord.matchRatio,
        eventRecord.matchRecord,
        eventRecord.matchBalance,
        eventRecord.spielBilanz,
        eventRecord.spieleBilanz,
        eventRecord.result,
        eventRecord.score,
        event.title,
        event.meetingLabel,
    ];

    for (const value of possibleRatioValues) {
        const ratio = parseRatioFromString(value, matchCount);
        if (ratio) return ratio;
    }

    const won = event.matches.filter((match) => {
        return (
            isFiniteNumber(match.ownSets) &&
            isFiniteNumber(match.otherSets) &&
            match.ownSets > match.otherSets
        );
    }).length;

    const lost = event.matches.filter((match) => {
        return (
            isFiniteNumber(match.ownSets) &&
            isFiniteNumber(match.otherSets) &&
            match.ownSets < match.otherSets
        );
    }).length;

    return { won, lost };
}

function normalizeSearchText(value: unknown) {
    if (value === null || value === undefined) return '';
    return String(value).trim().toLowerCase();
}

function historyEventMatchesSearch(event: NormalizedTtrHistoryEvent, query: string) {
    const normalizedQuery = normalizeSearchText(query);

    if (!normalizedQuery) return true;

    const eventRecord = event as Record<string, unknown>;

    const searchableValues: unknown[] = [
        event.title,
        event.meetingLabel,
        event.leagueName,
        event.date,
        event.time,
        eventRecord.clubName,
        eventRecord.homeClubName,
        eventRecord.awayClubName,
        eventRecord.ownClubName,
        eventRecord.otherClubName,
        eventRecord.homeTeamName,
        eventRecord.awayTeamName,
        eventRecord.teamName,
        eventRecord.opponentTeamName,
        eventRecord.homeTeam,
        eventRecord.awayTeam,
    ];

    event.matches.forEach((match) => {
        const matchRecord = match as Record<string, unknown>;

        searchableValues.push(
            match.ownPlayerName,
            match.otherPlayerName,
            matchRecord.clubName,
            matchRecord.homeClubName,
            matchRecord.awayClubName,
            matchRecord.ownClubName,
            matchRecord.otherClubName,
            matchRecord.homeTeamName,
            matchRecord.awayTeamName,
            matchRecord.teamName,
            matchRecord.opponentTeamName,
            matchRecord.homeTeam,
            matchRecord.awayTeam,
        );
    });

    return searchableValues.some((value) => normalizeSearchText(value).includes(normalizedQuery));
}

export default function PlayerDetailsScreen() {
    const params = useLocalSearchParams<Record<string, string>>();
    const { colors } = useTheme();

    const [history, setHistory] = useState<NormalizedPlayerTtrHistory | null>(null);
    const [apiHistoryData, setApiHistoryData] = useState<Record<string, unknown> | null>(null);
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
    const [chartRange, setChartRange] = useState<ChartRangeId>('12m');
    const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [leagueDropdownOpen, setLeagueDropdownOpen] = useState(false);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const nuid = params.nuid;
    const title = params.title ?? 'Spieler';

    useEffect(() => {
        async function load() {
            if (!nuid) {
                setLoading(false);
                setError('Für diesen Spieler fehlt die NUID.');
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
                setError(loadError instanceof Error ? loadError.message : 'TTR-Historie konnte nicht geladen werden');
            } finally {
                setLoading(false);
            }
        }

        load().catch(() => undefined);
    }, [nuid]);

    useEffect(() => {
        setPage(0);
        setExpandedEventId(null);
    }, [selectedLeague, historySearchQuery]);

    const displayName = history?.personName ?? title;
    const clubName = history?.clubName ?? params.clubName;

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

    const selectedChartRangeLabel = CHART_RANGES.find((range) => range.id === chartRange)?.label ?? '12M';
    const filtersActive = selectedLeague !== null || historySearchQuery.trim().length > 0;

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                    <BackButton />

                    <View style={styles.headerText}>
                        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                            {displayName}
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={1}>
                            {clubName ?? 'Verein unbekannt'}
                        </Text>
                    </View>
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
                                    <Text style={[styles.overviewLabel, { color: colors.mutedText }]}>TTR Übersicht</Text>
                                    <Text style={[styles.overviewTitle, { color: colors.text }]}>
                                        {currentTtr !== undefined ? currentTtr : '—'}
                                    </Text>
                                    <Text style={[styles.overviewSubtitle, { color: colors.mutedText }]}>
                                        Aktueller TTR{history?.ttrDate ? ` · Stand ${formatDate(history.ttrDate)}` : ''}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.overviewFacts}>
                                <OverviewFact
                                    label="Q-TTR"
                                    value={formatOptionalNumber(qTtr)}
                                    helper="Quartalswert"
                                />

                                <OverviewFact
                                    label="Peak"
                                    value={formatOptionalNumber(maxTtr)}
                                    helper={history?.maxTtrDate ? formatDate(history.maxTtrDate) : 'Bestwert'}
                                />

                                <OverviewFact
                                    label="Historie"
                                    value={String(stats.eventCount)}
                                    helper="Einträge"
                                />
                            </View>
                        </Card>

                        <Card style={styles.statsCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="stats-chart-outline" size={19} color={colors.primary} />
                                <View>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistik</Text>
                                    <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                                        Aus der TTR-Historie berechnet
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.statGrid}>
                                <StatTile
                                    icon="tennisball-outline"
                                    label="Spiele"
                                    value={String(stats.matchCount)}
                                    helper="aus TTR-Historie"
                                />

                                <StatTile
                                    icon="calendar-outline"
                                    label="Einträge"
                                    value={String(stats.eventCount)}
                                    helper="Historieneinträge"
                                />

                                <StatTile
                                    icon="pie-chart-outline"
                                    label="Quote"
                                    value={formatPercent(stats.winRate)}
                                    helper={
                                        stats.ratedMatchCount > 0
                                            ? `${stats.matchesWon}/${stats.ratedMatchCount} Spiele gewonnen`
                                            : 'Keine auswertbaren Spiele'
                                    }
                                    positive={isFiniteNumber(stats.winRate) && stats.winRate >= 50}
                                    negative={isFiniteNumber(stats.winRate) && stats.winRate < 50}
                                />

                                <StatTile
                                    icon="swap-vertical-outline"
                                    label="Ø Änderung"
                                    value={formatSignedAverage(stats.averageDelta)}
                                    helper="pro Historieneintrag"
                                    positive={isFiniteNumber(stats.averageDelta) && stats.averageDelta > 0}
                                    negative={isFiniteNumber(stats.averageDelta) && stats.averageDelta < 0}
                                />

                                <StatTile
                                    icon="arrow-up-circle-outline"
                                    label="Bester Sprung"
                                    value={formatSignedNumber(stats.bestGain)}
                                    helper="größter Gewinn"
                                    positive={isFiniteNumber(stats.bestGain) && stats.bestGain > 0}
                                />

                                <StatTile
                                    icon="arrow-down-circle-outline"
                                    label="Größter Verlust"
                                    value={formatSignedNumber(stats.worstLoss)}
                                    helper="größter Abzug"
                                    negative={isFiniteNumber(stats.worstLoss) && stats.worstLoss < 0}
                                />
                            </View>
                        </Card>

                        <Card style={styles.chartCard}>
                            <View style={styles.chartTitleRow}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="trending-up-outline" size={19} color={colors.primary} />
                                    <View>
                                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Verlauf</Text>
                                        <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                                            {selectedChartRangeLabel} · {chartEvents.length} Werte
                                        </Text>
                                    </View>
                                </View>

                                <View style={[styles.rangeControl, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                                    {CHART_RANGES.map((range) => (
                                        <ChartRangeButton
                                            key={range.id}
                                            label={range.label}
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
                                    Für diesen Zeitraum sind noch nicht genug TTR-Werte vorhanden.
                                </Text>
                            )}
                        </Card>

                        <Card style={styles.historyControlsCard}>
                            <View style={styles.historyControlsTopRow}>
                                <View>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Historie</Text>
                                    <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                                        {filteredEventsNewestFirst.length} von {allEventsNewestFirst.length} Einträgen
                                    </Text>
                                </View>

                                {filtersActive ? (
                                    <Pressable onPress={clearHistoryFilters} hitSlop={8}>
                                        <Text style={[styles.clearFiltersText, { color: colors.primary }]}>Zurücksetzen</Text>
                                    </Pressable>
                                ) : null}
                            </View>

                            <View style={styles.filterStack}>
                                <View style={[styles.searchInputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                                    <Ionicons name="search-outline" size={16} color={colors.mutedText} />
                                    <TextInput
                                        value={historySearchQuery}
                                        onChangeText={setHistorySearchQuery}
                                        placeholder="Spieler oder Verein suchen"
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
                                            {selectedLeague ?? 'Alle Ligen'}
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
                                                    label="Alle Ligen"
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
                                        accessibilityLabel="Erste Seite"
                                    />

                                    <PaginationIconButton
                                        icon="chevron-back"
                                        disabled={page === 0}
                                        onPress={goPreviousPage}
                                        accessibilityLabel="Vorherige Seite"
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
                                        accessibilityLabel="Nächste Seite"
                                    />

                                    <PaginationIconButton
                                        icon="chevron-forward"
                                        double
                                        disabled={page >= pageCount - 1}
                                        onPress={goLastPage}
                                        accessibilityLabel="Letzte Seite"
                                    />
                                </View>
                            </View>
                        </Card>

                        {allEventsNewestFirst.length === 0 ? (
                            <EmptyState icon="time-outline" title="Keine Historie gefunden" />
                        ) : filteredEventsNewestFirst.length === 0 ? (
                            <EmptyState icon="search-outline" title="Keine Treffer gefunden" />
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

function OverviewFact({
                          label,
                          value,
                          helper,
                      }: {
    label: string;
    value: string;
    helper: string;
}) {
    const { colors } = useTheme();

    return (
        <View style={[styles.overviewFact, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.overviewFactLabel, { color: colors.mutedText }]}>{label}</Text>
            <Text style={[styles.overviewFactValue, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.overviewFactHelper, { color: colors.mutedText }]} numberOfLines={1}>
                {helper}
            </Text>
        </View>
    );
}

function StatTile({
                      icon,
                      label,
                      value,
                      helper,
                      positive,
                      negative,
                  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    helper: string;
    positive?: boolean;
    negative?: boolean;
}) {
    const { colors } = useTheme();

    const valueColor = negative
        ? colors.destructive
        : positive
            ? '#16a34a'
            : colors.text;

    return (
        <View style={[styles.statTile, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <View style={styles.statTileHeader}>
                <View style={[styles.statIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name={icon} size={16} color={colors.mutedText} />
                </View>

                <Text style={[styles.statLabel, { color: colors.mutedText }]} numberOfLines={1}>
                    {label}
                </Text>
            </View>

            <Text style={[styles.statValue, { color: valueColor }]} numberOfLines={1}>
                {value}
            </Text>

            <Text style={[styles.statHelper, { color: colors.mutedText }]} numberOfLines={2}>
                {helper}
            </Text>
        </View>
    );
}

function ChartRangeButton({
                              label,
                              selected,
                              onPress,
                          }: {
    label: string;
    selected: boolean;
    onPress: () => void;
}) {
    const { colors } = useTheme();

    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.rangeButton,
                {
                    backgroundColor: selected ? colors.primary : 'transparent',
                },
            ]}
        >
            <Text
                style={[
                    styles.rangeButtonText,
                    {
                        color: selected ? colors.card : colors.mutedText,
                    },
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}

function PaginationIconButton({
                                  icon,
                                  disabled,
                                  onPress,
                                  accessibilityLabel,
                                  double,
                              }: {
    icon: 'chevron-back' | 'chevron-forward';
    disabled: boolean;
    onPress: () => void;
    accessibilityLabel: string;
    double?: boolean;
}) {
    const { colors } = useTheme();

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            style={({ pressed }) => [
                styles.paginationIconButton,
                {
                    borderColor: colors.border,
                    backgroundColor: pressed && !disabled ? colors.primarySoft : 'transparent',
                    opacity: disabled ? 0.35 : 1,
                },
            ]}
        >
            <View style={styles.paginationChevronWrap}>
                <Ionicons name={icon} size={17} color={colors.text} />
                {double ? (
                    <Ionicons
                        name={icon}
                        size={17}
                        color={colors.text}
                        style={styles.paginationSecondChevron}
                    />
                ) : null}
            </View>
        </Pressable>
    );
}

function LeagueOption({
                          label,
                          selected,
                          onPress,
                      }: {
    label: string;
    selected: boolean;
    onPress: () => void;
}) {
    const { colors } = useTheme();

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.leagueOption,
                {
                    backgroundColor: selected || pressed ? colors.primarySoft : 'transparent',
                    borderBottomColor: colors.border,
                },
            ]}
        >
            <Text
                style={[
                    styles.leagueOptionText,
                    {
                        color: selected ? colors.primary : colors.text,
                    },
                ]}
                numberOfLines={2}
            >
                {label}
            </Text>

            {selected ? (
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            ) : null}
        </Pressable>
    );
}

function HistoryEventCard({
                              event,
                              expanded,
                              onPress,
                          }: {
    event: NormalizedTtrHistoryEvent;
    expanded: boolean;
    onPress: () => void;
}) {
    const { colors } = useTheme();

    const delta = event.delta ?? 0;
    const deltaColor = delta > 0 ? '#16a34a' : delta < 0 ? colors.destructive : colors.mutedText;
    const deltaLabel = event.delta !== undefined ? formatSignedNumber(delta) : '—';
    const eventTtr = getEventTtr(event);
    const eventWinLoss = getEventWinLoss(event);
    const eventRatioTotal = eventWinLoss.won + eventWinLoss.lost;
    const eventMatchCount = parseOptionalNumber(event.matchCount) ?? eventRatioTotal;

    return (
        <Card pressable onPress={onPress} style={styles.eventCard}>
            <View style={styles.eventTopRow}>
                <View style={styles.eventMain}>
                    {event.leagueName ? (
                        <View style={[styles.leagueTag, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder }]}>
                            <Text style={[styles.leagueTagText, { color: colors.primary }]} numberOfLines={1}>
                                {event.leagueName}
                            </Text>
                        </View>
                    ) : null}

                    <Text style={[styles.meetingText, { color: colors.text }]} numberOfLines={2}>
                        {event.meetingLabel ?? event.title}
                    </Text>

                    <View style={styles.eventMetaRow}>
                        <Ionicons name="calendar-outline" size={13} color={colors.mutedText} />
                        <Text style={[styles.eventDate, { color: colors.mutedText }]}>
                            {event.date ? formatDate(event.date) : 'Datum unbekannt'}{event.time ? ` · ${event.time}` : ''}
                        </Text>
                    </View>
                </View>

                <View style={styles.eventScore}>
                    <Text style={[styles.eventTtr, { color: colors.text }]}>
                        {eventTtr ?? '-'}
                    </Text>
                    <Text style={[styles.eventDelta, { color: deltaColor }]}>
                        {deltaLabel}
                    </Text>
                    <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={colors.mutedText}
                    />
                </View>
            </View>

            <View style={styles.eventBottomRow}>
                {event.ttrBefore !== undefined && event.ttrAfter !== undefined ? (
                    <Badge tone="outline">{event.ttrBefore} → {event.ttrAfter}</Badge>
                ) : null}

                {eventMatchCount > 0 ? (
                    <Badge tone="secondary" icon="tennisball-outline">
                        {eventMatchCount} Spiele
                    </Badge>
                ) : null}

                {eventRatioTotal > 0 ? (
                    <Badge tone="outline">
                        {eventWinLoss.won}:{eventWinLoss.lost}
                    </Badge>
                ) : null}
            </View>

            {expanded ? (
                <View style={[styles.expandedArea, { borderTopColor: colors.border }]}>
                    {event.matches.length > 0 ? (
                        event.matches.map((match) => (
                            <HistoryMatchCard key={match.id} match={match} />
                        ))
                    ) : (
                        <Text style={[styles.mutedText, { color: colors.mutedText }]}>
                            Für diesen Historieneintrag liefert das Backend keine einzelnen Matchdetails.
                        </Text>
                    )}
                </View>
            ) : null}
        </Card>
    );
}

function HistoryMatchCard({ match }: { match: NormalizedTtrHistoryMatch }) {
    const { colors } = useTheme();

    const result =
        match.ownSets !== undefined && match.otherSets !== undefined
            ? `${match.ownSets}:${match.otherSets}`
            : '-';

    return (
        <View style={[styles.matchDetailCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <View style={styles.matchDetailTopRow}>
                <View style={styles.matchPlayers}>
                    <Text style={[styles.matchPlayerName, { color: colors.text }]} numberOfLines={1}>
                        {match.ownPlayerName ?? 'Eigener Spieler'}
                    </Text>
                    <Text style={[styles.matchOpponentName, { color: colors.mutedText }]} numberOfLines={1}>
                        gegen {match.otherPlayerName ?? 'Unbekannter Gegner'}
                        {match.otherTtr !== undefined ? ` · TTR ${match.otherTtr}` : ''}
                    </Text>
                </View>

                <View style={[styles.matchResultBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.matchResultText, { color: colors.text }]}>{result}</Text>
                </View>
            </View>

            {match.setResults.length > 0 ? (
                <View style={styles.eventBottomRow}>
                    {match.setResults.map((setResult, index) => (
                        <Badge key={`${match.id}-set-${index}`} tone="outline">
                            Satz {index + 1}: {setResult}
                        </Badge>
                    ))}
                </View>
            ) : null}

            <View style={styles.eventBottomRow}>
                {match.ownPoints !== undefined || match.otherPoints !== undefined ? (
                    <Badge tone="secondary">
                        Punkte {match.ownPoints ?? 0}:{match.otherPoints ?? 0}
                    </Badge>
                ) : null}

                {match.expectedResult ? (
                    <Badge tone="outline">Erwartung {match.expectedResult}</Badge>
                ) : null}
            </View>
        </View>
    );
}

function TtrLineChart({
                          events,
                          highlightedEvent,
                      }: {
    events: NormalizedTtrHistoryEvent[];
    highlightedEvent: NormalizedTtrHistoryEvent | null;
}) {
    const { colors } = useTheme();

    const width = 320;
    const height = 180;
    const paddingX = 22;
    const paddingY = 24;

    const values = events
        .map((event) => getEventTtr(event))
        .filter((value): value is number => typeof value === 'number');

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);

    const points = events.map((event, index) => {
        const value = getEventTtr(event) ?? min;
        const x = paddingX + (index / Math.max(1, events.length - 1)) * (width - paddingX * 2);
        const y = height - paddingY - ((value - min) / range) * (height - paddingY * 2);
        return { x, y, value, event };
    });

    const path = points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');

    const highlightedPoint = points.find((point) => point.event.id === highlightedEvent?.id);

    return (
        <View style={styles.lineChartWrap}>
            <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
                <Line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke={colors.border} strokeWidth="1" />
                <Line x1={paddingX} y1={paddingY} x2={paddingX} y2={height - paddingY} stroke={colors.border} strokeWidth="1" />

                <Path d={path} fill="none" stroke={colors.primary} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

                {points.map((point, index) => (
                    <Circle key={`${point.event.id}-${index}`} cx={point.x} cy={point.y} r={3.5} fill={colors.primary} />
                ))}

                {highlightedPoint ? (
                    <>
                        <Circle cx={highlightedPoint.x} cy={highlightedPoint.y} r={7} fill={colors.card} stroke={colors.primary} strokeWidth="3" />
                        <SvgText
                            x={Math.min(width - 76, Math.max(34, highlightedPoint.x - 28))}
                            y={Math.max(16, highlightedPoint.y - 12)}
                            fill={colors.primary}
                            fontSize="12"
                            fontWeight="800"
                        >
                            Top {highlightedPoint.value}
                        </SvgText>
                    </>
                ) : null}

                <SvgText x={paddingX} y={height - 5} fill={colors.mutedText} fontSize="11" fontWeight="700">
                    {min}
                </SvgText>
                <SvgText x={paddingX} y={16} fill={colors.mutedText} fontSize="11" fontWeight="700">
                    {max}
                </SvgText>
            </Svg>
        </View>
    );
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
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 25,
        lineHeight: 32,
        fontWeight: '900',
    },
    subtitle: {
        marginTop: 2,
        fontSize: 14,
        lineHeight: 20,
    },
    loader: {
        paddingVertical: 24,
    },
    error: {
        fontSize: 14,
        lineHeight: 20,
    },
    overviewCard: {
        padding: 16,
        gap: 16,
    },
    overviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
    },
    overviewIcon: {
        width: 54,
        height: 54,
        borderRadius: 19,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    overviewHeaderText: {
        flex: 1,
    },
    overviewLabel: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '800',
    },
    overviewTitle: {
        marginTop: 1,
        fontSize: 34,
        lineHeight: 40,
        fontWeight: '900',
    },
    overviewSubtitle: {
        marginTop: 2,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '700',
    },
    overviewFacts: {
        flexDirection: 'row',
        gap: 10,
    },
    overviewFact: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 16,
        padding: 11,
        gap: 3,
    },
    overviewFactLabel: {
        fontSize: 11,
        lineHeight: 15,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.2,
    },
    overviewFactValue: {
        fontSize: 20,
        lineHeight: 26,
        fontWeight: '900',
    },
    overviewFactHelper: {
        fontSize: 11,
        lineHeight: 15,
        fontWeight: '700',
    },
    statsCard: {
        padding: 16,
        gap: 14,
    },
    statGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    statTile: {
        width: '48%',
        minWidth: 145,
        flexGrow: 1,
        borderWidth: 1,
        borderRadius: 18,
        padding: 12,
        gap: 7,
    },
    statTileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    statIcon: {
        width: 28,
        height: 28,
        borderRadius: 11,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statLabel: {
        flex: 1,
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.2,
    },
    statValue: {
        fontSize: 22,
        lineHeight: 28,
        fontWeight: '900',
    },
    statHelper: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '700',
    },
    chartCard: {
        padding: 16,
        gap: 14,
    },
    chartTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
    },
    rangeControl: {
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: 999,
        padding: 3,
        gap: 2,
    },
    rangeButton: {
        minWidth: 46,
        minHeight: 30,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    rangeButtonText: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '900',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: '900',
    },
    sectionSubtitle: {
        marginTop: 2,
        fontSize: 13,
        lineHeight: 18,
    },
    mutedText: {
        fontSize: 14,
        lineHeight: 20,
    },
    lineChartWrap: {
        gap: 8,
    },
    historyControlsCard: {
        padding: 16,
        gap: 14,
    },
    historyControlsTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    clearFiltersText: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '900',
    },
    filterStack: {
        gap: 10,
    },
    leagueFilterWrap: {
        width: '100%',
    },
    leagueSelect: {
        minHeight: 44,
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    leagueSelectText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '800',
    },
    compactPaginationRow: {
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'nowrap',
        gap: 7,
        marginTop: 2,
    },
    paginationIconButton: {
        width: 40,
        height: 40,
        borderRadius: 15,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    paginationChevronWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    paginationSecondChevron: {
        marginLeft: -10,
    },
    searchInputWrap: {
        width: '100%',
        minHeight: 44,
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    searchInput: {
        flex: 1,
        minWidth: 0,
        paddingVertical: 0,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '700',
    },
    dropdownMenu: {
        marginTop: 8,
        borderWidth: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    dropdownScroll: {
        maxHeight: 230,
    },
    leagueOption: {
        minHeight: 44,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    leagueOptionText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '800',
    },
    pageInfo: {
        alignItems: 'center',
        minWidth: 58,
    },
    pageText: {
        fontSize: 14,
        lineHeight: 19,
        fontWeight: '900',
    },
    pageSubtext: {
        marginTop: 1,
        fontSize: 11,
        lineHeight: 15,
        fontWeight: '700',
    },
    stack: {
        gap: 12,
    },
    eventCard: {
        padding: 14,
        gap: 12,
    },
    eventTopRow: {
        flexDirection: 'row',
        gap: 12,
    },
    eventMain: {
        flex: 1,
        gap: 7,
    },
    leagueTag: {
        alignSelf: 'flex-start',
        maxWidth: '100%',
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    leagueTagText: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '900',
    },
    meetingText: {
        fontSize: 15,
        lineHeight: 21,
        fontWeight: '900',
    },
    eventMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    eventDate: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '600',
    },
    eventScore: {
        alignItems: 'flex-end',
        minWidth: 54,
        gap: 2,
    },
    eventTtr: {
        fontSize: 22,
        lineHeight: 28,
        fontWeight: '900',
    },
    eventDelta: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '900',
    },
    eventBottomRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    expandedArea: {
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingTop: 12,
        gap: 10,
    },
    matchDetailCard: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 12,
        gap: 10,
    },
    matchDetailTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    matchPlayers: {
        flex: 1,
    },
    matchPlayerName: {
        fontSize: 14,
        lineHeight: 19,
        fontWeight: '900',
    },
    matchOpponentName: {
        marginTop: 2,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '700',
    },
    matchResultBox: {
        minWidth: 54,
        minHeight: 34,
        borderRadius: 13,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    matchResultText: {
        fontSize: 17,
        lineHeight: 22,
        fontWeight: '900',
    },
});