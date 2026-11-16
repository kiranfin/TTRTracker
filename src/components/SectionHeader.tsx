import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { typography } from '../theme/typography';

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
  // Text rechts ohne Aktion, z. B. "18.10.2026"
  meta?: string;
  // label: kleine graue Überschrift direkt über einer Liste ("Spieler", "Vereine")
  variant?: 'section' | 'label';
};

export function SectionHeader({ title, actionLabel, onActionPress, meta, variant = 'section' }: SectionHeaderProps) {
  const { colors } = useTheme();
  const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;
  const isLabel = variant === 'label';

  return (
      <View style={styles.row}>
        <Text
            style={[isLabel ? typography.groupLabel : typography.section, styles.title, { color: isLabel ? colors.mutedText : colors.text }]}
            numberOfLines={1}
        >
          {title}
        </Text>

        {actionLabel && onActionPress ? (
            <Pressable
                accessibilityRole="button"
                onPress={onActionPress}
                hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                style={({ pressed }) => [noWebOutline, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={[typography.metaStrong, styles.action, { color: colors.primary }]}>{actionLabel}</Text>
            </Pressable>
        ) : meta ? (
            <Text style={[typography.label, { color: colors.mutedText }]} numberOfLines={1}>
              {meta}
            </Text>
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
    fontSize: 14,
  },
});
