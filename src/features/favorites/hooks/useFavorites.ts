import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { FavoriteItem, getFavorites, removeFavorite } from '@/src/storage/favorites';
import { addRecentViewed } from '@/src/storage/recentViewed';
import { getCurrentSeason } from '@/src/utils/dates';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  const loadFavorites = useCallback(async () => {
    const items = await getFavorites();
    setFavorites(items);
  }, []);

  useFocusEffect(
      useCallback(() => {
        loadFavorites().catch(() => undefined);
      }, [loadFavorites])
  );

  async function removeItem(item: FavoriteItem) {
    await removeFavorite(item.type, item.id);
    await loadFavorites();
  }

  function openFavorite(item: FavoriteItem) {
    if (item.type === 'player') {
      const nuid = item.params?.internalId || item.id;

      if (!nuid) return;

      const params = {
        nuid,
        title: item.title,
        clubName: item.params?.clubName ?? item.subtitle ?? '',
        clubKey: item.params?.clubKey ?? '',
        organization: item.params?.organization ?? '',
        organizationName: item.params?.organizationName ?? '',
        clubNumber: item.params?.clubNumber ?? '',
        state: item.params?.state ?? '',
        externalId: item.params?.externalId ?? '',
        ttr: item.params?.ttr ?? '',
      };

      addRecentViewed({ type: 'player', id: nuid, title: item.title, subtitle: params.clubName, params }).catch(
          () => undefined,
      );

      router.push({ pathname: '/player/[nuid]', params });

      return;
    }

    if (item.type === 'club') {
      const params = {
        clubKey: item.id,
        title: item.title,
        organization: item.params?.organization ?? '',
        organizationName: item.params?.organizationName ?? '',
        clubNumber: item.params?.clubNumber ?? '',
        state: item.params?.state ?? '',
        externalId: item.params?.externalId ?? '',
      };

      addRecentViewed({
        type: 'club',
        id: item.id,
        title: item.title,
        subtitle: [params.organizationName, params.organization].filter(Boolean).join(' • '),
        params,
      }).catch(() => undefined);

      router.push({ pathname: '/club/[clubKey]', params });

      return;
    }

    if (item.type === 'league') {
      router.push({
        pathname: '/league/[leagueKey]',
        params: {
          leagueKey: item.params?.groupId ?? item.id,
          association: item.params?.association ?? '',
          groupId: item.params?.groupId ?? item.id,
          season: item.params?.season || getCurrentSeason(),
          leagueSlug: item.params?.leagueSlug ?? 'x',
          title: item.params?.title ?? item.title,
        },
      });
    }
  }

  const players = useMemo(
      () => favorites.filter((item) => item.type === 'player'),
      [favorites],
  );
  const clubs = useMemo(
      () => favorites.filter((item) => item.type === 'club'),
      [favorites],
  );
  const leagues = useMemo(
      () => favorites.filter((item) => item.type === 'league'),
      [favorites],
  );

  return {
    favorites,
    players,
    clubs,
    leagues,
    openFavorite,
    removeItem,
  };
}
