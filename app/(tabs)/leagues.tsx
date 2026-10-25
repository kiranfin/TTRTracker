import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { ListGroup } from '@/src/components/ListGroup';
import { ListRow } from '@/src/components/ListRow';
import { Screen } from '@/src/components/Screen';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { useLeagues } from '../../src/features/leagues/hooks/useLeagues';
import { styles } from '../../src/features/leagues/styles';
import { SkeletonList } from '@/src/components/SkeletonRow';

export default function LeaguesScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { associations, myLeagues, loading, error, loadAssociations, openAssociation, openMyLeague } = useLeagues();

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[typography.titleLarge, { color: colors.text }]}>{t('leagues.pageTitle')}</Text>

          {myLeagues.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title={t('leagues.myLeagues')} />

                <ListGroup>
                  {myLeagues.map((league) => (
                      <ListRow
                          key={`${league.association}:${league.groupId}`}
                          leading={
                            <Ionicons
                                name={league.source === 'favorite' ? 'star' : 'people'}
                                size={22}
                                color={league.source === 'favorite' ? colors.warning : colors.primary}
                            />
                          }
                          title={league.title}
                          subtitle={[
                            league.association,
                            league.teamName ?? (league.source === 'favorite' ? t('leagues.favoriteLeague') : undefined),
                          ]
                              .filter(Boolean)
                              .join(' · ')}
                          onPress={() => openMyLeague(league)}
                      />
                  ))}
                </ListGroup>
              </View>
          ) : null}

          <View style={styles.section}>
            <SectionHeader title={t('leagues.associations')} />

            {loading ? <SkeletonList count={3} /> : null}

            {error ? (
                <Card style={styles.errorCard}>
                  <Text style={[typography.body, { color: colors.destructive }]}>{error}</Text>
                  <Button variant="secondary" icon="refresh-outline" onPress={loadAssociations}>
                    {t('common.retry')}
                  </Button>
                </Card>
            ) : null}

            {!loading && !error && associations.length === 0 ? (
                <EmptyState icon="map-outline" title={t('leagues.emptyTitle')} subtitle={t('leagues.emptySubtitle')} />
            ) : null}

            {!loading && !error && associations.length > 0 ? (
                <ListGroup>
                  {associations.map((association) => (
                      <ListRow
                          key={association.id}
                          leading={
                            <View style={[styles.associationBadge, { backgroundColor: colors.primarySoft }]}>
                              <Text style={[styles.associationBadgeText, { color: colors.primary }]} numberOfLines={1}>
                                {association.shortName.slice(0, 4)}
                              </Text>
                            </View>
                          }
                          title={association.name}
                          subtitle={association.shortName}
                          onPress={() => openAssociation(association)}
                      />
                  ))}
                </ListGroup>
            ) : null}
          </View>
        </ScrollView>
      </Screen>
  );
}
