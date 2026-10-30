import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MIN_TOUCH, spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

type ListRowProps = {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  destructive?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function ListRow({
                          title,
                          subtitle,
                          leading,
                          trailing,
                          chevron,
                          destructive,
                          onPress,
                          accessibilityLabel,
                          style,
                        }: ListRowProps) {
  const { colors } = useTheme();
  const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;
  const showChevron = chevron ?? Boolean(onPress);

  const content = (
      <>
        {leading ? <View style={styles.leading}>{leading}</View> : null}

        <View style={styles.main}>
          <Text
              style={[typography.bodyStrong, { color: destructive ? colors.destructive : colors.text }]}
              numberOfLines={1}
          >
            {title}
          </Text>

          {subtitle ? (
              <Text style={[typography.meta, { color: colors.mutedText }]} numberOfLines={1}>
                {subtitle}
              </Text>
          ) : null}
        </View>

        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}

        {showChevron ? <Ionicons name="chevron-forward" size={18} color={colors.mutedText} /> : null}
      </>
  );

  if (!onPress) {
    return <View style={[styles.row, style]}>{content}</View>;
  }

  return (
      <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? title}
          onPress={onPress}
          style={({ pressed }) => [
            styles.row,
            noWebOutline,
            pressed && { backgroundColor: colors.soft },
            style,
          ]}
      >
        {content}
      </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH + 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  leading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  trailing: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
