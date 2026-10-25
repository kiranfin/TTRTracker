import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Platform, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { font } from '../theme/typography';

type ActionButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  // primary: Akzent gefüllt; secondary: weiße Karte; active: hervorgehoben (z. B. Favorit gesetzt)
  variant?: 'primary' | 'secondary' | 'active';
  // horizontal: Icon neben dem Text, flacher (z. B. Verein: Mein Verein / Favorit)
  layout?: 'stacked' | 'inline';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const ACTIVE_COLOR = '#D97706';

// Aktionsleisten: mehrere davon mit flex: 1 nebeneinander.
export function ActionButton({
                               icon,
                               label,
                               onPress,
                               variant = 'secondary',
                               layout = 'stacked',
                               loading,
                               disabled,
                               style,
                             }: ActionButtonProps) {
  const { colors } = useTheme();
  const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;
  const primary = variant === 'primary';
  const active = variant === 'active';

  const foreground = primary ? colors.primaryForeground : active ? ACTIVE_COLOR : colors.text;
  const backgroundColor = primary ? colors.primary : active ? `${ACTIVE_COLOR}1F` : colors.card;
  const borderColor = primary ? colors.primary : active ? `${ACTIVE_COLOR}59` : colors.border;

  return (
      <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled: Boolean(disabled), busy: Boolean(loading), selected: active }}
          onPress={disabled || loading ? undefined : onPress}
          style={({ pressed }) => [
            styles.button,
            layout === 'inline' ? styles.inline : styles.stacked,
            noWebOutline,
            { backgroundColor, borderColor, opacity: disabled ? 0.45 : pressed ? 0.78 : 1 },
            style,
          ]}
      >
        {loading ? (
            <ActivityIndicator size="small" color={foreground} />
        ) : (
            <Ionicons name={icon} size={layout === 'inline' ? 17 : 21} color={foreground} />
        )}

        <Text style={[styles.label, layout === 'inline' && styles.labelInline, { color: foreground }]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  stacked: {
    height: 68,
    borderRadius: 16,
    gap: 6,
  },
  inline: {
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    fontSize: 13,
    lineHeight: 16,
    ...font('600'),
  },
  labelInline: {
    fontSize: 14,
  },
});
