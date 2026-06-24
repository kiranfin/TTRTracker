import { Text, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { styles } from '../styles';

export function BalanceStat({ label, value }: { label: string; value: string }) {
    const { colors } = useTheme();

    return (
        <View style={[styles.balanceStat, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.balanceStatLabel, { color: colors.mutedText }]} numberOfLines={1}>
                {label}
            </Text>
            <Text style={[styles.balanceStatValue, { color: colors.text }]} numberOfLines={1}>
                {value}
            </Text>
        </View>
    );
}
