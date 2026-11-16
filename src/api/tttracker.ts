import { buildLocalComparison } from '../features/player-compare/localCompare';
import { ApiError, apiGet } from './client';
import { getLocalMyttCookie } from '../storage/myttSession';
import { withMyttSession } from './myttData';
import { myttDirect } from './myttDirect';
import type {
  ClubSearchResult,
  HealthResponse,
  LeagueAssociation,
  LeagueClassReference,
  LeagueRegion,
  PlayerRatingResponse,
  PlayerSearchResult,
  PlayerTtrEstimateResponse,
  PlayerTtrHistoryResponse,
  PlayerTtrResponse,
  SharedPlayerResponse,
} from '../types/tttracker';
import { getCurrentSeason } from '../utils/dates';

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

// Wie das Backend den Verein des Spielers findet: direkt über Verband und Vereinsnummer oder über den Namen.
export type PlayerLookup = {
  organization?: string;
  clubNumber?: string;
  clubName?: string;
  name?: string;
};

function segment(value: string) {
  return encodeURIComponent(value);
}

// Eine Seite des Vergleichs aus dem Snapshot, den jemand mit dir teilt. null, wenn nichts geteilt wird.
async function loadSharedSide(nuid: string) {
  const shared = await ttApi.getSharedPlayer(nuid).catch(() => null);
  const data = shared?.data;

  if (!data || (!data.ttr && !data.history)) return null;

  const fetchedAt = Math.min(
      ...[data.ttr?.fetchedAt, data.history?.fetchedAt].map((value) => Date.parse(value ?? '')).filter(Number.isFinite),
  );

  const ttr: PlayerTtrResponse = {
    data: data.ttr ?? { nuid, available: false, ttr: data.history?.ttr ?? null, error: null },
    meta: { source: 'snapshot', fetchedAt: data.ttr?.fetchedAt },
  };

  // Ohne Freigabe für den Verlauf bleibt dieser Teil leer, der Rest des Vergleichs steht.
  const history: PlayerTtrHistoryResponse = {
    data: data.history ?? {
      nuid,
      available: false,
      ttr: data.ttr?.ttr ?? null,
      qttr: null,
      maxTtr: null,
      ttrDate: null,
      maxTtrDate: null,
      clubName: null,
      personName: null,
      events: [],
      error: 'NOT_SHARED',
    },
    meta: { source: 'snapshot', fetchedAt: data.history?.fetchedAt },
  };

  return { ttr, history, fetchedAt };
}

