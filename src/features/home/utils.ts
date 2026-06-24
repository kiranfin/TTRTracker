import { ttApi } from '@/src/api/tttracker';
import type { TranslationKey } from '@/src/i18n';
import type { NormalizedTtrHistoryEvent, ScheduleMatch } from '@/src/types/tttracker';
import { normalizeSchedule } from '@/src/utils/normalizers';
import type { ClubReference, RichObject, HomeClubMatch } from './types';

export const TEAM_HOME_KEYS = [
  'team_home',
  'teamHome',
  'home_team',
  'homeTeam',
  'home',
  'home_name',
  'teamHomeName',
  'team_home_name',
];

export const TEAM_AWAY_KEYS = [
  'team_away',
  'teamAway',
  'away_team',
  'awayTeam',
  'away',
  'away_name',
  'teamAwayName',
  'team_away_name',
];

export const MEETING_ID_KEYS = [
  'meeting_id',
  'meetingId',
  'meeting',
  'id',
  'game_id',
  'gameId',
  'match_id',
  'matchId',
];

export const MEETING_DATE_KEYS = [
  'date',
  'meeting_date',
  'meetingDate',
  'start_date',
  'startDate',
  'datetime',
  'date_time',
  'dateTime',
  'start_time',
  'startTime',
];

export const statusLabelKeys = {
  completed: 'status.completed',
  live: 'status.live',
  free: 'status.free',
  postponed: 'status.postponed',
  scheduled: 'status.scheduled',
} as const satisfies Record<ScheduleMatch['status'], TranslationKey>;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getPlayerHistoryData(response: unknown) {
  if (isRecord(response) && isRecord(response.data)) {
    return response.data;
  }

  if (isRecord(response)) {
    return response;
  }

  return null;
}

export function parseOptionalNumber(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value !== 'string') return undefined;

  const cleaned = value.trim().replace(/[^\d,.-]/g, '');

  if (!cleaned) return undefined;

  const normalized =
      cleaned.includes(',') && cleaned.includes('.')
          ? cleaned.replace(/\./g, '').replace(',', '.')
          : cleaned.includes(',') && !cleaned.includes('.')
              ? cleaned.replace(',', '.')
              : /^\d{1,3}(\.\d{3})+$/.test(cleaned)
                  ? cleaned.replace(/\./g, '')
                  : cleaned;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function formatOptionalNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '—';
}

export function formatSignedNumber(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value > 0 ? `+${value}` : String(value);
}

export function getEventTtr(event: NormalizedTtrHistoryEvent) {
  return event.ttrAfter ?? event.ttr;
}

export function formatPersonName(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) return '';

  if (trimmed.includes(',')) {
    const [lastName, ...firstNameParts] = trimmed.split(',');
    const firstName = firstNameParts.join(',').trim();
    const lastNameClean = lastName.trim();

    if (firstName && lastNameClean) {
      return `${firstName} ${lastNameClean}`;
    }
  }

  return trimmed;
}

export function getFirstName(value?: string | null) {
  const formatted = formatPersonName(value);

  if (!formatted) return '';

  return formatted.split(/\s+/)[0] ?? '';
}

export async function findClubReferencesByName(clubName: string) {
  const results = await ttApi.searchClubs(clubName);
  return resolveClubReferences(results as unknown[], clubName);
}

export function resolveClubReferences(results: unknown[], clubName: string): ClubReference[] {
  const candidates = results
      .map((result) => normalizeClubSearchResult(result))
      .filter((result): result is ClubReference => Boolean(result));

  const targetName = normalizeComparableText(clubName);

  return [...candidates].sort((left, right) => {
    const leftScore = getClubNameScore(left.title, targetName);
    const rightScore = getClubNameScore(right.title, targetName);

    if (leftScore !== rightScore) {
      return leftScore - rightScore;
    }

    return `${left.organization}-${left.clubNumber}`.localeCompare(
        `${right.organization}-${right.clubNumber}`,
    );
  });
}

export function normalizeClubSearchResult(value: unknown): ClubReference | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as RichObject;

  const title = pickString(raw, [
    'title',
    'name',
    'clubName',
    'club_name',
    'displayName',
    'display_name',
    'label',
  ]);

  const directOrganization = pickString(raw, [
    'organization',
    'association',
    'fedNickname',
    'fed_nickname',
    'federation',
    'verband',
  ]);

  const directClubNumber = pickString(raw, [
    'clubNumber',
    'club_number',
    'clubnr',
    'clubNr',
    'clubNo',
    'club_no',
    'number',
    'clubId',
    'club_id',
  ]);

  const compositeValues = [
    pickString(raw, ['id', 'key', 'clubKey', 'value']),
    pickString(raw, ['url', 'href', 'link']),
  ].filter(Boolean) as string[];

  const composite = compositeValues
      .map(extractOrganizationAndClubNumber)
      .find((entry) => entry?.organization && entry.clubNumber);

  const organization = directOrganization ?? composite?.organization;
  const clubNumber = extractClubNumber(directClubNumber) ?? composite?.clubNumber;

  if (!organization || !clubNumber) {
    return null;
  }

  return {
    organization,
    clubNumber,
    title,
    state: pickString(raw, ['state', 'bundesland', 'region']),
    clubSlug: pickString(raw, ['clubSlug', 'club_slug', 'slug']),
  };
}

