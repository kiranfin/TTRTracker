import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ttApi } from '@/src/api/tttracker';
import { ActionButton } from '@/src/components/ActionButton';
import { Avatar } from '@/src/components/Avatar';
import { Card } from '@/src/components/Card';
import { Chip, ChipRow } from '@/src/components/Chip';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SegmentedTabs } from '@/src/components/SegmentedTabs';
import { StatStrip } from '@/src/components/StatStrip';
import { typography } from '@/src/theme/typography';
import { formatSeasonLong, getCurrentSeason } from '@/src/utils/dates';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { InfosTab, LineupTab, ScheduleTab, BalancesTab } from '../../../src/features/team-details/components';
import { styles } from '../../../src/features/team-details/styles';
import { slugifyMyttPathSegment, normalizeSeasonForApi, normalizeLineup, enrichLineupWithTtr, normalizeTeamInfo, normalizeTeamSchedule, normalizeBalances, filterScheduleByRound, buildScheduleSummary, buildBalanceSummary } from '../../../src/features/team-details/utils';
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
    const [schedule, setSchedule] = useState<TeamScheduleMatch[]>([]);
    const [balancesByRound, setBalancesByRound] = useState<Record<RoundFilter, TeamBalance[]>>({
        gesamt: [],
        vr: [],
        rr: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<string | null>(null);

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

            const hasLeagueContext = Boolean(
                team.association &&
                team.groupId &&
                team.leagueSlug &&
                team.teamNameSlug &&
                team.apiSeason,
            );

            setLoading(true);
            setError(null);
            setWarning(null);

            try {
                const [
                    playersResult,
                    infoResult,
                    scheduleResult,
                    balancesGesamtResult,
                    balancesVrResult,
                    balancesRrResult,
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
                    hasLeagueContext && api.getTeamBalances
                        ? api.getTeamBalances(
                            team.association!,
                            team.apiSeason,
                            team.groupId!,
                            team.leagueSlug,
                            team.teamId,
                            team.teamNameSlug,
                            'vr',
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
                            'rr',
                        )
                        : Promise.resolve(null),
                ]);

                const warnings: string[] = [];

                if (playersResult.status === 'fulfilled') {
                    const normalizedPlayers = normalizeLineup(playersResult.value, team.teamName, t);

                    const canLoadPlayerTtr = typeof (api as Partial<TeamApiClient>).getPlayerTtr === 'function';

                    if (normalizedPlayers.length > 0 && canLoadPlayerTtr) {
                        const enrichedPlayers = await enrichLineupWithTtr(normalizedPlayers, api);
                        setLineup(enrichedPlayers);

                        const missingTtrCount = enrichedPlayers.filter(
                            (player) => Boolean(player.id) && !player.qttr,
                        ).length;

                        if (missingTtrCount > 0) {
                            warnings.push(t('team.ttrWarnings', { count: missingTtrCount }));
                        }
                    } else {
                        setLineup(normalizedPlayers);

                        if (!canLoadPlayerTtr && normalizedPlayers.some((player) => Boolean(player.id) && !player.qttr)) {
                            warnings.push(t('team.ttrApiMissing'));
                        }
                    }
                } else {
                    setLineup([]);
                    warnings.push(t('team.lineupLoadError'));
                }

                if (infoResult.status === 'fulfilled') {
                    setTeamInfo(normalizeTeamInfo(infoResult.value));
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

                const vrBalances =
                    balancesVrResult.status === 'fulfilled'
                        ? normalizeBalances(balancesVrResult.value, t)
                        : [];

                const rrBalances =
                    balancesRrResult.status === 'fulfilled'
                        ? normalizeBalances(balancesRrResult.value, t)
                        : [];

                setBalancesByRound({
                    gesamt: gesamtBalances,
                    vr: vrBalances,
                    rr: rrBalances,
                });

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
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : t('team.loadError'),
                );
            } finally {
                setLoading(false);
            }
        }

        loadTeam().catch(() => undefined);
    }, [
        team.apiSeason,
        team.association,
        team.groupId,
        team.leagueSlug,
        team.teamId,
        team.teamName,
        team.teamNameSlug,
        language,
        t,
    ]);

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

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <ScreenHeader />

                <View style={styles.teamHead}>
                    <Avatar icon="people-outline" shape="square" size={60} tone="accent" />

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
                </View>

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

                {loading ? <SkeletonList count={3} /> : null}

                {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

                {warning && !error ? (
                    <Card style={styles.warningCard}>
                        <View style={styles.sectionHeaderCompact}>
                            <Ionicons name="alert-circle-outline" size={18} color={colors.mutedText} />
                            <Text style={[styles.warningText, { color: colors.mutedText }]}>{warning}</Text>
                        </View>
                    </Card>
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
