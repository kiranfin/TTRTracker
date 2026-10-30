import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nProvider';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';
import { formatAge, type Freshness } from '../utils/staleness';

type DataFreshnessProps = {
  // Stand der angezeigten Daten, null blendet die Zeile aus (kein Stand bekannt).
  freshness: Freshness | null;
  // Auf der Hero-Karte in Akzentfarbe statt auf normalem Hintergrund.
  onPrimary?: boolean;
};

// Zeigt immer, wie alt die angezeigten Daten sind ("Stand: vor 5 Minuten"). Kommen sie aus dem letzten
// bekannten Stand, weil myTischtennis nicht liefert, steht dazu der Hinweis, dass sie veraltet sein können.
export function DataFreshness({ freshness, onPrimary = false }: DataFreshnessProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  if (!freshness) return null;

  const color = onPrimary ? colors.primaryForeground : colors.mutedText;
  const age = formatAge(t, freshness.since);

  return (
      <View style={styles.row} accessibilityRole="text">
        <Ionicons name="time-outline" size={14} color={color} />
        <Text style={[typography.meta, styles.text, { color, opacity: onPrimary ? 0.86 : 1 }]}>
          {freshness.stale ? t('common.staleNotice', { age }) : t('common.dataAge', { age })}
        </Text>
      </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    flexShrink: 1,
  },
});
