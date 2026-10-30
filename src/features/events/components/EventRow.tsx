import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, View } from 'react-native';
import { ListRow } from '@/src/components/ListRow';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { EventSummary } from '@/src/types/events';

type EventRowProps = {
  event: EventSummary;
  subtitle?: string | null;
  onPress: () => void;
};

// Event als Listenzeile: Flyer links, Titel und Datum bzw. Uhrzeit daneben.
export function EventRow({ event, subtitle, onPress }: EventRowProps) {
  const { colors } = useTheme();

  return (
      <ListRow
          leading={
            event.imageUrl ? (
                <Image source={{ uri: event.imageUrl }} style={[styles.thumb, { backgroundColor: colors.soft }]} resizeMode="cover" />
            ) : (
                <View style={[styles.thumb, styles.placeholder, { backgroundColor: colors.soft }]}>
                  <Ionicons name="musical-notes-outline" size={20} color={colors.mutedText} />
                </View>
            )
          }
          title={event.title}
          subtitle={subtitle || undefined}
          onPress={onPress}
      />
  );
}

const styles = StyleSheet.create({
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
