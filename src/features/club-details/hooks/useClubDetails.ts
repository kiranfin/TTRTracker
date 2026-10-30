import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { ttApi } from '@/src/api/tttracker';
import { useApiUpdates } from '@/src/hooks/useApiUpdates';
import { useI18n } from '@/src/i18n/I18nProvider';
import { addFavorite, isFavorite, removeFavorite } from '@/src/storage/favorites';
import { clearMeClub, getMeClub, setMeClub } from '@/src/storage/meClub';
import type { MeClub } from '@/src/storage/meClub';
import type { ClubTeam } from '@/src/types/tttracker';
import { describeApiError } from '@/src/utils/apiErrors';
import { normalizeTeams } from '@/src/utils/normalizers';
import type { Freshness } from '@/src/utils/staleness';
import type { ClubApiWithOptionalEndpoints, ClubInfo, ClubPlayer, ClubScheduleMatch, ClubTab } from '../types';
import {
  CLUB_FAVORITE_TYPE,
  emptyToUndefined,
  getClubFavoriteIds,
  getDefaultSeasonDateRange,
  getInitialSeason,
  getTimeValue,
  groupScheduleByDate,
  isValidDateInput,
  loadClubPlayers,
  loadClubSchedule,
  normalizeClubInfo,
  parseClubKey,
  parseMatchDate,
  startOfDay,
  summarizeClub,
} from '../utils';

// all: ganze Saison, upcoming/past: relativ zu heute, custom: frei gewählter Zeitraum
export type ScheduleFilter = 'all' | 'upcoming' | 'past' | 'custom';

export function isUpcomingMatch(match: ClubScheduleMatch) {
  if (match.status !== 'scheduled' && match.status !== 'live') return false;

  const date = parseMatchDate(match.date);
  if (!date) return false;

  return date.getTime() >= startOfDay(new Date()).getTime();
}

function isPastMatch(match: ClubScheduleMatch) {
  const date = parseMatchDate(match.date);
  if (!date) return false;

  return date.getTime() < startOfDay(new Date()).getTime() || match.status === 'completed';
}

