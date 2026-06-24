import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Badge } from '@/src/components/Badge';
import { useTheme } from '@/src/theme/ThemeProvider';
import { styles } from '../styles';

export function FavoriteSection({
                           title,
                           icon,
                           count,
                           children,
                         }: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  count: number;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();

  return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name={icon} size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
          </View>

          <Badge tone="secondary">{count}</Badge>
        </View>

        <View style={styles.stack}>{children}</View>
      </View>
  );
}
