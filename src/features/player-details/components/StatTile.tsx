import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { styles } from '../styles';

export function StatTile({
                      icon,
                      label,
                      value,
                      helper,
                      positive,
                      negative,
                  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    helper: string;
    positive?: boolean;
    negative?: boolean;
}) {
    const { colors } = useTheme();

    const valueColor = negative
        ? colors.destructive
        : positive
            ? '#16a34a'
            : colors.text;

    return (
        <View style={[styles.statTile, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <View style={styles.statTileHeader}>
                <View style={[styles.statIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name={icon} size={16} color={colors.mutedText} />
                </View>

                <Text style={[styles.statLabel, { color: colors.mutedText }]} numberOfLines={1}>
                    {label}
                </Text>
            </View>

            <Text style={[styles.statValue, { color: valueColor }]} numberOfLines={1}>
                {value}
            </Text>

            <Text style={[styles.statHelper, { color: colors.mutedText }]} numberOfLines={2}>
                {helper}
            </Text>
        </View>
    );
}
