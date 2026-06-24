import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Badge } from '@/src/components/Badge';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { TeamBalance } from '../types';
import { formatPercent } from '../utils';
import { styles } from '../styles';
import { BalanceStat } from './BalanceStat';

export function BalanceCard({ balance }: { balance: TeamBalance }) {
    const { colors } = useTheme();
    const { t } = useI18n();
    const canOpen = Boolean(balance.playerId);

    return (
        <Pressable
            disabled={!canOpen}
            onPress={
                canOpen
                    ? () =>
                        router.push({
                            pathname: '/player/[nuid]',
                            params: {
                                nuid: balance.playerId!,
                                name: balance.name,
                            },
                        })
                    : undefined
            }
            style={({ pressed }) => [
                styles.balanceCard,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                },
                pressed ? styles.cardPressed : null,
            ]}
        >
            <View style={styles.balanceTopRow}>
                <View style={styles.personContent}>
                    <Text style={[styles.personName, { color: colors.text }]} numberOfLines={2}>
                        {balance.name}
                    </Text>

                    <View style={styles.personMetaRow}>
                        {balance.rank ? <Badge tone="secondary">{t('team.rank', { rank: balance.rank })}</Badge> : null}
                    </View>
                </View>

                {canOpen ? <Ionicons name="chevron-forward" size={18} color={colors.mutedText} /> : null}
            </View>

            <View style={styles.balanceStatGrid}>
                <BalanceStat label={t('team.appearances')} value={balance.meetingsCount ?? '-'} />
                <BalanceStat label={t('team.record')} value={`${balance.pointsWon ?? '0'}:${balance.pointsLost ?? '0'}`} />
                <BalanceStat label={t('team.quote')} value={formatPercent(balance.quote)} />
            </View>
        </Pressable>
    );
}
