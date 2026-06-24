import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
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
import { useI18n } from '../../../src/i18n/I18nProvider';
import { useTheme } from '../../../src/theme/ThemeProvider';

type DetailTab = 'infos' | 'lineup' | 'schedule' | 'balances';
type RoundFilter = 'gesamt' | 'vr' | 'rr';
type IconName = ComponentProps<typeof Ionicons>['name'];

type TeamApiClient = typeof ttApi & {
    getTeamPlayers?: (teamId: string) => Promise<unknown>;
    getPlayerTtr?: (nuid: string) => Promise<unknown>;
    getTeamInfos?: (
        association: string,
        season: string,
        groupId: string,
        leagueSlug: string,
        teamId: string,
        teamNameSlug: string,
    ) => Promise<unknown>;
    getTeamSchedule?: (
        association: string,
        season: string,
        groupId: string,
        leagueSlug: string,
        teamId: string,
        teamNameSlug: string,
        filter: RoundFilter,
    ) => Promise<unknown>;
    getTeamBalances?: (
        association: string,
        season: string,
        groupId: string,
        leagueSlug: string,
        teamId: string,
        teamNameSlug: string,
        filter: RoundFilter,
    ) => Promise<unknown>;
};

type TeamInfo = {
    headInfos?: Record<string, string>;
    contact?: Record<string, string>;
    venue?: Record<string, string>;
    venues?: Record<string, string>[];
    clubContact?: Record<string, string>;
    teamPhotoUrl?: string;
    remarks?: string;
    pdfVersionUrl?: string;
    pdfMaterialsUrl?: string;
};

type TeamPlayer = {
    id?: string;
    firstname?: string;
    lastname?: string;
    name: string;
    rank?: string;
    teamNumber?: string;
    qttr?: string;
    status?: string;
    foreignerType?: string;
};

type TeamScheduleMatch = {
    id?: string;
    date?: string;
    time?: string;
    status: 'scheduled' | 'completed' | 'free';
    homeTeam: string;
    awayTeam: string;
    homeTeamId?: string;
    awayTeamId?: string;
    homeScore?: string;
    awayScore?: string;
    ownScore?: string;
    opponentScore?: string;
    locationLabel?: string;
    locationCity?: string;
    roundType?: string;
    roundName?: string;
};

type TeamBalance = {
    playerId?: string;
    firstname?: string;
    lastname?: string;
    name: string;
    meetingsCount?: string;
    pointsWon?: string;
    pointsLost?: string;
    quote?: number;
    rank?: string;
    teamNumber?: string;
    singleStats: BalanceSplitStat[];
};

type BalanceSplitStat = {
    opponentRank?: string;
    pointsWon?: string;
    pointsLost?: string;
};

type TeamContext = {
    teamId: string;
    teamName: string;
    teamNameSlug: string;
    leagueTitle?: string;
    association?: string;
    groupId?: string;
    season: string;
    apiSeason: string;
    leagueSlug: string;
};

type ScheduleSummary = {
    played: number;
    open: number;
    wins: number;
    draws: number;
    losses: number;
    nextMatch?: TeamScheduleMatch;
};

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
                season: params.season ?? '25/26',
                apiSeason: normalizeSeasonForApi(params.season ?? '25/26'),
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
                <View style={styles.headerRow}>
                    <BackButton />

                    <LeagueDetailsButton team={team} />
                </View>

                <View style={styles.teamTitleBlock}>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                        {team.teamName}
                    </Text>

                    <View style={styles.headerMetaRow}>
                        <Badge tone="outline" icon="calendar-outline">
                            {t('favorites.seasonValue', { season: team.season })}
                        </Badge>

                        {team.association ? <Badge tone="secondary">{team.association}</Badge> : null}
                        {team.groupId ? <Badge tone="outline">{t('team.groupValue', { groupId: team.groupId })}</Badge> : null}
                    </View>
                </View>

                <View style={styles.summaryGrid}>
                    <SummaryTile
                        icon="people-outline"
                        label={t('team.players')}
                        value={String(lineup.length)}
                        tone="primary"
                    />
                    <SummaryTile
                        icon="checkmark-circle-outline"
                        label={t('team.games')}
                        value={String(scheduleSummary.played)}
                        tone="green"
                    />
                    <SummaryTile
                        icon="time-outline"
                        label={t('team.open')}
                        value={String(scheduleSummary.open)}
                        tone="orange"
                    />
                    <SummaryTile
                        icon="stats-chart-outline"
                        label={t('team.record')}
                        value={`${balanceSummary.pointsWon}:${balanceSummary.pointsLost}`}
                        tone="purple"
                    />
                </View>

                <SegmentedTabs value={activeTab} onChange={setActiveTab} options={localizedTabOptions} />

                {activeTab === 'schedule' || activeTab === 'balances' ? (
                    <Card style={styles.filterCard}>
                        <View style={styles.sectionHeaderCompact}>
                            <Ionicons name="filter-outline" size={18} color={colors.primary} />
                            <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>
                                {t('team.period')}
                            </Text>
                        </View>

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
                    </Card>
                ) : null}

                {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

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

function LeagueDetailsButton({ team }: { team: TeamContext }) {
    const { colors } = useTheme();
    const { t } = useI18n();
    const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {};
    const canOpenLeague = Boolean(team.association && team.groupId);

    function openLeagueDetails() {
        if (!canOpenLeague) return;

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
        });
    }

    return (
        <Pressable
            onPress={openLeagueDetails}
            disabled={!canOpenLeague}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t('team.openLeagueDetails')}
            style={({ pressed }) => [
                styles.headerActionButton,
                noWebOutline,
                {
                    backgroundColor:
                        pressed && canOpenLeague ? colors.primarySoft : 'transparent',
                    borderColor:
                        pressed && canOpenLeague ? colors.primarySoftBorder : colors.border,
                    opacity: canOpenLeague ? 1 : 0.4,
                },
            ]}
        >
            <Ionicons
                name="podium-outline"
                size={22}
                color={canOpenLeague ? colors.text : colors.mutedText}
            />
        </Pressable>
    );
}

