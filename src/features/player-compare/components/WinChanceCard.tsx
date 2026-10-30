import { Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import type { PlayerComparisonData } from '../types';
import { formatChange, ratingChangeRange } from '@/src/utils/ttr';
import { getWinChance } from '../utils';
import { styles } from '../styles';

// Erwartete Siegchance aus der TTR-Differenz als zweifarbiger Balken.
export function WinChanceCard({ comparison }: { comparison: PlayerComparisonData }) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const leftTtr = comparison.left.ratings?.currentTtr;
  const rightTtr = comparison.right.ratings?.currentTtr;
  const chance = getWinChance(leftTtr, rightTtr);
  const difference = typeof leftTtr === 'number' && typeof rightTtr === 'number' ? Math.abs(leftTtr - rightTtr) : undefined;

  return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>{t('compare.winChance')}</Text>
          {difference !== undefined ? (
              <Text style={[typography.label, { color: colors.mutedText }]}>
                {t('compare.differenceShort', { value: difference })}
              </Text>
          ) : null}
        </View>

        {chance ? (
            <>
              <View style={styles.chanceTrack}>
                <View style={[styles.chanceSegment, { flex: chance.left, backgroundColor: colors.primary }]} />
                <View style={[styles.chanceSegment, { flex: chance.right, backgroundColor: colors.orange }]} />
              </View>

              <View style={styles.chanceLabels}>
                <Text style={[numeric.row, { color: colors.primary }]}>{Math.round(chance.left * 100)} %</Text>
                <Text style={[numeric.row, { color: colors.orange }]}>{Math.round(chance.right * 100)} %</Text>
              </View>

              {typeof leftTtr === 'number' && typeof rightTtr === 'number' ? (
                  <View style={styles.chanceLabels}>
                    <ChangeText own={leftTtr} opponent={rightTtr} />
                    <ChangeText own={rightTtr} opponent={leftTtr} />
                  </View>
              ) : null}

              {comparison.comparison?.sameClub ? (
                  <Text style={[typography.label, { color: colors.mutedText }]}>{t('compare.sameClub')}</Text>
              ) : null}
            </>
        ) : (
            <Text style={[typography.body, { color: colors.mutedText }]}>{t('compare.noQuote')}</Text>
        )}
      </Card>
  );
}

// Punkteänderung für einen Spieler bei Sieg und bei Niederlage.
function ChangeText({ own, opponent }: { own: number; opponent: number }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const range = ratingChangeRange(own, opponent);

  return (
      <Text style={[typography.label, { color: colors.mutedText }]}>
        {t('compare.changeIfWin', { value: formatChange(range.win) })} · {t('compare.changeIfLoss', { value: formatChange(range.loss) })}
      </Text>
  );
}
