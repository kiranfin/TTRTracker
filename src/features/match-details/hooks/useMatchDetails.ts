import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { invalidateApiCache } from '@/src/api/client';
import { ttApi } from '@/src/api/tttracker';
import { useLivePolling } from '@/src/hooks/useLivePolling';
import { useI18n } from '@/src/i18n/I18nProvider';
import { describeApiError } from '@/src/utils/apiErrors';
import { getResponseFreshness, type Freshness } from '@/src/utils/staleness';
import type { MeetingDetails, TeamLinkContext } from '../types';
import { useMatchPreview } from './useMatchPreview';
import { addRunningScore, formatDateTime, formatLabeledPair, formatLocation, formatStatus, getMeetingClub, getParam, normalizeMeetingRows, toNumber, unwrapMeetingResponse } from '../utils';
import { getCurrentSeason } from '@/src/utils/dates';

// Alle 30 Sekunden nachsehen, solange die Begegnung läuft oder gleich beginnt (das Backend hält laufende Spiele eine
// Minute). Der Stand auf dem Gerät darf dabei höchstens 25 Sekunden alt sein, sonst käme nur der Zwischenspeicher zurück.
const POLL_MS = 30 * 1000;
const POLL_MAX_AGE_MS = 25 * 1000;
// Ab wann vor dem Beginn und wie lange danach (ohne gemeldetes Ende) nachgesehen wird.
const POLL_BEFORE_START_MS = 15 * 60 * 1000;
const POLL_AFTER_START_MS = 8 * 60 * 60 * 1000;

