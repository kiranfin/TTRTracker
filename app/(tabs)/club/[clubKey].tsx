import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ttApi } from '../../../src/api/tttracker';
import { Badge } from '../../../src/components/Badge';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { Screen } from '../../../src/components/Screen';
import { SegmentedTabs } from '../../../src/components/SegmentedTabs';
import { useTheme } from '../../../src/theme/ThemeProvider';
import type { ClubTeam, ScheduleMatch } from '../../../src/types/tttracker';
import {
    formatDate,
    matchStatusLabel,
    normalizeSchedule,
    normalizeTeams,
} from '../../../src/utils/normalizers';

type ClubTab = 'teams' | 'players' | 'schedule';

type ClubPlayer = {
    id?: string;
    nuid?: string;
    name: string;
    teamName?: string;
    leagueName?: string;
    clubName?: string;
    association?: string;
    country?: string;
    rank?: string;
    globalRank?: string;
    nationalRank?: string;
    matchCount?: string;
};

type ClubScheduleMatch = ScheduleMatch & {
    clubTeamName?: string;
    leagueName?: string;
};

type ScheduleDateGroup = {
    dateKey: string;
    dateLabel: string;
    matches: ClubScheduleMatch[];
};

type RichObject = Record<string, unknown>;

type ClubApiWithOptionalEndpoints = typeof ttApi & {
    getClubPlayers?: (
        organization: string,
        clubNumber: string,
        clubName?: string,
        androClubNr?: string,
    ) => Promise<unknown>;
    getClubSchedule?: (
        organization: string,
        clubNumber: string,
        season: string,
        dateStart?: string,
        dateEnd?: string,
    ) => Promise<unknown>;
};

const TEAM_HOME_KEYS = [
    'team_home',
    'teamHome',
    'home_team',
    'homeTeam',
    'home',
    'home_name',
    'teamHomeName',
    'team_home_name',
];

const TEAM_AWAY_KEYS = [
    'team_away',
    'teamAway',
    'away_team',
    'awayTeam',
    'away',
    'away_name',
    'teamAwayName',
    'team_away_name',
];

const MEETING_ID_KEYS = [
    'meeting_id',
    'meetingId',
    'meeting',
    'id',
    'game_id',
    'gameId',
    'match_id',
    'matchId',
];

const MEETING_DATE_KEYS = [
    'date',
    'meeting_date',
    'meetingDate',
    'start_date',
    'startDate',
    'datetime',
    'date_time',
    'dateTime',
    'start_time',
    'startTime',
];

