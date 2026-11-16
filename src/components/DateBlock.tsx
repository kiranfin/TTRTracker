import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nProvider';
import { useTheme } from '../theme/ThemeProvider';
import { font, tabularNums } from '../theme/typography';
import { getDayMonthParts } from '../utils/dates';

// Tag groß, Monat klein darunter. Links in Spiel- und Verlaufszeilen.
export function DateBlock({ date }: { date?: string }) {
  const { colors } = useTheme();
  const { language } = useI18n();
  const parts = getDayMonthParts(date, language);

  return (
      <View style={styles.block}>
        <Text style={[styles.day, tabularNums, { color: colors.text }]}>{parts?.day ?? '–'}</Text>
        <Text style={[styles.month, { color: colors.mutedText }]}>{parts?.month ?? ''}</Text>
      </View>
  );
}

const styles = StyleSheet.create({
  block: {
    width: 40,
    alignItems: 'center',
  },
  day: {
    fontSize: 17,
    lineHeight: 20,
    ...font('700'),
  },
  month: {
    fontSize: 11,
    lineHeight: 14,
    ...font('600'),
  },
});
