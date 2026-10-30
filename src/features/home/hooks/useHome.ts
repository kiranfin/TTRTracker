import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { eventsApi } from '@/src/api/events';
import { invalidateApiCache } from '@/src/api/client';
import { ttApi } from '@/src/api/tttracker';
import { useOnMyttConnected } from '@/src/features/mytt';
import { getMyttUnavailableReason, type MyttUnavailableReason } from '@/src/features/mytt/utils/errors';
import { getUpcomingEvents } from '@/src/features/events/utils';
import { useApiUpdates } from '@/src/hooks/useApiUpdates';
import { useI18n } from '@/src/i18n/I18nProvider';
import { publicRatingToHistory } from '../../player-details/estimate';
import { getEventsWidgetEnabled } from '@/src/storage/eventsWidget';
import { getMeClub } from '@/src/storage/meClub';
import type { MeClub } from '@/src/storage/meClub';
import { getMePlayerName, getMePlayerNuid, setMePlayerName, setMePlayerNuid } from '@/src/storage/mePlayer';
import { getMeSnapshot, isMeSnapshotFresh, setMeSnapshot } from '@/src/storage/meSnapshot';
import type { EventSummary } from '@/src/types/events';
import type { NormalizedPlayerTtrHistory } from '@/src/types/tttracker';
import { normalizePlayerTtrHistory } from '@/src/utils/normalizers';
import { freshnessFromSavedAt, getFreshness, type Freshness } from '@/src/utils/staleness';
import type { HomeClubMatch } from '../types';
import { compareMatchesNewestFirst, compareMatchesOldestFirst, formatPersonName, getCurrentBackendSeason, getDefaultSeasonDateRange, getFirstName, getPlayerHistoryData, getTtrDeltaSince, getTtrSeries, getWinRatePercent, isCompletedClubMatch, isUpcomingClubMatch, normalizeHomeClubSchedule, parseOptionalNumber } from '../utils';
import { describeApiError } from '@/src/utils/apiErrors';