export default function ClubDetailsScreen() {
    const params = useLocalSearchParams<Record<string, string>>();
    const { colors } = useTheme();

    const initialSeason = getInitialSeason(params.season);
    const initialDateRange = getDefaultSeasonDateRange(initialSeason);

    const [activeTab, setActiveTab] = useState<ClubTab>('teams');
    const [teams, setTeams] = useState<ClubTeam[]>([]);
    const [players, setPlayers] = useState<ClubPlayer[]>([]);
    const [scheduleMatches, setScheduleMatches] = useState<ClubScheduleMatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [teamsLoaded, setTeamsLoaded] = useState(false);
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [playersError, setPlayersError] = useState<string | null>(null);
    const [scheduleError, setScheduleError] = useState<string | null>(null);
    const [dateStartDraft, setDateStartDraft] = useState(initialDateRange.dateStart);
    const [dateEndDraft, setDateEndDraft] = useState(initialDateRange.dateEnd);
    const [appliedDateStart, setAppliedDateStart] = useState(initialDateRange.dateStart);
    const [appliedDateEnd, setAppliedDateEnd] = useState(initialDateRange.dateEnd);

    const title = params.title ?? 'Verein';
    const organization = params.organization;
    const clubNumber = params.clubNumber;
    const clubNameForPlayers = emptyToUndefined(params.clubName) ?? emptyToUndefined(params.title);

    const scheduleSeason = useMemo(
        () => getInitialSeason(params.season ?? teams[0]?.season),
        [params.season, teams],
    );

    useEffect(() => {
        const defaultRange = getDefaultSeasonDateRange(scheduleSeason);

        setDateStartDraft(defaultRange.dateStart);
        setDateEndDraft(defaultRange.dateEnd);
        setAppliedDateStart(defaultRange.dateStart);
        setAppliedDateEnd(defaultRange.dateEnd);
    }, [scheduleSeason]);

    useEffect(() => {
        async function load() {
            if (!organization || !clubNumber) {
                setLoading(false);
                setTeamsLoaded(false);
                setError('Für diesen Verein fehlen Verband oder Vereinsnummer.');
                return;
            }

            setLoading(true);
            setTeamsLoaded(false);
            setError(null);
            setPlayersError(null);
            setScheduleError(null);
            setTeams([]);
            setPlayers([]);
            setScheduleMatches([]);

            try {
                const teamsResponse = await ttApi.getClubTeams(organization, clubNumber);
                const normalizedTeams = normalizeTeams(teamsResponse);

                setTeams(normalizedTeams);
                setTeamsLoaded(true);

                const clubApi = ttApi as ClubApiWithOptionalEndpoints;

                try {
                    const playersResult = await loadClubPlayers(
                        clubApi,
                        organization,
                        clubNumber,
                        clubNameForPlayers,
                    );
                    setPlayers(playersResult);
                } catch (playersLoadError) {
                    setPlayers([]);
                    setPlayersError(
                        playersLoadError instanceof Error
                            ? playersLoadError.message
                            : 'Spieler konnten nicht geladen werden',
                    );
                }
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : 'Vereinsdaten konnten nicht geladen werden');
                setTeamsLoaded(false);
            } finally {
                setLoading(false);
            }
        }

        load().catch(() => undefined);
    }, [organization, clubNumber, clubNameForPlayers]);

    useEffect(() => {
        async function loadScheduleForFilter() {
            if (!organization || !clubNumber || !teamsLoaded || error) {
                return;
            }

            if (!isValidDateInput(appliedDateStart) || !isValidDateInput(appliedDateEnd)) {
                setScheduleMatches([]);
                setScheduleError('Bitte nutze für Start und Ende das Format YYYY-MM-DD.');
                return;
            }

            setScheduleLoading(true);
            setScheduleError(null);

            try {
                const clubApi = ttApi as ClubApiWithOptionalEndpoints;
                const matches = await loadClubSchedule(clubApi, organization, clubNumber, teams, {
                    season: scheduleSeason,
                    dateStart: appliedDateStart,
                    dateEnd: appliedDateEnd,
                });

                setScheduleMatches(matches);
            } catch (loadError) {
                setScheduleMatches([]);
                setScheduleError(
                    loadError instanceof Error ? loadError.message : 'Spielplan konnte nicht geladen werden',
                );
            } finally {
                setScheduleLoading(false);
            }
        }

        loadScheduleForFilter().catch(() => undefined);
    }, [organization, clubNumber, teams, teamsLoaded, error, scheduleSeason, appliedDateStart, appliedDateEnd]);

    const scheduleGroups = useMemo(
        () => groupScheduleByDate(scheduleMatches),
        [scheduleMatches],
    );

    const applyScheduleFilter = () => {
        if (!isValidDateInput(dateStartDraft) || !isValidDateInput(dateEndDraft)) {
            setScheduleError('Bitte nutze für Start und Ende das Format YYYY-MM-DD.');
            return;
        }

        setAppliedDateStart(dateStartDraft.trim());
        setAppliedDateEnd(dateEndDraft.trim());
    };

    const resetScheduleFilter = () => {
        const defaultRange = getDefaultSeasonDateRange(scheduleSeason);

        setDateStartDraft(defaultRange.dateStart);
        setDateEndDraft(defaultRange.dateEnd);
        setAppliedDateStart(defaultRange.dateStart);
        setAppliedDateEnd(defaultRange.dateEnd);
    };

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                    <BackButton />

                    <View style={styles.headerText}>
                        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                            {title}
                        </Text>

                        <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={1}>
                            {[params.state, organization].filter(Boolean).join(' • ') || 'Verein'}
                        </Text>
                    </View>
                </View>

                <Card style={styles.infoCard}>
                    <InfoRow label="Vereinsnummer" value={clubNumber || 'Nicht verfügbar'} />
                    <InfoRow label="Bundesland" value={params.state || 'Nicht verfügbar'} />
                    <InfoRow label="Verband" value={organization || params.organizationName || 'Nicht verfügbar'} />
                </Card>

                <SegmentedTabs
                    value={activeTab}
                    onChange={setActiveTab}
                    options={[
                        { value: 'teams', label: 'Mannschaften', icon: 'people-outline' },
                        { value: 'players', label: 'Spieler', icon: 'person-outline' },
                        { value: 'schedule', label: 'Spielplan', icon: 'calendar-outline' },
                    ]}
                />

                {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
                {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

                {!loading && !error && activeTab === 'teams' ? (
                    <View style={styles.stack}>
                        <View style={styles.sectionHeader}>
                            <View>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Mannschaften</Text>
                                <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                                    Teams und zugehörige Ligen
                                </Text>
                            </View>

                            <Badge tone="secondary">{teams.length}</Badge>
                        </View>

                        {teams.length === 0 ? (
                            <EmptyState icon="people-outline" title="Keine Mannschaften gefunden" />
                        ) : null}

                        <View style={styles.stack}>
                            {teams.map((team, index) => (
                                <TeamCard key={getTeamKey(team, index)} team={team} />
                            ))}
                        </View>
                    </View>
                ) : null}

                {!loading && !error && activeTab === 'players' ? (
                    <View style={styles.stack}>
                        <View style={styles.sectionHeader}>
                            <View>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Spieler</Text>
                                <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                                    andro-Rangliste dieses Vereins
                                </Text>
                            </View>

                            <Badge tone="secondary">{players.length}</Badge>
                        </View>

                        {playersError ? (
                            <Text style={[styles.error, { color: colors.destructive }]}>{playersError}</Text>
                        ) : null}

                        {!playersError && players.length === 0 ? (
                            <EmptyState
                                icon="person-outline"
                                title="Keine Spieler gefunden"
                                subtitle="Für diesen Verein wurden über die andro-Rangliste keine Spieler gefunden."
                            />
                        ) : null}

                        <View style={styles.stack}>
                            {players.map((player, index) => (
                                <PlayerCard key={getPlayerKey(player, index)} player={player} />
                            ))}
                        </View>
                    </View>
                ) : null}

                {!loading && !error && activeTab === 'schedule' ? (
                    <View style={styles.stack}>
                        <View style={styles.sectionHeader}>
                            <View>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Spielplan</Text>
                                <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                                    Begegnungen aller Vereinsmannschaften
                                </Text>
                            </View>

                            <Badge tone="secondary">{scheduleMatches.length}</Badge>
                        </View>

                        <ScheduleFilterCard
                            season={scheduleSeason}
                            dateStart={dateStartDraft}
                            dateEnd={dateEndDraft}
                            loading={scheduleLoading}
                            onChangeDateStart={setDateStartDraft}
                            onChangeDateEnd={setDateEndDraft}
                            onApply={applyScheduleFilter}
                            onReset={resetScheduleFilter}
                        />

                        {scheduleError ? (
                            <Text style={[styles.error, { color: colors.destructive }]}>{scheduleError}</Text>
                        ) : null}

                        {scheduleLoading ? <ActivityIndicator color={colors.primary} style={styles.inlineLoader} /> : null}

                        {!scheduleLoading && !scheduleError && scheduleGroups.length === 0 ? (
                            <EmptyState icon="calendar-outline" title="Keine Begegnungen gefunden" />
                        ) : null}

                        <View style={styles.stack}>
                            {scheduleGroups.map((group) => (
                                <Card key={group.dateKey} style={styles.scheduleDayCard}>
                                    <View style={styles.scheduleDayHeader}>
                                        <View
                                            style={[
                                                styles.scheduleDayIcon,
                                                {
                                                    backgroundColor: colors.primarySoft,
                                                    borderColor: colors.primarySoftBorder,
                                                },
                                            ]}
                                        >
                                            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                                        </View>

                                        <View style={styles.scheduleDayTitleBlock}>
                                            <Text style={[styles.scheduleDayTitle, { color: colors.text }]}>
                                                {group.dateLabel}
                                            </Text>
                                            <Text style={[styles.scheduleDaySubtitle, { color: colors.mutedText }]}>
                                                {group.matches.length} Begegnung
                                                {group.matches.length === 1 ? '' : 'en'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.stack}>
                                        {group.matches.map((match, index) => (
                                            <ClubMatchCard
                                                key={`${group.dateKey}-${match.id ?? 'no-id'}-${index}`}
                                                match={match}
                                            />
                                        ))}
                                    </View>
                                </Card>
                            ))}
                        </View>
                    </View>
                ) : null}
            </ScrollView>
        </Screen>
    );
}

