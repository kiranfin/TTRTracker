export type FavoriteType = 'player' | 'club' | 'league';

export type FavoriteItem = {
    id: string;
    type: FavoriteType;
    title: string;
    subtitle?: string;
    createdAt: string;
};

export type HealthResponse = {
    ok: boolean;
    service?: string;
    timestamp?: string;
};

export type PlayerSearchResult = {
    id: string;
    name: string;
    clubName?: string;
    ttr?: number;
    ageGroup?: string;
};

export type ClubSearchResult = {
    id: string;
    name: string;
    city?: string;
    association?: string;
};

export type LeagueSearchResult = {
    id: string;
    name: string;
    season?: string;
    region?: string;
};

export type SearchCategory = 'players' | 'clubs' | 'leagues';