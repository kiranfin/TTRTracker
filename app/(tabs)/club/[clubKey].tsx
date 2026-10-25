import { ScrollView, Text, View } from 'react-native';
import { ActionButton } from '@/src/components/ActionButton';
import { EmptyState } from '@/src/components/EmptyState';
import { ListGroup } from '@/src/components/ListGroup';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SegmentedTabs } from '@/src/components/SegmentedTabs';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import {
    ClubHeader,
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

    const {
        params,
        title,
        organization,
        clubNumber,
        activeTab,
        setActiveTab,
        teams,
        players,
        loading,
        error,
        playersError,
        nextMatch,
        isMyClub,
        meClubLoading,
        isFavoriteClub,
        favoriteClubLoading,
        toggleMyClub,
        toggleFavoriteClub,
    } = club;

    const subtitle = [params.state, organization, clubNumber ? t('club.idLabel', { clubNumber }) : undefined]
        .filter(Boolean)
        .join(' · ');

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <ScreenHeader />

                <ClubHeader title={title} subtitle={subtitle} />

                <View style={styles.actionRow}>
                    <ActionButton
                        layout="inline"
                        icon={isMyClub ? 'checkmark-circle' : 'checkmark'}
                        label={t('settings.myClub')}
                        variant={isMyClub ? 'primary' : 'secondary'}
                        loading={meClubLoading}
                        onPress={() => { toggleMyClub().catch(() => undefined); }}
                    />

                    <ActionButton
                        layout="inline"
                        icon={isFavoriteClub ? 'star' : 'star-outline'}
                        label={t('club.favoriteAction')}
                        variant={isFavoriteClub ? 'active' : 'secondary'}
                        loading={favoriteClubLoading}
                        onPress={() => { toggleFavoriteClub().catch(() => undefined); }}
                    />
                </View>

                {loading ? <SkeletonList count={3} /> : null}
                {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

                {!loading && !error ? (
                    <>
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
                                        <ClubTeamRow key={getTeamKey(team, index)} team={team} />
                                    ))}
                                </ListGroup>
                            )
                        ) : null}

                        {activeTab === 'players' ? (
                            <View style={styles.stack}>
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
                                            <ClubPlayerRow key={getPlayerKey(player, index)} player={player} />
                                        ))}
                                    </ListGroup>
                                ) : null}
                            </View>
                        ) : null}

                        {activeTab === 'schedule' ? <ClubScheduleTab club={club} /> : null}
                    </>
                ) : null}
            </ScrollView>
        </Screen>
    );
}
