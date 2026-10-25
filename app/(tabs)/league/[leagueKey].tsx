import { ScrollView, Text, View } from 'react-native';
import { Screen } from '@/src/components/Screen';
import { HeaderIconButton, ScreenHeader } from '@/src/components/ScreenHeader';
import { SectionHeader } from '@/src/components/SectionHeader';
import { SegmentedTabs } from '@/src/components/SegmentedTabs';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { formatSeasonLong } from '@/src/utils/dates';
import { formatDate } from '@/src/utils/normalizers';
import { LeagueMatchGroup, LeagueScheduleTab, LeagueTable } from '../../../src/features/league-details/components';
import { useLeagueDetails } from '../../../src/features/league-details/hooks/useLeagueDetails';
import { styles } from '../../../src/features/league-details/styles';
import { SkeletonList } from '../../../src/components/SkeletonRow';

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
                        <HeaderIconButton
                            icon={isFavoriteLeague ? 'star' : 'star-outline'}
                            color={isFavoriteLeague ? colors.warning : colors.text}
                            accessibilityLabel={isFavoriteLeague ? t('league.removeFavorite') : t('league.addFavorite')}
                            onPress={() => { toggleFavoriteLeague().catch(() => undefined); }}
                        />
                    }
                />

                <View style={styles.leagueHeadText}>
                    <Text style={[typography.heading, { color: colors.text }]} numberOfLines={2}>
                        {league.title}
                    </Text>

                    <Text style={[typography.meta, styles.leagueHeadSubtitle, { color: colors.mutedText }]} numberOfLines={1}>
                        {[
                            t('leagues.seasonLabel', { season: formatSeasonLong(league.season) }),
                            league.association ?? t('league.associationUnknown'),
                        ]
                            .filter(Boolean)
                            .join(' · ')}
                    </Text>
                </View>

                <SegmentedTabs
                    value={activeTab}
                    onChange={setActiveTab}
                    options={[
                        { value: 'table', label: t('league.table'), icon: 'podium-outline' },
                        { value: 'matches', label: t('league.schedule'), icon: 'calendar-outline' },
                    ]}
                />

                {loading ? <SkeletonList count={3} /> : null}
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
                                <SectionHeader title={t('league.lastMatchday')} meta={lastMatchday[0]?.date ? formatDate(lastMatchday[0].date) : undefined} />
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
