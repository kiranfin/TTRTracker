import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Avatar } from '@/src/components/Avatar';
import { Breadcrumb } from '@/src/components/Breadcrumb';
import { Button, IconButton } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { ListGroup } from '@/src/components/ListGroup';
import { ListRow } from '@/src/components/ListRow';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SectionHeader } from '@/src/components/SectionHeader';
import { StarButton } from '@/src/components/StarButton';
import { useI18n } from '@/src/i18n/I18nProvider';
import { favoriteKey } from '@/src/storage/favorites';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { formatSeasonLabel, useRegionLeagues } from '../../../src/features/leagues/hooks/useRegionLeagues';
import { styles } from '../../../src/features/leagues/styles';

export default function RegionLeaguesScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();

  const {
    associationTitle,
    shortName,
    favoriteSet,
    sortedRegions,
    groupedClasses,
    classes,
    selectedRegion,
    loading,
    error,
    loadClasses,
    backToRegions,
    refresh,
    toggleFavorite,
    openLeague,
  } = useRegionLeagues();

  const pageTitle = selectedRegion ? selectedRegion.name : associationTitle;

  const breadcrumb = [
    { label: t('leagues.pageTitle'), onPress: () => router.push('/leagues') },
    selectedRegion
        ? { label: shortName, onPress: backToRegions }
        : { label: shortName },
    ...(selectedRegion ? [{ label: selectedRegion.name }] : []),
  ];

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerBlock}>
            <ScreenHeader
                onBack={selectedRegion ? backToRegions : () => router.push('/leagues')}
                right={<IconButton icon="refresh-outline" onPress={refresh} accessibilityLabel={t('mytt.reload')} />}
            />

            <Breadcrumb items={breadcrumb} />

            <Text style={[typography.title, { color: colors.text }]} numberOfLines={2}>
              {pageTitle}
            </Text>
          </View>

          {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

          {error ? (
              <Card style={styles.errorCard}>
                <Text style={[typography.body, { color: colors.destructive }]}>{error}</Text>

                <Button variant="secondary" icon="refresh-outline" onPress={refresh}>
                  {t('common.retry')}
                </Button>
              </Card>
          ) : null}

          {!loading && !error && !selectedRegion ? (
              sortedRegions.length === 0 ? (
                  <EmptyState
                      icon="map-outline"
                      title={t('region.noRegions')}
                      subtitle={t('region.noRegionsSubtitle')}
                  />
              ) : (
                  <ListGroup>
                    {sortedRegions.map((region) => (
                        <ListRow
                            key={region.id}
                            leading={<Avatar icon={region.type === 'association' ? 'trophy' : 'map'} shape="square" size={40} />}
                            title={region.name}
                            subtitle={region.type === 'association' ? t('region.associationClasses') : t('region.district')}
                            onPress={() => {
                              loadClasses(region).catch(() => undefined);
                            }}
                        />
                    ))}
                  </ListGroup>
              )
          ) : null}

          {!loading && !error && selectedRegion ? (
              classes.length === 0 ? (
                  <EmptyState
                      icon="podium-outline"
                      title={t('region.noClasses')}
                      subtitle={t('region.noClassesSubtitle')}
                  />
              ) : (
                  <>
                    {groupedClasses.map(([groupTitle, groupClasses]) => (
                        <View key={groupTitle} style={styles.section}>
                          <SectionHeader title={groupTitle} />

                          <ListGroup>
                            {groupClasses.map((league) => {
                              const canOpen = Boolean(league.association && league.groupId);

                              return (
                                  <ListRow
                                      key={league.id}
                                      leading={<Ionicons name="podium-outline" size={24} color={colors.primary} />}
                                      title={league.name}
                                      subtitle={
                                        canOpen
                                            ? [league.association, t('favorites.seasonValue', { season: formatSeasonLabel(league.season) })].join(' · ')
                                            : t('region.cannotOpenClass')
                                      }
                                      chevron={false}
                                      onPress={canOpen ? () => openLeague(league) : undefined}
                                      trailing={
                                        <StarButton
                                            active={favoriteSet.has(favoriteKey('league', league.id))}
                                            onPress={() => {
                                              toggleFavorite(league).catch(() => undefined);
                                            }}
                                        />
                                      }
                                  />
                              );
                            })}
                          </ListGroup>
                        </View>
                    ))}
                  </>
              )
          ) : null}
        </ScrollView>
      </Screen>
  );
}
