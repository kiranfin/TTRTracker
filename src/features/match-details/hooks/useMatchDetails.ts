import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { ttApi } from '@/src/api/tttracker';
import { useI18n } from '@/src/i18n/I18nProvider';
import type { MeetingDetails } from '../types';
import { formatDateTime, formatLabeledPair, formatLocation, formatStatus, getParam, normalizeMeetingRows, toNumber, unwrapMeetingResponse } from '../utils';

export function useMatchDetails() {
  const { t } = useI18n();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;

  const meetingId = getParam(params.meetingId);

  const [meeting, setMeeting] = useState<MeetingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadMeeting() {
      if (!meetingId) {
        setLoading(false);
        setError(t('match.meetingIdMissing'));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await ttApi.getMeetingLive(meetingId);
        const nextMeeting = unwrapMeetingResponse(response);

        if (!nextMeeting) {
          throw new Error(t('match.unexpectedFormat'));
        }

        if (active) {
          setMeeting(nextMeeting);
        }
      } catch (loadError) {
        if (active) {
          setMeeting(null);
          setError(loadError instanceof Error ? loadError.message : t('match.liveLoadError'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMeeting().catch(() => undefined);

  return () => {
      active = false;
    };
  }, [meetingId, t]);

  const lines = useMemo(() => normalizeMeetingRows(meeting, t), [meeting, t]);
  const singles = useMemo(() => lines.filter((line) => line.type !== 'double'), [lines]);
  const doubles = useMemo(() => lines.filter((line) => line.type === 'double'), [lines]);

  const homeTeam = meeting?.team_home ?? getParam(params.homeTeam) ?? t('match.home');
  const awayTeam = meeting?.team_guest ?? getParam(params.awayTeam) ?? getParam(params.guestTeam) ?? t('match.away');

  const homeMatches = toNumber(meeting?.matches_home);
  const guestMatches = toNumber(meeting?.matches_guest);

  const mainScore =
      homeMatches !== undefined && guestMatches !== undefined
          ? `${homeMatches}:${guestMatches}`
          : 'vs';

  const summaryParts = [
    formatLabeledPair(t('match.sets'), meeting?.sets_home, meeting?.sets_guest),
    formatLabeledPair(t('match.balls'), meeting?.games_home, meeting?.games_guest),
  ].filter(Boolean) as string[];

  const startText = formatDateTime(meeting?.start_date ?? meeting?.scheduled);
  const locationText = formatLocation(meeting);
  const statusText = formatStatus(meeting, t);

  return {
    meeting,
    loading,
    error,
    meetingId,
    lines,
    singles,
    doubles,
    homeTeam,
    awayTeam,
    mainScore,
    summaryParts,
    startText,
    locationText,
    statusText,
  };
}
