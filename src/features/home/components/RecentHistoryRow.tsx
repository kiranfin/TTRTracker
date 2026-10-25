import { Text, View } from 'react-native';
import { DeltaText } from '@/src/components/Delta';
import { ListRow } from '@/src/components/ListRow';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric } from '@/src/theme/typography';
import type { NormalizedTtrHistoryEvent } from '@/src/types/tttracker';
import { formatDate } from '@/src/utils/normalizers';
import { getEventTtr } from '../utils';
import { styles } from '../styles';

export function RecentHistoryRow({
                                   event,
                                   onPress,
                                 }: {
  event: NormalizedTtrHistoryEvent;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const date = event.date ? formatDate(event.date) : t('common.dateUnknown');

  return (
      <ListRow
          title={event.meetingLabel ?? event.title ?? t('home.historyEntry')}
          subtitle={event.leagueName ? `${date} · ${event.leagueName}` : date}
          onPress={onPress}
          chevron={false}
          trailing={
            <View style={styles.rowTrailing}>
              <Text style={[numeric.medium, { color: colors.text }]}>{getEventTtr(event) ?? '—'}</Text>
              <DeltaText value={event.delta} size={12} />
            </View>
          }
      />
  );
}
