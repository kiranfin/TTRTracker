import { Text, View } from 'react-native';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { NormalizedTtrHistoryEvent } from '@/src/types/tttracker';
import { formatDate } from '@/src/utils/normalizers';
import { getEventTtr, formatSignedNumber } from '../utils';
import { styles } from '../styles';

export function RecentHistoryRow({ event }: { event: NormalizedTtrHistoryEvent }) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const delta = event.delta;
  const deltaColor =
      typeof delta === 'number' && delta > 0
          ? '#16a34a'
          : typeof delta === 'number' && delta < 0
              ? colors.destructive
              : colors.mutedText;

  return (
      <View style={[styles.recentRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <View style={styles.recentMain}>
          <Text style={[styles.recentTitle, { color: colors.text }]} numberOfLines={1}>
            {event.meetingLabel ?? event.title ?? t('home.historyEntry')}
          </Text>

          <Text style={[styles.recentMeta, { color: colors.mutedText }]} numberOfLines={1}>
            {event.date ? formatDate(event.date) : t('common.dateUnknown')}
            {event.leagueName ? ` · ${event.leagueName}` : ''}
          </Text>
        </View>

        <View style={styles.recentScore}>
          <Text style={[styles.recentTtr, { color: colors.text }]}>
            {getEventTtr(event) ?? '—'}
          </Text>

          <Text style={[styles.recentDelta, { color: deltaColor }]}>
            {formatSignedNumber(delta)}
          </Text>
        </View>
      </View>
  );
}
