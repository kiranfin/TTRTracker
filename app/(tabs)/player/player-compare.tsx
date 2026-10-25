import { ScrollView, Text } from 'react-native';
import { EmptyState } from '@/src/components/EmptyState';
import { PlayerPickerSheet } from '@/src/components/PlayerPickerSheet';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import {
  HeadToHeadSection,
  MetricsTable,
  PlayersCard,
  RecentEventsSection,
  WinChanceCard,
} from '../../../src/features/player-compare/components';
import { usePlayerCompare } from '../../../src/features/player-compare/hooks/usePlayerCompare';
import { styles } from '../../../src/features/player-compare/styles';
import { SkeletonList } from '@/src/components/SkeletonRow';

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

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ScreenHeader title={t('compare.title')} />

          <PlayersCard
              left={comparison?.left}
              right={comparison?.right}
              onChangeLeft={() => setPickerSide('left')}
              onChangeRight={() => setPickerSide('right')}
              onOpenLeft={comparison ? () => openPlayer(comparison.left) : undefined}
              onOpenRight={comparison ? () => openPlayer(comparison.right) : undefined}
              onSwap={leftNuid || rightNuid ? swapSides : undefined}
          />

          {loading ? <SkeletonList count={3} /> : null}
          {error ? <Text style={[typography.body, { color: colors.destructive }]}>{error}</Text> : null}

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
