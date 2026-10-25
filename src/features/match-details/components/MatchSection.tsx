import { Text, View } from 'react-native';
import { ListGroup } from '@/src/components/ListGroup';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import type { MatchRowWithScore } from '../types';
import { styles } from '../styles';

function splitResult(result: string) {
  const parts = result.split(':');

  return parts.length === 2 ? { home: parts[0], away: parts[1] } : null;
}

function MatchLine({ row }: { row: MatchRowWithScore }) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const result = splitResult(row.result);

  const nameStyle = (won: boolean) => [
    typography.body,
    styles.playerName,
    { color: colors.text, fontWeight: won ? ('800' as const) : ('500' as const) },
  ];

  const setsStyle = (won: boolean) => [
    numeric.medium,
    { color: colors.text, fontWeight: won ? ('900' as const) : ('500' as const) },
  ];

  return (
      <View style={styles.matchLine}>
        <View style={styles.matchMetaRow}>
          <Text style={[typography.label, { color: colors.mutedText }]}>{row.name}</Text>
          <Text style={[typography.label, { color: colors.mutedText }]}>
            {t('match.standing', { score: row.runningScore })}
          </Text>
        </View>

        <View style={styles.playerRow}>
          <Text style={nameStyle(row.winner === 'home')} numberOfLines={2}>
            {row.homePlayer}
          </Text>
          <Text style={setsStyle(row.winner === 'home')}>{result?.home ?? '-'}</Text>
        </View>

        <View style={styles.playerRow}>
          <Text style={nameStyle(row.winner === 'guest')} numberOfLines={2}>
            {row.awayPlayer}
          </Text>
          <Text style={setsStyle(row.winner === 'guest')}>{result?.away ?? '-'}</Text>
        </View>

        {row.sets.length > 0 ? (
            <View style={styles.setPills}>
              {row.sets.map((set, index) => (
                  <View key={`${row.id}-set-${index}`} style={[styles.setPill, { backgroundColor: colors.soft }]}>
                    <Text style={[numeric.small, { color: colors.mutedText }]}>{set}</Text>
                  </View>
              ))}
            </View>
        ) : null}
      </View>
  );
}

export function MatchSection({ title, rows }: { title: string; rows: MatchRowWithScore[] }) {
  return (
      <View style={styles.section}>
        <SectionHeader title={title} />

        <ListGroup>
          {rows.map((row) => (
              <MatchLine key={row.id} row={row} />
          ))}
        </ListGroup>
      </View>
  );
}
