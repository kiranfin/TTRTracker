import { Text, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { styles } from '../styles';

export function MiniStat({
                    label,
                    value,
                  }: {
  label: string;
  value: string;
}) {
  const { colors } = useTheme();

  return (
      <View style={[styles.miniStat, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Text style={[styles.miniStatLabel, { color: colors.mutedText }]}>
          {label}
        </Text>

        <Text style={[styles.miniStatValue, { color: colors.text }]}>
          {value}
        </Text>
      </View>
  );
}
