import { Text, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { styles } from '../styles';

export function OverviewFact({
                          label,
                          value,
                          helper,
                      }: {
    label: string;
    value: string;
    helper: string;
}) {
    const { colors } = useTheme();

    return (
        <View style={[styles.overviewFact, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.overviewFactLabel, { color: colors.mutedText }]}>{label}</Text>
            <Text style={[styles.overviewFactValue, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.overviewFactHelper, { color: colors.mutedText }]} numberOfLines={1}>
                {helper}
            </Text>
        </View>
    );
}
