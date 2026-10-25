import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { font } from '../theme/typography';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  // Wird bewusst nicht mehr angezeigt (nur Text, wie im Design), bleibt für bestehende Aufrufer erhalten.
  icon?: keyof typeof Ionicons.glyphMap;
};

export function SegmentedTabs<T extends string>({
                                                  value,
                                                  onChange,
                                                  options,
                                                  compact,
                                                }: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  // Kleinere Variante, z. B. für den Zeitraum im Diagramm
  compact?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

  return (
      <View accessibilityRole="tablist" style={[styles.wrap, compact && styles.wrapCompact, { backgroundColor: colors.soft }]}>
        {options.map((option) => {
          const active = option.value === value;

          return (
              <Pressable
                  key={option.value}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => onChange(option.value)}
                  style={({ pressed }) => [
                    styles.tab,
                    compact && styles.tabCompact,
                    noWebOutline,
                    active && [
                      styles.tabActive,
                      { backgroundColor: isDark ? colors.border : colors.card, shadowColor: colors.shadow },
                    ],
                    pressed && styles.pressed,
                  ]}
              >
                <Text
                    style={[styles.label, compact && styles.labelCompact, { color: active ? colors.text : colors.mutedText }]}
                    numberOfLines={1}
                >
                  {option.label}
                </Text>
              </Pressable>
          );
        })}
      </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  wrapCompact: {
    borderRadius: 11,
  },
  tab: {
    flex: 1,
    height: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabCompact: {
    height: 30,
    borderRadius: 8,
  },
  tabActive: {
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    ...font('600'),
  },
  labelCompact: {
    fontSize: 13,
  },
  pressed: {
    opacity: 0.78,
  },
});
