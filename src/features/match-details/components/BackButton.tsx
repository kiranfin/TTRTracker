import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Platform, Pressable } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { styles } from '../styles';

export function BackButton() {
  const { colors } = useTheme();
  const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {};

  return (
      <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [
            styles.backButton,
            noWebOutline,
            {
              backgroundColor: pressed ? colors.primarySoft : 'transparent',
              borderColor: pressed ? colors.primarySoftBorder : colors.border,
            },
          ]}
      >
        <Ionicons name="arrow-back" size={23} color={colors.text} />
      </Pressable>
  );
}
