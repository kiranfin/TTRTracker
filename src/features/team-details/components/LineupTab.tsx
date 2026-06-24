import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { TeamPlayer } from '../types';
import { styles } from '../styles';
import { PlayerCard } from './PlayerCard';

export function LineupTab({ players }: { players: TeamPlayer[] }) {
    const { colors } = useTheme();
    const { t } = useI18n();

    if (players.length === 0) {
        return <EmptyState icon="people-outline" title={t('team.lineupEmpty')} />;
    }

    return (
        <Card style={styles.tableCard}>
            <View style={styles.sectionHeader}>
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} />

                <View style={styles.sectionHeaderText}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('team.lineup')}</Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                        {t('team.lineupSubtitle')}
                    </Text>
                </View>
            </View>

            <View style={styles.itemList}>
                {players.map((player, index) => (
                    <PlayerCard key={`${player.id ?? player.name}-${index}`} player={player} index={index} />
                ))}
            </View>
        </Card>
    );
}
