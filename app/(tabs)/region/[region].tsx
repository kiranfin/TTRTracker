import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ttApi } from '../../../src/api/tttracker';
import { Badge } from '../../../src/components/Badge';
import { Button, IconButton } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { Screen } from '../../../src/components/Screen';
import { getRegionById } from '../../../src/data/leagues';
import { addFavorite, favoriteKey, getFavorites, removeFavorite } from '../../../src/storage/favorites';
import { useTheme } from '../../../src/theme/ThemeProvider';
import type { LeagueReference } from '../../../src/types/tttracker';
import { levelTone, normalizeLeagues } from '../../../src/utils/normalizers';

export default function RegionLeaguesScreen() {
  const { region } = useLocalSearchParams<{ region: string }>();
  const { colors } = useTheme();
  const selectedRegion = getRegionById(region);
  const regionName = selectedRegion?.name ?? 'Unbekanntes Bundesland';
  const [favoriteSet, setFavoriteSet] = useState<Set<string>>(new Set());
  const [leagues, setLeagues] = useState<LeagueReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    const favorites = await getFavorites();
    setFavoriteSet(new Set(favorites.map((item) => favoriteKey(item.type, item.id))));
  }, []);

  useFocusEffect(useCallback(() => {
    loadFavorites().catch(() => undefined);
  }, [loadFavorites]));

  const loadLeagues = useCallback(async () => {
    if (!selectedRegion) {
      setLoading(false);
      setError('Dieses Bundesland ist nicht bekannt.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await ttApi.getLeaguesByRegion(selectedRegion.name);
      setLeagues(normalizeLeagues(response, selectedRegion.name));
    } catch (loadError) {
      setLeagues([]);
      setError(loadError instanceof Error ? loadError.message : 'Ligen konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }, [selectedRegion]);

  useEffect(() => {
    loadLeagues().catch(() => undefined);
  }, [loadLeagues]);

  async function toggleFavorite(league: LeagueReference) {
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
      subtitle: `${league.region} • Saison ${league.season}`,
      params: {
        association: league.association ?? '',
        groupId: league.groupId ?? '',
        season: league.season,
        leagueSlug: league.leagueSlug ?? 'x',
        title: league.name,
      },
    });
    setFavoriteSet((previous) => new Set(previous).add(key));
  }

  function openLeague(league: LeagueReference) {
    router.push({
      pathname: '/league/[leagueKey]',
      params: {
        leagueKey: league.groupId ?? league.id,
        association: league.association ?? '',
        groupId: league.groupId ?? '',
        season: league.season,
        leagueSlug: league.leagueSlug ?? 'x',
        title: league.name,
      },
    });
  }

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Button variant="ghost" icon="arrow-back" onPress={() => router.push('/leagues')}> </Button>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>{regionName}</Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>Ligen aus deinem Backend</Text>
            </View>
            <IconButton icon="refresh-outline" onPress={loadLeagues} accessibilityLabel="Ligen neu laden" />
          </View>

          {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
          {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

          {!loading && !error && leagues.length === 0 ? (
              <EmptyState
                  icon="podium-outline"
                  title="Keine Ligen gefunden"
                  subtitle="Dein Backend muss dafür einen GET /api/leagues?region=... Endpoint liefern."
              />
          ) : null}

          {!loading && leagues.length > 0 ? (
              <View style={styles.stack}>
                {leagues.map((league) => {
                  const canOpen = Boolean(league.association && league.groupId);
                  const favorite = favoriteSet.has(favoriteKey('league', league.id));

                  return (
                      <Card key={league.id} pressable={canOpen} onPress={canOpen ? () => openLeague(league) : undefined} style={styles.leagueCard}>
                        <View style={styles.topRow}>
                          <View style={[styles.iconBubble, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder }]}>
                            <Ionicons name="podium-outline" size={20} color={colors.primary} />
                          </View>
                          <View style={styles.cardText}>
                            <Text style={[styles.leagueTitle, { color: colors.text }]}>{league.name}</Text>
                            <View style={styles.metaLine}>
                              <Ionicons name="calendar-outline" size={13} color={colors.mutedText} />
                              <Text style={[styles.metaText, { color: colors.mutedText }]}>Saison {league.season}</Text>
                            </View>
                          </View>
                          <IconButton icon={favorite ? 'star' : 'star-outline'} active={favorite} onPress={() => toggleFavorite(league)} />
                        </View>

                        <View style={styles.badgeRow}>
                          {league.level ? <Badge tone={levelTone(league.level)}>{league.level}</Badge> : null}
                          {league.association ? <Badge tone="outline">{league.association}</Badge> : null}
                          {league.groupId ? <Badge tone="secondary">Gruppe {league.groupId}</Badge> : null}
                        </View>

                        {!canOpen ? (
                            <Text style={[styles.warning, { color: colors.destructive }]}>Diese Liga hat keine association/groupId und kann nicht geöffnet werden.</Text>
                        ) : null}
                      </Card>
                  );
                })}
              </View>
          ) : null}
        </ScrollView>
      </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 112,
    gap: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerText: {
    flex: 1,
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
  loader: {
    paddingVertical: 24,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
  },
  stack: {
    gap: 12,
  },
  leagueCard: {
    padding: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: 5,
  },
  leagueTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  warning: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
});