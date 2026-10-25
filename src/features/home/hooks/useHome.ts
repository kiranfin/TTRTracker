import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ttApi } from '@/src/api/tttracker';
import { useI18n } from '@/src/i18n/I18nProvider';
import { getMeClub } from '@/src/storage/meClub';
import type { MeClub } from '@/src/storage/meClub';
import { getMePlayerNuid, setMePlayerNuid } from '@/src/storage/mePlayer';
import type { NormalizedPlayerTtrHistory } from '@/src/types/tttracker';
import { normalizePlayerTtrHistory } from '@/src/utils/normalizers';
import type { HomeClubMatch } from '../types';
import { compareMatchesNewestFirst, compareMatchesOldestFirst, formatPersonName, getCurrentBackendSeason, getDefaultSeasonDateRange, getFirstName, getPlayerHistoryData, getTtrDeltaSince, getTtrSeries, getWinRatePercent, isCompletedClubMatch, isUpcomingClubMatch, normalizeHomeClubSchedule, parseOptionalNumber } from '../utils';

export function useHome() {
  const { t } = useI18n();
  const [meNuid, setMeNuid] = useState<string | null>(null);
  const [meHistory, setMeHistory] = useState<NormalizedPlayerTtrHistory | null>(null);
  const [meApiHistoryData, setMeApiHistoryData] = useState<Record<string, unknown> | null>(null);
  const [meLoading, setMeLoading] = useState(false);
  const [meError, setMeError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [meClub, setMeClub] = useState<MeClub | null>(null);
  const [clubCompletedMatches, setClubCompletedMatches] = useState<HomeClubMatch[]>([]);
  const [clubNextMatch, setClubNextMatch] = useState<HomeClubMatch | null>(null);
  const [clubLoading, setClubLoading] = useState(false);
  const [clubError, setClubError] = useState<string | null>(null);

  useFocusEffect(
      useCallback(() => {
        let active = true;

        async function loadMe() {
          setMeLoading(true);
          setMeError(null);

          try {
            const storedNuid = await getMePlayerNuid();

            if (!active) return;

            setMeNuid(storedNuid);

            if (!storedNuid) {
              setMeHistory(null);
              setMeApiHistoryData(null);
              return;
            }

            const response = await ttApi.getPlayerTtrHistory(storedNuid);

            if (!active) return;

            setMeApiHistoryData(getPlayerHistoryData(response));
            setMeHistory(normalizePlayerTtrHistory(response));
          } catch (error) {
            if (!active) return;

            setMeHistory(null);
            setMeApiHistoryData(null);
            setMeError(
                error instanceof Error
                    ? error.message
                    : t('home.quickStatsError'),
            );
          } finally {
            if (active) {
              setMeLoading(false);
            }
          }
        }

        loadMe().catch(() => undefined);

        return () => {
          active = false;
        };
      }, [reloadKey]),
  );

  useFocusEffect(
      useCallback(() => {
        let active = true;

        async function loadStoredClub() {
          try {
            const stored = await getMeClub();

            if (!active) return;

            setMeClub(stored);
          } catch {
            if (!active) return;

            setMeClub(null);
          }
        }

        loadStoredClub().catch(() => undefined);

        return () => {
          active = false;
        };
      }, []),
  );

  const displayName = formatPersonName(meHistory?.personName) || t('home.profileFallback');
  const firstName = meHistory?.personName ? getFirstName(meHistory.personName) : '';
  const clubName = meHistory?.clubName;

  const currentTtr =
      parseOptionalNumber(meHistory?.ttr) ??
      parseOptionalNumber(meApiHistoryData?.ttr);

  const qTtr =
      parseOptionalNumber(meHistory?.qttr) ??
      parseOptionalNumber(meApiHistoryData?.qttr);

  const maxTtr =
      parseOptionalNumber(meHistory?.maxTtr) ??
      parseOptionalNumber(meApiHistoryData?.maxTtr);

  const events = meHistory?.events;

  const recentEvents = useMemo(() => {
    return [...(events ?? [])].reverse().slice(0, 3);
  }, [events]);

  const ttrSeries = useMemo(() => getTtrSeries(events ?? []).slice(-30), [events]);
  const ttrDelta30 = useMemo(() => getTtrDeltaSince(events ?? [], 30), [events]);
  const winRate = useMemo(() => getWinRatePercent(events ?? []), [events]);

  useEffect(() => {
    let active = true;

    async function loadClubMatches() {
      if (!meClub?.organization || !meClub.clubNumber) {
        setClubCompletedMatches([]);
        setClubNextMatch(null);
        setClubError(null);
        setClubLoading(false);
        return;
      }

      setClubLoading(true);
      setClubError(null);
      setClubCompletedMatches([]);
      setClubNextMatch(null);

      try {
        const season = meClub.season ?? getCurrentBackendSeason();
        const dateRange = getDefaultSeasonDateRange(season);

        const response = await ttApi.getClubSchedule(
            meClub.organization,
            meClub.clubNumber,
            season,
            dateRange.dateStart,
            dateRange.dateEnd,
            meClub.clubSlug ?? 'x',
        );

        if (!active) return;

        const allMatches = normalizeHomeClubSchedule(response);

        const matches = allMatches
            .filter(isCompletedClubMatch)
            .sort(compareMatchesNewestFirst)
            .slice(0, 2);

        const upcoming = allMatches.filter(isUpcomingClubMatch).sort(compareMatchesOldestFirst);

        setClubCompletedMatches(matches);
        setClubNextMatch(upcoming[0] ?? null);
      } catch (error) {
        if (!active) return;

        setClubCompletedMatches([]);
        setClubError(
            error instanceof Error
                ? error.message
                : t('home.clubMatchesError'),
        );
      } finally {
        if (active) {
          setClubLoading(false);
        }
      }
    }

    loadClubMatches().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [meClub]);

  function reloadMe() {
    setReloadKey((current) => current + 1);
  }

  async function selectMePlayer(nuid: string) {
    await setMePlayerNuid(nuid);
    reloadMe();
  }

  function openMeProfile() {
    if (!meNuid) {
      router.push('/settings');
      return;
    }

    router.push({
      pathname: '/(tabs)/player/[nuid]',
      params: {
        nuid: meNuid,
        title: displayName,
        clubName: clubName ?? '',
      },
    });
  }

  function openMyClub() {
    if (!meClub) {
      router.push('/search');
      return;
    }

    router.push({
      pathname: '/(tabs)/club/[clubKey]',
      params: {
        clubKey: `${meClub.organization}-${meClub.clubNumber}`,
        organization: meClub.organization,
        clubNumber: meClub.clubNumber,
        title: meClub.title ?? meClub.clubName ?? t('entities.club'),
        clubName: meClub.clubName ?? meClub.title ?? '',
        state: meClub.state ?? '',
        season: meClub.season ?? getCurrentBackendSeason(),
      },
    });
  }

  return {
    meNuid,
    displayName,
    firstName,
    clubName,
    currentTtr,
    qTtr,
    maxTtr,
    recentEvents,
    ttrSeries,
    ttrDelta30,
    winRate,
    meLoading,
    meError,
    meClub,
    clubCompletedMatches,
    clubNextMatch,
    clubLoading,
    clubError,
    selectMePlayer,
    reloadMe,
    openMeProfile,
    openMyClub,
  };
}
