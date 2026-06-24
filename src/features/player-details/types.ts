export type ChartRangeId = '6m' | '12m' | '24m' | 'all';

export type PlayerStats = {
    eventCount: number;
    matchCount: number;
    matchesWon: number;
    ratedMatchCount: number;
    winRate?: number;
    averageDelta?: number;
    bestGain?: number;
    worstLoss?: number;
};

export type ClubRouteParams = {
    clubKey: string;
    title?: string;
    organization?: string;
    organizationName?: string;
    clubNumber?: string;
    state?: string;
    externalId?: string;
};
