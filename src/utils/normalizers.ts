import type {
  ClubSearchResult,
  ClubTeam,
  LeagueReference,
  LeagueSearchResult,
  MeetingMatchLine,
  NormalizedClub,
  NormalizedPlayer,
  NormalizedPlayerTtrHistory,
  NormalizedTtrHistoryEvent,
  NormalizedTtrHistoryMatch,
  PlayerSearchResult,
  PlayerTtrHistoryResponse,
  ScheduleMatch,
  ScheduleMatchStatus,
  TableRow,
} from '../types/tttracker';

type AnyRecord = Record<string, unknown>;

function obj(value: unknown): AnyRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as AnyRecord;
}

function firstValue(...values: unknown[]) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function firstString(...values: unknown[]) {
  const value = firstValue(...values);
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}

function firstNumber(...values: unknown[]) {
  const value = firstValue(...values);
  if (value === undefined || value === null) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function findFirstArray(value: unknown, depth = 0): unknown[] | null {
  if (depth > 7) return null;
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return null;

  const object = value as AnyRecord;

  for (const key of ['results', 'items', 'data', 'league_table', 'players', 'clubs', 'leagues', 'groups', 'rows', 'teams', 'event', 'events']) {
    const nested = findFirstArray(object[key], depth + 1);
    if (nested) return nested;
  }

  for (const nestedValue of Object.values(object)) {
    const nested = findFirstArray(nestedValue, depth + 1);
    if (nested) return nested;
  }

  return null;
}

function rowsFromResponse(value: unknown) {
  return findFirstArray(value) ?? [];
}

function extractIsoDate(value?: string) {
  if (!value) return undefined;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? value;
}

function extractIsoTime(value?: string) {
  if (!value) return undefined;
  const match = value.match(/T(\d{2}):(\d{2})/);
  if (!match) return undefined;
  return `${match[1]}:${match[2]}`;
}

function compactJoin(parts: Array<string | undefined | null>, separator = ', ') {
  return parts
      .map((part) => (part ? String(part).trim() : ''))
      .filter(Boolean)
      .join(separator);
}

export function stateFromAssociation(value?: string) {
  const text = String(value ?? '').toLowerCase();

  if (!text) return undefined;

  if (text.includes('ttbw') || text.includes('baden')) return 'Baden-Württemberg';
  if (text.includes('bttv') || text.includes('bayern')) return 'Bayern';
  if (text.includes('bettv') || text.includes('berlin')) return 'Berlin';
  if (text.includes('brandenburg')) return 'Brandenburg';
  if (text.includes('bremen')) return 'Bremen';
  if (text.includes('hamburg')) return 'Hamburg';
  if (text.includes('httv') || text.includes('hessen')) return 'Hessen';
  if (text.includes('mecklenburg')) return 'Mecklenburg-Vorpommern';
  if (text.includes('ttvn') || text.includes('niedersachsen')) return 'Niedersachsen';
  if (text.includes('wttv') || text.includes('nrw') || text.includes('westdeutsch')) return 'Nordrhein-Westfalen';
  if (text.includes('rheinland')) return 'Rheinland-Pfalz';
  if (text.includes('saarland')) return 'Saarland';
  if (text.includes('sachsen-anhalt')) return 'Sachsen-Anhalt';
  if (text.includes('sachsen')) return 'Sachsen';
  if (text.includes('schleswig')) return 'Schleswig-Holstein';
  if (text.includes('thüringen') || text.includes('thueringen')) return 'Thüringen';

  return undefined;
}

export function normalizePlayer(player: PlayerSearchResult): NormalizedPlayer {
  const raw = obj(player);

  const firstName = firstString(player.firstname, player.firstName, raw.first_name);
  const lastName = firstString(player.lastname, player.lastName, raw.last_name);

  const fullName =
      firstString(player.name) ??
      compactJoin([firstName, lastName], ' ') ??
      'Unbekannter Spieler';

  const personId = firstString(player.person_id, player.personId, player.playerId, raw.personID);
  const internalId = firstString(player.internal_id, raw.internalId, raw.internalID);
  const dttbPlayerId = firstString(player.dttb_player_id, raw.dttbPlayerId);

  const organization = firstString(player.organization_short, player.organization, raw.organization_short);
  const organizationName = firstString(player.organization_name, raw.organization_name);
  const state = stateFromAssociation(organization) ?? stateFromAssociation(organizationName);

  const clubName =
      firstString(player.club_name, player.clubName, player.club, raw.licence_club_name) ??
      firstString(player.licence_club)?.replace(/\s*\(\d+\)\s*$/, '') ??
      'Unbekannter Verein';

  return {
    id: internalId ?? personId ?? dttbPlayerId ?? fullName,
    fullName,
    firstName,
    lastName,
    clubName,
    licenceClub: firstString(player.licence_club),
    organization,
    organizationName,
    state,
    ttr: firstNumber(player.ttr, raw.ttr_value, raw.ttrValue),
    region: state,
    personId,
    internalId,
    dttbPlayerId,
    raw: player,
  };
}

export function normalizeClub(club: ClubSearchResult): NormalizedClub {
  const raw = obj(club);

  const clubNumber = firstString(club.clubnr, club.clubNumber, club.clubId, club.number, raw.club_id);
  const organization = firstString(club.organization_short, club.organization, club.org, raw.team_organisation_short);
  const organizationName = firstString(club.organization_name, club.association, raw.association_name);
  const state = stateFromAssociation(organization) ?? stateFromAssociation(organizationName);

  const name =
      firstString(club.clubname, club.name, raw.club_name, raw.clubName) ??
      'Unbekannter Verein';

  return {
    id: firstString(club.external_id, club.id, clubNumber, name) ?? name,
    name,
    city: firstString(club.city, raw.location, raw.club_city),
    region: state,
    state,
    organization,
    organizationName,
    organizationId: firstString(club.organization_id),
    clubNumber,
    association: organizationName ?? organization,
    externalId: firstString(club.external_id),
    raw: club,
  };
}

export function normalizeTeams(response: unknown): ClubTeam[] {
  return rowsFromResponse(response).map((item, index) => {
    const team = obj(item);

    const teamId = firstString(team.team_id, team.teamId, team.id);
    const groupId = firstString(team.group_id, team.groupId, team.group);
    const season = firstString(team.season, '25/26');
    const association = firstString(team.team_organisation_short, team.organization_short, team.association, team.organization);

    return {
      id: firstString(teamId, groupId, `${index}`) ?? `${index}`,
      teamId,
      teamName: firstString(team.team_name, team.teamName, team.name) ?? 'Unbekannte Mannschaft',
      leagueName: firstString(team.league_name, team.leagueName, team.group_name, team.groupName) ?? 'Unbekannte Liga',
      groupId,
      association,
      season,
      leagueSlug: firstString(team.league_slug, team.leagueSlug, team.slug, 'x'),
      organisation: association,
      pointsWon: firstString(team.points_won, team.pointsWon),
      pointsLost: firstString(team.points_lost, team.pointsLost),
      tableRank: firstString(team.table_rank, team.tableRank, team.rank),
    };
  });
}

export function normalizeLeagues(response: LeagueSearchResult[], region: string): LeagueReference[] {
  const safeResponse = Array.isArray(response) ? response : [];

  return safeResponse.map((item, index) => {
    const league = obj(item);

    const groupId = firstString(
        item.groupId,
        item.group_id,
        league.group,
        league.groupID,
        league.groupId,
        league.urlid,
        league.id
    );

    const name =
        firstString(
            item.name,
            league.league_name,
            league.leagueName,
            league.group_name,
            league.groupName,
            league.title
        ) ??
        (groupId ? `Liga ${groupId}` : 'Unbekannte Liga');

    const association = firstString(
        item.association,
        item.organization,
        league.organisation,
        league.organization,
        league.team_organisation_short,
        league.league_org_short_name,
        league.association_short,
        league.association
    );

    const season = firstString(item.season, league.saison, league.season_name, '25/26') ?? '25/26';

    return {
      id: firstString(item.id, groupId, `${region}-${index}`) ?? `${region}-${index}`,
      name,
      season,
      level: firstString(item.level, league.class_name, league.league_class, league.level, name),
      region: firstString(item.region, league.region, region) ?? region,
      association,
      groupId,
      leagueSlug: firstString(item.leagueSlug, item.league_slug, league.slug, league.league_slug, 'x'),
    };
  });
}

export function normalizeTable(response: unknown): TableRow[] {
  return rowsFromResponse(response).map((item, index) => {
    const row = obj(item);

    const position =
        firstString(row.table_rank, row.tableRank, row.rank, row.position, index + 1) ??
        String(index + 1);

    const clubId = firstString(row.club_id, row.clubId, row.clubnr, row.clubNumber);
    const pointsWon = firstString(row.points_won, row.pointsWon);
    const pointsLost = firstString(row.points_lost, row.pointsLost);

    const matchesWon = firstString(row.matches_won, row.matchesWon);
    const matchesLost = firstString(row.matches_lost, row.matchesLost);
    const matchesRelation = firstString(row.matches_relation, row.matchesRelation);

    return {
      id: firstString(row.team_id, row.teamId, row.id, clubId, `${position}-${index}`) ?? `${position}-${index}`,
      position,
      teamName: firstString(row.team_name, row.teamName, row.name, row.club_name) ?? 'Unbekannte Mannschaft',
      clubId,

      matches: firstString(row.meetings_count, row.matches, row.played, row.meetings, row.games_played),
      wins: firstString(row.meetings_won, row.wins, row.won),
      draws: firstString(row.meetings_tie, row.draws, row.ties),
      losses: firstString(row.meetings_lost, row.losses, row.lost),

      games: firstString(row.games, row.sets, row.matches_ratio, row.match_ratio),
      points:
          firstString(row.points, row.score, row.team_points) ??
          (pointsWon || pointsLost ? `${pointsWon ?? '0'}:${pointsLost ?? '0'}` : undefined),

      pointsWon,
      pointsLost,

      matchesWon,
      matchesLost,
      matchesRelation,
      ratio:
          matchesWon || matchesLost
              ? `${matchesWon ?? '0'}:${matchesLost ?? '0'}`
              : matchesRelation,

      tendency: firstString(row.tendency),
      riseFallState: firstString(row.rise_fall_state, row.riseFallState),
      promotionState:
          firstString(row.promotion_state, row.promotionState) === 'promotion'
              ? 'promotion'
              : firstString(row.promotion_state, row.promotionState) === 'relegation'
                  ? 'relegation'
                  : 'none',
      isExcluded: typeof row.is_excluded === 'boolean' ? row.is_excluded : undefined,
    };
  });
}

function isFreeMatch(homeTeam?: string, awayTeam?: string) {
  const text = `${homeTeam ?? ''} ${awayTeam ?? ''}`.toLowerCase();
  return text.includes('spielfrei');
}

function mapScheduleStatus(state: unknown, live: unknown, homeTeam?: string, awayTeam?: string): ScheduleMatchStatus {
  if (isFreeMatch(homeTeam, awayTeam)) return 'free';
  if (live === true) return 'live';

  const normalized = String(state ?? '').toLowerCase();

  if (normalized === 'done' || normalized === 'completed' || normalized === 'complete') return 'completed';
  if (normalized === 'scheduled' || normalized === 'open' || normalized === 'planned') return 'scheduled';
  if (normalized === 'postponed' || normalized === 'cancelled' || normalized === 'canceled') return 'postponed';

  return 'scheduled';
}

function flattenScheduleMeetings(response: unknown) {
  const root = obj(response);
  const outerData = obj(root.data);
  const innerData = obj(outerData.data);

  const meetingsValue =
      innerData.meetings ??
      outerData.meetings ??
      root.meetings;

  if (!Array.isArray(meetingsValue)) return [];

  const meetings: AnyRecord[] = [];

  meetingsValue.forEach((block) => {
    if (Array.isArray(block)) {
      block.forEach((item) => meetings.push(obj(item)));
      return;
    }

    const blockObject = obj(block);

    Object.values(blockObject).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach((item) => meetings.push(obj(item)));
      } else if (value && typeof value === 'object') {
        meetings.push(obj(value));
      }
    });
  });

  return meetings;
}

