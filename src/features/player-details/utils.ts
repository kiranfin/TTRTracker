import type { NormalizedTtrHistoryEvent } from '@/src/types/tttracker';
import { isFavorite } from '@/src/storage/favorites';
import type { ChartRangeId } from './types';

export const PAGE_SIZE = 10;

export const PLAYER_FAVORITE_TYPE = 'player' as Parameters<typeof isFavorite>[0];

export const CHART_RANGES: {
    id: ChartRangeId;
    months?: number;
}[] = [
    { id: '6m', months: 6 },
    { id: '12m', months: 12 },
    { id: '24m', months: 24 },
    { id: 'all' },
];

export function normalizeClubLookupText(value?: string | null) {
    return (value ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

export function parseOptionalNumber(value: unknown) {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined;
    }

    if (typeof value !== 'string') return undefined;

    const cleaned = value
        .trim()
        .replace(/[^\d,.-]/g, '');

    if (!cleaned) return undefined;

    const normalized = cleaned.includes(',') && cleaned.includes('.')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.includes(',') && !cleaned.includes('.')
            ? cleaned.replace(',', '.')
            : /^\d{1,3}(\.\d{3})+$/.test(cleaned)
                ? cleaned.replace(/\./g, '')
                : cleaned;

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
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

export function formatOptionalNumber(value: number | null | undefined) {
    return isFiniteNumber(value) ? String(value) : '—';
}

export function formatSignedNumber(value: number | null | undefined) {
    if (!isFiniteNumber(value)) return '—';
    return value > 0 ? `+${value}` : String(value);
}

export function formatSignedAverage(value: number | null | undefined) {
    if (!isFiniteNumber(value)) return '—';

    const rounded = Math.round(value * 10) / 10;
    const formatted = Number.isInteger(rounded)
        ? String(rounded)
        : rounded.toFixed(1).replace('.', ',');

    return rounded > 0 ? `+${formatted}` : formatted;
}

export function formatPercent(value: number | null | undefined) {
    if (!isFiniteNumber(value)) return '—';
    return `${Math.round(value)} %`;
}

export function parseDateTimestamp(value?: string | null) {
    if (!value) return undefined;

    const direct = new Date(value).getTime();
    if (Number.isFinite(direct)) return direct;

    const germanDateMatch = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (germanDateMatch) {
        const [, day, month, year] = germanDateMatch;
        const parsed = new Date(Number(year), Number(month) - 1, Number(day)).getTime();
        return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
}

export function subtractMonths(date: Date, months: number) {
    const copy = new Date(date);
    copy.setMonth(copy.getMonth() - months);
    return copy;
}

export function getEventTtr(event: NormalizedTtrHistoryEvent) {
    return event.ttrAfter ?? event.ttr;
}

export function parseRatioFromString(value: unknown, maxMatches?: number) {
    if (typeof value !== 'string') return undefined;

    const match = value.match(/\b(\d{1,3})\s*:\s*(\d{1,3})\b/);
    if (!match) return undefined;

    const won = Number(match[1]);
    const lost = Number(match[2]);
    const total = won + lost;

    if (!Number.isFinite(won) || !Number.isFinite(lost) || total <= 0) {
        return undefined;
    }

    if (maxMatches !== undefined && total > maxMatches) {
        return undefined;
    }

    if (maxMatches === undefined && (won > 10 || lost > 10)) {
        return undefined;
    }

    return { won, lost };
}

export function getEventWinLoss(event: NormalizedTtrHistoryEvent) {
    const eventRecord = event as Record<string, unknown>;
    const matchCount = parseOptionalNumber(event.matchCount);

    const wonFromField = parseOptionalNumber(event.matchesWon);
    const lostFromField = parseOptionalNumber(event.matchesLost);

    if (wonFromField !== undefined || lostFromField !== undefined) {
        const won = wonFromField ?? 0;
        const lost = lostFromField ?? 0;

        if (won + lost > 0) {
            return { won, lost };
        }
    }

    const possibleRatioValues: unknown[] = [
        eventRecord.ratio,
        eventRecord.record,
        eventRecord.bilanz,
        eventRecord.matchRatio,
        eventRecord.matchRecord,
        eventRecord.matchBalance,
        eventRecord.spielBilanz,
        eventRecord.spieleBilanz,
        eventRecord.result,
        eventRecord.score,
        event.title,
        event.meetingLabel,
    ];

    for (const value of possibleRatioValues) {
        const ratio = parseRatioFromString(value, matchCount);
        if (ratio) return ratio;
    }

    const won = event.matches.filter((match) => {
        return (
            isFiniteNumber(match.ownSets) &&
            isFiniteNumber(match.otherSets) &&
            match.ownSets > match.otherSets
        );
    }).length;

    const lost = event.matches.filter((match) => {
        return (
            isFiniteNumber(match.ownSets) &&
            isFiniteNumber(match.otherSets) &&
            match.ownSets < match.otherSets
        );
    }).length;

    return { won, lost };
}

export function normalizeSearchText(value: unknown) {
    if (value === null || value === undefined) return '';
    return String(value).trim().toLowerCase();
}

export function historyEventMatchesSearch(event: NormalizedTtrHistoryEvent, query: string) {
    const normalizedQuery = normalizeSearchText(query);

    if (!normalizedQuery) return true;

    const eventRecord = event as Record<string, unknown>;

    const searchableValues: unknown[] = [
        event.title,
        event.meetingLabel,
        event.leagueName,
        event.date,
        event.time,
        eventRecord.clubName,
        eventRecord.homeClubName,
        eventRecord.awayClubName,
        eventRecord.ownClubName,
        eventRecord.otherClubName,
        eventRecord.homeTeamName,
        eventRecord.awayTeamName,
        eventRecord.teamName,
        eventRecord.opponentTeamName,
        eventRecord.homeTeam,
        eventRecord.awayTeam,
    ];

    event.matches.forEach((match) => {
        const matchRecord = match as Record<string, unknown>;

        searchableValues.push(
            match.ownPlayerName,
            match.otherPlayerName,
            matchRecord.clubName,
            matchRecord.homeClubName,
            matchRecord.awayClubName,
            matchRecord.ownClubName,
            matchRecord.otherClubName,
            matchRecord.homeTeamName,
            matchRecord.awayTeamName,
            matchRecord.teamName,
            matchRecord.opponentTeamName,
            matchRecord.homeTeam,
            matchRecord.awayTeam,
        );
    });

    return searchableValues.some((value) => normalizeSearchText(value).includes(normalizedQuery));
}
