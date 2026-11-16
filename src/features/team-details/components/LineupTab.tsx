import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { EmptyState } from '@/src/components/EmptyState';
import { ListGroup } from '@/src/components/ListGroup';
import { ListRow } from '@/src/components/ListRow';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import type { TeamPlayer } from '../types';
import { styles } from '../styles';

// Aufstellung: Position links, Name mit Status, TTR rechts.
export function LineupTab({ players }: { players: TeamPlayer[] }) {
  const { colors } = useTheme();
  const { t } = useI18n();

  if (players.length === 0) {
    return <EmptyState icon="people-outline" title={t('team.lineupEmpty')} />;
  }

  return (
      <View style={styles.section}>
        <SectionHeader variant="label" title={t('team.lineup')} meta={t('team.lineupSubtitle')} />

        <ListGroup>
          {players.map((player, index) => (
              <ListRow
                  key={`${player.id ?? player.name}-${index}`}
                  leading={
                    <View style={[styles.positionBadge, { backgroundColor: colors.soft }]}>
                      <Text style={[numeric.small, { color: colors.text }]}>{player.rank ?? String(index + 1)}</Text>
                    </View>
                  }
                  title={player.name}
                  subtitle={[player.status, player.foreignerType].filter(Boolean).join(' · ') || undefined}
                  chevron={false}
                  trailing={
                    player.qttr ? (
                        <View style={styles.valueBlock}>
                          <Text style={[numeric.medium, { color: colors.text }]}>{player.qttr}</Text>
                          <Text style={[typography.caption, { color: colors.mutedText }]}>TTR</Text>
                        </View>
                    ) : undefined
                  }
                  onPress={
                    player.id
                        ? () =>
                            router.push({
                              pathname: '/player/[nuid]',
                              params: { nuid: player.id!, name: player.name },
                            })
                        : undefined
                  }
              />
          ))}
        </ListGroup>
      </View>
  );
}
