export type EventPrice = { label: string; value: string };

export type EventSummary = {
  id: string;
  title: string;
  date: string; // "YYYY-MM-DD"
  startTime: string | null;
  endTime: string | null;
  endsNextDay: boolean;
  weekday: string | null;
  rawDateText: string;
  imageUrl: string | null;
  detailUrl: string;
  reservationUrl: string | null;
  u18Url: string | null;
};

export type EventDetail = EventSummary & {
  description: string | null;
  prices: EventPrice[];
};
