import { Text, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { styles } from '../styles';

export function InfoRow({ label, value }: { label: string; value: string }) {
    const { colors } = useTheme();

    return (
        <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.mutedText }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>
                {value}
            </Text>
        </View>
    );
}
