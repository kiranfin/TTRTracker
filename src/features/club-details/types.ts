import { ttApi } from '@/src/api/tttracker';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { ScheduleMatch } from '@/src/types/tttracker';

export type ClubTab = 'teams' | 'players' | 'schedule';

export type ClubPlayer = {
    id?: string;
    nuid?: string;
    ttr?: string;
    qttr?: string;
    name: string;
    teamName?: string;
    leagueName?: string;
    clubName?: string;
    association?: string;
    country?: string;
    rank?: string;
    lastYearNoGame?: string;
    globalRank?: string;
    nationalRank?: string;
    matchCount?: string;
};

// Adresse eines Spiellokals oder die Kontaktadresse des Vereins.
export type ClubAddress = {
    label?: string;
    name?: string;
    street?: string;
    zipcode?: string;
    city?: string;
    website?: string;
    note?: string;
    email?: string;
    phone?: string;
};

export type ClubOfficial = {
    role?: string;
    name: string;
    email?: string;
    phone?: string;
};

export type ClubInfo = {
    clubName?: string;
    logoUrl?: string;
    region?: string;
    foundationYear?: number;
    organizationName?: string;
    contact?: ClubAddress;
    venues: ClubAddress[];
    officials: ClubOfficial[];
};

export type ClubScheduleMatch = ScheduleMatch & {
    clubTeamName?: string;
    leagueName?: string;
};

export type ScheduleDateGroup = {
    dateKey: string;
    dateLabel: string;
    matches: ClubScheduleMatch[];
};

export type RichObject = Record<string, unknown>;

export type ClubApiWithOptionalEndpoints = typeof ttApi & {
    getClubPlayers?: (
        organization: string,
        clubNumber: string,
        clubName?: string,
        androClubNr?: string,
    ) => Promise<unknown>;
    getClubSchedule?: (
        organization: string,
        clubNumber: string,
        season: string,
        dateStart?: string,
        dateEnd?: string,
    ) => Promise<unknown>;
};

export type ThemeColors = ReturnType<typeof useTheme>['colors'];
