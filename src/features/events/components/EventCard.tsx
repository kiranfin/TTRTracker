import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../../components/Card';
import { useI18n } from '../../../i18n/I18nProvider';
import { useTheme } from '../../../theme/ThemeProvider';
import type { EventSummary } from '../../../types/events';
import { formatEventDate } from '../utils';

type EventCardProps = {
  event: EventSummary;
  onPress: () => void;
};

export function EventCard({ event, onPress }: EventCardProps) {
  const { colors } = useTheme();
  const { language } = useI18n();
  const dateLabel = formatEventDate(event, language);

  return (
      <Card pressable style={styles.card} onPress={onPress}>
        {event.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
            <View
                style={[
                  styles.image,
                  styles.placeholder,
                  { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder },
                ]}
            >
              <Ionicons name="musical-notes-outline" size={28} color={colors.primary} />
            </View>
        )}

        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {event.title}
          </Text>

          {dateLabel ? (
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.mutedText} />
                <Text style={[styles.date, { color: colors.mutedText }]} numberOfLines={1}>
                  {dateLabel}
                </Text>
              </View>
          ) : null}
        </View>

        <View style={[styles.arrowBubble, { backgroundColor: colors.primary }]}>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </View>
      </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 16,
  },
  placeholder: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  date: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },
  arrowBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