function ScheduleFilterCard({
                                season,
                                dateStart,
                                dateEnd,
                                loading,
                                onChangeDateStart,
                                onChangeDateEnd,
                                onApply,
                                onReset,
                            }: {
    season: string;
    dateStart: string;
    dateEnd: string;
    loading: boolean;
    onChangeDateStart: (value: string) => void;
    onChangeDateEnd: (value: string) => void;
    onApply: () => void;
    onReset: () => void;
}) {
    const { colors } = useTheme();
    const startInvalid = !isValidDateInput(dateStart);
    const endInvalid = !isValidDateInput(dateEnd);
    const canApply = !loading && !startInvalid && !endInvalid;

    return (
        <Card style={styles.filterCard}>
            <View style={styles.filterHeader}>
                <View>
                    <Text style={[styles.filterTitle, { color: colors.text }]}>Zeitraum</Text>
                    <Text style={[styles.filterSubtitle, { color: colors.mutedText }]}>Saison {season}</Text>
                </View>

                <Badge tone="outline">YYYY-MM-DD</Badge>
            </View>

            <View style={styles.filterRow}>
                <View style={styles.dateInputBlock}>
                    <Text style={[styles.inputLabel, { color: colors.mutedText }]}>Start</Text>
                    <TextInput
                        value={dateStart}
                        onChangeText={onChangeDateStart}
                        placeholder="2026-01-01"
                        placeholderTextColor={colors.mutedText}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={[
                            styles.dateInput,
                            {
                                color: colors.text,
                                backgroundColor: colors.card,
                                borderColor: startInvalid ? colors.destructive : colors.border,
                            },
                        ]}
                    />
                </View>

                <View style={styles.dateInputBlock}>
                    <Text style={[styles.inputLabel, { color: colors.mutedText }]}>Ende</Text>
                    <TextInput
                        value={dateEnd}
                        onChangeText={onChangeDateEnd}
                        placeholder="2026-06-30"
                        placeholderTextColor={colors.mutedText}
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={[
                            styles.dateInput,
                            {
                                color: colors.text,
                                backgroundColor: colors.card,
                                borderColor: endInvalid ? colors.destructive : colors.border,
                            },
                        ]}
                    />
                </View>
            </View>

            <View style={styles.filterButtonRow}>
                <Pressable
                    onPress={onReset}
                    disabled={loading}
                    style={({ pressed }) => [
                        styles.resetButton,
                        {
                            backgroundColor: pressed ? colors.muted : 'transparent',
                            borderColor: colors.border,
                            opacity: loading ? 0.6 : 1,
                        },
                    ]}
                >
                    <Text style={[styles.resetButtonText, { color: colors.text }]}>Zurücksetzen</Text>
                </Pressable>

                <Pressable
                    onPress={onApply}
                    disabled={!canApply}
                    style={({ pressed }) => [
                        styles.applyButton,
                        {
                            backgroundColor: pressed ? colors.primarySoft : colors.primary,
                            opacity: canApply ? 1 : 0.55,
                        },
                    ]}
                >
                    <Text style={styles.applyButtonText}>Anwenden</Text>
                </Pressable>
            </View>
        </Card>
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

function TeamCard({ team }: { team: ClubTeam }) {
    const { colors } = useTheme();

    return (
        <Card
            pressable={Boolean(team.groupId && team.association)}
            style={styles.teamCard}
            onPress={() => {
                if (!team.groupId || !team.association) return;

                router.push({
                    pathname: '/league/[leagueKey]',
                    params: {
                        leagueKey: team.groupId,
                        association: team.association,
                        groupId: team.groupId,
                        season: team.season ?? '25/26',
                        leagueSlug: team.leagueSlug ?? 'x',
                        title: team.leagueName,
                    },
                });
            }}
        >
            <View style={styles.teamTopRow}>
                <View
                    style={[
                        styles.teamIcon,
                        {
                            backgroundColor: colors.primarySoft,
                            borderColor: colors.primarySoftBorder,
                        },
                    ]}
                >
                    <Ionicons name="people-outline" size={20} color={colors.primary} />
                </View>

                <View style={styles.teamText}>
                    <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2}>
                        {team.teamName}
                    </Text>
                    <Text style={[styles.teamLeague, { color: colors.mutedText }]} numberOfLines={2}>
                        {team.leagueName}
                    </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </View>

            <View style={styles.badgeRow}>
                {team.tableRank ? <Badge tone="secondary">Platz {team.tableRank}</Badge> : null}

                {team.pointsWon || team.pointsLost ? (
                    <Badge tone="outline">
                        {team.pointsWon ?? '0'}:{team.pointsLost ?? '0'} Punkte
                    </Badge>
                ) : null}

                {team.season ? <Badge tone="outline">{team.season}</Badge> : null}
            </View>
        </Card>
    );
}

function PlayerCard({ player }: { player: ClubPlayer }) {
    const { colors } = useTheme();
    const canOpen = Boolean(player.nuid);

    const metaText =
        [player.teamName, player.leagueName, player.clubName, player.association]
            .filter(Boolean)
            .join(' • ') || 'Spieler';

    return (
        <Card
            pressable={canOpen}
            style={styles.playerCard}
            onPress={
                canOpen
                    ? () =>
                        router.push({
                            pathname: '/player/[nuid]',
                            params: {
                                nuid: player.nuid!,
                                title: player.name,
                            },
                        })
                    : undefined
            }
        >
            <View style={styles.playerTopRow}>
                <View
                    style={[
                        styles.playerIcon,
                        {
                            backgroundColor: colors.primarySoft,
                            borderColor: colors.primarySoftBorder,
                        },
                    ]}
                >
                    <Ionicons name="person-outline" size={19} color={colors.primary} />
                </View>

                <View style={styles.playerText}>
                    <Text style={[styles.playerName, { color: colors.text }]} numberOfLines={2}>
                        {player.name}
                    </Text>

                    <Text style={[styles.playerMeta, { color: colors.mutedText }]} numberOfLines={2}>
                        {metaText}
                    </Text>
                </View>

                {canOpen ? <Ionicons name="chevron-forward" size={18} color={colors.mutedText} /> : null}
            </View>

            <View style={styles.badgeRow}>
                {player.rank ? <Badge tone="outline">Rang {player.rank}</Badge> : null}
                {player.nuid ? <Badge tone="outline">{player.nuid}</Badge> : null}
                {player.matchCount ? <Badge tone="outline">{player.matchCount} Spiele</Badge> : null}
            </View>
        </Card>
    );
}

function ClubMatchCard({ match }: { match: ClubScheduleMatch }) {
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
            style={styles.matchCard}
        >
            <View style={styles.matchTopMeta}>
                <View style={styles.metaLine}>
                    <Ionicons name="time-outline" size={13} color={colors.mutedText} />
                    <Text style={[styles.metaText, { color: colors.mutedText }]}>
                        {match.time || 'Uhrzeit offen'}
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
                {match.clubTeamName || match.leagueName ? (
                    <View style={styles.metaLine}>
                        <Ionicons name="people-outline" size={13} color={colors.mutedText} />
                        <Text style={[styles.metaText, { color: colors.mutedText }]} numberOfLines={1}>
                            {[match.clubTeamName, match.leagueName].filter(Boolean).join(' • ')}
                        </Text>
                    </View>
                ) : null}

                {match.roundName || match.meetingNumber ? (
                    <View style={styles.metaLine}>
                        <Ionicons name="flag-outline" size={13} color={colors.mutedText} />
                        <Text style={[styles.metaText, { color: colors.mutedText }]} numberOfLines={1}>
                            {[match.roundName, match.meetingNumber ? `Spiel ${match.meetingNumber}` : undefined]
                                .filter(Boolean)
                                .join(' • ')}
                        </Text>
                    </View>
                ) : null}
            </View>
        </Card>
    );
}

