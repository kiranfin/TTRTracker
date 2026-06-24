import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { styles } from '../styles';

export function LeagueOption({
                          label,
                          selected,
                          onPress,
                      }: {
    label: string;
    selected: boolean;
    onPress: () => void;
}) {
    const { colors } = useTheme();

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.leagueOption,
                {
                    backgroundColor: selected || pressed ? colors.primarySoft : 'transparent',
                    borderBottomColor: colors.border,
                },
            ]}
        >
            <Text
                style={[
                    styles.leagueOptionText,
                    {
                        color: selected ? colors.primary : colors.text,
                    },
                ]}
                numberOfLines={2}
            >
                {label}
            </Text>

            {selected ? (
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            ) : null}
        </Pressable>
    );
}
