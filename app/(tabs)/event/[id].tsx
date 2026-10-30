import { Ionicons } from '@expo/vector-icons';
import { Image, ScrollView, Text, View } from 'react-native';
import { ActionButton } from '@/src/components/ActionButton';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { ListGroup } from '@/src/components/ListGroup';
import { ListRow } from '@/src/components/ListRow';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SectionHeader } from '@/src/components/SectionHeader';
import { SkeletonList } from '@/src/components/SkeletonRow';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import { useEventDetail } from '../../../src/features/events/hooks/useEventDetail';
import { styles } from '../../../src/features/events/styles';

function IconTile({ icon }: { icon: keyof typeof Ionicons.glyphMap }) {
  const { colors } = useTheme();

  return (
      <View style={[styles.iconTile, { backgroundColor: colors.soft }]}>
        <Ionicons name={icon} size={18} color={colors.text} />
      </View>
  );
}

export default function EventDetailScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { event, loading, error, reload, dayLabel, timeLabel, openReservation, openU18Form } = useEventDetail();

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ScreenHeader title={t('events.title')} />

          {loading ? <SkeletonList count={3} avatar={false} /> : null}

          {!loading && error ? (
              <Card style={styles.messageCard}>
                <Text style={[typography.body, { color: colors.destructive }]}>{error}</Text>
                <Button variant="secondary" icon="refresh-outline" onPress={reload}>
                  {t('common.retry')}
                </Button>
              </Card>
          ) : null}

          {!loading && !error && !event ? (
              <EmptyState icon="calendar-outline" title={t('events.empty')} />
          ) : null}

          {!loading && !error && event ? (
              <>
                <View style={styles.hero}>
                  {event.imageUrl ? (
                      <Image
                          source={{ uri: event.imageUrl }}
                          style={[styles.heroImage, { backgroundColor: colors.soft }]}
                          resizeMode="cover"
                      />
                  ) : null}

                  <Text style={[typography.heading, { color: colors.text }]}>{event.title}</Text>
                </View>

                {dayLabel || timeLabel ? (
                    <ListGroup>
                      {dayLabel ? <ListRow leading={<IconTile icon="calendar-outline" />} title={dayLabel} /> : null}
                      {timeLabel ? <ListRow leading={<IconTile icon="time-outline" />} title={timeLabel} /> : null}
                    </ListGroup>
                ) : null}

                {event.reservationUrl || event.u18Url ? (
                    <View style={styles.actionRow}>
                      {event.reservationUrl ? (
                          <ActionButton
                              icon="wine-outline"
                              label={t('events.reserve')}
                              variant="primary"
                              layout="inline"
                              onPress={openReservation}
                          />
                      ) : null}
                      {event.u18Url ? (
                          <ActionButton
                              icon="document-text-outline"
                              label={t('events.u18')}
                              layout="inline"
                              onPress={openU18Form}
                          />
                      ) : null}
                    </View>
                ) : null}

                {event.prices.length > 0 ? (
                    <View style={styles.section}>
                      <SectionHeader variant="label" title={t('events.pricesTitle')} />
                      <ListGroup>
                        {event.prices.map((price, index) => (
                            <ListRow
                                key={`${price.label}-${index}`}
                                title={price.label}
                                trailing={
                                  <Text style={[numeric.row, styles.priceValue, { color: colors.text }]} numberOfLines={2}>
                                    {price.value}
                                  </Text>
                                }
                            />
                        ))}
                      </ListGroup>
                    </View>
                ) : null}

                {event.description ? (
                    <View style={styles.section}>
                      <SectionHeader variant="label" title={t('events.descriptionTitle')} />
                      <Card style={styles.descriptionCard}>
                        <Text style={[typography.body, { color: colors.text }]}>{event.description}</Text>
                      </Card>
                    </View>
                ) : null}
              </>
          ) : null}
        </ScrollView>
      </Screen>
  );
}
