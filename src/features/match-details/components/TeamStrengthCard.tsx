import { Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import type { MatchPreview } from '../hooks/useMatchPreview';

// Vorschau vor dem Spiel: durchschnittlicher Q-TTR beider Mannschaften und die daraus erwartete Chance.
export function TeamStrengthCard({ preview, homeTeam, awayTeam }: { preview: MatchPreview; homeTeam: string; awayTeam: string }) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const homePercent = Math.round(preview.homeWinChance * 100);

  return (
      <Card style={{ padding: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <Text style={[typography.bodyStrong, { color: colors.text }]}>{t('match.previewTitle')}</Text>
          <Text style={[typography.label, { color: colors.mutedText }]}>
            {t('match.previewPlayers', { count: Math.min(preview.home.playerCount, preview.guest.playerCount) })}
          </Text>
        </View>

        <View style={{ height: 12, flexDirection: 'row', gap: 3 }}>
          <View style={{ flex: preview.homeWinChance, borderRadius: 6, backgroundColor: colors.primary }} />
          <View style={{ flex: 1 - preview.homeWinChance, borderRadius: 6, backgroundColor: colors.orange }} />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[numeric.row, { color: colors.primary }]}>{homePercent} %</Text>
            <Text style={[typography.label, { color: colors.mutedText }]} numberOfLines={1}>
              {homeTeam} · Ø {Math.round(preview.home.average)}
            </Text>
          </View>

          <View style={{ flex: 1, gap: 2, alignItems: 'flex-end' }}>
            <Text style={[numeric.row, { color: colors.orange }]}>{100 - homePercent} %</Text>
            <Text style={[typography.label, { color: colors.mutedText }]} numberOfLines={1}>
              {awayTeam} · Ø {Math.round(preview.guest.average)}
            </Text>
          </View>
        </View>

        <Text style={[typography.caption, { color: colors.mutedText }]}>{t('match.previewHint')}</Text>
      </Card>
  );
}
