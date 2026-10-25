import { router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { MatchHighlightCard } from '@/src/components/MatchHighlightCard';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { formatShortWeekdayDate } from '@/src/utils/dates';
import type { HomeClubMatch } from '../types';
import { styles } from '../styles';

function getOpenMatchHandler(match: HomeClubMatch) {
  if (!match.id || match.status === 'free') return undefined;

  return () =>
      router.push({
        pathname: '/match/[meetingId]',
        params: {
          meetingId: match.id!,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
        },
      });
}

function normalizeName(value?: string | null) {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// Heim oder Auswärts über den gespeicherten Vereinsnamen; unklar bleibt undefined.
function getHomeSide(match: HomeClubMatch, clubName?: string | null) {
  const club = normalizeName(clubName);
  if (club.length < 3) return undefined;

  const home = normalizeName(match.homeTeam).includes(club);
  const away = normalizeName(match.awayTeam).includes(club);

  if (home === away) return undefined;
  return home;
}

type ClubCardProps = {
  clubName?: string | null;
  hasSavedClub: boolean;
  nextMatch: HomeClubMatch | null;
  results: HomeClubMatch[];
  loading: boolean;
  error: string | null;
  onOpenClub: () => void;
  onOpenSearch: () => void;
};

// Vereinsbereich: Überschrift mit Link zum Verein, darunter das nächste Spiel (oder das letzte Ergebnis).
export function ClubCard({
                           clubName,
                           hasSavedClub,
                           nextMatch,
                           results,
                           loading,
                           error,
                           onOpenClub,
                           onOpenSearch,
                         }: ClubCardProps) {
  const { colors } = useTheme();
  const { t, language } = useI18n();

  if (!hasSavedClub) {
    return (
        <Card style={styles.messageCard}>
          <View style={styles.messageText}>
            <Text style={[typography.section, { color: colors.text }]}>{t('home.noClubTitle')}</Text>
            <Text style={[typography.body, { color: colors.mutedText }]}>{t('home.noClubSubtitle')}</Text>
          </View>

          <Button variant="primary" icon="search-outline" onPress={onOpenSearch}>
            {t('home.searchClub')}
          </Button>
        </Card>
    );
  }

  const match = nextMatch ?? results[0] ?? null;
  const homeSide = match ? getHomeSide(match, clubName) : undefined;
  const footer = match
      ? [match.leagueName, homeSide === undefined ? undefined : homeSide ? t('home.homeMatch') : t('home.awayMatch')]
          .filter(Boolean)
          .join(' · ')
      : '';

  return (
      <View style={styles.section}>
        <SectionHeader
            title={clubName ?? t('entities.clubUnknown')}
            actionLabel={t('home.toClub')}
            onActionPress={onOpenClub}
        />

        {loading ? (
            <Card style={styles.clubMessage}>
              <ActivityIndicator color={colors.primary} />
            </Card>
        ) : error ? (
            <Card style={styles.clubMessage}>
              <Text style={[typography.body, { color: colors.destructive }]}>{error}</Text>
            </Card>
        ) : !match ? (
            <Card style={styles.clubMessage}>
              <Text style={[typography.body, { color: colors.mutedText }]}>{t('home.noUpcomingMatch')}</Text>
            </Card>
        ) : (
            <MatchHighlightCard
                badge={nextMatch ? t('home.nextMatch') : t('home.lastResult')}
                dateLabel={formatShortWeekdayDate(match.date, language, match.time)}
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
                score={nextMatch ? undefined : `${match.homeScore ?? '-'}:${match.awayScore ?? '-'}`}
                footer={footer || undefined}
                onPress={getOpenMatchHandler(match) ?? onOpenClub}
            />
        )}
      </View>
  );
}
