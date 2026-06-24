import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Badge } from '@/src/components/Badge';
import { BottomSheet } from '@/src/components/BottomSheet';
import { Button, IconButton } from '@/src/components/Button';
import { EmptyState } from '@/src/components/EmptyState';
import { Screen } from '@/src/components/Screen';
import { SearchInput } from '@/src/components/SearchInput';
import { SegmentedTabs } from '@/src/components/SegmentedTabs';
import { useI18n } from '@/src/i18n/I18nProvider';
import { favoriteKey } from '@/src/storage/favorites';
import { useTheme } from '@/src/theme/ThemeProvider';
import { PlayerCard, ClubCard, DetailRow } from '../../src/features/search/components';
import { styles } from '../../src/features/search/styles';
import { useSearch } from '../../src/features/search/hooks/useSearch';

export default function SearchScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const {
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
  } = useSearch();

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.text }]}>{t('search.title')}</Text>
          </View>

          <SegmentedTabs value={activeTab} onChange={setActiveTab} options={tabOptions} />

          <View style={styles.searchBlock}>
            <SearchInput
                value={query}
                onChangeText={handleQueryChange}
                onSubmitEditing={runSearch}
                placeholder={t('search.placeholder')}
            />
            <Button
                icon="search-outline"
                loading={loading}
                disabled={loading || query.trim().length < 2}
                onPress={runSearch}
                style={styles.searchButton}
            >
              {t('common.search')}
            </Button>
          </View>

          {queryChanged ? (
              <Text style={[styles.hint, { color: colors.mutedText }]}>{t('search.updateHint')}</Text>
          ) : null}

          {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
          {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

          {!loading && activeTab === 'players' ? (
              <View style={styles.stack}>
                {!query.trim() ? <EmptyState icon="search-outline" title={t('search.enterTerm')} /> : null}
                {query.trim() && !hasSubmitted ? <EmptyState icon="arrow-up-circle-outline" title={t('search.readyTitle')} subtitle={t('search.readySubtitle')} /> : null}
                {hasSubmitted && players.length === 0 ? <EmptyState icon="person-outline" title={t('search.noPlayers')} subtitle={t('search.noResultsFor', { query: submittedQuery })} /> : null}

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
                {!query.trim() ? <EmptyState icon="search-outline" title={t('search.enterTerm')} /> : null}
                {query.trim() && !hasSubmitted ? <EmptyState icon="arrow-up-circle-outline" title={t('search.readyTitle')} subtitle={t('search.readySubtitle')} /> : null}
                {hasSubmitted && clubs.length === 0 ? <EmptyState icon="business-outline" title={t('search.noClubs')} subtitle={t('search.noResultsFor', { query: submittedQuery })} /> : null}

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
                <DetailRow label={t('entities.club')} value={selectedPlayer.clubName} />
                <DetailRow label="TTR" value={selectedPlayer.ttr ? String(selectedPlayer.ttr) : t('common.notAvailable')} />

                {selectedPlayer.internalId ? (
                    <Button icon="stats-chart-outline" onPress={() => openPlayerDetails(selectedPlayer)}>
                      {t('search.seeMore')}
                    </Button>
                ) : (
                    <Text style={[styles.sheetMuted, { color: colors.mutedText }]}>{t('search.playerMissingNuid')}</Text>
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
                <DetailRow label={t('search.clubNumber')} value={selectedClub.clubNumber ?? t('common.notFound')} monospace />
                <DetailRow label={t('search.state')} value={selectedClub.state ?? t('common.notAvailable')} />
                <DetailRow label={t('entities.association')} value={selectedClub.organization ?? selectedClub.organizationName ?? t('common.unknown')} />

                <View style={styles.sheetStatRow}>
                  <Badge tone="secondary" icon="people-outline">{t('search.teamsCount', { count: clubTeams.length })}</Badge>
                  {selectedClub.organization ? <Badge tone="outline">{selectedClub.organization}</Badge> : null}
                </View>

                {loadingTeams ? <ActivityIndicator color={colors.primary} /> : null}

                <Button icon="business-outline" onPress={() => openClubDetails(selectedClub)}>
                  {t('search.seeMore')}
                </Button>
              </View>
          ) : null}
        </BottomSheet>
      </Screen>
  );
}
