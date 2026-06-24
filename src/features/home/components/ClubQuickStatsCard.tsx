import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { HomeClubMatch } from '../types';
import { styles } from '../styles';
import { ClubCompletedMatchRow } from './ClubCompletedMatchRow';

export function ClubQuickStatsCard({
                              meNuid,
                              clubName,
                              hasSavedClub,
                              matches,
                              loading,
                              error,
                              onOpenClub,
                              onOpenSearch,
                            }: {
  meNuid: string | null;
  clubName?: string | null;
  hasSavedClub: boolean;
  matches: HomeClubMatch[];
  loading: boolean;
  error: string | null;
  onOpenClub: () => void;
  onOpenSearch: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();

  if (!meNuid) {
    return null;
  }

  if (!hasSavedClub) {
    return (
        <Card style={styles.clubCard}>
          <View style={styles.clubHeader}>
            <View style={styles.clubHeaderText}>
              <Text style={[styles.clubTitle, { color: colors.text }]}>
                {t('home.noClubTitle')}
              </Text>

              <Text style={[styles.clubSubtitle, { color: colors.mutedText }]}>
                {t('home.noClubSubtitle')}
              </Text>
            </View>
          </View>

          <Button variant="primary" icon="search-outline" onPress={onOpenSearch}>
            {t('home.searchClub')}
          </Button>
        </Card>
    );
  }

  return (
      <Card style={styles.clubCard}>
        <View style={styles.clubHeader}>
          <View style={styles.clubHeaderText}>
            <Text style={[styles.clubTitle, { color: colors.text }]} numberOfLines={1}>
              {clubName ?? t('entities.clubUnknown')}
            </Text>
          </View>

          <Pressable
              onPress={onOpenClub}
              hitSlop={10}
              style={({ pressed }) => [
                styles.profileButton,
                {
                  backgroundColor: pressed ? colors.primarySoft : colors.muted,
                  borderColor: pressed ? colors.primarySoftBorder : colors.border,
                },
              ]}
          >
            <Ionicons name="open-outline" size={19} color={colors.text} />
          </Pressable>
        </View>

        {loading ? (
            <View style={styles.clubLoadingBox}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.homeBody, { color: colors.mutedText }]}>
                {t('home.loadingClubMatches')}
              </Text>
            </View>
        ) : error ? (
            <View style={styles.clubMessageBox}>
              <Text style={[styles.homeBody, { color: colors.destructive }]}>
                {error}
              </Text>

              <Button variant="outline" icon="search-outline" onPress={onOpenSearch}>
                {t('home.searchClub')}
              </Button>
            </View>
        ) : matches.length > 0 ? (
            <View style={styles.clubMatchList}>
              {matches.map((match, index) => (
                  <ClubCompletedMatchRow
                      key={`${match.id ?? 'match'}-${match.date ?? 'date'}-${index}`}
                      match={match}
                  />
              ))}
            </View>
        ) : (
            <Text style={[styles.homeBody, { color: colors.mutedText }]}>
              {t('home.noCompletedMatches')}
            </Text>
        )}
      </Card>
  );
}
