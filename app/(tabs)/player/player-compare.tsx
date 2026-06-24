import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { useI18n } from '../../../src/i18n/I18nProvider';
import { useTheme } from '../../../src/theme/ThemeProvider';
import { formatDate } from '../../../src/utils/normalizers';

type Translate = ReturnType<typeof useI18n>['t'];

type SideId = 'left' | 'right';
type Leader = SideId | 'tie' | 'unknown';

type CompareValue = {
    left: number | null;
    right: number | null;
    difference: number | null;
    absoluteDifference: number | null;
    leader: Leader;
};

type OddsValue = {
    available: boolean;
    favorite: SideId | 'unknown';
    ttrDifference: number | null;
    leftWinProbability: number | null;
    rightWinProbability: number | null;
};

type RecentMatch = {
    own_sets?: number | null;
    other_sets?: number | null;
    other_ttr?: number | null;
    own_person_name?: string | null;
    other_person_name?: string | null;
    own_team_name?: string | null;
    other_team_name?: string | null;
    expected_result?: string | null;
};

type RecentEvent = {
    event_id: number | string;
    event_name?: string | null;
    event_date_time?: string | null;
    ttr_before?: number | null;
    ttr_after?: number | null;
    ttr_delta?: number | null;
    match_count?: number | null;
    matches_won?: number | null;
    matches_lost?: number | null;
    expected_result?: string | null;
    match?: RecentMatch[];
};

type PlayerCompareSide = {
    nuid: string;
    available?: {
        ttr?: boolean;
        history?: boolean;
        any?: boolean;
    };
    identity?: {
        personName?: string | null;
        clubName?: string | null;
    };
    ratings?: {
        currentTtr?: number | null;
        qttr?: number | null;
        qttrDate?: string | null;
        maxTtr?: number | null;
        maxTtrDate?: string | null;
        ttrDate?: string | null;
    };
    history?: {
        stats?: Record<string, number | string | null>;
        points?: unknown[];
        recentEvents?: RecentEvent[];
    };
    error?: {
        ttr?: unknown;
        history?: unknown;
    };
};

type PlayerComparisonData = {
    left: PlayerCompareSide;
    right: PlayerCompareSide;
    comparison?: {
        ratings?: {
            currentTtr?: CompareValue;
            qttr?: CompareValue;
            maxTtr?: CompareValue;
        };
        history?: Record<string, CompareValue | undefined>;
        odds?: {
            byCurrentTtr?: OddsValue;
            byQttr?: OddsValue;
            byMaxTtr?: OddsValue;
        };
        sameClub?: boolean;
    };
    summary?: {
        strongerCurrent?: string | null;
        strongerQttr?: string | null;
        betterRecentForm?: string | null;
        moreStable?: string | null;
        currentTtrDifference?: number | null;
        qttrDifference?: number | null;
        favoriteByCurrentTtr?: string | null;
    };
    headToHead?: {
        available?: boolean;
        perspective?: {
            note?: string | null;
        };
        stats?: {
            itemCount?: number;
            parsedItemCount?: number;
            leftWins?: number;
            rightWins?: number;
            draws?: number;
            leftWinRate?: number | null;
            rightWinRate?: number | null;
        };
        items?: unknown[];
        error?: string | null;
    };
};

type PlayerComparisonResponse = {
    data: PlayerComparisonData;
    meta?: {
        source?: string;
        generatedAt?: string;
    };
};

