import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { ListRow } from '@/src/components/ListRow';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric } from '@/src/theme/typography';
import type { ClubPlayer } from '../types';
import { hasLastYearNoGame } from '../utils';
import { styles } from '../styles';

// Platz im Verein (club_rank aus der andro-Rangliste) statt Avatar. Die ersten drei sind akzentuiert.
function ClubRankTile({ rank }: { rank?: string }) {
    const { colors } = useTheme();
    const top = Number(rank) >= 1 && Number(rank) <= 3;

    return (
        <View style={[styles.rankTile, { backgroundColor: top ? colors.primarySoft : colors.soft }]}>
            <Text style={[numeric.row, { color: top ? colors.primary : colors.text }]} numberOfLines={1}>
                {rank ?? '–'}
            </Text>
        </View>
    );
}

export function ClubPlayerRow({ player, fallbackRank }: { player: ClubPlayer; fallbackRank?: number }) {
    const { colors } = useTheme();

    const subtitle = [player.teamName, player.leagueName].filter(Boolean).join(' · ') || undefined;
    const noGameLastYear = hasLastYearNoGame(player.lastYearNoGame);
    const rank = player.rank ?? (fallbackRank !== undefined ? String(fallbackRank) : undefined);

    return (
        <ListRow
            leading={<ClubRankTile rank={rank} />}
            title={player.name}
            subtitle={subtitle}
            trailing={
                player.ttr || noGameLastYear ? (
                    <View style={styles.playerTrailing}>
                        {noGameLastYear ? <Ionicons name="moon-outline" size={16} color={colors.warning} /> : null}
                        {player.ttr ? <Text style={[numeric.medium, { color: colors.text }]}>{player.ttr}</Text> : null}
                    </View>
                ) : undefined
            }
            onPress={
                player.nuid
                    ? () =>
                        router.push({
                            pathname: '/player/[nuid]',
                            params: { nuid: player.nuid!, title: player.name },
                        })
                    : undefined
            }
        />
    );
}
