import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { EmptyState } from '@/src/components/EmptyState';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { InfoPill, MatchHero, MatchSection } from '../../../src/features/match-details/components';
import { styles } from '../../../src/features/match-details/styles';
import { useMatchDetails } from '../../../src/features/match-details/hooks/useMatchDetails';

export default function MatchDetailsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();

  const {
    meeting,
    loading,
    error,
    lines,
    singles,
    doubles,
    homeTeam,
    awayTeam,
    mainScore,
    homeWon,
    awayWon,
    homeTeamLink,
    awayTeamLink,
    openTeam,
    summaryParts,
    startText,
    locationText,
    statusText,
  } = useMatchDetails();

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ScreenHeader title={t('match.detailsTitle')} />

          <MatchHero
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              score={mainScore}
              status={statusText}
              homeWon={homeWon}
              awayWon={awayWon}
              homeLink={homeTeamLink}
              awayLink={awayTeamLink}
              onOpenTeam={openTeam}
              summary={summaryParts}
          />

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
              <EmptyState icon="analytics-outline" title={t('match.noLines')} subtitle={t('match.noLinesSubtitle')} />
          ) : null}

          {!loading && !error && doubles.length > 0 ? <MatchSection title={t('match.doublesMatches')} rows={doubles} /> : null}
          {!loading && !error && singles.length > 0 ? <MatchSection title={t('match.singlesMatches')} rows={singles} /> : null}
        </ScrollView>
      </Screen>
  );
}
