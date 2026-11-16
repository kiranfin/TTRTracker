import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ttApi } from '@/src/api/tttracker';
import { useI18n } from '@/src/i18n/I18nProvider';
import { addFavorite, favoriteKey, getFavorites, removeFavorite } from '@/src/storage/favorites';
import { addRecentViewed, clearRecentViewed, getRecentViewed } from '@/src/storage/recentViewed';
import type { RecentViewedItem } from '@/src/storage/recentViewed';
import type { NormalizedClub, NormalizedPlayer } from '@/src/types/tttracker';
import { normalizeClub, normalizePlayer } from '@/src/utils/normalizers';
import type { SearchFilter } from '../types';
import { uniqueById } from '../utils';
import { describeApiError } from '@/src/utils/apiErrors';

export const SEARCH_DEBOUNCE_MS = 400;
export const SEARCH_MIN_CHARACTERS = 2;

export function useSearch() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [players, setPlayers] = useState<NormalizedPlayer[]>([]);
  const [clubs, setClubs] = useState<NormalizedClub[]>([]);
  const [favoriteSet, setFavoriteSet] = useState<Set<string>>(new Set());
  const [recent, setRecent] = useState<RecentViewedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Jede Suche bekommt eine Nummer, damit späte Antworten alter Eingaben verworfen werden.
  const requestCounter = useRef(0);

  const loadFavorites = useCallback(async () => {
    const favorites = await getFavorites();
    setFavoriteSet(new Set(favorites.map((item) => favoriteKey(item.type, item.id))));
  }, []);

  useFocusEffect(
      useCallback(() => {
        loadFavorites().catch(() => undefined);
        getRecentViewed().then(setRecent).catch(() => undefined);
      }, [loadFavorites]),
  );

  useEffect(() => {
    const text = query.trim();
    const requestId = ++requestCounter.current;

    if (text.length < SEARCH_MIN_CHARACTERS) {
      setPlayers([]);
      setClubs([]);
      setSearchedQuery('');
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const timer = setTimeout(() => {
      Promise.all([ttApi.searchPlayers(text), ttApi.searchClubs(text)])
          .then(([playerRows, clubRows]) => {
            if (requestId !== requestCounter.current) return;

            const normalizedPlayers = uniqueById(
                Array.isArray(playerRows) ? playerRows.map((row) => normalizePlayer(row)) : [],
            );

            const normalizedClubs = uniqueById(
                Array.isArray(clubRows) ? clubRows.map((row) => normalizeClub(row)) : [],
            );

            setPlayers(normalizedPlayers);
            setClubs(normalizedClubs);
            setSearchedQuery(text);

            // Der TTR kommt nur, wenn die Suche ihn schon mitliefert. Pro Treffer nachladen wäre ein
            // Request je Spieler, der öffentliche Wert wird erst beim Öffnen des Profils geholt.
          })
          .catch((searchError) => {
            if (requestId !== requestCounter.current) return;

            setPlayers([]);
            setClubs([]);
            setSearchedQuery(text);
            setError(describeApiError(searchError, t, 'search.failed'));
          })
          .finally(() => {
            if (requestId === requestCounter.current) setLoading(false);
          });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function findClubForPlayer(player: NormalizedPlayer) {
    const playerClubName = player.clubName.trim().toLowerCase();

    if (!playerClubName) return undefined;

    return clubs.find((club) => club.name.trim().toLowerCase() === playerClubName);
  }

  async function togglePlayerFavorite(player: NormalizedPlayer) {
    const key = favoriteKey('player', player.id);

    if (favoriteSet.has(key)) {
      await removeFavorite('player', player.id);
      setFavoriteSet((previous) => {
        const next = new Set(previous);
        next.delete(key);
        return next;
      });
      return;
    }

    const playerClub = findClubForPlayer(player);

    await addFavorite({
      id: player.id,
      type: 'player',
      title: player.fullName,
      subtitle: player.clubName,
      ttr: player.ttr,
      params: {
        clubName: player.clubName,
        clubKey: playerClub?.id ?? '',
        organization: playerClub?.organization ?? '',
        organizationName: playerClub?.organizationName ?? '',
        clubNumber: playerClub?.clubNumber ?? '',
        externalId: playerClub?.externalId ?? '',
        personId: player.personId ?? '',
        internalId: player.internalId ?? '',
        state: player.state ?? '',
        ttr: player.ttr ? String(player.ttr) : '',
      },
    });

    setFavoriteSet((previous) => new Set(previous).add(key));
  }

  async function toggleClubFavorite(club: NormalizedClub) {
    const key = favoriteKey('club', club.id);

    if (favoriteSet.has(key)) {
      await removeFavorite('club', club.id);
      setFavoriteSet((previous) => {
        const next = new Set(previous);
        next.delete(key);
        return next;
      });
      return;
    }

    await addFavorite({
      id: club.id,
      type: 'club',
      title: club.name,
      subtitle: [club.clubNumber, club.state ?? club.organization].filter(Boolean).join(' • '),
      params: {
        clubKey: club.id,
        organization: club.organization ?? '',
        organizationName: club.organizationName ?? '',
        clubNumber: club.clubNumber ?? '',
        state: club.state ?? '',
        externalId: club.externalId ?? '',
      },
    });

    setFavoriteSet((previous) => new Set(previous).add(key));
  }

  function openPlayerDetails(player: NormalizedPlayer) {
    if (!player.internalId) {
      setError(t('search.playerMissingNuid'));
      return;
    }

    const playerClub = findClubForPlayer(player);

    const params = {
      nuid: player.internalId,
      title: player.fullName,
      clubName: player.clubName,
      clubKey: playerClub?.id ?? '',
      organization: playerClub?.organization ?? '',
      organizationName: playerClub?.organizationName ?? '',
      clubNumber: playerClub?.clubNumber ?? '',
      state: player.state ?? playerClub?.state ?? '',
      externalId: playerClub?.externalId ?? '',
      ttr: player.ttr ? String(player.ttr) : '',
    };

    addRecentViewed({
      type: 'player',
      id: player.internalId,
      title: player.fullName,
      subtitle: player.clubName,
      params,
    }).catch(() => undefined);

    router.push({ pathname: '/player/[nuid]', params });
  }

  function openClubDetails(club: NormalizedClub) {
    const params = {
      clubKey: club.id,
      title: club.name,
      organization: club.organization ?? '',
      organizationName: club.organizationName ?? '',
      clubNumber: club.clubNumber ?? '',
      state: club.state ?? '',
      externalId: club.externalId ?? '',
    };

    addRecentViewed({
      type: 'club',
      id: club.id,
      title: club.name,
      subtitle: [club.organizationName, club.organization].filter(Boolean).join(' • '),
      params,
    }).catch(() => undefined);

    router.push({ pathname: '/club/[clubKey]', params });
  }

  function openRecent(item: RecentViewedItem) {
    addRecentViewed({
      type: item.type,
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      params: item.params,
    }).catch(() => undefined);

    if (item.type === 'player') {
      router.push({ pathname: '/player/[nuid]', params: { ...item.params, nuid: item.params.nuid ?? item.id } });
      return;
    }

    router.push({ pathname: '/club/[clubKey]', params: { ...item.params, clubKey: item.params.clubKey ?? item.id } });
  }

  async function clearRecent() {
    await clearRecentViewed();
    setRecent([]);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
  }

  const hasQuery = query.trim().length >= SEARCH_MIN_CHARACTERS;
  // Ergebnisse gehören zur aktuellen Eingabe (nicht zu einer älteren)
  const resultsCurrent = hasQuery && searchedQuery === query.trim() && !loading;

  return {
    query,
    searchedQuery,
    filter,
    setFilter,
    players,
    clubs,
    favoriteSet,
    recent,
    loading,
    error,
    hasQuery,
    resultsCurrent,
    handleQueryChange,
    togglePlayerFavorite,
    toggleClubFavorite,
    openPlayerDetails,
    openClubDetails,
    openRecent,
    clearRecent,
  };
}