export function useClubDetails() {
  const params = useLocalSearchParams<Record<string, string>>();
  const { t } = useI18n();

  const initialSeason = getInitialSeason(params.season);
  const initialDateRange = getDefaultSeasonDateRange(initialSeason);

  const [activeTab, setActiveTab] = useState<ClubTab>('teams');
  const [teams, setTeams] = useState<ClubTeam[]>([]);
  const [players, setPlayers] = useState<ClubPlayer[]>([]);
  const [scheduleMatches, setScheduleMatches] = useState<ClubScheduleMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamsLoaded, setTeamsLoaded] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playersError, setPlayersError] = useState<string | null>(null);
  // Stand der Rangliste, wenn sie aus einem älteren Stand kommt (sonst null).
  const [playersFreshness, setPlayersFreshness] = useState<Freshness | null>(null);
  const [scheduleFreshness, setScheduleFreshness] = useState<Freshness | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [dateStartDraft, setDateStartDraft] = useState(initialDateRange.dateStart);
  const [dateEndDraft, setDateEndDraft] = useState(initialDateRange.dateEnd);
  const [appliedDateStart, setAppliedDateStart] = useState(initialDateRange.dateStart);
  const [appliedDateEnd, setAppliedDateEnd] = useState(initialDateRange.dateEnd);
  const [scheduleFilter, setScheduleFilter] = useState<ScheduleFilter>('all');
  const [info, setInfo] = useState<ClubInfo | null>(null);

  const [savedMeClub, setSavedMeClub] = useState<MeClub | null>(null);
  const [meClubChecked, setMeClubChecked] = useState(false);
  const [meClubLoading, setMeClubLoading] = useState(false);
  const [favoriteClubLoading, setFavoriteClubLoading] = useState(false);
  const [isFavoriteClub, setIsFavoriteClub] = useState(false);

  const parsedClubKey = useMemo(() => parseClubKey(params.clubKey), [params.clubKey]);

  const title = emptyToUndefined(params.title) ?? emptyToUndefined(params.clubName) ?? t('club.defaultTitle');
  const organization = emptyToUndefined(params.organization) ?? parsedClubKey.organization;
  const clubNumber = emptyToUndefined(params.clubNumber) ?? parsedClubKey.clubNumber;
  const clubNameForPlayers = emptyToUndefined(params.clubName) ?? emptyToUndefined(params.title);
  const clubFavoriteIds = useMemo(
      () => getClubFavoriteIds(organization, clubNumber, params.clubKey),
      [organization, clubNumber, params.clubKey],
  );
  const clubFavoriteId = clubFavoriteIds[0] ?? '';

  // Hinweis "Als meinen Verein festlegen" nur, solange noch gar kein Verein gespeichert ist.
  const canClaimClub = meClubChecked && !savedMeClub;
  const isMyClub =
      Boolean(organization && clubNumber && savedMeClub) &&
      savedMeClub?.organization === organization &&
      savedMeClub?.clubNumber === clubNumber;

  const scheduleSeason = useMemo(
      () => getInitialSeason(params.season ?? teams[0]?.season),
      [params.season, teams],
  );

  useEffect(() => {
    const defaultRange = getDefaultSeasonDateRange(scheduleSeason);

    setDateStartDraft(defaultRange.dateStart);
    setDateEndDraft(defaultRange.dateEnd);
    setAppliedDateStart(defaultRange.dateStart);
    setAppliedDateEnd(defaultRange.dateEnd);
  }, [scheduleSeason]);

  useEffect(() => {
    async function load() {
      if (!organization || !clubNumber) {
        setLoading(false);
        setTeamsLoaded(false);
        setError(t('club.missingClubData'));
        return;
      }

      setLoading(true);
      setTeamsLoaded(false);
      setError(null);
      setPlayersError(null);
      setScheduleError(null);
      setTeams([]);
      setPlayers([]);
      setPlayersFreshness(null);
      setScheduleMatches([]);

      try {
        const teamsResponse = await ttApi.getClubTeams(organization, clubNumber);
        const normalizedTeams = normalizeTeams(teamsResponse);

        setTeams(normalizedTeams);
        setTeamsLoaded(true);

        const clubApi = ttApi as ClubApiWithOptionalEndpoints;

        try {
          const playersResult = await loadClubPlayers(clubApi, organization, clubNumber, clubNameForPlayers);
          setPlayers(playersResult.players);
          setPlayersFreshness(playersResult.freshness);
        } catch (playersLoadError) {
          setPlayers([]);
          setPlayersError(describeApiError(playersLoadError, t, 'club.playersLoadError'));
        }
      } catch (loadError) {
        setError(describeApiError(loadError, t, 'club.clubDataLoadError'));
        setTeamsLoaded(false);
      } finally {
        setLoading(false);
      }
    }

    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, clubNumber, clubNameForPlayers]);

  useEffect(() => {
    async function loadScheduleForFilter() {
      if (!organization || !clubNumber || !teamsLoaded || error) return;

      if (!isValidDateInput(appliedDateStart) || !isValidDateInput(appliedDateEnd)) {
        setScheduleMatches([]);
        setScheduleError(t('club.invalidDateRange'));
        return;
      }

      setScheduleLoading(true);
      setScheduleError(null);

      try {
        const clubApi = ttApi as ClubApiWithOptionalEndpoints;
        const result = await loadClubSchedule(clubApi, organization, clubNumber, teams, {
          season: scheduleSeason,
          dateStart: appliedDateStart,
          dateEnd: appliedDateEnd,
        });

        setScheduleMatches(result.matches);
        setScheduleFreshness(result.freshness);
      } catch (loadError) {
        setScheduleMatches([]);
        setScheduleFreshness(null);
        setScheduleError(describeApiError(loadError, t, 'club.scheduleLoadError'));
      } finally {
        setScheduleLoading(false);
      }
    }

    loadScheduleForFilter().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, clubNumber, teams, teamsLoaded, error, scheduleSeason, appliedDateStart, appliedDateEnd]);

  // Hat die App Spieler oder Spielplan im Hintergrund aktualisiert, still neu lesen (kommt aus dem Zwischenspeicher).
  const clubPath = organization && clubNumber ? `/api/clubs/${encodeURIComponent(organization)}/${encodeURIComponent(clubNumber)}` : null;

  useApiUpdates(clubPath ? `${clubPath}/players` : null, () => {
    if (!organization || !clubNumber) return;

    loadClubPlayers(ttApi as ClubApiWithOptionalEndpoints, organization, clubNumber, clubNameForPlayers)
        .then((result) => {
          setPlayers(result.players);
          setPlayersFreshness(result.freshness);
        })
        .catch(() => undefined);
  });

  useApiUpdates(clubPath ? `${clubPath}/schedule` : null, () => {
    if (!organization || !clubNumber || !teamsLoaded || !isValidDateInput(appliedDateStart) || !isValidDateInput(appliedDateEnd)) return;

    loadClubSchedule(ttApi as ClubApiWithOptionalEndpoints, organization, clubNumber, teams, {
      season: scheduleSeason,
      dateStart: appliedDateStart,
      dateEnd: appliedDateEnd,
    })
        .then((result) => {
          setScheduleMatches(result.matches);
          setScheduleFreshness(result.freshness);
        })
        .catch(() => undefined);
  });

  // Vereinsinfos laufen neben Mannschaften und Spielern. Fehlt etwas, zeigt der Kopf einfach weniger.
  useEffect(() => {
    let active = true;

    setInfo(null);
    if (!organization || !clubNumber) return;

    ttApi
        .getClubInfo(organization, clubNumber, initialSeason, params.clubSlug)
        .then((response) => {
          if (active) setInfo(normalizeClubInfo(response));
        })
        .catch(() => undefined);

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, clubNumber]);

  const summary = useMemo(() => summarizeClub(teams, players), [teams, players]);

  useEffect(() => {
    let active = true;

    getMeClub()
        .then((stored) => {
          if (active) setSavedMeClub(stored);
        })
        .catch(() => {
          if (active) setSavedMeClub(null);
        })
        .finally(() => {
          if (active) setMeClubChecked(true);
        });

    return () => {
      active = false;
    };
  }, [organization, clubNumber]);

  useEffect(() => {
    let active = true;

    if (!clubFavoriteId) {
      setIsFavoriteClub(false);
      return;
    }

    Promise.all(clubFavoriteIds.map((candidateId) => isFavorite(CLUB_FAVORITE_TYPE, candidateId)))
        .then((checks) => {
          if (active) setIsFavoriteClub(checks.some(Boolean));
        })
        .catch(() => {
          if (active) setIsFavoriteClub(false);
        });

    return () => {
      active = false;
    };
  }, [clubFavoriteId, clubFavoriteIds]);

  async function toggleMyClub() {
    if (!organization || !clubNumber) return;

    setMeClubLoading(true);

    try {
      if (isMyClub) {
        await clearMeClub();
        setSavedMeClub(null);
        return;
      }

      const saved = await setMeClub({
        organization,
        clubNumber,
        title,
        clubName: clubNameForPlayers ?? title,
        state: params.state,
        season: scheduleSeason,
        clubSlug: params.clubSlug ?? 'x',
      });

      setSavedMeClub(saved);
    } catch {
      // Keine sichtbare Statusmeldung: Der Button bleibt einfach im bisherigen Zustand.
    } finally {
      setMeClubLoading(false);
    }
  }

  async function toggleFavoriteClub() {
    if (!clubFavoriteId || !organization || !clubNumber) return;

    setFavoriteClubLoading(true);

    try {
      if (isFavoriteClub) {
        await Promise.all(clubFavoriteIds.map((candidateId) => removeFavorite(CLUB_FAVORITE_TYPE, candidateId)));
        setIsFavoriteClub(false);
        return;
      }

      const subtitle = [params.state, organization].filter(Boolean).join(' • ') || t('club.defaultTitle');

      await addFavorite({
        type: CLUB_FAVORITE_TYPE,
        id: clubFavoriteId,
        title,
        name: title,
        label: title,
        subtitle,
        description: subtitle,
        organization,
        clubNumber,
        clubName: clubNameForPlayers ?? title,
        state: params.state,
        season: scheduleSeason,
        clubSlug: params.clubSlug ?? 'x',
        meta: clubNumber ? t('club.clubNumberShort', { clubNumber }) : undefined,
        params: {
          organization,
          organizationName: params.organizationName ?? '',
          clubNumber,
          clubName: clubNameForPlayers ?? title,
          state: params.state ?? '',
          season: scheduleSeason,
          clubSlug: params.clubSlug ?? 'x',
        },
      } as Parameters<typeof addFavorite>[0]);

      setIsFavoriteClub(true);
    } catch {
      // Keine sichtbare Statusmeldung: Der Button bleibt einfach im bisherigen Zustand.
    } finally {
      setFavoriteClubLoading(false);
    }
  }

  // Kommend und Vergangen filtern die geladene Saison lokal, nur ein eigener Zeitraum lädt neu.
  const filteredMatches = useMemo(() => {
    if (scheduleFilter === 'upcoming') return scheduleMatches.filter(isUpcomingMatch);
    if (scheduleFilter === 'past') return scheduleMatches.filter(isPastMatch);
    return scheduleMatches;
  }, [scheduleFilter, scheduleMatches]);

  const scheduleGroups = useMemo(() => {
    const groups = groupScheduleByDate(filteredMatches);
    return scheduleFilter === 'past' ? [...groups].reverse() : groups;
  }, [filteredMatches, scheduleFilter]);

  const nextMatch = useMemo(() => {
    return (
        scheduleMatches
            .filter(isUpcomingMatch)
            .sort((left, right) => {
              const leftDate = parseMatchDate(left.date)?.getTime() ?? 0;
              const rightDate = parseMatchDate(right.date)?.getTime() ?? 0;

              return leftDate !== rightDate ? leftDate - rightDate : getTimeValue(left.time) - getTimeValue(right.time);
            })[0] ?? null
    );
  }, [scheduleMatches]);

  function applyCustomPeriod() {
    if (!isValidDateInput(dateStartDraft) || !isValidDateInput(dateEndDraft)) {
      setScheduleError(t('club.invalidDateRange'));
      return false;
    }

    setAppliedDateStart(dateStartDraft.trim());
    setAppliedDateEnd(dateEndDraft.trim());
    setScheduleFilter('custom');
    return true;
  }

  function resetSchedulePeriod() {
    const defaultRange = getDefaultSeasonDateRange(scheduleSeason);

    setDateStartDraft(defaultRange.dateStart);
    setDateEndDraft(defaultRange.dateEnd);
    setAppliedDateStart(defaultRange.dateStart);
    setAppliedDateEnd(defaultRange.dateEnd);
    setScheduleFilter('all');
  }

  // Kommend/Vergangen/Alle brauchen die volle Saison. War vorher ein eigener Zeitraum aktiv, wird zurückgesetzt.
  function selectScheduleFilter(filter: ScheduleFilter) {
    if (filter === 'custom') return;

    if (scheduleFilter === 'custom') {
      resetSchedulePeriod();
    }

    setScheduleFilter(filter);
  }

  return {
    params,
    title,
    info,
    summary,
    canClaimClub,
    organization,
    clubNumber,
    activeTab,
    setActiveTab,
    teams,
    players,
    loading,
    error,
    playersError,
    playersFreshness,
    scheduleFreshness,
    scheduleError,
    scheduleLoading,
    scheduleSeason,
    scheduleMatches,
    filteredMatches,
    scheduleGroups,
    nextMatch,
    scheduleFilter,
    selectScheduleFilter,
    dateStartDraft,
    dateEndDraft,
    setDateStartDraft,
    setDateEndDraft,
    applyCustomPeriod,
    resetSchedulePeriod,
    isMyClub,
    meClubLoading,
    isFavoriteClub,
    favoriteClubLoading,
    toggleMyClub,
    toggleFavoriteClub,
  };
}

export type ClubDetailsController = ReturnType<typeof useClubDetails>;
