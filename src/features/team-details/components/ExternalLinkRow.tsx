import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { IconName } from '../types';
import { cleanValue, openUrl } from '../utils';
import { styles } from '../styles';

export function ExternalLinkRow({
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
        <Pressable
            onPress={() => openUrl(cleaned)}
            style={({ pressed }) => [styles.infoRow, pressed ? styles.cardPressed : null]}
        >
            <View style={[styles.infoIcon, { backgroundColor: colors.muted }]}>
                <Ionicons name={icon} size={15} color={colors.mutedText} />
            </View>

            <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.mutedText }]}>{label}</Text>
                <Text style={[styles.infoValue, { color: colors.primary }]} numberOfLines={2}>
                    {cleaned}
                </Text>
            </View>

            <Ionicons name="open-outline" size={16} color={colors.mutedText} />
        </Pressable>
    );
}
