export type FavoriteType = 'player' | 'club' | 'league';

export type FavoriteItem = {
    id: string;
    type: FavoriteType;
    title: string;
    subtitle?: string;
    createdAt: string;
    params?: Record<string, string>;
};

export type HealthResponse = {
    ok: boolean;
    service?: string;
    timestamp?: string;
};

export type PlayerSearchResult = {
    id?: string;
    name?: string;
    clubName?: string;
    ttr?: number;
    ageGroup?: string;

    playerId?: string;
    personId?: string;
    firstname?: string;
    lastname?: string;
    firstName?: string;
    lastName?: string;
    club?: string;
    club_name?: string;
    organization?: string;

    [key: string]: unknown;
};

export type ClubSearchResult = {
    id?: string;
    name?: string;
    city?: string;
    association?: string;

    organization?: string;
    clubNumber?: string;
    clubId?: string;
    number?: string;
    org?: string;

    [key: string]: unknown;
};

export type LeagueSearchResult = {
    id?: string;
    name?: string;
    season?: string;
    region?: string;
    association?: string;
    groupId?: string;
    leagueSlug?: string;

    [key: string]: unknown;
};

export type SearchCategory = 'players' | 'clubs';