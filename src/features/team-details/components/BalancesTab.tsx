import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { EmptyState } from '@/src/components/EmptyState';
import { ListGroup } from '@/src/components/ListGroup';
import { ListRow } from '@/src/components/ListRow';
import { SectionHeader } from '@/src/components/SectionHeader';
import { StatStrip } from '@/src/components/StatStrip';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import type { TeamBalance, RoundFilter } from '../types';
import { formatPercent, roundFilterLabel } from '../utils';
import { styles } from '../styles';

// Bilanzen: Überblick für den gewählten Zeitraum, darunter je Spieler Einsätze, Bilanz und Quote.
export function BalancesTab({
                              balances,
                              summary,
                              roundFilter,
                            }: {
  balances: TeamBalance[];
  summary: { pointsWon: number; pointsLost: number; quote?: number };
  roundFilter: RoundFilter;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();

  if (balances.length === 0) {
    return <EmptyState icon="stats-chart-outline" title={t('team.balancesEmpty')} />;
  }

  return (
      <View style={styles.stack}>
        <StatStrip
            items={[
              { label: t('team.period'), value: roundFilterLabel(roundFilter, t) },
              { label: t('team.points'), value: `${summary.pointsWon}:${summary.pointsLost}` },
              { label: t('team.quote'), value: formatPercent(summary.quote) },
            ]}
        />

        <View style={styles.section}>
          <SectionHeader variant="label" title={t('team.playerBalances')} />

          <ListGroup>
            {balances.map((balance, index) => (
                <ListRow
                    key={`${balance.playerId ?? balance.name}-${index}`}
                    leading={
                      <View style={[styles.positionBadge, { backgroundColor: colors.soft }]}>
                        <Text style={[numeric.small, { color: colors.text }]}>{balance.rank ?? String(index + 1)}</Text>
                      </View>
                    }
                    title={balance.name}
                    subtitle={balance.meetingsCount ? t('team.appearancesValue', { count: balance.meetingsCount }) : undefined}
                    chevron={false}
                    trailing={
                      <View style={styles.valueBlock}>
                        <Text style={[numeric.row, { color: colors.text }]}>
                          {`${balance.pointsWon ?? '0'}:${balance.pointsLost ?? '0'}`}
                        </Text>
                        <Text style={[typography.caption, { color: colors.mutedText }]}>{formatPercent(balance.quote)}</Text>
                      </View>
                    }
                    onPress={
                      balance.playerId
                          ? () =>
                              router.push({
                                pathname: '/player/[nuid]',
                                params: { nuid: balance.playerId!, name: balance.name },
                              })
                          : undefined
                    }
                />
            ))}
          </ListGroup>
        </View>
      </View>
  );
}
