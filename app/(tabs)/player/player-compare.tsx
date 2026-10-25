import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { EmptyState } from '@/src/components/EmptyState';
import { PlayerPickerSheet } from '@/src/components/PlayerPickerSheet';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import {
  HeadToHeadSection,
  MetricsTable,
  PlayerSideCard,
  RecentEventsSection,
  WinChanceCard,
} from '../../../src/features/player-compare/components';
import { usePlayerCompare } from '../../../src/features/player-compare/hooks/usePlayerCompare';
import { styles } from '../../../src/features/player-compare/styles';
import { getWinChance } from '../../../src/features/player-compare/utils';

export default function PlayerCompareScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();

  const {
    leftNuid,
    rightNuid,
    comparison,
    leftStats,
    rightStats,
    loading,
    error,
    pickerSide,
    setPickerSide,
    selectPlayer,
    swapSides,
    openPlayer,
  } = usePlayerCompare();

  const chance = comparison
      ? getWinChance(comparison.left.ratings?.currentTtr, comparison.right.ratings?.currentTtr)
      : undefined;

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ScreenHeader title={t('compare.title')} />

          <View style={styles.playersRow}>
            <PlayerSideCard
                player={comparison?.left}
                favorite={Boolean(chance && chance.left > 0.5)}
                onPress={() => setPickerSide('left')}
                onOpenProfile={comparison ? () => openPlayer(comparison.left) : undefined}
            />

            <View style={{ justifyContent: 'center' }}>
              <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('compare.swapSides')}
                  disabled={!leftNuid && !rightNuid}
                  onPress={swapSides}
                  style={[styles.swapButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Ionicons name="swap-horizontal" size={20} color={colors.mutedText} />
              </Pressable>
            </View>

            <PlayerSideCard
                player={comparison?.right}
                favorite={Boolean(chance && chance.right > 0.5)}
                onPress={() => setPickerSide('right')}
                onOpenProfile={comparison ? () => openPlayer(comparison.right) : undefined}
            />
          </View>

          {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
          {error ? <Text style={{ color: colors.destructive }}>{error}</Text> : null}

          {!loading && !error && comparison ? (
              <>
                <WinChanceCard comparison={comparison} />
                <HeadToHeadSection comparison={comparison} />
                <MetricsTable comparison={comparison} leftStats={leftStats} rightStats={rightStats} />
                <RecentEventsSection comparison={comparison} />
              </>
          ) : null}

          {!loading && !error && !comparison && (!leftNuid || !rightNuid) ? (
              <EmptyState icon="swap-horizontal-outline" title={t('compare.missingNuids')} />
          ) : null}
        </ScrollView>

        <PlayerPickerSheet
            visible={pickerSide !== null}
            title={t('compare.changePlayer')}
            onClose={() => setPickerSide(null)}
            onSelect={(selection) => {
              if (pickerSide) selectPlayer(pickerSide, selection.nuid);
            }}
        />
      </Screen>
  );
}
