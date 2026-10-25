import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Avatar } from '@/src/components/Avatar';
import { Chip, ChipRow } from '@/src/components/Chip';
import { EmptyState } from '@/src/components/EmptyState';
import { ListGroup } from '@/src/components/ListGroup';
import { ListRow } from '@/src/components/ListRow';
import { Screen } from '@/src/components/Screen';
import { SearchInput } from '@/src/components/SearchInput';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useI18n } from '@/src/i18n/I18nProvider';
import { favoriteKey } from '@/src/storage/favorites';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { PlayerRow, ClubRow } from '../../src/features/search/components';
import { styles } from '../../src/features/search/styles';
import { useSearch } from '../../src/features/search/hooks/useSearch';
import { SkeletonList } from '@/src/components/SkeletonRow';

const OVERVIEW_LIMIT = 4;

// Letzte Zeile einer gekürzten Liste: "Alle 14 Spieler anzeigen"
function ShowAllRow({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();

  return (
      <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [styles.showAllRow, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Text style={[typography.metaStrong, styles.showAllText, { color: colors.primary }]}>{label}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.primary} />
      </Pressable>
  );
}

export default function SearchScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const {
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
  } = useSearch();

  const showPlayers = filter === 'all' || filter === 'players';
  const showClubs = filter === 'all' || filter === 'clubs';
  const visiblePlayers = filter === 'all' ? players.slice(0, OVERVIEW_LIMIT) : players;
  const visibleClubs = filter === 'all' ? clubs.slice(0, OVERVIEW_LIMIT) : clubs;

  const nothingFound =
      resultsCurrent &&
      ((filter === 'all' && players.length === 0 && clubs.length === 0) ||
          (filter === 'players' && players.length === 0) ||
          (filter === 'clubs' && clubs.length === 0));

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={[typography.titleLarge, { color: colors.text }]}>{t('search.title')}</Text>

          <SearchInput value={query} onChangeText={handleQueryChange} placeholder={t('search.placeholder')} />

          {hasQuery ? (
              <ChipRow>
                <Chip label={t('common.all')} active={filter === 'all'} onPress={() => setFilter('all')} />
                <Chip
                    label={t('entities.players')}
                    count={resultsCurrent ? players.length : undefined}
                    active={filter === 'players'}
                    onPress={() => setFilter('players')}
                />
                <Chip
                    label={t('entities.clubs')}
                    count={resultsCurrent ? clubs.length : undefined}
                    active={filter === 'clubs'}
                    onPress={() => setFilter('clubs')}
                />
              </ChipRow>
          ) : null}

          {error ? <Text style={[typography.meta, { color: colors.destructive }]}>{error}</Text> : null}

          {loading ? <SkeletonList count={3} /> : null}

          {!hasQuery && query.trim().length > 0 ? (
              <Text style={[typography.meta, { color: colors.mutedText }]}>{t('search.minCharacters')}</Text>
          ) : null}

          {!hasQuery && query.trim().length === 0 ? (
              recent.length > 0 ? (
                  <View style={styles.section}>
                    <SectionHeader
                        variant="label"
                        title={t('search.recentTitle')}
                        actionLabel={t('search.clearRecent')}
                        onActionPress={() => {
                          clearRecent().catch(() => undefined);
                        }}
                    />

                    <ListGroup>
                      {recent.map((item) => (
                          <ListRow
                              key={`${item.type}-${item.id}`}
                              leading={
                                item.type === 'player' ? (
                                    <Avatar name={item.title} size={40} />
                                ) : (
                                    <Avatar icon="business-outline" shape="square" size={40} />
                                )
                              }
                              title={item.title}
                              subtitle={item.subtitle || undefined}
                              trailing={<Ionicons name="time-outline" size={18} color={colors.mutedText} />}
                              chevron={false}
                              onPress={() => openRecent(item)}
                          />
                      ))}
                    </ListGroup>
                  </View>
              ) : (
                  <EmptyState icon="search-outline" title={t('search.enterTerm')} />
              )
          ) : null}

          {nothingFound ? (
              <EmptyState
                  icon="search-outline"
                  title={filter === 'clubs' ? t('search.noClubs') : filter === 'players' ? t('search.noPlayers') : t('search.noResults')}
                  subtitle={t('search.noResultsFor', { query: searchedQuery })}
              />
          ) : null}

          {resultsCurrent && showPlayers && visiblePlayers.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader variant="label" title={t('entities.players')} />

                <ListGroup>
                  {visiblePlayers.map((player, index) => (
                      <PlayerRow
                          key={`player-${player.id}-${player.internalId ?? ''}-${index}`}
                          player={player}
                          favorite={favoriteSet.has(favoriteKey('player', player.id))}
                          onPress={() => openPlayerDetails(player)}
                          onToggleFavorite={() => {
                            togglePlayerFavorite(player).catch(() => undefined);
                          }}
                      />
                  ))}
                  {filter === 'all' && players.length > OVERVIEW_LIMIT ? (
                      <ShowAllRow
                          label={t('search.showAllPlayers', { count: players.length })}
                          onPress={() => setFilter('players')}
                      />
                  ) : null}
                </ListGroup>
              </View>
          ) : null}

          {resultsCurrent && showClubs && visibleClubs.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader variant="label" title={t('entities.clubs')} />

                <ListGroup>
                  {visibleClubs.map((club, index) => (
                      <ClubRow
                          key={`club-${club.id}-${club.clubNumber ?? ''}-${index}`}
                          club={club}
                          favorite={favoriteSet.has(favoriteKey('club', club.id))}
                          onPress={() => openClubDetails(club)}
                          onToggleFavorite={() => {
                            toggleClubFavorite(club).catch(() => undefined);
                          }}
                      />
                  ))}
                  {filter === 'all' && clubs.length > OVERVIEW_LIMIT ? (
                      <ShowAllRow
                          label={t('search.showAllClubs', { count: clubs.length })}
                          onPress={() => setFilter('clubs')}
                      />
                  ) : null}
                </ListGroup>
              </View>
          ) : null}
        </ScrollView>
      </Screen>
  );
}
