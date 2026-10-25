import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { Avatar } from '@/src/components/Avatar';
import { Breadcrumb } from '@/src/components/Breadcrumb';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { ListGroup } from '@/src/components/ListGroup';
import { ListRow } from '@/src/components/ListRow';
import { Screen } from '@/src/components/Screen';
import { HeaderIconButton, ScreenHeader } from '@/src/components/ScreenHeader';
import { SectionHeader } from '@/src/components/SectionHeader';
import { StarButton } from '@/src/components/StarButton';
import { useI18n } from '@/src/i18n/I18nProvider';
import { favoriteKey } from '@/src/storage/favorites';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { formatSeasonLong } from '@/src/utils/dates';
import { formatSeasonLabel, useRegionLeagues } from '../../../src/features/leagues/hooks/useRegionLeagues';
import { styles } from '../../../src/features/leagues/styles';
import { SkeletonList } from '@/src/components/SkeletonRow';

export default function RegionLeaguesScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();

  const {
    associationTitle,
    shortName,
    season,
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
                right={<HeaderIconButton icon="refresh-outline" onPress={refresh} accessibilityLabel={t('mytt.reload')} />}
            />

            <Breadcrumb items={breadcrumb} />

            <Text style={[typography.heading, { color: colors.text }]} numberOfLines={2}>
              {pageTitle}
            </Text>
            <Text style={[typography.meta, { color: colors.mutedText }]}>
              {t('leagues.seasonLabel', { season: formatSeasonLong(season) })}
            </Text>
          </View>

          {loading ? <SkeletonList count={3} /> : null}

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
                            leading={<Avatar icon={region.type === 'association' ? 'trophy-outline' : 'map-outline'} shape="square" size={40} tone="neutral" />}
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
                          <SectionHeader variant="label" title={groupTitle} />

                          <ListGroup>
                            {groupClasses.map((league) => {
                              const canOpen = Boolean(league.association && league.groupId);

                              return (
                                  <ListRow
                                      key={league.id}
                                      leading={<Avatar icon="trophy-outline" shape="square" size={40} tone="neutral" />}
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