async function loadClubPlayers(
    clubApi: ClubApiWithOptionalEndpoints,
    organization: string,
    clubNumber: string,
    clubName?: string,
) {
    if (!clubApi.getClubPlayers) {
        throw new Error('Der Vereins-Spieler-Endpunkt ist in ttApi.getClubPlayers noch nicht eingebunden.');
    }

    const response = await clubApi.getClubPlayers(
        organization,
        clubNumber,
        emptyToUndefined(clubName),
    );

    return normalizeClubPlayers(response);
}

async function loadClubSchedule(
    clubApi: ClubApiWithOptionalEndpoints,
    organization: string,
    clubNumber: string,
    teams: ClubTeam[],
    options: {
        season: string;
        dateStart?: string;
        dateEnd?: string;
    },
) {
    if (clubApi.getClubSchedule) {
        const response = await clubApi.getClubSchedule(
            organization,
            clubNumber,
            options.season,
            emptyToUndefined(options.dateStart),
            emptyToUndefined(options.dateEnd),
        );

        const teamNames = teams.map((team) => team.teamName).filter(Boolean);
        const clubMatches = normalizeClubScheduleResponse(response, teamNames);

        const fallbackMatches =
            clubMatches.length > 0
                ? clubMatches
                : (normalizeSchedule(response) as ClubScheduleMatch[]).map((match) => ({
                    ...match,
                    clubTeamName: match.clubTeamName ?? findMatchedTeamName(match, teamNames),
                }));

        return sortSchedule(
            dedupeSchedule(
                filterMatchesByDate(fallbackMatches, options.dateStart, options.dateEnd),
            ),
        );
    }

    return loadClubScheduleFromTeamLeagues(teams, options);
}

