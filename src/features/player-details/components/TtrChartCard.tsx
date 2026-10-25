import { Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { formatDelta, getDeltaColor } from '@/src/components/Delta';
import { SegmentedTabs } from '@/src/components/SegmentedTabs';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import type { NormalizedTtrHistoryEvent } from '@/src/types/tttracker';
import type { ChartRangeId } from '../types';
import { CHART_RANGES, getEventTtr } from '../utils';
import { styles } from '../styles';
import { TtrLineChart } from './TtrLineChart';

type TtrChartCardProps = {
  range: ChartRangeId;
  onRangeChange: (range: ChartRangeId) => void;
  events: NormalizedTtrHistoryEvent[];
};

// Titel mit Änderung im gewählten Zeitraum, Zeitraum-Umschalter und Verlaufsdiagramm.
export function TtrChartCard({ range, onRangeChange, events }: TtrChartCardProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const labels: Record<ChartRangeId, string> = {
    '6m': t('player.chartRange6m'),
    '12m': t('player.chartRange12m'),
    '24m': t('player.chartRange24m'),
    all: t('player.chartRangeAll'),
  };

  const deltaSuffix: Record<ChartRangeId, string> = {
    '6m': t('player.chartDelta6m'),
    '12m': t('player.chartDelta12m'),
    '24m': t('player.chartDelta24m'),
    all: t('player.chartDeltaAll'),
  };

  const values = events.map(getEventTtr).filter((value): value is number => typeof value === 'number');
  const delta = values.length > 1 ? values[values.length - 1] - values[0] : undefined;

  return (
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={[typography.section, { color: colors.text }]}>{t('player.chartTitle')}</Text>
          {typeof delta === 'number' ? (
              <Text style={[typography.metaStrong, { color: getDeltaColor(delta, colors) }]}>
                {formatDelta(delta)} {deltaSuffix[range]}
              </Text>
          ) : null}
        </View>

        <SegmentedTabs
            compact
            value={range}
            onChange={onRangeChange}
            options={CHART_RANGES.map((option) => ({ value: option.id, label: labels[option.id] }))}
        />

        {values.length > 1 ? (
            <TtrLineChart events={events} />
        ) : (
            <View style={styles.chartEmpty}>
              <Text style={[typography.body, { color: colors.mutedText }]}>{t('player.notEnoughValues')}</Text>
            </View>
        )}
      </Card>
  );
}
