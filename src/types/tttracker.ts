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
  person_id?: number | string;
  internal_id?: string;
  licence_club?: string;
  dttb_player_id?: string | number | null;

  firstname?: string;
  lastname?: string;
  firstName?: string;
  lastName?: string;
  club?: string;
  club_name?: string;
  organization?: string;
  organization_short?: string;
  organization_name?: string;

  [key: string]: unknown;
};

export type ClubSearchResult = {
  id?: string;
  name?: string;
  city?: string;
  association?: string;

  external_id?: string;
  clubname?: string;
  clubnr?: string;
  organization_id?: number | string;
  organization_name?: string;
  organization_short?: string;

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
  organization?: string;
  groupId?: string;
  group_id?: string;
  leagueSlug?: string;
  league_slug?: string;
  level?: string;

  [key: string]: unknown;
};

export type PlayerTtrResponse = {
  data: {
    nuid: string;
    available: boolean;
    ttr: number | null;
    error?: unknown | null;
  };
  meta?: {
    source?: string;
  };
};

export type PlayerTtrHistoryResponse = {
  data: {
    nuid: string;
    available: boolean;
    ttr: number | null;
    qttr: number | null;
    maxTtr: number | null;
    ttrDate: string | null;
    maxTtrDate: string | null;
    clubName: string | null;
    personName: string | null;
    events: unknown[];
    error?: unknown | null;
  };
  meta?: {
    source?: string;
  };
};

export type NormalizedTtrHistoryMatch = {
  id: string;
  ownPlayerName?: string;
  otherPlayerName?: string;
  ownTeamName?: string;
  otherTeamName?: string;
  ownSets?: number;
  otherSets?: number;
  otherTtr?: number;
  ownPoints?: number;
  otherPoints?: number;
  expectedResult?: string;
  scheduled?: string;
  setResults: string[];
  raw: unknown;
};

export type NormalizedTtrHistoryEvent = {
  id: string;
  title: string;
  leagueName?: string;
  meetingLabel?: string;
  date?: string;
  time?: string;
  type?: string;
  ttr?: number;
  ttrBefore?: number;
  ttrAfter?: number;
  qttr?: number;
  delta?: number;
  matchCount?: number;
  matchesWon?: string;
  matchesLost?: string;
  matches: NormalizedTtrHistoryMatch[];
  raw: unknown;
};

export type NormalizedPlayerTtrHistory = {
  nuid: string;
  available: boolean;
  ttr?: number;
  qttr?: number;
  maxTtr?: number;
  ttrDate?: string;
  maxTtrDate?: string;
  clubName?: string;
  personName?: string;
  events: NormalizedTtrHistoryEvent[];
};

export type SearchCategory = 'players' | 'clubs';

export type NormalizedPlayer = {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  clubName: string;
  licenceClub?: string;
  organization?: string;
  organizationName?: string;
  state?: string;
  ttr?: number;
  region?: string;
  personId?: string;
  internalId?: string;
  dttbPlayerId?: string;
  raw: PlayerSearchResult;
};

export type NormalizedClub = {
  id: string;
  name: string;
  city?: string;
  region?: string;
  state?: string;
  organization?: string;
  organizationName?: string;
  organizationId?: string;
  clubNumber?: string;
  association?: string;
  externalId?: string;
  raw: ClubSearchResult;
};

export type ClubTeam = {
  id: string;
  teamId?: string;
  teamName: string;
  leagueName: string;
  groupId?: string;
  association?: string;
  season?: string;
  leagueSlug?: string;
  organisation?: string;
  pointsWon?: string;
  pointsLost?: string;
  tableRank?: string;
};

export type LeagueRegion = {
  id: string;
  name: string;
};

export type LeagueReference = {
  id: string;
  name: string;
  season: string;
  level?: string;
  region: string;
  association?: string;
  groupId?: string;
  leagueSlug?: string;
};

export type TableRow = {
  id: string;
  position: string;
  teamName: string;
  clubId?: string;
  matches?: string;
  wins?: string;
  draws?: string;
  losses?: string;
  games?: string;
  points?: string;
  pointsWon?: string;
  pointsLost?: string;
};

export type ScheduleMatchStatus = 'scheduled' | 'completed' | 'postponed' | 'free' | 'live';

export type ScheduleMatch = {
  id?: string;
  date?: string;
  time?: string;
  endTime?: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeClubId?: string;
  awayClubId?: string;
  homeScore?: string;
  awayScore?: string;
  venue?: string;
  city?: string;
  street?: string;
  zip?: string;
  roundName?: string;
  roundType?: string;
  meetingNumber?: string;
  leagueName?: string;
  leagueShortName?: string;
  association?: string;
  confirmed?: boolean;
  complete?: boolean;
  live?: boolean;
  pdfUrl?: string;
  status: ScheduleMatchStatus;
};

export type MeetingMatchLine = {
  id: string;
  type: 'single' | 'double' | 'other';
  homePlayer: string;
  awayPlayer: string;
  result: string;
  sets: string[];
};