export function useMatchDetails() {
  const { t } = useI18n();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;

  const meetingId = getParam(params.meetingId);

  const [meeting, setMeeting] = useState<MeetingDetails | null>(null);
  const [freshness, setFreshness] = useState<Freshness | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  // silent: Der bisherige Stand bleibt stehen, es gibt weder Ladeanzeige noch Fehlermeldung (Polling, Pull to Refresh).
  // Schlägt das still fehl, zeigt die Seite einfach weiter den letzten Stand.
  const loadMeeting = useCallback(
      async (options: { silent?: boolean; maxAgeMs?: number } = {}) => {
        const { silent = false, maxAgeMs } = options;

        if (!meetingId) {
          setLoading(false);
          setError(t('match.meetingIdMissing'));
          return;
        }

        if (!silent) {
          setLoading(true);
          setError(null);
        }

        try {
          const response = await ttApi.getMeetingLive(meetingId, maxAgeMs ? { maxAgeMs } : undefined);
          const nextMeeting = unwrapMeetingResponse(response);

          if (!nextMeeting) {
            throw new Error(t('match.unexpectedFormat'));
          }

          if (mounted.current) {
            setMeeting(nextMeeting);
            setFreshness(getResponseFreshness(response));
            setError(null);
          }
        } catch (loadError) {
          if (mounted.current && !silent) {
            setMeeting(null);
            setError(describeApiError(loadError, t, 'match.liveLoadError'));
          }
        } finally {
          if (mounted.current && !silent) {
            setLoading(false);
          }
        }
      },
      [meetingId, t],
  );

  useEffect(() => {
    loadMeeting().catch(() => undefined);
  }, [loadMeeting]);

  // Ziehen zum Aktualisieren: nicht aus dem Zwischenspeicher, sondern wirklich neu (das Backend hält laufende Spiele
  // höchstens eine Minute).
  const refresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await invalidateApiCache('/api/meetings');
      await loadMeeting({ silent: true });
    } finally {
      if (mounted.current) {
        setRefreshing(false);
      }
    }
  }, [loadMeeting]);

  const isCompleted = Boolean(meeting?.is_completed || meeting?.is_meeting_complete);
  // start_date und scheduled sind UTC Zeitstempel, Date.parse versteht sie direkt.
  const startRaw = meeting?.start_date ?? meeting?.scheduled;
  const parsedStart = startRaw ? Date.parse(startRaw) : Number.NaN;
  const startMs = Number.isFinite(parsedStart) ? parsedStart : null;

  // Ein beendeter Spielbericht ändert sich nicht mehr. Sonst läuft das Polling, solange der Beginn nicht lange her ist.
  // Wann es wirklich nachfragt, entscheidet pollMeeting (erst kurz vor dem Beginn), damit nicht jede Minute neu
  // gerendert werden muss, um den Beginn zu bemerken.
  const shouldPoll = Boolean(meeting) && !isCompleted && (startMs === null || Date.now() <= startMs + POLL_AFTER_START_MS);

  const pollMeeting = () => {
    const live = Boolean(meeting?.live);

    if (!live && startMs !== null && Date.now() < startMs - POLL_BEFORE_START_MS) return;

    loadMeeting({ silent: true, maxAgeMs: POLL_MAX_AGE_MS }).catch(() => undefined);
  };

  useLivePolling(pollMeeting, { enabled: shouldPoll, intervalMs: POLL_MS });

  const lines = useMemo(() => normalizeMeetingRows(meeting, t), [meeting, t]);

  // Doppel werden zuerst gespielt, der laufende Spielstand zählt deshalb über beide Gruppen
  const { doubles, singles } = useMemo(() => {
    const doubleRows = lines.filter((line) => line.type === 'double');
    const singleRows = lines.filter((line) => line.type !== 'double');
    const scored = addRunningScore([...doubleRows, ...singleRows]);

    return {
      doubles: scored.slice(0, doubleRows.length),
      singles: scored.slice(doubleRows.length),
    };
  }, [lines]);

  const homeTeam = meeting?.team_home ?? getParam(params.homeTeam) ?? t('match.home');
  const awayTeam = meeting?.team_guest ?? getParam(params.awayTeam) ?? getParam(params.guestTeam) ?? t('match.away');

  const homeMatches = toNumber(meeting?.matches_home);
  const guestMatches = toNumber(meeting?.matches_guest);

  // Noch nicht gespielte Begegnungen liefern 0:0, dort gehört "vs" hin und kein Ergebnis.
  const hasStarted =
      Boolean(meeting?.live || meeting?.is_completed || meeting?.is_meeting_complete) ||
      (homeMatches ?? 0) + (guestMatches ?? 0) > 0;

  const mainScore =
      hasStarted && homeMatches !== undefined && guestMatches !== undefined
          ? `${homeMatches}:${guestMatches}`
          : 'vs';

  const summaryParts = [
    formatLabeledPair(t('match.sets'), meeting?.sets_home, meeting?.sets_guest),
    formatLabeledPair(t('match.balls'), meeting?.games_home, meeting?.games_guest),
  ].filter(Boolean) as string[];

  const homeWon = homeMatches !== undefined && guestMatches !== undefined && homeMatches > guestMatches;
  const awayWon = homeMatches !== undefined && guestMatches !== undefined && guestMatches > homeMatches;

  const homeClub = getMeetingClub(meeting, 'home');
  const awayClub = getMeetingClub(meeting, 'away');

  // Die Mannschaftsseite ist nur verlinkbar, wenn die Route Team-ID und Liga-Kontext mitgegeben hat.
  function getTeamLink(side: 'home' | 'away'): TeamLinkContext | null {
    const teamId = getParam(side === 'home' ? params.homeTeamId : params.awayTeamId);
    const association = getParam(params.association);
    const groupId = getParam(params.groupId);

    if (!teamId || !association || !groupId) return null;

    return {
      teamId,
      teamName: side === 'home' ? homeTeam : awayTeam,
      leagueTitle: getParam(params.leagueTitle),
      association,
      groupId,
      season: getParam(params.season),
      leagueSlug: getParam(params.leagueSlug),
      club: side === 'home' ? homeClub : awayClub,
    };
  }

  const preview = useMatchPreview({
    enabled: Boolean(meeting) && !hasStarted,
    homeTeamId: getParam(params.homeTeamId),
    awayTeamId: getParam(params.awayTeamId),
    homeTeam,
    awayTeam,
  });

  const homeTeamLink = getTeamLink('home');
  const awayTeamLink = getTeamLink('away');

  function openTeam(link: TeamLinkContext) {
    router.push({
      pathname: '/team/[teamId]',
      params: {
        teamId: link.teamId,
        teamName: link.teamName,
        leagueTitle: link.leagueTitle ?? '',
        association: link.association,
        groupId: link.groupId,
        season: link.season || getCurrentSeason(),
        leagueSlug: link.leagueSlug ?? 'x',
        clubOrganization: link.club?.organization ?? '',
        clubNumber: link.club?.clubNumber ?? '',
        clubLogoUrl: link.club?.logoUrl ?? '',
      },
    });
  }

  const startText = formatDateTime(meeting?.start_date ?? meeting?.scheduled);
  const locationText = formatLocation(meeting);
  const statusText = formatStatus(meeting, t);

  return {
    meeting,
    freshness,
    loading,
    refreshing,
    refresh,
    error,
    meetingId,
    preview,
    lines,
    singles,
    doubles,
    homeTeam,
    awayTeam,
    mainScore,
    homeWon,
    awayWon,
    homeTeamLink,
    awayTeamLink,
    homeClub,
    awayClub,
    openTeam,
    summaryParts,
    startText,
    locationText,
    statusText,
  };
}
