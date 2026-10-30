import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { font, typography } from '../theme/typography';

export type BreadcrumbItem = {
  label: string;
  onPress?: () => void;
};

// Pfad wie "Ligen > TTBW > Kreis". Einträge mit onPress sind antippbar, der letzte ist der aktuelle Ort.
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  const { colors } = useTheme();

  return (
      <View style={styles.row}>
        {items.map((item, index) => {
          const last = index === items.length - 1;

          return (
              <View key={`${item.label}-${index}`} style={styles.item}>
                {index > 0 ? <Ionicons name="chevron-forward" size={12} color={colors.mutedText} /> : null}

                <Pressable
                    accessibilityRole={item.onPress ? 'link' : 'text'}
                    disabled={!item.onPress}
                    onPress={item.onPress}
                    hitSlop={{ top: 13, bottom: 13, left: 4, right: 4 }}
                    style={styles.pressable}
                >
                  <Text
                      style={[
                        typography.meta,
                        { color: item.onPress ? colors.primary : colors.mutedText, ...font(last ? '700' : '600') },
                      ]}
                      numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              </View>
          );
        })}
      </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
  },
  pressable: {
    flexShrink: 1,
  },
});