function InfosTab({
                      team,
                      info,
                      summary,
                  }: {
    team: TeamContext;
    info: TeamInfo | null;
    summary: ScheduleSummary;
}) {
    const { colors } = useTheme();
    const { t, language } = useI18n();

    const contact = info?.contact;
    const headInfos = info?.headInfos;
    const venues = info?.venues?.length ? info.venues : info?.venue ? [info.venue] : [];

    return (
        <View style={styles.stack}>
            {info?.teamPhotoUrl ? (
                <Card style={styles.imageCard}>
                    <Image source={{ uri: info.teamPhotoUrl }} style={styles.teamImage} resizeMode="cover" />
                </Card>
            ) : null}

            <Card style={styles.sectionCard}>
                <View style={styles.sectionHeaderCompact}>
                    <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                    <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>
                        {t('team.teamInfos')}
                    </Text>
                </View>

                <View style={styles.infoList}>
                    <InfoRow icon="people-outline" label={t('team.team')} value={team.teamName} />
                    <InfoRow icon="trophy-outline" label={t('team.league')} value={team.leagueTitle ?? headInfos?.league_name} />
                    <InfoRow icon="calendar-outline" label={t('common.season')} value={headInfos?.season ?? team.season} />
                    <InfoRow icon="git-branch-outline" label={t('team.association')} value={headInfos?.organization_short ?? team.association} />
                    <InfoRow icon="map-outline" label={t('team.region')} value={headInfos?.region} />
                    <InfoRow icon="business-outline" label={t('team.club')} value={headInfos?.club_name} />
                    <InfoRow icon="albums-outline" label={t('team.playMode')} value={headInfos?.play_mode} />
                    <InfoRow icon="person-outline" label={t('team.ageGroup')} value={headInfos?.gender_age_group} />
                    <InfoRow
                        icon="time-outline"
                        label={t('team.nextMatch')}
                        value={
                            summary.nextMatch
                                ? t('team.nextMatchValue', {
                                    date: formatDateLabel(summary.nextMatch.date, language),
                                    opponent: getOpponentName(summary.nextMatch, team),
                                })
                                : undefined
                        }
                    />
                </View>
            </Card>

            <Card style={styles.sectionCard}>
                <View style={styles.sectionHeaderCompact}>
                    <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
                    <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>
                        {t('team.teamLeadership')}
                    </Text>
                </View>

                {contact && hasDisplayableValues(contact) ? (
                    <View style={styles.infoList}>
                        <InfoRow icon="person-outline" label={t('team.contact')} value={contact.contact_name} />
                        <InfoRow icon="location-outline" label={t('team.address')} value={joinParts([contact.street, contact.zipcode, contact.city])} />
                        <InfoRow icon="call-outline" label={t('team.privatePhone')} value={contact.phone_home} />
                        <InfoRow icon="briefcase-outline" label={t('team.workPhone')} value={contact.phone_work} />
                        <InfoRow icon="phone-portrait-outline" label={t('team.mobile')} value={contact.phone_mobile} />
                        <InfoRow icon="mail-outline" label={t('team.privateEmail')} value={contact.email_home} />
                        <InfoRow icon="mail-unread-outline" label={t('team.workEmail')} value={contact.email_work} />
                    </View>
                ) : (
                    <EmptyState icon="person-circle-outline" title={t('team.leadershipEmpty')} />
                )}
            </Card>

            <Card style={styles.sectionCard}>
                <View style={styles.sectionHeaderCompact}>
                    <Ionicons name="home-outline" size={18} color={colors.primary} />
                    <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>
                        {venues.length > 1 ? t('team.venues') : t('team.venue')}
                    </Text>
                </View>

                {venues.length > 0 ? (
                    <View style={styles.stack}>
                        {venues.map((item, index) => (
                            <VenueCard
                                key={`${item.label ?? 'venue'}-${item.street ?? ''}-${index}`}
                                venue={item}
                                index={index}
                                total={venues.length}
                            />
                        ))}
                    </View>
                ) : (
                    <EmptyState icon="home-outline" title={t('team.venueEmpty')} />
                )}
            </Card>

            {info?.remarks || info?.pdfVersionUrl || info?.pdfMaterialsUrl ? (
                <Card style={styles.sectionCard}>
                    <View style={styles.sectionHeaderCompact}>
                        <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                        <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>{t('team.documents')}</Text>
                    </View>

                    <View style={styles.infoList}>
                        <InfoRow icon="chatbox-ellipses-outline" label={t('team.remarks')} value={info.remarks} />
                        <ExternalLinkRow icon="document-outline" label={t('team.schedulePdf')} value={info.pdfVersionUrl} />
                        <ExternalLinkRow icon="documents-outline" label={t('team.materialsPdf')} value={info.pdfMaterialsUrl} />
                    </View>
                </Card>
            ) : null}
        </View>
    );
}

function LineupTab({ players }: { players: TeamPlayer[] }) {
    const { colors } = useTheme();
    const { t } = useI18n();

    if (players.length === 0) {
        return <EmptyState icon="people-outline" title={t('team.lineupEmpty')} />;
    }

    return (
        <Card style={styles.tableCard}>
            <View style={styles.sectionHeader}>
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} />

                <View style={styles.sectionHeaderText}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('team.lineup')}</Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                        {t('team.lineupSubtitle')}
                    </Text>
                </View>
            </View>

            <View style={styles.itemList}>
                {players.map((player, index) => (
                    <PlayerCard key={`${player.id ?? player.name}-${index}`} player={player} index={index} />
                ))}
            </View>
        </Card>
    );
}

