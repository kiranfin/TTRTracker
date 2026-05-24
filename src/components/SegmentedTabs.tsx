import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function SegmentedTabs<T extends string>({
                                                  value,
                                                  onChange,
                                                  options,
                                                }: {
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
}) {
  const { colors } = useTheme();
  const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

  return (
      <View style={[styles.wrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        {options.map((option) => {
          const active = option.value === value;
          const textColor = active ? colors.primary : colors.mutedText;

          return (
              <Pressable
                  key={option.value}
                  onPress={() => onChange(option.value)}
                  style={({ pressed }) => [
                    styles.tab,
                    noWebOutline,
                    active && {
                      backgroundColor: colors.card,
                      borderColor: colors.primarySoftBorder,
                      shadowColor: colors.shadow,
                    },
                    pressed && styles.pressed,
                  ]}
              >
                {option.icon ? <Ionicons name={option.icon} size={17} color={textColor} /> : null}
                <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
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
    borderRadius: 18,
    padding: 5,
    gap: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.78,
  },
});