// Vergleich ohne eigene myTischtennis Verbindung: beide Seiten müssen jemand mit dir teilen.
// Head-to-Head gibt es nur mit eigenem Login, deshalb bleibt er leer.
async function compareFromSnapshots(leftNuid: string, rightNuid: string) {
  const [left, right] = await Promise.all([loadSharedSide(leftNuid), loadSharedSide(rightNuid)]);

  if (!left || !right) {
    throw new ApiError('Für diesen Vergleich fehlt eine myTischtennis-Verbindung.', 401, 'MYTT_ACCOUNT_REQUIRED');
  }

  return {
    data: buildLocalComparison({
      leftNuid,
      rightNuid,
      leftTtr: left.ttr,
      rightTtr: right.ttr,
      leftHistory: left.history,
      rightHistory: right.history,
      headToHead: null,
    }),
    meta: { source: 'snapshot', fetchedAt: new Date(Math.min(left.fetchedAt, right.fetchedAt)).toISOString() },
  };
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

  // Aktueller TTR mit myTischtennis Login: holt nur das Gerät (kein Cookie: MYTT_ACCOUNT_REQUIRED).
  getPlayerTtr(nuid: string) {
    return withMyttSession({
      key: `ttr:${nuid}`,
      snapshot: { kind: 'ttr', nuid },
      direct: (cookie) => myttDirect.getPlayerTtr(cookie, nuid),
    });
  },

  // Öffentlicher TTR aus der Vereinsliste, ohne myTischtennis Verbindung.
  getPlayerRating(nuid: string, lookup: PlayerLookup) {
    return apiGet<PlayerRatingResponse>(`/api/players/${segment(nuid)}/rating`, lookup);
  },

  // Geschätzter TTR und Verlauf aus öffentlichen Spielberichten, ohne myTischtennis Verbindung.
  getPlayerTtrEstimate(nuid: string, lookup: PlayerLookup) {
    return apiGet<PlayerTtrEstimateResponse>(`/api/players/${segment(nuid)}/ttr-estimate`, lookup);
  },

  // Verlauf mit myTischtennis Login: holt nur das Gerät (kein Cookie: MYTT_ACCOUNT_REQUIRED).
  getPlayerTtrHistory(nuid: string) {
    return withMyttSession({
      key: `ttr-history:${nuid}`,
      snapshot: { kind: 'history', nuid },
      direct: (cookie) => myttDirect.getPlayerTtrHistory(cookie, nuid),
    });
  },

  // Was jemand mit dir teilt: Snapshot des Besitzers (Stand, Besitzername), je nach Freigabe mit TTR und Verlauf.
  getSharedPlayer(nuid: string) {
    return apiGet<SharedPlayerResponse>(`/api/shared/players/${segment(nuid)}`, undefined, {
      authenticated: true,
    });
  },

  async comparePlayers(leftNuid: string, rightNuid: string) {
    // Ohne eigene Verbindung vergleichen die Snapshots, die andere mit dir teilen (ohne Head-to-Head).
    if (!(await getLocalMyttCookie())) {
      return compareFromSnapshots(leftNuid, rightNuid);
    }

    return withMyttSession<unknown>({
      key: `compare:${leftNuid}:${rightNuid}`,
      direct: async (cookie) => {
        const [leftTtr, rightTtr, leftHistory, rightHistory] = await Promise.all([
          myttDirect.getPlayerTtr(cookie, leftNuid),
          myttDirect.getPlayerTtr(cookie, rightNuid),
          myttDirect.getPlayerTtrHistory(cookie, leftNuid),
          myttDirect.getPlayerTtrHistory(cookie, rightNuid),
        ]);

        // Head-to-Head ist optional, ein Fehler dort lässt den Rest des Vergleichs stehen.
        const headToHead = await myttDirect
            .getHeadToHead(cookie, rightNuid.replace(/^NU/i, ''))
            .catch((error) => {
              if (error instanceof ApiError && error.code === 'MYTT_AUTH_EXPIRED') throw error;

              return null;
            });

        return {
          data: buildLocalComparison({ leftNuid, rightNuid, leftTtr, rightTtr, leftHistory, rightHistory, headToHead }),
          meta: { source: 'device' },
        };
      },
    });
  },

  async getLeaguesByRegion(region: string, season = getCurrentSeason()) {
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

  // Logos für mehrere Vereine, refs im Format "TTBW:2055064" (höchstens 30). Siehe storage/clubLogos.
  getClubLogos(refs: string[]) {
    return apiGet<unknown>('/api/clubs/logos', { clubs: refs.join(',') });
  },

  // Logo, Gründungsjahr, Spiellokale, Kontakt und Vorstand (aufbereitet im Backend).
  getClubInfo(organization: string, clubNumber: string, season = getCurrentSeason(), clubSlug = 'x') {
    const query: Record<string, string> = {
      season: season.replace('/', '--'),
    };

    if (clubSlug?.trim() && clubSlug.trim() !== 'x') {
      query.clubSlug = clubSlug.trim();
    }

    return apiGet<unknown>(`/api/clubs/${segment(organization)}/${segment(clubNumber)}/info`, query);
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
      season = getCurrentSeason().replace('/', '--'),
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

  async getLeagueRegions(association: string, season = getCurrentSeason()) {
    const response = await apiGet<unknown>(
        `/api/leagues/${segment(association)}/regions`,
        { season }
    );

    return normalizeList<LeagueRegion>(response);
  },

  async getLeagueClasses(
      association: string,
      championship: string,
      season = getCurrentSeason(),
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