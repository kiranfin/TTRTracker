import { useI18n } from '@/src/i18n/I18nProvider';
import type { ScheduleMatch, TableRow } from '@/src/types/tttracker';
import type { SchedulePeriodFilter, RoundFilter, LeagueInfo, TeamScheduleStats, RichTableRow, PromotionState, ThemeColors, EnrichedScheduleMatch, ScheduleRound } from './types';

export const periodFilters: SchedulePeriodFilter[] = ['all', 'past30', 'next30'];

export const roundFilters: RoundFilter[] = ['all', 'vr', 'rr'];

export const LEAGUE_FAVORITE_TYPE = 'league' as const;

export function periodFilterLabel(filter: SchedulePeriodFilter, t: ReturnType<typeof useI18n>['t']) {
    switch (filter) {
        case 'past30':
            return t('league.last30Days');
        case 'next30':
            return t('league.next30Days');
        case 'all':
        default:
            return t('common.all');
    }
}

export function roundFilterLabel(filter: RoundFilter, t: ReturnType<typeof useI18n>['t']) {
    switch (filter) {
        case 'vr':
            return t('league.firstHalf');
        case 'rr':
            return t('league.secondHalf');
        case 'all':
        default:
            return t('common.all');
    }
}

export function leagueMatchStatusLabel(status: ScheduleMatch['status'], t: ReturnType<typeof useI18n>['t']) {
    switch (status) {
        case 'completed':
            return t('status.completed');
        case 'free':
            return t('status.free');
        case 'scheduled':
        default:
            return t('status.scheduled');
    }
}

export function formatDateLabel(value: string | undefined, language: ReturnType<typeof useI18n>['language']) {
    const date = parseMatchDate(value);
    if (!date) return valueToString(value) ?? '-';

    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
    }).format(date);
}

export function getLeagueFavoriteId({
                                 favoriteId,
                                 association,
                                 groupId,
                                 season,
                                 leagueSlug,
                                 title,
                             }: {
    favoriteId?: string;
    association?: string;
    groupId?: string;
    season?: string;
    leagueSlug?: string;
    title?: string;
}) {
    const directId = String(favoriteId ?? '').trim();
    if (directId) return directId;

    const directGroupId = String(groupId ?? '').trim();
    if (directGroupId) return directGroupId;

    return [association, formatSeasonLabel(season), leagueSlug ?? 'x', title]
        .map((part) => String(part ?? '').trim())
        .filter(Boolean)
        .join(':');
}

export function isSameLeagueFavorite(item: unknown, league: LeagueInfo) {
    const favorite = item as {
        id?: string;
        type?: string;
        title?: string;
        params?: Record<string, unknown>;
    };

    if (favorite.type !== LEAGUE_FAVORITE_TYPE) return false;

    const params = favorite.params ?? {};
    const association = valueToString(params.association);
    const groupId = valueToString(params.groupId) ?? valueToString(params.leagueKey);
    const season = valueToString(params.season);
    const leagueSlug = valueToString(params.leagueSlug);
    const title = valueToString(params.title) ?? valueToString(favorite.title);

    const sameAssociation = normalizeComparable(association) === normalizeComparable(league.association);
    const sameGroup = normalizeComparable(groupId) === normalizeComparable(league.groupId);
    const sameSeason = normalizeSeasonLabel(season) === normalizeSeasonLabel(league.season);
    const sameSlug = normalizeComparable(leagueSlug ?? 'x') === normalizeComparable(league.leagueSlug ?? 'x');
    const sameTitle = normalizeComparable(title) === normalizeComparable(league.title);

    return sameAssociation && sameGroup && sameSeason && (sameSlug || sameTitle);
}

export function normalizeComparable(value?: string) {
    return String(value ?? '').trim().toLowerCase();
}

export function normalizeSeasonLabel(value?: string) {
    return formatSeasonLabel(value).trim().toLowerCase();
}

export function formatSeasonLabel(value?: string) {
    return String(value ?? '25/26').replace(/--/g, '/');
}

