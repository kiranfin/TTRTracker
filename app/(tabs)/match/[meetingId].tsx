import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { Screen } from '@/src/components/Screen';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { BackButton, InfoPill, MatchSection } from '../../../src/features/match-details/components';
import { styles } from '../../../src/features/match-details/styles';
import { useMatchDetails } from '../../../src/features/match-details/hooks/useMatchDetails';

export default function MatchDetailsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();

  const {
    meeting,
    loading,
    error,
    meetingId,
    lines,
    singles,
    doubles,
    homeTeam,
    awayTeam,
    mainScore,
    summaryParts,
    startText,
    locationText,
    statusText,
  } = useMatchDetails();

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <BackButton />

            <Text style={[styles.title, { color: colors.text }]}>{t('match.detailsTitle')}</Text>
          </View>

          <Card style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.teamsRow}>
              <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={3}>
                {homeTeam}
              </Text>

              <View style={[styles.scorePill, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder }]}>
                <Text style={[styles.scoreText, { color: colors.primary }]}>{mainScore}</Text>
                <Text style={[styles.scoreLabel, { color: colors.mutedText }]}>{statusText}</Text>
              </View>

              <Text style={[styles.teamName, styles.awayTeam, { color: colors.text }]} numberOfLines={3}>
                {awayTeam}
              </Text>
            </View>

            {summaryParts.length > 0 ? (
                <Text style={[styles.scoreSummary, { color: colors.mutedText }]}>{summaryParts.join(' · ')}</Text>
            ) : null}

            <Text style={[styles.meetingId, { color: colors.mutedText }]}>
              Meeting #{meeting?.meeting_id ?? meetingId}
            </Text>
          </Card>

          {!loading && !error ? (
              <View style={styles.infoPills}>
                {startText ? <InfoPill icon="time-outline" text={startText} /> : null}
                {meeting?.group_name ? <InfoPill icon="trophy-outline" text={meeting.group_name} /> : null}
                {locationText ? <InfoPill icon="location-outline" text={locationText} /> : null}
              </View>
          ) : null}

          {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

          {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

          {!loading && !error && lines.length === 0 ? (
              <EmptyState
                  icon="analytics-outline"
                  title={t('match.noLines')}
                  subtitle={t('match.noLinesSubtitle')}
              />
          ) : null}

          {!loading && !error && singles.length > 0 ? <MatchSection title={t('match.singlesMatches')} rows={singles} /> : null}
          {!loading && !error && doubles.length > 0 ? <MatchSection title={t('match.doublesMatches')} rows={doubles} /> : null}
        </ScrollView>
      </Screen>
  );
}
