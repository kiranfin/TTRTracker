import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { ListGroup } from '@/src/components/ListGroup';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SectionHeader } from '@/src/components/SectionHeader';
import { SkeletonList } from '@/src/components/SkeletonRow';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { EventRow } from '../../src/features/events/components';
import { useEvents } from '../../src/features/events/hooks/useEvents';
import { styles } from '../../src/features/events/styles';
import { formatEventTimeRange, groupEventsByDay } from '../../src/features/events/utils';

export default function EventsScreen() {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const { data, loading, error, reload } = useEvents();

  const dayGroups = groupEventsByDay(data, language);

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ScreenHeader title={t('events.title')} />

          {loading ? <SkeletonList count={4} /> : null}

          {!loading && error ? (
              <Card style={styles.messageCard}>
                <Text style={[typography.body, { color: colors.destructive }]}>{error}</Text>
                <Button variant="secondary" icon="refresh-outline" onPress={reload}>
                  {t('common.retry')}
                </Button>
              </Card>
          ) : null}

          {!loading && !error && data.length === 0 ? (
              <EmptyState icon="calendar-outline" title={t('events.empty')} />
          ) : null}

          {!loading && !error
              ? dayGroups.map((group) => (
                  <View key={group.key} style={styles.section}>
                    <SectionHeader variant="label" title={group.label} />

                    <ListGroup>
                      {group.events.map((event) => (
                          <EventRow
                              key={event.id}
                              event={event}
                              subtitle={formatEventTimeRange(event)}
                              onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
                          />
                      ))}
                    </ListGroup>
                  </View>
              ))
              : null}
        </ScrollView>
      </Screen>
  );
}
