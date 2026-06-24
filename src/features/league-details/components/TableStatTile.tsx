import { Text, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { getStatTileColors } from '../utils';
import { styles } from '../styles';

export function TableStatTile({
                           label,
                           value,
                           tone,
                           strong,
                       }: {
    label: string;
    value: string;
    tone: 'points' | 'games' | 'record' | 'ratio';
    strong?: boolean;
}) {
    const { colors: themeColors } = useTheme();
    const colors = getStatTileColors(tone, themeColors);

    return (
        <View
            style={[
                styles.leagueStatTile,
                {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                },
            ]}
        >
            <Text style={[styles.leagueStatLabel, { color: colors.label }]} numberOfLines={1}>
                {label}
            </Text>

            <Text
                style={[
                    styles.leagueStatValue,
                    strong ? styles.leagueStatValueStrong : null,
                    { color: colors.value },
                ]}
                numberOfLines={1}
            >
                {value}
            </Text>
        </View>
    );
}
