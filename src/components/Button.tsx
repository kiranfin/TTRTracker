import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

type ButtonProps = {
  children: ReactNode;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
                         children,
                         onPress,
                         icon,
                         variant = 'primary',
                         disabled,
                         loading,
                         style,
                       }: ButtonProps) {
  const { colors } = useTheme();
  const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

  const backgroundColor =
      variant === 'primary'
          ? colors.primary
          : variant === 'secondary'
              ? colors.primarySoft
              : variant === 'outline'
                  ? 'transparent'
                  : 'transparent';

  const borderColor =
      variant === 'primary'
          ? colors.primary
          : variant === 'secondary'
              ? colors.primarySoftBorder
              : variant === 'outline'
                  ? colors.border
                  : 'transparent';

  const textColor =
      variant === 'primary'
          ? '#ffffff'
          : variant === 'secondary'
              ? colors.primary
              : variant === 'outline'
                  ? colors.text
                  : colors.primary;

  return (
      <Pressable
          onPress={disabled || loading ? undefined : onPress}
          style={({ pressed }) => [
            styles.button,
            noWebOutline,
            {
              backgroundColor,
              borderColor,
              opacity: disabled ? 0.48 : pressed ? 0.78 : 1,
            },
            style,
          ]}
      >
        {loading ? (
            <ActivityIndicator color={textColor} size="small" />
        ) : icon ? (
            <Ionicons name={icon} size={18} color={textColor} />
        ) : null}

        <Text style={[styles.buttonText, { color: textColor }]} numberOfLines={1}>
          {children}
        </Text>
      </Pressable>
  );
}

type IconButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  active?: boolean;
  accessibilityLabel?: string;
};

export function IconButton({ icon, onPress, active, accessibilityLabel }: IconButtonProps) {
  const { colors } = useTheme();
  const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

  return (
      <Pressable
          accessibilityLabel={accessibilityLabel}
          onPress={onPress}
          hitSlop={8}
          style={({ pressed }) => [
            styles.iconButton,
            noWebOutline,
            {
              backgroundColor: active ? colors.primarySoft : colors.card,
              borderColor: active ? colors.primarySoftBorder : colors.border,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
      >
        <Ionicons name={icon} size={20} color={active ? colors.primary : colors.mutedText} />
      </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});