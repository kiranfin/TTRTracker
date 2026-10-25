import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import type { PlayerComparisonData } from '../types';
import { formatPercent, getPlayerName, isFiniteNumber } from '../utils';
import { styles } from '../styles';

export function HeadToHeadSection({ comparison }: { comparison: PlayerComparisonData }) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const headToHead = comparison.headToHead;
  const itemCount = headToHead?.stats?.itemCount ?? 0;
  const parsedItemCount = headToHead?.stats?.parsedItemCount ?? 0;
  const leftWins = headToHead?.stats?.leftWins ?? 0;
  const rightWins = headToHead?.stats?.rightWins ?? 0;
  const draws = headToHead?.stats?.draws ?? 0;

  const rate = (value?: number | null) => (isFiniteNumber(value) ? formatPercent(value * 100) : '—');

  return (
      <View style={{ gap: 10 }}>
        <SectionHeader title={t('compare.headToHead')} />

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
                  <Text style={[typography.meta, { color: colors.mutedText }]}>
                    {t('compare.directMeetingsParseMissing')}
                  </Text>
                </View>
              </View>
          ) : (
              <>
                <View style={styles.h2hRow}>
                  <View style={styles.h2hSide}>
                    <Text style={[typography.meta, { color: colors.mutedText }]} numberOfLines={1}>
                      {getPlayerName(comparison.left, t)}
                    </Text>
                    <Text style={[numeric.hero, { color: leftWins > rightWins ? colors.primary : colors.text }]}>
                      {leftWins}
                    </Text>
                    <Text style={[typography.label, { color: colors.mutedText }]}>{rate(headToHead.stats?.leftWinRate)}</Text>
                  </View>

                  <View style={styles.h2hCenter}>
                    <Text style={[typography.label, { color: colors.mutedText }]}>{t('compare.record')}</Text>
                    <Text style={[typography.label, { color: colors.mutedText }]}>
                      {draws > 0 ? `${t('compare.drawsCount', { count: draws })} · ` : ''}
                      {t('compare.matchesCount', { count: parsedItemCount })}
                    </Text>
                  </View>

                  <View style={styles.h2hSide}>
                    <Text style={[typography.meta, { color: colors.mutedText }]} numberOfLines={1}>
                      {getPlayerName(comparison.right, t)}
                    </Text>
                    <Text style={[numeric.hero, { color: rightWins > leftWins ? colors.primary : colors.text }]}>
                      {rightWins}
                    </Text>
                    <Text style={[typography.label, { color: colors.mutedText }]}>{rate(headToHead.stats?.rightWinRate)}</Text>
                  </View>
                </View>

                {headToHead.perspective?.note ? (
                    <Text style={[typography.label, { color: colors.mutedText }]}>{headToHead.perspective.note}</Text>
                ) : null}
              </>
          )}
        </Card>
      </View>
  );
}
