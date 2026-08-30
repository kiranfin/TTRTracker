import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { eventsApi } from '../../../src/api/events';
import { Button, IconButton } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { Screen } from '../../../src/components/Screen';
import { formatEventDayLabel, formatEventTimeRange } from '../../../src/features/events/utils';
import { useI18n } from '../../../src/i18n/I18nProvider';
import { useTheme } from '../../../src/theme/ThemeProvider';
import type { EventDetail } from '../../../src/types/events';

export default function EventDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = String(params.id ?? '').trim();

  const { colors } = useTheme();
  const { t, language } = useI18n();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError(t('events.loadError'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await eventsApi.detail(id);
      setEvent(result);
    } catch (loadError) {
      setEvent(null);
      setError(loadError instanceof Error ? loadError.message : t('events.loadError'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const dayLabel = event ? formatEventDayLabel(event, language) : '';
  const timeLabel = event ? formatEventTimeRange(event) : null;

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <IconButton icon="arrow-back" onPress={() => router.back()} accessibilityLabel={t('common.back')} />
          </View>

          {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

          {error ? (
              <Card style={styles.errorCard}>
                <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
                <Button variant="secondary" icon="refresh-outline" onPress={load}>
                  {t('common.retry')}
                </Button>
              </Card>
          ) : null}

          {!loading && !error && !event ? (
              <EmptyState icon="calendar-outline" title={t('events.empty')} />
          ) : null}

          {!loading && !error && event ? (
              <View style={styles.body}>
                {event.imageUrl ? (
                    <Image source={{ uri: event.imageUrl }} style={styles.image} resizeMode="cover" />
                ) : null}

                <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>

                {dayLabel || timeLabel ? (
                    <View style={styles.dateTimeRow}>
                      {dayLabel ? (
                          <View style={[styles.dateTimeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={[styles.dateTimeIcon, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder }]}>
                              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                            </View>
                            <Text style={[styles.dateTimeValue, { color: colors.text }]} numberOfLines={2}>
                              {dayLabel}
                            </Text>
                          </View>
                      ) : null}

                      {timeLabel ? (
                          <View style={[styles.dateTimeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={[styles.dateTimeIcon, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder }]}>
                              <Ionicons name="time-outline" size={18} color={colors.primary} />
                            </View>
                            <Text style={[styles.dateTimeValue, { color: colors.text }]} numberOfLines={2}>
                              {timeLabel}
                            </Text>
                          </View>
                      ) : null}
                    </View>
                ) : null}

                {event.description ? (
                    <Card style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        {t('events.descriptionTitle')}
                      </Text>
                      <Text style={[styles.description, { color: colors.text }]}>
                        {event.description}
                      </Text>
                    </Card>
                ) : null}

                {event.prices.length > 0 ? (
                    <Card style={styles.section}>
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        {t('events.pricesTitle')}
                      </Text>
                      <View style={styles.priceList}>
                        {event.prices.map((price, index) => (
                            <View
                                key={`${price.label}-${index}`}
                                style={[styles.priceRow, { borderColor: colors.border }]}
                            >
                              <Text style={[styles.priceLabel, { color: colors.text }]}>
                                {price.label}
                              </Text>
                              <Text style={[styles.priceValue, { color: colors.primary }]}>
                                {price.value}
                              </Text>
                            </View>
                        ))}
                      </View>
                    </Card>
                ) : null}
              </View>
          ) : null}
        </ScrollView>
      </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 112,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loader: {
    paddingVertical: 24,
  },
  errorCard: {
    padding: 16,
    gap: 12,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  body: {
    gap: 16,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 20,
  },
  title: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '900',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  dateTimeIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTimeValue: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '900',
  },
  section: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  priceList: {
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 14,
  },
  priceLabel: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  priceValue: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
  },
});
