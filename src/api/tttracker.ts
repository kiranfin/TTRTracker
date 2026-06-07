import { apiGet } from './client';
import type {
  ClubSearchResult,
  HealthResponse,
  LeagueAssociation,
  LeagueClassReference,
  LeagueRegion,
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
    return apiGet<PlayerTtrResponse>(
        `/api/players/${segment(nuid)}/ttr`,
        undefined,
        { authenticated: true }
    );
  },

  getPlayerTtrHistory(nuid: string) {
    return apiGet<PlayerTtrHistoryResponse>(
        `/api/players/${segment(nuid)}/ttr-history`,
        undefined,
        { authenticated: true }
    );
  },

  comparePlayers(leftNuid: string, rightNuid: string) {
    return apiGet<unknown>(
        `/api/players/${segment(leftNuid)}/compare/${segment(rightNuid)}`,
        undefined,
        { authenticated: true }
    );
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

  getClubPlayers(
      organization: string,
      clubNumber: string,
      clubName?: string,
      androClubNr?: string
  ) {
    const query: Record<string, string> = {};

    if (clubName?.trim()) {
      query.clubName = clubName.trim();
    }

    if (androClubNr?.trim()) {
      query.androClubNr = androClubNr.trim();
    }

    return apiGet<unknown>(
        `/api/clubs/${segment(organization)}/${segment(clubNumber)}/players`,
        Object.keys(query).length > 0 ? query : undefined
    );
  },

  getClubSchedule(
      organization: string,
      clubNumber: string,
      season = '25--26',
      dateStart?: string,
      dateEnd?: string,
      clubSlug = 'x'
  ) {
    const query: Record<string, string> = {
      season,
    };

    if (dateStart?.trim()) {
      query.dateStart = dateStart.trim();
    }

    if (dateEnd?.trim()) {
      query.dateEnd = dateEnd.trim();
    }

    if (clubSlug?.trim() && clubSlug.trim() !== 'x') {
      query.clubSlug = clubSlug.trim();
    }

    return apiGet<unknown>(
        `/api/clubs/${segment(organization)}/${segment(clubNumber)}/schedule`,
        query
    );
  },

  getLeagueTable(
      association: string,
      season: string,
      groupId: string,
      leagueSlug = 'x',
      filter: 'vr' | 'rr' | 'gesamt' = 'gesamt'
  ) {
    return apiGet<unknown>(
        `/api/leagues/${segment(association)}/${segment(season)}/${segment(groupId)}/table`,
        {
          leagueSlug,
          filter,
        }
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

  async getLeagueAssociations() {
    const response = await apiGet<unknown>('/api/leagues/associations');
    return normalizeList<LeagueAssociation>(response);
  },

  async getLeagueRegions(association: string, season = '25/26') {
    const response = await apiGet<unknown>(
        `/api/leagues/${segment(association)}/regions`,
        { season }
    );

    return normalizeList<LeagueRegion>(response);
  },

  async getLeagueClasses(
      association: string,
      championship: string,
      season = '25/26',
      type: 'ligen' | 'pokalspiele' = 'ligen'
  ) {
    const response = await apiGet<unknown>(
        `/api/leagues/${segment(association)}/classes`,
        {
          season,
          championship,
          type,
        }
    );

    return normalizeList<LeagueClassReference>(response);
  },

  getTeamPlayers(teamId: string) {
    return apiGet<unknown>(`/api/teams/${segment(teamId)}/players`);
  },

  getTeamInfos(
      association: string,
      season: string,
      groupId: string,
      leagueSlug = 'x',
      teamId: string,
      teamNameSlug = 'x'
  ) {
    return apiGet<unknown>(
        `/api/teams/${segment(association)}/${segment(season)}/${segment(groupId)}/${segment(teamId)}/infos`,
        {
          leagueSlug,
          teamNameSlug,
        }
    );
  },

  getTeamSchedule(
      association: string,
      season: string,
      groupId: string,
      leagueSlug = 'x',
      teamId: string,
      teamNameSlug = 'x',
      filter: 'vr' | 'rr' | 'gesamt' = 'gesamt'
  ) {
    return apiGet<unknown>(
        `/api/teams/${segment(association)}/${segment(season)}/${segment(groupId)}/${segment(teamId)}/schedule`,
        {
          leagueSlug,
          teamNameSlug,
          filter,
        }
    );
  },

  getTeamBalances(
      association: string,
      season: string,
      groupId: string,
      leagueSlug = 'x',
      teamId: string,
      teamNameSlug = 'x',
      filter: 'vr' | 'rr' | 'gesamt' = 'gesamt'
  ) {
    return apiGet<unknown>(
        `/api/teams/${segment(association)}/${segment(season)}/${segment(groupId)}/${segment(teamId)}/balances`,
        {
          leagueSlug,
          teamNameSlug,
          filter,
        }
    );
  },
};