import { ttApi } from '@/src/api/tttracker';
import type { TranslationKey } from '@/src/i18n';
import type { ClubTeam, ScheduleMatch } from '@/src/types/tttracker';
import { formatDate, normalizeSchedule } from '@/src/utils/normalizers';
import { isFavorite } from '@/src/storage/favorites';
import type { ClubApiWithOptionalEndpoints, ClubScheduleMatch, RichObject, ClubPlayer, ThemeColors, ScheduleDateGroup } from './types';

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

export const CLUB_FAVORITE_TYPE = 'club' as Parameters<typeof isFavorite>[0];

export const scheduleStatusLabelKeys = {
    completed: 'status.completed',
    live: 'status.live',
    free: 'status.free',
    postponed: 'status.postponed',
    scheduled: 'status.scheduled',
} as const satisfies Record<ScheduleMatch['status'], TranslationKey>;

export function matchStatusLabelKey(status: ScheduleMatch['status']) {
    return scheduleStatusLabelKeys[status];
}

export async function loadClubPlayers(
    clubApi: ClubApiWithOptionalEndpoints,
    organization: string,
    clubNumber: string,
    clubName?: string,
) {
    if (!clubApi.getClubPlayers) {
        throw new Error('Der Vereins-Spieler-Endpunkt ist in ttApi.getClubPlayers noch nicht eingebunden.');
    }

    const response = await clubApi.getClubPlayers(
        organization,
        clubNumber,
        emptyToUndefined(clubName),
    );

    return normalizeClubPlayers(response);
}

export async function loadClubSchedule(
    clubApi: ClubApiWithOptionalEndpoints,
    organization: string,
    clubNumber: string,
    teams: ClubTeam[],
    options: {
        season: string;
        dateStart?: string;
        dateEnd?: string;
    },
) {
    if (clubApi.getClubSchedule) {
        const response = await clubApi.getClubSchedule(
            organization,
            clubNumber,
            options.season,
            emptyToUndefined(options.dateStart),
            emptyToUndefined(options.dateEnd),
        );

        const teamNames = teams.map((team) => team.teamName).filter(Boolean);
        const clubMatches = normalizeClubScheduleResponse(response, teamNames);

        const fallbackMatches =
            clubMatches.length > 0
                ? clubMatches
                : (normalizeSchedule(response) as ClubScheduleMatch[]).map((match) => ({
                    ...match,
                    clubTeamName: match.clubTeamName ?? findMatchedTeamName(match, teamNames),
                }));

        return sortSchedule(
            dedupeSchedule(
                filterMatchesByDate(fallbackMatches, options.dateStart, options.dateEnd),
            ),
        );
    }

    return loadClubScheduleFromTeamLeagues(teams, options);
}

export async function loadClubScheduleFromTeamLeagues(
    teams: ClubTeam[],
    options?: {
        dateStart?: string;
        dateEnd?: string;
    },
) {
    const leagues = new Map<
        string,
        {
            association: string;
            groupId: string;
            season: string;
            leagueSlug: string;
            leagueName?: string;
            teamNames: string[];
        }
    >();

    for (const team of teams) {
        if (!team.association || !team.groupId || !team.teamName) continue;

        const season = team.season ?? '25/26';
        const leagueSlug = team.leagueSlug ?? 'x';
        const key = [team.association, season, team.groupId, leagueSlug].join('|');

        const current =
            leagues.get(key) ??
            {
                association: team.association,
                groupId: team.groupId,
                season,
                leagueSlug,
                leagueName: team.leagueName,
                teamNames: [],
            };

        if (!current.teamNames.some((name) => normalizeTeamKey(name) === normalizeTeamKey(team.teamName))) {
            current.teamNames.push(team.teamName);
        }

        leagues.set(key, current);
    }

    const results = await Promise.allSettled(
        [...leagues.values()].map(async (league) => {
            const response = await ttApi.getLeagueSchedule(
                league.association,
                league.season,
                league.groupId,
                league.leagueSlug,
            );

            return normalizeSchedule(response)
                .filter((match) => isMatchForAnyTeam(match, league.teamNames))
                .map((match) => ({
                    ...match,
                    clubTeamName: findMatchedTeamName(match, league.teamNames),
                    leagueName: league.leagueName,
                }));
        }),
    );

    const matches = results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
    return sortSchedule(dedupeSchedule(filterMatchesByDate(matches, options?.dateStart, options?.dateEnd)));
}