export function normalizeSchedule(response: unknown): ScheduleMatch[] {
  return flattenScheduleMeetings(response).map((meeting, index) => {
    const location = obj(meeting.location);

    const homeTeam = firstString(meeting.team_home, meeting.homeTeam, meeting.teamHome, meeting.home) ?? 'Heim';
    const awayTeam = firstString(meeting.team_away, meeting.awayTeam, meeting.teamAway, meeting.away) ?? 'Gast';

    const rawDate = firstString(meeting.date, meeting.start_date, meeting.startDate);
    const rawEndDate = firstString(meeting.end_date, meeting.endDate);

    const venue = compactJoin([
      firstString(location.label),
      firstString(location.street),
      compactJoin([firstString(location.zip), firstString(location.city)], ' '),
    ]);

    return {
      id: firstString(meeting.meeting_id, meeting.meetingId, meeting.id, `${index}`),
      date: extractIsoDate(rawDate),
      time: extractIsoTime(rawDate),
      endTime: extractIsoTime(rawEndDate),
      homeTeam,
      awayTeam,
      homeTeamId: firstString(meeting.team_home_id, meeting.homeTeamId),
      awayTeamId: firstString(meeting.team_away_id, meeting.awayTeamId),
      homeClubId: firstString(meeting.team_home_club_id, meeting.homeClubId),
      awayClubId: firstString(meeting.team_away_club_id, meeting.awayClubId),
      homeScore: firstString(meeting.matches_won, meeting.homeScore, meeting.score_home),
      awayScore: firstString(meeting.matches_lost, meeting.awayScore, meeting.score_away),
      venue: venue || undefined,
      city: firstString(location.city),
      street: firstString(location.street),
      zip: firstString(location.zip),
      roundName: firstString(meeting.round_name, meeting.roundName),
      roundType: firstString(meeting.round_type, meeting.roundType),
      meetingNumber: firstString(meeting.meeting_number, meeting.meetingNumber),
      leagueName: firstString(meeting.league_name, meeting.leagueName),
      leagueShortName: firstString(meeting.league_short_name, meeting.leagueShortName),
      association: firstString(meeting.league_org_short_name, meeting.association),
      confirmed: typeof meeting.is_confirmed === 'boolean' ? meeting.is_confirmed : undefined,
      complete: typeof meeting.is_meeting_complete === 'boolean' ? meeting.is_meeting_complete : undefined,
      live: meeting.live === true || meeting.nu_score_live_enabled === true,
      pdfUrl: firstString(meeting.pdf_url, meeting.pdfUrl),
      status: mapScheduleStatus(meeting.state, meeting.live === true || meeting.nu_score_live_enabled === true, homeTeam, awayTeam),
    };
  });
}

