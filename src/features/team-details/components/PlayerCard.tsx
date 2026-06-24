import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Badge } from '@/src/components/Badge';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { TeamPlayer } from '../types';
import { styles } from '../styles';

export function PlayerCard({ player, index }: { player: TeamPlayer; index: number }) {
    const { colors } = useTheme();
    const canOpen = Boolean(player.id);

    return (
        <Pressable
            disabled={!canOpen}
            onPress={
                canOpen
                    ? () =>
                        router.push({
                            pathname: '/player/[nuid]',
                            params: {
                                nuid: player.id!,
                                name: player.name,
                            },
                        })
                    : undefined
            }
            style={({ pressed }) => [
                styles.personCard,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                },
                pressed ? styles.cardPressed : null,
            ]}
        >
            <View
                style={[
                    styles.rankBadge,
                    {
                        backgroundColor: colors.primarySoft,
                        borderColor: colors.primarySoftBorder,
                    },
                ]}
            >
                <Text style={[styles.rankText, { color: colors.primary }]}>
                    {player.rank ?? String(index + 1)}
                </Text>
            </View>

            <View style={styles.personContent}>
                <Text style={[styles.personName, { color: colors.text }]} numberOfLines={2}>
                    {player.name}
                </Text>

                <View style={styles.personMetaRow}>
                    {player.qttr ? <Badge tone="green">TTR {player.qttr}</Badge> : null}
                    {player.status ? <Badge tone="outline">{player.status}</Badge> : null}
                    {player.foreignerType ? <Badge tone="outline">{player.foreignerType}</Badge> : null}
                </View>
            </View>

            {canOpen ? <Ionicons name="chevron-forward" size={18} color={colors.mutedText} /> : null}
        </Pressable>
    );
}
