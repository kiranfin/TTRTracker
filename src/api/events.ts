import { apiGet } from './client';
import type { EventDetail, EventSummary } from '../types/events';

type Envelope<T> = { data: T; meta: { source: 'cache' | 'upstream' } };

export const eventsApi = {
  async list() {
    const res = await apiGet<Envelope<EventSummary[]>>('/api/events');
    return res.data;
  },
  async detail(id: string) {
    const res = await apiGet<Envelope<EventDetail>>(
        `/api/events/${encodeURIComponent(id)}`
    );
    return res.data;
  },
};
