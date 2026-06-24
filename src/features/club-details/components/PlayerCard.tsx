import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Badge } from '@/src/components/Badge';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { ClubPlayer } from '../types';
import { hasLastYearNoGame, getPlayerCardAccent } from '../utils';
import { styles } from '../styles';

export function PlayerCard({ player, index }: { player: ClubPlayer; index: number }) {
    const { colors } = useTheme();
    const canOpen = Boolean(player.nuid);
    const rankLabel = player.rank ?? String(index + 1);
    const noGameLastYear = hasLastYearNoGame(player.lastYearNoGame);
    const accent = getPlayerCardAccent(colors, noGameLastYear);

    const metaText =
        [player.teamName, player.leagueName, player.clubName, player.association]
            .filter(Boolean)
            .join(' • ') || 'Spieler';

    return (
        <Pressable
            disabled={!canOpen}
            onPress={
                canOpen
                    ? () =>
                        router.push({
                            pathname: '/player/[nuid]',
                            params: {
                                nuid: player.nuid!,
                                title: player.name,
                            },
                        })
                    : undefined
            }
            style={({ pressed }) => [
                styles.playerCard,
                {
                    backgroundColor: accent.background,
                    borderColor: accent.border,
                },
                pressed && canOpen ? styles.playerCardPressed : null,
            ]}
        >
            <View style={styles.playerTopRow}>
                <View
                    style={[
                        styles.playerRankBadge,
                        {
                            backgroundColor: accent.rankBackground,
                            borderColor: accent.rankBorder,
                        },
                    ]}
                >
                    <Text
                        style={[styles.playerRankText, { color: accent.rankText }]}
                        numberOfLines={1}
                    >
                        {rankLabel}
                    </Text>
                </View>

                <View style={styles.playerText}>
                    <Text style={[styles.playerName, { color: colors.text }]} numberOfLines={2}>
                        {player.name}
                    </Text>

                    <Text style={[styles.playerMeta, { color: colors.mutedText }]} numberOfLines={2}>
                        {metaText}
                    </Text>
                </View>

                {canOpen ? <Ionicons name="chevron-forward" size={18} color={colors.mutedText} /> : null}
            </View>

            <View style={styles.badgeRow}>
                {player.ttr ? <Badge tone="outline">TTR {player.ttr}</Badge> : null}
                {player.qttr ? <Badge tone="outline">QTTR {player.qttr}</Badge> : null}
                {player.matchCount ? <Badge tone="outline">{player.matchCount} Spiele</Badge> : null}
            </View>
        </Pressable>
    );
}
