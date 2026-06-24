import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { formatDate } from '@/src/utils/normalizers';
import type { HomeClubMatch } from '../types';
import { statusLabelKeys } from '../utils';
import { styles } from '../styles';

export function ClubCompletedMatchRow({ match }: { match: HomeClubMatch }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const canOpen = Boolean(match.id) && match.status !== 'free';

  return (
      <Pressable
          disabled={!canOpen}
          onPress={
            canOpen
                ? () =>
                    router.push({
                      pathname: '/match/[meetingId]',
                      params: {
                        meetingId: match.id!,
                        homeTeam: match.homeTeam,
                        awayTeam: match.awayTeam,
                      },
                    })
                : undefined
          }
          style={({ pressed }) => [
            styles.clubMatchRow,
            {
              backgroundColor: colors.muted,
              borderColor: colors.border,
              opacity: pressed && canOpen ? 0.78 : 1,
            },
          ]}
      >
        <View style={styles.clubMatchTopRow}>
          <View style={styles.clubMatchMeta}>
            <Ionicons name="calendar-outline" size={13} color={colors.mutedText} />
            <Text style={[styles.clubMatchMetaText, { color: colors.mutedText }]} numberOfLines={1}>
              {match.date ? formatDate(match.date) : t('common.dateUnknown')}
              {match.time ? ` · ${match.time}` : ''}
            </Text>
          </View>

          <View style={[styles.completedPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.completedPillText, { color: colors.mutedText }]}>
              {t(statusLabelKeys[match.status])}
            </Text>
          </View>
        </View>

        <View style={styles.clubMatchScoreRow}>
          <Text style={[styles.clubMatchTeam, { color: colors.text }]} numberOfLines={2}>
            {match.homeTeam}
          </Text>

          <View style={[styles.clubScoreBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.clubScoreText, { color: colors.text }]}>
              {match.homeScore ?? '-'}
            </Text>

            <Text style={[styles.clubScoreDivider, { color: colors.mutedText }]}>:</Text>

            <Text style={[styles.clubScoreText, { color: colors.text }]}>
              {match.awayScore ?? '-'}
            </Text>
          </View>

          <Text
              style={[styles.clubMatchTeam, styles.clubMatchAwayTeam, { color: colors.text }]}
              numberOfLines={2}
          >
            {match.awayTeam}
          </Text>
        </View>

        {match.leagueName || match.roundName || match.meetingNumber ? (
            <Text style={[styles.clubMatchFooter, { color: colors.mutedText }]} numberOfLines={1}>
              {[match.leagueName, match.roundName, match.meetingNumber ? t('home.matchNumber', { number: match.meetingNumber }) : undefined]
                  .filter(Boolean)
                  .join(' • ')}
            </Text>
        ) : null}
      </Pressable>
  );
}