function normalizeHistoryMatch(match: unknown, index: number): NormalizedTtrHistoryMatch {
  const row = obj(match);

  const setResults: string[] = [];

  for (let set = 1; set <= 7; set += 1) {
    const own = firstNumber(row[`own_set${set}`]);
    const other = firstNumber(row[`other_set${set}`]);

    if (
        own !== undefined &&
        other !== undefined &&
        (own > 0 || other > 0)
    ) {
      setResults.push(`${own}:${other}`);
    }
  }

  return {
    id: firstString(row.id, row.match_id, `${index}`) ?? `${index}`,
    ownPlayerName: firstString(row.own_person_name, row.ownPlayerName),
    otherPlayerName: firstString(row.other_person_name, row.otherPlayerName),
    ownTeamName: firstString(row.own_team_name, row.ownTeamName),
    otherTeamName: firstString(row.other_team_name, row.otherTeamName),
    ownSets: firstNumber(row.own_sets, row.ownSets),
    otherSets: firstNumber(row.other_sets, row.otherSets),
    otherTtr: firstNumber(row.other_ttr, row.otherTtr),
    ownPoints: firstNumber(row.own_points, row.ownPoints),
    otherPoints: firstNumber(row.other_points, row.otherPoints),
    expectedResult: firstString(row.expected_result, row.expectedResult),
    scheduled: firstString(row.scheduled),
    setResults,
    raw: match,
  };
}

