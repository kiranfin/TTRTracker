import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { font, typography } from '../theme/typography';

type ChipProps = {
  label: string;
  active?: boolean;
  count?: number;
  onPress?: () => void;
};

// Aktiv: dunkle Füllung in Textfarbe, damit Filter nicht mit Akzent-Buttons konkurrieren.
export function Chip({ label, active, count, onPress }: ChipProps) {
  const { colors } = useTheme();
  const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;
  const textColor = active ? colors.card : colors.text;

  return (
      <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: Boolean(active) }}
          onPress={onPress}
          hitSlop={{ top: 4, bottom: 4 }}
          style={({ pressed }) => [
            styles.chip,
            noWebOutline,
            {
              backgroundColor: active ? colors.text : colors.card,
              borderColor: active ? colors.text : colors.border,
              opacity: pressed ? 0.78 : 1,
            },
          ]}
      >
        <Text style={[typography.metaStrong, styles.label, { color: textColor }]} numberOfLines={1}>
          {label}
        </Text>

        {typeof count === 'number' ? (
            <Text style={[typography.metaStrong, styles.count, { color: textColor }]}>{count}</Text>
        ) : null}
      </Pressable>
  );
}

type ChipRowProps = {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

// Horizontal scrollbare Filterzeile.
export function ChipRow({ children, contentStyle }: ChipRowProps) {
  return (
      <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.row, contentStyle]}
          keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 14,
  },
  count: {
    fontSize: 14,
    opacity: 0.7,
    ...font('500'),
    fontVariant: ['tabular-nums'],
  },
  row: {
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: 2,
  },
});
