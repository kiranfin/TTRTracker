import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ttApi } from '../../../src/api/tttracker';
import { Badge } from '../../../src/components/Badge';
import { Button, IconButton } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { Screen } from '../../../src/components/Screen';
import { addFavorite, favoriteKey, getFavorites, removeFavorite } from '../../../src/storage/favorites';
import { useTheme } from '../../../src/theme/ThemeProvider';
import type { LeagueClassReference, LeagueRegion } from '../../../src/types/tttracker';
import { levelTone } from '../../../src/utils/normalizers';

const DEFAULT_SEASON = '25/26';

export default function RegionLeaguesScreen() {
  const params = useLocalSearchParams<{
    region?: string;
    title?: string;
    shortName?: string;
  }>();

  const { colors } = useTheme();

  const association = String(params.region ?? '').trim();
  const associationTitle = String(params.title ?? params.region ?? 'Verband');
  const shortName = String(params.shortName ?? association);

  const [favoriteSet, setFavoriteSet] = useState<Set<string>>(new Set());
  const [regions, setRegions] = useState<LeagueRegion[]>([]);
  const [classes, setClasses] = useState<LeagueClassReference[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<LeagueRegion | null>(null);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loading = loadingRegions || loadingClasses;

  const pageTitle = selectedRegion ? selectedRegion.name : associationTitle;

  const pageSubtitle = selectedRegion
      ? `Spielklassen in ${selectedRegion.name}`
      : `Kreise und Bezirke im Verband ${shortName}`;

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
      const key = leagueClass.contest?.trim() || 'Spielklassen';
      const current = groups.get(key) ?? [];
      current.push(leagueClass);
      groups.set(key, current);
    }

    return [...groups.entries()];
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
      setError('Für diesen Verband fehlt der association-Code.');
      return;
    }

    setLoadingRegions(true);
    setError(null);

    try {
      const result = await ttApi.getLeagueRegions(association, DEFAULT_SEASON);
      setRegions(result);
    } catch (loadError) {
      setRegions([]);
      setError(loadError instanceof Error ? loadError.message : 'Kreise/Bezirke konnten nicht geladen werden');
    } finally {
      setLoadingRegions(false);
    }
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
      const result = await ttApi.getLeagueClasses(
          region.association || association,
          region.championshipSlug,
          region.season || DEFAULT_SEASON,
      );

      setClasses(result);
    } catch (loadError) {
      setClasses([]);
      setError(loadError instanceof Error ? loadError.message : 'Spielklassen konnten nicht geladen werden');
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
      subtitle: `${league.association} • Saison ${formatSeasonLabel(league.season)}`,
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

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Button
                variant="ghost"
                icon="arrow-back"
                onPress={selectedRegion ? backToRegions : () => router.push('/leagues')}
            >
              {' '}
            </Button>

            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                {pageTitle}
              </Text>

              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                {pageSubtitle}
              </Text>

              <View style={styles.metaRow}>
                <Badge tone="outline">{shortName}</Badge>
                <Badge tone="secondary">Saison {formatSeasonLabel(DEFAULT_SEASON)}</Badge>
              </View>
            </View>

            <IconButton icon="refresh-outline" onPress={refresh} accessibilityLabel="Neu laden" />
          </View>

          {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

          {error ? (
              <Card style={styles.errorCard}>
                <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>

                <Button variant="secondary" icon="refresh-outline" onPress={refresh}>
                  Erneut versuchen
                </Button>
              </Card>
          ) : null}

          {!loading && !error && !selectedRegion ? (
              <>
                {sortedRegions.length === 0 ? (
                    <EmptyState
                        icon="map-outline"
                        title="Keine Kreise oder Bezirke gefunden"
                        subtitle="Prüfe, ob dein Backend /api/leagues/:association/regions liefert."
                    />
                ) : (
                    <View style={styles.stack}>
                      {sortedRegions.map((region) => (
                          <Card
                              key={region.id}
                              pressable
                              style={styles.regionCard}
                              onPress={() => loadClasses(region)}
                          >
                            <View
                                style={[
                                  styles.iconBubble,
                                  {
                                    backgroundColor: colors.primarySoft,
                                    borderColor: colors.primarySoftBorder,
                                  },
                                ]}
                            >
                              <Ionicons
                                  name={region.type === 'association' ? 'trophy-outline' : 'map-outline'}
                                  size={20}
                                  color={colors.primary}
                              />
                            </View>

                            <View style={styles.cardText}>
                              <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                                {region.name}
                              </Text>

                              <Text style={[styles.cardSubtitle, { color: colors.mutedText }]} numberOfLines={1}>
                                {region.type === 'association' ? 'Verbandsspielklassen' : 'Kreis/Bezirk'}
                              </Text>
                            </View>

                            <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
                          </Card>
                      ))}
                    </View>
                )}
              </>
          ) : null}

          {!loading && !error && selectedRegion ? (
              <>
                {classes.length === 0 ? (
                    <EmptyState
                        icon="podium-outline"
                        title="Keine Spielklassen gefunden"
                        subtitle="Für diesen Kreis/Bezirk wurden keine Gruppen gefunden."
                    />
                ) : (
                    <View style={styles.stack}>
                      {groupedClasses.map(([groupTitle, groupClasses]) => (
                          <Card key={groupTitle} style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                              <Ionicons name="podium-outline" size={18} color={colors.primary} />

                              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                {groupTitle}
                              </Text>
                            </View>

                            <View style={styles.stack}>
                              {groupClasses.map((league) => {
                                const canOpen = Boolean(league.association && league.groupId);
                                const favorite = favoriteSet.has(favoriteKey('league', league.id));

                                return (
                                    <Card
                                        key={league.id}
                                        pressable={canOpen}
                                        onPress={canOpen ? () => openLeague(league) : undefined}
                                        style={styles.leagueCard}
                                    >
                                      <View style={styles.topRow}>
                                        <View
                                            style={[
                                              styles.iconBubble,
                                              {
                                                backgroundColor: colors.primarySoft,
                                                borderColor: colors.primarySoftBorder,
                                              },
                                            ]}
                                        >
                                          <Ionicons name="podium-outline" size={20} color={colors.primary} />
                                        </View>

                                        <View style={styles.cardText}>
                                          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
                                            {league.name}
                                          </Text>

                                          <View style={styles.metaLine}>
                                            <Ionicons name="calendar-outline" size={13} color={colors.mutedText} />
                                            <Text style={[styles.metaText, { color: colors.mutedText }]}>
                                              Saison {formatSeasonLabel(league.season)}
                                            </Text>
                                          </View>
                                        </View>

                                        <IconButton
                                            icon={favorite ? 'star' : 'star-outline'}
                                            active={favorite}
                                            onPress={() => toggleFavorite(league)}
                                        />
                                      </View>

                                      <View style={styles.badgeRow}>
                                        <Badge tone={levelTone(league.name)}>{league.name}</Badge>
                                        <Badge tone="outline">{league.association}</Badge>
                                        <Badge tone="secondary">Gruppe {league.groupId}</Badge>
                                      </View>

                                      {!canOpen ? (
                                          <Text style={[styles.warning, { color: colors.destructive }]}>
                                            Diese Spielklasse hat keine association/groupId und kann nicht geöffnet werden.
                                          </Text>
                                      ) : null}
                                    </Card>
                                );
                              })}
                            </View>
                          </Card>
                      ))}
                    </View>
                )}
              </>
          ) : null}
        </ScrollView>
      </Screen>
  );
}

function formatSeasonLabel(value?: string) {
  return String(value ?? DEFAULT_SEASON).replace(/--/g, '/');
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 112,
    gap: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  headerText: {
    flex: 1,
    gap: 5,
  },
  title: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
  },
  metaRow: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  loader: {
    paddingVertical: 24,
  },
  errorCard: {
    padding: 16,
    gap: 12,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  stack: {
    gap: 12,
  },
  regionCard: {
    minHeight: 76,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionCard: {
    padding: 14,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
  },
  leagueCard: {
    padding: 14,
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
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
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