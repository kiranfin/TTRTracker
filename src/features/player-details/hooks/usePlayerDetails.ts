import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { invalidateApiCache } from '@/src/api/client';
import { ttApi } from '@/src/api/tttracker';
import { useI18n } from '@/src/i18n/I18nProvider';
import { addFavorite, isFavorite, removeFavorite } from '@/src/storage/favorites';
import {
  clearMePlayerNuid,
  getMePlayerNuid,
  normalizeMePlayerNuid,
  setMePlayerName,
  setMePlayerNuid as saveMePlayerNuid,
} from '@/src/storage/mePlayer';
import type {
  NormalizedPlayerTtrHistory,
  NormalizedTtrHistoryEvent,
  PlayerRating,
  PlayerTtrEstimate,
  PlayerRatingSource,
} from '@/src/types/tttracker';
import { estimateToHistory, TTR_ESTIMATE_ENABLED } from '../estimate';
import { useOnMyttConnected } from '@/src/features/mytt';
import { getMyttUnavailableReason, type MyttUnavailableReason } from '@/src/features/mytt/utils/errors';
import { normalizeClub, normalizePlayerTtrHistory } from '@/src/utils/normalizers';
import { getStaleSince } from '@/src/utils/staleness';
import type { ChartRangeId, ClubRouteParams, LeagueOption, PlayerStats } from '../types';
import {
  CHART_RANGES,
  PAGE_SIZE,
  PLAYER_FAVORITE_TYPE,
  getEventTtr,
  getEventWinLoss,
  getPlayerHistoryData,
  getTtrDeltaSince,
  groupEventsByMonth,
  historyEventMatchesSearch,
  isFiniteNumber,
  normalizeClubLookupText,
  parseDateTimestamp,
  parseOptionalNumber,
  subtractMonths,
} from '../utils';

