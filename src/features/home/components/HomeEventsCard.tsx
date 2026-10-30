import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { formatEventDate } from '@/src/features/events/utils';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { EventSummary } from '@/src/types/events';

type HomeEventsCardProps = {
  events: EventSummary[];
  loading: boolean;
  error: string | null;
  onOpenAll: () => void;
  onOpenEvent: (event: EventSummary) => void;
};

export function HomeEventsCard({
  events,
  loading,
  error,
  onOpenAll,
  onOpenEvent,
}: HomeEventsCardProps) {
  const { colors } = useTheme();
  const { t, language } = useI18n();

  const hasEvents = !loading && !error && events.length > 0;

  return (
      <Card style={styles.card}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View
              style={[
                styles.iconBubble,
                { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder },
              ]}
          >
            <Ionicons name="calendar" size={18} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {t('home.upcomingEvents')}
          </Text>

          {hasEvents ? (
              <View
                  style={[
                    styles.countPill,
                    { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder },
                  ]}
              >
                <Text style={[styles.countText, { color: colors.primary }]}>{events.length}</Text>
              </View>
          ) : null}
        </View>

        {loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={colors.primary} />
            </View>
        ) : null}

        {!loading && error ? (
            <View style={styles.stateBox}>
              <Text style={[styles.message, { color: colors.destructive }]}>{error}</Text>
            </View>
        ) : null}

        {!loading && !error && events.length === 0 ? (
            <View style={styles.stateBox}>
              <Ionicons name="calendar-clear-outline" size={22} color={colors.mutedText} />
              <Text style={[styles.message, { color: colors.mutedText }]}>
                {t('home.eventsEmpty')}
              </Text>
            </View>
        ) : null}

        {hasEvents
            ? events.map((event, index) => {
              const dateLabel = formatEventDate(event, language);

              return (
                  <Pressable
                      key={event.id}
                      onPress={() => onOpenEvent(event)}
                      style={({ pressed }) => [
                        styles.row,
                        index > 0 && {
                          borderTopWidth: StyleSheet.hairlineWidth,
                          borderTopColor: colors.border,
                        },
                        pressed && { backgroundColor: colors.primarySoft },
                      ]}
                  >
                    {event.imageUrl ? (
                        <Image source={{ uri: event.imageUrl }} style={styles.thumb} resizeMode="cover" />
                    ) : (
                        <View
                            style={[
                              styles.thumb,
                              styles.thumbPlaceholder,
                              { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder },
                            ]}
                        >
                          <Ionicons name="musical-notes-outline" size={22} color={colors.primary} />
                        </View>
                    )}

                    <View style={styles.rowBody}>
                      <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
                        {event.title}
                      </Text>

                      {dateLabel ? (
                          <View style={styles.dateRow}>
                            <Ionicons name="time-outline" size={13} color={colors.mutedText} />
                            <Text style={[styles.rowDate, { color: colors.mutedText }]} numberOfLines={1}>
                              {dateLabel}
                            </Text>
                          </View>
                      ) : null}
                    </View>

                    <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
                  </Pressable>
              );
            })
            : null}

        <Pressable
            onPress={onOpenAll}
            style={({ pressed }) => [
              styles.footer,
              { borderTopColor: colors.border },
              pressed && { backgroundColor: colors.primarySoft },
            ]}
        >
          <Text style={[styles.footerText, { color: colors.primary }]}>{t('common.viewAll')}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </Pressable>
      </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  countPill: {
    minWidth: 28,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
  },
  stateBox: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  thumbPlaceholder: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rowDate: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
  },
});
