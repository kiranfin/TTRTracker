import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Platform, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { MIN_TOUCH, spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

type ActionButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Icon über Label, für Aktionsleisten. In einer Zeile mit flex: 1 nebeneinander legen.
export function ActionButton({
                               icon,
                               label,
                               onPress,
                               variant = 'secondary',
                               loading,
                               disabled,
                               style,
                             }: ActionButtonProps) {
  const { colors } = useTheme();
  const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

  const primary = variant === 'primary';
  const foreground = primary ? colors.primaryForeground : colors.text;

  return (
      <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled: Boolean(disabled), busy: Boolean(loading) }}
          onPress={disabled || loading ? undefined : onPress}
          style={({ pressed }) => [
            styles.button,
            noWebOutline,
            {
              backgroundColor: primary ? colors.primary : colors.card,
              borderColor: primary ? colors.primary : colors.border,
              opacity: disabled ? 0.48 : pressed ? 0.78 : 1,
            },
            style,
          ]}
      >
        {loading ? (
            <ActivityIndicator size="small" color={foreground} />
        ) : (
            <Ionicons name={icon} size={20} color={primary ? foreground : colors.primary} />
        )}

        <Text style={[typography.label, styles.label, { color: foreground }]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minHeight: MIN_TOUCH + 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontWeight: '700',
  },
});
