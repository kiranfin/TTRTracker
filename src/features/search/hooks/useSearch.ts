import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { ttApi } from '@/src/api/tttracker';
import { useI18n } from '@/src/i18n/I18nProvider';
import { addFavorite, favoriteKey, getFavorites, removeFavorite } from '@/src/storage/favorites';
import type { ClubTeam, NormalizedClub, NormalizedPlayer, SearchCategory } from '@/src/types/tttracker';
import { normalizeClub, normalizePlayer, normalizeTeams } from '@/src/utils/normalizers';
import { uniqueById } from '../utils';

export function useSearch() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchCategory>('players');
  const [players, setPlayers] = useState<NormalizedPlayer[]>([]);
  const [clubs, setClubs] = useState<NormalizedClub[]>([]);
  const [favoriteSet, setFavoriteSet] = useState<Set<string>>(new Set());
  const [selectedPlayer, setSelectedPlayer] = useState<NormalizedPlayer | null>(null);
  const [selectedClub, setSelectedClub] = useState<NormalizedClub | null>(null);
  const [clubTeams, setClubTeams] = useState<ClubTeam[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    const favorites = await getFavorites();
    setFavoriteSet(new Set(favorites.map((item) => favoriteKey(item.type, item.id))));
  }, []);

  useFocusEffect(useCallback(() => {
    loadFavorites().catch(() => undefined);
  }, [loadFavorites]));

  const resetSearchResults = useCallback(() => {
    setSubmittedQuery('');
    setPlayers([]);
    setClubs([]);
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    setError(null);

    if (!value.trim()) {
      resetSearchResults();
      return;
    }

    if (submittedQuery && value.trim() !== submittedQuery) {
      setPlayers([]);
      setClubs([]);
    }
  }

  async function enrichPlayersWithTtr(items: NormalizedPlayer[]) {
    const safeItems = Array.isArray(items) ? items : [];

    const enriched = await Promise.all(
        safeItems.map(async (player) => {
          if (!player.internalId) return player;

          try {
            const response = await ttApi.getPlayerTtr(player.internalId);
            return {
              ...player,
              ttr: response.data.ttr ?? player.ttr,
            };
          } catch {
            return player;
          }
        })
    );

    return enriched;
  }

  const runSearch = useCallback(async () => {
    const text = query.trim();
    setError(null);

    if (text.length < 2) {
      resetSearchResults();
      setError(t('search.minCharacters'));
      return;
    }

    setLoading(true);

    try {
      const [playerRows, clubRows] = await Promise.all([
        ttApi.searchPlayers(text),
        ttApi.searchClubs(text),
      ]);

      const normalizedPlayers = uniqueById(
          Array.isArray(playerRows)
              ? playerRows.map((row) => normalizePlayer(row))
              : []
      );

      const normalizedClubs = uniqueById(
          Array.isArray(clubRows)
              ? clubRows.map((row) => normalizeClub(row))
              : []
      );

      setSubmittedQuery(text);
      setClubs(normalizedClubs);
      setPlayers(normalizedPlayers);

      const playersWithTtr = await enrichPlayersWithTtr(normalizedPlayers);
      setPlayers(playersWithTtr);
    } catch (searchError) {
      setSubmittedQuery(text);
      setPlayers([]);
      setClubs([]);
      setError(searchError instanceof Error ? searchError.message : t('search.failed'));
    } finally {
      setLoading(false);
    }
  }, [query, resetSearchResults]);

  function findClubForPlayer(player: NormalizedPlayer) {
    const playerClubName = player.clubName.trim().toLowerCase();

    if (!playerClubName) return undefined;

    return clubs.find((club) => {
      return club.name.trim().toLowerCase() === playerClubName;
    });
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

  async function openClub(club: NormalizedClub) {
    setSelectedClub(club);
    setClubTeams([]);

    if (!club.organization || !club.clubNumber) return;

    setLoadingTeams(true);

    try {
      const response = await ttApi.getClubTeams(club.organization, club.clubNumber);
      setClubTeams(normalizeTeams(response));
    } catch {
      setClubTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  }

  function openPlayerDetails(player: NormalizedPlayer) {
    if (!player.internalId) return;

    const playerClub = findClubForPlayer(player);

    setSelectedPlayer(null);

    router.push({
      pathname: '/player/[nuid]',
      params: {
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
      },
    });
  }

  function openClubDetails(club: NormalizedClub) {
    setSelectedClub(null);

    router.push({
      pathname: '/club/[clubKey]',
      params: {
        clubKey: club.id,
        title: club.name,
        organization: club.organization ?? '',
        organizationName: club.organizationName ?? '',
        clubNumber: club.clubNumber ?? '',
        state: club.state ?? '',
        externalId: club.externalId ?? '',
      },
    });
  }

  const tabOptions = useMemo(() => [
    { value: 'players' as const, label: players.length > 0 ? t('search.playersTabCount', { count: players.length }) : t('search.playersTab'), icon: 'person-outline' as const },
    { value: 'clubs' as const, label: clubs.length > 0 ? t('search.clubsTabCount', { count: clubs.length }) : t('search.clubsTab'), icon: "tennisball-outline" as const },
  ], [clubs.length, players.length, t]);

  const hasSubmitted = submittedQuery.length > 0;
  const queryChanged = query.trim().length > 0 && query.trim() !== submittedQuery;
  return {
    query,
    submittedQuery,
    activeTab,
    setActiveTab,
    players,
    clubs,
    favoriteSet,
    selectedPlayer,
    setSelectedPlayer,
    selectedClub,
    setSelectedClub,
    clubTeams,
    loading,
    loadingTeams,
    error,
    handleQueryChange,
    runSearch,
    togglePlayerFavorite,
    toggleClubFavorite,
    openClub,
    openPlayerDetails,
    openClubDetails,
    tabOptions,
    hasSubmitted,
    queryChanged,
  };
}
