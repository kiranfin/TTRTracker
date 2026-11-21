import type { MeetingDetails } from '@/src/features/match-details/types';
import { toNumber, unwrapMeetingResponse } from '@/src/features/match-details/utils';

// Was die Spielplan Listen von einer Begegnung brauchen, um sie live anzuzeigen.
export type LiveMatchLike = {
  id?: string;
  date?: string;
  time?: string;
  status: string;
  homeScore?: string;
  awayScore?: string;
};

export type LiveOverlay = {
  status: 'live' | 'completed';
  homeScore?: string;
  awayScore?: string;
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

// Ab wann vor dem Beginn und wie lange danach eine Begegnung als möglicherweise laufend gilt.
// Ein Mannschaftskampf dauert selten länger als 5 Stunden, der Rest ist Puffer für späte Eingaben.
const BEFORE_START_MS = 15 * MINUTE_MS;
const AFTER_START_MS = 8 * HOUR_MS;
// Ohne Uhrzeit gilt der ganze Tag.
const DAY_MS = 24 * HOUR_MS;

/** Beginn der Begegnung in lokaler Zeit (Datum "2026-10-26", Uhrzeit "20:00"), null ohne Datum. */
export function getMatchStartMs(match: Pick<LiveMatchLike, 'date' | 'time'>): number | null {
  const date = match.date?.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!date) return null;

  const time = match.time?.match(/^(\d{1,2}):(\d{2})/);

  return new Date(
      Number(date[1]),
      Number(date[2]) - 1,
      Number(date[3]),
      time ? Number(time[1]) : 0,
      time ? Number(time[2]) : 0,
  ).getTime();
}

/** Zeitraum, in dem sich nachfragen lohnt: kurz vor Beginn bis einige Stunden danach. */
function isInLiveWindow(match: LiveMatchLike, now: number) {
  const start = getMatchStartMs(match);

  if (start === null) return false;

  const length = match.time ? AFTER_START_MS : DAY_MS;

  return now >= start - BEFORE_START_MS && now <= start + length;
}

/** Kann diese Begegnung gerade laufen? Dann lohnt sich ein Blick in den Spielbericht. */
export function isLiveCandidate(match: LiveMatchLike, now: number) {
  if (!match.id) return false;
  if (match.status !== 'live' && match.status !== 'scheduled') return false;

  return isInLiveWindow(match, now);
}

/**
 * Ob in dieser Liste überhaupt etwas anstehen könnte (heute, gestern Nacht, morgen früh). Grob geprüft, damit
 * Screens mit lauter vergangenen oder weit entfernten Spielen nie zu pollen anfangen.
 */
export function mayHaveLiveMatches(matches: LiveMatchLike[], now: number) {
  return matches.some((match) => {
    if (!match.id || (match.status !== 'live' && match.status !== 'scheduled')) return false;

    const start = getMatchStartMs(match);

    return start !== null && Math.abs(start - now) <= DAY_MS + AFTER_START_MS;
  });
}

/**
 * Laufende zuerst, danach die mit dem nächsten Beginn. Begrenzt, weil jede Begegnung eine eigene Abfrage ist
 * und myTischtennis nur ein Kontingent pro halbe Stunde erlaubt.
 */
export function pickLiveCandidates<T extends LiveMatchLike>(matches: T[], now: number, limit: number) {
  const seen = new Set<string>();

  return matches
      .filter((match) => {
        if (!isLiveCandidate(match, now) || seen.has(match.id!)) return false;

        seen.add(match.id!);

        return true;
      })
      .sort((left, right) => {
        const leftLive = left.status === 'live' ? 0 : 1;
        const rightLive = right.status === 'live' ? 0 : 1;

        if (leftLive !== rightLive) return leftLive - rightLive;

        return Math.abs((getMatchStartMs(left) ?? now) - now) - Math.abs((getMatchStartMs(right) ?? now) - now);
      })
      .slice(0, limit);
}

/** Stand aus dem Spielbericht, null wenn die Begegnung noch nicht begonnen hat (dann bleibt der Spielplan maßgeblich). */
export function meetingToOverlay(meeting: MeetingDetails): LiveOverlay | null {
  const home = toNumber(meeting.matches_home);
  const guest = toNumber(meeting.matches_guest);
  const hasScore = home !== undefined && guest !== undefined;

  const completed = Boolean(meeting.is_completed || meeting.is_meeting_complete);
  // Wie in der Detailseite: 0:0 ist der Platzhalter einer noch nicht begonnenen Begegnung.
  const started = Boolean(meeting.live) || (hasScore && home + guest > 0);

  if (!completed && !started) return null;

  return {
    status: completed ? 'completed' : 'live',
    homeScore: hasScore ? String(home) : undefined,
    awayScore: hasScore ? String(guest) : undefined,
  };
}

export function responseToOverlay(response: unknown): LiveOverlay | null {
  const meeting = unwrapMeetingResponse(response);

  return meeting ? meetingToOverlay(meeting) : null;
}

export function isSameOverlay(left?: LiveOverlay, right?: LiveOverlay) {
  return left?.status === right?.status && left?.homeScore === right?.homeScore && left?.awayScore === right?.awayScore;
}

/** Legt den Live Stand über einen Spielplan Eintrag. Beendete und freie Begegnungen bleiben unverändert. */
export function applyOverlay<T extends LiveMatchLike>(match: T, overlay: LiveOverlay | undefined): T {
  if (!overlay || (match.status !== 'scheduled' && match.status !== 'live')) return match;

  return {
    ...match,
    status: overlay.status,
    homeScore: overlay.homeScore ?? match.homeScore,
    awayScore: overlay.awayScore ?? match.awayScore,
  };
}
