import { StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/src/components/Badge';
import { Card } from '@/src/components/Card';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { MatchRow } from '../types';
import { styles } from '../styles';

export function MatchSection({ title, rows }: { title: string; rows: MatchRow[] }) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
      <Card style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>

        <View style={styles.rows}>
          {rows.map((row, index) => {
            const isLast = index === rows.length - 1;
            const homeColor = row.winner === 'home' ? colors.primary : colors.text;
            const awayColor = row.winner === 'guest' ? colors.primary : colors.text;
            const playerLines = row.type === 'double' ? 3 : 2;

            return (
                <View
                    key={row.id}
                    style={[
                      styles.matchLine,
                      {
                        borderBottomColor: colors.border,
                        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                      },
                    ]}
                >
                  <View style={styles.matchMetaRow}>
                    <Text style={[styles.matchName, { color: colors.mutedText }]}>{row.name}</Text>
                    <Text style={[styles.matchType, { color: colors.mutedText }]}>
                      {row.type === 'double' ? t('match.doubles') : t('match.singles')}
                    </Text>
                  </View>

                  <View style={styles.playersRow}>
                    <Text style={[styles.playerName, { color: homeColor }]} numberOfLines={playerLines}>
                      {row.homePlayer}
                    </Text>

                    <Badge tone="secondary">{row.result}</Badge>

                    <Text style={[styles.playerName, styles.awayPlayer, { color: awayColor }]} numberOfLines={playerLines}>
                      {row.awayPlayer}
                    </Text>
                  </View>

                  {row.sets.length > 0 || row.games ? (
                      <Text style={[styles.sets, { color: colors.mutedText }]}>
                        {[row.sets.length > 0 ? row.sets.join(' · ') : null, row.games].filter(Boolean).join('   ·   ')}
                      </Text>
                  ) : null}
                </View>
            );
          })}
        </View>
      </Card>
  );
}