async function loadClubScheduleFromTeamLeagues(
    teams: ClubTeam[],
    options?: {
        dateStart?: string;
        dateEnd?: string;
    },
) {
    const leagues = new Map<
        string,
        {
            association: string;
            groupId: string;
            season: string;
            leagueSlug: string;
            leagueName?: string;
            teamNames: string[];
        }
    >();

    for (const team of teams) {
        if (!team.association || !team.groupId || !team.teamName) continue;

        const season = team.season ?? '25/26';
        const leagueSlug = team.leagueSlug ?? 'x';
        const key = [team.association, season, team.groupId, leagueSlug].join('|');

        const current =
            leagues.get(key) ??
            {
                association: team.association,
                groupId: team.groupId,
                season,
                leagueSlug,
                leagueName: team.leagueName,
                teamNames: [],
            };

        if (!current.teamNames.some((name) => normalizeTeamKey(name) === normalizeTeamKey(team.teamName))) {
            current.teamNames.push(team.teamName);
        }

        leagues.set(key, current);
    }

    const results = await Promise.allSettled(
        [...leagues.values()].map(async (league) => {
            const response = await ttApi.getLeagueSchedule(
                league.association,
                league.season,
                league.groupId,
                league.leagueSlug,
            );

            return normalizeSchedule(response)
                .filter((match) => isMatchForAnyTeam(match, league.teamNames))
                .map((match) => ({
                    ...match,
                    clubTeamName: findMatchedTeamName(match, league.teamNames),
                    leagueName: league.leagueName,
                }));
        }),
    );

    const matches = results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
    return sortSchedule(dedupeSchedule(filterMatchesByDate(matches, options?.dateStart, options?.dateEnd)));
}

function normalizeClubScheduleResponse(response: unknown, teamNames: string[]) {
    const meetings = collectClubMeetings(response);

    return meetings
        .map((meeting, index) => normalizeClubScheduleMeeting(meeting, index, teamNames))
        .filter((match): match is ClubScheduleMatch => Boolean(match));
}

