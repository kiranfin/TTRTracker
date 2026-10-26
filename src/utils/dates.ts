import type { AppLanguage as Language } from '../i18n';

// Akzeptiert ISO ("2026-10-18", auch mit Uhrzeit) und deutsches Format ("18.10.2026").
export function parseDateValue(value?: string | null): Date | undefined {
  if (!value) return undefined;

  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }

  const german = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (german) {
    return new Date(Number(german[3]), Number(german[2]) - 1, Number(german[1]));
  }

  const direct = new Date(value);
  return Number.isFinite(direct.getTime()) ? direct : undefined;
}

// Spieltermine kommen als UTC-Zeitstempel ("2026-10-26T19:00:00.000+00:00"). Ohne Umrechnung
// wäre die Uhrzeit 1 bis 2 Stunden zu früh und spätabends sogar der Tag falsch.
// Liefert Datum ("2026-10-26") und Uhrzeit ("20:00") in der lokalen Zeit des Geräts.
export function splitLocalDateTime(value?: string | null): { date?: string; time?: string } {
  const raw = value?.trim();
  if (!raw) return {};

  const zoned = raw.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)(Z|[+-]\d{2}:?\d{2})$/);
  if (zoned) {
    const offset = zoned[2] === 'Z' ? 'Z' : zoned[2].replace(/^([+-]\d{2})(\d{2})$/, '$1:$2');
    const parsed = new Date(`${zoned[1]}${offset}`);

    if (Number.isFinite(parsed.getTime())) {
      const pad = (part: number) => String(part).padStart(2, '0');

      return {
        date: `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`,
        time: `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`,
      };
    }
  }

  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (iso) {
    return { date: iso[1], time: iso[2] ? `${iso[2]}:${iso[3]}` : undefined };
  }

  return { date: raw };
}

function localeFor(language: Language) {
  return language === 'de' ? 'de-DE' : 'en-GB';
}

// Für den Datumsblock links in Listen: "18" und "OKT"
export function getDayMonthParts(value: string | undefined, language: Language) {
  const date = parseDateValue(value);
  if (!date) return undefined;

  const month = date
      .toLocaleDateString(localeFor(language), { month: 'short' })
      .replace('.', '')
      .slice(0, 3)
      .toUpperCase();

  return { day: String(date.getDate()).padStart(2, '0'), month };
}

// "Sa, 1. Nov" bzw. "Sat, 1 Nov", mit Uhrzeit "Sa, 1. Nov · 18:30"
export function formatShortWeekdayDate(value: string | undefined, language: Language, time?: string) {
  const date = parseDateValue(value);
  if (!date) return time ?? '';

  const locale = localeFor(language);
  const weekday = date.toLocaleDateString(locale, { weekday: 'short' }).replace('.', '');
  const month = date.toLocaleDateString(locale, { month: 'short' }).replace('.', '');
  const dayPart = language === 'de' ? `${date.getDate()}. ${month}` : `${date.getDate()} ${month}`;
  const label = `${weekday}, ${dayPart}`;

  return time ? `${label} · ${time}` : label;
}

// "Oktober 2026"
export function formatMonthYear(date: Date, language: Language) {
  return date.toLocaleDateString(localeFor(language), { month: 'long', year: 'numeric' });
}

// Tischtennis-Saisons laufen von Juli bis Juni. Im Oktober 2026 ist also "26/27" aktuell.
export function getCurrentSeason(now = new Date()) {
  const startYear = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  const short = (year: number) => String(year % 100).padStart(2, '0');

  return `${short(startYear)}/${short(startYear + 1)}`;
}

// "26/27" -> "2026/27"
export function formatSeasonLong(season: string) {
  const match = season.replace(/--/g, '/').match(/^(\d{2})\/(\d{2})$/);
  return match ? `20${match[1]}/${match[2]}` : season.replace(/--/g, '/');
}
