import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { ttApi } from '@/src/api/tttracker';
import { Badge } from '@/src/components/Badge';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { Screen } from '@/src/components/Screen';
import { SegmentedTabs } from '@/src/components/SegmentedTabs';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { ClubTeam } from '@/src/types/tttracker';
import { normalizeTeams } from '@/src/utils/normalizers';
import { clearMeClub, getMeClub, setMeClub } from '@/src/storage/meClub';
import type { MeClub } from '@/src/storage/meClub';
import { addFavorite, isFavorite, removeFavorite } from '@/src/storage/favorites';
import { BackButton, MarkAsMyClubButton, FavoriteClubButton, TeamCard, PlayerCard, ScheduleFilterCard, ClubMatchCard } from '../../../src/features/club-details/components';
import { styles } from '../../../src/features/club-details/styles';
import { getInitialSeason, getDefaultSeasonDateRange, parseClubKey, emptyToUndefined, getClubFavoriteIds, loadClubPlayers, isValidDateInput, loadClubSchedule, CLUB_FAVORITE_TYPE, groupScheduleByDate, getTeamKey, getPlayerKey } from '../../../src/features/club-details/utils';
import type { ClubTab, ClubPlayer, ClubScheduleMatch, ClubApiWithOptionalEndpoints } from '../../../src/features/club-details/types';

