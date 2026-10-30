import { useCallback, useEffect, useState } from 'react';
import { eventsApi } from '../../../api/events';
import { useI18n } from '../../../i18n/I18nProvider';
import type { EventSummary } from '../../../types/events';

export function useEvents() {
  const { t } = useI18n();

  const [data, setData] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await eventsApi.list();
      setData(result);
    } catch (loadError) {
      setData([]);
      setError(loadError instanceof Error ? loadError.message : t('events.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    reload().catch(() => undefined);
  }, [reload]);

  return { data, loading, error, reload };
}
