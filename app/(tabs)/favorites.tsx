import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge } from '../../src/components/Badge';
import { IconButton } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { EmptyState } from '../../src/components/EmptyState';
import { Screen } from '../../src/components/Screen';
import { FavoriteItem, getFavorites, removeFavorite } from '../../src/storage/favorites';
import { useTheme } from '../../src/theme/ThemeProvider';
import { ttrTone } from '../../src/utils/normalizers';

export default function FavoritesScreen() {
  const { colors } = useTheme();
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

      router.push({
        pathname: '/player/[nuid]',
        params: {
          nuid,
          title: item.title,
          clubName: item.params?.clubName ?? item.subtitle ?? '',
          state: item.params?.state ?? '',
          ttr: item.params?.ttr ?? '',
        },
      });

      return;
    }

    if (item.type === 'club') {
      router.push({
        pathname: '/club/[clubKey]',
        params: {
          clubKey: item.id,
          title: item.title,
          organization: item.params?.organization ?? '',
          organizationName: item.params?.organizationName ?? '',
          clubNumber: item.params?.clubNumber ?? '',
          state: item.params?.state ?? '',
          externalId: item.params?.externalId ?? '',
        },
      });

      return;
    }

    if (item.type === 'league') {
      router.push({
        pathname: '/league/[leagueKey]',
        params: {
          leagueKey: item.params?.groupId ?? item.id,
          association: item.params?.association ?? '',
          groupId: item.params?.groupId ?? item.id,
          season: item.params?.season ?? '25/26',
          leagueSlug: item.params?.leagueSlug ?? 'x',
          title: item.params?.title ?? item.title,
        },
      });
    }
  }

  const players = favorites.filter((item) => item.type === 'player');
  const clubs = favorites.filter((item) => item.type === 'club');
  const leagues = favorites.filter((item) => item.type === 'league');

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.text }]}>Favoriten</Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]}>
              Deine gespeicherten Spieler, Vereine und Ligen
            </Text>
          </View>

          {favorites.length === 0 ? (
              <EmptyState
                  icon="star-outline"
                  title="Noch keine Favoriten"
                  subtitle="Speichere Spieler oder Vereine über das Stern-Icon."
              />
          ) : null}

          {players.length > 0 ? (
              <FavoriteSection title="Spieler" icon="person-outline" count={players.length}>
                {players.map((item) => (
                    <FavoritePlayerCard
                        key={`${item.type}-${item.id}`}
                        item={item}
                        onPress={() => openFavorite(item)}
                        onRemove={() => removeItem(item)}
                    />
                ))}
              </FavoriteSection>
          ) : null}

          {clubs.length > 0 ? (
              <FavoriteSection title="Vereine" icon="tennisball-outline" count={clubs.length}>
                {clubs.map((item) => (
                    <FavoriteClubCard
                        key={`${item.type}-${item.id}`}
                        item={item}
                        onPress={() => openFavorite(item)}
                        onRemove={() => removeItem(item)}
                    />
                ))}
              </FavoriteSection>
          ) : null}

          {leagues.length > 0 ? (
              <FavoriteSection title="Ligen" icon="podium-outline" count={leagues.length}>
                {leagues.map((item) => (
                    <FavoriteLeagueCard
                        key={`${item.type}-${item.id}`}
                        item={item}
                        onPress={() => openFavorite(item)}
                        onRemove={() => removeItem(item)}
                    />
                ))}
              </FavoriteSection>
          ) : null}
        </ScrollView>
      </Screen>
  );
}

function FavoriteSection({
                           title,
                           icon,
                           count,
                           children,
                         }: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  count: number;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();

  return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name={icon} size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
          </View>

          <Badge tone="secondary">{count}</Badge>
        </View>

        <View style={styles.stack}>{children}</View>
      </View>
  );
}

function FavoritePlayerCard({
                              item,
                              onPress,
                              onRemove,
                            }: {
  item: FavoriteItem;
  onPress: () => void;
  onRemove: () => void;
}) {
  const { colors } = useTheme();
  const ttr = Number(item.params?.ttr);
  const hasTtr = Number.isFinite(ttr) && ttr > 0;

  return (
      <Card pressable onPress={onPress} style={styles.resultCard}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardText}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.resultSubtitle, { color: colors.mutedText }]}>
              {item.params?.clubName || item.subtitle || 'Verein unbekannt'}
            </Text>
          </View>

          <IconButton icon="star" active onPress={onRemove} />
        </View>

        <View style={styles.badgeRow}>
          <Badge tone={ttrTone(hasTtr ? ttr : undefined)} icon="trophy-outline">
            TTR: {hasTtr ? ttr : '-'}
          </Badge>

          {item.params?.state ? <Badge tone="outline">{item.params.state}</Badge> : null}
        </View>
      </Card>
  );
}

function FavoriteClubCard({
                            item,
                            onPress,
                            onRemove,
                          }: {
  item: FavoriteItem;
  onPress: () => void;
  onRemove: () => void;
}) {
  const { colors } = useTheme();

  return (
      <Card pressable onPress={onPress} style={styles.resultCard}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardText}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.resultSubtitle, { color: colors.mutedText }]}>
              {[item.params?.organizationName, item.params?.organization].filter(Boolean).join(' • ') ||
                  item.subtitle ||
                  'Verband unbekannt'}
            </Text>
          </View>

          <IconButton icon="star" active onPress={onRemove} />
        </View>

        <View style={styles.badgeRow}>
          {item.params?.clubNumber ? (
              <Badge tone="secondary" icon="people-outline">#{item.params.clubNumber}</Badge>
          ) : null}

          {item.params?.state ? <Badge tone="outline">{item.params.state}</Badge> : null}
        </View>
      </Card>
  );
}

function FavoriteLeagueCard({
                              item,
                              onPress,
                              onRemove,
                            }: {
  item: FavoriteItem;
  onPress: () => void;
  onRemove: () => void;
}) {
  const { colors } = useTheme();

  return (
      <Card pressable onPress={onPress} style={styles.resultCard}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardText}>
            <Text style={[styles.resultTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.resultSubtitle, { color: colors.mutedText }]}>
              {item.subtitle || 'Liga'}
            </Text>
          </View>

          <IconButton icon="star" active onPress={onRemove} />
        </View>

        <View style={styles.badgeRow}>
          {item.params?.season ? <Badge tone="outline">Saison {item.params.season}</Badge> : null}
          {item.params?.association ? <Badge tone="secondary">{item.params.association}</Badge> : null}
        </View>
      </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 112,
    gap: 18,
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
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
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
});