function collectClubMeetings(value: unknown): unknown[] {
    const result: unknown[] = [];
    collectClubMeetingsInto(value, result);

    const seen = new Set<string>();

    return result.filter((item) => {
        const key = JSON.stringify(item);

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function collectClubMeetingsInto(value: unknown, result: unknown[], depth = 0) {
    if (depth > 10 || value === null || value === undefined) {
        return;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            collectClubMeetingsInto(item, result, depth + 1);
        }

        return;
    }

    if (typeof value !== 'object') {
        return;
    }

    const object = value as RichObject;

    if (looksLikeClubMeeting(object)) {
        result.push(object);
        return;
    }

    for (const key of ['meetings', 'matches', 'rows', 'items', 'data', 'meetings_by_date', 'meetingsByDate']) {
        if (key in object) {
            collectClubMeetingsInto(object[key], result, depth + 1);
        }
    }

    for (const nestedValue of Object.values(object)) {
        collectClubMeetingsInto(nestedValue, result, depth + 1);
    }
}

function looksLikeClubMeeting(row: RichObject) {
    const hasHomeTeam = Boolean(pickDeepString(row, TEAM_HOME_KEYS));
    const hasAwayTeam = Boolean(pickDeepString(row, TEAM_AWAY_KEYS));
    const hasAnyTeam = hasHomeTeam || hasAwayTeam;
    const hasId = Boolean(pickDeepString(row, MEETING_ID_KEYS));
    const hasDate = Boolean(pickDeepString(row, MEETING_DATE_KEYS));
    const hasStatus = Boolean(pickDeepString(row, ['state', 'status', 'meeting_state', 'meetingState']));

    return Boolean((hasAnyTeam && (hasDate || hasId || hasStatus)) || (hasId && hasDate));
}

function normalizeClubScheduleMeeting(
    value: unknown,
    index: number,
    teamNames: string[],
): ClubScheduleMatch | null {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const raw = value as RichObject;

    const homeTeam = pickDeepString(raw, TEAM_HOME_KEYS) ?? 'Heim';
    const awayTeam = pickDeepString(raw, TEAM_AWAY_KEYS) ?? 'Gast';

    const id = pickDeepString(raw, MEETING_ID_KEYS);

    const date =
        pickDeepString(raw, MEETING_DATE_KEYS) ??
        undefined;

    const time =
        pickDeepString(raw, ['time', 'start_time_label', 'startTimeLabel', 'start_time', 'startTime']) ??
        extractTimeFromDateValue(date);

    const homeScore = pickDeepString(raw, [
        'matches_won',
        'matchesWon',
        'home_score',
        'homeScore',
        'score_home',
        'scoreHome',
        'sets_home',
    ]);

    const awayScore = pickDeepString(raw, [
        'matches_lost',
        'matchesLost',
        'away_score',
        'awayScore',
        'score_away',
        'scoreAway',
        'sets_away',
    ]);

    const leagueName = pickDeepString(raw, [
        'league_name',
        'leagueName',
        'league',
        'group_name',
        'groupName',
        'class_name',
        'className',
    ]);

    const roundName = pickDeepString(raw, [
        'round_name',
        'roundName',
        'round',
        'game_day',
        'gameDay',
        'match_day',
        'matchDay',
    ]);

    const meetingNumber = pickDeepString(raw, [
        'meeting_number',
        'meetingNumber',
        'match_number',
        'matchNumber',
        'number',
    ]);

    const rawStatus = pickDeepString(raw, ['state', 'status', 'meeting_state', 'meetingState']);
    const status = normalizeClubMeetingStatus(rawStatus, homeScore, awayScore);

    return {
        id: id ?? `${date ?? 'no-date'}-${homeTeam}-${awayTeam}-${index}`,
        date,
        time,
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        status,
        leagueName,
        roundName,
        meetingNumber,
        clubTeamName: findMatchedTeamName(
            {
                homeTeam,
                awayTeam,
            } as ScheduleMatch,
            teamNames,
        ),
    } as ClubScheduleMatch;
}

function normalizeClubMeetingStatus(
    rawStatus?: string,
    homeScore?: string,
    awayScore?: string,
): ScheduleMatch['status'] {
    const normalized = String(rawStatus ?? '').trim().toLowerCase();

    if (normalized.includes('spielfrei') || normalized.includes('frei')) {
        return 'free';
    }

    if (
        normalized.includes('beendet') ||
        normalized.includes('gespielt') ||
        normalized.includes('completed') ||
        normalized.includes('done') ||
        (homeScore !== undefined && awayScore !== undefined)
    ) {
        return 'completed';
    }

    return 'scheduled';
}

function pickDeepString(row: RichObject, keys: string[]) {
    for (const key of keys) {
        const value = row[key];

        if (value === undefined || value === null || value === '') {
            continue;
        }

        if (typeof value === 'string' || typeof value === 'number') {
            return String(value);
        }

        if (typeof value === 'object' && !Array.isArray(value)) {
            const nested = value as RichObject;
            const nestedValue = pickString(nested, [
                'name',
                'team_name',
                'teamName',
                'label',
                'title',
                'display_name',
                'displayName',
                'value',
            ]);

            if (nestedValue !== undefined) {
                return nestedValue;
            }
        }
    }

    return undefined;
}

function extractTimeFromDateValue(value?: string) {
    const raw = String(value ?? '').trim();

    const isoTime = raw.match(/T(\d{2}):(\d{2})/);
    if (isoTime) {
        return `${isoTime[1]}:${isoTime[2]}`;
    }

    const plainTime = raw.match(/\b(\d{1,2}):(\d{2})\b/);
    if (plainTime) {
        return `${plainTime[1].padStart(2, '0')}:${plainTime[2]}`;
    }

    return undefined;
}

function normalizeClubPlayers(response: unknown) {
    const array = findClubPlayersArray(response);

    return array
        .map(normalizeClubPlayer)
        .filter((player): player is ClubPlayer => Boolean(player))
        .sort(comparePlayers);
}

function findClubPlayersArray(value: unknown): unknown[] {
    if (Array.isArray(value)) {
        return value;
    }

    if (!value || typeof value !== 'object') {
        return [];
    }

    const object = value as RichObject;
    const outerData = object.data;

    if (Array.isArray(outerData)) {
        return outerData;
    }

    if (outerData && typeof outerData === 'object') {
        const outerDataObject = outerData as RichObject;

        if (Array.isArray(outerDataObject.data)) {
            return outerDataObject.data;
        }

        if (Array.isArray(outerDataObject.players)) {
            return outerDataObject.players;
        }

        if (Array.isArray(outerDataObject.results)) {
            return outerDataObject.results;
        }
    }

    if (Array.isArray(object.players)) {
        return object.players;
    }

    if (Array.isArray(object.results)) {
        return object.results;
    }

    return findFirstArray(value);
}

function normalizeClubPlayer(value: unknown, index: number): ClubPlayer | null {
    if (!value || typeof value !== 'object') return null;

    const raw = value as RichObject;

    const firstName = pickString(raw, ['firstname', 'first_name', 'firstName', 'givenName']);
    const lastName = pickString(raw, ['lastname', 'last_name', 'lastName', 'familyName']);

    const generatedName = [firstName, lastName].filter(Boolean).join(' ').trim();

    const name =
        pickString(raw, [
            'full_name',
            'fullName',
            'fullname',
            'name',
            'playerName',
            'player_name',
            'personName',
            'person_name',
            'displayName',
        ]) ??
        (generatedName ||
        `Spieler ${index + 1}`);

    if (!name.trim()) return null;

    const nuid = pickString(raw, [
        'nuid',
        'nuId',
        'nu_id',
        'person_id',
        'personId',
        'internal_id',
        'internalId',
    ]);

    return {
        id:
            pickString(raw, [
                'id',
                'ranking_id',
                'rankingId',
                'playerId',
                'player_id',
                'person_id',
                'personId',
            ]) ?? nuid,
        nuid,
        name,
        teamName: pickString(raw, ['teamName', 'team_name', 'team']),
        leagueName: pickString(raw, ['leagueName', 'league_name', 'league']),
        clubName: pickString(raw, ['club_name', 'clubName', 'club']),
        association: pickString(raw, ['association', 'fedNickname', 'organization', 'organization_short']),
        country: pickString(raw, ['country']),
        rank: pickString(raw, ['club_rank', 'clubRank', 'rank', 'position', 'teamRank', 'team_rank']),
        globalRank: pickString(raw, ['global_rank', 'globalRank']),
        nationalRank: pickString(raw, ['national_rank', 'nationalRank', 'germanRank']),
        matchCount: pickString(raw, ['match_count', 'matchCount', 'few_games', 'fewGames']),
    };
}

function filterMatchesByDate(matches: ClubScheduleMatch[], dateStart?: string, dateEnd?: string) {
    const start = parseDateInput(dateStart);
    const end = parseDateInput(dateEnd);

    if (!start && !end) {
        return matches;
    }

    return matches.filter((match) => {
        const matchDate = parseMatchDate(match.date);

        if (!matchDate) {
            return false;
        }

        if (start && matchDate < start) {
            return false;
        }

        if (end && matchDate > end) {
            return false;
        }

        return true;
    });
}

function getInitialSeason(value?: string) {
    const normalized = normalizeBackendSeason(value);

    if (normalized) {
        return normalized;
    }

    return getCurrentBackendSeason();
}

function normalizeBackendSeason(value?: string) {
    const raw = String(value ?? '').trim();

    if (!raw) {
        return undefined;
    }

    const slashMatch = raw.match(/^(\d{2})\/(\d{2})$/);
    if (slashMatch) {
        return `${slashMatch[1]}--${slashMatch[2]}`;
    }

    const dashMatch = raw.match(/^(\d{2})--(\d{2})$/);
    if (dashMatch) {
        return `${dashMatch[1]}--${dashMatch[2]}`;
    }

    return raw;
}

function getCurrentBackendSeason() {
    const now = new Date();
    const fullYear = now.getFullYear();
    const month = now.getMonth() + 1;
    const startYear = month >= 7 ? fullYear : fullYear - 1;
    const endYear = startYear + 1;

    return `${String(startYear).slice(-2)}--${String(endYear).slice(-2)}`;
}

function getDefaultSeasonDateRange(season: string) {
    const match = season.match(/^(\d{2})--(\d{2})$/);

    if (!match) {
        return {
            dateStart: '',
            dateEnd: '',
        };
    }

    return {
        dateStart: `20${match[1]}-07-01`,
        dateEnd: `20${match[2]}-06-30`,
    };
}

function isValidDateInput(value?: string) {
    const raw = String(value ?? '').trim();

    if (!raw) {
        return true;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return false;
    }

    return Boolean(parseDateInput(raw));
}

function parseDateInput(value?: string) {
    const raw = String(value ?? '').trim();
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
        return undefined;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = startOfDay(new Date(year, month - 1, day));

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return undefined;
    }

    return date;
}

function emptyToUndefined(value?: string) {
    const raw = String(value ?? '').trim();
    return raw.length > 0 ? raw : undefined;
}

function groupScheduleByDate(matches: ClubScheduleMatch[]): ScheduleDateGroup[] {
    const groups = new Map<string, ScheduleDateGroup>();

    for (const match of sortSchedule(matches)) {
        const dateKey = getDateKey(match.date);
        const dateLabel = match.date ? formatDate(match.date) : 'Ohne Datum';

        const group =
            groups.get(dateKey) ??
            {
                dateKey,
                dateLabel,
                matches: [],
            };

        group.matches.push(match);
        groups.set(dateKey, group);
    }

    return [...groups.values()].sort((left, right) => compareDateKeys(left.dateKey, right.dateKey));
}

function sortSchedule(matches: ClubScheduleMatch[]) {
    return [...matches].sort((left, right) => {
        const leftDate = parseMatchDate(left.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const rightDate = parseMatchDate(right.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;

        if (leftDate !== rightDate) return leftDate - rightDate;

        return getTimeValue(left.time) - getTimeValue(right.time);
    });
}

function dedupeSchedule(matches: ClubScheduleMatch[]) {
    const seen = new Set<string>();
    const result: ClubScheduleMatch[] = [];

    for (const match of matches) {
        const key = getScheduleMatchKey(match);

        if (seen.has(key)) continue;

        seen.add(key);
        result.push(match);
    }

    return result;
}

function getScheduleMatchKey(match: ClubScheduleMatch) {
    return (
        [
            match.id,
            match.date,
            match.time,
            normalizeTeamKey(match.homeTeam),
            normalizeTeamKey(match.awayTeam),
            match.homeScore,
            match.awayScore,
        ]
            .filter((value) => value !== undefined && value !== null && value !== '')
            .join('|') || Math.random().toString(36)
    );
}

function isMatchForAnyTeam(match: ScheduleMatch, teamNames: string[]) {
    return teamNames.some((teamName) => isMatchForTeam(match, teamName));
}

function isMatchForTeam(match: ScheduleMatch, teamName?: string) {
    const teamKey = normalizeTeamKey(teamName);
    if (!teamKey) return false;

    return normalizeTeamKey(match.homeTeam) === teamKey || normalizeTeamKey(match.awayTeam) === teamKey;
}

function findMatchedTeamName(match: ScheduleMatch, teamNames: string[]) {
    return teamNames.find((teamName) => isMatchForTeam(match, teamName));
}

function comparePlayers(left: ClubPlayer, right: ClubPlayer) {
    const leftTeam = left.teamName ?? '';
    const rightTeam = right.teamName ?? '';

    if (leftTeam !== rightTeam) {
        return leftTeam.localeCompare(rightTeam, 'de');
    }

    const leftRank = toNumber(left.rank);
    const rightRank = toNumber(right.rank);

    if (leftRank !== undefined && rightRank !== undefined && leftRank !== rightRank) {
        return leftRank - rightRank;
    }

    return left.name.localeCompare(right.name, 'de');
}

function getTeamKey(team: ClubTeam, index: number) {
    return [
        team.association,
        team.groupId,
        team.id,
        team.season,
        team.leagueSlug,
        team.teamName,
        index,
    ]
        .filter(Boolean)
        .join('-');
}

function getPlayerKey(player: ClubPlayer, index: number) {
    return [player.nuid, player.id, player.rank, player.name, player.teamName, index].filter(Boolean).join('-');
}

function findFirstArray(value: unknown, depth = 0): unknown[] {
    if (depth > 8) return [];

    if (Array.isArray(value)) {
        return value;
    }

    if (!value || typeof value !== 'object') {
        return [];
    }

    const object = value as RichObject;

    for (const key of ['items', 'results', 'data', 'players', 'members', 'rows', 'values', 'list']) {
        const nested = findFirstArray(object[key], depth + 1);
        if (nested.length > 0) return nested;
    }

    for (const nestedValue of Object.values(object)) {
        const nested = findFirstArray(nestedValue, depth + 1);
        if (nested.length > 0) return nested;
    }

    return [];
}

function pickString(row: RichObject, keys: string[]) {
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

function toNumber(value: unknown) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : undefined;
}

function normalizeTeamKey(teamName?: string) {
    return (teamName ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function getDateKey(value?: string) {
    const date = parseMatchDate(value);

    if (!date) {
        return '9999-99-99';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function compareDateKeys(left: string, right: string) {
    if (left === '9999-99-99' && right !== '9999-99-99') return 1;
    if (right === '9999-99-99' && left !== '9999-99-99') return -1;

    return left.localeCompare(right);
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

function getTimeValue(value?: string) {
    const raw = String(value ?? '').trim();
    const match = raw.match(/^(\d{1,2}):(\d{2})/);

    if (!match) {
        return Number.MAX_SAFE_INTEGER;
    }

    return Number(match[1]) * 60 + Number(match[2]);
}

const styles = StyleSheet.create({
    content: {
        padding: 16,
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
    filterCard: {
        padding: 14,
        gap: 12,
    },
    filterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    filterTitle: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '900',
    },
    filterSubtitle: {
        marginTop: 2,
        fontSize: 12,
        lineHeight: 17,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 10,
    },
    dateInputBlock: {
        flex: 1,
        gap: 6,
    },
    inputLabel: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '800',
    },
    dateInput: {
        height: 42,
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 12,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '800',
    },
    filterButtonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    resetButton: {
        minHeight: 40,
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resetButtonText: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '900',
    },
    applyButton: {
        minHeight: 40,
        borderRadius: 14,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '900',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    sectionTitle: {
        fontSize: 20,
        lineHeight: 26,
        fontWeight: '900',
    },
    sectionSubtitle: {
        marginTop: 2,
        fontSize: 13,
        lineHeight: 18,
    },
    loader: {
        paddingVertical: 24,
    },
    inlineLoader: {
        paddingVertical: 12,
    },
    error: {
        fontSize: 14,
        lineHeight: 20,
    },
    stack: {
        gap: 12,
    },
    teamCard: {
        padding: 14,
        gap: 12,
    },
    teamTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    teamIcon: {
        width: 42,
        height: 42,
        borderRadius: 15,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    teamText: {
        flex: 1,
        minWidth: 0,
    },
    teamName: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '900',
    },
    teamLeague: {
        marginTop: 2,
        fontSize: 13,
        lineHeight: 18,
    },
    playerCard: {
        padding: 14,
        gap: 12,
    },
    playerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    playerIcon: {
        width: 42,
        height: 42,
        borderRadius: 15,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playerText: {
        flex: 1,
        minWidth: 0,
    },
    playerName: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '900',
    },
    playerMeta: {
        marginTop: 2,
        fontSize: 13,
        lineHeight: 18,
    },
    scheduleDayCard: {
        padding: 14,
        gap: 12,
    },
    scheduleDayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    scheduleDayIcon: {
        width: 38,
        height: 38,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scheduleDayTitleBlock: {
        flex: 1,
        minWidth: 0,
    },
    scheduleDayTitle: {
        fontSize: 17,
        lineHeight: 23,
        fontWeight: '900',
    },
    scheduleDaySubtitle: {
        marginTop: 1,
        fontSize: 12,
        lineHeight: 17,
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