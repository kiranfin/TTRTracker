import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ttApi } from '@/src/api/tttracker';
import { useI18n } from '@/src/i18n/I18nProvider';
import { addFavorite, favoriteKey, getFavorites, removeFavorite } from '@/src/storage/favorites';
import type { LeagueClassReference, LeagueRegion } from '@/src/types/tttracker';

export const DEFAULT_SEASON = '25/26';

export function formatSeasonLabel(value?: string) {
  return String(value ?? DEFAULT_SEASON).replace(/--/g, '/');
}

export function useRegionLeagues() {
  const params = useLocalSearchParams<{
    region?: string;
    title?: string;
    shortName?: string;
  }>();

  const { t } = useI18n();

  const association = String(params.region ?? '').trim();
  const associationTitle = String(params.title ?? params.region ?? t('entities.association'));
  const shortName = String(params.shortName ?? association);

  const [favoriteSet, setFavoriteSet] = useState<Set<string>>(new Set());
  const [regions, setRegions] = useState<LeagueRegion[]>([]);
  const [classes, setClasses] = useState<LeagueClassReference[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<LeagueRegion | null>(null);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loading = loadingRegions || loadingClasses;

  const sortedRegions = useMemo(
      () =>
          [...regions].sort((left, right) => {
            if (left.type === 'association' && right.type !== 'association') return -1;
            if (left.type !== 'association' && right.type === 'association') return 1;
            return left.name.localeCompare(right.name, 'de');
          }),
      [regions],
  );

  const groupedClasses = useMemo(() => {
    const groups = new Map<string, LeagueClassReference[]>();

    for (const leagueClass of classes) {
      const key = leagueClass.contest?.trim() || t('region.classes');
      const current = groups.get(key) ?? [];
      current.push(leagueClass);
      groups.set(key, current);
    }

    return [...groups.entries()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes]);

  const loadFavorites = useCallback(async () => {
    const favorites = await getFavorites();
    setFavoriteSet(new Set(favorites.map((item) => favoriteKey(item.type, item.id))));
  }, []);

  useFocusEffect(
      useCallback(() => {
        loadFavorites().catch(() => undefined);
      }, [loadFavorites]),
  );

  const loadRegions = useCallback(async () => {
    if (!association) {
      setLoadingRegions(false);
      setError(t('region.associationCodeMissing'));
      return;
    }

    setLoadingRegions(true);
    setError(null);

    try {
      setRegions(await ttApi.getLeagueRegions(association, DEFAULT_SEASON));
    } catch (loadError) {
      setRegions([]);
      setError(loadError instanceof Error ? loadError.message : t('region.loadRegionsError'));
    } finally {
      setLoadingRegions(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [association]);

  useEffect(() => {
    loadRegions().catch(() => undefined);
  }, [loadRegions]);

  async function loadClasses(region: LeagueRegion) {
    setSelectedRegion(region);
    setClasses([]);
    setLoadingClasses(true);
    setError(null);

    try {
      setClasses(
          await ttApi.getLeagueClasses(
              region.association || association,
              region.championshipSlug,
              region.season || DEFAULT_SEASON,
          ),
      );
    } catch (loadError) {
      setClasses([]);
      setError(loadError instanceof Error ? loadError.message : t('region.loadClassesError'));
    } finally {
      setLoadingClasses(false);
    }
  }

  function backToRegions() {
    setSelectedRegion(null);
    setClasses([]);
    setError(null);
  }

  async function refresh() {
    if (selectedRegion) {
      await loadClasses(selectedRegion);
      return;
    }

    await loadRegions();
  }

  async function toggleFavorite(league: LeagueClassReference) {
    const key = favoriteKey('league', league.id);

    if (favoriteSet.has(key)) {
      await removeFavorite('league', league.id);

      setFavoriteSet((previous) => {
        const next = new Set(previous);
        next.delete(key);
        return next;
      });

      return;
    }

    await addFavorite({
      id: league.id,
      type: 'league',
      title: league.name,
      subtitle: `${league.association} • ${t('favorites.seasonValue', { season: formatSeasonLabel(league.season) })}`,
      params: {
        association: league.association,
        groupId: league.groupId,
        season: league.season,
        leagueSlug: league.leagueSlug ?? 'x',
        title: league.name,
      },
    });

    setFavoriteSet((previous) => new Set(previous).add(key));
  }

  function openLeague(league: LeagueClassReference) {
    router.push({
      pathname: '/league/[leagueKey]',
      params: {
        leagueKey: league.groupId,
        association: league.association,
        groupId: league.groupId,
        season: league.season,
        leagueSlug: league.leagueSlug ?? 'x',
        title: league.name,
      },
    });
  }

  return {
    associationTitle,
    shortName,
    favoriteSet,
    sortedRegions,
    groupedClasses,
    classes,
    selectedRegion,
    loading,
    error,
    loadClasses,
    backToRegions,
    refresh,
    toggleFavorite,
    openLeague,
  };
}
