import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, IconButton } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { EmptyState } from '../../src/components/EmptyState';
import { Screen } from '../../src/components/Screen';
import { EventCard } from '../../src/features/events/components/EventCard';
import { useEvents } from '../../src/features/events/hooks/useEvents';
import { groupEventsByDay } from '../../src/features/events/utils';
import { useI18n } from '../../src/i18n/I18nProvider';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function EventsScreen() {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const { data, loading, error, reload } = useEvents();

  const dayGroups = groupEventsByDay(data, language);

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <IconButton icon="arrow-back" onPress={() => router.back()} accessibilityLabel={t('common.back')} />
            <View style={styles.titleBlock}>
              <Text style={[styles.title, { color: colors.text }]}>{t('events.title')}</Text>
            </View>
          </View>

          {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

          {error ? (
              <Card style={styles.errorCard}>
                <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
                <Button variant="secondary" icon="refresh-outline" onPress={reload}>
                  {t('common.retry')}
                </Button>
              </Card>
          ) : null}

          {!loading && !error && data.length === 0 ? (
              <EmptyState icon="calendar-outline" title={t('events.empty')} />
          ) : null}

          {!loading && !error && data.length > 0 ? (
              <View style={styles.groups}>
                {dayGroups.map((group) => (
                    <View key={group.key} style={styles.group}>
                      <Text style={[styles.groupTitle, { color: colors.mutedText }]}>
                        {group.label}
                      </Text>

                      <View style={styles.list}>
                        {group.events.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                onPress={() =>
                                    router.push({ pathname: '/event/[id]', params: { id: event.id } })
                                }
                            />
                        ))}
                      </View>
                    </View>
                ))}
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
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '900',
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
  groups: {
    gap: 22,
  },
  group: {
    gap: 10,
  },
  groupTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  list: {
    gap: 12,
  },
});