export function normalizeClubScheduleResponse(response: unknown, teamNames: string[]) {
    const meetings = collectClubMeetings(response);

    return meetings
        .map((meeting, index) => normalizeClubScheduleMeeting(meeting, index, teamNames))
        .filter((match): match is ClubScheduleMatch => Boolean(match));
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

export function normalizeClubScheduleMeeting(
    value: unknown,
    index: number,
    teamNames: string[],
): ClubScheduleMatch | null {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const raw = value as RichObject;

    const homeTeam = pickDeepString(raw, TEAM_HOME_KEYS) ?? 'Heim';
    const awayTeam = pickDeepString(raw, TEAM_AWAY_KEYS) ?? 'Gast';

    const id = pickDeepString(raw, MEETING_ID_KEYS);

    const date =
        pickDeepString(raw, MEETING_DATE_KEYS) ??
        undefined;

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
        clubTeamName: findMatchedTeamName(
            {
                homeTeam,
                awayTeam,
            } as ScheduleMatch,
            teamNames,
        ),
    } as ClubScheduleMatch;
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

export function normalizeClubPlayers(response: unknown) {
    const array = findClubPlayersArray(response);

    return array
        .map(normalizeClubPlayer)
        .filter((player): player is ClubPlayer => Boolean(player))
        .sort(comparePlayers);
}

export function findClubPlayersArray(value: unknown): unknown[] {
    if (Array.isArray(value)) {
        return value;
    }

    if (!value || typeof value !== 'object') {
        return [];
    }

    const object = value as RichObject;
    const outerData = object.data;

    if (Array.isArray(outerData)) {
        return outerData;
    }

    if (outerData && typeof outerData === 'object') {
        const outerDataObject = outerData as RichObject;

        if (Array.isArray(outerDataObject.data)) {
            return outerDataObject.data;
        }

        if (Array.isArray(outerDataObject.players)) {
            return outerDataObject.players;
        }

        if (Array.isArray(outerDataObject.results)) {
            return outerDataObject.results;
        }
    }

    if (Array.isArray(object.players)) {
        return object.players;
    }

    if (Array.isArray(object.results)) {
        return object.results;
    }

    return findFirstArray(value);
}

export function normalizeClubPlayer(value: unknown, index: number): ClubPlayer | null {
    if (!value || typeof value !== 'object') return null;

    const raw = value as RichObject;

    const firstName = pickString(raw, ['firstname', 'first_name', 'firstName', 'givenName']);
    const lastName = pickString(raw, ['lastname', 'last_name', 'lastName', 'familyName']);

    const generatedName = [firstName, lastName].filter(Boolean).join(' ').trim();

    const name =
        pickString(raw, [
            'full_name',
            'fullName',
            'fullname',
            'name',
            'playerName',
            'player_name',
            'personName',
            'person_name',
            'displayName',
        ]) ??
        (generatedName ||
            `Spieler ${index + 1}`);

    if (!name.trim()) return null;

    const nuid = pickString(raw, [
        'nuid',
        'nuId',
        'nu_id',
        'person_id',
        'personId',
        'internal_id',
        'internalId',
    ]);

    return {
        id:
            pickString(raw, [
                'id',
                'ranking_id',
                'rankingId',
                'playerId',
                'player_id',
                'person_id',
                'personId',
            ]) ?? nuid,
        nuid,
        name,
        ttr: pickString(raw, ['ttr']),
        qttr: pickString(raw, ['qttr']),
        teamName: pickString(raw, ['teamName', 'team_name', 'team']),
        leagueName: pickString(raw, ['leagueName', 'league_name', 'league']),
        clubName: pickString(raw, ['club_name', 'clubName', 'club']),
        association: pickString(raw, ['association', 'fedNickname', 'organization', 'organization_short']),
        country: pickString(raw, ['country']),
        rank: pickString(raw, ['club_rank', 'clubRank', 'rank', 'position', 'teamRank', 'team_rank']),
        lastYearNoGame: pickString(raw, ['last_year_no_games']),
        globalRank: pickString(raw, ['global_rank', 'globalRank']),
        nationalRank: pickString(raw, ['national_rank', 'nationalRank', 'germanRank']),
        matchCount: pickString(raw, ['match_count', 'matchCount', 'few_games', 'fewGames']),
    };
}

export function hasLastYearNoGame(value?: string) {
    const normalized = String(value ?? '').trim().toLowerCase();

    return normalized.length > 0 && normalized !== 'no';
}

export function getPlayerCardAccent(colors: ThemeColors, noGameLastYear: boolean) {
    const dark = isDarkTheme(colors);

    if (noGameLastYear) {
        return dark
            ? {
                background: 'rgba(239, 68, 68, 0.14)',
                border: 'rgba(248, 113, 113, 0.58)',
                rankBackground: 'rgba(239, 68, 68, 0.22)',
                rankBorder: 'rgba(248, 113, 113, 0.78)',
                rankText: '#FCA5A5',
            }
            : {
                background: 'rgba(239, 68, 68, 0.11)',
                border: 'rgba(220, 38, 38, 0.38)',
                rankBackground: 'rgba(239, 68, 68, 0.17)',
                rankBorder: 'rgba(220, 38, 38, 0.45)',
                rankText: '#DC2626',
            };
    }

    return dark
        ? {
            background: 'rgba(255, 255, 255, 0.035)',
            border: 'rgba(255, 255, 255, 0.09)',
            rankBackground: 'rgba(255, 255, 255, 0.06)',
            rankBorder: 'rgba(255, 255, 255, 0.12)',
            rankText: '#CBD5E1',
        }
        : {
            background: colors.card,
            border: colors.border,
            rankBackground: colors.muted,
            rankBorder: colors.border,
            rankText: colors.mutedText,
        };
}

export function isDarkTheme(colors: ThemeColors) {
    return getRelativeLuminance(colors.background) < 0.45;
}

export function getRelativeLuminance(color: string) {
    const hex = color.trim();

    if (!hex.startsWith('#')) {
        return 1;
    }

    const normalized =
        hex.length === 4
            ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
            : hex;

    const red = parseInt(normalized.slice(1, 3), 16);
    const green = parseInt(normalized.slice(3, 5), 16);
    const blue = parseInt(normalized.slice(5, 7), 16);

    if ([red, green, blue].some((value) => Number.isNaN(value))) {
        return 1;
    }

    const [r, g, b] = [red, green, blue].map((value) => {
        const channel = value / 255;

        return channel <= 0.03928
            ? channel / 12.92
            : Math.pow((channel + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function filterMatchesByDate(matches: ClubScheduleMatch[], dateStart?: string, dateEnd?: string) {
    const start = parseDateInput(dateStart);
    const end = parseDateInput(dateEnd);

    if (!start && !end) {
        return matches;
    }

    return matches.filter((match) => {
        const matchDate = parseMatchDate(match.date);

        if (!matchDate) {
            return false;
        }

        if (start && matchDate < start) {
            return false;
        }

        if (end && matchDate > end) {
            return false;
        }

        return true;
    });
}

export function getInitialSeason(value?: string) {
    const normalized = normalizeBackendSeason(value);

    if (normalized) {
        return normalized;
    }

    return getCurrentBackendSeason();
}

export function normalizeBackendSeason(value?: string) {
    const raw = String(value ?? '').trim();

    if (!raw) {
        return undefined;
    }

    const slashMatch = raw.match(/^(\d{2})\/(\d{2})$/);
    if (slashMatch) {
        return `${slashMatch[1]}--${slashMatch[2]}`;
    }

    const dashMatch = raw.match(/^(\d{2})--(\d{2})$/);
    if (dashMatch) {
        return `${dashMatch[1]}--${dashMatch[2]}`;
    }

    return raw;
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

export function isValidDateInput(value?: string) {
    const raw = String(value ?? '').trim();

    if (!raw) {
        return true;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return false;
    }

    return Boolean(parseDateInput(raw));
}

export function parseDateInput(value?: string) {
    const raw = String(value ?? '').trim();
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
        return undefined;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = startOfDay(new Date(year, month - 1, day));

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return undefined;
    }

    return date;
}

export function formatDateInput(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function addMonths(date: Date, amount: number) {
    return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function buildCalendarMonthDays(monthDate: Date) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const firstWeekdayMondayBased = (firstDay.getDay() + 6) % 7;
    const days: (Date | null)[] = [];

    for (let index = 0; index < firstWeekdayMondayBased; index += 1) {
        days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        days.push(new Date(year, month, day));
    }

    while (days.length % 7 !== 0) {
        days.push(null);
    }

    return days;
}

export function getClubFavoriteIds(organization?: string, clubNumber?: string, routeClubKey?: string) {
    const ids = new Set<string>();
    const canonicalId = getClubFavoriteId(organization, clubNumber);
    const routeId = emptyToUndefined(routeClubKey);

    if (canonicalId) ids.add(canonicalId);
    if (clubNumber) ids.add(clubNumber);
    if (routeId && routeId.includes(':')) ids.add(routeId);

    return [...ids];
}

export function getClubFavoriteId(organization?: string, clubNumber?: string) {
    if (!organization || !clubNumber) return '';
    return [organization, clubNumber].filter(Boolean).join(':').trim();
}

export function parseClubKey(value?: string) {
    const raw = emptyToUndefined(value);
    if (!raw) return {} as { organization?: string; clubNumber?: string };

    const parts = raw.split(':');
    if (parts.length >= 2) {
        return {
            organization: emptyToUndefined(parts[0]),
            clubNumber: emptyToUndefined(parts[1]),
        };
    }

    return {
        clubNumber: raw,
    };
}

export function emptyToUndefined(value?: string) {
    const raw = String(value ?? '').trim();
    return raw.length > 0 ? raw : undefined;
}

export function groupScheduleByDate(matches: ClubScheduleMatch[]): ScheduleDateGroup[] {
    const groups = new Map<string, ScheduleDateGroup>();

    for (const match of sortSchedule(matches)) {
        const dateKey = getDateKey(match.date);
        const dateLabel = match.date ? formatDate(match.date) : 'Ohne Datum';

        const group =
            groups.get(dateKey) ??
            {
                dateKey,
                dateLabel,
                matches: [],
            };

        group.matches.push(match);
        groups.set(dateKey, group);
    }

    return [...groups.values()].sort((left, right) => compareDateKeys(left.dateKey, right.dateKey));
}

export function sortSchedule(matches: ClubScheduleMatch[]) {
    return [...matches].sort((left, right) => {
        const leftDate = parseMatchDate(left.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const rightDate = parseMatchDate(right.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;

        if (leftDate !== rightDate) return leftDate - rightDate;

        return getTimeValue(left.time) - getTimeValue(right.time);
    });
}

export function dedupeSchedule(matches: ClubScheduleMatch[]) {
    const seen = new Set<string>();
    const result: ClubScheduleMatch[] = [];

    for (const match of matches) {
        const key = getScheduleMatchKey(match);

        if (seen.has(key)) continue;

        seen.add(key);
        result.push(match);
    }

    return result;
}

export function getScheduleMatchKey(match: ClubScheduleMatch) {
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

export function isMatchForAnyTeam(match: ScheduleMatch, teamNames: string[]) {
    return teamNames.some((teamName) => isMatchForTeam(match, teamName));
}

export function isMatchForTeam(match: ScheduleMatch, teamName?: string) {
    const teamKey = normalizeTeamKey(teamName);
    if (!teamKey) return false;

    return normalizeTeamKey(match.homeTeam) === teamKey || normalizeTeamKey(match.awayTeam) === teamKey;
}

export function findMatchedTeamName(match: ScheduleMatch, teamNames: string[]) {
    return teamNames.find((teamName) => isMatchForTeam(match, teamName));
}

export function comparePlayers(left: ClubPlayer, right: ClubPlayer) {
    const leftTeam = left.teamName ?? '';
    const rightTeam = right.teamName ?? '';

    if (leftTeam !== rightTeam) {
        return leftTeam.localeCompare(rightTeam, 'de');
    }

    const leftRank = toNumber(left.rank);
    const rightRank = toNumber(right.rank);

    if (leftRank !== undefined && rightRank !== undefined && leftRank !== rightRank) {
        return leftRank - rightRank;
    }

    return left.name.localeCompare(right.name, 'de');
}

export function getTeamKey(team: ClubTeam, index: number) {
    return [
        team.association,
        team.groupId,
        team.id,
        team.season,
        team.leagueSlug,
        team.teamName,
        index,
    ]
        .filter(Boolean)
        .join('-');
}

export function getPlayerKey(player: ClubPlayer, index: number) {
    return [player.nuid, player.id, player.rank, player.name, player.teamName, index].filter(Boolean).join('-');
}

export function findFirstArray(value: unknown, depth = 0): unknown[] {
    if (depth > 8) return [];

    if (Array.isArray(value)) {
        return value;
    }

    if (!value || typeof value !== 'object') {
        return [];
    }

    const object = value as RichObject;

    for (const key of ['items', 'results', 'data', 'players', 'members', 'rows', 'values', 'list']) {
        const nested = findFirstArray(object[key], depth + 1);
        if (nested.length > 0) return nested;
    }

    for (const nestedValue of Object.values(object)) {
        const nested = findFirstArray(nestedValue, depth + 1);
        if (nested.length > 0) return nested;
    }

    return [];
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

export function toNumber(value: unknown) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : undefined;
}

export function normalizeTeamKey(teamName?: string) {
    return (teamName ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function getDateKey(value?: string) {
    const date = parseMatchDate(value);

    if (!date) {
        return '9999-99-99';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function compareDateKeys(left: string, right: string) {
    if (left === '9999-99-99' && right !== '9999-99-99') return 1;
    if (right === '9999-99-99' && left !== '9999-99-99') return -1;

    return left.localeCompare(right);
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
        return Number.MAX_SAFE_INTEGER;
    }

    return Number(match[1]) * 60 + Number(match[2]);
}
