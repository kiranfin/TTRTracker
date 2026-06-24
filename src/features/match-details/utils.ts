import { useI18n } from '@/src/i18n/I18nProvider';
import type { MeetingDetails, MatchRow, RawMeetingMatch, RawPlayer } from './types';

export function normalizeMeetingRows(meeting: MeetingDetails | null, t: ReturnType<typeof useI18n>['t']): MatchRow[] {
  const matches = Array.isArray(meeting?.match) ? meeting.match : [];

  return matches.map((match, index) => {
    const type = match.game_type === 'double' ? 'double' : match.game_type === 'single' ? 'single' : 'other';

    const setsHome = toNumber(match.sets_home);
    const setsGuest = toNumber(match.sets_guest);
    const matchesHome = toNumber(match.matches_home);
    const matchesGuest = toNumber(match.matches_guest);

    const setScores = buildSetScores(match);

    const hasResult =
        setsHome !== undefined &&
        setsGuest !== undefined &&
        (setsHome !== 0 || setsGuest !== 0 || setScores.length > 0);

    const winner =
        matchesHome !== undefined && matchesGuest !== undefined && matchesHome !== matchesGuest
            ? matchesHome > matchesGuest
                ? 'home'
                : 'guest'
            : setsHome !== undefined && setsGuest !== undefined && setsHome !== setsGuest
                ? setsHome > setsGuest
                    ? 'home'
                    : 'guest'
                : null;

    const games = formatLabeledPair(t('match.balls'), match.games_home, match.games_guest);

    return {
      id: match.match_uuid ?? `${match.match_name ?? 'match'}-${index}`,
      name: match.match_name ?? t('match.matchNumber', { number: index + 1 }),
      type,
      homePlayer: formatSide([match.mm_player11, match.mm_player12], match.home_wo ? t('match.walkover') : t('match.home')),
      awayPlayer: formatSide([match.mm_player21, match.mm_player22], match.guest_wo ? t('match.walkover') : t('match.away')),
      result: hasResult ? `${setsHome}:${setsGuest}` : '-',
      sets: setScores,
      games,
      winner,
    };
  });
}

export function buildSetScores(match: RawMeetingMatch): string[] {
  const scores: string[] = [];

  for (let setNumber = 1; setNumber <= 5; setNumber += 1) {
    const home = toNumber(match[`set${setNumber}_home` as keyof RawMeetingMatch]);
    const guest = toNumber(match[`set${setNumber}_guest` as keyof RawMeetingMatch]);

    if (home === undefined || guest === undefined) continue;
    if (home === 0 && guest === 0) continue;

    scores.push(`${home}:${guest}`);
  }

  return scores;
}

export function formatSide(players: (RawPlayer | null | undefined)[], fallback: string): string {
  const names = players.map(formatPlayer).filter(Boolean);

  if (names.length === 0) {
    return fallback;
  }

  return names.join('\n');
}

export function formatPlayer(player: RawPlayer | null | undefined): string | null {
  if (!player) return null;

  const name = [player.firstname, player.lastname]
      .map((part) => (typeof part === 'string' ? part.trim() : ''))
      .filter(Boolean)
      .join(' ');

  return name.length > 0 ? name : null;
}

export function unwrapMeetingResponse(response: unknown): MeetingDetails | null {
  const root = asRecord(response);
  if (!root) return null;

  const data = asRecord(root.data);
  const candidates = [data?.data, root.data, response];

  for (const candidate of candidates) {
    const record = asRecord(candidate);

    if (!record) continue;

    const looksLikeMeeting =
        Array.isArray(record.match) ||
        typeof record.team_home === 'string' ||
        typeof record.team_guest === 'string' ||
        record.meeting_id !== undefined;

    if (looksLikeMeeting) {
      return record as MeetingDetails;
    }
  }

  return null;
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function getParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

export function formatLabeledPair(label: string, home: unknown, guest: unknown): string | null {
  const homeValue = toNumber(home);
  const guestValue = toNumber(guest);

  if (homeValue === undefined || guestValue === undefined) {
    return null;
  }

  return `${label} ${homeValue}:${guestValue}`;
}

export function formatDateTime(value: string | null | undefined): string | null {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatLocation(meeting: MeetingDetails | null): string | null {
  const location = meeting?.location;

  if (!location) {
    return null;
  }

  const hall = typeof location.label === 'string' ? location.label.trim() : '';
  const city = typeof location.city === 'string' ? location.city.trim() : '';

  return [hall, city].filter(Boolean).join(', ') || null;
}

export function formatStatus(meeting: MeetingDetails | null, t: ReturnType<typeof useI18n>['t']): string {
  if (meeting?.live) {
    return t('status.live');
  }

  if (meeting?.is_completed || meeting?.is_meeting_complete) {
    return t('match.finalScore');
  }

  if (meeting?.results_available) {
    return t('match.result');
  }

  return t('status.scheduled');
}
