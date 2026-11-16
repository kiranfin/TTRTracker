import { ScrollView, Text } from 'react-native';
import { DataFreshness } from '@/src/components/DataFreshness';
import { EmptyState } from '@/src/components/EmptyState';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { InfoPill, MatchHero, MatchSection, TeamStrengthCard } from '../../../src/features/match-details/components';
import { styles } from '../../../src/features/match-details/styles';
import { useMatchDetails } from '../../../src/features/match-details/hooks/useMatchDetails';
import { SkeletonList } from '@/src/components/SkeletonRow';

export default function MatchDetailsScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();

  const {
    meeting,
    freshness,
    preview,
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
    homeClub,
    awayClub,
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
              homeClub={homeClub}
              awayClub={awayClub}
              onOpenTeam={openTeam}
              meta={[startText, meeting?.group_name].filter(Boolean).join(' · ') || undefined}
              summary={summaryParts}
          />

          {!loading && !error && locationText ? <InfoPill icon="location-outline" text={locationText} /> : null}

          {!loading && !error ? <DataFreshness freshness={freshness} /> : null}

          {loading ? <SkeletonList count={3} /> : null}

          {!loading && !error && preview ? <TeamStrengthCard preview={preview} homeTeam={homeTeam} awayTeam={awayTeam} /> : null}

          {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

          {!loading && !error && lines.length === 0 ? (
              <EmptyState icon="analytics-outline" title={t('match.noLines')} subtitle={t('match.noLinesSubtitle')} />
          ) : null}

          {!loading && !error && doubles.length > 0 ? <MatchSection title={t('match.doublesMatches')} rows={doubles} /> : null}
          {!loading && !error && singles.length > 0 ? <MatchSection title={t('match.singlesMatches')} rows={singles} collapseAfter={6} /> : null}
        </ScrollView>
      </Screen>
  );
}