function normalizeTtrHistoryEvent(event: unknown, index: number): NormalizedTtrHistoryEvent {
  const row = obj(event);

  const rawTitle =
      firstString(
          row.event_name,
          row.eventName,
          row.name,
          row.title,
          row.competition,
          row.tournament,
          row.league_name,
          row.group_name
      ) ?? `Eintrag ${index + 1}`;

  const [rawLeagueName, rawMeetingLabel] = rawTitle.includes('|')
      ? rawTitle.split('|').map((part) => part.trim())
      : [rawTitle, undefined];

  const dateTime = firstString(
      row.event_date_time,
      row.eventDateTime,
      row.date_time,
      row.date,
      row.event_date,
      row.eventDate,
      row.ttr_date,
      row.created_at,
      row.updated_at
  );

  const ttrBefore = firstNumber(row.ttr_before, row.ttrBefore);
  const ttrAfter = firstNumber(row.ttr_after, row.ttrAfter);
  const delta = firstNumber(row.ttr_delta, row.delta, row.change, row.diff);

  const matches = Array.isArray(row.match)
      ? row.match.map(normalizeHistoryMatch)
      : [];

  return {
    id: firstString(row.event_id, row.id, row.match_id, `${index}`) ?? `${index}`,
    title: rawTitle,
    leagueName: rawLeagueName,
    meetingLabel: rawMeetingLabel,
    date: extractIsoDate(dateTime),
    time: extractIsoTime(dateTime),
    type: firstString(row.type),
    ttr: ttrAfter,
    ttrBefore,
    ttrAfter,
    qttr: firstNumber(row.qttr, row.vq_ttr, row.q_ttr),
    delta,
    matchCount: firstNumber(row.match_count, row.matchCount),
    matchesWon: firstString(row.matches_won, row.won, row.wins),
    matchesLost: firstString(row.matches_lost, row.lost, row.losses),
    matches,
    raw: event,
  };
}

