import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { styles } from '../styles';

export function PaginationIconButton({
                                  icon,
                                  disabled,
                                  onPress,
                                  accessibilityLabel,
                                  double,
                              }: {
    icon: 'chevron-back' | 'chevron-forward';
    disabled: boolean;
    onPress: () => void;
    accessibilityLabel: string;
    double?: boolean;
}) {
    const { colors } = useTheme();

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            style={({ pressed }) => [
                styles.paginationIconButton,
                {
                    borderColor: colors.border,
                    backgroundColor: pressed && !disabled ? colors.primarySoft : 'transparent',
                    opacity: disabled ? 0.35 : 1,
                },
            ]}
        >
            <View style={styles.paginationChevronWrap}>
                <Ionicons name={icon} size={17} color={colors.text} />
                {double ? (
                    <Ionicons
                        name={icon}
                        size={17}
                        color={colors.text}
                        style={styles.paginationSecondChevron}
                    />
                ) : null}
            </View>
        </Pressable>
    );
}
