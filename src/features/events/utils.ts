import type { AppLanguage } from '../../i18n';
import type { EventSummary } from '../../types/events';

/** Source timezone of the scraped event times (dancing-park.de is in Germany). */
const SOURCE_TIME_ZONE = 'Europe/Berlin';

const WEEKDAY_NAMES: Record<AppLanguage, string[]> = {
  de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

const SHORT_WEEKDAY_NAMES: Record<AppLanguage, string[]> = {
  de: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

const SHORT_MONTH_NAMES: Record<AppLanguage, string[]> = {
  de: [
    'Jan', 'Feb', 'März', 'Apr', 'Mai', 'Jun',
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
  ],
  en: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ],
};

function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

/**
 * Parses a "YYYY-MM-DD" string into a local Date at midnight,
 * or `null` when the value is missing or malformed.
 */
function parseEventDate(date: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function parseTime(time: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

/**
 * Returns how far ahead the given timezone's wall-clock is from UTC at `instant`,
 * in milliseconds (e.g. +7200000 for Europe/Berlin in summer). `null` when the
 * runtime cannot resolve the timezone.
 */
function timeZoneOffsetMs(instant: Date, timeZone: string): number | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(instant);

    const map: Record<string, number> = {};
    for (const part of parts) {
      if (part.type !== 'literal') {
        map[part.type] = Number(part.value);
      }
    }

    const asUtc = Date.UTC(map.year, map.month - 1, map.day, map.hour, map.minute, map.second);
    return asUtc - instant.getTime();
  } catch {
    return null;
  }
}

/**
 * Interprets the given wall-clock components as a time in {@link SOURCE_TIME_ZONE}
 * and returns the corresponding absolute instant (a `Date`, whose local getters
 * then yield the device-local time). `null` when the timezone can't be resolved.
 */
function sourceWallTimeToInstant(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
): Date | null {
  const guess = Date.UTC(year, month - 1, day, hour, minute);

  const firstOffset = timeZoneOffsetMs(new Date(guess), SOURCE_TIME_ZONE);
  if (firstOffset === null) return null;

  let instant = new Date(guess - firstOffset);

  // Re-check around DST boundaries where the offset differs at the resolved instant.
  const secondOffset = timeZoneOffsetMs(instant, SOURCE_TIME_ZONE);
  if (secondOffset !== null && secondOffset !== firstOffset) {
    instant = new Date(guess - secondOffset);
  }

  return instant;
}

/** The event's start moment as an absolute instant, or `null` when unavailable. */
function getEventStartInstant(event: EventSummary): Date | null {
  const date = parseEventDate(event.date);
  if (!date) return null;

  const time = event.startTime ? parseTime(event.startTime) : { hour: 0, minute: 0 };
  if (!time) return null;

  return sourceWallTimeToInstant(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      time.hour,
      time.minute,
  );
}

/** The event's end moment as an absolute instant, or `null` when unavailable. */
function getEventEndInstant(event: EventSummary): Date | null {
  const date = parseEventDate(event.date);
  if (!date || !event.endTime) return null;

  const time = parseTime(event.endTime);
  if (!time) return null;

  const endDate = new Date(date);
  if (event.endsNextDay) {
    endDate.setDate(endDate.getDate() + 1);
  }

  return sourceWallTimeToInstant(
      endDate.getFullYear(),
      endDate.getMonth() + 1,
      endDate.getDate(),
      time.hour,
      time.minute,
  );
}

function formatLocalTime(instant: Date): string {
  return `${pad2(instant.getHours())}:${pad2(instant.getMinutes())}`;
}

function localDayDiff(from: Date, to: Date): number {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

type LocalTimeWindow = { start: string | null; end: string | null; plusDays: number };

/**
 * Resolves the event's start/end to device-local time strings. Falls back to the
 * raw venue strings when timezone conversion is unavailable at runtime.
 */
function getLocalTimeWindow(event: EventSummary): LocalTimeWindow {
  const startInstant = getEventStartInstant(event);
  const endInstant = getEventEndInstant(event);

  if (startInstant || endInstant) {
    const start = event.startTime && startInstant ? formatLocalTime(startInstant) : null;
    const end = event.endTime && endInstant ? formatLocalTime(endInstant) : null;

    let plusDays = event.endsNextDay ? 1 : 0;
    if (startInstant && endInstant) {
      plusDays = Math.max(0, localDayDiff(startInstant, endInstant));
    }

    return { start, end, plusDays };
  }

  // Fallback: show the raw venue strings unchanged.
  return {
    start: event.startTime?.trim() || null,
    end: event.endTime?.trim() || null,
    plusDays: event.endsNextDay ? 1 : 0,
  };
}

/**
 * The local calendar day the event starts on. Uses the converted start instant
 * when a start time exists, otherwise the raw calendar date.
 */
function getEventLocalDay(event: EventSummary): Date | null {
  const startInstant = event.startTime ? getEventStartInstant(event) : null;
  if (startInstant) {
    return new Date(startInstant.getFullYear(), startInstant.getMonth(), startInstant.getDate());
  }
  return parseEventDate(event.date);
}

/**
 * Compact date/time line, e.g. "Sa, 29.08.2026 · 21:30–05:00 +1". Times are
 * converted to the device's local timezone. Falls back to `rawDateText` when
 * the structured `date` is missing.
 */
export function formatEventDate(event: EventSummary, language: AppLanguage): string {
  const day = getEventLocalDay(event);

  if (!day) {
    return event.rawDateText?.trim() || '';
  }

  const shortWeekday = SHORT_WEEKDAY_NAMES[language][day.getDay()];
  const dateNumeric = language === 'de'
      ? `${pad2(day.getDate())}.${pad2(day.getMonth() + 1)}.${day.getFullYear()}`
      : `${pad2(day.getMonth() + 1)}/${pad2(day.getDate())}/${day.getFullYear()}`;
  const datePart = `${shortWeekday}, ${dateNumeric}`;

  const { start, end } = getLocalTimeWindow(event);

  let timePart = '';
  if (start && end) {
    timePart = `${start}–${end}`;
  } else if (start) {
    timePart = start;
  } else if (end) {
    timePart = `–${end}`;
  }

  return timePart ? `${datePart} · ${timePart}` : datePart;
}

/**
 * Localized weekday + long date in the device's local timezone.
 * Example (de): "Samstag, 29. August 2026". Falls back to `rawDateText`.
 */
export function formatEventDayLabel(event: EventSummary, language: AppLanguage): string {
  const day = getEventLocalDay(event);

  if (!day) {
    return event.rawDateText?.trim() || '';
  }

  const weekday = WEEKDAY_NAMES[language][day.getDay()];
  const dayOfMonth = day.getDate();
  const month = SHORT_MONTH_NAMES[language][day.getMonth()];
  const year = day.getFullYear();

  return language === 'de'
      ? `${weekday}, ${dayOfMonth}. ${month} ${year}`
      : `${weekday}, ${month} ${dayOfMonth}, ${year}`;
}

/**
 * Formats the event's time window in device-local time, e.g. "21:30 – 05:00 (+1)".
 * Returns `null` when no times are available.
 */
export function formatEventTimeRange(event: EventSummary): string | null {
  const { start, end } = getLocalTimeWindow(event);

  if (start && end) {
    return `${start} – ${end}`;
  }

  if (start) {
    return start;
  }

  if (end) {
    return `– ${end}`;
  }

  return null;
}

export type EventDayGroup = {
  key: string;
  label: string;
  events: EventSummary[];
};

/**
 * Groups events by their local calendar day, sorted ascending. Each day becomes
 * one group labelled via {@link formatEventDayLabel}; events without a parseable
 * `date` are appended as individual groups labelled by their `rawDateText`.
 */
export function groupEventsByDay(events: EventSummary[], language: AppLanguage): EventDayGroup[] {
  const dated = events.filter((event) => getEventLocalDay(event) !== null);
  const undated = events.filter((event) => getEventLocalDay(event) === null);

  const withKey = dated.map((event) => {
    const day = getEventLocalDay(event)!;
    return {
      event,
      key: `${day.getFullYear()}-${pad2(day.getMonth() + 1)}-${pad2(day.getDate())}`,
      sortValue: day.getTime(),
    };
  });

  withKey.sort((left, right) => left.sortValue - right.sortValue);

  const groups: EventDayGroup[] = [];
  const indexByKey = new Map<string, number>();

  for (const { event, key } of withKey) {
    let index = indexByKey.get(key);

    if (index === undefined) {
      index = groups.length;
      indexByKey.set(key, index);
      groups.push({ key, label: formatEventDayLabel(event, language), events: [] });
    }

    groups[index].events.push(event);
  }

  undated.forEach((event, index) => {
    groups.push({
      key: `undated-${index}`,
      label: event.rawDateText?.trim() || '',
      events: [event],
    });
  });

  return groups;
}

/**
 * Returns the events happening from today through the next `days` days
 * (inclusive), sorted by date ascending. Events without a parseable
 * `date` are skipped.
 */
export function getUpcomingEvents(events: EventSummary[], days = 3): EventSummary[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(today);
  end.setDate(end.getDate() + days);

  return events
      .filter((event) => {
        const eventDate = parseEventDate(event.date);
        return eventDate !== null && eventDate >= today && eventDate <= end;
      })
      .sort((left, right) => left.date.localeCompare(right.date));
}
