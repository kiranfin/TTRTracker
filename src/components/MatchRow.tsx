import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nProvider';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { font, numeric, typography } from '../theme/typography';
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

// Begegnungszeile für Spielpläne: Heim links, Ergebnis oder Uhrzeit als Pill in der Mitte, Gast rechts.
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

  const isOwn = (team: string) => Boolean(highlightTeam) && team.trim() === highlightTeam!.trim();

  const nameStyle = (strong: boolean, own: boolean) => [
    typography.body,
    styles.team,
    { color: own ? colors.primary : colors.text, ...font(strong || own ? '700' : '500') },
  ];

  const centerLabel = showScore
      ? `${homeScore ?? '-'}:${awayScore ?? '-'}`
      : status === 'scheduled'
          ? time || t('club.timeOpen')
          : t(statusKeys[status]);

  const content = (
      <>
        <View style={styles.line}>
          <Text style={nameStyle(homeWins, isOwn(homeTeam))} numberOfLines={2}>
            {homeTeam}
          </Text>

          <View style={[styles.pill, { backgroundColor: status === 'live' ? colors.primarySoft : colors.soft }]}>
            <Text
                style={[
                  showScore ? numeric.row : numeric.small,
                  { color: status === 'live' ? colors.primary : showScore || status === 'scheduled' ? colors.text : colors.mutedText },
                ]}
                numberOfLines={1}
            >
              {centerLabel}
            </Text>
          </View>

          <Text style={[nameStyle(awayWins, isOwn(awayTeam)), styles.away]} numberOfLines={2}>
            {awayTeam}
          </Text>
        </View>

        {meta ? (
            <Text style={[typography.label, styles.meta, { color: colors.mutedText }]} numberOfLines={1}>
              {meta}
            </Text>
        ) : null}
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
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    gap: 4,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  team: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 19,
  },
  away: {
    textAlign: 'right',
  },
  pill: {
    minWidth: 64,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  meta: {
    textAlign: 'center',
  },
});
