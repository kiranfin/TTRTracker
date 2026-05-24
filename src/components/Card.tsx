import type { ReactNode } from 'react';
import { Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  pressable?: boolean;
  onPress?: () => void;
};

export function Card({ children, style, pressable, onPress }: CardProps) {
  const { colors } = useTheme();
  const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {};

  const baseStyle = [
    styles.card,
    {
      backgroundColor: colors.card,
      borderColor: colors.border,
      shadowColor: colors.shadow,
    },
    style,
  ];

  if (pressable || onPress) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
              ...baseStyle,
              noWebOutline,
              {
                opacity: pressed ? 0.82 : 1,
              },
            ]}
        >
          {children}
        </Pressable>
    );
  }

  return (
      <View style={baseStyle}>
        {children}
      </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 2,
  },
});