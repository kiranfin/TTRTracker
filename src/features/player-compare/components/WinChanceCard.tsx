import { Text, View } from 'react-native';
import { Badge } from '@/src/components/Badge';
import { Card } from '@/src/components/Card';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import type { PlayerComparisonData } from '../types';
import { formatSignedNumber, getPlayerName, getWinChance } from '../utils';
import { styles } from '../styles';

export function WinChanceCard({ comparison }: { comparison: PlayerComparisonData }) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const leftTtr = comparison.left.ratings?.currentTtr;
  const rightTtr = comparison.right.ratings?.currentTtr;
  const chance = getWinChance(leftTtr, rightTtr);

  return (
      <Card style={styles.card}>
        <View>
          <Text style={[typography.section, { color: colors.text }]}>{t('compare.winChance')}</Text>
          <Text style={[typography.meta, { color: colors.mutedText }]}>{t('compare.winChanceHint')}</Text>
        </View>

        {chance ? (
            <>
              <View style={styles.chanceRow}>
                <View style={styles.chanceSide}>
                  <Text style={[typography.meta, { color: colors.mutedText }]} numberOfLines={1}>
                    {getPlayerName(comparison.left, t)}
                  </Text>
                  <Text style={[numeric.large, { color: chance.left >= 0.5 ? colors.primary : colors.text }]}>
                    {Math.round(chance.left * 100)}%
                  </Text>
                </View>

                <View style={[styles.chanceSide, styles.chanceSideRight]}>
                  <Text style={[typography.meta, { color: colors.mutedText }]} numberOfLines={1}>
                    {getPlayerName(comparison.right, t)}
                  </Text>
                  <Text style={[numeric.large, { color: chance.right > 0.5 ? colors.primary : colors.text }]}>
                    {Math.round(chance.right * 100)}%
                  </Text>
                </View>
              </View>

              <View style={[styles.chanceTrack, { backgroundColor: colors.soft }]}>
                <View style={{ flex: chance.left, backgroundColor: colors.primary }} />
                <View style={{ flex: chance.right, backgroundColor: colors.primarySoftBorder }} />
              </View>

              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Badge tone="outline">
                  {t('compare.ttrDifferenceValue', { value: formatSignedNumber((leftTtr ?? 0) - (rightTtr ?? 0)) })}
                </Badge>

                {comparison.comparison?.sameClub ? (
                    <Badge tone="secondary" icon="business-outline">
                      {t('compare.sameClub')}
                    </Badge>
                ) : null}
              </View>
            </>
        ) : (
            <Text style={[typography.body, { color: colors.mutedText }]}>{t('compare.noQuote')}</Text>
        )}
      </Card>
  );
}
