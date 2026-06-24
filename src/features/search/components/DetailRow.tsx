import { Text, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { styles } from '../styles';

export function DetailRow({ label, value, monospace }: { label: string; value: string; monospace?: boolean }) {
  const { colors } = useTheme();

  return (
      <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.detailLabel, { color: colors.mutedText }]}>{label}</Text>
        <Text style={[styles.detailValue, monospace && styles.monospace, { color: colors.text }]} numberOfLines={3}>{value}</Text>
      </View>
  );
}
