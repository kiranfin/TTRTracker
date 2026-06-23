import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ttApi } from '../../src/api/tttracker';
import { Badge } from '../../src/components/Badge';
import { BottomSheet } from '../../src/components/BottomSheet';
import { Button, IconButton } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { EmptyState } from '../../src/components/EmptyState';
import { Screen } from '../../src/components/Screen';
import { SearchInput } from '../../src/components/SearchInput';
import { SegmentedTabs } from '../../src/components/SegmentedTabs';
import { addFavorite, favoriteKey, getFavorites, removeFavorite } from '../../src/storage/favorites';
import { useTheme } from '../../src/theme/ThemeProvider';
import type { ClubTeam, NormalizedClub, NormalizedPlayer, SearchCategory } from '../../src/types/tttracker';
import { normalizeClub, normalizePlayer, normalizeTeams, ttrTone } from '../../src/utils/normalizers';

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.id;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export default function SearchScreen() {
  const { colors } = useTheme();
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
      setError('Bitte mindestens 2 Zeichen eingeben.');
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
      setError(searchError instanceof Error ? searchError.message : 'Suche fehlgeschlagen');
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
    { value: 'players' as const, label: players.length > 0 ? `Spieler ${players.length}` : 'Spieler', icon: 'person-outline' as const },
    { value: 'clubs' as const, label: clubs.length > 0 ? `Vereine ${clubs.length}` : 'Vereine', icon: "tennisball-outline" as const },
  ], [clubs.length, players.length]);

  const hasSubmitted = submittedQuery.length > 0;
  const queryChanged = query.trim().length > 0 && query.trim() !== submittedQuery;

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.text }]}>Suche</Text>
          </View>

          <SegmentedTabs value={activeTab} onChange={setActiveTab} options={tabOptions} />

          <View style={styles.searchBlock}>
            <SearchInput
                value={query}
                onChangeText={handleQueryChange}
                onSubmitEditing={runSearch}
                placeholder="Name oder Verein eingeben..."
            />
            <Button
                icon="search-outline"
                loading={loading}
                disabled={loading || query.trim().length < 2}
                onPress={runSearch}
                style={styles.searchButton}
            >
              Suchen
            </Button>
          </View>

          {queryChanged ? (
              <Text style={[styles.hint, { color: colors.mutedText }]}>Tippe auf „Suchen“, um die Ergebnisse zu aktualisieren.</Text>
          ) : null}

          {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
          {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

          {!loading && activeTab === 'players' ? (
              <View style={styles.stack}>
                {!query.trim() ? <EmptyState icon="search-outline" title="Suchbegriff eingeben" /> : null}
                {query.trim() && !hasSubmitted ? <EmptyState icon="arrow-up-circle-outline" title="Bereit zum Suchen" subtitle="Tippe auf Suchen, damit dein Backend angefragt wird." /> : null}
                {hasSubmitted && players.length === 0 ? <EmptyState icon="person-outline" title="Keine Spieler gefunden" subtitle={`Keine Treffer für „${submittedQuery}“`} /> : null}

                {players.map((player, index) => (
                    <PlayerCard
                        key={`player-${player.id}-${player.internalId ?? ''}-${player.personId ?? ''}-${index}`}
                        player={player}
                        favorite={favoriteSet.has(favoriteKey('player', player.id))}
                        onPress={() => setSelectedPlayer(player)}
                        onToggleFavorite={() => togglePlayerFavorite(player)}
                    />
                ))}
              </View>
          ) : null}

          {!loading && activeTab === 'clubs' ? (
              <View style={styles.stack}>
                {!query.trim() ? <EmptyState icon="search-outline" title="Suchbegriff eingeben" subtitle="Die Suche startet erst über den Suchen-Button." /> : null}
                {query.trim() && !hasSubmitted ? <EmptyState icon="arrow-up-circle-outline" title="Bereit zum Suchen" subtitle="Tippe auf Suchen, damit dein Backend angefragt wird." /> : null}
                {hasSubmitted && clubs.length === 0 ? <EmptyState icon="business-outline" title="Keine Vereine gefunden" subtitle={`Keine Treffer für „${submittedQuery}“`} /> : null}

                {clubs.map((club, index) => (
                    <ClubCard
                        key={`club-${club.id}-${club.clubNumber ?? ''}-${index}`}
                        club={club}
                        favorite={favoriteSet.has(favoriteKey('club', club.id))}
                        onPress={() => openClub(club)}
                        onToggleFavorite={() => toggleClubFavorite(club)}
                    />
                ))}
              </View>
          ) : null}
        </ScrollView>

        <BottomSheet
            visible={!!selectedPlayer}
            title={selectedPlayer?.fullName ?? ''}
            onClose={() => setSelectedPlayer(null)}
            headerRight={
              selectedPlayer ? (
                  <IconButton
                      icon={favoriteSet.has(favoriteKey('player', selectedPlayer.id)) ? 'star' : 'star-outline'}
                      active={favoriteSet.has(favoriteKey('player', selectedPlayer.id))}
                      onPress={() => togglePlayerFavorite(selectedPlayer)}
                  />
              ) : null
            }
        >
          {selectedPlayer ? (
              <View style={styles.sheetStack}>
                <DetailRow label="Verein" value={selectedPlayer.clubName} />
                <DetailRow label="TTR" value={selectedPlayer.ttr ? String(selectedPlayer.ttr) : 'Nicht verfügbar'} />

                {selectedPlayer.internalId ? (
                    <Button icon="stats-chart-outline" onPress={() => openPlayerDetails(selectedPlayer)}>
                      See more
                    </Button>
                ) : (
                    <Text style={[styles.sheetMuted, { color: colors.mutedText }]}>Für diesen Spieler fehlt die NUID.</Text>
                )}
              </View>
          ) : null}
        </BottomSheet>

        <BottomSheet
            visible={!!selectedClub}
            title={selectedClub?.name ?? ''}
            onClose={() => setSelectedClub(null)}
            headerRight={
              selectedClub ? (
                  <IconButton
                      icon={favoriteSet.has(favoriteKey('club', selectedClub.id)) ? 'star' : 'star-outline'}
                      active={favoriteSet.has(favoriteKey('club', selectedClub.id))}
                      onPress={() => toggleClubFavorite(selectedClub)}
                  />
              ) : null
            }
        >
          {selectedClub ? (
              <View style={styles.sheetStack}>
                <DetailRow label="Vereinsnummer" value={selectedClub.clubNumber ?? 'Nicht gefunden'} monospace />
                <DetailRow label="Bundesland" value={selectedClub.state ?? 'Nicht verfügbar'} />
                <DetailRow label="Verband" value={selectedClub.organization ?? selectedClub.organizationName ?? 'Unbekannt'} />

                <View style={styles.sheetStatRow}>
                  <Badge tone="secondary" icon="people-outline">{clubTeams.length} Teams</Badge>
                  {selectedClub.organization ? <Badge tone="outline">{selectedClub.organization}</Badge> : null}
                </View>

                {loadingTeams ? <ActivityIndicator color={colors.primary} /> : null}

                <Button icon="business-outline" onPress={() => openClubDetails(selectedClub)}>
                  See more
                </Button>
              </View>
          ) : null}
        </BottomSheet>
      </Screen>
  );
}

