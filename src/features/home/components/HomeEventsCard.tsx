import { ActivityIndicator, Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { ListGroup } from '@/src/components/ListGroup';
import { SectionHeader } from '@/src/components/SectionHeader';
import { EventRow } from '@/src/features/events/components';
import { formatEventDate } from '@/src/features/events/utils';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import type { EventSummary } from '@/src/types/events';
import { styles } from '../styles';

type HomeEventsCardProps = {
  events: EventSummary[];
  loading: boolean;
  error: string | null;
  onOpenAll: () => void;
  onOpenEvent: (event: EventSummary) => void;
};

// Eventbereich auf der Startseite: die Events der nächsten drei Tage, aufgebaut wie der Vereinsbereich.
export function HomeEventsCard({
                                 events,
                                 loading,
                                 error,
                                 onOpenAll,
                                 onOpenEvent,
                               }: HomeEventsCardProps) {
  const { colors } = useTheme();
  const { t, language } = useI18n();

  return (
      <View style={styles.section}>
        <SectionHeader title={t('home.upcomingEvents')} actionLabel={t('common.viewAll')} onActionPress={onOpenAll} />

        {loading ? (
            <Card style={styles.clubMessage}>
              <ActivityIndicator color={colors.primary} />
            </Card>
        ) : error ? (
            <Card style={styles.clubMessage}>
              <Text style={[typography.body, { color: colors.destructive }]}>{error}</Text>
            </Card>
        ) : events.length === 0 ? (
            <Card style={styles.clubMessage}>
              <Text style={[typography.body, { color: colors.mutedText }]}>{t('home.eventsEmpty')}</Text>
            </Card>
        ) : (
            <ListGroup>
              {events.map((event) => (
                  <EventRow
                      key={event.id}
                      event={event}
                      subtitle={formatEventDate(event, language)}
                      onPress={() => onOpenEvent(event)}
                  />
              ))}
            </ListGroup>
        )}
      </View>
  );
}