export function getTableStats(
    row: TableRow,
    index: number,
    scheduleStats: TeamScheduleStats | undefined,
    t: ReturnType<typeof useI18n>['t'],
) {
    const raw = row as RichTableRow;

    const position =
        valueToString(row.position) ??
        pickString(raw, ['position', 'tableRank', 'table_rank', 'rank']) ??
        String(index + 1);

    const teamName =
        valueToString(row.teamName) ??
        pickString(raw, ['teamName', 'team_name', 'name']) ??
        t('league.unknownTeam');

    const officialPoints =
        valueToString(row.points) ??
        joinPair(valueToString(row.pointsWon), valueToString(row.pointsLost)) ??
        pickString(raw, ['tablePoints', 'table_points', 'pointsText', 'score']);

    const schedulePoints = scheduleStats
        ? `${scheduleStats.tablePointsWon}:${scheduleStats.tablePointsLost}`
        : undefined;

    const games =
        valueToString(row.matches) ??
        pickString(raw, [
            'played',
            'playedGames',
            'played_games',
            'meetings',
            'meetingsPlayed',
            'meetings_played',
            'matchesPlayed',
            'matches_played',
            'anzahl_spiele',
        ]) ??
        (scheduleStats ? String(scheduleStats.played) : undefined);

    const wins = valueToString(row.wins) ?? pickString(raw, ['won', 'meetingsWon', 'meetings_won']);
    const draws = valueToString(row.draws) ?? pickString(raw, ['ties', 'meetingsDraw', 'meetings_draw']);
    const losses = valueToString(row.losses) ?? pickString(raw, ['lost', 'meetingsLost', 'meetings_lost']);

    const record =
        joinRecord(wins, draws, losses) ??
        (scheduleStats ? `${scheduleStats.wins}-${scheduleStats.draws}-${scheduleStats.losses}` : undefined);

    const ratio =
        pickString(raw, [
            'ratio',
            'matchRatio',
            'match_ratio',
            'matchesRatio',
            'matches_ratio',
            'gamesRatio',
            'games_ratio',
            'balance',
        ]) ??
        joinPair(
            pickString(raw, ['matchesWon', 'matches_won', 'gamesWon', 'games_won']),
            pickString(raw, ['matchesLost', 'matches_lost', 'gamesLost', 'games_lost']),
        ) ??
        (scheduleStats ? `${scheduleStats.matchesWon}:${scheduleStats.matchesLost}` : undefined) ??
        valueToString(row.games);

    return {
        position,
        teamName,
        points: officialPoints ?? schedulePoints ?? '-',
        games: games ?? '-',
        record: record ?? '-',
        ratio: ratio ?? '-',
    };
}

export function buildScheduleStats(matches: ScheduleMatch[]) {
    const statsByTeam = new Map<string, TeamScheduleStats>();

    for (const match of matches) {
        if (match.status !== 'completed') continue;
        if (isFreeTeam(match.homeTeam) || isFreeTeam(match.awayTeam)) continue;

        const homeScore = toNumber(match.homeScore);
        const awayScore = toNumber(match.awayScore);

        if (homeScore === undefined || awayScore === undefined) continue;

        addTeamScheduleResult(statsByTeam, match.homeTeam, homeScore, awayScore);
        addTeamScheduleResult(statsByTeam, match.awayTeam, awayScore, homeScore);
    }

    return statsByTeam;
}

export function addTeamScheduleResult(
    statsByTeam: Map<string, TeamScheduleStats>,
    teamName: string,
    ownScore: number,
    opponentScore: number,
) {
    const key = normalizeTeamKey(teamName);
    if (!key) return;

    const current =
        statsByTeam.get(key) ??
        {
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            tablePointsWon: 0,
            tablePointsLost: 0,
            matchesWon: 0,
            matchesLost: 0,
        };

    current.played += 1;
    current.matchesWon += ownScore;
    current.matchesLost += opponentScore;

    if (ownScore > opponentScore) {
        current.wins += 1;
        current.tablePointsWon += 2;
    } else if (ownScore < opponentScore) {
        current.losses += 1;
        current.tablePointsLost += 2;
    } else {
        current.draws += 1;
        current.tablePointsWon += 1;
        current.tablePointsLost += 1;
    }

    statsByTeam.set(key, current);
}

export function getTableRowKey(row: TableRow, index: number) {
    const raw = row as RichTableRow;

    return [
        valueToString(row.id),
        valueToString(row.teamName),
        valueToString(row.clubId),
        pickString(raw, ['teamId', 'team_id']),
        index,
    ]
        .filter(Boolean)
        .join('-');
}

export function getTeamRouteId(row: TableRow, teamName: string) {
    const raw = row as RichTableRow;

    return (
        valueToString(row.id) ??
        pickString(raw, ['teamId', 'team_id', 'teamUuid', 'team_uuid', 'id']) ??
        slugifyTeamName(teamName)
    );
}

export function slugifyTeamName(teamName: string) {
    return (
        normalizeTeamKey(teamName)
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || 'team'
    );
}

