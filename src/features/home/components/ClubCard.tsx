import { router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { ListGroup } from '@/src/components/ListGroup';
import { MatchRow } from '@/src/components/MatchRow';
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
  upcoming: HomeClubMatch[];
  results: HomeClubMatch[];
  loading: boolean;
  error: string | null;
  onOpenClub: () => void;
  onOpenSearch: () => void;
};

function ClubMatchList({ title, matches, emptyText, clubName, onOpenClub }: {
  title: string;
  matches: HomeClubMatch[];
  emptyText: string;
  clubName?: string | null;
  onOpenClub: () => void;
}) {
  const { colors } = useTheme();
  const { language } = useI18n();

  return (
      <View style={styles.section}>
        <SectionHeader variant="label" title={title} />

        {matches.length === 0 ? (
            <Card style={styles.clubMessage}>
              <Text style={[typography.body, { color: colors.mutedText }]}>{emptyText}</Text>
            </Card>
        ) : (
            <ListGroup>
              {matches.map((match, index) => {
                const homeSide = getHomeSide(match, clubName);

                return (
                    <MatchRow
                        key={`${match.id ?? 'no-id'}-${index}`}
                        homeTeam={match.homeTeam}
                        awayTeam={match.awayTeam}
                        homeScore={match.homeScore}
                        awayScore={match.awayScore}
                        status={match.status}
                        time={match.time}
                        meta={[formatShortWeekdayDate(match.date, language), match.leagueName].filter(Boolean).join(' · ')}
                        highlightTeam={homeSide === undefined ? undefined : homeSide ? match.homeTeam : match.awayTeam}
                        onPress={getOpenMatchHandler(match) ?? onOpenClub}
                    />
                );
              })}
            </ListGroup>
        )}
      </View>
  );
}

// Vereinsbereich: Überschrift mit Link zum Verein, darunter die letzten zwei Ergebnisse und die nächsten zwei Spiele.
export function ClubCard({
                           clubName,
                           hasSavedClub,
                           upcoming,
                           results,
                           loading,
                           error,
                           onOpenClub,
                           onOpenSearch,
                         }: ClubCardProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

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
        ) : (
            <>
              <ClubMatchList
                  title={t('home.lastResults')}
                  matches={results}
                  emptyText={t('home.noRecentResults')}
                  clubName={clubName}
                  onOpenClub={onOpenClub}
              />
              <ClubMatchList
                  title={t('home.upcomingMatches')}
                  matches={upcoming}
                  emptyText={t('home.noUpcomingMatch')}
                  clubName={clubName}
                  onOpenClub={onOpenClub}
              />
            </>
        )}
      </View>
  );
}
