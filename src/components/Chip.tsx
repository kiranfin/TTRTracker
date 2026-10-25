import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { MIN_TOUCH, spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

type ChipProps = {
  label: string;
  active?: boolean;
  count?: number;
  onPress?: () => void;
};

export function Chip({ label, active, count, onPress }: ChipProps) {
  const { colors } = useTheme();
  const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

  const textColor = active ? colors.primaryForeground : colors.text;
  const countColor = active ? colors.primaryForeground : colors.mutedText;

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
              backgroundColor: active ? colors.primary : colors.card,
              borderColor: active ? colors.primary : colors.border,
              opacity: pressed ? 0.78 : 1,
            },
          ]}
      >
        <Text style={[typography.meta, styles.label, { color: textColor }]} numberOfLines={1}>
          {label}
        </Text>

        {typeof count === 'number' ? (
            <Text style={[typography.label, styles.count, { color: countColor }]}>{count}</Text>
        ) : null}
      </Pressable>
  );
}

type ChipRowProps = {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

// Horizontal scrollbare Filterzeile. Der Scroll-Inhalt reicht bis zum Rand, damit nichts abgeschnitten wirkt.
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
    minHeight: MIN_TOUCH - 8,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontWeight: '700',
  },
  count: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  row: {
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: 2,
  },
});
