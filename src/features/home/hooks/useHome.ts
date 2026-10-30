import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ttApi } from '@/src/api/tttracker';
import { useOnMyttConnected } from '@/src/features/mytt';
import { getMyttUnavailableReason, type MyttUnavailableReason } from '@/src/features/mytt/utils/errors';
import { useI18n } from '@/src/i18n/I18nProvider';
import { estimateToHistory } from '../../player-details/estimate';
import { getMeClub } from '@/src/storage/meClub';
import type { MeClub } from '@/src/storage/meClub';
import { getMePlayerName, getMePlayerNuid, setMePlayerName, setMePlayerNuid } from '@/src/storage/mePlayer';
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
  const [meStoredName, setMeStoredName] = useState<string | null>(null);
  const [meUnavailableReason, setMeUnavailableReason] = useState<MyttUnavailableReason | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [meClub, setMeClub] = useState<MeClub | null>(null);
  const [clubCompletedMatches, setClubCompletedMatches] = useState<HomeClubMatch[]>([]);
  const [clubUpcomingMatches, setClubUpcomingMatches] = useState<HomeClubMatch[]>([]);
  const [clubLoading, setClubLoading] = useState(false);
  const [clubError, setClubError] = useState<string | null>(null);

  useFocusEffect(
      useCallback(() => {
        let active = true;

        async function loadMe() {
          setMeLoading(true);
          setMeError(null);
          setMeUnavailableReason(null);

          try {
            const storedNuid = await getMePlayerNuid();

            if (!active) return;

            setMeNuid(storedNuid);
            setMeStoredName(await getMePlayerName());

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

            const reason = getMyttUnavailableReason(error);

            if (reason) {
              // Ohne myTischtennis Verbindung zeigt die Startseite den geschätzten Wert und einen Hinweis.
              setMeUnavailableReason(reason);
              await loadEstimateFallback();
              return;
            }

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

        // Der Verein kommt aus dem gespeicherten Ich-Verein, der Spieler hat meist denselben.
        async function loadEstimateFallback() {
          try {
            const [storedNuid, storedClub, storedName] = await Promise.all([
              getMePlayerNuid(),
              getMeClub(),
              getMePlayerName(),
            ]);

            if (!storedNuid || (!storedClub && !storedName)) return;

            const response = await ttApi.getPlayerTtrEstimate(storedNuid, {
              organization: storedClub?.organization,
              clubNumber: storedClub?.clubNumber,
              clubName: storedClub?.clubName ?? storedClub?.title,
              name: storedName ?? undefined,
            });

            if (!active || !response.data.available) return;

            setMeHistory(estimateToHistory(response.data));
          } catch {
            // Ohne Schätzung bleibt nur der Hinweis.
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

  const displayName = formatPersonName(meHistory?.personName) || meStoredName || t('home.profileFallback');
  const firstName = meHistory?.personName ? getFirstName(meHistory.personName) : '';

  // Namen merken, damit die Einstellungen ihn ohne eigenen Request zeigen können.
  useEffect(() => {
    if (meNuid && meHistory?.personName) {
      setMePlayerName(formatPersonName(meHistory.personName)).catch(() => undefined);
    }
  }, [meNuid, meHistory?.personName]);
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
        setClubUpcomingMatches([]);
        setClubError(null);
        setClubLoading(false);
        return;
      }

      setClubLoading(true);
      setClubError(null);
      setClubCompletedMatches([]);
      setClubUpcomingMatches([]);

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

        const upcoming = allMatches
            .filter(isUpcomingClubMatch)
            .sort(compareMatchesOldestFirst)
            .slice(0, 2);

        setClubCompletedMatches(matches);
        setClubUpcomingMatches(upcoming);
      } catch (error) {
        if (!active) return;

        setClubCompletedMatches([]);
        setClubUpcomingMatches([]);
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

  useOnMyttConnected(reloadMe);

  async function selectMePlayer(nuid: string, name?: string) {
    await setMePlayerNuid(nuid);
    await setMePlayerName(name);
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
        clubName: clubName ?? meClub?.clubName ?? meClub?.title ?? '',
        // Mit gespeichertem Verein findet das Profil den öffentlichen TTR auch ohne myTischtennis.
        organization: meClub?.organization ?? '',
        clubNumber: meClub?.clubNumber ?? '',
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
    meUnavailableReason,
    meClub,
    clubCompletedMatches,
    clubUpcomingMatches,
    clubLoading,
    clubError,
    selectMePlayer,
    reloadMe,
    openMeProfile,
    openMyClub,
  };
}
