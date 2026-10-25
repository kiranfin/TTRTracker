import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BottomSheet } from '@/src/components/BottomSheet';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { ListGroup } from '@/src/components/ListGroup';
import { ListRow } from '@/src/components/ListRow';
import { Screen } from '@/src/components/Screen';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import { formatSeasonLong, getCurrentSeason } from '@/src/utils/dates';
import { useLeagues } from '../../src/features/leagues/hooks/useLeagues';
import { styles } from '../../src/features/leagues/styles';
import type { LeagueStanding, MyLeague } from '../../src/features/leagues/types';
import { SkeletonList } from '@/src/components/SkeletonRow';

// Aktuelle und vorige Saison, z. B. 26/27 und 25/26
function getSeasonOptions() {
  const current = getCurrentSeason();
  const [start] = current.split('/').map(Number);
  const previous = `${String(start - 1).padStart(2, '0')}/${String(start).padStart(2, '0')}`;

  return [current, previous];
}

function RankBadge({ league, standing }: { league: MyLeague; standing?: LeagueStanding }) {
  const { colors } = useTheme();

  if (league.source === 'favorite' && !standing?.rank) {
    return (
        <View style={[styles.rankBadge, { backgroundColor: colors.soft }]}>
          <Ionicons name="star" size={15} color={colors.warning} />
        </View>
    );
  }

  const first = standing?.rank === '1';

  return (
      <View style={[styles.rankBadge, { backgroundColor: first ? `${colors.positive}24` : colors.primarySoft }]}>
        <Text style={[numeric.small, styles.rankText, { color: first ? colors.positive : colors.primary }]}>
          {standing?.rank ? `${standing.rank}.` : '–'}
        </Text>
      </View>
  );
}

export default function LeaguesScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { associations, myLeagues, getStanding, loading, error, loadAssociations, openAssociation, openMyLeague } = useLeagues();
  const seasonOptions = getSeasonOptions();
  const [season, setSeason] = useState(seasonOptions[0]);
  const [seasonSheetOpen, setSeasonSheetOpen] = useState(false);

  const leagueSubtitle = (league: MyLeague, standing?: LeagueStanding) => {
    if (league.source === 'favorite') {
      return [t('leagues.favoriteLeague'), standing?.size ? t('leagues.teamCount', { count: standing.size }) : undefined]
          .filter(Boolean)
          .join(' · ');
    }

    return [league.teamName, standing?.points ? t('leagues.pointsValue', { points: standing.points }) : undefined]
        .filter(Boolean)
        .join(' · ');
  };

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Text style={[typography.titleLarge, { color: colors.text }]}>{t('leagues.pageTitle')}</Text>

            <Pressable
                accessibilityRole="button"
                onPress={() => setSeasonSheetOpen(true)}
                style={({ pressed }) => [
                  styles.seasonButton,
                  { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
            >
              <Text style={[typography.metaStrong, styles.seasonText, { color: colors.text }]}>
                {t('leagues.seasonLabel', { season: formatSeasonLong(season) })}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.text} />
            </Pressable>
          </View>

          {myLeagues.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader variant="label" title={t('leagues.myLeagues')} />

                <ListGroup>
                  {myLeagues.map((league) => {
                    const standing = getStanding(league);

                    return (
                        <ListRow
                            key={`${league.association}:${league.groupId}`}
                            leading={<RankBadge league={league} standing={standing} />}
                            title={league.title}
                            subtitle={leagueSubtitle(league, standing) || league.association}
                            onPress={() => openMyLeague(league)}
                        />
                    );
                  })}
                </ListGroup>
              </View>
          ) : null}

          <View style={styles.section}>
            <SectionHeader variant="label" title={t('leagues.associations')} meta={t('leagues.drillHint')} />

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
                            <View style={[styles.associationBadge, { backgroundColor: colors.soft }]}>
                              <Text style={[styles.associationBadgeText, { color: colors.text }]} numberOfLines={1}>
                                {association.shortName.slice(0, 6)}
                              </Text>
                            </View>
                          }
                          title={association.name}
                          onPress={() => openAssociation(association, season)}
                      />
                  ))}
                </ListGroup>
            ) : null}
          </View>
        </ScrollView>

        <BottomSheet visible={seasonSheetOpen} title={t('leagues.season')} onClose={() => setSeasonSheetOpen(false)}>
          <ListGroup>
            {seasonOptions.map((option) => (
                <ListRow
                    key={option}
                    title={t('leagues.seasonLabel', { season: formatSeasonLong(option) })}
                    chevron={false}
                    trailing={option === season ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : undefined}
                    onPress={() => {
                      setSeason(option);
                      setSeasonSheetOpen(false);
                    }}
                />
            ))}
          </ListGroup>
        </BottomSheet>
      </Screen>
  );
}