function ScheduleTab({
                         matches,
                         team,
                         summary,
                     }: {
    matches: TeamScheduleMatch[];
    team: TeamContext;
    summary: ScheduleSummary;
}) {
    const { colors } = useTheme();
    const { t } = useI18n();

    const upcoming = matches.filter((match) => match.status !== 'completed');
    const completed = matches.filter((match) => match.status === 'completed');

    if (matches.length === 0) {
        return <EmptyState icon="calendar-outline" title={t('team.scheduleEmpty')} />;
    }

    return (
        <View style={styles.stack}>
            <Card style={styles.sectionCard}>
                <View style={styles.sectionHeaderCompact}>
                    <Ionicons name="analytics-outline" size={18} color={colors.primary} />
                    <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>{t('team.seasonOverview')}</Text>
                </View>

                <View style={styles.miniStatRow}>
                    <MiniStat label={t('team.resultRecord')} value={`${summary.wins}-${summary.draws}-${summary.losses}`} />
                    <MiniStat label={t('team.played')} value={String(summary.played)} />
                    <MiniStat label={t('team.open')} value={String(summary.open)} />
                </View>
            </Card>

            {upcoming.length > 0 ? (
                <Card style={styles.sectionCard}>
                    <View style={styles.sectionHeaderCompact}>
                        <Ionicons name="time-outline" size={18} color={colors.primary} />
                        <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>
                            {t('team.openGames')} ({upcoming.length})
                        </Text>
                    </View>

                    <View style={styles.stack}>
                        {upcoming.map((match, index) => (
                            <TeamMatchCard
                                key={`upcoming-${match.id ?? 'no-id'}-${index}`}
                                match={match}
                                team={team}
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
                            {t('team.completedGames')} ({completed.length})
                        </Text>
                    </View>

                    <View style={styles.stack}>
                        {completed.map((match, index) => (
                            <TeamMatchCard
                                key={`completed-${match.id ?? 'no-id'}-${index}`}
                                match={match}
                                team={team}
                            />
                        ))}
                    </View>
                </Card>
            ) : null}
        </View>
    );
}

function BalancesTab({
                         balances,
                         summary,
                         roundFilter,
                     }: {
    balances: TeamBalance[];
    summary: { pointsWon: number; pointsLost: number; quote?: number };
    roundFilter: RoundFilter;
}) {
    const { colors } = useTheme();
    const { t } = useI18n();

    if (balances.length === 0) {
        return <EmptyState icon="stats-chart-outline" title={t('team.balancesEmpty')} />;
    }

    return (
        <View style={styles.stack}>
            <Card style={styles.sectionCard}>
                <View style={styles.sectionHeaderCompact}>
                    <Ionicons name="analytics-outline" size={18} color={colors.primary} />
                    <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>
                        {t('team.balanceOverview')}
                    </Text>
                </View>

                <View style={styles.miniStatRow}>
                    <MiniStat label={t('team.period')} value={roundFilterLabel(roundFilter, t)} />
                    <MiniStat label={t('team.points')} value={`${summary.pointsWon}:${summary.pointsLost}`} />
                    <MiniStat label={t('team.quote')} value={formatPercent(summary.quote)} />
                </View>
            </Card>

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
                        <Ionicons name="stats-chart-outline" size={18} color={colors.primary} />
                    </View>

                    <View style={styles.sectionHeaderText}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('team.playerBalances')}</Text>
                        <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                            {t('team.playerBalancesSubtitle')}
                        </Text>
                    </View>
                </View>

                <View style={styles.itemList}>
                    {balances.map((balance, index) => (
                        <BalanceCard key={`${balance.playerId ?? balance.name}-${index}`} balance={balance} />
                    ))}
                </View>
            </Card>
        </View>
    );
}

function SummaryTile({
                         icon,
                         label,
                         value,
                         tone,
                     }: {
    icon: IconName;
    label: string;
    value: string;
    tone: 'primary' | 'green' | 'orange' | 'purple';
}) {
    const { colors } = useTheme();
    const tileColors = getTileColors(tone, colors);

    return (
        <View
            style={[
                styles.summaryTile,
                {
                    backgroundColor: tileColors.background,
                    borderColor: tileColors.border,
                },
            ]}
        >
            <Ionicons name={icon} size={18} color={tileColors.value} />
            <Text style={[styles.summaryValue, { color: tileColors.value }]} numberOfLines={1}>
                {value}
            </Text>
            <Text style={[styles.summaryLabel, { color: tileColors.label }]} numberOfLines={1}>
                {label}
            </Text>
        </View>
    );
}

function MiniStat({ label, value }: { label: string; value: string }) {
    const { colors } = useTheme();

    return (
        <View style={[styles.miniStat, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.miniStatLabel, { color: colors.mutedText }]} numberOfLines={1}>
                {label}
            </Text>
            <Text style={[styles.miniStatValue, { color: colors.text }]} numberOfLines={1}>
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

function PlayerCard({ player, index }: { player: TeamPlayer; index: number }) {
    const { colors } = useTheme();
    const canOpen = Boolean(player.id);

    return (
        <Pressable
            disabled={!canOpen}
            onPress={
                canOpen
                    ? () =>
                        router.push({
                            pathname: '/player/[nuid]',
                            params: {
                                nuid: player.id!,
                                name: player.name,
                            },
                        })
                    : undefined
            }
            style={({ pressed }) => [
                styles.personCard,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                },
                pressed ? styles.cardPressed : null,
            ]}
        >
            <View
                style={[
                    styles.rankBadge,
                    {
                        backgroundColor: colors.primarySoft,
                        borderColor: colors.primarySoftBorder,
                    },
                ]}
            >
                <Text style={[styles.rankText, { color: colors.primary }]}>
                    {player.rank ?? String(index + 1)}
                </Text>
            </View>

            <View style={styles.personContent}>
                <Text style={[styles.personName, { color: colors.text }]} numberOfLines={2}>
                    {player.name}
                </Text>

                <View style={styles.personMetaRow}>
                    {player.qttr ? <Badge tone="green">TTR {player.qttr}</Badge> : null}
                    {player.status ? <Badge tone="outline">{player.status}</Badge> : null}
                    {player.foreignerType ? <Badge tone="outline">{player.foreignerType}</Badge> : null}
                </View>
            </View>

            {canOpen ? <Ionicons name="chevron-forward" size={18} color={colors.mutedText} /> : null}
        </Pressable>
    );
}

function BalanceCard({ balance }: { balance: TeamBalance }) {
    const { colors } = useTheme();
    const { t } = useI18n();
    const canOpen = Boolean(balance.playerId);

    return (
        <Pressable
            disabled={!canOpen}
            onPress={
                canOpen
                    ? () =>
                        router.push({
                            pathname: '/player/[nuid]',
                            params: {
                                nuid: balance.playerId!,
                                name: balance.name,
                            },
                        })
                    : undefined
            }
            style={({ pressed }) => [
                styles.balanceCard,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                },
                pressed ? styles.cardPressed : null,
            ]}
        >
            <View style={styles.balanceTopRow}>
                <View style={styles.personContent}>
                    <Text style={[styles.personName, { color: colors.text }]} numberOfLines={2}>
                        {balance.name}
                    </Text>

                    <View style={styles.personMetaRow}>
                        {balance.rank ? <Badge tone="secondary">{t('team.rank', { rank: balance.rank })}</Badge> : null}
                    </View>
                </View>

                {canOpen ? <Ionicons name="chevron-forward" size={18} color={colors.mutedText} /> : null}
            </View>

            <View style={styles.balanceStatGrid}>
                <BalanceStat label={t('team.appearances')} value={balance.meetingsCount ?? '-'} />
                <BalanceStat label={t('team.record')} value={`${balance.pointsWon ?? '0'}:${balance.pointsLost ?? '0'}`} />
                <BalanceStat label={t('team.quote')} value={formatPercent(balance.quote)} />
            </View>
        </Pressable>
    );
}

function BalanceStat({ label, value }: { label: string; value: string }) {
    const { colors } = useTheme();

    return (
        <View style={[styles.balanceStat, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.balanceStatLabel, { color: colors.mutedText }]} numberOfLines={1}>
                {label}
            </Text>
            <Text style={[styles.balanceStatValue, { color: colors.text }]} numberOfLines={1}>
                {value}
            </Text>
        </View>
    );
}

function TeamMatchCard({
                           match,
                           team,
                           highlighted,
                       }: {
    match: TeamScheduleMatch;
    team: TeamContext;
    highlighted?: boolean;
}) {
    const { colors } = useTheme();
    const { t, language } = useI18n();
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
                        {formatDateLabel(match.date, language)}
                        {match.time ? ` • ${match.time}` : ''}
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
                    {teamMatchStatusLabel(match.status, t)}
                </Badge>
            </View>

            <View style={styles.matchScoreRow}>
                <Text
                    style={[
                        styles.matchTeam,
                        isOwnTeam(match.homeTeam, match.homeTeamId, team)
                            ? { color: colors.primary }
                            : { color: colors.text },
                    ]}
                    numberOfLines={2}
                >
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
                            {match.status === 'free' ? t('team.freeShort') : t('team.vs')}
                        </Text>
                    </View>
                )}

                <Text
                    style={[
                        styles.matchTeam,
                        styles.awayTeam,
                        isOwnTeam(match.awayTeam, match.awayTeamId, team)
                            ? { color: colors.primary }
                            : { color: colors.text },
                    ]}
                    numberOfLines={2}
                >
                    {match.awayTeam}
                </Text>
            </View>

            <View style={styles.matchMetaRow}>
                {match.locationLabel || match.locationCity ? (
                    <View style={styles.metaLine}>
                        <Ionicons name="location-outline" size={13} color={colors.mutedText} />
                        <Text style={[styles.metaText, { color: colors.mutedText }]}>
                            {joinParts([match.locationLabel, match.locationCity])}
                        </Text>
                    </View>
                ) : null}

                {getOpponentName(match, team) ? (
                    <View style={styles.metaLine}>
                        <Ionicons name="swap-horizontal-outline" size={13} color={colors.mutedText} />
                        <Text style={[styles.metaText, { color: colors.mutedText }]}>
                            {t('team.opponent', { opponent: getOpponentName(match, team) })}
                        </Text>
                    </View>
                ) : null}
            </View>
        </Card>
    );
}

