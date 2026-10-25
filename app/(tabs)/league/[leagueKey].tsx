import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Avatar } from '@/src/components/Avatar';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SectionHeader } from '@/src/components/SectionHeader';
import { SegmentedTabs } from '@/src/components/SegmentedTabs';
import { StarButton } from '@/src/components/StarButton';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { LeagueMatchGroup, LeagueScheduleTab, LeagueTable } from '../../../src/features/league-details/components';
import { useLeagueDetails } from '../../../src/features/league-details/hooks/useLeagueDetails';
import { styles } from '../../../src/features/league-details/styles';

export default function LeagueDetailsScreen() {
    const { colors } = useTheme();
    const { t } = useI18n();
    const details = useLeagueDetails();

    const {
        league,
        activeTab,
        setActiveTab,
        tableRows,
        lastMatchday,
        scheduleStatsByTeam,
        loading,
        error,
        isFavoriteLeague,
        toggleFavoriteLeague,
        meClub,
    } = details;

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <ScreenHeader
                    right={
                        <StarButton
                            active={isFavoriteLeague}
                            accessibilityLabel={isFavoriteLeague ? t('league.removeFavorite') : t('league.addFavorite')}
                            onPress={() => { toggleFavoriteLeague().catch(() => undefined); }}
                        />
                    }
                />

                <View style={styles.leagueHead}>
                    <Avatar icon="podium" shape="square" size={56} />

                    <View style={styles.leagueHeadText}>
                        <Text style={[typography.title, { color: colors.text }]} numberOfLines={2}>
                            {league.title}
                        </Text>

                        <Text style={[typography.meta, { color: colors.mutedText }]} numberOfLines={1}>
                            {[
                                league.association ?? t('league.associationUnknown'),
                                t('favorites.seasonValue', { season: league.season }),
                                league.groupId ? t('team.groupValue', { groupId: league.groupId }) : undefined,
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </Text>
                    </View>
                </View>

                <SegmentedTabs
                    value={activeTab}
                    onChange={setActiveTab}
                    options={[
                        { value: 'table', label: t('league.table'), icon: 'podium-outline' },
                        { value: 'matches', label: t('league.schedule'), icon: 'calendar-outline' },
                    ]}
                />

                {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
                {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

                {!loading && !error && activeTab === 'table' ? (
                    <>
                        <LeagueTable
                            rows={tableRows}
                            league={league}
                            scheduleStatsByTeam={scheduleStatsByTeam}
                            meClub={meClub}
                        />

                        {lastMatchday.length > 0 ? (
                            <View style={styles.stack}>
                                <SectionHeader title={t('league.lastMatchday')} />
                                <LeagueMatchGroup matches={lastMatchday} league={league} ownClubName={meClub?.clubName ?? meClub?.title} />
                            </View>
                        ) : null}
                    </>
                ) : null}

                {!loading && !error && activeTab === 'matches' ? <LeagueScheduleTab league={details} /> : null}
            </ScrollView>
        </Screen>
    );
}
