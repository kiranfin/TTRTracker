import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Avatar } from '@/src/components/Avatar';
import { ListRow } from '@/src/components/ListRow';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric } from '@/src/theme/typography';
import type { ClubPlayer } from '../types';
import { hasLastYearNoGame } from '../utils';
import { styles } from '../styles';

export function ClubPlayerRow({ player }: { player: ClubPlayer }) {
    const { colors } = useTheme();

    const subtitle = [player.teamName, player.leagueName].filter(Boolean).join(' · ') || undefined;
    const noGameLastYear = hasLastYearNoGame(player.lastYearNoGame);

    return (
        <ListRow
            leading={<Avatar name={player.name} size={40} />}
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
