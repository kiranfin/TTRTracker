import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Chip, ChipRow } from '@/src/components/Chip';
import { EmptyState } from '@/src/components/EmptyState';
import { ListGroup } from '@/src/components/ListGroup';
import { MatchRow } from '@/src/components/MatchRow';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import type { ScheduleMatch } from '@/src/types/tttracker';
import type { LeagueDetailsController } from '../hooks/useLeagueDetails';
import type { LeagueInfo } from '../types';
import { formatDateLabel } from '../utils';
import { styles } from '../styles';

// Mit Liga-Kontext kann der Spielbericht die Mannschaften verlinken.
export function openLeagueMatch(match: ScheduleMatch, league?: LeagueInfo) {
    if (!match.id || match.status === 'free') return undefined;

    return () =>
        router.push({
            pathname: '/match/[meetingId]',
            params: {
                meetingId: match.id!,
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                homeTeamId: match.homeTeamId ?? '',
                awayTeamId: match.awayTeamId ?? '',
                leagueTitle: league?.title ?? '',
                association: league?.association ?? '',
                groupId: league?.groupId ?? '',
                season: league?.season ?? '',
                leagueSlug: league?.leagueSlug ?? '',
            },
        });
}

export function LeagueMatchGroup({
                                     matches,
                                     league,
                                     ownClubName,
                                 }: {
    matches: ScheduleMatch[];
    league: LeagueInfo;
    ownClubName?: string;
}) {
    const { language } = useI18n();

    return (
        <ListGroup>
            {matches.map((match, index) => (
                <MatchRow
                    key={`${match.id ?? 'no-id'}-${index}`}
                    homeTeam={match.homeTeam}
                    awayTeam={match.awayTeam}
                    homeScore={match.homeScore}
                    awayScore={match.awayScore}
                    homeClub={{ organization: league.association ?? match.association, clubNumber: match.homeClubId }}
                    awayClub={{ organization: league.association ?? match.association, clubNumber: match.awayClubId }}
                    status={match.status}
                    time={match.time}
                    meta={[formatDateLabel(match.date, language), match.roundName].filter(Boolean).join(' · ')}
                    highlightTeam={ownClubName && match.homeTeam.includes(ownClubName) ? match.homeTeam : ownClubName && match.awayTeam.includes(ownClubName) ? match.awayTeam : undefined}
                    onPress={openLeagueMatch(match, league)}
                />
            ))}
        </ListGroup>
    );
}

export function LeagueScheduleTab({ league }: { league: LeagueDetailsController }) {
    const { colors } = useTheme();
    const { t } = useI18n();

    const {
        periodFilter,
        setPeriodFilter,
        roundFilter,
        setRoundFilter,
        resetScheduleFilters,
        filteredMatches,
        matches,
        upcoming,
        completed,
        meClub,
    } = league;

    const ownClubName = meClub?.clubName ?? meClub?.title;

    return (
        <View style={styles.stack}>
            <ChipRow>
                <Chip
                    label={t('common.all')}
                    active={periodFilter === 'all' && roundFilter === 'all'}
                    onPress={resetScheduleFilters}
                />
                <Chip
                    label={t('league.firstHalf')}
                    active={roundFilter === 'vr'}
                    onPress={() => setRoundFilter(roundFilter === 'vr' ? 'all' : 'vr')}
                />
                <Chip
                    label={t('league.secondHalf')}
                    active={roundFilter === 'rr'}
                    onPress={() => setRoundFilter(roundFilter === 'rr' ? 'all' : 'rr')}
                />
                <Chip
                    label={t('league.last30Days')}
                    active={periodFilter === 'past30'}
                    onPress={() => setPeriodFilter(periodFilter === 'past30' ? 'all' : 'past30')}
                />
                <Chip
                    label={t('league.next30Days')}
                    active={periodFilter === 'next30'}
                    onPress={() => setPeriodFilter(periodFilter === 'next30' ? 'all' : 'next30')}
                />
            </ChipRow>

            <Text style={[typography.label, { color: colors.mutedText }]}>
                {t('league.visibleGames', { filtered: filteredMatches.length, total: matches.length })}
            </Text>

            {filteredMatches.length === 0 ? (
                <EmptyState icon="calendar-outline" title={t('league.noGamesForFilter')} />
            ) : null}

            {upcoming.length > 0 ? (
                <View style={styles.stack}>
                    <SectionHeader variant="label" title={`${t('league.openGames')} (${upcoming.length})`} />
                    <LeagueMatchGroup matches={upcoming} league={league.league} ownClubName={ownClubName} />
                </View>
            ) : null}

            {completed.length > 0 ? (
                <View style={styles.stack}>
                    <SectionHeader variant="label" title={`${t('league.completedGames')} (${completed.length})`} />
                    <LeagueMatchGroup matches={completed} league={league.league} ownClubName={ownClubName} />
                </View>
            ) : null}
        </View>
    );
}