export default function ClubDetailsScreen() {
    const params = useLocalSearchParams<Record<string, string>>();
    const { colors } = useTheme();
    const { t } = useI18n();

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

    const [savedMeClub, setSavedMeClub] = useState<MeClub | null>(null);
    const [meClubLoading, setMeClubLoading] = useState(false);

    const [favoriteClubLoading, setFavoriteClubLoading] = useState(false);
    const [isFavoriteClub, setIsFavoriteClub] = useState(false);

    const parsedClubKey = useMemo(
        () => parseClubKey(params.clubKey),
        [params.clubKey],
    );

    const title = emptyToUndefined(params.title) ?? emptyToUndefined(params.clubName) ?? t('club.defaultTitle');
    const organization = emptyToUndefined(params.organization) ?? parsedClubKey.organization;
    const clubNumber = emptyToUndefined(params.clubNumber) ?? parsedClubKey.clubNumber;
    const clubNameForPlayers = emptyToUndefined(params.clubName) ?? emptyToUndefined(params.title);
    const clubFavoriteIds = useMemo(
        () => getClubFavoriteIds(organization, clubNumber, params.clubKey),
        [organization, clubNumber, params.clubKey],
    );
    const clubFavoriteId = clubFavoriteIds[0] ?? '';

    const isMyClub =
        Boolean(organization && clubNumber && savedMeClub) &&
        savedMeClub?.organization === organization &&
        savedMeClub?.clubNumber === clubNumber;

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
                setError(t('club.missingClubData'));
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
                            : t('club.playersLoadError'),
                    );
                }
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : t('club.clubDataLoadError'));
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
                setScheduleError(t('club.invalidDateRange'));
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
                    loadError instanceof Error ? loadError.message : t('club.scheduleLoadError'),
                );
            } finally {
                setScheduleLoading(false);
            }
        }

        loadScheduleForFilter().catch(() => undefined);
    }, [organization, clubNumber, teams, teamsLoaded, error, scheduleSeason, appliedDateStart, appliedDateEnd]);

    useEffect(() => {
        let active = true;

        async function loadSavedMeClub() {
            try {
                const stored = await getMeClub();

                if (!active) return;

                setSavedMeClub(stored);
            } catch {
                if (!active) return;

                setSavedMeClub(null);
            }
        }

        loadSavedMeClub().catch(() => undefined);

        return () => {
            active = false;
        };
    }, [organization, clubNumber]);

    useEffect(() => {
        let active = true;

        async function loadFavoriteClubState() {
            if (!clubFavoriteId) {
                setIsFavoriteClub(false);
                return;
            }

            try {
                const favoriteChecks = await Promise.all(
                    clubFavoriteIds.map((candidateId) => isFavorite(CLUB_FAVORITE_TYPE, candidateId)),
                );

                if (!active) return;

                setIsFavoriteClub(favoriteChecks.some(Boolean));
            } catch {
                if (!active) return;

                setIsFavoriteClub(false);
            }
        }

        loadFavoriteClubState().catch(() => undefined);

        return () => {
            active = false;
        };
    }, [clubFavoriteId, clubFavoriteIds]);

    async function handleMarkAsMyClub() {
        if (!organization || !clubNumber) return;

        setMeClubLoading(true);

        try {
            if (isMyClub) {
                await clearMeClub();
                setSavedMeClub(null);
                return;
            }

            const saved = await setMeClub({
                organization,
                clubNumber,
                title,
                clubName: clubNameForPlayers ?? title,
                state: params.state,
                season: scheduleSeason,
                clubSlug: params.clubSlug ?? 'x',
            });

            setSavedMeClub(saved);
        } catch {
            // Keine sichtbare Statusmeldung: Button bleibt einfach im bisherigen Zustand.
        } finally {
            setMeClubLoading(false);
        }
    }

    async function handleToggleFavoriteClub() {
        if (!clubFavoriteId || !organization || !clubNumber) return;

        setFavoriteClubLoading(true);

        try {
            if (isFavoriteClub) {
                await Promise.all(
                    clubFavoriteIds.map((candidateId) => removeFavorite(CLUB_FAVORITE_TYPE, candidateId)),
                );
                setIsFavoriteClub(false);
                return;
            }

            const subtitle = [params.state, organization].filter(Boolean).join(' • ') || t('club.defaultTitle');

            await addFavorite({
                type: CLUB_FAVORITE_TYPE,
                id: clubFavoriteId,
                title,
                name: title,
                label: title,
                subtitle,
                description: subtitle,
                organization,
                clubNumber,
                clubName: clubNameForPlayers ?? title,
                state: params.state,
                season: scheduleSeason,
                clubSlug: params.clubSlug ?? 'x',
                meta: clubNumber ? t('club.clubNumberShort', { clubNumber }) : undefined,
                params: {
                    organization,
                    organizationName: params.organizationName ?? '',
                    clubNumber,
                    clubName: clubNameForPlayers ?? title,
                    state: params.state ?? '',
                    season: scheduleSeason,
                    clubSlug: params.clubSlug ?? 'x',
                },
            } as Parameters<typeof addFavorite>[0]);

            setIsFavoriteClub(true);
        } catch {
            // Keine sichtbare Statusmeldung: Button bleibt einfach im bisherigen Zustand.
        } finally {
            setFavoriteClubLoading(false);
        }
    }


    const scheduleGroups = useMemo(
        () => groupScheduleByDate(scheduleMatches),
        [scheduleMatches],
    );

    const applyScheduleFilter = () => {
        if (!isValidDateInput(dateStartDraft) || !isValidDateInput(dateEndDraft)) {
            setScheduleError(t('club.invalidDateRange'));
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

                    <View style={styles.headerActions}>
                        <MarkAsMyClubButton
                            active={isMyClub}
                            loading={meClubLoading}
                            onPress={handleMarkAsMyClub}
                        />

                        <FavoriteClubButton
                            active={isFavoriteClub}
                            loading={favoriteClubLoading}
                            onPress={handleToggleFavoriteClub}
                        />
                    </View>
                </View>

                <View style={styles.profileTitleBlock}>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                        {title}
                    </Text>

                    <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={1}>
                        {[params.state, organization, clubNumber ? t('club.idLabel', { clubNumber }) : undefined].filter(Boolean).join(' • ') || t('club.defaultTitle')}
                    </Text>
                </View>

                <SegmentedTabs
                    value={activeTab}
                    onChange={setActiveTab}
                    options={[
                        { value: 'teams', label: t('club.teamsTab'), icon: 'people-outline' },
                        { value: 'players', label: t('club.playersTab'), icon: 'person-outline' },
                        { value: 'schedule', label: t('club.scheduleTab'), icon: 'calendar-outline' },
                    ]}
                />

                {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
                {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

                {!loading && !error && activeTab === 'teams' ? (
                    <View style={styles.stack}>
                        <View style={styles.sectionHeader}>
                            <View>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('club.teamsTab')}</Text>
                            </View>

                            <Badge tone="secondary">{teams.length}</Badge>
                        </View>

                        {teams.length === 0 ? (
                            <EmptyState icon="people-outline" title={t('club.noTeams')} />
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
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('club.playersTab')}</Text>
                            </View>

                            <Badge tone="secondary">{players.length}</Badge>
                        </View>

                        {playersError ? (
                            <Text style={[styles.error, { color: colors.destructive }]}>{playersError}</Text>
                        ) : null}

                        {!playersError && players.length === 0 ? (
                            <EmptyState
                                icon="person-outline"
                                title={t('club.noPlayers')}
                                subtitle={t('club.noPlayersSubtitle')}
                            />
                        ) : null}

                        <View style={styles.stack}>
                            {players.map((player, index) => (
                                <PlayerCard key={getPlayerKey(player, index)} player={player} index={index} />
                            ))}
                        </View>
                    </View>
                ) : null}

                {!loading && !error && activeTab === 'schedule' ? (
                    <View style={styles.stack}>
                        <View style={styles.sectionHeader}>
                            <View>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('club.scheduleTab')}</Text>
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
                            <EmptyState icon="calendar-outline" title={t('club.noMatches')} />
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
                                                {t(group.matches.length === 1 ? 'club.matchesCount_one' : 'club.matchesCount_other', { count: group.matches.length })}
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
