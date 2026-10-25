import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ttApi } from '@/src/api/tttracker';
import { useI18n } from '@/src/i18n/I18nProvider';
import { addFavorite, favoriteKey, getFavorites, removeFavorite } from '@/src/storage/favorites';
import { getMeClub } from '@/src/storage/meClub';
import type { MeClub } from '@/src/storage/meClub';
import type { TableRow } from '@/src/types/tttracker';
import { normalizeSchedule, normalizeTable } from '@/src/utils/normalizers';
import type { DetailTab, EnrichedScheduleMatch, LeagueInfo, RoundFilter, SchedulePeriodFilter } from '../types';
import {
  LEAGUE_FAVORITE_TYPE,
  buildScheduleStats,
  enrichScheduleMatch,
  formatSeasonLabel,
  getLeagueFavoriteId,
  isSameLeagueFavorite,
  matchesPeriodFilter,
  matchesRoundFilter,
  parseMatchDate,
} from '../utils';

export function useLeagueDetails() {
  const params = useLocalSearchParams<Record<string, string>>();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<DetailTab>('table');
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [matches, setMatches] = useState<EnrichedScheduleMatch[]>([]);
  const [periodFilter, setPeriodFilter] = useState<SchedulePeriodFilter>('all');
  const [roundFilter, setRoundFilter] = useState<RoundFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavoriteLeague, setIsFavoriteLeague] = useState(false);
  const [favoriteLeagueIds, setFavoriteLeagueIds] = useState<string[]>([]);
  const [meClub, setMeClub] = useState<MeClub | null>(null);

  const league = useMemo<LeagueInfo>(() => {
    const groupId = params.groupId ?? params.leagueKey;

    return {
      title: params.title ?? t('league.defaultTitle'),
      association: params.association,
      groupId,
      season: params.season ?? '25/26',
      leagueSlug: params.leagueSlug ?? 'x',
      favoriteId: getLeagueFavoriteId({
        favoriteId: params.favoriteId ?? params.id ?? params.leagueId,
        association: params.association,
        groupId,
        season: params.season,
        leagueSlug: params.leagueSlug,
        title: params.title,
      }),
    };
  }, [
    params.association,
    params.favoriteId,
    params.groupId,
    params.id,
    params.leagueId,
    params.leagueKey,
    params.leagueSlug,
    params.season,
    params.title,
    t,
  ]);

  const loadFavoriteState = useCallback(async () => {
    const favorites = await getFavorites();
    const fallbackKey = favoriteKey(LEAGUE_FAVORITE_TYPE, league.favoriteId);

    const matchingFavoriteIds = favorites
        .filter((item) => {
          if (item.type !== LEAGUE_FAVORITE_TYPE) return false;
          if (favoriteKey(item.type, item.id) === fallbackKey) return true;
          return isSameLeagueFavorite(item, league);
        })
        .map((item) => item.id);

    setFavoriteLeagueIds([...new Set(matchingFavoriteIds)]);
    setIsFavoriteLeague(matchingFavoriteIds.length > 0);
  }, [league]);

  useFocusEffect(
      useCallback(() => {
        loadFavoriteState().catch(() => undefined);
        getMeClub().then(setMeClub).catch(() => undefined);
      }, [loadFavoriteState]),
  );

  async function toggleFavoriteLeague() {
    if (!league.favoriteId) return;

    try {
      if (isFavoriteLeague) {
        const idsToRemove = favoriteLeagueIds.length > 0 ? favoriteLeagueIds : [league.favoriteId];

        await Promise.all(idsToRemove.map((id) => removeFavorite(LEAGUE_FAVORITE_TYPE, id)));
        setFavoriteLeagueIds([]);
        setIsFavoriteLeague(false);
        return;
      }

      await addFavorite({
        id: league.favoriteId,
        type: LEAGUE_FAVORITE_TYPE,
        title: league.title,
        subtitle: `${league.association ?? t('league.associationUnknown')} • ${t('favorites.seasonValue', { season: formatSeasonLabel(league.season) })}`,
        params: {
          association: league.association ?? '',
          groupId: league.groupId ?? '',
          season: league.season,
          leagueSlug: league.leagueSlug ?? 'x',
          title: league.title,
          favoriteId: league.favoriteId,
        },
      });

      setFavoriteLeagueIds([league.favoriteId]);
      setIsFavoriteLeague(true);
    } catch {
      // Keine sichtbare Statusmeldung: Der Stern bleibt einfach im bisherigen Zustand.
    }
  }

  useEffect(() => {
    async function loadLeague() {
      if (!league.association || !league.groupId) {
        setLoading(false);
        setError(t('league.missingLeagueData'));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [tableResponse, scheduleResponse] = await Promise.all([
          ttApi.getLeagueTable(league.association, league.season, league.groupId, league.leagueSlug, 'gesamt'),
          ttApi.getLeagueSchedule(league.association, league.season, league.groupId, league.leagueSlug),
        ]);

        setTableRows(normalizeTable(tableResponse));
        setMatches(normalizeSchedule(scheduleResponse).map(enrichScheduleMatch));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : t('league.loadError'));
      } finally {
        setLoading(false);
      }
    }

    loadLeague().catch(() => undefined);
  }, [league.association, league.groupId, league.leagueSlug, league.season, t]);

  const filteredMatches = useMemo(
      () => matches.filter((match) => matchesPeriodFilter(match, periodFilter) && matchesRoundFilter(match, roundFilter)),
      [matches, periodFilter, roundFilter],
  );

  const upcoming = useMemo(() => filteredMatches.filter((match) => match.status !== 'completed'), [filteredMatches]);
  const completed = useMemo(() => filteredMatches.filter((match) => match.status === 'completed'), [filteredMatches]);

  const scheduleStatsByTeam = useMemo(() => buildScheduleStats(matches), [matches]);

  // Alle abgeschlossenen Begegnungen vom jüngsten Spieltag, aus dem schon geladenen Spielplan
  const lastMatchday = useMemo(() => {
    const done = matches.filter((match) => match.status === 'completed' && parseMatchDate(match.date));
    if (done.length === 0) return [];

    const latest = Math.max(...done.map((match) => parseMatchDate(match.date)!.getTime()));

    return done.filter((match) => parseMatchDate(match.date)!.getTime() === latest);
  }, [matches]);

  // Die kombinierte Chip-Zeile setzt Zeitraum und Halbserie gemeinsam zurück
  function resetScheduleFilters() {
    setPeriodFilter('all');
    setRoundFilter('all');
  }

  return {
    league,
    activeTab,
    setActiveTab,
    tableRows,
    matches,
    filteredMatches,
    upcoming,
    completed,
    lastMatchday,
    scheduleStatsByTeam,
    periodFilter,
    setPeriodFilter,
    roundFilter,
    setRoundFilter,
    resetScheduleFilters,
    loading,
    error,
    isFavoriteLeague,
    toggleFavoriteLeague,
    meClub,
  };
}

export type LeagueDetailsController = ReturnType<typeof useLeagueDetails>;
