import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nProvider';
import { MIN_TOUCH, spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { numeric, typography } from '../theme/typography';
import type { ScheduleMatchStatus } from '../types/tttracker';

type MatchRowProps = {
  homeTeam: string;
  awayTeam: string;
  homeScore?: string;
  awayScore?: string;
  status: ScheduleMatchStatus;
  time?: string;
  // Zusatzzeile unter den Mannschaften, z. B. Liga und Spieltag
  meta?: string;
  // Name der eigenen Mannschaft, wird hervorgehoben
  highlightTeam?: string;
  onPress?: () => void;
};

const statusKeys = {
  completed: 'status.completed',
  live: 'status.live',
  free: 'status.free',
  postponed: 'status.postponed',
  scheduled: 'status.scheduled',
} as const;

function toNumber(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

// Kompakte Begegnungszeile für Spielpläne: Heim und Gast untereinander, Ergebnis oder Uhrzeit rechts.
export function MatchRow({
                           homeTeam,
                           awayTeam,
                           homeScore,
                           awayScore,
                           status,
                           time,
                           meta,
                           highlightTeam,
                           onPress,
                         }: MatchRowProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

  const showScore = status === 'completed' || status === 'live';
  const home = toNumber(homeScore);
  const away = toNumber(awayScore);
  const homeWins = showScore && home !== undefined && away !== undefined && home > away;
  const awayWins = showScore && home !== undefined && away !== undefined && away > home;

  const nameStyle = (strong: boolean, own: boolean) => [
    typography.body,
    {
      color: colors.text,
      fontWeight: strong || own ? ('800' as const) : ('500' as const),
    },
    own && { color: colors.primary },
  ];

  const isOwn = (team: string) => Boolean(highlightTeam) && team.trim() === highlightTeam!.trim();

  const content = (
      <>
        <View style={styles.teams}>
          <Text style={nameStyle(homeWins, isOwn(homeTeam))} numberOfLines={1}>
            {homeTeam}
          </Text>

          <Text style={nameStyle(awayWins, isOwn(awayTeam))} numberOfLines={1}>
            {awayTeam}
          </Text>

          {meta ? (
              <Text style={[typography.label, { color: colors.mutedText }]} numberOfLines={1}>
                {meta}
              </Text>
          ) : null}
        </View>

        {showScore ? (
            <View style={styles.scores}>
              <Text style={[numeric.medium, { color: colors.text, fontWeight: homeWins ? '900' : '500' }]}>
                {homeScore ?? '-'}
              </Text>
              <Text style={[numeric.medium, { color: colors.text, fontWeight: awayWins ? '900' : '500' }]}>
                {awayScore ?? '-'}
              </Text>
            </View>
        ) : (
            <View style={styles.scores}>
              <Text style={[numeric.small, { color: status === 'scheduled' ? colors.text : colors.mutedText }]}>
                {status === 'scheduled' ? time || t('club.timeOpen') : t(statusKeys[status])}
              </Text>
            </View>
        )}
      </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;

  return (
      <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${homeTeam} - ${awayTeam}`}
          onPress={onPress}
          style={({ pressed }) => [styles.row, noWebOutline, pressed && { backgroundColor: colors.soft }]}
      >
        {content}
      </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH + 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  teams: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  scores: {
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 2,
  },
});
