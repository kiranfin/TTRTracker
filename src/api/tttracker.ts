import { apiGet } from './client';
import type {
    ClubSearchResult,
    HealthResponse,
    LeagueSearchResult,
    PlayerSearchResult,
} from '../types/tttracker';

export const ttApi = {
    health() {
        return apiGet<HealthResponse>('/health');
    },

    searchPlayers(query: string) {
        return apiGet<PlayerSearchResult[]>('/players/search', { q: query });
    },

    searchClubs(query: string) {
        return apiGet<ClubSearchResult[]>('/clubs/search', { q: query });
    },

    searchLeagues(query: string) {
        return apiGet<LeagueSearchResult[]>('/leagues/search', { q: query });
    },

    getPlayer(id: string) {
        return apiGet<Record<string, unknown>>(`/players/${id}`);
    },

    getClub(id: string) {
        return apiGet<Record<string, unknown>>(`/clubs/${id}`);
    },

    getLeague(id: string) {
        return apiGet<Record<string, unknown>>(`/leagues/${id}`);
    },

    getMatch(id: string) {
        return apiGet<Record<string, unknown>>(`/matches/${id}`);
    },
};