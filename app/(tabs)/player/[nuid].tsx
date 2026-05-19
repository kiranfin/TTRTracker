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
    View,
} from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { ttApi } from '../../../src/api/tttracker';
import { Badge } from '../../../src/components/Badge';
import { Button } from '../../../src/components/Button';
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
    ttrTone,
} from '../../../src/utils/normalizers';

const PAGE_SIZE = 10;

export default function PlayerDetailsScreen() {
    const params = useLocalSearchParams<Record<string, string>>();
    const { colors } = useTheme();

    const [history, setHistory] = useState<NormalizedPlayerTtrHistory | null>(null);
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
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
                return;
            }

            setLoading(true);
            setError(null);
            setPage(0);
            setExpandedEventId(null);

            try {
                const response = await ttApi.getPlayerTtrHistory(nuid);
                setHistory(normalizePlayerTtrHistory(response));
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : 'TTR-Historie konnte nicht geladen werden');
            } finally {
                setLoading(false);
            }
        }

        load().catch(() => undefined);
    }, [nuid]);

    const displayName = history?.personName ?? title;
    const clubName = history?.clubName ?? params.clubName;
    const routeTtr = Number(params.ttr);
    const currentTtr = history?.ttr ?? (Number.isFinite(routeTtr) && routeTtr > 0 ? routeTtr : undefined);

    const allEventsNewestFirst = useMemo(() => {
        return [...(history?.events ?? [])].reverse();
    }, [history?.events]);

    const pageCount = Math.max(1, Math.ceil(allEventsNewestFirst.length / PAGE_SIZE));

    const pageEvents = useMemo(() => {
        const start = page * PAGE_SIZE;
        return allEventsNewestFirst.slice(start, start + PAGE_SIZE);
    }, [allEventsNewestFirst, page]);

    const chartEvents = useMemo(() => {
        return [...(history?.events ?? [])]
            .filter((event) => event.ttr !== undefined)
            .slice(-26);
    }, [history?.events]);

    const peakEvent = useMemo(() => {
        return chartEvents.reduce<NormalizedTtrHistoryEvent | null>((peak, event) => {
            if (event.ttr === undefined) return peak;
            if (!peak || (peak.ttr ?? 0) < event.ttr) return event;
            return peak;
        }, null);
    }, [chartEvents]);

    function goPreviousPage() {
        setPage((current) => Math.max(0, current - 1));
        setExpandedEventId(null);
    }

    function goNextPage() {
        setPage((current) => Math.min(pageCount - 1, current + 1));
        setExpandedEventId(null);
    }

    function toggleExpanded(eventId: string) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedEventId((current) => (current === eventId ? null : eventId));
    }

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
                        <Card style={styles.summaryCard}>
                            <View style={styles.summaryTopRow}>
                                <View style={[styles.summaryIcon, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder }]}>
                                    <Ionicons name="analytics-outline" size={23} color={colors.primary} />
                                </View>

                                <View style={styles.summaryText}>
                                    <Text style={[styles.summaryLabel, { color: colors.mutedText }]}>TTR Übersicht</Text>
                                    <Text style={[styles.summaryTitle, { color: colors.text }]}>
                                        {currentTtr ? `Aktuell ${currentTtr}` : 'Keine aktuelle Wertung'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.badgeRow}>
                                {currentTtr ? <Badge tone={ttrTone(currentTtr)} icon="trophy-outline">Aktuell {currentTtr}</Badge> : null}
                                {history?.maxTtr ? <Badge tone="outline">Peak {history.maxTtr}</Badge> : null}
                                {history?.ttrDate ? <Badge tone="secondary">{formatDate(history.ttrDate)}</Badge> : null}
                            </View>
                        </Card>

                        <Card style={styles.infoCard}>
                            <InfoRow label="Verein" value={clubName ?? 'Nicht verfügbar'} />
                            <InfoRow label="Bundesland" value={params.state || 'Nicht verfügbar'} />
                            <InfoRow label="TTR-Datum" value={history?.ttrDate ? formatDate(history.ttrDate) : 'Nicht verfügbar'} />
                            <InfoRow label="Max. TTR Datum" value={history?.maxTtrDate ? formatDate(history.maxTtrDate) : 'Nicht verfügbar'} />
                        </Card>

                        <Card style={styles.chartCard}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="trending-up-outline" size={19} color={colors.primary} />
                                <View>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Verlauf</Text>
                                    <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                                        TTR-Kurve mit Peak-Markierung
                                    </Text>
                                </View>
                            </View>

                            {chartEvents.length > 1 ? (
                                <TtrLineChart events={chartEvents} peakEvent={peakEvent} />
                            ) : (
                                <Text style={[styles.mutedText, { color: colors.mutedText }]}>
                                    Für eine Kurve sind noch nicht genug TTR-Werte vorhanden.
                                </Text>
                            )}
                        </Card>

                        <View style={styles.historyHeader}>
                            <View>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Historie</Text>
                                <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                                    {allEventsNewestFirst.length} Einträge · Seite {page + 1} von {pageCount}
                                </Text>
                            </View>

                            <Badge tone="secondary">{pageEvents.length}/{allEventsNewestFirst.length}</Badge>
                        </View>

                        {allEventsNewestFirst.length === 0 ? (
                            <EmptyState icon="time-outline" title="Keine Historie gefunden" />
                        ) : (
                            <>
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

                                {allEventsNewestFirst.length > PAGE_SIZE ? (
                                    <Card style={styles.paginationCard}>
                                        <Button variant="outline" icon="chevron-back" disabled={page === 0} onPress={goPreviousPage}>
                                            Zurück
                                        </Button>

                                        <Text style={[styles.pageText, { color: colors.mutedText }]}>
                                            {page + 1} / {pageCount}
                                        </Text>

                                        <Button variant="outline" icon="chevron-forward" disabled={page >= pageCount - 1} onPress={goNextPage}>
                                            Weiter
                                        </Button>
                                    </Card>
                                ) : null}
                            </>
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

function InfoRow({ label, value }: { label: string; value: string }) {
    const { colors } = useTheme();

    return (
        <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.mutedText }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>
                {value}
            </Text>
        </View>
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
    const deltaLabel = delta > 0 ? `+${delta}` : String(delta);

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
                        {event.ttrAfter ?? event.ttr ?? '-'}
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

                {event.matchCount !== undefined ? (
                    <Badge tone="secondary" icon="tennisball-outline">{event.matchCount} Spiele</Badge>
                ) : null}

                {(event.matchesWon || event.matchesLost) ? (
                    <Badge tone="outline">{event.matchesWon ?? '0'}:{event.matchesLost ?? '0'}</Badge>
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
                        {match.otherTtr ? ` · TTR ${match.otherTtr}` : ''}
                    </Text>
                </View>

                <View style={[styles.matchResultBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.matchResultText, { color: colors.text }]}>{result}</Text>
                </View>
            </View>

            <View style={styles.matchTeamsRow}>
                <Text style={[styles.matchTeamText, { color: colors.mutedText }]} numberOfLines={2}>
                    {match.ownTeamName ?? '-'} : {match.otherTeamName ?? '-'}
                </Text>
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
                          peakEvent,
                      }: {
    events: NormalizedTtrHistoryEvent[];
    peakEvent: NormalizedTtrHistoryEvent | null;
}) {
    const { colors } = useTheme();

    const width = 320;
    const height = 180;
    const paddingX = 22;
    const paddingY = 24;

    const values = events
        .map((event) => event.ttr)
        .filter((value): value is number => typeof value === 'number');

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);

    const points = events.map((event, index) => {
        const value = event.ttr ?? min;
        const x = paddingX + (index / Math.max(1, events.length - 1)) * (width - paddingX * 2);
        const y = height - paddingY - ((value - min) / range) * (height - paddingY * 2);
        return { x, y, value, event };
    });

    const path = points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');

    const peakPoint = points.reduce<typeof points[number] | null>((peak, point) => {
        if (!peak || point.value > peak.value) return point;
        return peak;
    }, null);

    return (
        <View style={styles.lineChartWrap}>
            <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
                <Line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke={colors.border} strokeWidth="1" />
                <Line x1={paddingX} y1={paddingY} x2={paddingX} y2={height - paddingY} stroke={colors.border} strokeWidth="1" />

                <Path d={path} fill="none" stroke={colors.primary} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

                {points.map((point, index) => (
                    <Circle key={`${point.event.id}-${index}`} cx={point.x} cy={point.y} r={3.5} fill={colors.primary} />
                ))}

                {peakPoint ? (
                    <>
                        <Circle cx={peakPoint.x} cy={peakPoint.y} r={7} fill={colors.card} stroke={colors.primary} strokeWidth="3" />
                        <SvgText
                            x={Math.min(width - 76, Math.max(34, peakPoint.x - 28))}
                            y={Math.max(16, peakPoint.y - 12)}
                            fill={colors.primary}
                            fontSize="12"
                            fontWeight="800"
                        >
                            Peak {peakPoint.value}
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

            {peakEvent?.date ? (
                <Text style={[styles.chartHint, { color: colors.mutedText }]}>
                    Höchster Punkt: {peakEvent.ttr} am {formatDate(peakEvent.date)}
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 16,
        paddingTop: 0,
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
    summaryCard: {
        padding: 16,
        gap: 14,
    },
    summaryTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    summaryIcon: {
        width: 50,
        height: 50,
        borderRadius: 18,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryText: {
        flex: 1,
    },
    summaryLabel: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '800',
    },
    summaryTitle: {
        marginTop: 2,
        fontSize: 22,
        lineHeight: 28,
        fontWeight: '900',
    },
    infoCard: {
        padding: 16,
        gap: 10,
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    infoRow: {
        minHeight: 42,
        paddingVertical: 9,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    infoLabel: {
        fontSize: 14,
        lineHeight: 20,
    },
    infoValue: {
        flex: 1,
        textAlign: 'right',
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '800',
    },
    chartCard: {
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
    mutedText: {
        fontSize: 14,
        lineHeight: 20,
    },
    lineChartWrap: {
        gap: 8,
    },
    chartHint: {
        fontSize: 12,
        lineHeight: 17,
        fontWeight: '700',
        textAlign: 'center',
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    matchTeamsRow: {
        gap: 4,
    },
    matchTeamText: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '700',
    },
    paginationCard: {
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    pageText: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '900',
    },
});