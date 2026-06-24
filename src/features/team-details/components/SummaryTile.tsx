import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { IconName } from '../types';
import { getTileColors } from '../utils';
import { styles } from '../styles';

export function SummaryTile({
                         icon,
                         label,
                         value,
                         tone,
                     }: {
    icon: IconName;
    label: string;
    value: string;
    tone: 'primary' | 'green' | 'orange' | 'purple';
}) {
    const { colors } = useTheme();
    const tileColors = getTileColors(tone, colors);

    return (
        <View
            style={[
                styles.summaryTile,
                {
                    backgroundColor: tileColors.background,
                    borderColor: tileColors.border,
                },
            ]}
        >
            <Ionicons name={icon} size={18} color={tileColors.value} />
            <Text style={[styles.summaryValue, { color: tileColors.value }]} numberOfLines={1}>
                {value}
            </Text>
            <Text style={[styles.summaryLabel, { color: tileColors.label }]} numberOfLines={1}>
                {label}
            </Text>
        </View>
    );
}
