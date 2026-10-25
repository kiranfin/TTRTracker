import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { Avatar } from '@/src/components/Avatar';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { ListGroup } from '@/src/components/ListGroup';
import { ListRow } from '@/src/components/ListRow';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { formatDate } from '@/src/utils/normalizers';
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

  const dateLabel = (match: HomeClubMatch) =>
      [match.date ? formatDate(match.date) : t('common.dateUnknown'), match.time].filter(Boolean).join(' · ');

  return (
      <View style={styles.section}>
        <SectionHeader title={t('home.myClub')} />

        <ListGroup>
          <ListRow
              leading={<Avatar icon="home" shape="square" />}
              title={clubName ?? t('entities.clubUnknown')}
              onPress={onOpenClub}
          />

          {loading ? (
              <View style={styles.clubMessage}>
                <ActivityIndicator color={colors.primary} />
              </View>
          ) : error ? (
              <View style={styles.clubMessage}>
                <Text style={[typography.body, { color: colors.destructive }]}>{error}</Text>
              </View>
          ) : (
              <>
                {nextMatch ? (
                    <ListRow
                        leading={<Ionicons name="calendar-outline" size={22} color={colors.primary} />}
                        title={`${nextMatch.homeTeam} - ${nextMatch.awayTeam}`}
                        subtitle={`${t('home.nextMatch')} · ${dateLabel(nextMatch)}`}
                        onPress={getOpenMatchHandler(nextMatch)}
                    />
                ) : (
                    <ListRow
                        leading={<Ionicons name="calendar-outline" size={22} color={colors.mutedText} />}
                        title={t('home.noUpcomingMatch')}
                    />
                )}

                {results.map((match, index) => (
                    <ListRow
                        key={`${match.id ?? 'match'}-${match.date ?? 'date'}-${index}`}
                        leading={<Ionicons name="checkmark-circle-outline" size={22} color={colors.mutedText} />}
                        title={`${match.homeTeam} - ${match.awayTeam}`}
                        subtitle={[dateLabel(match), match.leagueName].filter(Boolean).join(' · ')}
                        trailing={
                          <Text style={[styles.scoreText, { color: colors.text }]}>
                            {match.homeScore ?? '-'}:{match.awayScore ?? '-'}
                          </Text>
                        }
                        chevron={false}
                        onPress={getOpenMatchHandler(match)}
                    />
                ))}
              </>
          )}
        </ListGroup>
      </View>
  );
}