function InfoRow({
                     icon,
                     label,
                     value,
                 }: {
    icon: IconName;
    label: string;
    value?: string;
}) {
    const { colors } = useTheme();
    const cleaned = cleanValue(value);

    if (!cleaned) return null;

    return (
        <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: colors.muted }]}>
                <Ionicons name={icon} size={15} color={colors.mutedText} />
            </View>

            <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.mutedText }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{cleaned}</Text>
            </View>
        </View>
    );
}

function ExternalLinkRow({
                             icon,
                             label,
                             value,
                         }: {
    icon: IconName;
    label: string;
    value?: string;
}) {
    const { colors } = useTheme();
    const cleaned = cleanValue(value);

    if (!cleaned) return null;

    return (
        <Pressable
            onPress={() => openUrl(cleaned)}
            style={({ pressed }) => [styles.infoRow, pressed ? styles.cardPressed : null]}
        >
            <View style={[styles.infoIcon, { backgroundColor: colors.muted }]}>
                <Ionicons name={icon} size={15} color={colors.mutedText} />
            </View>

            <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.mutedText }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: colors.primary }]} numberOfLines={2}>
                    {cleaned}
                </Text>
            </View>

            <Ionicons name="open-outline" size={16} color={colors.mutedText} />
        </Pressable>
    );
}

