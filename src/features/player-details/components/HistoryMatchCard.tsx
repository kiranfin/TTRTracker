import { Text, View } from 'react-native';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import type { NormalizedTtrHistoryMatch } from '@/src/types/tttracker';
import { styles } from '../styles';

// Ein Einzelspiel im aufgeklappten Verlaufseintrag: Gegner mit TTR, Satzergebnisse, Ergebnis rechts.
export function HistoryMatchCard({ match }: { match: NormalizedTtrHistoryMatch }) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const hasResult = match.ownSets !== undefined && match.otherSets !== undefined;
  const won = hasResult && (match.ownSets ?? 0) > (match.otherSets ?? 0);
  const resultColor = !hasResult ? colors.mutedText : won ? colors.positive : colors.negative;

  return (
      <View style={[styles.matchDetailCard, { backgroundColor: colors.soft }]}>
        <View style={styles.matchDetailMain}>
          <Text style={[typography.bodyStrong, styles.matchDetailName, { color: colors.text }]} numberOfLines={1}>
            {t('player.againstOpponent', { opponent: match.otherPlayerName ?? t('player.unknownOpponent') })}
            {match.otherTtr !== undefined ? (
                <Text style={[typography.body, { color: colors.mutedText }]}>{`  ${match.otherTtr}`}</Text>
            ) : null}
          </Text>

          {match.setResults.length > 0 ? (
              <Text style={[typography.label, { color: colors.mutedText }]} numberOfLines={1}>
                {match.setResults.join(' · ')}
              </Text>
          ) : null}
        </View>

        <Text style={[numeric.row, { color: resultColor }]}>
          {hasResult ? `${match.ownSets}:${match.otherSets}` : '–'}
        </Text>
      </View>
  );
}
