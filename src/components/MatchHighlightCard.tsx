import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nProvider';
import { useTheme } from '../theme/ThemeProvider';
import { font, numeric, typography } from '../theme/typography';

type MatchHighlightCardProps = {
  badge: string;
  dateLabel?: string;
  homeTeam: string;
  awayTeam: string;
  // Ergebnis statt "vs", z. B. beim letzten Spiel
  score?: string;
  footer?: string;
  onPress?: () => void;
};

// Hervorgehobenes Spiel (nächstes Spiel oder letztes Ergebnis): Badge mit Datum, beide Teams gegenüber.
export function MatchHighlightCard({ badge, dateLabel, homeTeam, awayTeam, score, footer, onPress }: MatchHighlightCardProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
      <Pressable
          accessibilityRole={onPress ? 'button' : undefined}
          disabled={!onPress}
          onPress={onPress}
          style={({ pressed }) => [
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
          ]}
      >
        <View style={styles.top}>
          <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
            <Text style={[typography.label, styles.badgeText, { color: colors.primary }]}>{badge}</Text>
          </View>
          {dateLabel ? (
              <Text style={[typography.meta, styles.date, { color: colors.mutedText }]} numberOfLines={1}>
                {dateLabel}
              </Text>
          ) : null}
        </View>

        <View style={styles.teams}>
          <Text style={[typography.bodyStrong, styles.team, { color: colors.text }]} numberOfLines={2}>
            {homeTeam}
          </Text>
          {score ? (
              <Text style={[numeric.medium, { color: colors.text }]}>{score}</Text>
          ) : (
              <Text style={[typography.metaStrong, { color: colors.mutedText }]}>{t('home.versus')}</Text>
          )}
          <Text style={[typography.bodyStrong, styles.team, styles.teamAway, { color: colors.text }]} numberOfLines={2}>
            {awayTeam}
          </Text>
        </View>

        {footer ? (
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <Text style={[typography.meta, styles.footerText, { color: colors.mutedText }]} numberOfLines={1}>
                {footer}
              </Text>
              {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.mutedText} /> : null}
            </View>
        ) : null}
      </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  badgeText: {
    ...font('700'),
  },
  date: {
    flexShrink: 1,
    ...font('500'),
  },
  teams: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  team: {
    flex: 1,
    ...font('700'),
  },
  teamAway: {
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerText: {
    flex: 1,
  },
});
