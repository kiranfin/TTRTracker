import { Text, View } from 'react-native';
import { ListGroup } from '@/src/components/ListGroup';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import type { Leader, PlayerComparisonData, RecentStats } from '../types';
import {
  formatOptionalNumber,
  formatPercent,
  formatSignedAverage,
  formatSignedNumber,
  getLeader,
} from '../utils';
import { styles } from '../styles';

type MetricRow = {
  label: string;
  left?: number | null;
  right?: number | null;
  format: (value?: number | null) => string;
  // Anzeige, wenn sie vom Zahlenwert abweicht (z. B. Bilanz 12:5)
  leftText?: string;
  rightText?: string;
};

// Wert links und rechts, Kennzahl in der Mitte. Der bessere Wert steht in der Seitenfarbe mit Punkt.
function MetricLine({ row }: { row: MetricRow }) {
  const { colors } = useTheme();
  const leader: Leader = getLeader(row.left, row.right);

  const sideColor = (side: 'left' | 'right') => (side === 'left' ? colors.primary : colors.orange);

  const renderValue = (side: 'left' | 'right') => {
    const lead = leader === side;
    const text = side === 'left' ? row.leftText ?? row.format(row.left) : row.rightText ?? row.format(row.right);

    return (
        <View style={[styles.metricValueWrap, side === 'right' && styles.metricValueWrapRight]}>
          {lead && side === 'right' ? <View style={[styles.leadDot, { backgroundColor: sideColor(side) }]} /> : null}
          <Text style={[numeric.row, { color: lead ? sideColor(side) : colors.text }]}>{text}</Text>
          {lead && side === 'left' ? <View style={[styles.leadDot, { backgroundColor: sideColor(side) }]} /> : null}
        </View>
    );
  };

  return (
      <View style={styles.metricRow}>
        {renderValue('left')}

        <Text style={[typography.meta, styles.metricLabel, { color: colors.mutedText }]} numberOfLines={2}>
          {row.label}
        </Text>

        {renderValue('right')}
      </View>
  );
}

type MetricsTableProps = {
  comparison: PlayerComparisonData;
  leftStats: RecentStats | null;
  rightStats: RecentStats | null;
};

// Kennzahlen nebeneinander, der bessere Wert ist hervorgehoben.
export function MetricsTable({ comparison, leftStats, rightStats }: MetricsTableProps) {
  const { t } = useI18n();

  const rows: MetricRow[] = [
    {
      label: t('compare.currentTtr'),
      left: comparison.left.ratings?.currentTtr,
      right: comparison.right.ratings?.currentTtr,
      format: formatOptionalNumber,
    },
    {
      label: t('compare.qttr'),
      left: comparison.left.ratings?.qttr,
      right: comparison.right.ratings?.qttr,
      format: formatOptionalNumber,
    },
    {
      label: t('compare.peak'),
      left: comparison.left.ratings?.maxTtr,
      right: comparison.right.ratings?.maxTtr,
      format: formatOptionalNumber,
    },
    {
      label: t('compare.lastFive'),
      left: leftStats?.recentDelta5,
      right: rightStats?.recentDelta5,
      format: formatSignedNumber,
    },
    {
      label: t('compare.record'),
      left: leftStats?.winRate,
      right: rightStats?.winRate,
      format: formatPercent,
      leftText: leftStats && leftStats.wins + leftStats.losses > 0 ? `${leftStats.wins}:${leftStats.losses}` : undefined,
      rightText: rightStats && rightStats.wins + rightStats.losses > 0 ? `${rightStats.wins}:${rightStats.losses}` : undefined,
    },
    {
      label: t('compare.quote'),
      left: leftStats?.winRate,
      right: rightStats?.winRate,
      format: formatPercent,
    },
    {
      label: t('compare.averageChange'),
      left: leftStats?.averageDelta,
      right: rightStats?.averageDelta,
      format: formatSignedAverage,
    },
    {
      label: t('compare.bestJump'),
      left: leftStats?.bestGain,
      right: rightStats?.bestGain,
      format: formatSignedNumber,
    },
    {
      label: t('compare.matches'),
      left: leftStats?.matchCount,
      right: rightStats?.matchCount,
      format: formatOptionalNumber,
    },
  ];

  return (
      <View style={styles.section}>
        <SectionHeader title={t('compare.keyMetrics')} meta={t('compare.keyMetricsBasis')} />

        <ListGroup>
          {rows.map((row) => (
              <MetricLine key={row.label} row={row} />
          ))}
        </ListGroup>
      </View>
  );
}
