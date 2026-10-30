import { ScrollView, Text, View } from 'react-native';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { PlayerPickerSheet } from '@/src/components/PlayerPickerSheet';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SegmentedTabs } from '@/src/components/SegmentedTabs';
import { SettingsInput } from '@/src/features/settings/components/SettingsInput';
import { useTtrCalculator } from '@/src/features/ttr-calculator/useTtrCalculator';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import { formatChange } from '@/src/utils/ttr';

export default function TtrCalculatorScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const calc = useTtrCalculator();

  const { result } = calc;

  return (
      <Screen>
        <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 112, gap: 16 }}
            keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader title={t('calculator.title')} />

          <Card style={{ padding: 16, gap: 12 }}>
            <View style={{ gap: 6 }}>
              <Text style={[typography.label, { color: colors.mutedText }]}>{t('calculator.ownTtr')}</Text>
              <SettingsInput value={calc.ownText} onChangeText={calc.setOwnText} keyboardType="numeric" placeholder="1500" />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={[typography.label, { color: colors.mutedText }]}>
                {calc.opponentName ? t('calculator.opponentNamed', { name: calc.opponentName }) : t('calculator.opponentTtr')}
              </Text>
              <SettingsInput
                  value={calc.opponentText}
                  onChangeText={calc.setOpponentText}
                  keyboardType="numeric"
                  placeholder="1500"
              />
              {calc.lookupFailed ? (
                  <Text style={[typography.caption, { color: colors.mutedText }]}>{t('calculator.lookupFailed')}</Text>
              ) : null}
            </View>

            <Button variant="outline" icon="search-outline" onPress={() => calc.setPickerOpen(true)}>
              {t('calculator.pickOpponent')}
            </Button>
          </Card>

          {result ? (
              <Card style={{ padding: 16, gap: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={[numeric.row, { color: colors.primary }]}>{Math.round(result.winChance * 100)} %</Text>
                  <Text style={[typography.label, { color: colors.mutedText, alignSelf: 'center' }]}>
                    {t('calculator.winChance')}
                  </Text>
                  <Text style={[numeric.row, { color: colors.orange }]}>{100 - Math.round(result.winChance * 100)} %</Text>
                </View>

                <SegmentedTabs
                    value={calc.outcome}
                    onChange={calc.setOutcome}
                    options={[
                      { value: 'win', label: t('calculator.outcomeWin') },
                      { value: 'loss', label: t('calculator.outcomeLoss') },
                    ]}
                />

                <View style={{ gap: 8 }}>
                  <ResultRow label={t('calculator.you')} before={calc.own!} after={result.ownAfter} delta={result.ownDelta} />
                  <ResultRow
                      label={t('calculator.opponent')}
                      before={calc.opponent!}
                      after={result.opponentAfter}
                      delta={result.opponentDelta}
                  />
                </View>

                <Text style={[typography.caption, { color: colors.mutedText }]}>{t('calculator.hint')}</Text>
              </Card>
          ) : (
              <Text style={[typography.body, { color: colors.mutedText }]}>{t('calculator.empty')}</Text>
          )}
        </ScrollView>

        <PlayerPickerSheet
            visible={calc.pickerOpen}
            title={t('calculator.pickOpponent')}
            onClose={() => calc.setPickerOpen(false)}
            onSelect={(selection) => calc.selectOpponent(selection.nuid, selection.name)}
        />
      </Screen>
  );
}

function ResultRow({ label, before, after, delta }: { label: string; before: number; after: number; delta: number }) {
  const { colors } = useTheme();
  const deltaColor = delta > 0 ? colors.positive : delta < 0 ? colors.negative : colors.mutedText;

  return (
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Text style={[typography.bodyStrong, { color: colors.text }]}>{label}</Text>
        <Text style={[numeric.row, { color: colors.text }]}>
          {before} → {after} <Text style={{ color: deltaColor }}>({formatChange(delta)})</Text>
        </Text>
      </View>
  );
}
