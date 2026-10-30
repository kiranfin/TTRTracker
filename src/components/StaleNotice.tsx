import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { TranslationKey, TranslationParams } from '../i18n';
import { useI18n } from '../i18n/I18nProvider';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

type StaleNoticeProps = {
  // Zeitpunkt des angezeigten Stands (ms), null blendet den Hinweis aus.
  since: number | null;
  // Auf der Hero-Karte in Akzentfarbe statt auf normalem Hintergrund.
  onPrimary?: boolean;
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function formatAge(t: (key: TranslationKey, params?: TranslationParams) => string, since: number) {
  const ageMs = Math.max(0, Date.now() - since);

  if (ageMs < HOUR_MS) {
    const minutes = Math.max(1, Math.round(ageMs / MINUTE_MS));
    return t(minutes === 1 ? 'common.ageMinute' : 'common.ageMinutes', { count: minutes });
  }

  if (ageMs < DAY_MS) {
    const hours = Math.round(ageMs / HOUR_MS);
    return t(hours === 1 ? 'common.ageHour' : 'common.ageHours', { count: hours });
  }

  const days = Math.round(ageMs / DAY_MS);
  return t(days === 1 ? 'common.ageDay' : 'common.ageDays', { count: days });
}

// Kleiner Hinweis, dass die Werte aus dem letzten bekannten Stand kommen, weil myTischtennis gerade nicht liefert.
export function StaleNotice({ since, onPrimary = false }: StaleNoticeProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  if (since === null) return null;

  const color = onPrimary ? colors.primaryForeground : colors.mutedText;

  return (
      <View style={styles.row} accessibilityRole="text">
        <Ionicons name="time-outline" size={14} color={color} />
        <Text style={[typography.meta, styles.text, { color, opacity: onPrimary ? 0.86 : 1 }]}>
          {t('common.staleNotice', { age: formatAge(t, since) })}
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