export function getClubNameScore(value: string | undefined, targetName: string) {
  const normalized = normalizeComparableText(value);

  if (!normalized) return 10;
  if (normalized === targetName) return 0;
  if (normalized.includes(targetName)) return 1;
  if (targetName.includes(normalized)) return 2;

  return 5;
}

export function extractOrganizationAndClubNumber(value?: string) {
  const raw = String(value ?? '');
  const match = raw.match(/\b([A-ZÄÖÜ]{2,8})[:/_-](\d{4,})\b/i);

  if (!match) {
    return null;
  }

  return {
    organization: match[1].toUpperCase(),
    clubNumber: match[2],
  };
}

export function extractClubNumber(value?: string) {
  const raw = String(value ?? '').trim();

  if (!raw) return undefined;

  const exact = raw.match(/^\d{4,}$/);
  if (exact) return raw;

  const match = raw.match(/\b\d{4,}\b/);
  return match?.[0];
}

export function normalizeHomeClubSchedule(response: unknown) {
  const customMatches = normalizeClubScheduleResponse(response);
  const fallbackMatches = (normalizeSchedule(response) as HomeClubMatch[]).map((match) => ({
    ...match,
  }));

  return dedupeSchedule([...customMatches, ...fallbackMatches]);
}

export function normalizeClubScheduleResponse(response: unknown) {
  const meetings = collectClubMeetings(response);

  return meetings
      .map((meeting, index) => normalizeClubScheduleMeeting(meeting, index))
      .filter((match): match is HomeClubMatch => Boolean(match));
}

export function collectClubMeetings(value: unknown): unknown[] {
  const result: unknown[] = [];
  collectClubMeetingsInto(value, result);

  const seen = new Set<string>();

  return result.filter((item) => {
    const key = JSON.stringify(item);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function collectClubMeetingsInto(value: unknown, result: unknown[], depth = 0) {
  if (depth > 10 || value === null || value === undefined) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectClubMeetingsInto(item, result, depth + 1);
    }

    return;
  }

  if (typeof value !== 'object') {
    return;
  }

  const object = value as RichObject;

  if (looksLikeClubMeeting(object)) {
    result.push(object);
    return;
  }

  for (const key of ['meetings', 'matches', 'rows', 'items', 'data', 'meetings_by_date', 'meetingsByDate']) {
    if (key in object) {
      collectClubMeetingsInto(object[key], result, depth + 1);
    }
  }

  for (const nestedValue of Object.values(object)) {
    collectClubMeetingsInto(nestedValue, result, depth + 1);
  }
}

export function looksLikeClubMeeting(row: RichObject) {
  const hasHomeTeam = Boolean(pickDeepString(row, TEAM_HOME_KEYS));
  const hasAwayTeam = Boolean(pickDeepString(row, TEAM_AWAY_KEYS));
  const hasAnyTeam = hasHomeTeam || hasAwayTeam;
  const hasId = Boolean(pickDeepString(row, MEETING_ID_KEYS));
  const hasDate = Boolean(pickDeepString(row, MEETING_DATE_KEYS));
  const hasStatus = Boolean(pickDeepString(row, ['state', 'status', 'meeting_state', 'meetingState']));

  return Boolean((hasAnyTeam && (hasDate || hasId || hasStatus)) || (hasId && hasDate));
}

export function normalizeClubScheduleMeeting(value: unknown, index: number): HomeClubMatch | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as RichObject;

  const homeTeam = pickDeepString(raw, TEAM_HOME_KEYS) ?? 'Heim';
  const awayTeam = pickDeepString(raw, TEAM_AWAY_KEYS) ?? 'Gast';
  const id = pickDeepString(raw, MEETING_ID_KEYS);
  const date = pickDeepString(raw, MEETING_DATE_KEYS) ?? undefined;

  const time =
      pickDeepString(raw, ['time', 'start_time_label', 'startTimeLabel', 'start_time', 'startTime']) ??
      extractTimeFromDateValue(date);

  const homeScore = pickDeepString(raw, [
    'matches_won',
    'matchesWon',
    'home_score',
    'homeScore',
    'score_home',
    'scoreHome',
    'sets_home',
  ]);

  const awayScore = pickDeepString(raw, [
    'matches_lost',
    'matchesLost',
    'away_score',
    'awayScore',
    'score_away',
    'scoreAway',
    'sets_away',
  ]);

  const leagueName = pickDeepString(raw, [
    'league_name',
    'leagueName',
    'league',
    'group_name',
    'groupName',
    'class_name',
    'className',
  ]);

  const roundName = pickDeepString(raw, [
    'round_name',
    'roundName',
    'round',
    'game_day',
    'gameDay',
    'match_day',
    'matchDay',
  ]);

  const meetingNumber = pickDeepString(raw, [
    'meeting_number',
    'meetingNumber',
    'match_number',
    'matchNumber',
    'number',
  ]);

  const rawStatus = pickDeepString(raw, ['state', 'status', 'meeting_state', 'meetingState']);
  const status = normalizeClubMeetingStatus(rawStatus, homeScore, awayScore);

  return {
    id: id ?? `${date ?? 'no-date'}-${homeTeam}-${awayTeam}-${index}`,
    date,
    time,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    status,
    leagueName,
    roundName,
    meetingNumber,
  } as HomeClubMatch;
}

