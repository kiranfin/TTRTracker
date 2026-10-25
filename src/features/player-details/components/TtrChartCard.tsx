import { Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { SegmentedTabs } from '@/src/components/SegmentedTabs';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import type { NormalizedTtrHistoryEvent } from '@/src/types/tttracker';
import type { ChartRangeId } from '../types';
import { CHART_RANGES } from '../utils';
import { styles } from '../styles';
import { TtrLineChart } from './TtrLineChart';

type TtrChartCardProps = {
    range: ChartRangeId;
    onRangeChange: (range: ChartRangeId) => void;
    events: NormalizedTtrHistoryEvent[];
    topEvent: NormalizedTtrHistoryEvent | null;
};

export function TtrChartCard({ range, onRangeChange, events, topEvent }: TtrChartCardProps) {
    const { colors } = useTheme();
    const { t } = useI18n();

    const labels: Record<ChartRangeId, string> = {
        '6m': t('player.chartRange6m'),
        '12m': t('player.chartRange12m'),
        '24m': t('player.chartRange24m'),
        all: t('player.chartRangeAll'),
    };

    return (
        <Card style={styles.chartCard}>
            <Text style={[typography.section, { color: colors.text }]}>{t('player.chartTitle')}</Text>

            <SegmentedTabs
                value={range}
                onChange={onRangeChange}
                options={CHART_RANGES.map((option) => ({ value: option.id, label: labels[option.id] }))}
            />

            {events.length > 1 ? (
                <TtrLineChart events={events} highlightedEvent={topEvent} />
            ) : (
                <View style={styles.chartEmpty}>
                    <Text style={[typography.body, { color: colors.mutedText }]}>{t('player.notEnoughValues')}</Text>
                </View>
            )}
        </Card>
    );
}
