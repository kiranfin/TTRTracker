import { router } from 'expo-router';
import { View } from 'react-native';
import { EmptyState } from '@/src/components/EmptyState';
import { ListGroup } from '@/src/components/ListGroup';
import { MatchRow } from '@/src/components/MatchRow';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useI18n } from '@/src/i18n/I18nProvider';
import type { TeamContext, ScheduleSummary, TeamScheduleMatch } from '../types';
import { formatDateLabel } from '../utils';
import { styles } from '../styles';

function MatchList({ matches, team }: { matches: TeamScheduleMatch[]; team: TeamContext }) {
  const { language } = useI18n();

  // Der Routenname ist oft nur "Erwachsene II", im Spielplan steht der volle Name. Über die ID finden wir ihn.
  const ownMatch = matches.find((match) => match.homeTeamId === team.teamId || match.awayTeamId === team.teamId);
  const ownName = ownMatch ? (ownMatch.homeTeamId === team.teamId ? ownMatch.homeTeam : ownMatch.awayTeam) : team.teamName;

  return (
      <ListGroup>
        {matches.map((match, index) => {
          const canOpen = Boolean(match.id) && match.status !== 'free';

          return (
              <MatchRow
                  key={`${match.id ?? 'no-id'}-${index}`}
                  homeTeam={match.homeTeam}
                  awayTeam={match.awayTeam}
                  homeScore={match.homeScore}
                  awayScore={match.awayScore}
                  status={match.status}
                  time={match.time}
                  meta={[formatDateLabel(match.date, language), match.roundName].filter(Boolean).join(' · ')}
                  highlightTeam={ownName}
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
        })}
      </ListGroup>
  );
}

// Offene und abgeschlossene Spiele der Mannschaft, im gleichen Zeilenstil wie Verein und Liga.
export function ScheduleTab({
                              matches,
                              team,
                            }: {
  matches: TeamScheduleMatch[];
  team: TeamContext;
  summary: ScheduleSummary;
}) {
  const { t } = useI18n();

  const upcoming = matches.filter((match) => match.status !== 'completed');
  const completed = matches.filter((match) => match.status === 'completed');

  if (matches.length === 0) {
    return <EmptyState icon="calendar-outline" title={t('team.scheduleEmpty')} />;
  }

  return (
      <View style={styles.stack}>
        {upcoming.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader variant="label" title={`${t('team.openGames')} (${upcoming.length})`} />
              <MatchList matches={upcoming} team={team} />
            </View>
        ) : null}

        {completed.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader variant="label" title={`${t('team.completedGames')} (${completed.length})`} />
              <MatchList matches={completed} team={team} />
            </View>
        ) : null}
      </View>
  );
}
