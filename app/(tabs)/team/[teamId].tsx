import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ttApi } from '@/src/api/tttracker';
import { ActionButton } from '@/src/components/ActionButton';
import { Avatar } from '@/src/components/Avatar';
import { Card } from '@/src/components/Card';
import { DataFreshness } from '@/src/components/DataFreshness';
import { ClubLogo } from '@/src/components/ClubLogo';
import { Chip, ChipRow } from '@/src/components/Chip';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SegmentedTabs } from '@/src/components/SegmentedTabs';
import { StatStrip } from '@/src/components/StatStrip';
import { typography } from '@/src/theme/typography';
import { formatSeasonLong, getCurrentSeason } from '@/src/utils/dates';
import { openClub } from '@/src/features/club-details/navigation';
import { useApiUpdates } from '@/src/hooks/useApiUpdates';
import { useLiveMatches } from '@/src/hooks/useLiveMatches';
import { useI18n } from '@/src/i18n/I18nProvider';
import { describeApiError } from '@/src/utils/apiErrors';
import { getResponseFreshness, type Freshness } from '@/src/utils/staleness';
import { useTheme } from '@/src/theme/ThemeProvider';
import { InfosTab, LineupTab, ScheduleTab, BalancesTab } from '../../../src/features/team-details/components';
import { styles } from '../../../src/features/team-details/styles';
import { slugifyMyttPathSegment, normalizeSeasonForApi, normalizeLineup, enrichLineupWithTtr, applyTtrToPlayers, normalizeTeamInfo, normalizeTeamSchedule, normalizeBalances, filterScheduleByRound, buildScheduleSummary, buildBalanceSummary } from '../../../src/features/team-details/utils';
import type { DetailTab, RoundFilter, TeamInfo, TeamPlayer, TeamScheduleMatch, TeamBalance, TeamContext, TeamApiClient } from '../../../src/features/team-details/types';
import { SkeletonList } from '@/src/components/SkeletonRow';