export function formatTablePoints(value?: string) {
    if (!value) return '-';

    const normalized = value.trim();

    if (/^\d+\.\d+$/.test(normalized)) {
        return normalized.replace('.', ':');
    }

    return normalized;
}

export function getPromotionState(row: TableRow): PromotionState {
    const raw = row as RichTableRow;

    const value = String(
        raw.promotionState ??
        raw.promotion_state ??
        ''
    )
        .trim()
        .toLowerCase();

    if (
        value === 'promotion' ||
        value === 'rise' ||
        value === 'up' ||
        value === 'promoted'
    ) {
        return 'promotion';
    }

    if (
        value === 'relegation' ||
        value === 'fall' ||
        value === 'down' ||
        value === 'relegated'
    ) {
        return 'relegation';
    }

    return 'none';
}

export function getTableCardAccent(row: TableRow, colors: ThemeColors) {
    const promotionState = getPromotionState(row);
    const dark = isDarkTheme(colors);

    if (promotionState === 'promotion') {
        return dark
            ? {
                background: 'rgba(34, 197, 94, 0.15)',
                border: 'rgba(74, 222, 128, 0.55)',
                rankBackground: 'rgba(34, 197, 94, 0.22)',
                rankBorder: 'rgba(74, 222, 128, 0.75)',
                rankText: '#86EFAC',
            }
            : {
                background: 'rgba(34, 197, 94, 0.11)',
                border: 'rgba(22, 163, 74, 0.38)',
                rankBackground: 'rgba(34, 197, 94, 0.16)',
                rankBorder: 'rgba(22, 163, 74, 0.45)',
                rankText: '#15803D',
            };
    }

    if (promotionState === 'relegation') {
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

export function getStatTileColors(
    tone: 'points' | 'games' | 'record' | 'ratio',
    themeColors: ThemeColors,
) {
    const dark = isDarkTheme(themeColors);

    switch (tone) {
        case 'points':
            return dark
                ? {
                    background: 'rgba(59, 130, 246, 0.16)',
                    border: 'rgba(96, 165, 250, 0.4)',
                    label: '#93C5FD',
                    value: '#FFFFFF',
                }
                : {
                    background: 'rgba(59, 130, 246, 0.12)',
                    border: 'rgba(37, 99, 235, 0.3)',
                    label: '#2563EB',
                    value: '#1D4ED8',
                };

        case 'games':
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

        case 'record':
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

        case 'ratio':
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
    }
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

export function matchesPeriodFilter(match: ScheduleMatch, filter: SchedulePeriodFilter) {
    if (filter === 'all') return true;

    const date = parseMatchDate(match.date);
    if (!date) return false;

    const today = startOfDay(new Date());

    if (filter === 'past30') {
        return date >= addDays(today, -30) && date <= today;
    }

    if (filter === 'next30') {
        return date >= today && date <= addDays(today, 30);
    }

    return true;
}

export function enrichScheduleMatch(match: ScheduleMatch): EnrichedScheduleMatch {
    return {
        ...match,
        scheduleRound: inferScheduleRound(match),
    };
}

export function matchesRoundFilter(match: EnrichedScheduleMatch, filter: RoundFilter) {
    if (filter === 'all') return true;
    return match.scheduleRound === filter;
}

export function inferScheduleRound(match: ScheduleMatch): ScheduleRound {
    const roundName = String(match.roundName ?? '').toLowerCase();

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

    const date = parseMatchDate(match.date);

    if (date) {
        const month = date.getMonth() + 1;

        // Typische Saisonlogik: Juli-Dezember = Vorrunde, Januar-Juni = Rückrunde
        return month >= 7 && month <= 12 ? 'vr' : 'rr';
    }

    // Fallback, falls gar nichts erkennbar ist
    return 'vr';
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

export function addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

export function normalizeTeamKey(teamName?: string) {
    return (teamName ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function isFreeTeam(teamName?: string) {
    return normalizeTeamKey(teamName).includes('spielfrei');
}

export function pickString(row: RichTableRow, keys: string[]) {
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

export function joinPair(left?: string, right?: string) {
    if (!left && !right) return undefined;
    return `${left ?? '0'}:${right ?? '0'}`;
}

export function joinRecord(wins?: string, draws?: string, losses?: string) {
    if (!wins && !draws && !losses) return undefined;
    return `${wins ?? '0'}-${draws ?? '0'}-${losses ?? '0'}`;
}

export function toNumber(value: unknown) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : undefined;
}
