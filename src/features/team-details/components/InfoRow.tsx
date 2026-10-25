import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import type { IconName } from '../types';
import { cleanValue, openUrl } from '../utils';
import { styles } from '../styles';

export type InfoItem = {
  icon: IconName;
  label: string;
  value?: string;
  // Öffnet den Wert als Link (Website, PDF)
  link?: boolean;
};

// Nur Einträge mit Inhalt, damit ListGroup keine leeren Zeilen und Trennlinien bekommt.
export function filterInfoItems(items: InfoItem[]) {
  return items
      .map((item) => ({ ...item, value: cleanValue(item.value) }))
      .filter((item): item is InfoItem & { value: string } => Boolean(item.value));
}

// Zeile in einer Info-Liste: Icon-Kachel, Label klein, Wert darunter.
export function InfoRow({ item }: { item: InfoItem & { value: string } }) {
  const { colors } = useTheme();

  const content = (
      <>
        <View style={[styles.infoIcon, { backgroundColor: colors.soft }]}>
          <Ionicons name={item.icon} size={17} color={colors.text} />
        </View>

        <View style={styles.infoContent}>
          <Text style={[typography.label, { color: colors.mutedText }]}>{item.label}</Text>
          <Text style={[typography.body, { color: item.link ? colors.primary : colors.text }]} numberOfLines={item.link ? 2 : undefined}>
            {item.value}
          </Text>
        </View>

        {item.link ? <Ionicons name="open-outline" size={16} color={colors.mutedText} /> : null}
      </>
  );

  if (!item.link) return <View style={styles.infoRow}>{content}</View>;

  return (
      <Pressable
          accessibilityRole="link"
          onPress={() => openUrl(item.value)}
          style={({ pressed }) => [styles.infoRow, pressed && { backgroundColor: colors.soft }]}
      >
        {content}
      </Pressable>
  );
}
