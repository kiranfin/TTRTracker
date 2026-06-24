import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ttApi } from '@/src/api/tttracker';

export type DetailTab = 'infos' | 'lineup' | 'schedule' | 'balances';

export type RoundFilter = 'gesamt' | 'vr' | 'rr';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export type TeamApiClient = typeof ttApi & {
    getTeamPlayers?: (teamId: string) => Promise<unknown>;
    getPlayerTtr?: (nuid: string) => Promise<unknown>;
    getTeamInfos?: (
        association: string,
        season: string,
        groupId: string,
        leagueSlug: string,
        teamId: string,
        teamNameSlug: string,
    ) => Promise<unknown>;
    getTeamSchedule?: (
        association: string,
        season: string,
        groupId: string,
        leagueSlug: string,
        teamId: string,
        teamNameSlug: string,
        filter: RoundFilter,
    ) => Promise<unknown>;
    getTeamBalances?: (
        association: string,
        season: string,
        groupId: string,
        leagueSlug: string,
        teamId: string,
        teamNameSlug: string,
        filter: RoundFilter,
    ) => Promise<unknown>;
};

export type TeamInfo = {
    headInfos?: Record<string, string>;
    contact?: Record<string, string>;
    venue?: Record<string, string>;
    venues?: Record<string, string>[];
    clubContact?: Record<string, string>;
    teamPhotoUrl?: string;
    remarks?: string;
    pdfVersionUrl?: string;
    pdfMaterialsUrl?: string;
};

export type TeamPlayer = {
    id?: string;
    firstname?: string;
    lastname?: string;
    name: string;
    rank?: string;
    teamNumber?: string;
    qttr?: string;
    status?: string;
    foreignerType?: string;
};

export type TeamScheduleMatch = {
    id?: string;
    date?: string;
    time?: string;
    status: 'scheduled' | 'completed' | 'free';
    homeTeam: string;
    awayTeam: string;
    homeTeamId?: string;
    awayTeamId?: string;
    homeScore?: string;
    awayScore?: string;
    ownScore?: string;
    opponentScore?: string;
    locationLabel?: string;
    locationCity?: string;
    roundType?: string;
    roundName?: string;
};

export type TeamBalance = {
    playerId?: string;
    firstname?: string;
    lastname?: string;
    name: string;
    meetingsCount?: string;
    pointsWon?: string;
    pointsLost?: string;
    quote?: number;
    rank?: string;
    teamNumber?: string;
    singleStats: BalanceSplitStat[];
};

export type BalanceSplitStat = {
    opponentRank?: string;
    pointsWon?: string;
    pointsLost?: string;
};

export type TeamContext = {
    teamId: string;
    teamName: string;
    teamNameSlug: string;
    leagueTitle?: string;
    association?: string;
    groupId?: string;
    season: string;
    apiSeason: string;
    leagueSlug: string;
};

export type ScheduleSummary = {
    played: number;
    open: number;
    wins: number;
    draws: number;
    losses: number;
    nextMatch?: TeamScheduleMatch;
};
