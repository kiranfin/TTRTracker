import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { eventsApi } from '@/src/api/events';
import { useI18n } from '@/src/i18n/I18nProvider';
import type { EventDetail } from '@/src/types/events';
import { formatEventDayLabel, formatEventTimeRange } from '../utils';
import { describeApiError } from '@/src/utils/apiErrors';

export function useEventDetail() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = String(params.id ?? '').trim();
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
      setEvent(await eventsApi.detail(id));
    } catch (loadError) {
      setEvent(null);
      setError(describeApiError(loadError, t, 'events.loadError'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  // Reservierung und U18-Formular liegen auf der Palazzo-Seite, die öffnet der Browser.
  function openUrl(url: string | null | undefined) {
    if (!url) return;
    Linking.openURL(url).catch(() => undefined);
  }

  return {
    event,
    loading,
    error,
    reload: load,
    dayLabel: event ? formatEventDayLabel(event, language) : '',
    timeLabel: event ? formatEventTimeRange(event) : null,
    openReservation: () => openUrl(event?.reservationUrl),
    openU18Form: () => openUrl(event?.u18Url),
  };
}
