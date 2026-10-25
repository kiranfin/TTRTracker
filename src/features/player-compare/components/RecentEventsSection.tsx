import { useState } from 'react';
import { Text, View } from 'react-native';
import { DeltaText } from '@/src/components/Delta';
import { ListGroup } from '@/src/components/ListGroup';
import { ListRow } from '@/src/components/ListRow';
import { SectionHeader } from '@/src/components/SectionHeader';
import { SegmentedTabs } from '@/src/components/SegmentedTabs';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import { formatDate } from '@/src/utils/normalizers';
import type { PlayerComparisonData, SideId } from '../types';
import { formatOptionalNumber, getEvents, getPlayerName, numberFromUnknown, sortEventsNewestFirst } from '../utils';
import { styles } from '../styles';

export function RecentEventsSection({ comparison }: { comparison: PlayerComparisonData }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [side, setSide] = useState<SideId>('left');

  const player = comparison[side];
  const events = sortEventsNewestFirst(getEvents(player)).slice(0, 5);

  return (
      <View style={{ gap: 10 }}>
        <SectionHeader title={t('compare.latestEvents')} />

        <SegmentedTabs
            value={side}
            onChange={setSide}
            options={[
              { value: 'left', label: getPlayerName(comparison.left, t) },
              { value: 'right', label: getPlayerName(comparison.right, t) },
            ]}
        />

        {events.length > 0 ? (
            <ListGroup>
              {events.map((event) => (
                  <ListRow
                      key={`${side}-${event.event_id}`}
                      title={event.event_name ?? t('compare.unknownEvent')}
                      subtitle={event.event_date_time ? formatDate(event.event_date_time) : t('common.dateUnknown')}
                      trailing={
                        <View style={styles.eventTrailing}>
                          <Text style={[numeric.medium, { color: colors.text }]}>{formatOptionalNumber(event.ttr_after)}</Text>
                          <DeltaText value={numberFromUnknown(event.ttr_delta)} size={12} />
                        </View>
                      }
                  />
              ))}
            </ListGroup>
        ) : (
            <Text style={[typography.body, { color: colors.mutedText }]}>{t('compare.noEvents')}</Text>
        )}
      </View>
  );
}