export function normalizeClubMeetingStatus(
    rawStatus?: string,
    homeScore?: string,
    awayScore?: string,
): ScheduleMatch['status'] {
  const normalized = String(rawStatus ?? '').trim().toLowerCase();

  if (normalized.includes('spielfrei') || normalized.includes('frei')) {
    return 'free';
  }

  if (
      normalized.includes('beendet') ||
      normalized.includes('gespielt') ||
      normalized.includes('completed') ||
      normalized.includes('done') ||
      (homeScore !== undefined && awayScore !== undefined)
  ) {
    return 'completed';
  }

  return 'scheduled';
}

export function isCompletedClubMatch(match: HomeClubMatch) {
  if (match.status === 'completed') return true;
  if (match.status === 'free') return false;

  return match.homeScore !== undefined && match.awayScore !== undefined;
}

export function dedupeSchedule(matches: HomeClubMatch[]) {
  const seen = new Set<string>();
  const result: HomeClubMatch[] = [];

  for (const match of matches) {
    const key = getScheduleMatchKey(match);

    if (seen.has(key)) continue;

    seen.add(key);
    result.push(match);
  }

  return result;
}

export function getScheduleMatchKey(match: HomeClubMatch) {
  return (
      [
        match.id,
        match.date,
        match.time,
        normalizeTeamKey(match.homeTeam),
        normalizeTeamKey(match.awayTeam),
        match.homeScore,
        match.awayScore,
      ]
          .filter((value) => value !== undefined && value !== null && value !== '')
          .join('|') || Math.random().toString(36)
  );
}

export function compareMatchesNewestFirst(left: HomeClubMatch, right: HomeClubMatch) {
  const leftDate = parseMatchDate(left.date)?.getTime() ?? 0;
  const rightDate = parseMatchDate(right.date)?.getTime() ?? 0;

  if (leftDate !== rightDate) return rightDate - leftDate;

  return getTimeValue(right.time) - getTimeValue(left.time);
}

export function getCurrentBackendSeason() {
  const now = new Date();
  const fullYear = now.getFullYear();
  const month = now.getMonth() + 1;
  const startYear = month >= 7 ? fullYear : fullYear - 1;
  const endYear = startYear + 1;

  return `${String(startYear).slice(-2)}--${String(endYear).slice(-2)}`;
}

export function getDefaultSeasonDateRange(season: string) {
  const match = season.match(/^(\d{2})--(\d{2})$/);

  if (!match) {
    return {
      dateStart: '',
      dateEnd: '',
    };
  }

  return {
    dateStart: `20${match[1]}-07-01`,
    dateEnd: `20${match[2]}-06-30`,
  };
}

export function pickDeepString(row: RichObject, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (value === undefined || value === null || value === '') {
      continue;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      const nested = value as RichObject;
      const nestedValue = pickString(nested, [
        'name',
        'team_name',
        'teamName',
        'label',
        'title',
        'display_name',
        'displayName',
        'value',
      ]);

      if (nestedValue !== undefined) {
        return nestedValue;
      }
    }
  }

  return undefined;
}

export function pickString(row: RichObject, keys: string[]) {
  for (const key of keys) {
    const value = valueToString(row[key]);
    if (value !== undefined) return value;
  }

  return undefined;
}

export function valueToString(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;
  return String(value);
}

export function extractTimeFromDateValue(value?: string) {
  const raw = String(value ?? '').trim();

  const isoTime = raw.match(/T(\d{2}):(\d{2})/);
  if (isoTime) {
    return `${isoTime[1]}:${isoTime[2]}`;
  }

  const plainTime = raw.match(/\b(\d{1,2}):(\d{2})\b/);
  if (plainTime) {
    return `${plainTime[1].padStart(2, '0')}:${plainTime[2]}`;
  }

  return undefined;
}

export function parseMatchDate(value?: string) {
  const raw = String(value ?? '').trim();
  if (!raw) return undefined;

  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return startOfDay(
        new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])),
    );
  }

  const germanMatch = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
  if (germanMatch) {
    const year =
        germanMatch[3].length === 2 ? 2000 + Number(germanMatch[3]) : Number(germanMatch[3]);

    return startOfDay(new Date(year, Number(germanMatch[2]) - 1, Number(germanMatch[1])));
  }

  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? undefined : startOfDay(fallback);
}

export function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function getTimeValue(value?: string) {
  const raw = String(value ?? '').trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})/);

  if (!match) {
    return 0;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

export function normalizeTeamKey(teamName?: string) {
  return (teamName ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function normalizeComparableText(value?: string) {
  return String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
      .replace(/\s+/g, ' ');
}
