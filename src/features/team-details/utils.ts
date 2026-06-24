import { Linking } from 'react-native';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { TeamPlayer, TeamApiClient, TeamInfo, TeamContext, TeamScheduleMatch, TeamBalance, ScheduleSummary, RoundFilter } from './types';

export function normalizeLineup(
    response: unknown,
    teamName: string,
    t: ReturnType<typeof useI18n>['t'],
): TeamPlayer[] {
    const data = unwrapData(response);
    const record = asRecord(data);

    const teampools =
        arrayValue(record?.teampools).length > 0
            ? arrayValue(record?.teampools)
            : arrayValue(data).filter((item) => arrayValue(asRecord(item)?.teampool).length > 0);

    if (teampools.length > 0) {
        const matchingPool =
            teampools.find((pool) => {
                const poolRecord = asRecord(pool);
                return (
                    normalizeTeamKey(pickString(poolRecord, ['team_name', 'teamName'])) ===
                    normalizeTeamKey(teamName)
                );
            }) ?? teampools[0];

        const poolPlayers = arrayValue(asRecord(matchingPool)?.teampool);

        if (poolPlayers.length > 0) {
            return dedupePlayers(poolPlayers.map((player) => normalizeLineupPlayer(player, t))).sort(sortByRank);
        }
    }

    const directRows =
        firstNonEmptyArray([
            arrayValue(record?.players),
            arrayValue(record?.teamPlayers),
            arrayValue(record?.lineup),
            arrayValue(record?.teampool),
            arrayValue(data).filter(looksLikePlayerRecord),
        ]) ?? [];

    return dedupePlayers(directRows.map((player) => normalizeLineupPlayer(player, t))).sort(sortByRank);
}

export function looksLikePlayerRecord(value: unknown) {
    const row = asRecord(value);

    return Boolean(
        row &&
        (
            row.firstname !== undefined ||
            row.lastname !== undefined ||
            row.player_firstname !== undefined ||
            row.player_lastname !== undefined ||
            row.internal_id !== undefined ||
            row.player_id !== undefined ||
            row.person_id !== undefined ||
            row.nuid !== undefined ||
            row.player_qttr !== undefined ||
            row.qttr !== undefined
        ),
    );
}

