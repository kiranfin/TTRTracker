import { Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { AppTheme, useTheme } from '../theme/ThemeProvider';

type Props = {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
};

type Styles = {
    button: ViewStyle;
    secondary: ViewStyle;
    danger: ViewStyle;
    disabled: ViewStyle;
    text: TextStyle;
    secondaryText: TextStyle;
    dangerText: TextStyle;
};

export function ActionButton({ label, onPress, variant = 'primary', disabled }: Props) {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <Pressable
            style={({ pressed }) => [
                styles.button,
                variant === 'secondary' && styles.secondary,
                variant === 'danger' && styles.danger,
                disabled && styles.disabled,
                pressed && !disabled ? { opacity: 0.75 } : null,
            ]}
            onPress={onPress}
            disabled={disabled}
        >
            <Text
                style={[
                    styles.text,
                    variant === 'secondary' && styles.secondaryText,
                    variant === 'danger' && styles.dangerText,
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}

function createStyles(theme: AppTheme) {
    return StyleSheet.create<Styles>({
        button: {
            backgroundColor: theme.colors.accent,
            borderRadius: theme.radius.lg,
            paddingVertical: 14,
            alignItems: 'center',
        },
        secondary: {
            backgroundColor: theme.colors.surfaceAlt,
        },
        danger: {
            backgroundColor: theme.colors.surfaceAlt,
        },
        disabled: {
            opacity: 0.45,
        },
        text: {
            color: theme.colors.accentText,
            fontWeight: '900',
            fontSize: 15,
        },
        secondaryText: {
            color: theme.colors.text,
        },
        dangerText: {
            color: theme.colors.danger,
        },
    });
}