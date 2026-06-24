import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { ShortcutCardProps } from '../types';
import { styles } from '../styles';

export function ShortcutCard({
                        title,
                        icon,
                        iconBg,
                        iconColor,
                        onPress,
                      }: ShortcutCardProps) {
  const { colors } = useTheme();

  return (
      <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.shortcutCard,
            {
              backgroundColor: pressed ? colors.primarySoft : colors.card,
              borderColor: pressed ? colors.primarySoftBorder : colors.border,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
      >
        <View style={[styles.shortcutIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>

        <Text style={[styles.shortcutTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
      </Pressable>
  );
}