export function usePlayerDetails() {
  const params = useLocalSearchParams<Record<string, string>>();
  const { t } = useI18n();

  const [officialHistory, setOfficialHistory] = useState<NormalizedPlayerTtrHistory | null>(null);
  const [estimate, setEstimate] = useState<PlayerTtrEstimate | null>(null);
  const [apiHistoryData, setApiHistoryData] = useState<Record<string, unknown> | null>(null);
  const [resolvedClubRouteParams, setResolvedClubRouteParams] = useState<ClubRouteParams | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<ChartRangeId>('12m');
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [leagueSheetOpen, setLeagueSheetOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unavailableReason, setUnavailableReason] = useState<MyttUnavailableReason | null>(null);
  // Wird nach einem Login erhöht, damit der offizielle Verlauf neu geladen wird.
  const [reloadKey, setReloadKey] = useState(0);
  const [publicRating, setPublicRating] = useState<PlayerRating | null>(null);
  // Stand je Quelle, wenn sie aus einem älteren Stand kommt (sonst null).
  const [historyStaleSince, setHistoryStaleSince] = useState<number | null>(null);
  const [ratingStaleSince, setRatingStaleSince] = useState<number | null>(null);
  const [estimateStaleSince, setEstimateStaleSince] = useState<number | null>(null);

  const [storedMePlayerNuid, setStoredMePlayerNuid] = useState<string | null>(null);
  const [mePlayerLoading, setMePlayerLoading] = useState(false);
  // Verhindert, dass der "Bist du das?" Hinweis kurz aufblitzt, bevor der Speicher gelesen ist.
  const [mePlayerChecked, setMePlayerChecked] = useState(false);

  const [isFavoritePlayer, setIsFavoritePlayer] = useState(false);
  const [comparePickerOpen, setComparePickerOpen] = useState(false);

  const reloadAfterConnect = useCallback(() => {
    // Ein bewusstes Neuladen soll auch die zwischengespeicherten öffentlichen Werte neu holen.
    invalidateApiCache('/api/players').catch(() => undefined);
    setReloadKey((current) => current + 1);
  }, []);
  useOnMyttConnected(reloadAfterConnect);

  const nuid = params.nuid;
  const routeClubKey = params.clubKey?.trim() ?? '';
  const normalizedCurrentNuid = normalizeMePlayerNuid(nuid);
  const hasMePlayer = normalizeMePlayerNuid(storedMePlayerNuid).length > 0;
  const isMeProfile =
      normalizedCurrentNuid.length > 0 && normalizeMePlayerNuid(storedMePlayerNuid) === normalizedCurrentNuid;
  const canClaimProfile = mePlayerChecked && !hasMePlayer && normalizedCurrentNuid.length > 0;
  const title = params.title ?? params.name ?? t('player.defaultTitle');

  // Ohne offiziellen Verlauf zeigt das Profil den aus öffentlichen Spielberichten geschätzten.
  const estimatedHistory = useMemo(() => (estimate && estimate.events.length > 0 ? estimateToHistory(estimate) : null), [estimate]);
  const history = officialHistory ?? estimatedHistory;
  const historyIsEstimated = officialHistory === null && estimatedHistory !== null;
  const estimatePending = historyIsEstimated && (estimate?.coverage.pending ?? 0) > 0;

  const displayName = history?.personName ?? title;
  // Name für die Vereinssuche im Backend, nur wenn es ein echter Name und kein Platzhalter ist.
  const lookupName = officialHistory?.personName ?? params.title ?? params.name ?? undefined;
  const clubName = history?.clubName ?? params.clubName;

  const routeClubRouteParams: ClubRouteParams | null = routeClubKey
      ? {
        clubKey: routeClubKey,
        title: clubName ?? t('entities.club'),
        organization: params.organization ?? '',
        organizationName: params.organizationName ?? '',
        clubNumber: params.clubNumber ?? '',
        state: params.state ?? '',
        externalId: params.externalId ?? '',
      }
      : null;

  const clubRouteParams = routeClubRouteParams ?? resolvedClubRouteParams;
  const effectiveClubKey = clubRouteParams?.clubKey?.trim() ?? '';
  const clubOrganization = clubRouteParams?.organization || params.organization || undefined;
  const clubNumber = clubRouteParams?.clubNumber || params.clubNumber || undefined;

  useEffect(() => {
    async function load() {
      if (!nuid) {
        setLoading(false);
        setError(t('player.missingNuid'));
        setApiHistoryData(null);
        return;
      }

      setLoading(true);
      setError(null);
      setUnavailableReason(null);
      setVisibleCount(PAGE_SIZE);
      setExpandedEventId(null);
      setApiHistoryData(null);
      setOfficialHistory(null);
      setHistoryStaleSince(null);

      try {
        const response = await ttApi.getPlayerTtrHistory(nuid);
        setApiHistoryData(getPlayerHistoryData(response));
        setOfficialHistory(normalizePlayerTtrHistory(response));
        setHistoryStaleSince(getStaleSince(response.meta));
      } catch (loadError) {
        const reason = getMyttUnavailableReason(loadError);

        if (reason) {
          setUnavailableReason(reason);
        } else {
          setError(loadError instanceof Error ? loadError.message : t('player.historyLoadError'));
        }
      } finally {
        setLoading(false);
      }
    }

    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nuid, reloadKey]);

  // Ohne Vereinsschlüssel in den Route-Parametern wird der Verein über den Namen gesucht.
  useEffect(() => {
    let active = true;

    async function resolveClubKeyFromClubName() {
      setResolvedClubRouteParams(null);

      if (routeClubKey) return;

      const searchName = clubName?.trim();

      if (!searchName) return;

      try {
        const rows = await ttApi.searchClubs(searchName);

        if (!active) return;

        const normalizedClubs = Array.isArray(rows) ? rows.map((row) => normalizeClub(row)) : [];
        const wantedName = normalizeClubLookupText(searchName);

        const exactMatch = normalizedClubs.find((club) => normalizeClubLookupText(club.name) === wantedName);

        const fuzzyMatch =
            exactMatch ??
            normalizedClubs.find((club) => {
              const candidateName = normalizeClubLookupText(club.name);

              return candidateName.includes(wantedName) || wantedName.includes(candidateName);
            });

        if (!fuzzyMatch) return;

        setResolvedClubRouteParams({
          clubKey: fuzzyMatch.id,
          title: fuzzyMatch.name,
          organization: fuzzyMatch.organization ?? '',
          organizationName: fuzzyMatch.organizationName ?? '',
          clubNumber: fuzzyMatch.clubNumber ?? '',
          state: fuzzyMatch.state ?? '',
          externalId: fuzzyMatch.externalId ?? '',
        });
      } catch {
        if (!active) return;

        setResolvedClubRouteParams(null);
      }
    }

    resolveClubKeyFromClubName().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [routeClubKey, clubName]);

  // Öffentlicher Wert aus der Vereinsliste. Schlägt das fehl, bleibt einfach der Wert aus den Route-Parametern.
  useEffect(() => {
    let active = true;

    setPublicRating(null);
    setRatingStaleSince(null);

    if (!nuid || (!(clubOrganization && clubNumber) && !lookupName)) return;

    ttApi
        .getPlayerRating(nuid, { organization: clubOrganization, clubNumber, clubName, name: lookupName })
        .then((response) => {
          if (!active) return;

          setPublicRating(response.data.rating);
          setRatingStaleSince(getStaleSince(response.meta, response.data.rating?.asOf));
        })
        .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [nuid, clubOrganization, clubNumber, clubName, lookupName]);

  // Ohne myTischtennis Verbindung wird der Verlauf aus öffentlichen Spielberichten geschätzt.
  // Vorerst aus: dann bleibt der öffentliche Wert (publicRating) aus dem Effekt darüber.
  useEffect(() => {
    let active = true;

    setEstimate(null);
    setEstimateStaleSince(null);

    if (!TTR_ESTIMATE_ENABLED || !unavailableReason || !nuid || (!(clubOrganization && clubNumber) && !lookupName)) return;

    ttApi
        .getPlayerTtrEstimate(nuid, { organization: clubOrganization, clubNumber, clubName, name: lookupName })
        .then((response) => {
          if (!active) return;

          setEstimate(response.data);
          setEstimateStaleSince(getStaleSince(response.meta, response.data.publicRating?.asOf));
        })
        .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [nuid, clubOrganization, clubNumber, clubName, lookupName, unavailableReason]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setExpandedEventId(null);
  }, [selectedLeague, historySearchQuery]);

  useEffect(() => {
    let active = true;

    getMePlayerNuid()
        .then((stored) => {
          if (active) setStoredMePlayerNuid(stored);
        })
        .catch(() => {
          if (active) setStoredMePlayerNuid(null);
        })
        .finally(() => {
          if (active) setMePlayerChecked(true);
        });

    return () => {
      active = false;
    };
  }, [nuid]);

  useEffect(() => {
    let active = true;

    if (!normalizedCurrentNuid) {
      setIsFavoritePlayer(false);
      return;
    }

    isFavorite(PLAYER_FAVORITE_TYPE, normalizedCurrentNuid)
        .then((favorite) => {
          if (active) setIsFavoritePlayer(favorite);
        })
        .catch(() => {
          if (active) setIsFavoritePlayer(false);
        });

    return () => {
      active = false;
    };
  }, [normalizedCurrentNuid]);

  const officialTtr = parseOptionalNumber(officialHistory?.ttr) ?? parseOptionalNumber(apiHistoryData?.ttr);
  const fallbackRating = estimate?.rating ?? publicRating;
  const currentTtr = officialTtr ?? fallbackRating?.value ?? parseOptionalNumber(params.ttr);

  // Der Wert aus den Route-Parametern hat keine bekannte Quelle und bekommt deshalb kein Badge.
  const ttrSource: PlayerRatingSource | undefined =
      officialTtr !== undefined ? 'official' : fallbackRating ? fallbackRating.source : undefined;

  // Hinweis nur für die Quelle, deren Wert gerade angezeigt wird.
  const staleSince =
      officialTtr !== undefined
          ? historyStaleSince
          : estimate?.rating
              ? estimateStaleSince
              : publicRating
                  ? ratingStaleSince
                  : null;

  const qTtr = parseOptionalNumber(history?.qttr) ?? parseOptionalNumber(apiHistoryData?.qttr);
  const maxTtr = parseOptionalNumber(history?.maxTtr) ?? parseOptionalNumber(apiHistoryData?.maxTtr);

  async function toggleMeProfile() {
    if (!nuid) return;

    setMePlayerLoading(true);

    try {
      if (isMeProfile) {
        await clearMePlayerNuid();
        setStoredMePlayerNuid(null);
        return;
      }

      const saved = await saveMePlayerNuid(normalizedCurrentNuid);
      await setMePlayerName(displayName);
      setStoredMePlayerNuid(saved);
    } catch {
      // Keine sichtbare Statusmeldung: Der Hinweis bleibt einfach im bisherigen Zustand.
    } finally {
      setMePlayerLoading(false);
    }
  }

  async function toggleFavoritePlayer() {
    if (!normalizedCurrentNuid) return;

    try {
      if (isFavoritePlayer) {
        await removeFavorite(PLAYER_FAVORITE_TYPE, normalizedCurrentNuid);
        setIsFavoritePlayer(false);
        return;
      }

      await addFavorite({
        type: PLAYER_FAVORITE_TYPE,
        id: normalizedCurrentNuid,
        title: displayName,
        name: displayName,
        label: displayName,
        subtitle: clubName ?? t('entities.clubUnknown'),
        description: clubName,
        clubName,
        nuid: normalizedCurrentNuid,
        ttr: currentTtr,
        qttr: qTtr,
        meta: currentTtr !== undefined ? `TTR ${currentTtr}` : undefined,
      } as Parameters<typeof addFavorite>[0]);

      setIsFavoritePlayer(true);
    } catch {
      // Keine sichtbare Statusmeldung: Der Stern bleibt einfach im bisherigen Zustand.
    }
  }

  function pushCompare(leftNuid: string, leftTitle: string) {
    router.push({
      pathname: '/player/player-compare',
      params: {
        leftNuid,
        rightNuid: normalizedCurrentNuid,
        leftTitle,
        rightTitle: displayName,
      },
    });
  }

  // Ohne "Ich" wird erst der Gegner gewählt, statt eine Fehlermeldung zu zeigen.
  function openCompare() {
    if (!normalizedCurrentNuid) {
      setError(t('player.missingNuid'));
      return;
    }

    const meNuid = normalizeMePlayerNuid(storedMePlayerNuid);

    if (meNuid && meNuid !== normalizedCurrentNuid) {
      pushCompare(meNuid, t('player.meShort'));
      return;
    }

    setComparePickerOpen(true);
  }

  function compareWith(otherNuid: string, otherName?: string) {
    if (!otherNuid || otherNuid === normalizedCurrentNuid) return;

    pushCompare(otherNuid, otherName ?? '');
  }

  function openClubDetails() {
    if (!effectiveClubKey) {
      setError(t('player.missingClubKey'));
      return;
    }

    router.push({
      pathname: '/club/[clubKey]',
      params: {
        clubKey: effectiveClubKey,
        title: clubRouteParams?.title ?? clubName ?? t('entities.club'),
        organization: clubRouteParams?.organization ?? params.organization ?? '',
        organizationName: clubRouteParams?.organizationName ?? params.organizationName ?? '',
        clubNumber: clubRouteParams?.clubNumber ?? params.clubNumber ?? '',
        state: clubRouteParams?.state ?? params.state ?? '',
        externalId: clubRouteParams?.externalId ?? params.externalId ?? '',
      },
    });
  }

  const allEventsNewestFirst = useMemo(() => [...(history?.events ?? [])].reverse(), [history?.events]);

  // Reihenfolge nach letzter Teilnahme, damit die aktuelle Saison oben im Liga-Filter steht.
  const leagueOptions = useMemo<LeagueOption[]>(() => {
    const counts = new Map<string, number>();

    allEventsNewestFirst.forEach((event) => {
      if (event.leagueName) counts.set(event.leagueName, (counts.get(event.leagueName) ?? 0) + 1);
    });

    return [...counts].map(([name, count]) => ({ name, count }));
  }, [allEventsNewestFirst]);

  const filteredEventsNewestFirst = useMemo(() => {
    return allEventsNewestFirst.filter((event) => {
      const matchesLeague = !selectedLeague || event.leagueName === selectedLeague;
      const matchesSearch = historyEventMatchesSearch(event, historySearchQuery);

      return matchesLeague && matchesSearch;
    });
  }, [allEventsNewestFirst, selectedLeague, historySearchQuery]);

  const visibleEvents = useMemo(
      () => filteredEventsNewestFirst.slice(0, visibleCount),
      [filteredEventsNewestFirst, visibleCount],
  );

  const monthGroups = useMemo(() => groupEventsByMonth(visibleEvents), [visibleEvents]);
  const hasMoreEvents = visibleCount < filteredEventsNewestFirst.length;

  const allChartEvents = useMemo(
      () => (history?.events ?? []).filter((event) => getEventTtr(event) !== undefined),
      [history?.events],
  );

  const chartEvents = useMemo(() => {
    const selectedRange = CHART_RANGES.find((range) => range.id === chartRange);

    if (!selectedRange?.months) return allChartEvents;

    const latestTimestamp = allChartEvents.reduce((latest, event) => {
      const timestamp = parseDateTimestamp(event.date);
      if (timestamp === undefined) return latest;
      return Math.max(latest, timestamp);
    }, 0);

    if (!latestTimestamp) return allChartEvents;

    const cutoff = subtractMonths(new Date(latestTimestamp), selectedRange.months).getTime();

    return allChartEvents.filter((event) => {
      const timestamp = parseDateTimestamp(event.date);
      return timestamp !== undefined && timestamp >= cutoff;
    });
  }, [allChartEvents, chartRange]);

  const chartTopEvent = useMemo(() => {
    return chartEvents.reduce<NormalizedTtrHistoryEvent | null>((top, event) => {
      const eventTtr = getEventTtr(event);
      const topTtr = top ? getEventTtr(top) : undefined;

      if (eventTtr === undefined) return top;
      if (!top || topTtr === undefined || topTtr < eventTtr) return event;
      return top;
    }, null);
  }, [chartEvents]);

  const stats = useMemo<PlayerStats>(() => {
    const events = history?.events ?? [];

    const deltas = events.map((event) => event.delta).filter((value): value is number => isFiniteNumber(value));

    const winLoss = events.reduce(
        (sum, event) => {
          const eventWinLoss = getEventWinLoss(event);

          return { won: sum.won + eventWinLoss.won, lost: sum.lost + eventWinLoss.lost };
        },
        { won: 0, lost: 0 },
    );

    const ratedMatchCount = winLoss.won + winLoss.lost;

    const matchCount = events.reduce((sum, event) => {
      const eventWinLoss = getEventWinLoss(event);
      const ratioTotal = eventWinLoss.won + eventWinLoss.lost;
      const eventMatchCount = parseOptionalNumber(event.matchCount);

      if (eventMatchCount !== undefined) return sum + eventMatchCount;
      if (ratioTotal > 0) return sum + ratioTotal;

      return sum + event.matches.length;
    }, 0);

    const totalDelta = deltas.length > 0 ? deltas.reduce((sum, value) => sum + value, 0) : undefined;
    const averageDelta = totalDelta !== undefined && deltas.length > 0 ? totalDelta / deltas.length : undefined;

    return {
      eventCount: events.length,
      matchCount,
      matchesWon: winLoss.won,
      ratedMatchCount,
      winRate: ratedMatchCount > 0 ? (winLoss.won / ratedMatchCount) * 100 : undefined,
      averageDelta,
      bestGain: deltas.length > 0 ? Math.max(...deltas) : undefined,
      worstLoss: deltas.length > 0 ? Math.min(...deltas) : undefined,
    };
  }, [history?.events]);

  const monthlyDelta = useMemo(() => getTtrDeltaSince(history?.events ?? [], 30), [history?.events]);

  const toggleExpanded = useCallback((eventId: string) => {
    setExpandedEventId((current) => (current === eventId ? null : eventId));
  }, []);

  function loadMoreEvents() {
    setVisibleCount((current) => current + PAGE_SIZE);
  }

  function clearHistoryFilters() {
    setSelectedLeague(null);
    setHistorySearchQuery('');
  }

  return {
    nuid,
    displayName,
    clubName,
    history,
    historyIsEstimated,
    estimatePending,
    loading,
    error,
    officialUnavailable: unavailableReason !== null,
    unavailableReason,
    currentTtr,
    ttrSource,
    staleSince,
    qTtr,
    maxTtr,
    monthlyDelta,
    stats,
    hasMePlayer,
    isMeProfile,
    canClaimProfile,
    mePlayerLoading,
    isFavoritePlayer,
    effectiveClubKey,
    clubOrganization,
    clubNumber,
    comparePickerOpen,
    setComparePickerOpen,
    chartRange,
    setChartRange,
    chartEvents,
    chartTopEvent,
    leagueOptions,
    selectedLeague,
    setSelectedLeague,
    historySearchQuery,
    setHistorySearchQuery,
    searchOpen,
    setSearchOpen,
    leagueSheetOpen,
    setLeagueSheetOpen,
    totalEventCount: allEventsNewestFirst.length,
    filteredEventCount: filteredEventsNewestFirst.length,
    monthGroups,
    hasMoreEvents,
    expandedEventId,
    toggleExpanded,
    loadMoreEvents,
    clearHistoryFilters,
    toggleMeProfile,
    toggleFavoritePlayer,
    openCompare,
    compareWith,
    openClubDetails,
  };
}
export type PlayerDetailsController = ReturnType<typeof usePlayerDetails>;