type RecentStats = {
    eventCount: number;
    matchCount: number;
    wins: number;
    losses: number;
    winRate?: number;
    totalDelta?: number;
    recentDelta5?: number;
    averageDelta?: number;
    bestGain?: number;
    worstLoss?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unwrapComparisonResponse(response: unknown): PlayerComparisonData | null {
    if (isRecord(response) && isRecord(response.data)) {
        return response.data as PlayerComparisonData;
    }

    if (isRecord(response) && isRecord(response.left) && isRecord(response.right)) {
        return response as PlayerComparisonData;
    }

    return null;
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function numberFromUnknown(value: unknown) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
    if (typeof value !== 'string') return undefined;

    const normalized = value.trim().replace(',', '.');
    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : undefined;
}

function getPlayerName(player: PlayerCompareSide | null | undefined, t: Translate) {
    return player?.identity?.personName ?? t('player.unknownPlayer');
}

function getClubName(player: PlayerCompareSide | null | undefined, t: Translate) {
    return player?.identity?.clubName ?? t('entities.clubUnknown');
}

function getEvents(player?: PlayerCompareSide | null) {
    return player?.history?.recentEvents ?? [];
}

function getEventTimestamp(event: RecentEvent) {
    if (!event.event_date_time) return 0;

    const timestamp = new Date(event.event_date_time.replace(' ', 'T')).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortEventsNewestFirst(events: RecentEvent[]) {
    return [...events].sort((a, b) => getEventTimestamp(b) - getEventTimestamp(a));
}

function getEventMatchCount(event: RecentEvent) {
    const direct = numberFromUnknown(event.match_count);
    if (direct !== undefined) return direct;

    const wins = numberFromUnknown(event.matches_won) ?? 0;
    const losses = numberFromUnknown(event.matches_lost) ?? 0;

    if (wins + losses > 0) return wins + losses;

    return event.match?.length ?? 0;
}

function getEventWins(event: RecentEvent) {
    const direct = numberFromUnknown(event.matches_won);
    if (direct !== undefined) return direct;

    return (event.match ?? []).filter((match) => {
        return (
            isFiniteNumber(match.own_sets) &&
            isFiniteNumber(match.other_sets) &&
            match.own_sets > match.other_sets
        );
    }).length;
}

function getEventLosses(event: RecentEvent) {
    const direct = numberFromUnknown(event.matches_lost);
    if (direct !== undefined) return direct;

    return (event.match ?? []).filter((match) => {
        return (
            isFiniteNumber(match.own_sets) &&
            isFiniteNumber(match.other_sets) &&
            match.own_sets < match.other_sets
        );
    }).length;
}

function buildRecentStats(player: PlayerCompareSide): RecentStats {
    const events = getEvents(player);
    const sortedEvents = sortEventsNewestFirst(events);
    const deltas = events
        .map((event) => numberFromUnknown(event.ttr_delta))
        .filter((value): value is number => value !== undefined);

    const wins = events.reduce((sum, event) => sum + getEventWins(event), 0);
    const losses = events.reduce((sum, event) => sum + getEventLosses(event), 0);
    const matchCount = events.reduce((sum, event) => sum + getEventMatchCount(event), 0);
    const totalRatedMatches = wins + losses;

    const totalDelta = deltas.length > 0 ? deltas.reduce((sum, value) => sum + value, 0) : undefined;

    const recentFiveDeltas = sortedEvents
        .slice(0, 5)
        .map((event) => numberFromUnknown(event.ttr_delta))
        .filter((value): value is number => value !== undefined);

    const recentDelta5 =
        recentFiveDeltas.length > 0
            ? recentFiveDeltas.reduce((sum, value) => sum + value, 0)
            : undefined;

    const statsEventCount = numberFromUnknown(player.history?.stats?.eventCount);

    return {
        eventCount: statsEventCount && statsEventCount > 0 ? statsEventCount : events.length,
        matchCount,
        wins,
        losses,
        winRate: totalRatedMatches > 0 ? (wins / totalRatedMatches) * 100 : undefined,
        totalDelta,
        recentDelta5,
        averageDelta: totalDelta !== undefined && deltas.length > 0 ? totalDelta / deltas.length : undefined,
        bestGain: deltas.length > 0 ? Math.max(...deltas) : undefined,
        worstLoss: deltas.length > 0 ? Math.min(...deltas) : undefined,
    };
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

function formatProbability(value: number | null | undefined) {
    if (!isFiniteNumber(value)) return '—';
    return `${Math.round(value * 100)} %`;
}

function getLeaderName(leader: Leader | undefined, t: Translate) {
    if (leader === 'left') return t('compare.leftAhead');
    if (leader === 'right') return t('compare.rightAhead');
    if (leader === 'tie') return t('compare.tie');
    return t('compare.unclear');
}

function getLeaderForNuid(data: PlayerComparisonData, nuid?: string | null): SideId | undefined {
    if (!nuid) return undefined;
    if (data.left.nuid === nuid) return 'left';
    if (data.right.nuid === nuid) return 'right';
    return undefined;
}

export default function PlayerCompareScreen() {
    const params = useLocalSearchParams<Record<string, string>>();
    const { colors } = useTheme();
    const { t } = useI18n();

    const leftNuid = params.leftNuid ?? params.left;
    const rightNuid = params.rightNuid ?? params.right;

    const [comparison, setComparison] = useState<PlayerComparisonData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [headToHeadInfoOpen, setHeadToHeadInfoOpen] = useState(false);

    useEffect(() => {
        async function load() {
            if (!leftNuid || !rightNuid) {
                setComparison(null);
                setLoading(false);
                setError(t('compare.missingNuids'));
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await ttApi.comparePlayers(leftNuid, rightNuid);
                const data = unwrapComparisonResponse(response);

                if (!data) {
                    throw new Error(t('compare.parseError'));
                }

                setComparison(data);
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : t('compare.loadError'));
                setComparison(null);
            } finally {
                setLoading(false);
            }
        }

        load().catch(() => undefined);
    }, [leftNuid, rightNuid]);

    const leftStats = useMemo(() => {
        return comparison ? buildRecentStats(comparison.left) : null;
    }, [comparison]);

    const rightStats = useMemo(() => {
        return comparison ? buildRecentStats(comparison.right) : null;
    }, [comparison]);

    const currentOdds = comparison?.comparison?.odds?.byCurrentTtr;
    const favoriteSide = comparison
        ? getLeaderForNuid(comparison, comparison.summary?.favoriteByCurrentTtr) ?? currentOdds?.favorite
        : undefined;

    function openPlayer(player: PlayerCompareSide) {
        router.push({
            pathname: '/player/[nuid]',
            params: {
                nuid: player.nuid,
                title: getPlayerName(player, t),
                clubName: getClubName(player, t),
            },
        });
    }

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                    <BackButton />
                </View>

                <View style={styles.titleBlock}>
                    <Text style={[styles.title, { color: colors.text }]}>{t('compare.title')}</Text>
                    <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                        {t('compare.subtitle')}
                    </Text>
                </View>

                {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
                {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

                {!loading && !error && comparison ? (
                    <>
                        <View style={styles.playersRow}>
                            <PlayerHeroCard
                                side="left"
                                player={comparison.left}
                                active={favoriteSide === 'left'}
                                onPress={() => openPlayer(comparison.left)}
                            />

                            <View style={[styles.vsBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Text style={[styles.vsText, { color: colors.mutedText }]}>{t('compare.vs')}</Text>
                            </View>

                            <PlayerHeroCard
                                side="right"
                                player={comparison.right}
                                active={favoriteSide === 'right'}
                                onPress={() => openPlayer(comparison.right)}
                            />
                        </View>

                        {comparison.comparison?.sameClub ? (
                            <View style={styles.centerRow}>
                                <Badge tone="secondary" icon="business-outline">
                                    {t('compare.sameClub')}
                                </Badge>
                            </View>
                        ) : null}

                        <Card style={styles.favoriteCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="flash-outline" size={19} color={colors.primary} />
                                <View>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('compare.favoriteByTtr')}</Text>
                                    <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                                        {t('compare.favoriteByTtrHint')}
                                    </Text>
                                </View>
                            </View>

                            {currentOdds?.available ? (
                                <>
                                    <View style={styles.favoriteMainRow}>
                                        <View style={styles.favoriteSide}>
                                            <Text style={[styles.favoriteName, { color: colors.text }]} numberOfLines={1}>
                                                {getPlayerName(comparison.left, t)}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.favoritePercent,
                                                    {
                                                        color: favoriteSide === 'left' ? colors.primary : colors.mutedText,
                                                    },
                                                ]}
                                            >
                                                {formatProbability(currentOdds.leftWinProbability)}
                                            </Text>
                                        </View>

                                        <View style={styles.favoriteSideRight}>
                                            <Text style={[styles.favoriteName, { color: colors.text }]} numberOfLines={1}>
                                                {getPlayerName(comparison.right, t)}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.favoritePercent,
                                                    {
                                                        color: favoriteSide === 'right' ? colors.primary : colors.mutedText,
                                                    },
                                                ]}
                                            >
                                                {formatProbability(currentOdds.rightWinProbability)}
                                            </Text>
                                        </View>
                                    </View>

                                    <OddsBar
                                        leftProbability={currentOdds.leftWinProbability}
                                        rightProbability={currentOdds.rightWinProbability}
                                    />

                                    <View style={styles.eventBottomRow}>
                                        <Badge tone="outline">
                                            {t('compare.ttrDifferenceValue', { value: formatSignedNumber(currentOdds.ttrDifference) })}
                                        </Badge>

                                        <Badge tone="secondary">
                                            {favoriteSide === 'left'
                                                ? t('compare.favoritePlayer', { player: getPlayerName(comparison.left, t) })
                                                : favoriteSide === 'right'
                                                    ? t('compare.favoritePlayer', { player: getPlayerName(comparison.right, t) })
                                                    : t('compare.favoriteUnknown')}
                                        </Badge>
                                    </View>
                                </>
                            ) : (
                                <Text style={[styles.mutedText, { color: colors.mutedText }]}>
                                    {t('compare.noQuote')}
                                </Text>
                            )}
                        </Card>

                        <Card style={styles.comparisonCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="analytics-outline" size={19} color={colors.primary} />
                                <View>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('compare.keyMetrics')}</Text>
                                    <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                                        {t('compare.leftVsRight')}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.metricStack}>
                                <MetricComparisonRow
                                    icon="speedometer-outline"
                                    label={t('compare.currentTtr')}
                                    helper={t('compare.currentPerformanceValue')}
                                    leftValue={comparison.comparison?.ratings?.currentTtr?.left}
                                    rightValue={comparison.comparison?.ratings?.currentTtr?.right}
                                    difference={comparison.comparison?.ratings?.currentTtr?.difference}
                                    leader={comparison.comparison?.ratings?.currentTtr?.leader}
                                />

                                <MetricComparisonRow
                                    icon="calendar-outline"
                                    label={t('compare.qttr')}
                                    helper={t('compare.quarterValue')}
                                    leftValue={comparison.comparison?.ratings?.qttr?.left}
                                    rightValue={comparison.comparison?.ratings?.qttr?.right}
                                    difference={comparison.comparison?.ratings?.qttr?.difference}
                                    leader={comparison.comparison?.ratings?.qttr?.leader}
                                />

                                <MetricComparisonRow
                                    icon="trophy-outline"
                                    label={t('compare.peak')}
                                    helper={t('compare.bestKnownTtr')}
                                    leftValue={comparison.comparison?.ratings?.maxTtr?.left}
                                    rightValue={comparison.comparison?.ratings?.maxTtr?.right}
                                    difference={comparison.comparison?.ratings?.maxTtr?.difference}
                                    leader={comparison.comparison?.ratings?.maxTtr?.leader}
                                />

                                <MetricComparisonRow
                                    icon="pulse-outline"
                                    label={t('compare.lastFive')}
                                    helper={t('compare.recentDelta')}
                                    leftValue={leftStats?.recentDelta5}
                                    rightValue={rightStats?.recentDelta5}
                                    difference={
                                        isFiniteNumber(leftStats?.recentDelta5) && isFiniteNumber(rightStats?.recentDelta5)
                                            ? leftStats.recentDelta5 - rightStats.recentDelta5
                                            : null
                                    }
                                    leader={
                                        isFiniteNumber(leftStats?.recentDelta5) && isFiniteNumber(rightStats?.recentDelta5)
                                            ? leftStats.recentDelta5 > rightStats.recentDelta5
                                                ? 'left'
                                                : rightStats.recentDelta5 > leftStats.recentDelta5
                                                    ? 'right'
                                                    : 'tie'
                                            : 'unknown'
                                    }
                                    signed
                                />
                            </View>
                        </Card>

                        <Card style={styles.statsCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="stats-chart-outline" size={19} color={colors.primary} />
                                <View>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('compare.formAndQuote')}</Text>
                                    <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                                        {t('compare.recentEventsCalculated')}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.doubleStatsRow}>
                                <PlayerStatsColumn
                                    label={t('compare.left')}
                                    player={comparison.left}
                                    stats={leftStats}
                                    highlighted={favoriteSide === 'left'}
                                />

                                <PlayerStatsColumn
                                    label={t('compare.right')}
                                    player={comparison.right}
                                    stats={rightStats}
                                    highlighted={favoriteSide === 'right'}
                                />
                            </View>
                        </Card>

                        <Card style={styles.headToHeadCard}>
                            <View style={styles.headToHeadTitleRow}>
                                <View style={styles.sectionHeader}>
                                    <MaterialIcons name="compare-arrows" size={20} color={colors.primary} />
                                    <View>
                                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('compare.headToHead')}</Text>
                                        <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                                            {t('compare.directMeetings')}
                                        </Text>
                                    </View>
                                </View>

                                {comparison.headToHead?.perspective?.note ? (
                                    <Pressable
                                        onPress={() => setHeadToHeadInfoOpen((current) => !current)}
                                        hitSlop={10}
                                        style={({ pressed }) => [
                                            styles.infoButton,
                                            {
                                                backgroundColor: pressed || headToHeadInfoOpen ? colors.primarySoft : colors.muted,
                                                borderColor: pressed || headToHeadInfoOpen ? colors.primarySoftBorder : colors.border,
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name="information"
                                            size={16}
                                            color={headToHeadInfoOpen ? colors.primary : colors.mutedText}
                                        />
                                    </Pressable>
                                ) : null}
                            </View>

                            {headToHeadInfoOpen && comparison.headToHead?.perspective?.note ? (
                                <View style={[styles.infoBubble, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                                    <Text style={[styles.infoBubbleText, { color: colors.mutedText }]}>
                                        {comparison.headToHead.perspective.note}
                                    </Text>
                                </View>
                            ) : null}

                            {comparison.headToHead?.available ? (
                                (() => {
                                    const itemCount = comparison.headToHead.stats?.itemCount ?? 0;
                                    const parsedItemCount = comparison.headToHead.stats?.parsedItemCount ?? 0;
                                    const leftWins = comparison.headToHead.stats?.leftWins ?? 0;
                                    const rightWins = comparison.headToHead.stats?.rightWins ?? 0;
                                    const draws = comparison.headToHead.stats?.draws ?? 0;

                                    if (parsedItemCount <= 0 && itemCount > 0) {
                                        return (
                                            <View style={[styles.unparsedH2HBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                                                <View style={[styles.unparsedH2HIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                                    <Ionicons name="alert-circle-outline" size={20} color={colors.mutedText} />
                                                </View>

                                                <View style={styles.unparsedH2HText}>
                                                    <Text style={[styles.unparsedH2HTitle, { color: colors.text }]}>
                                                        {t('compare.directMeetingsFound', { count: itemCount })}
                                                    </Text>
                                                    <Text style={[styles.unparsedH2HSubtitle, { color: colors.mutedText }]}>
                                                        {t('compare.directMeetingsParseMissing')}
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    }

                                    if (parsedItemCount <= 0) {
                                        return (
                                            <Text style={[styles.mutedText, { color: colors.mutedText }]}>
                                                {t('compare.noDirectDuels')}
                                            </Text>
                                        );
                                    }

                                    return (
                                        <>
                                            <View style={styles.h2hScoreRow}>
                                                <View style={[styles.h2hPlayerBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                                                    <Text style={[styles.h2hPlayerName, { color: colors.mutedText }]} numberOfLines={1}>
                                                        {getPlayerName(comparison.left, t)}
                                                    </Text>
                                                    <Text style={[styles.h2hPlayerScore, { color: colors.text }]}>
                                                        {leftWins}
                                                    </Text>
                                                    <Text style={[styles.h2hPlayerHelper, { color: colors.mutedText }]}>
                                                        {formatPercent(comparison.headToHead.stats?.leftWinRate * 100)}
                                                    </Text>
                                                </View>

                                                <View style={[styles.h2hCenterBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                                    <Text style={[styles.h2hCenterLabel, { color: colors.mutedText }]}>{t('compare.record')}</Text>
                                                    <Text style={[styles.h2hCenterScore, { color: colors.text }]}>
                                                        {leftWins}:{rightWins}
                                                    </Text>
                                                    <Text style={[styles.h2hCenterHelper, { color: colors.mutedText }]}>
                                                        {draws > 0 ? `${t('compare.drawsCount', { count: draws })} · ` : ''}{t('compare.matchesCount', { count: parsedItemCount })}
                                                    </Text>
                                                </View>

                                                <View style={[styles.h2hPlayerBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                                                    <Text style={[styles.h2hPlayerName, { color: colors.mutedText }]} numberOfLines={1}>
                                                        {getPlayerName(comparison.right, t)}
                                                    </Text>
                                                    <Text style={[styles.h2hPlayerScore, { color: colors.text }]}>
                                                        {rightWins}
                                                    </Text>
                                                    <Text style={[styles.h2hPlayerHelper, { color: colors.mutedText }]}>
                                                        {formatPercent(comparison.headToHead.stats?.rightWinRate * 100)}
                                                    </Text>
                                                </View>
                                            </View>
                                        </>
                                    );
                                })()
                            ) : (
                                <Text style={[styles.mutedText, { color: colors.mutedText }]}>
                                    {t('compare.noDirectDuels')}
                                </Text>
                            )}
                        </Card>

                        <Card style={styles.eventsCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="time-outline" size={19} color={colors.primary} />
                                <View>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('compare.latestEvents')}</Text>
                                    <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                                        {t('compare.latestEntriesBoth')}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.eventLists}>
                                <RecentEventColumn side="left" player={comparison.left} />
                                <RecentEventColumn side="right" player={comparison.right} />
                            </View>
                        </Card>
                    </>
                ) : null}

                {!loading && !error && !comparison ? (
                    <EmptyState icon="swap-horizontal-outline" title={t('compare.noComparisonFound')} />
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

function PlayerHeroCard({
                            side,
                            player,
                            active,
                            onPress,
                        }: {
    side: SideId;
    player: PlayerCompareSide;
    active: boolean;
    onPress: () => void;
}) {
    const { colors } = useTheme();
    const { t } = useI18n();

    return (
        <Card pressable onPress={onPress} style={styles.playerHeroCard}>
            <View style={styles.playerHeroTop}>
                <View
                    style={[
                        styles.playerAvatar,
                        {
                            backgroundColor: active ? colors.primarySoft : colors.muted,
                            borderColor: active ? colors.primarySoftBorder : colors.border,
                        },
                    ]}
                >
                    <Text style={[styles.playerAvatarText, { color: active ? colors.primary : colors.text }]}>
                        {side === 'left' ? 'A' : 'B'}
                    </Text>
                </View>

                {active ? (
                    <Badge tone="secondary" icon="flash-outline">
                        {t('compare.favorite')}
                    </Badge>
                ) : null}
            </View>

            <Text style={[styles.playerName, { color: colors.text }]} numberOfLines={2}>
                {getPlayerName(player, t)}
            </Text>

            <Text style={[styles.playerClub, { color: colors.mutedText }]} numberOfLines={1}>
                {getClubName(player, t)}
            </Text>

            <View style={styles.playerRatingRow}>
                <View>
                    <Text style={[styles.ratingLabel, { color: colors.mutedText }]}>{t('compare.ttr')}</Text>
                    <Text style={[styles.ratingValue, { color: colors.text }]}>
                        {formatOptionalNumber(player.ratings?.currentTtr)}
                    </Text>
                </View>

                <View style={styles.ratingRight}>
                    <Text style={[styles.ratingLabel, { color: colors.mutedText }]}>{t('compare.qttr')}</Text>
                    <Text style={[styles.ratingValueSmall, { color: colors.text }]}>
                        {formatOptionalNumber(player.ratings?.qttr)}
                    </Text>
                </View>
            </View>

            <Text style={[styles.ratingDate, { color: colors.mutedText }]} numberOfLines={1}>
                {t('compare.asOf', { date: player.ratings?.ttrDate ? formatDate(player.ratings.ttrDate) : t('compare.unknownLower') })}
            </Text>
        </Card>
    );
}

function OddsBar({
                     leftProbability,
                     rightProbability,
                 }: {
    leftProbability?: number | null;
    rightProbability?: number | null;
}) {
    const { colors } = useTheme();

    const left = Math.max(0.05, leftProbability ?? 0.5);
    const right = Math.max(0.05, rightProbability ?? 0.5);

    return (
        <View style={[styles.oddsTrack, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <View
                style={[
                    styles.oddsLeft,
                    {
                        flex: left,
                        backgroundColor: colors.primary,
                    },
                ]}
            />
            <View
                style={[
                    styles.oddsRight,
                    {
                        flex: right,
                        backgroundColor: colors.primarySoftBorder,
                    },
                ]}
            />
        </View>
    );
}

function MetricComparisonRow({
                                 icon,
                                 label,
                                 helper,
                                 leftValue,
                                 rightValue,
                                 difference,
                                 leader,
                                 signed,
                             }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    helper: string;
    leftValue?: number | null;
    rightValue?: number | null;
    difference?: number | null;
    leader?: Leader;
    signed?: boolean;
}) {
    const { colors } = useTheme();
    const { t } = useI18n();

    return (
        <View style={[styles.metricRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <View style={styles.metricHeader}>
                <View style={[styles.metricIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name={icon} size={16} color={colors.mutedText} />
                </View>

                <View style={styles.metricTitleWrap}>
                    <Text style={[styles.metricLabel, { color: colors.text }]}>{label}</Text>
                    <Text style={[styles.metricHelper, { color: colors.mutedText }]}>{helper}</Text>
                </View>

                <Text style={[styles.metricLeader, { color: colors.primary }]}>{getLeaderName(leader, t)}</Text>
            </View>

            <View style={styles.metricValues}>
                <MetricValue
                    value={signed ? formatSignedNumber(leftValue) : formatOptionalNumber(leftValue)}
                    active={leader === 'left'}
                />

                <View style={[styles.diffPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.diffText, { color: colors.mutedText }]}>
                        {isFiniteNumber(difference) ? formatSignedNumber(difference) : '—'}
                    </Text>
                </View>

                <MetricValue
                    value={signed ? formatSignedNumber(rightValue) : formatOptionalNumber(rightValue)}
                    active={leader === 'right'}
                />
            </View>
        </View>
    );
}

function MetricValue({ value, active }: { value: string; active: boolean }) {
    const { colors } = useTheme();

    return (
        <View
            style={[
                styles.metricValueBox,
                {
                    backgroundColor: active ? colors.primarySoft : colors.card,
                    borderColor: active ? colors.primarySoftBorder : colors.border,
                },
            ]}
        >
            <Text style={[styles.metricValueText, { color: active ? colors.primary : colors.text }]}>
                {value}
            </Text>
        </View>
    );
}

function PlayerStatsColumn({
                               label,
                               player,
                               stats,
                               highlighted,
                           }: {
    label: string;
    player: PlayerCompareSide;
    stats: RecentStats | null;
    highlighted: boolean;
}) {
    const { colors } = useTheme();
    const { t } = useI18n();

    if (!stats) return null;

    return (
        <View
            style={[
                styles.statsColumn,
                {
                    backgroundColor: highlighted ? colors.primarySoft : colors.muted,
                    borderColor: highlighted ? colors.primarySoftBorder : colors.border,
                },
            ]}
        >
            <View style={styles.statsColumnHeader}>
                <Text style={[styles.statsColumnLabel, { color: colors.mutedText }]}>{label}</Text>
                <Text style={[styles.statsColumnName, { color: colors.text }]} numberOfLines={1}>
                    {getPlayerName(player, t)}
                </Text>
            </View>

            <View style={styles.statGrid}>
                <SmallStat label={t('compare.matches')} value={String(stats.matchCount)} helper={`${stats.wins}:${stats.losses}`} />
                <SmallStat label={t('compare.quote')} value={formatPercent(stats.winRate)} helper={t('compare.won')} />
                <SmallStat label={t('compare.events')} value={String(stats.eventCount)} helper={t('compare.history')} />
                <SmallStat label={t('compare.total')} value={formatSignedNumber(stats.totalDelta)} helper={t('compare.ttr')} />
                <SmallStat label={t('compare.averageShort')} value={formatSignedAverage(stats.averageDelta)} helper={t('compare.perEvent')} />
                <SmallStat label={t('compare.top')} value={formatSignedNumber(stats.bestGain)} helper={t('compare.jump')} />
            </View>
        </View>
    );
}

function SmallStat({
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
        <View style={[styles.smallStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.smallStatLabel, { color: colors.mutedText }]}>{label}</Text>
            <Text style={[styles.smallStatValue, { color: colors.text }]} numberOfLines={1}>
                {value}
            </Text>
            <Text style={[styles.smallStatHelper, { color: colors.mutedText }]} numberOfLines={1}>
                {helper}
            </Text>
        </View>
    );
}

function H2HTile({
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
        <View style={[styles.h2hTile, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.h2hLabel, { color: colors.mutedText }]} numberOfLines={1}>
                {label}
            </Text>
            <Text style={[styles.h2hValue, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.h2hHelper, { color: colors.mutedText }]}>{helper}</Text>
        </View>
    );
}

function RecentEventColumn({
                               side,
                               player,
                           }: {
    side: SideId;
    player: PlayerCompareSide;
}) {
    const { colors } = useTheme();
    const { t } = useI18n();
    const events = sortEventsNewestFirst(getEvents(player)).slice(0, 5);

    return (
        <View style={styles.eventColumn}>
            <View style={styles.eventColumnHeader}>
                <Text style={[styles.eventColumnSide, { color: colors.primary }]}>
                    {side === 'left' ? t('compare.left') : t('compare.right')}
                </Text>
                <Text style={[styles.eventColumnName, { color: colors.text }]} numberOfLines={1}>
                    {getPlayerName(player, t)}
                </Text>
            </View>

            {events.length > 0 ? (
                events.map((event) => <RecentEventCard key={`${side}-${event.event_id}`} event={event} />)
            ) : (
                <Text style={[styles.mutedText, { color: colors.mutedText }]}>
                    {t('compare.noEvents')}
                </Text>
            )}
        </View>
    );
}

function RecentEventCard({ event }: { event: RecentEvent }) {
    const { colors } = useTheme();
    const { t } = useI18n();

    const delta = numberFromUnknown(event.ttr_delta);
    const deltaColor =
        delta === undefined
            ? colors.mutedText
            : delta > 0
                ? '#16a34a'
                : delta < 0
                    ? colors.destructive
                    : colors.mutedText;

    return (
        <View style={[styles.recentEventCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <View style={styles.recentEventTop}>
                <Text style={[styles.recentEventName, { color: colors.text }]} numberOfLines={2}>
                    {event.event_name ?? t('compare.unknownEvent')}
                </Text>

                <View style={styles.recentEventScore}>
                    <Text style={[styles.recentEventTtr, { color: colors.text }]}>
                        {formatOptionalNumber(event.ttr_after)}
                    </Text>
                    <Text style={[styles.recentEventDelta, { color: deltaColor }]}>
                        {formatSignedNumber(delta)}
                    </Text>
                </View>
            </View>

            <View style={styles.recentEventMeta}>
                <Ionicons name="calendar-outline" size={13} color={colors.mutedText} />
                <Text style={[styles.recentEventDate, { color: colors.mutedText }]} numberOfLines={1}>
                    {event.event_date_time ? formatDate(event.event_date_time) : t('common.dateUnknown')}
                </Text>
            </View>

            <View style={styles.eventBottomRow}>
                <Badge tone="outline">
                    {formatOptionalNumber(event.ttr_before)} → {formatOptionalNumber(event.ttr_after)}
                </Badge>

                <Badge tone="secondary" icon="tennisball-outline">
                    {t('compare.matchesCount', { count: getEventMatchCount(event) })}
                </Badge>

                <Badge tone="outline">
                    {getEventWins(event)}:{getEventLosses(event)}
                </Badge>
            </View>
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
    headerIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleBlock: {
        marginTop: -6,
        gap: 2,
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
    playersRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: 10,
    },
    playerHeroCard: {
        flex: 1,
        padding: 14,
        gap: 10,
    },
    playerHeroTop: {
        minHeight: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    playerAvatar: {
        width: 34,
        height: 34,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playerAvatarText: {
        fontSize: 14,
        lineHeight: 18,
        fontWeight: '900',
    },
    playerName: {
        fontSize: 16,
        lineHeight: 21,
        fontWeight: '900',
    },
    playerClub: {
        fontSize: 12,
        lineHeight: 17,
        fontWeight: '700',
    },
    playerRatingRow: {
        marginTop: 2,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 8,
    },
    ratingRight: {
        alignItems: 'flex-end',
    },
    ratingLabel: {
        fontSize: 11,
        lineHeight: 15,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.2,
    },
    ratingValue: {
        fontSize: 28,
        lineHeight: 34,
        fontWeight: '900',
    },
    ratingValueSmall: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: '900',
    },
    ratingDate: {
        fontSize: 11,
        lineHeight: 15,
        fontWeight: '700',
    },
    vsBubble: {
        alignSelf: 'center',
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: -2,
        zIndex: 2,
    },
    vsText: {
        fontSize: 11,
        lineHeight: 15,
        fontWeight: '900',
    },
    centerRow: {
        alignItems: 'center',
        marginTop: -6,
    },
    favoriteCard: {
        padding: 16,
        gap: 14,
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
    favoriteMainRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 14,
    },
    favoriteSide: {
        flex: 1,
    },
    favoriteSideRight: {
        flex: 1,
        alignItems: 'flex-end',
    },
    favoriteName: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '800',
    },
    favoritePercent: {
        marginTop: 2,
        fontSize: 26,
        lineHeight: 32,
        fontWeight: '900',
    },
    oddsTrack: {
        height: 16,
        borderRadius: 999,
        borderWidth: 1,
        overflow: 'hidden',
        flexDirection: 'row',
    },
    oddsLeft: {
        height: '100%',
    },
    oddsRight: {
        height: '100%',
    },
    eventBottomRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    comparisonCard: {
        padding: 16,
        gap: 14,
    },
    metricStack: {
        gap: 10,
    },
    metricRow: {
        borderWidth: 1,
        borderRadius: 18,
        padding: 12,
        gap: 12,
    },
    metricHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metricIcon: {
        width: 28,
        height: 28,
        borderRadius: 11,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricTitleWrap: {
        flex: 1,
    },
    metricLabel: {
        fontSize: 14,
        lineHeight: 19,
        fontWeight: '900',
    },
    metricHelper: {
        marginTop: 1,
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '700',
    },
    metricLeader: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '900',
    },
    metricValues: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metricValueBox: {
        flex: 1,
        minHeight: 42,
        borderWidth: 1,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    metricValueText: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: '900',
    },
    diffPill: {
        minWidth: 58,
        minHeight: 34,
        borderRadius: 999,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    diffText: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '900',
    },
    statsCard: {
        padding: 16,
        gap: 14,
    },
    doubleStatsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    statsColumn: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 18,
        padding: 12,
        gap: 10,
    },
    statsColumnHeader: {
        gap: 2,
    },
    statsColumnLabel: {
        fontSize: 11,
        lineHeight: 15,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.2,
    },
    statsColumnName: {
        fontSize: 14,
        lineHeight: 19,
        fontWeight: '900',
    },
    statGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    smallStat: {
        width: '47%',
        minWidth: 78,
        flexGrow: 1,
        borderWidth: 1,
        borderRadius: 14,
        padding: 9,
        gap: 2,
    },
    smallStatLabel: {
        fontSize: 10,
        lineHeight: 14,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    smallStatValue: {
        fontSize: 17,
        lineHeight: 22,
        fontWeight: '900',
    },
    smallStatHelper: {
        fontSize: 10,
        lineHeight: 14,
        fontWeight: '700',
    },
    headToHeadCard: {
        padding: 16,
        gap: 14,
    },
    h2hGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    h2hTile: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 16,
        padding: 11,
        gap: 3,
        alignItems: 'center',
    },
    h2hLabel: {
        fontSize: 11,
        lineHeight: 15,
        fontWeight: '900',
        textAlign: 'center',
    },
    h2hValue: {
        fontSize: 24,
        lineHeight: 30,
        fontWeight: '900',
    },
    h2hHelper: {
        fontSize: 11,
        lineHeight: 15,
        fontWeight: '700',
    },
    noteText: {
        fontSize: 12,
        lineHeight: 17,
        fontWeight: '600',
    },
    eventsCard: {
        padding: 16,
        gap: 14,
    },
    eventLists: {
        gap: 14,
    },
    eventColumn: {
        gap: 10,
    },
    eventColumnHeader: {
        gap: 2,
    },
    eventColumnSide: {
        fontSize: 11,
        lineHeight: 15,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.2,
    },
    eventColumnName: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '900',
    },
    recentEventCard: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 12,
        gap: 9,
    },
    recentEventTop: {
        flexDirection: 'row',
        gap: 10,
    },
    recentEventName: {
        flex: 1,
        fontSize: 14,
        lineHeight: 19,
        fontWeight: '900',
    },
    recentEventScore: {
        alignItems: 'flex-end',
        minWidth: 52,
    },
    recentEventTtr: {
        fontSize: 20,
        lineHeight: 25,
        fontWeight: '900',
    },
    recentEventDelta: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '900',
    },
    recentEventMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    recentEventDate: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '700',
    },
    mutedText: {
        fontSize: 14,
        lineHeight: 20,
    },
    headToHeadTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    infoButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoBubble: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 12,
    },
    infoBubbleText: {
        fontSize: 12,
        lineHeight: 17,
        fontWeight: '700',
    },
    unparsedH2HBox: {
        borderWidth: 1,
        borderRadius: 18,
        padding: 13,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
    },
    unparsedH2HIcon: {
        width: 38,
        height: 38,
        borderRadius: 15,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unparsedH2HText: {
        flex: 1,
    },
    unparsedH2HTitle: {
        fontSize: 14,
        lineHeight: 19,
        fontWeight: '900',
    },
    unparsedH2HSubtitle: {
        marginTop: 2,
        fontSize: 12,
        lineHeight: 17,
        fontWeight: '700',
    },
    h2hScoreRow: {
        flexDirection: 'row',
        gap: 10,
    },
    h2hPlayerBox: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 18,
        padding: 11,
        alignItems: 'center',
        gap: 3,
    },
    h2hPlayerName: {
        fontSize: 11,
        lineHeight: 15,
        fontWeight: '900',
        textAlign: 'center',
    },
    h2hPlayerScore: {
        fontSize: 26,
        lineHeight: 32,
        fontWeight: '900',
    },
    h2hPlayerHelper: {
        fontSize: 11,
        lineHeight: 15,
        fontWeight: '700',
    },
    h2hCenterBox: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 18,
        padding: 11,
        alignItems: 'center',
        gap: 3,
    },
    h2hCenterLabel: {
        fontSize: 11,
        lineHeight: 15,
        fontWeight: '900',
    },
    h2hCenterScore: {
        fontSize: 24,
        lineHeight: 30,
        fontWeight: '900',
    },
    h2hCenterHelper: {
        fontSize: 11,
        lineHeight: 15,
        fontWeight: '700',
        textAlign: 'center',
    },
});
