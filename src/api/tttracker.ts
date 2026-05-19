import { apiGet } from './client';
import type {
  ClubSearchResult,
  HealthResponse,
  PlayerSearchResult,
  PlayerTtrHistoryResponse,
  PlayerTtrResponse,
} from '../types/tttracker';

function findFirstArray(value: unknown, depth = 0): unknown[] | null {
  if (depth > 6) return null;
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return null;

  const object = value as Record<string, unknown>;

  for (const key of ['items', 'results', 'data', 'players', 'clubs', 'leagues', 'groups', 'rows', 'teams']) {
    const nested = findFirstArray(object[key], depth + 1);
    if (nested) return nested;
  }

  for (const nestedValue of Object.values(object)) {
    const nested = findFirstArray(nestedValue, depth + 1);
    if (nested) return nested;
  }

  return null;
}

function normalizeList<T>(response: unknown): T[] {
  const array = findFirstArray(response);
  return array ? (array as T[]) : [];
}

function segment(value: string) {
  return encodeURIComponent(value);
}

export const ttApi = {
  health() {
    return apiGet<HealthResponse>('/health');
  },

  async searchPlayers(query: string) {
    const response = await apiGet<unknown>('/api/search/players', {
      q: query,
      page: 1,
      pagesize: 8,
    });

    return normalizeList<PlayerSearchResult>(response);
  },

  async searchClubs(query: string) {
    const response = await apiGet<unknown>('/api/search/clubs', {
      q: query,
      page: 1,
      pagesize: 8,
    });

    return normalizeList<ClubSearchResult>(response);
  },

  getPlayerTtr(nuid: string) {
    return apiGet<PlayerTtrResponse>(`/api/players/${segment(nuid)}/ttr`);
  },

  getPlayerTtrHistory(nuid: string) {
    return apiGet<PlayerTtrHistoryResponse>(`/api/players/${segment(nuid)}/ttr-history`);
  },

  async getLeaguesByRegion(region: string, season = '25/26') {
    const response = await apiGet<unknown>('/api/leagues', {
      region,
      season,
      page: 1,
      pagesize: 80,
    });

    return normalizeList(response);
  },

  getClubTeams(organization: string, clubNumber: string) {
    return apiGet<unknown>(
        `/api/clubs/${segment(organization)}/${segment(clubNumber)}/teams`
    );
  },

  getLeagueTable(association: string, groupId: string) {
    return apiGet<unknown>(
        `/api/leagues/${segment(association)}/${segment(groupId)}/table`
    );
  },

  getLeagueSchedule(
      association: string,
      season: string,
      groupId: string,
      leagueSlug = 'x',
      filter: 'vr' | 'rr' | 'gesamt' = 'gesamt'
  ) {
    return apiGet<unknown>(
        `/api/leagues/${segment(association)}/${segment(season)}/${segment(groupId)}/schedule`,
        {
          leagueSlug,
          filter,
        }
    );
  },

  getMeetingLive(meetingId: string) {
    return apiGet<unknown>(`/api/meetings/${segment(meetingId)}/live`);
  },
};