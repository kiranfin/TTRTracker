import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ListGroup } from '@/src/components/ListGroup';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { font, numeric, typography } from '@/src/theme/typography';
import type { MatchRowWithScore } from '../types';
import { styles } from '../styles';

// Eine Partie: Heim links, Sätze in der Mitte, Gast rechts; darunter Satzergebnisse und Zwischenstand.
function MatchLine({ row }: { row: MatchRowWithScore }) {
  const { colors } = useTheme();

  const nameStyle = (won: boolean) => [typography.body, styles.playerName, { color: colors.text, ...font(won ? '700' : '500') }];

  return (
      <View style={styles.matchLine}>
        <View style={styles.playerRow}>
          <Text style={nameStyle(row.winner === 'home')} numberOfLines={2}>
            {row.homePlayer}
          </Text>
          <Text style={[numeric.row, styles.result, { color: colors.text }]}>{row.result || '-'}</Text>
          <Text style={[nameStyle(row.winner === 'guest'), styles.awayName]} numberOfLines={2}>
            {row.awayPlayer}
          </Text>
        </View>

        <View style={styles.matchMetaRow}>
          <Text style={[typography.label, styles.setsText, { color: colors.mutedText }]} numberOfLines={1}>
            {row.sets.length > 0 ? row.sets.join(' · ') : row.name}
          </Text>
          <Text style={[typography.label, { color: colors.mutedText }]}>{row.runningScore}</Text>
        </View>
      </View>
  );
}

type MatchSectionProps = {
  title: string;
  rows: MatchRowWithScore[];
  // Ab so vielen Partien wird der Rest hinter "weitere anzeigen" versteckt
  collapseAfter?: number;
};

export function MatchSection({ title, rows, collapseAfter }: MatchSectionProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const limit = collapseAfter && !expanded ? collapseAfter : rows.length;
  const hidden = rows.length - limit;

  return (
      <View style={styles.section}>
        <SectionHeader variant="label" title={title} />

        <ListGroup>
          {rows.slice(0, limit).map((row) => (
              <MatchLine key={row.id} row={row} />
          ))}
          {hidden > 0 ? (
              <Pressable
                  accessibilityRole="button"
                  onPress={() => setExpanded(true)}
                  style={({ pressed }) => [styles.moreRow, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={[typography.metaStrong, styles.moreText, { color: colors.primary }]}>
                  {t('match.showMore', { count: hidden })}
                </Text>
              </Pressable>
          ) : null}
        </ListGroup>
      </View>
  );
}