export default function TeamDetailsScreen() {
    const params = useLocalSearchParams<Record<string, string>>();
    const { colors } = useTheme();
    const { t, language } = useI18n();

    const [activeTab, setActiveTab] = useState<DetailTab>('infos');
    const [roundFilter, setRoundFilter] = useState<RoundFilter>('gesamt');
    const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
    const [lineup, setLineup] = useState<TeamPlayer[]>([]);
    const [loadedSchedule, setSchedule] = useState<TeamScheduleMatch[]>([]);
    // Laufende Begegnungen mit dem Stand aus dem Spielbericht, der Spielplan kennt ihn nicht.
    // Nur Spiele genau dieser Mannschaft werden live abgefragt.
    const isThisTeamMatch = useCallback(
        (match: TeamScheduleMatch) => Boolean(params.teamId) && (match.homeTeamId === params.teamId || match.awayTeamId === params.teamId),
        [params.teamId],
    );
    const schedule = useLiveMatches(loadedSchedule, { isRelevant: isThisTeamMatch, label: 'team' });
    const [balancesByRound, setBalancesByRound] = useState<Record<RoundFilter, TeamBalance[]>>({
        gesamt: [],
        vr: [],
        rr: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<string | null>(null);
    const [playersFreshness, setPlayersFreshness] = useState<Freshness | null>(null);
    const [scheduleFreshness, setScheduleFreshness] = useState<Freshness | null>(null);
    const [balancesFreshness, setBalancesFreshness] = useState<Freshness | null>(null);
    // Wird erhöht, wenn die App Daten dieser Mannschaft im Hintergrund aktualisiert hat. Dann wird still neu gelesen.
    const [refreshTick, setRefreshTick] = useState(0);
    const silentRef = useRef(false);
    // Aktueller TTR je Spieler (playerId -> TTR), damit er beim stillen Neuladen erhalten bleibt.
    const ttrByPlayerIdRef = useRef<Map<string, string>>(new Map());
    // Mannschaft, deren Aufstellung schon angereichert wurde oder gerade angereichert wird.
    const enrichedTeamRef = useRef<string | null>(null);
    const ttrWarningRef = useRef<string | null>(null);
    const lineupRef = useRef<TeamPlayer[]>([]);
    const teamIdRef = useRef('');
    // Runden der Bilanzen, die schon geladen wurden (Schlüssel teamId:runde:refreshTick).
    const loadedRoundsRef = useRef<Set<string>>(new Set());
    const [roundLoading, setRoundLoading] = useState(false);

    const team = useMemo<TeamContext>(
        () => {
            const teamName = params.teamName ?? t('team.defaultTitle');

            return {
                teamId: params.teamId ?? '',
                teamName,
                teamNameSlug: params.teamNameSlug ?? slugifyMyttPathSegment(teamName),
                leagueTitle: params.leagueTitle,
                association: params.association,
                groupId: params.groupId,
                season: params.season || getCurrentSeason(),
                apiSeason: normalizeSeasonForApi(params.season || getCurrentSeason()),
                leagueSlug: params.leagueSlug ?? 'x',
            };
        },
        [
            params.association,
            params.groupId,
            params.leagueSlug,
            params.leagueTitle,
            params.season,
            params.teamId,
            params.teamName,
            params.teamNameSlug,
            t,
        ],
    );

    teamIdRef.current = team.teamId;
    lineupRef.current = lineup;

    const hasLeagueContext = useMemo(
        () => Boolean(team.association && team.groupId && team.leagueSlug && team.teamNameSlug && team.apiSeason),
        [team.apiSeason, team.association, team.groupId, team.leagueSlug, team.teamNameSlug],
    );

    // Beim Wechsel der Mannschaft gehört nichts von der vorigen mehr dazu.
    useEffect(() => {
        ttrByPlayerIdRef.current = new Map();
        enrichedTeamRef.current = null;
        ttrWarningRef.current = null;
        loadedRoundsRef.current = new Set();
        setBalancesByRound({ gesamt: [], vr: [], rr: [] });
    }, [team.teamId]);

    const applyKnownTtr = useCallback(
        (players: TeamPlayer[]) => applyTtrToPlayers(players, ttrByPlayerIdRef.current),
        [],
    );

    useEffect(() => {
        async function loadTeam() {
            const api = ttApi as unknown as TeamApiClient;

            if (!team.teamId) {
                setLoading(false);
                setError(t('team.missingTeamId'));
                return;
            }

            if (!api.getTeamPlayers) {
                setLoading(false);
                setError(t('team.teamPlayersApiMissing'));
                return;
            }

            const silent = silentRef.current;
            silentRef.current = false;

            if (!silent) {
                setLoading(true);
                setError(null);
                setWarning(null);
            }

            try {
                // Bilanzen für Vor- und Rückrunde laden erst, wenn sie gebraucht werden (Tab "Bilanzen").
                const [
                    playersResult,
                    infoResult,
                    scheduleResult,
                    balancesGesamtResult,
                ] = await Promise.allSettled([
                    api.getTeamPlayers(team.teamId),
                    hasLeagueContext && api.getTeamInfos
                        ? api.getTeamInfos(
                            team.association!,
                            team.apiSeason,
                            team.groupId!,
                            team.leagueSlug,
                            team.teamId,
                            team.teamNameSlug,
                        )
                        : Promise.resolve(null),
                    hasLeagueContext && api.getTeamSchedule
                        ? api.getTeamSchedule(
                            team.association!,
                            team.apiSeason,
                            team.groupId!,
                            team.leagueSlug,
                            team.teamId,
                            team.teamNameSlug,
                            'gesamt',
                        )
                        : Promise.resolve(null),
                    hasLeagueContext && api.getTeamBalances
                        ? api.getTeamBalances(
                            team.association!,
                            team.apiSeason,
                            team.groupId!,
                            team.leagueSlug,
                            team.teamId,
                            team.teamNameSlug,
                            'gesamt',
                        )
                        : Promise.resolve(null),
                ]);

                const warnings: string[] = [];

                setPlayersFreshness(
                    playersResult.status === 'fulfilled' ? getResponseFreshness(playersResult.value) : null,
                );
                setScheduleFreshness(
                    scheduleResult.status === 'fulfilled' ? getResponseFreshness(scheduleResult.value) : null,
                );
                setBalancesFreshness(
                    balancesGesamtResult.status === 'fulfilled' ? getResponseFreshness(balancesGesamtResult.value) : null,
                );

                if (playersResult.status === 'fulfilled') {
                    // Der aktuelle TTR kommt erst im Tab "Aufstellung" (siehe Effekt unten). Bis dahin gilt der Q-TTR
                    // aus der Meldung, bereits geladene Werte bleiben erhalten.
                    setLineup(applyKnownTtr(normalizeLineup(playersResult.value, team.teamName, t)));

                    if (ttrWarningRef.current) {
                        warnings.push(ttrWarningRef.current);
                    }
                } else {
                    setLineup([]);
                    warnings.push(t('team.lineupLoadError'));
                }

                if (infoResult.status === 'fulfilled') {
                    setTeamInfo(
                        normalizeTeamInfo(
                            infoResult.value,
                            scheduleResult.status === 'fulfilled' ? scheduleResult.value : undefined,
                        ),
                    );
                } else {
                    setTeamInfo(null);
                    warnings.push(t('team.infosLoadError'));
                }

                if (scheduleResult.status === 'fulfilled') {
                    setSchedule(normalizeTeamSchedule(scheduleResult.value, team, t, language));
                } else {
                    setSchedule([]);
                    warnings.push(t('team.scheduleLoadError'));
                }

                const gesamtBalances =
                    balancesGesamtResult.status === 'fulfilled'
                        ? normalizeBalances(balancesGesamtResult.value, t)
                        : [];

                // Schon geladene Vor- und Rückrunde bleiben erhalten.
                setBalancesByRound((current) => ({ ...current, gesamt: gesamtBalances }));

                if (balancesGesamtResult.status === 'rejected') {
                    warnings.push(t('team.balancesLoadError'));
                }

                if (!hasLeagueContext) {
                    warnings.push(
                        t('team.missingLeagueContext'),
                    );
                }

                setWarning(warnings.length > 0 ? warnings.join('\n') : null);
            } catch (loadError) {
                setError(describeApiError(loadError, t, 'team.loadError'));
            } finally {
                setLoading(false);
            }
        }

        loadTeam().catch(() => undefined);
    }, [
        applyKnownTtr,
        hasLeagueContext,
        team.apiSeason,
        team.association,
        team.groupId,
        team.leagueSlug,
        team.teamId,
        team.teamName,
        team.teamNameSlug,
        language,
        refreshTick,
        t,
    ]);

    // Aktueller TTR je Spieler erst im Tab "Aufstellung", einmal pro Mannschaft. Ohne myTischtennis Verbindung
    // fragt enrichLineupWithTtr nichts an. Pro Spieler gilt der gemerkte Wert 12 Stunden.
    const hasLineup = lineup.length > 0;

    useEffect(() => {
        if (activeTab !== 'lineup' || loading || !hasLineup || !team.teamId) return;
        if (enrichedTeamRef.current === team.teamId) return;

        const teamId = team.teamId;

        enrichedTeamRef.current = teamId;

        enrichLineupWithTtr(lineupRef.current, ttApi as unknown as TeamApiClient)
            .then((result) => {
                // Späte Antwort für eine andere Mannschaft verwerfen.
                if (teamIdRef.current !== teamId) return;

                result.ttrByPlayerId.forEach((ttr, playerId) => ttrByPlayerIdRef.current.set(playerId, ttr));

                const merged = applyKnownTtr(lineupRef.current);

                setLineup(merged);

                const missing = result.connected
                    ? merged.filter((player) => Boolean(player.id) && !player.qttr).length
                    : 0;

                if (missing > 0) {
                    const message = t('team.ttrWarnings', { count: missing });

                    ttrWarningRef.current = message;
                    setWarning((current) => (current ? `${current}\n${message}` : message));
                }
            })
            .catch(() => {
                if (enrichedTeamRef.current === teamId) enrichedTeamRef.current = null;
            });
    }, [activeTab, applyKnownTtr, hasLineup, loading, t, team.teamId]);

    // Bilanzen für Vor- und Rückrunde erst beim Öffnen des Tabs. Nach einem Update im Hintergrund (refreshTick)
    // wird die gewählte Runde neu gelesen, das kostet keinen myTischtennis Request, sondern kommt vom Gerät.
    useEffect(() => {
        const api = ttApi as unknown as TeamApiClient;

        if (activeTab !== 'balances' || roundFilter === 'gesamt' || !hasLeagueContext || !api.getTeamBalances) return;

        const teamId = team.teamId;
        const loadKey = `${teamId}:${roundFilter}:${refreshTick}`;

        if (!teamId || loadedRoundsRef.current.has(loadKey)) return;

        loadedRoundsRef.current.add(loadKey);

        let active = true;

        setRoundLoading(true);

        api.getTeamBalances(
            team.association!,
            team.apiSeason,
            team.groupId!,
            team.leagueSlug,
            teamId,
            team.teamNameSlug,
            roundFilter,
        )
            .then((response) => {
                if (!active) return;

                setBalancesByRound((current) => ({ ...current, [roundFilter]: normalizeBalances(response, t) }));
            })
            .catch(() => {
                loadedRoundsRef.current.delete(loadKey);

                if (!active) return;

                const message = t('team.balancesLoadError');

                setWarning((current) => (current?.includes(message) ? current : current ? `${current}\n${message}` : message));
            })
            .finally(() => {
                if (active) setRoundLoading(false);
            });

        return () => {
            active = false;
            setRoundLoading(false);
        };
    }, [
        activeTab,
        hasLeagueContext,
        refreshTick,
        roundFilter,
        t,
        team.apiSeason,
        team.association,
        team.groupId,
        team.leagueSlug,
        team.teamId,
        team.teamNameSlug,
    ]);

    const isTeamPath = useCallback(
        (path: string) => path.startsWith('/api/teams/') && path.includes(`/${encodeURIComponent(team.teamId)}/`),
        [team.teamId],
    );

    useApiUpdates(team.teamId ? isTeamPath : null, () => {
        silentRef.current = true;
        setRefreshTick((tick) => tick + 1);
    });

    const localizedTabOptions = useMemo(
        () => [
            { value: 'infos' as const, label: t('team.infosTab'), icon: 'information-circle-outline' as const },
            { value: 'lineup' as const, label: t('team.lineupTab'), icon: 'people-outline' as const },
            { value: 'schedule' as const, label: t('team.scheduleTab'), icon: 'calendar-outline' as const },
            { value: 'balances' as const, label: t('team.balancesTab'), icon: 'stats-chart-outline' as const },
        ],
        [t],
    );

    const localizedRoundOptions = useMemo(
        () => [
            { value: 'gesamt' as const, label: t('team.totalRound') },
            { value: 'vr' as const, label: t('team.firstHalf') },
            { value: 'rr' as const, label: t('team.secondHalf') },
        ],
        [t],
    );

    const filteredSchedule = useMemo(
        () => filterScheduleByRound(schedule, roundFilter),
        [schedule, roundFilter],
    );

    const scheduleSummary = useMemo(
        () => buildScheduleSummary(schedule, team),
        [schedule, team],
    );

    const filteredScheduleSummary = useMemo(
        () => buildScheduleSummary(filteredSchedule, team),
        [filteredSchedule, team],
    );

    const currentBalances = useMemo(
        () => balancesByRound[roundFilter] ?? [],
        [balancesByRound, roundFilter],
    );

    const balanceSummary = useMemo(
        () => buildBalanceSummary(balancesByRound.gesamt),
        [balancesByRound],
    );

    const currentBalanceSummary = useMemo(
        () => buildBalanceSummary(currentBalances),
        [currentBalances],
    );

    // Verein der Mannschaft. Der Verband kommt nur von dort, wo er sicher zum Verein gehört (nicht der der Liga),
    // sonst gäbe es kein Logo und keinen Link statt eines falschen.
    const clubOrganization = params.clubOrganization || undefined;
    const clubNumber = params.clubNumber || undefined;
    const canOpenClub = Boolean(clubOrganization && clubNumber);

    function openOwnClub() {
        openClub({ organization: clubOrganization, clubNumber, title: params.teamName });
    }

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <ScreenHeader />

                <Pressable
                    accessibilityRole={canOpenClub ? 'link' : undefined}
                    accessibilityLabel={canOpenClub ? t('team.openClub') : undefined}
                    disabled={!canOpenClub}
                    onPress={openOwnClub}
                    style={({ pressed }) => [styles.teamHead, { opacity: canOpenClub && pressed ? 0.7 : 1 }]}
                >
                    <ClubLogo
                        organization={clubOrganization}
                        clubNumber={clubNumber}
                        uri={params.clubLogoUrl || undefined}
                        size={60}
                        fallback={<Avatar icon="people-outline" shape="square" size={60} tone="accent" />}
                    />

                    <View style={styles.teamHeadText}>
                        <Text style={[typography.heading, { color: colors.text }]} numberOfLines={2}>
                            {team.teamName}
                        </Text>

                        <Text style={[typography.meta, { color: colors.mutedText, fontSize: 14 }]} numberOfLines={1}>
                            {[
                                team.leagueTitle,
                                t('leagues.seasonLabel', { season: formatSeasonLong(team.season) }),
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </Text>
                    </View>
                </Pressable>

                <View style={styles.actionRow}>
                    <ActionButton
                        layout="inline"
                        icon="trophy-outline"
                        label={t('team.openLeagueDetails')}
                        disabled={!team.association || !team.groupId}
                        onPress={() =>
                            router.push({
                                pathname: '/league/[leagueKey]',
                                params: {
                                    leagueKey: team.groupId!,
                                    association: team.association!,
                                    groupId: team.groupId!,
                                    season: team.season,
                                    leagueSlug: team.leagueSlug,
                                    title: team.leagueTitle ?? t('team.leagueDetailsTitle'),
                                },
                            })
                        }
                    />

                    {canOpenClub ? (
                        <ActionButton layout="inline" icon="business-outline" label={t('team.openClub')} onPress={openOwnClub} />
                    ) : null}
                </View>

                <StatStrip
                    items={[
                        { label: t('team.players'), value: String(lineup.length) },
                        { label: t('team.games'), value: String(scheduleSummary.played) },
                        { label: t('team.open'), value: String(scheduleSummary.open) },
                        { label: t('team.record'), value: `${balanceSummary.pointsWon}:${balanceSummary.pointsLost}` },
                    ]}
                />

                <SegmentedTabs value={activeTab} onChange={setActiveTab} options={localizedTabOptions} />

                {activeTab === 'schedule' || activeTab === 'balances' ? (
                    <ChipRow>
                        {localizedRoundOptions.map((option) => (
                            <Chip
                                key={option.value}
                                label={option.label}
                                active={roundFilter === option.value}
                                onPress={() => setRoundFilter(option.value)}
                            />
                        ))}
                    </ChipRow>
                ) : null}

                {loading || (roundLoading && activeTab === 'balances' && currentBalances.length === 0) ? (
                    <SkeletonList count={3} />
                ) : null}

                {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

                {warning && !error ? (
                    <Card style={styles.warningCard}>
                        <View style={styles.sectionHeaderCompact}>
                            <Ionicons name="alert-circle-outline" size={18} color={colors.mutedText} />
                            <Text style={[styles.warningText, { color: colors.mutedText }]}>{warning}</Text>
                        </View>
                    </Card>
                ) : null}

                {!loading && !error ? (
                    <DataFreshness
                        freshness={
                            activeTab === 'lineup'
                                ? playersFreshness
                                : activeTab === 'balances'
                                    ? balancesFreshness
                                    : scheduleFreshness
                        }
                    />
                ) : null}

                {!loading && !error && activeTab === 'infos' ? (
                    <InfosTab team={team} info={teamInfo} summary={scheduleSummary} />
                ) : null}

                {!loading && !error && activeTab === 'lineup' ? (
                    <LineupTab players={lineup} />
                ) : null}

                {!loading && !error && activeTab === 'schedule' ? (
                    <ScheduleTab matches={filteredSchedule} team={team} summary={filteredScheduleSummary} />
                ) : null}

                {!loading && !error && activeTab === 'balances' ? (
                    <BalancesTab balances={currentBalances} summary={currentBalanceSummary} roundFilter={roundFilter} />
                ) : null}
            </ScrollView>
        </Screen>
    );
}
