import { router } from 'expo-router';
import { MatchHighlightCard } from '@/src/components/MatchHighlightCard';
import { useI18n } from '@/src/i18n/I18nProvider';
import { formatShortWeekdayDate } from '@/src/utils/dates';
import type { ClubScheduleMatch } from '../types';

// Nächstes Spiel des Vereins, gleiche Karte wie auf der Startseite. Ohne kommendes Spiel bleibt der Platz leer,
// der Spielplan Tab zeigt dann ohnehin alles.
export function NextMatchCard({ match }: { match: ClubScheduleMatch | null }) {
  const { t, language } = useI18n();

  if (!match) return null;

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
