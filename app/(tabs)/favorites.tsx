import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Chip, ChipRow } from '@/src/components/Chip';
import { EmptyState } from '@/src/components/EmptyState';
import { ListGroup } from '@/src/components/ListGroup';
import { Screen } from '@/src/components/Screen';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useI18n } from '@/src/i18n/I18nProvider';
import type { FavoriteItem, FavoriteType } from '@/src/storage/favorites';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { FavoriteRow } from '../../src/features/favorites/components';
import { useFavorites } from '../../src/features/favorites/hooks/useFavorites';
import { styles } from '../../src/features/favorites/styles';

type FavoritesFilter = 'all' | FavoriteType;

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { favorites, players, clubs, leagues, openFavorite, removeItem } = useFavorites();
  const [filter, setFilter] = useState<FavoritesFilter>('all');
  const [editRequested, setEditRequested] = useState(false);
  const editing = editRequested && favorites.length > 0;

  const groups: { type: FavoriteType; title: string; items: FavoriteItem[] }[] = [
    { type: 'player', title: t('entities.players'), items: players },
    { type: 'club', title: t('entities.clubs'), items: clubs },
    { type: 'league', title: t('entities.leagues'), items: leagues },
  ];

  // Ein Filter auf einen leer gewordenen Typ fällt auf "Alle" zurück
  const activeFilter: FavoritesFilter =
      filter !== 'all' && groups.find((group) => group.type === filter)?.items.length === 0 ? 'all' : filter;

  const visibleGroups = groups.filter(
      (group) => group.items.length > 0 && (activeFilter === 'all' || activeFilter === group.type),
  );

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[typography.titleLarge, { color: colors.text }]}>{t('favorites.title')}</Text>

            {favorites.length > 0 ? (
                <Pressable
                    accessibilityRole="button"
                    onPress={() => setEditRequested((current) => !current)}
                    style={styles.editButton}
                >
                  <Text style={[typography.body, styles.editText, { color: colors.primary }]}>
                    {editing ? t('favorites.done') : t('favorites.edit')}
                  </Text>
                </Pressable>
            ) : null}
          </View>

          {favorites.length === 0 ? (
              <EmptyState
                  icon="star-outline"
                  title={t('favorites.emptyTitle')}
                  subtitle={t('favorites.emptySubtitle')}
              />
          ) : (
              <>
                <ChipRow>
                  <Chip
                      label={t('common.all')}
                      count={favorites.length}
                      active={activeFilter === 'all'}
                      onPress={() => setFilter('all')}
                  />

                  {groups
                      .filter((group) => group.items.length > 0)
                      .map((group) => (
                          <Chip
                              key={group.type}
                              label={group.title}
                              count={group.items.length}
                              active={activeFilter === group.type}
                              onPress={() => setFilter(group.type)}
                          />
                      ))}
                </ChipRow>

                {visibleGroups.map((group) => (
                    <View key={group.type} style={styles.section}>
                      {activeFilter === 'all' ? <SectionHeader title={group.title} /> : null}

                      <ListGroup>
                        {group.items.map((item) => (
                            <FavoriteRow
                                key={`${item.type}-${item.id}`}
                                item={item}
                                editing={editing}
                                onPress={() => openFavorite(item)}
                                onRemove={() => {
                                  removeItem(item).catch(() => undefined);
                                }}
                            />
                        ))}
                      </ListGroup>
                    </View>
                ))}
              </>
          )}
        </ScrollView>
      </Screen>
  );
}