function VenueCard({
                       venue,
                       index,
                       total,
                   }: {
    venue: Record<string, string>;
    index: number;
    total: number;
}) {
    const { colors } = useTheme();
    const { t } = useI18n();

    const title = venue.label ?? t('team.venueWithNumber', { number: index + 1 });
    const name = venue.contact_name ?? venue.name;

    return (
        <View style={[styles.venueBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            {total > 1 ? (
                <Text style={[styles.venueTitle, { color: colors.text }]}>{title}</Text>
            ) : null}

            <View style={styles.infoList}>
                <InfoRow icon="business-outline" label={t('team.name')} value={name ?? title} />
                <InfoRow
                    icon="location-outline"
                    label={t('team.address')}
                    value={joinParts([venue.street, venue.zipcode, venue.city])}
                />

                {isProbablyUrl(venue.website) ? (
                    <ExternalLinkRow icon="globe-outline" label={t('team.website')} value={venue.website} />
                ) : (
                    <InfoRow icon="chatbox-ellipses-outline" label={t('team.note')} value={venue.website} />
                )}

                <InfoRow icon="call-outline" label={t('team.phone')} value={venue.phone_home ?? venue.phone_mobile} />
            </View>
        </View>
    );
}

function normalizeLineup(
    response: unknown,
    teamName: string,
    t: ReturnType<typeof useI18n>['t'],
): TeamPlayer[] {
    const data = unwrapData(response);
    const record = asRecord(data);

    const teampools =
        arrayValue(record?.teampools).length > 0
            ? arrayValue(record?.teampools)
            : arrayValue(data).filter((item) => arrayValue(asRecord(item)?.teampool).length > 0);

    if (teampools.length > 0) {
        const matchingPool =
            teampools.find((pool) => {
                const poolRecord = asRecord(pool);
                return (
                    normalizeTeamKey(pickString(poolRecord, ['team_name', 'teamName'])) ===
                    normalizeTeamKey(teamName)
                );
            }) ?? teampools[0];

        const poolPlayers = arrayValue(asRecord(matchingPool)?.teampool);

        if (poolPlayers.length > 0) {
            return dedupePlayers(poolPlayers.map((player) => normalizeLineupPlayer(player, t))).sort(sortByRank);
        }
    }

    const directRows =
        firstNonEmptyArray([
            arrayValue(record?.players),
            arrayValue(record?.teamPlayers),
            arrayValue(record?.lineup),
            arrayValue(record?.teampool),
            arrayValue(data).filter(looksLikePlayerRecord),
        ]) ?? [];

    return dedupePlayers(directRows.map((player) => normalizeLineupPlayer(player, t))).sort(sortByRank);
}

function looksLikePlayerRecord(value: unknown) {
    const row = asRecord(value);

    return Boolean(
        row &&
        (
            row.firstname !== undefined ||
            row.lastname !== undefined ||
            row.player_firstname !== undefined ||
            row.player_lastname !== undefined ||
            row.internal_id !== undefined ||
            row.player_id !== undefined ||
            row.person_id !== undefined ||
            row.nuid !== undefined ||
            row.player_qttr !== undefined ||
            row.qttr !== undefined
        ),
    );
}

function dedupePlayers(players: TeamPlayer[]) {
    const seen = new Set<string>();

    return players.filter((player, index) => {
        const id = cleanValue(player.id);
        const key = id
            ? `id:${id}`
            : `fallback:${normalizeTeamKey(player.name)}:${player.rank ?? index}`;

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function normalizeLineupPlayer(value: unknown, t: ReturnType<typeof useI18n>['t']): TeamPlayer {
    const row = asRecord(value);

    const firstname = pickString(row, ['firstname', 'first_name', 'player_firstname']);
    const lastname = pickString(row, ['lastname', 'last_name', 'player_lastname']);
    const name =
        pickString(row, ['name', 'player_name', 'person_name']) ??
        joinParts([firstname, lastname]) ??
        t('team.unknownPlayer');

    return {
        id: pickString(row, ['internal_id', 'player_id', 'person_id', 'nuid', 'id']),
        firstname,
        lastname,
        name,
        rank: pickString(row, ['rank', 'player_rank', 'position']),
        teamNumber: pickString(row, ['team_number', 'teamNumber']),
        qttr: pickString(row, ['player_qttr', 'qttr', 'q_ttr', 'ttr', 'ttr_value', 'player_ttr']),
        status: pickString(row, ['player_status', 'status']),
        foreignerType: pickString(row, ['foreigner_type', 'foreignerType']),
    };
}

async function enrichLineupWithTtr(players: TeamPlayer[], api: TeamApiClient) {
    if (!api.getPlayerTtr) return players;

    const playerIds = Array.from(
        new Set(
            players
                .map((player) => cleanValue(player.id))
                .filter((id): id is string => Boolean(id)),
        ),
    );

    if (playerIds.length === 0) return players;

    const ttrResults = await Promise.allSettled(
        playerIds.map(async (playerId) => {
            const result = await api.getPlayerTtr!(playerId);
            return [playerId, extractTtrFromPlayerTtrResponse(result)] as const;
        }),
    );

    const ttrByPlayerId = new Map<string, string>();

    for (const result of ttrResults) {
        if (result.status !== 'fulfilled') continue;

        const [playerId, ttr] = result.value;
        const cleanedTtr = cleanValue(ttr);

        if (cleanedTtr) {
            ttrByPlayerId.set(playerId, cleanedTtr);
        }
    }

    return players.map((player) => {
        const playerId = cleanValue(player.id);
        const loadedTtr = playerId ? ttrByPlayerId.get(playerId) : undefined;

        if (!loadedTtr) return player;

        return {
            ...player,
            qttr: loadedTtr,
        };
    });
}

function extractTtrFromPlayerTtrResponse(response: unknown) {
    const data = unwrapData(response);

    const directValue = pickNestedString(data, [
        ['ttr'],
        ['qttr'],
        ['q_ttr'],
        ['player_ttr'],
        ['player_qttr'],
        ['ttr_value'],
        ['values', 'ttr'],
        ['values', 'qttr'],
        ['ttrResult', 'values', 'ttr'],
        ['ttrResult', 'values', 'qttr'],
        ['ttr_result', 'values', 'ttr'],
        ['historyResult', 'values', 'ttr'],
        ['historyResult', 'values', 'qttr'],
        ['history_result', 'values', 'ttr'],
        ['player', 'ttr'],
        ['player', 'qttr'],
    ]);

    return normalizeTtrValue(directValue ?? findTtrValueDeep(data));
}

function pickNestedString(value: unknown, paths: string[][]) {
    for (const path of paths) {
        let current: unknown = value;

        for (const key of path) {
            const record = asRecord(current);

            if (!record || !(key in record)) {
                current = undefined;
                break;
            }

            current = record[key];
        }

        const cleaned = cleanValue(current);
        if (cleaned) return cleaned;
    }

    return undefined;
}

function findTtrValueDeep(value: unknown, depth = 0): string | undefined {
    if (depth > 5) return undefined;

    const record = asRecord(value);
    if (!record) return undefined;

    for (const key of ['ttr', 'qttr', 'q_ttr', 'player_ttr', 'player_qttr', 'ttr_value']) {
        const cleaned = cleanValue(record[key]);
        if (cleaned) return cleaned;
    }

    for (const nestedValue of Object.values(record)) {
        const nestedTtr = findTtrValueDeep(nestedValue, depth + 1);
        if (nestedTtr) return nestedTtr;
    }

    return undefined;
}

function normalizeTtrValue(value?: string) {
    const cleaned = cleanValue(value);
    if (!cleaned) return undefined;

    const match = cleaned.match(/\d{3,5}/);
    return match?.[0] ?? cleaned;
}

function normalizeTeamInfo(response: unknown): TeamInfo | null {
    if (!response) return null;

    const data = unwrapData(response);
    const row = asRecord(data);

    if (!row) return null;

    const meetingsExcerpt = asRecord(row.meetings_excerpt);
    const normalizedVenues = normalizeVenueList(row.venues);
    const fallbackVenues =
        normalizedVenues.length > 0 ? normalizedVenues : normalizeVenueList(row.club_contacts, true);

    const primaryVenue =
        normalizeStringRecord(asRecord(row.venue ?? row.location)) ?? fallbackVenues[0];

    return {
        headInfos: normalizeStringRecord(asRecord(row.head_infos)),
        contact: normalizeStringRecord(asRecord(row.team_contact ?? row.contact)),
        clubContact: normalizeStringRecord(asRecord(row.club_contact)),
        venue: primaryVenue,
        venues: fallbackVenues.length > 0 ? fallbackVenues : primaryVenue ? [primaryVenue] : [],
        teamPhotoUrl: pickString(row, ['team_photo_url', 'teamPhotoUrl', 'photo_url', 'image']),
        remarks: pickString(meetingsExcerpt, ['remarks']),
        pdfVersionUrl: pickString(meetingsExcerpt, ['pdf_version_url', 'pdfVersionUrl']),
        pdfMaterialsUrl: pickString(meetingsExcerpt, ['pdf_materials_url', 'pdfMaterialsUrl']),
    };
}

function normalizeTeamSchedule(
    response: unknown,
    team: TeamContext,
    t: ReturnType<typeof useI18n>['t'],
    language: ReturnType<typeof useI18n>['language'],
): TeamScheduleMatch[] {
    const data = unwrapData(response);
    const row = asRecord(data);

    const meetingsExcerpt = asRecord(row?.meetings_excerpt);

    const rows =
        firstNonEmptyArray([
            arrayValue(row?.schedule),
            arrayValue(row?.meetings),
            flattenMeetingGroups(meetingsExcerpt?.meetings),
        ]) ?? [];

    return rows
        .map((value) => normalizeScheduleRow(value, team, t, language))
        .filter((match) => match.homeTeam || match.awayTeam)
        .sort((a, b) => {
            const dateA = parseDate(a.date)?.getTime() ?? 0;
            const dateB = parseDate(b.date)?.getTime() ?? 0;
            return dateA - dateB;
        });
}

function normalizeScheduleRow(
    value: unknown,
    team: TeamContext,
    t: ReturnType<typeof useI18n>['t'],
    language: ReturnType<typeof useI18n>['language'],
): TeamScheduleMatch {
    const row = asRecord(value);

    const date = pickString(row, ['date', 'datetime', 'start_time', 'startTime']);
    const time =
        pickString(row, ['time', 'start_time_label', 'timeLabel']) ?? formatTimeLabel(date, language);

    const homeTeamId = pickString(row, ['team_home_id', 'homeTeamId', 'home_team_id']);
    const awayTeamId = pickString(row, ['team_away_id', 'awayTeamId', 'away_team_id']);

    const opponent = pickString(row, ['opponent_team_name', 'opponentTeamName', 'opponent']);
    const homeTeam =
        pickString(row, ['team_home', 'homeTeam', 'home_team']) ??
        (opponent ? team.teamName : t('match.home'));
    const awayTeam =
        pickString(row, ['team_away', 'awayTeam', 'away_team']) ??
        opponent ??
        t('team.away');

    const ownIsHome = isOwnTeam(homeTeam, homeTeamId, team);
    const ownIsAway = isOwnTeam(awayTeam, awayTeamId, team);

    const explicitHomeScore = pickString(row, ['homeScore', 'home_score', 'team_home_score', 'points_home']);
    const explicitAwayScore = pickString(row, ['awayScore', 'away_score', 'team_away_score', 'points_away']);

    // In meetings_excerpt.meetings liefert myTischtennis/click-tt `matches_won` und
    // `matches_lost` als Heim:Auswärts-Ergebnis, nicht als Ergebnis aus Sicht
    // der aktuell geöffneten Mannschaft. Deshalb dürfen Auswärtsspiele hier nicht
    // nochmal gedreht werden.
    const meetingHomeScore = pickString(row, ['matches_won', 'points_won', 'score_won']);
    const meetingAwayScore = pickString(row, ['matches_lost', 'points_lost', 'score_lost']);

    const explicitOwnScore = pickString(row, ['ownScore', 'own_score']);
    const explicitOpponentScore = pickString(row, ['opponentScore', 'opponent_score']);

    const homeScore =
        explicitHomeScore ??
        meetingHomeScore ??
        (ownIsHome ? explicitOwnScore : ownIsAway ? explicitOpponentScore : undefined);

    const awayScore =
        explicitAwayScore ??
        meetingAwayScore ??
        (ownIsHome ? explicitOpponentScore : ownIsAway ? explicitOwnScore : undefined);

    const ownScore = ownIsHome ? homeScore : ownIsAway ? awayScore : explicitOwnScore;
    const opponentScore = ownIsHome ? awayScore : ownIsAway ? homeScore : explicitOpponentScore;

    const location = asRecord(row?.location);

    const status = normalizeMatchStatus(
        pickString(row, ['state', 'status', 'meeting_state']),
        homeScore,
        awayScore,
        homeTeam,
        awayTeam,
    );

    return {
        id: pickString(row, ['meeting_id', 'meetingId', 'id']),
        date,
        time,
        status,
        homeTeam,
        awayTeam,
        homeTeamId,
        awayTeamId,
        homeScore,
        awayScore,
        ownScore,
        opponentScore,
        locationLabel: pickString(location, ['label', 'name']) ?? pickString(row, ['location_label']),
        locationCity: pickString(location, ['city']) ?? pickString(row, ['location_city']),
        roundType: pickString(row, ['round_type', 'roundType']),
        roundName: pickString(row, ['round_name', 'roundName']),
    };
}

function normalizeBalances(response: unknown, t: ReturnType<typeof useI18n>['t']): TeamBalance[] {
    const data = unwrapData(response);
    const row = asRecord(data);

    const balanceSheetStats = getBalanceSheetSingleStats(row);

    const rows =
        firstNonEmptyArray([
            arrayValue(row?.player_balances),
            arrayValue(row?.single_player_statistics),
            balanceSheetStats,
        ]) ?? [];

    return dedupeBalances(rows.map((balance) => normalizeBalanceRow(balance, t)))
        .filter((balance) => balance.name && balance.name !== t('team.unknownPlayer'))
        .sort((a, b) => {
            const rankA = Number(a.rank ?? Number.MAX_SAFE_INTEGER);
            const rankB = Number(b.rank ?? Number.MAX_SAFE_INTEGER);
            return rankA - rankB;
        });
}

function dedupeBalances(balances: TeamBalance[]) {
    const seen = new Set<string>();

    return balances.filter((balance, index) => {
        const id = cleanValue(balance.playerId);
        const key = id
            ? `id:${id}`
            : `fallback:${normalizeTeamKey(balance.name)}:${balance.rank ?? index}`;

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function normalizeBalanceRow(value: unknown, t: ReturnType<typeof useI18n>['t']): TeamBalance {
    const row = asRecord(value);

    const firstname = pickString(row, ['player_firstname', 'firstname', 'first_name']);
    const lastname = pickString(row, ['player_lastname', 'lastname', 'last_name']);
    const name =
        pickString(row, ['player_name', 'name', 'person_name']) ??
        joinParts([firstname, lastname]) ??
        t('team.unknownPlayer');

    const pointsWon = pickString(row, ['points_won', 'won', 'matches_won']);
    const pointsLost = pickString(row, ['points_lost', 'lost', 'matches_lost']);
    const wonNumber = toNumber(pointsWon) ?? 0;
    const lostNumber = toNumber(pointsLost) ?? 0;

    const singleStats =
        arrayValue(row?.single_statistics).map((stat) => {
            const statRow = asRecord(stat);

            return {
                opponentRank: pickString(statRow, ['opponent_rank', 'opponentRank']),
                pointsWon: pickString(statRow, ['points_won', 'won']),
                pointsLost: pickString(statRow, ['points_lost', 'lost']),
            };
        }) ?? [];

    return {
        playerId: pickString(row, ['player_id', 'internal_id', 'nuid', 'id']),
        firstname,
        lastname,
        name,
        meetingsCount: pickString(row, ['meetings_count', 'meeting_count', 'matches_count', 'match_count']),
        pointsWon,
        pointsLost,
        quote: wonNumber + lostNumber > 0 ? wonNumber / (wonNumber + lostNumber) : undefined,
        rank: pickString(row, ['player_rank', 'rank']),
        teamNumber: pickString(row, ['team_number', 'teamNumber']),
        singleStats,
    };
}

function buildScheduleSummary(matches: TeamScheduleMatch[], team: TeamContext): ScheduleSummary {
    const summary: ScheduleSummary = {
        played: 0,
        open: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        nextMatch: undefined,
    };

    const now = new Date();

    for (const match of matches) {
        if (match.status === 'completed') {
            summary.played += 1;

            const result = getOwnResult(match, team);
            if (result) {
                if (result.own > result.opponent) summary.wins += 1;
                else if (result.own < result.opponent) summary.losses += 1;
                else summary.draws += 1;
            }

            continue;
        }

        summary.open += 1;

        const matchDate = parseDate(match.date);
        if (!matchDate || matchDate < now) continue;

        const currentNextDate = parseDate(summary.nextMatch?.date);
        if (!summary.nextMatch || !currentNextDate || matchDate < currentNextDate) {
            summary.nextMatch = match;
        }
    }

    return summary;
}

function buildBalanceSummary(balances: TeamBalance[]) {
    let pointsWon = 0;
    let pointsLost = 0;

    for (const balance of balances) {
        pointsWon += toNumber(balance.pointsWon) ?? 0;
        pointsLost += toNumber(balance.pointsLost) ?? 0;
    }

    return {
        pointsWon,
        pointsLost,
        quote: pointsWon + pointsLost > 0 ? pointsWon / (pointsWon + pointsLost) : undefined,
    };
}

function getOwnResult(match: TeamScheduleMatch, team: TeamContext) {
    const ownScore = toNumber(match.ownScore);
    const opponentScore = toNumber(match.opponentScore);

    if (ownScore !== undefined && opponentScore !== undefined) {
        return { own: ownScore, opponent: opponentScore };
    }

    const homeScore = toNumber(match.homeScore);
    const awayScore = toNumber(match.awayScore);

    if (homeScore === undefined || awayScore === undefined) return undefined;

    if (isOwnTeam(match.homeTeam, match.homeTeamId, team)) {
        return { own: homeScore, opponent: awayScore };
    }

    if (isOwnTeam(match.awayTeam, match.awayTeamId, team)) {
        return { own: awayScore, opponent: homeScore };
    }

    return undefined;
}

function getOpponentName(match: TeamScheduleMatch, team: TeamContext) {
    if (isOwnTeam(match.homeTeam, match.homeTeamId, team)) return match.awayTeam;
    if (isOwnTeam(match.awayTeam, match.awayTeamId, team)) return match.homeTeam;
    return undefined;
}

function isOwnTeam(teamName?: string, teamId?: string, team?: TeamContext) {
    if (!team) return false;

    if (teamId && String(teamId) === String(team.teamId)) return true;

    return normalizeTeamKey(teamName) === normalizeTeamKey(team.teamName);
}

function normalizeMatchStatus(
    rawStatus?: string,
    homeScore?: string,
    awayScore?: string,
    homeTeam?: string,
    awayTeam?: string,
): TeamScheduleMatch['status'] {
    const value = normalizeKey(rawStatus);

    if (normalizeTeamKey(homeTeam).includes('spielfrei') || normalizeTeamKey(awayTeam).includes('spielfrei')) {
        return 'free';
    }

    if (
        value.includes('completed') ||
        value.includes('finished') ||
        value.includes('done') ||
        value.includes('played') ||
        value.includes('geschlossen') ||
        value.includes('beendet') ||
        value.includes('gespielt') ||
        (homeScore !== undefined && awayScore !== undefined)
    ) {
        return 'completed';
    }

    return 'scheduled';
}

function teamMatchStatusLabel(status: TeamScheduleMatch['status'], t: ReturnType<typeof useI18n>['t']) {
    switch (status) {
        case 'completed':
            return t('status.completed');
        case 'free':
            return t('status.free');
        case 'scheduled':
        default:
            return t('team.open');
    }
}

function roundFilterLabel(filter: RoundFilter, t: ReturnType<typeof useI18n>['t']) {
    switch (filter) {
        case 'vr':
            return t('team.firstHalf');
        case 'rr':
            return t('team.secondHalf');
        case 'gesamt':
        default:
            return t('team.totalRound');
    }
}

function filterScheduleByRound(matches: TeamScheduleMatch[], filter: RoundFilter) {
    if (filter === 'gesamt') return matches;

    return matches.filter((match) => inferScheduleRound(match) === filter);
}

function inferScheduleRound(match: TeamScheduleMatch): 'vr' | 'rr' {
    const roundType = cleanValue(match.roundType);

    if (roundType === '0') return 'vr';
    if (roundType === '1') return 'rr';

    const roundName = normalizeKey(match.roundName);

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

    const date = parseDate(match.date);

    if (date) {
        const month = date.getMonth() + 1;
        return month >= 7 && month <= 12 ? 'vr' : 'rr';
    }

    return 'vr';
}

function arrayValue(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

function firstNonEmptyArray(arrays: unknown[][]): unknown[] | undefined {
    return arrays.find((array) => array.length > 0);
}

function flattenMeetingGroups(value: unknown): unknown[] {
    const groups = arrayValue(value);
    const result: unknown[] = [];

    for (const group of groups) {
        if (Array.isArray(group)) {
            result.push(...group);
            continue;
        }

        const record = asRecord(group);

        if (!record) continue;

        for (const nestedValue of Object.values(record)) {
            if (Array.isArray(nestedValue)) {
                result.push(...nestedValue);
            }
        }
    }

    return result;
}

function normalizeVenueList(value: unknown, filterClubContacts = false) {
    return arrayValue(value)
        .map((item) => asRecord(item))
        .filter((item): item is Record<string, unknown> => Boolean(item))
        .filter((item) => !filterClubContacts || isVenueCandidate(item))
        .map((item) => normalizeStringRecord(item))
        .filter((item): item is Record<string, string> => Boolean(item && hasDisplayableValues(item)));
}

function isVenueCandidate(record: Record<string, unknown>) {
    const label = cleanValue(record.label)?.toLowerCase() ?? '';

    if (label.includes('spiellokal')) {
        return true;
    }

    const hasEmail = cleanValue(record.email_home) || cleanValue(record.email_work);

    return !hasEmail && Boolean(cleanValue(record.street)) && Boolean(cleanValue(record.city));
}

function getBalanceSheetSingleStats(row?: Record<string, unknown>) {
    const sheets = arrayValue(row?.balancesheet);

    for (const sheet of sheets) {
        const sheetRecord = asRecord(sheet);
        const stats = arrayValue(sheetRecord?.single_player_statistics);

        if (stats.length > 0) {
            return stats;
        }
    }

    return [];
}

function isProbablyUrl(value?: string) {
    const cleaned = cleanValue(value);
    return Boolean(cleaned && /^https?:\/\//i.test(cleaned));
}

function unwrapData(value: unknown) {
    let current = value;

    for (let index = 0; index < 3; index += 1) {
        const record = asRecord(current);
        if (!record || record.data === undefined) break;
        current = record.data;
    }

    return current;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : undefined;
}

function normalizeStringRecord(record?: Record<string, unknown>) {
    if (!record) return undefined;

    return Object.fromEntries(
        Object.entries(record)
            .map(([key, value]) => [key, cleanValue(value)])
            .filter(([, value]) => Boolean(value)),
    ) as Record<string, string>;
}

function pickString(record: Record<string, unknown> | undefined, keys: string[]) {
    if (!record) return undefined;

    for (const key of keys) {
        const value = cleanValue(record[key]);
        if (value !== undefined) return value;
    }

    return undefined;
}

function cleanValue(value: unknown) {
    if (value === undefined || value === null) return undefined;

    const text = String(value).trim();

    if (!text || text === '-' || text.toLowerCase() === 'null' || text.toLowerCase() === 'undefined') {
        return undefined;
    }

    return text;
}

function joinParts(parts: Array<string | undefined>) {
    const joined = parts.map(cleanValue).filter(Boolean).join(', ');
    return joined || undefined;
}

function toNumber(value: unknown) {
    const numberValue = Number(String(value ?? '').replace(',', '.'));
    return Number.isFinite(numberValue) ? numberValue : undefined;
}

function sortByRank(left: TeamPlayer, right: TeamPlayer) {
    const rankLeft = Number(left.rank ?? Number.MAX_SAFE_INTEGER);
    const rankRight = Number(right.rank ?? Number.MAX_SAFE_INTEGER);

    return rankLeft - rankRight;
}

function hasDisplayableValues(record?: Record<string, string>) {
    return Boolean(record && Object.values(record).some((value) => cleanValue(value)));
}

function normalizeSeasonForApi(season: string) {
    const value = season.trim();

    if (/^\d{2}--\d{2}$/.test(value)) return value;

    const shortMatch = value.match(/^(\d{2})\/(\d{2})$/);
    if (shortMatch) return `${shortMatch[1]}--${shortMatch[2]}`;

    const longMatch = value.match(/^20(\d{2})\/(\d{2})$/);
    if (longMatch) return `${longMatch[1]}--${longMatch[2]}`;

    return value;
}

function slugifyMyttPathSegment(value: string) {
    return (
        value
            .trim()
            .replace(/ä/g, 'ae')
            .replace(/ö/g, 'oe')
            .replace(/ü/g, 'ue')
            .replace(/Ä/g, 'Ae')
            .replace(/Ö/g, 'Oe')
            .replace(/Ü/g, 'Ue')
            .replace(/ß/g, 'ss')
            .replace(/&/g, 'und')
            .replace(/\s+/g, '_')
            .replace(/[^\w-]+/g, '')
            .replace(/_+/g, '_') || 'x'
    );
}

function normalizeTeamKey(value?: string) {
    return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeKey(value?: string) {
    return (value ?? '').trim().toLowerCase();
}

function parseDate(value?: string) {
    const raw = cleanValue(value);
    if (!raw) return undefined;

    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) return date;

    const germanMatch = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
    if (germanMatch) {
        const year =
            germanMatch[3].length === 2 ? 2000 + Number(germanMatch[3]) : Number(germanMatch[3]);

        return new Date(year, Number(germanMatch[2]) - 1, Number(germanMatch[1]));
    }

    return undefined;
}

function formatDateLabel(value?: string, language: ReturnType<typeof useI18n>['language'] = 'de') {
    const date = parseDate(value);
    if (!date) return cleanValue(value) ?? '-';

    return new Intl.DateTimeFormat(languageToLocale(language), {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
    }).format(date);
}

function formatTimeLabel(value?: string, language: ReturnType<typeof useI18n>['language'] = 'de') {
    const date = parseDate(value);
    if (!date) return undefined;

    const hours = date.getHours();
    const minutes = date.getMinutes();

    if (hours === 0 && minutes === 0) return undefined;

    return new Intl.DateTimeFormat(languageToLocale(language), {
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function languageToLocale(language: ReturnType<typeof useI18n>['language']) {
    return language === 'en' ? 'en-US' : 'de-DE';
}

function formatPercent(value?: number) {
    if (value === undefined || Number.isNaN(value)) return '-';
    return `${Math.round(value * 100)}%`;
}

function getTileColors(tone: 'primary' | 'green' | 'orange' | 'purple', colors: ReturnType<typeof useTheme>['colors']) {
    const dark = getRelativeLuminance(colors.background) < 0.45;

    switch (tone) {
        case 'green':
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

        case 'orange':
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

        case 'purple':
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

        case 'primary':
        default:
            return {
                background: colors.primarySoft,
                border: colors.primarySoftBorder,
                label: colors.primary,
                value: colors.primary,
            };
    }
}

function getRelativeLuminance(color: string) {
    const hex = color.trim();

    if (!hex.startsWith('#')) return 1;

    const normalized =
        hex.length === 4
            ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
            : hex;

    const red = parseInt(normalized.slice(1, 3), 16);
    const green = parseInt(normalized.slice(3, 5), 16);
    const blue = parseInt(normalized.slice(5, 7), 16);

    if ([red, green, blue].some((value) => Number.isNaN(value))) return 1;

    const [r, g, b] = [red, green, blue].map((value) => {
        const channel = value / 255;
        return channel <= 0.03928
            ? channel / 12.92
            : Math.pow((channel + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function openUrl(url: string) {
    Linking.openURL(url).catch(() => undefined);
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
    teamTitleBlock: {
        gap: 8,
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
    leagueTitle: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '700',
    },
    headerMetaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    summaryGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    summaryTile: {
        flex: 1,
        minHeight: 82,
        borderWidth: 1,
        borderRadius: 18,
        padding: 10,
        justifyContent: 'center',
        gap: 4,
    },
    summaryValue: {
        fontSize: 18,
        lineHeight: 22,
        fontWeight: '900',
    },
    summaryLabel: {
        fontSize: 10,
        lineHeight: 13,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    loader: {
        paddingVertical: 22,
    },
    error: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '800',
    },
    warningCard: {
        padding: 14,
    },
    warningText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 17,
        fontWeight: '700',
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
    imageCard: {
        padding: 0,
        overflow: 'hidden',
    },
    teamImage: {
        width: '100%',
        height: 190,
    },
    itemList: {
        paddingHorizontal: 10,
        paddingBottom: 10,
        gap: 9,
    },
    sectionCard: {
        padding: 16,
        gap: 12,
    },
    filterCard: {
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
    sectionHeaderText: {
        flex: 1,
        minWidth: 0,
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
    infoList: {
        gap: 10,
    },
    infoRow: {
        minHeight: 42,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    infoIcon: {
        width: 31,
        height: 31,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoContent: {
        flex: 1,
        minWidth: 0,
    },
    infoLabel: {
        fontSize: 11,
        lineHeight: 15,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    infoValue: {
        marginTop: 1,
        fontSize: 14,
        lineHeight: 19,
        fontWeight: '800',
    },
    venueBox: {
        borderWidth: 1,
        borderRadius: 18,
        padding: 12,
        gap: 10,
    },
    venueTitle: {
        fontSize: 14,
        lineHeight: 19,
        fontWeight: '900',
    },
    personCard: {
        borderWidth: 1,
        borderRadius: 22,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
    },
    balanceCard: {
        borderWidth: 1,
        borderRadius: 22,
        padding: 12,
        gap: 11,
    },
    balanceTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cardPressed: {
        opacity: 0.78,
        transform: [{ scale: 0.992 }],
    },
    rankBadge: {
        width: 38,
        height: 38,
        borderRadius: 999,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankText: {
        fontSize: 14,
        lineHeight: 18,
        fontWeight: '900',
    },
    personContent: {
        flex: 1,
        minWidth: 0,
        gap: 6,
    },
    personName: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '900',
    },
    personMetaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    balanceStatGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    balanceStat: {
        flex: 1,
        minWidth: 0,
        minHeight: 52,
        borderRadius: 15,
        borderWidth: 1,
        paddingHorizontal: 7,
        paddingVertical: 7,
        justifyContent: 'center',
    },
    balanceStatLabel: {
        fontSize: 9,
        lineHeight: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    balanceStatValue: {
        marginTop: 3,
        fontSize: 14,
        lineHeight: 18,
        fontWeight: '900',
    },
    splitRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    miniStatRow: {
        flexDirection: 'row',
        gap: 8,
    },
    miniStat: {
        flex: 1,
        minWidth: 0,
        minHeight: 54,
        borderRadius: 15,
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 8,
        justifyContent: 'center',
    },
    miniStatLabel: {
        fontSize: 9,
        lineHeight: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    miniStatValue: {
        marginTop: 3,
        fontSize: 13,
        lineHeight: 17,
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
