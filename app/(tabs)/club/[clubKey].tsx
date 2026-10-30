import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { EmptyState } from '@/src/components/EmptyState';
import { ListGroup } from '@/src/components/ListGroup';
import { Screen } from '@/src/components/Screen';
import { HeaderIconButton, ScreenHeader } from '@/src/components/ScreenHeader';
import { SegmentedTabs } from '@/src/components/SegmentedTabs';
import { StaleNotice } from '@/src/components/StaleNotice';
import { StatStrip } from '@/src/components/StatStrip';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import {
    ClubHeader,
    ClubInfoSheet,
    ClubPlayerRow,
    ClubScheduleTab,
    ClubTeamRow,
    NextMatchCard,
} from '../../../src/features/club-details/components';
import { useClubDetails } from '../../../src/features/club-details/hooks/useClubDetails';
import { styles } from '../../../src/features/club-details/styles';
import { getPlayerKey, getTeamKey } from '../../../src/features/club-details/utils';
import { SkeletonList } from '../../../src/components/SkeletonRow';

export default function ClubDetailsScreen() {
    const { colors } = useTheme();
    const { t } = useI18n();
    const club = useClubDetails();
    const [infoOpen, setInfoOpen] = useState(false);

    const {
        params,
        title,
        info,
        summary,
        canClaimClub,
        organization,
        clubNumber,
        activeTab,
        setActiveTab,
        teams,
        players,
        loading,
        error,
        playersError,
        playersStaleSince,
        nextMatch,
        isMyClub,
        meClubLoading,
        isFavoriteClub,
        favoriteClubLoading,
        toggleMyClub,
        toggleFavoriteClub,
    } = club;

    const meta = [
        info?.region ?? params.state,
        organization,
        info?.foundationYear ? t('club.sinceValue', { year: info.foundationYear }) : undefined,
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <ScreenHeader
                    right={
                        <>
                            <HeaderIconButton
                                icon="information-circle-outline"
                                accessibilityLabel={t('club.infoTitle')}
                                onPress={() => setInfoOpen(true)}
                            />
                            <HeaderIconButton
                                icon={isMyClub ? 'home' : 'home-outline'}
                                color={isMyClub ? colors.primary : colors.text}
                                accessibilityLabel={isMyClub ? t('club.removeMyClub') : t('club.setMyClub')}
                                onPress={() => { if (!meClubLoading) toggleMyClub().catch(() => undefined); }}
                            />
                            <HeaderIconButton
                                icon={isFavoriteClub ? 'star' : 'star-outline'}
                                color={isFavoriteClub ? colors.warning : colors.text}
                                accessibilityLabel={isFavoriteClub ? t('favorites.removeFavorite') : t('club.addFavorite')}
                                onPress={() => { if (!favoriteClubLoading) toggleFavoriteClub().catch(() => undefined); }}
                            />
                        </>
                    }
                />

                <ClubHeader
                    title={info?.clubName ?? title}
                    meta={meta}
                    organization={organization}
                    clubNumber={clubNumber}
                    logoUrl={info?.logoUrl}
                    venue={info?.venues[0]}
                    venueCount={info?.venues.length ?? 0}
                    claimLoading={meClubLoading}
                    onOpenInfo={() => setInfoOpen(true)}
                    onClaimClub={canClaimClub ? () => { toggleMyClub().catch(() => undefined); } : undefined}
                />

                {loading ? <SkeletonList count={3} /> : null}
                {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

                {!loading && !error ? (
                    <>
                        <StatStrip
                            items={[
                                {
                                    label: t('club.teamsTab'),
                                    value: String(summary.teamCount),
                                    helper: summary.leaders > 0 ? t('club.leadersValue', { count: summary.leaders }) : undefined,
                                },
                                { label: t('club.playersTab'), value: summary.playerCount > 0 ? String(summary.playerCount) : '–' },
                                {
                                    label: t('club.averageTtr'),
                                    value: summary.averageTtr !== undefined ? String(summary.averageTtr) : '–',
                                    helper: summary.topTtr !== undefined ? t('club.topTtrValue', { value: summary.topTtr }) : undefined,
                                },
                            ]}
                        />

                        <NextMatchCard match={nextMatch} />

                        <SegmentedTabs
                            value={activeTab}
                            onChange={setActiveTab}
                            options={[
                                { value: 'teams', label: t('club.teamsTab'), icon: 'people-outline' },
                                { value: 'players', label: t('club.playersTab'), icon: 'person-outline' },
                                { value: 'schedule', label: t('club.scheduleTab'), icon: 'calendar-outline' },
                            ]}
                        />

                        {activeTab === 'teams' ? (
                            teams.length === 0 ? (
                                <EmptyState icon="people-outline" title={t('club.noTeams')} />
                            ) : (
                                <ListGroup>
                                    {teams.map((team, index) => (
                                        <ClubTeamRow
                                            key={getTeamKey(team, index)}
                                            team={team}
                                            organization={organization}
                                            clubNumber={clubNumber}
                                            logoUrl={info?.logoUrl}
                                        />
                                    ))}
                                </ListGroup>
                            )
                        ) : null}

                        {activeTab === 'players' ? (
                            <View style={styles.stack}>
                                {players.length > 0 ? <StaleNotice since={playersStaleSince} /> : null}

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

                                {players.length > 0 ? (
                                    <ListGroup>
                                        {players.map((player, index) => (
                                            <ClubPlayerRow key={getPlayerKey(player, index)} player={player} fallbackRank={index + 1} />
                                        ))}
                                    </ListGroup>
                                ) : null}
                            </View>
                        ) : null}

                        {activeTab === 'schedule' ? <ClubScheduleTab club={club} /> : null}
                    </>
                ) : null}
            </ScrollView>

            <ClubInfoSheet
                visible={infoOpen}
                onClose={() => setInfoOpen(false)}
                title={info?.clubName ?? title}
                info={info}
                organization={organization}
                clubNumber={clubNumber}
            />
        </Screen>
    );
}
