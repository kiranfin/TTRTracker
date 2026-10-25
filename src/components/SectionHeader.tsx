import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function SectionHeader({ title, actionLabel, onActionPress }: SectionHeaderProps) {
  const { colors } = useTheme();
  const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

  return (
      <View style={styles.row}>
        <Text style={[typography.section, styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>

        {actionLabel && onActionPress ? (
            <Pressable
                accessibilityRole="button"
                onPress={onActionPress}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                style={({ pressed }) => [noWebOutline, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={[typography.meta, styles.action, { color: colors.primary }]}>{actionLabel}</Text>
            </Pressable>
        ) : null}
      </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  title: {
    flex: 1,
  },
  action: {
    fontWeight: '700',
  },
});
