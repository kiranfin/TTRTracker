import { router } from 'expo-router';
import { Text } from 'react-native';
import { Card } from '@/src/components/Card';
import { MatchHighlightCard } from '@/src/components/MatchHighlightCard';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { formatShortWeekdayDate } from '@/src/utils/dates';
import type { ClubScheduleMatch } from '../types';
import { styles } from '../styles';

// Nächstes Spiel des Vereins, gleiche Karte wie auf der Startseite.
export function NextMatchCard({ match }: { match: ClubScheduleMatch | null }) {
  const { colors } = useTheme();
  const { t, language } = useI18n();

  if (!match) {
    return (
        <Card style={styles.nextMatchEmpty}>
          <Text style={[typography.body, { color: colors.mutedText }]}>{t('club.noUpcomingMatch')}</Text>
        </Card>
    );
  }

  const canOpen = Boolean(match.id) && match.status !== 'free';

  return (
      <MatchHighlightCard
          badge={t('home.nextMatch')}
          dateLabel={formatShortWeekdayDate(match.date, language, match.time)}
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          footer={match.leagueName || undefined}
          onPress={
            canOpen
                ? () =>
                    router.push({
                      pathname: '/match/[meetingId]',
                      params: { meetingId: match.id!, homeTeam: match.homeTeam, awayTeam: match.awayTeam },
                    })
                : undefined
          }
      />
  );
}
