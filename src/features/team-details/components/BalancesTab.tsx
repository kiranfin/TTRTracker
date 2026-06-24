import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { TeamBalance, RoundFilter } from '../types';
import { roundFilterLabel, formatPercent } from '../utils';
import { styles } from '../styles';
import { BalanceCard } from './BalanceCard';
import { MiniStat } from './MiniStat';

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
            <Card style={styles.sectionCard}>
                <View style={styles.sectionHeaderCompact}>
                    <Ionicons name="analytics-outline" size={18} color={colors.primary} />
                    <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>
                        {t('team.balanceOverview')}
                    </Text>
                </View>

                <View style={styles.miniStatRow}>
                    <MiniStat label={t('team.period')} value={roundFilterLabel(roundFilter, t)} />
                    <MiniStat label={t('team.points')} value={`${summary.pointsWon}:${summary.pointsLost}`} />
                    <MiniStat label={t('team.quote')} value={formatPercent(summary.quote)} />
                </View>
            </Card>

            <Card style={styles.tableCard}>
                <View style={styles.sectionHeader}>
                    <View
                        style={[
                            styles.sectionIcon,
                            {
                                backgroundColor: colors.primarySoft,
                                borderColor: colors.primarySoftBorder,
                            },
                        ]}
                    >
                        <Ionicons name="stats-chart-outline" size={18} color={colors.primary} />
                    </View>

                    <View style={styles.sectionHeaderText}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('team.playerBalances')}</Text>
                        <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                            {t('team.playerBalancesSubtitle')}
                        </Text>
                    </View>
                </View>

                <View style={styles.itemList}>
                    {balances.map((balance, index) => (
                        <BalanceCard key={`${balance.playerId ?? balance.name}-${index}`} balance={balance} />
                    ))}
                </View>
            </Card>
        </View>
    );
}
