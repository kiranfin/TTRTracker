import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { IconName } from '../types';
import { styles } from '../styles';

export function InfoPill({ icon, text }: { icon: IconName; text: string }) {
  const { colors } = useTheme();

  return (
      <View style={[styles.infoPill, { borderColor: colors.border }]}>
        <Ionicons name={icon} size={15} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.mutedText }]} numberOfLines={2}>
          {text}
        </Text>
      </View>
  );
}
