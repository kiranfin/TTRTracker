import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { IconName } from '../types';
import { cleanValue } from '../utils';
import { styles } from '../styles';

export function InfoRow({
                     icon,
                     label,
                     value,
                 }: {
    icon: IconName;
    label: string;
    value?: string;
}) {
    const { colors } = useTheme();
    const cleaned = cleanValue(value);

    if (!cleaned) return null;

    return (
        <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: colors.muted }]}>
                <Ionicons name={icon} size={15} color={colors.mutedText} />
            </View>

            <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.mutedText }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>{cleaned}</Text>
            </View>
        </View>
    );
}
