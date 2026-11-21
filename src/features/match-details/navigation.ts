import { router } from 'expo-router';

// Was eine Liste von einer Begegnung für die Spielseite mitgeben kann. Alles außer der ID ist optional: fehlt etwas,
// holt sich die Spielseite es aus dem Spielbericht.
export type MatchRouteMatch = {
  id?: string;
  homeTeam?: string;
  awayTeam?: string;
  homeTeamId?: string;
  awayTeamId?: string;
};

// Liga der Begegnung, wenn die Liste sie kennt (Liga- und Mannschaftsseite)
export type MatchRouteContext = {
  title?: string;
  leagueTitle?: string;
  association?: string;
  groupId?: string;
  season?: string;
  leagueSlug?: string;
};

/** Routenparameter der Spielseite. Leere Werte werden als leerer Text übergeben, die Seite behandelt sie als fehlend. */
export function buildMatchRouteParams(match: MatchRouteMatch, context: MatchRouteContext = {}) {
  return {
    meetingId: match.id ?? '',
    homeTeam: match.homeTeam ?? '',
    awayTeam: match.awayTeam ?? '',
    homeTeamId: match.homeTeamId ?? '',
    awayTeamId: match.awayTeamId ?? '',
    leagueTitle: context.leagueTitle ?? context.title ?? '',
    association: context.association ?? '',
    groupId: context.groupId ?? '',
    season: context.season ?? '',
    leagueSlug: context.leagueSlug ?? '',
  };
}

/** Öffnet die Spielseite. Ohne ID passiert nichts. */
export function openMatch(match: MatchRouteMatch, context?: MatchRouteContext) {
  if (!match.id) return;

  router.push({ pathname: '/match/[meetingId]', params: buildMatchRouteParams(match, context) });
}