function PlayerCard({
                      player,
                      favorite,
                      onPress,
                      onToggleFavorite,
                    }: {
  player: NormalizedPlayer;
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const { colors } = useTheme();

  return (
      <Card pressable onPress={onPress} style={styles.resultCard}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardText}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>{player.fullName}</Text>
            <Text style={[styles.resultSubtitle, { color: colors.mutedText }]}>{player.clubName}</Text>
          </View>
          <IconButton icon={favorite ? 'star' : 'star-outline'} active={favorite} onPress={onToggleFavorite} />
        </View>

        <View style={styles.badgeRow}>
          <Badge tone={ttrTone(player.ttr)} icon="trophy-outline">TTR: {player.ttr ?? '-'}</Badge>
          {player.state ? <Badge tone="outline">{player.state}</Badge> : null}
        </View>
      </Card>
  );
}

function ClubCard({
                    club,
                    favorite,
                    onPress,
                    onToggleFavorite,
                  }: {
  club: NormalizedClub;
  favorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  const { colors } = useTheme();

  return (
      <Card pressable onPress={onPress} style={styles.resultCard}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardText}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>{club.name}</Text>
            <Text style={[styles.resultSubtitle, { color: colors.mutedText }]}>
              {[club.organizationName, club.organization].filter(Boolean).join(' • ') || 'Verband unbekannt'}
            </Text>
          </View>
          <IconButton icon={favorite ? 'star' : 'star-outline'} active={favorite} onPress={onToggleFavorite} />
        </View>

        <View style={styles.badgeRow}>
          {club.clubNumber ? <Badge tone="secondary" icon="people-outline">#{club.clubNumber}</Badge> : null}
          {club.state ? <Badge tone="outline">{club.state}</Badge> : null}
        </View>
      </Card>
  );
}

function DetailRow({ label, value, monospace }: { label: string; value: string; monospace?: boolean }) {
  const { colors } = useTheme();

  return (
      <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
        <Text style={[styles.detailLabel, { color: colors.mutedText }]}>{label}</Text>
        <Text style={[styles.detailValue, monospace && styles.monospace, { color: colors.text }]} numberOfLines={3}>{value}</Text>
      </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 112,
    gap: 16,
  },
  titleBlock: {
    gap: 4,
  },
  title: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
  },
  searchBlock: {
    gap: 10,
  },
  searchButton: {
    minHeight: 48,
    borderRadius: 16,
  },
  loader: {
    paddingVertical: 16,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
  stack: {
    gap: 12,
  },
  resultCard: {
    padding: 16,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  resultSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  badgeRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sheetStack: {
    gap: 12,
    paddingBottom: 8,
  },
  detailRow: {
    minHeight: 45,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  monospace: {
    fontVariant: ['tabular-nums'],
  },
  sheetMuted: {
    fontSize: 14,
    lineHeight: 20,
  },
  sheetStatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});