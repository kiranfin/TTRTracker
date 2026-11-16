import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import type { PlayerComparisonData } from '../types';
import { formatPercent, getPlayerName, isFiniteNumber } from '../utils';
import { styles } from '../styles';

// Direkte Duelle: Bilanz in den Seitenfarben, darunter die Siegquote je Spieler.
export function HeadToHeadSection({ comparison }: { comparison: PlayerComparisonData }) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const headToHead = comparison.headToHead;
  const itemCount = headToHead?.stats?.itemCount ?? 0;
  const parsedItemCount = headToHead?.stats?.parsedItemCount ?? 0;
  const leftWins = headToHead?.stats?.leftWins ?? 0;
  const rightWins = headToHead?.stats?.rightWins ?? 0;
  const draws = headToHead?.stats?.draws ?? 0;
  const hasDuels = Boolean(headToHead?.available) && parsedItemCount > 0;

  const rate = (value?: number | null) => (isFiniteNumber(value) ? formatPercent(value * 100) : '–');

  return (
      <View style={styles.section}>
        <View style={styles.h2hHeader}>
          <Text style={[typography.section, styles.h2hTitle, { color: colors.text }]}>{t('compare.headToHead')}</Text>
          {hasDuels ? (
              <Text style={[numeric.row, { color: colors.text }]}>
                <Text style={{ color: colors.primary }}>{leftWins}</Text>
                {' : '}
                <Text style={{ color: colors.orange }}>{rightWins}</Text>
              </Text>
          ) : null}
        </View>

        <Card style={styles.card}>
          {!headToHead?.available || (parsedItemCount <= 0 && itemCount <= 0) ? (
              <Text style={[typography.body, { color: colors.mutedText }]}>{t('compare.noDirectDuels')}</Text>
          ) : parsedItemCount <= 0 ? (
              <View style={styles.message}>
                <Ionicons name="alert-circle-outline" size={22} color={colors.mutedText} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyStrong, { color: colors.text }]}>
                    {t('compare.directMeetingsFound', { count: itemCount })}
                  </Text>
                  <Text style={[typography.meta, { color: colors.mutedText }]}>{t('compare.directMeetingsParseMissing')}</Text>
                </View>
              </View>
          ) : (
              <>
                <View style={styles.h2hRow}>
                  <View style={styles.h2hSide}>
                    <Text style={[typography.label, { color: colors.mutedText }]} numberOfLines={1}>
                      {getPlayerName(comparison.left, t)}
                    </Text>
                    <Text style={[numeric.stat, { color: colors.primary }]}>{rate(headToHead?.stats?.leftWinRate)}</Text>
                  </View>

                  <Text style={[typography.label, { color: colors.mutedText }]}>
                    {draws > 0 ? `${t('compare.drawsCount', { count: draws })} · ` : ''}
                    {t('compare.matchesCount', { count: parsedItemCount })}
                  </Text>

                  <View style={[styles.h2hSide, styles.h2hSideRight]}>
                    <Text style={[typography.label, { color: colors.mutedText }]} numberOfLines={1}>
                      {getPlayerName(comparison.right, t)}
                    </Text>
                    <Text style={[numeric.stat, { color: colors.orange }]}>{rate(headToHead?.stats?.rightWinRate)}</Text>
                  </View>
                </View>

                {headToHead?.perspective?.note ? (
                    <Text style={[typography.label, { color: colors.mutedText }]}>{headToHead.perspective.note}</Text>
                ) : null}
              </>
          )}
        </Card>
      </View>
  );
}