export function normalizePlayerTtrHistory(response: PlayerTtrHistoryResponse): NormalizedPlayerTtrHistory {
  const data = response.data;

  const events = Array.isArray(data.events)
      ? data.events
          .map(normalizeTtrHistoryEvent)
          .sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateA - dateB;
          })
      : [];

  return {
    nuid: data.nuid,
    available: data.available,
    ttr: toOptionalNumber(data.ttr),
    qttr: toOptionalNumber(data.qttr),
    maxTtr: toOptionalNumber(data.maxTtr),
    ttrDate: data.ttrDate ?? undefined,
    maxTtrDate: data.maxTtrDate ?? undefined,
    clubName: data.clubName ?? undefined,
    personName: data.personName ?? undefined,
    events,
  };
}

export function normalizeMeetingLines(response: unknown): MeetingMatchLine[] {
  return rowsFromResponse(response).map((item, index) => {
    const line = obj(item);

    return {
      id: firstString(line.id, line.match_id, `${index}`) ?? `${index}`,
      type: String(firstString(line.type, line.match_type, 'other')).includes('double') ? 'double' : 'single',
      homePlayer: firstString(line.home_player, line.homePlayer, line.player_home, line.home) ?? 'Heim',
      awayPlayer: firstString(line.away_player, line.awayPlayer, line.player_away, line.away) ?? 'Gast',
      result: firstString(line.result, line.score, line.matches, '-') ?? '-',
      sets: Array.isArray(line.sets) ? line.sets.map(String) : [],
    };
  });
}

export function formatDate(value?: string) {
  if (!value) return 'Termin offen';

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;

  return `${match[3]}.${match[2]}.${match[1]}`;
}

export function formatTime(value?: string) {
  if (!value) return '';
  return value;
}

export function ttrTone(value?: number): any {
  if (!value) return 'secondary';
  if (value >= 1800) return 'green';
  if (value >= 1500) return 'blue';
  if (value >= 1200) return 'orange';
  return 'secondary';
}

export function levelTone(value?: string): any {
  const text = String(value ?? '').toLowerCase();

  if (text.includes('oberliga') || text.includes('verbands') || text.includes('landes')) return 'green';
  if (text.includes('bezirks')) return 'blue';
  if (text.includes('kreis')) return 'orange';

  return 'secondary';
}

export function matchStatusLabel(status: ScheduleMatchStatus) {
  switch (status) {
    case 'completed':
      return 'Beendet';
    case 'live':
      return 'Live';
    case 'free':
      return 'Spielfrei';
    case 'postponed':
      return 'Verlegt';
    case 'scheduled':
    default:
      return 'Geplant';
  }
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim().replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}