export function dedupePlayers(players: TeamPlayer[]) {
    const seen = new Set<string>();

    return players.filter((player, index) => {
        const id = cleanValue(player.id);
        const key = id
            ? `id:${id}`
            : `fallback:${normalizeTeamKey(player.name)}:${player.rank ?? index}`;

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

export function normalizeLineupPlayer(value: unknown, t: ReturnType<typeof useI18n>['t']): TeamPlayer {
    const row = asRecord(value);

    const firstname = pickString(row, ['firstname', 'first_name', 'player_firstname']);
    const lastname = pickString(row, ['lastname', 'last_name', 'player_lastname']);
    const name =
        pickString(row, ['name', 'player_name', 'person_name']) ??
        joinParts([firstname, lastname]) ??
        t('team.unknownPlayer');

    return {
        id: pickString(row, ['internal_id', 'player_id', 'person_id', 'nuid', 'id']),
        firstname,
        lastname,
        name,
        rank: pickString(row, ['rank', 'player_rank', 'position']),
        teamNumber: pickString(row, ['team_number', 'teamNumber']),
        qttr: pickString(row, ['player_qttr', 'qttr', 'q_ttr', 'ttr', 'ttr_value', 'player_ttr']),
        status: pickString(row, ['player_status', 'status']),
        foreignerType: pickString(row, ['foreigner_type', 'foreignerType']),
    };
}

export async function enrichLineupWithTtr(players: TeamPlayer[], api: TeamApiClient) {
    if (!api.getPlayerTtr) return players;

    const playerIds = Array.from(
        new Set(
            players
                .map((player) => cleanValue(player.id))
                .filter((id): id is string => Boolean(id)),
        ),
    );

    if (playerIds.length === 0) return players;

    const ttrResults = await Promise.allSettled(
        playerIds.map(async (playerId) => {
            const result = await api.getPlayerTtr!(playerId);
            return [playerId, extractTtrFromPlayerTtrResponse(result)] as const;
        }),
    );

    const ttrByPlayerId = new Map<string, string>();

    for (const result of ttrResults) {
        if (result.status !== 'fulfilled') continue;

        const [playerId, ttr] = result.value;
        const cleanedTtr = cleanValue(ttr);

        if (cleanedTtr) {
            ttrByPlayerId.set(playerId, cleanedTtr);
        }
    }

    return players.map((player) => {
        const playerId = cleanValue(player.id);
        const loadedTtr = playerId ? ttrByPlayerId.get(playerId) : undefined;

        if (!loadedTtr) return player;

        return {
            ...player,
            qttr: loadedTtr,
        };
    });
}

export function extractTtrFromPlayerTtrResponse(response: unknown) {
    const data = unwrapData(response);

    const directValue = pickNestedString(data, [
        ['ttr'],
        ['qttr'],
        ['q_ttr'],
        ['player_ttr'],
        ['player_qttr'],
        ['ttr_value'],
        ['values', 'ttr'],
        ['values', 'qttr'],
        ['ttrResult', 'values', 'ttr'],
        ['ttrResult', 'values', 'qttr'],
        ['ttr_result', 'values', 'ttr'],
        ['historyResult', 'values', 'ttr'],
        ['historyResult', 'values', 'qttr'],
        ['history_result', 'values', 'ttr'],
        ['player', 'ttr'],
        ['player', 'qttr'],
    ]);

    return normalizeTtrValue(directValue ?? findTtrValueDeep(data));
}

export function pickNestedString(value: unknown, paths: string[][]) {
    for (const path of paths) {
        let current: unknown = value;

        for (const key of path) {
            const record = asRecord(current);

            if (!record || !(key in record)) {
                current = undefined;
                break;
            }

            current = record[key];
        }

        const cleaned = cleanValue(current);
        if (cleaned) return cleaned;
    }

    return undefined;
}

export function findTtrValueDeep(value: unknown, depth = 0): string | undefined {
    if (depth > 5) return undefined;

    const record = asRecord(value);
    if (!record) return undefined;

    for (const key of ['ttr', 'qttr', 'q_ttr', 'player_ttr', 'player_qttr', 'ttr_value']) {
        const cleaned = cleanValue(record[key]);
        if (cleaned) return cleaned;
    }

    for (const nestedValue of Object.values(record)) {
        const nestedTtr = findTtrValueDeep(nestedValue, depth + 1);
        if (nestedTtr) return nestedTtr;
    }

    return undefined;
}

export function normalizeTtrValue(value?: string) {
    const cleaned = cleanValue(value);
    if (!cleaned) return undefined;

    const match = cleaned.match(/\d{3,5}/);
    return match?.[0] ?? cleaned;
}

export function normalizeTeamInfo(response: unknown): TeamInfo | null {
    if (!response) return null;

    const data = unwrapData(response);
    const row = asRecord(data);

    if (!row) return null;

    const meetingsExcerpt = asRecord(row.meetings_excerpt);
    const normalizedVenues = normalizeVenueList(row.venues);
    const fallbackVenues =
        normalizedVenues.length > 0 ? normalizedVenues : normalizeVenueList(row.club_contacts, true);

    const primaryVenue =
        normalizeStringRecord(asRecord(row.venue ?? row.location)) ?? fallbackVenues[0];

    return {
        headInfos: normalizeStringRecord(asRecord(row.head_infos)),
        contact: normalizeStringRecord(asRecord(row.team_contact ?? row.contact)),
        clubContact: normalizeStringRecord(asRecord(row.club_contact)),
        venue: primaryVenue,
        venues: fallbackVenues.length > 0 ? fallbackVenues : primaryVenue ? [primaryVenue] : [],
        teamPhotoUrl: pickString(row, ['team_photo_url', 'teamPhotoUrl', 'photo_url', 'image']),
        remarks: pickString(meetingsExcerpt, ['remarks']),
        pdfVersionUrl: pickString(meetingsExcerpt, ['pdf_version_url', 'pdfVersionUrl']),
        pdfMaterialsUrl: pickString(meetingsExcerpt, ['pdf_materials_url', 'pdfMaterialsUrl']),
    };
}

export function normalizeTeamSchedule(
    response: unknown,
    team: TeamContext,
    t: ReturnType<typeof useI18n>['t'],
    language: ReturnType<typeof useI18n>['language'],
): TeamScheduleMatch[] {
    const data = unwrapData(response);
    const row = asRecord(data);

    const meetingsExcerpt = asRecord(row?.meetings_excerpt);

    const rows =
        firstNonEmptyArray([
            arrayValue(row?.schedule),
            arrayValue(row?.meetings),
            flattenMeetingGroups(meetingsExcerpt?.meetings),
        ]) ?? [];

    return rows
        .map((value) => normalizeScheduleRow(value, team, t, language))
        .filter((match) => match.homeTeam || match.awayTeam)
        .sort((a, b) => {
            const dateA = parseDate(a.date)?.getTime() ?? 0;
            const dateB = parseDate(b.date)?.getTime() ?? 0;
            return dateA - dateB;
        });
}

export function normalizeScheduleRow(
    value: unknown,
    team: TeamContext,
    t: ReturnType<typeof useI18n>['t'],
    language: ReturnType<typeof useI18n>['language'],
): TeamScheduleMatch {
    const row = asRecord(value);

    const date = pickString(row, ['date', 'datetime', 'start_time', 'startTime']);
    const time =
        pickString(row, ['time', 'start_time_label', 'timeLabel']) ?? formatTimeLabel(date, language);

    const homeTeamId = pickString(row, ['team_home_id', 'homeTeamId', 'home_team_id']);
    const awayTeamId = pickString(row, ['team_away_id', 'awayTeamId', 'away_team_id']);

    const opponent = pickString(row, ['opponent_team_name', 'opponentTeamName', 'opponent']);
    const homeTeam =
        pickString(row, ['team_home', 'homeTeam', 'home_team']) ??
        (opponent ? team.teamName : t('match.home'));
    const awayTeam =
        pickString(row, ['team_away', 'awayTeam', 'away_team']) ??
        opponent ??
        t('team.away');

    const ownIsHome = isOwnTeam(homeTeam, homeTeamId, team);
    const ownIsAway = isOwnTeam(awayTeam, awayTeamId, team);

    const explicitHomeScore = pickString(row, ['homeScore', 'home_score', 'team_home_score', 'points_home']);
    const explicitAwayScore = pickString(row, ['awayScore', 'away_score', 'team_away_score', 'points_away']);

    // In meetings_excerpt.meetings liefert myTischtennis/click-tt `matches_won` und
    // `matches_lost` als Heim:Auswärts-Ergebnis, nicht als Ergebnis aus Sicht
    // der aktuell geöffneten Mannschaft. Deshalb dürfen Auswärtsspiele hier nicht
    // nochmal gedreht werden.
    const meetingHomeScore = pickString(row, ['matches_won', 'points_won', 'score_won']);
    const meetingAwayScore = pickString(row, ['matches_lost', 'points_lost', 'score_lost']);

    const explicitOwnScore = pickString(row, ['ownScore', 'own_score']);
    const explicitOpponentScore = pickString(row, ['opponentScore', 'opponent_score']);

    const homeScore =
        explicitHomeScore ??
        meetingHomeScore ??
        (ownIsHome ? explicitOwnScore : ownIsAway ? explicitOpponentScore : undefined);

    const awayScore =
        explicitAwayScore ??
        meetingAwayScore ??
        (ownIsHome ? explicitOpponentScore : ownIsAway ? explicitOwnScore : undefined);

    const ownScore = ownIsHome ? homeScore : ownIsAway ? awayScore : explicitOwnScore;
    const opponentScore = ownIsHome ? awayScore : ownIsAway ? homeScore : explicitOpponentScore;

    const location = asRecord(row?.location);

    const status = normalizeMatchStatus(
        pickString(row, ['state', 'status', 'meeting_state']),
        homeScore,
        awayScore,
        homeTeam,
        awayTeam,
    );

    return {
        id: pickString(row, ['meeting_id', 'meetingId', 'id']),
        date,
        time,
        status,
        homeTeam,
        awayTeam,
        homeTeamId,
        awayTeamId,
        homeScore,
        awayScore,
        ownScore,
        opponentScore,
        locationLabel: pickString(location, ['label', 'name']) ?? pickString(row, ['location_label']),
        locationCity: pickString(location, ['city']) ?? pickString(row, ['location_city']),
        roundType: pickString(row, ['round_type', 'roundType']),
        roundName: pickString(row, ['round_name', 'roundName']),
    };
}

export function normalizeBalances(response: unknown, t: ReturnType<typeof useI18n>['t']): TeamBalance[] {
    const data = unwrapData(response);
    const row = asRecord(data);

    const balanceSheetStats = getBalanceSheetSingleStats(row);

    const rows =
        firstNonEmptyArray([
            arrayValue(row?.player_balances),
            arrayValue(row?.single_player_statistics),
            balanceSheetStats,
        ]) ?? [];

    return dedupeBalances(rows.map((balance) => normalizeBalanceRow(balance, t)))
        .filter((balance) => balance.name && balance.name !== t('team.unknownPlayer'))
        .sort((a, b) => {
            const rankA = Number(a.rank ?? Number.MAX_SAFE_INTEGER);
            const rankB = Number(b.rank ?? Number.MAX_SAFE_INTEGER);
            return rankA - rankB;
        });
}

export function dedupeBalances(balances: TeamBalance[]) {
    const seen = new Set<string>();

    return balances.filter((balance, index) => {
        const id = cleanValue(balance.playerId);
        const key = id
            ? `id:${id}`
            : `fallback:${normalizeTeamKey(balance.name)}:${balance.rank ?? index}`;

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

export function normalizeBalanceRow(value: unknown, t: ReturnType<typeof useI18n>['t']): TeamBalance {
    const row = asRecord(value);

    const firstname = pickString(row, ['player_firstname', 'firstname', 'first_name']);
    const lastname = pickString(row, ['player_lastname', 'lastname', 'last_name']);
    const name =
        pickString(row, ['player_name', 'name', 'person_name']) ??
        joinParts([firstname, lastname]) ??
        t('team.unknownPlayer');

    const pointsWon = pickString(row, ['points_won', 'won', 'matches_won']);
    const pointsLost = pickString(row, ['points_lost', 'lost', 'matches_lost']);
    const wonNumber = toNumber(pointsWon) ?? 0;
    const lostNumber = toNumber(pointsLost) ?? 0;

    const singleStats =
        arrayValue(row?.single_statistics).map((stat) => {
            const statRow = asRecord(stat);

            return {
                opponentRank: pickString(statRow, ['opponent_rank', 'opponentRank']),
                pointsWon: pickString(statRow, ['points_won', 'won']),
                pointsLost: pickString(statRow, ['points_lost', 'lost']),
            };
        }) ?? [];

    return {
        playerId: pickString(row, ['player_id', 'internal_id', 'nuid', 'id']),
        firstname,
        lastname,
        name,
        meetingsCount: pickString(row, ['meetings_count', 'meeting_count', 'matches_count', 'match_count']),
        pointsWon,
        pointsLost,
        quote: wonNumber + lostNumber > 0 ? wonNumber / (wonNumber + lostNumber) : undefined,
        rank: pickString(row, ['player_rank', 'rank']),
        teamNumber: pickString(row, ['team_number', 'teamNumber']),
        singleStats,
    };
}

export function buildScheduleSummary(matches: TeamScheduleMatch[], team: TeamContext): ScheduleSummary {
    const summary: ScheduleSummary = {
        played: 0,
        open: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        nextMatch: undefined,
    };

    const now = new Date();

    for (const match of matches) {
        if (match.status === 'completed') {
            summary.played += 1;

            const result = getOwnResult(match, team);
            if (result) {
                if (result.own > result.opponent) summary.wins += 1;
                else if (result.own < result.opponent) summary.losses += 1;
                else summary.draws += 1;
            }

            continue;
        }

        summary.open += 1;

        const matchDate = parseDate(match.date);
        if (!matchDate || matchDate < now) continue;

        const currentNextDate = parseDate(summary.nextMatch?.date);
        if (!summary.nextMatch || !currentNextDate || matchDate < currentNextDate) {
            summary.nextMatch = match;
        }
    }

    return summary;
}

export function buildBalanceSummary(balances: TeamBalance[]) {
    let pointsWon = 0;
    let pointsLost = 0;

    for (const balance of balances) {
        pointsWon += toNumber(balance.pointsWon) ?? 0;
        pointsLost += toNumber(balance.pointsLost) ?? 0;
    }

    return {
        pointsWon,
        pointsLost,
        quote: pointsWon + pointsLost > 0 ? pointsWon / (pointsWon + pointsLost) : undefined,
    };
}

export function getOwnResult(match: TeamScheduleMatch, team: TeamContext) {
    const ownScore = toNumber(match.ownScore);
    const opponentScore = toNumber(match.opponentScore);

    if (ownScore !== undefined && opponentScore !== undefined) {
        return { own: ownScore, opponent: opponentScore };
    }

    const homeScore = toNumber(match.homeScore);
    const awayScore = toNumber(match.awayScore);

    if (homeScore === undefined || awayScore === undefined) return undefined;

    if (isOwnTeam(match.homeTeam, match.homeTeamId, team)) {
        return { own: homeScore, opponent: awayScore };
    }

    if (isOwnTeam(match.awayTeam, match.awayTeamId, team)) {
        return { own: awayScore, opponent: homeScore };
    }

    return undefined;
}

export function getOpponentName(match: TeamScheduleMatch, team: TeamContext) {
    if (isOwnTeam(match.homeTeam, match.homeTeamId, team)) return match.awayTeam;
    if (isOwnTeam(match.awayTeam, match.awayTeamId, team)) return match.homeTeam;
    return undefined;
}

export function isOwnTeam(teamName?: string, teamId?: string, team?: TeamContext) {
    if (!team) return false;

    if (teamId && String(teamId) === String(team.teamId)) return true;

    return normalizeTeamKey(teamName) === normalizeTeamKey(team.teamName);
}

export function normalizeMatchStatus(
    rawStatus?: string,
    homeScore?: string,
    awayScore?: string,
    homeTeam?: string,
    awayTeam?: string,
): TeamScheduleMatch['status'] {
    const value = normalizeKey(rawStatus);

    if (normalizeTeamKey(homeTeam).includes('spielfrei') || normalizeTeamKey(awayTeam).includes('spielfrei')) {
        return 'free';
    }

    if (
        value.includes('completed') ||
        value.includes('finished') ||
        value.includes('done') ||
        value.includes('played') ||
        value.includes('geschlossen') ||
        value.includes('beendet') ||
        value.includes('gespielt') ||
        (homeScore !== undefined && awayScore !== undefined)
    ) {
        return 'completed';
    }

    return 'scheduled';
}

export function teamMatchStatusLabel(status: TeamScheduleMatch['status'], t: ReturnType<typeof useI18n>['t']) {
    switch (status) {
        case 'completed':
            return t('status.completed');
        case 'free':
            return t('status.free');
        case 'scheduled':
        default:
            return t('team.open');
    }
}

export function roundFilterLabel(filter: RoundFilter, t: ReturnType<typeof useI18n>['t']) {
    switch (filter) {
        case 'vr':
            return t('team.firstHalf');
        case 'rr':
            return t('team.secondHalf');
        case 'gesamt':
        default:
            return t('team.totalRound');
    }
}

export function filterScheduleByRound(matches: TeamScheduleMatch[], filter: RoundFilter) {
    if (filter === 'gesamt') return matches;

    return matches.filter((match) => inferScheduleRound(match) === filter);
}

export function inferScheduleRound(match: TeamScheduleMatch): 'vr' | 'rr' {
    const roundType = cleanValue(match.roundType);

    if (roundType === '0') return 'vr';
    if (roundType === '1') return 'rr';

    const roundName = normalizeKey(match.roundName);

    if (
        roundName.includes('rück') ||
        roundName.includes('rueck') ||
        roundName.includes('rr')
    ) {
        return 'rr';
    }

    if (
        roundName.includes('hin') ||
        roundName.includes('vor') ||
        roundName.includes('vr')
    ) {
        return 'vr';
    }

    const date = parseDate(match.date);

    if (date) {
        const month = date.getMonth() + 1;
        return month >= 7 && month <= 12 ? 'vr' : 'rr';
    }

    return 'vr';
}

export function arrayValue(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

export function firstNonEmptyArray(arrays: unknown[][]): unknown[] | undefined {
    return arrays.find((array) => array.length > 0);
}

export function flattenMeetingGroups(value: unknown): unknown[] {
    const groups = arrayValue(value);
    const result: unknown[] = [];

    for (const group of groups) {
        if (Array.isArray(group)) {
            result.push(...group);
            continue;
        }

        const record = asRecord(group);

        if (!record) continue;

        for (const nestedValue of Object.values(record)) {
            if (Array.isArray(nestedValue)) {
                result.push(...nestedValue);
            }
        }
    }

    return result;
}

export function normalizeVenueList(value: unknown, filterClubContacts = false) {
    return arrayValue(value)
        .map((item) => asRecord(item))
        .filter((item): item is Record<string, unknown> => Boolean(item))
        .filter((item) => !filterClubContacts || isVenueCandidate(item))
        .map((item) => normalizeStringRecord(item))
        .filter((item): item is Record<string, string> => Boolean(item && hasDisplayableValues(item)));
}

export function isVenueCandidate(record: Record<string, unknown>) {
    const label = cleanValue(record.label)?.toLowerCase() ?? '';

    if (label.includes('spiellokal')) {
        return true;
    }

    const hasEmail = cleanValue(record.email_home) || cleanValue(record.email_work);

    return !hasEmail && Boolean(cleanValue(record.street)) && Boolean(cleanValue(record.city));
}

export function getBalanceSheetSingleStats(row?: Record<string, unknown>) {
    const sheets = arrayValue(row?.balancesheet);

    for (const sheet of sheets) {
        const sheetRecord = asRecord(sheet);
        const stats = arrayValue(sheetRecord?.single_player_statistics);

        if (stats.length > 0) {
            return stats;
        }
    }

    return [];
}

export function isProbablyUrl(value?: string) {
    const cleaned = cleanValue(value);
    return Boolean(cleaned && /^https?:\/\//i.test(cleaned));
}

export function unwrapData(value: unknown) {
    let current = value;

    for (let index = 0; index < 3; index += 1) {
        const record = asRecord(current);
        if (!record || record.data === undefined) break;
        current = record.data;
    }

    return current;
}

export function asRecord(value: unknown): Record<string, unknown> | undefined {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : undefined;
}

export function normalizeStringRecord(record?: Record<string, unknown>) {
    if (!record) return undefined;

    return Object.fromEntries(
        Object.entries(record)
            .map(([key, value]) => [key, cleanValue(value)])
            .filter(([, value]) => Boolean(value)),
    ) as Record<string, string>;
}

export function pickString(record: Record<string, unknown> | undefined, keys: string[]) {
    if (!record) return undefined;

    for (const key of keys) {
        const value = cleanValue(record[key]);
        if (value !== undefined) return value;
    }

    return undefined;
}

export function cleanValue(value: unknown) {
    if (value === undefined || value === null) return undefined;

    const text = String(value).trim();

    if (!text || text === '-' || text.toLowerCase() === 'null' || text.toLowerCase() === 'undefined') {
        return undefined;
    }

    return text;
}

export function joinParts(parts: (string | undefined)[]) {
    const joined = parts.map(cleanValue).filter(Boolean).join(', ');
    return joined || undefined;
}

export function toNumber(value: unknown) {
    const numberValue = Number(String(value ?? '').replace(',', '.'));
    return Number.isFinite(numberValue) ? numberValue : undefined;
}

export function sortByRank(left: TeamPlayer, right: TeamPlayer) {
    const rankLeft = Number(left.rank ?? Number.MAX_SAFE_INTEGER);
    const rankRight = Number(right.rank ?? Number.MAX_SAFE_INTEGER);

    return rankLeft - rankRight;
}

export function hasDisplayableValues(record?: Record<string, string>) {
    return Boolean(record && Object.values(record).some((value) => cleanValue(value)));
}

export function normalizeSeasonForApi(season: string) {
    const value = season.trim();

    if (/^\d{2}--\d{2}$/.test(value)) return value;

    const shortMatch = value.match(/^(\d{2})\/(\d{2})$/);
    if (shortMatch) return `${shortMatch[1]}--${shortMatch[2]}`;

    const longMatch = value.match(/^20(\d{2})\/(\d{2})$/);
    if (longMatch) return `${longMatch[1]}--${longMatch[2]}`;

    return value;
}

export function slugifyMyttPathSegment(value: string) {
    return (
        value
            .trim()
            .replace(/ä/g, 'ae')
            .replace(/ö/g, 'oe')
            .replace(/ü/g, 'ue')
            .replace(/Ä/g, 'Ae')
            .replace(/Ö/g, 'Oe')
            .replace(/Ü/g, 'Ue')
            .replace(/ß/g, 'ss')
            .replace(/&/g, 'und')
            .replace(/\s+/g, '_')
            .replace(/[^\w-]+/g, '')
            .replace(/_+/g, '_') || 'x'
    );
}

export function normalizeTeamKey(value?: string) {
    return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function normalizeKey(value?: string) {
    return (value ?? '').trim().toLowerCase();
}

export function parseDate(value?: string) {
    const raw = cleanValue(value);
    if (!raw) return undefined;

    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) return date;

    const germanMatch = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
    if (germanMatch) {
        const year =
            germanMatch[3].length === 2 ? 2000 + Number(germanMatch[3]) : Number(germanMatch[3]);

        return new Date(year, Number(germanMatch[2]) - 1, Number(germanMatch[1]));
    }

    return undefined;
}

export function formatDateLabel(value?: string, language: ReturnType<typeof useI18n>['language'] = 'de') {
    const date = parseDate(value);
    if (!date) return cleanValue(value) ?? '-';

    return new Intl.DateTimeFormat(languageToLocale(language), {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
    }).format(date);
}

export function formatTimeLabel(value?: string, language: ReturnType<typeof useI18n>['language'] = 'de') {
    const date = parseDate(value);
    if (!date) return undefined;

    const hours = date.getHours();
    const minutes = date.getMinutes();

    if (hours === 0 && minutes === 0) return undefined;

    return new Intl.DateTimeFormat(languageToLocale(language), {
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

export function languageToLocale(language: ReturnType<typeof useI18n>['language']) {
    return language === 'en' ? 'en-US' : 'de-DE';
}

export function formatPercent(value?: number) {
    if (value === undefined || Number.isNaN(value)) return '-';
    return `${Math.round(value * 100)}%`;
}

export function getTileColors(tone: 'primary' | 'green' | 'orange' | 'purple', colors: ReturnType<typeof useTheme>['colors']) {
    const dark = getRelativeLuminance(colors.background) < 0.45;

    switch (tone) {
        case 'green':
            return dark
                ? {
                    background: 'rgba(34, 197, 94, 0.14)',
                    border: 'rgba(74, 222, 128, 0.35)',
                    label: '#86EFAC',
                    value: '#FFFFFF',
                }
                : {
                    background: 'rgba(34, 197, 94, 0.12)',
                    border: 'rgba(22, 163, 74, 0.3)',
                    label: '#16A34A',
                    value: '#15803D',
                };

        case 'orange':
            return dark
                ? {
                    background: 'rgba(249, 115, 22, 0.14)',
                    border: 'rgba(251, 146, 60, 0.38)',
                    label: '#FDBA74',
                    value: '#FFFFFF',
                }
                : {
                    background: 'rgba(249, 115, 22, 0.12)',
                    border: 'rgba(234, 88, 12, 0.3)',
                    label: '#EA580C',
                    value: '#C2410C',
                };

        case 'purple':
            return dark
                ? {
                    background: 'rgba(168, 85, 247, 0.16)',
                    border: 'rgba(192, 132, 252, 0.38)',
                    label: '#D8B4FE',
                    value: '#FFFFFF',
                }
                : {
                    background: 'rgba(168, 85, 247, 0.12)',
                    border: 'rgba(147, 51, 234, 0.3)',
                    label: '#9333EA',
                    value: '#7E22CE',
                };

        case 'primary':
        default:
            return {
                background: colors.primarySoft,
                border: colors.primarySoftBorder,
                label: colors.primary,
                value: colors.primary,
            };
    }
}

export function getRelativeLuminance(color: string) {
    const hex = color.trim();

    if (!hex.startsWith('#')) return 1;

    const normalized =
        hex.length === 4
            ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
            : hex;

    const red = parseInt(normalized.slice(1, 3), 16);
    const green = parseInt(normalized.slice(3, 5), 16);
    const blue = parseInt(normalized.slice(5, 7), 16);

    if ([red, green, blue].some((value) => Number.isNaN(value))) return 1;

    const [r, g, b] = [red, green, blue].map((value) => {
        const channel = value / 255;
        return channel <= 0.03928
            ? channel / 12.92
            : Math.pow((channel + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function openUrl(url: string) {
    Linking.openURL(url).catch(() => undefined);
}
