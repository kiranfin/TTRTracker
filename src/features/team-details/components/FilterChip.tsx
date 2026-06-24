import { Pressable, Text } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { styles } from '../styles';

export function FilterChip({
                        label,
                        active,
                        onPress,
                    }: {
    label: string;
    active: boolean;
    onPress: () => void;
}) {
    const { colors } = useTheme();

    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.filterChip,
                {
                    backgroundColor: active ? colors.primarySoft : colors.card,
                    borderColor: active ? colors.primarySoftBorder : colors.border,
                },
            ]}
        >
            <Text
                style={[
                    styles.filterChipText,
                    {
                        color: active ? colors.primary : colors.mutedText,
                    },
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}