export function useHome() {
  const { t } = useI18n();
  const [meNuid, setMeNuid] = useState<string | null>(null);
  const [meHistory, setMeHistory] = useState<NormalizedPlayerTtrHistory | null>(null);
  const [meApiHistoryData, setMeApiHistoryData] = useState<Record<string, unknown> | null>(null);
  const [meLoading, setMeLoading] = useState(false);
  const [meError, setMeError] = useState<string | null>(null);
  const [meStoredName, setMeStoredName] = useState<string | null>(null);
  const [meUnavailableReason, setMeUnavailableReason] = useState<MyttUnavailableReason | null>(null);
  // Stand der angezeigten Werte, wenn sie aus einem älteren Stand kommen (sonst null).
  const [meFreshness, setMeFreshness] = useState<Freshness | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Zuletzt verarbeiteter reloadKey: eine Änderung heißt "wirklich neu laden" (Erneut versuchen, Login).
  const handledReloadKey = useRef(reloadKey);

  const [meClub, setMeClub] = useState<MeClub | null>(null);
  const [clubCompletedMatches, setClubCompletedMatches] = useState<HomeClubMatch[]>([]);
  const [clubUpcomingMatches, setClubUpcomingMatches] = useState<HomeClubMatch[]>([]);
  const [clubLoading, setClubLoading] = useState(false);
  const [clubError, setClubError] = useState<string | null>(null);
  // Wird erhöht, wenn die App den Vereinsspielplan im Hintergrund aktualisiert hat. Dann wird still neu gelesen.
  const [clubRefreshTick, setClubRefreshTick] = useState(0);
  const clubSilentRef = useRef(false);

  const [eventsWidgetEnabled, setEventsWidgetEnabled] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<EventSummary[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useFocusEffect(
      useCallback(() => {
        let active = true;

        async function loadMe() {
          const forced = handledReloadKey.current !== reloadKey;
          handledReloadKey.current = reloadKey;

          setMeLoading(true);
          setMeError(null);
          setMeUnavailableReason(null);
          setMeFreshness(null);

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

            // Ein vor kurzem geholter Verlauf wird gezeigt, ohne erneut anzufragen (Tab Wechsel, App Start).
            if (!forced) {
              const snapshot = await getMeSnapshot(storedNuid);

              if (!active) return;

              if (snapshot && isMeSnapshotFresh(snapshot)) {
                setMeApiHistoryData(getPlayerHistoryData(snapshot.response));
                setMeHistory(normalizePlayerTtrHistory(snapshot.response));
                setMeFreshness({ since: snapshot.savedAt, stale: false });
                return;
              }
            }

            const response = await ttApi.getPlayerTtrHistory(storedNuid);

            if (!active) return;

            const freshness = getFreshness(response.meta);

            setMeApiHistoryData(getPlayerHistoryData(response));
            setMeHistory(normalizePlayerTtrHistory(response));
            setMeFreshness(freshness);
            setMeSnapshot(storedNuid, response, freshness?.since ?? Date.now()).catch(() => undefined);
          } catch (error) {
            if (!active) return;

            setMeHistory(null);
            setMeApiHistoryData(null);

            const reason = getMyttUnavailableReason(error);

            if (reason) {
              // Ohne myTischtennis Verbindung zeigt die Startseite den öffentlichen Wert und einen Hinweis.
              setMeUnavailableReason(reason);
              await loadPublicRatingFallback();
              return;
            }

            // myTischtennis bremst (429) oder hängt: lieber der letzte bekannte Stand mit Hinweis als ein Fehler.
            if ((await loadSnapshotFallback()) || (await loadPublicRatingFallback())) return;

            if (!active) return;

            setMeError(describeApiError(error, t, 'home.quickStatsError'));
          } finally {
            if (active) {
              setMeLoading(false);
            }
          }
        }

        async function loadSnapshotFallback() {
          const storedNuid = await getMePlayerNuid();
          const snapshot = storedNuid ? await getMeSnapshot(storedNuid) : null;

          if (!active || !snapshot) return false;

          setMeApiHistoryData(getPlayerHistoryData(snapshot.response));
          setMeHistory(normalizePlayerTtrHistory(snapshot.response));
          setMeFreshness(freshnessFromSavedAt(snapshot.savedAt));

          return true;
        }

        // Öffentlicher TTR aus der Andro Rangliste. Der Verein kommt aus dem gespeicherten Ich-Verein, der Spieler hat meist denselben.
        async function loadPublicRatingFallback() {
          try {
            const [storedNuid, storedClub, storedName] = await Promise.all([
              getMePlayerNuid(),
              getMeClub(),
              getMePlayerName(),
            ]);

            if (!storedNuid || (!storedClub && !storedName)) return false;

            const response = await ttApi.getPlayerRating(storedNuid, {
              organization: storedClub?.organization,
              clubNumber: storedClub?.clubNumber,
              clubName: storedClub?.clubName ?? storedClub?.title,
              name: storedName ?? undefined,
            });

            if (!active || !response.data.rating) return false;

            setMeHistory(publicRatingToHistory(storedNuid, response.data.rating));
            setMeFreshness(getFreshness(response.meta, response.data.rating.asOf));

            return true;
          } catch {
            // Ohne öffentlichen Wert bleibt nur der Hinweis.
            return false;
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

  useFocusEffect(
      useCallback(() => {
        let active = true;

        async function loadEventsWidget() {
          try {
            const enabled = await getEventsWidgetEnabled();

            if (!active) return;

            setEventsWidgetEnabled(enabled);

            if (!enabled) {
              setUpcomingEvents([]);
              setEventsError(null);
              setEventsLoading(false);
              return;
            }

            setEventsLoading(true);
            setEventsError(null);

            const events = await eventsApi.list();

            if (!active) return;

            setUpcomingEvents(getUpcomingEvents(events, 3));
          } catch (error) {
            if (!active) return;

            setUpcomingEvents([]);
            setEventsError(
                describeApiError(error, t, 'events.loadError'),
            );
          } finally {
            if (active) {
              setEventsLoading(false);
            }
          }
        }

        loadEventsWidget().catch(() => undefined);

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

      const silent = clubSilentRef.current;
      clubSilentRef.current = false;

      if (!silent) {
        setClubLoading(true);
        setClubError(null);
        setClubCompletedMatches([]);
        setClubUpcomingMatches([]);
      }

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
        setClubError(describeApiError(error, t, 'home.clubMatchesError'));
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
  }, [meClub, clubRefreshTick]);

  useApiUpdates(
      meClub?.organization && meClub.clubNumber
          ? `/api/clubs/${encodeURIComponent(meClub.organization)}/${encodeURIComponent(meClub.clubNumber)}/schedule`
          : null,
      () => {
        clubSilentRef.current = true;
        setClubRefreshTick((tick) => tick + 1);
      },
  );

  function reloadMe() {
    // "Erneut versuchen" soll wirklich neu laden, nicht den Zwischenspeicher zeigen.
    invalidateApiCache('/api/players').catch(() => undefined);
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

  function openAllEvents() {
    router.push('/events');
  }

  function openEvent(event: EventSummary) {
    router.push({ pathname: '/event/[id]', params: { id: event.id } });
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
    meFreshness,
    meClub,
    clubCompletedMatches,
    clubUpcomingMatches,
    clubLoading,
    clubError,
    selectMePlayer,
    reloadMe,
    eventsWidgetEnabled,
    upcomingEvents,
    eventsLoading,
    eventsError,
    openMeProfile,
    openMyClub,
    openAllEvents,
    openEvent,
  };
}
