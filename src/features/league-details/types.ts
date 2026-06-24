import { useTheme } from '@/src/theme/ThemeProvider';
import type { ScheduleMatch, TableRow } from '@/src/types/tttracker';

export type DetailTab = 'table' | 'matches';

export type SchedulePeriodFilter = 'all' | 'past30' | 'next30';

export type ScheduleRound = 'vr' | 'rr';

export type RoundFilter = 'all' | ScheduleRound;

export type EnrichedScheduleMatch = ScheduleMatch & {
    scheduleRound: ScheduleRound;
};

export type TeamScheduleStats = {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    tablePointsWon: number;
    tablePointsLost: number;
    matchesWon: number;
    matchesLost: number;
};

export type RichTableRow = TableRow & Record<string, unknown>;

export type LeagueInfo = {
    title: string;
    association?: string;
    groupId?: string;
    season: string;
    leagueSlug: string;
    favoriteId: string;
};

export type PromotionState = 'promotion' | 'relegation' | 'none';

export type ThemeColors = ReturnType<typeof useTheme>['colors'];
