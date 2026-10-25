import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing } from '../theme/spacing';
import { useTheme } from '../theme/ThemeProvider';
import { numeric, typography } from '../theme/typography';

export type StatItem = {
  label: string;
  value: string;
  // Eigene Farbe für den Wert, z. B. colors.positive
  color?: string;
  helper?: string;
};

// Label oben, Wert darunter, optional eine kleine Zusatzzeile.
function StatCell({ item }: { item: StatItem }) {
  const { colors } = useTheme();

  return (
      <View style={styles.cell}>
        <Text style={[typography.label, { color: colors.mutedText }]} numberOfLines={1}>
          {item.label}
        </Text>
        <Text style={[numeric.stat, { color: item.color ?? colors.text }]} numberOfLines={1}>
          {item.value}
        </Text>
        {item.helper ? (
            <Text style={[typography.caption, styles.helper, { color: colors.mutedText }]} numberOfLines={1}>
              {item.helper}
            </Text>
        ) : null}
      </View>
  );
}

// Zwei bis vier Werte nebeneinander in einer Karte, getrennt durch dünne Linien.
export function StatStrip({ items }: { items: StatItem[] }) {
  const { colors } = useTheme();

  return (
      <View style={[styles.strip, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {items.map((item, index) => (
            <View key={`${item.label}-${index}`} style={styles.stripItem}>
              {index > 0 ? <View style={[styles.separator, { backgroundColor: colors.border }]} /> : null}
              <StatCell item={item} />
            </View>
        ))}
      </View>
  );
}

// 2x2 Raster kompakter Kennzahlen, Label oben.
export function StatGrid({ items, footer }: { items: StatItem[]; footer?: ReactNode }) {
  const { colors } = useTheme();

  return (
      <View>
        <View style={styles.grid}>
          {items.map((item, index) => (
              <View
                  key={`${item.label}-${index}`}
                  style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[typography.label, { color: colors.mutedText }]} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={[numeric.stat, { color: item.color ?? colors.text }]} numberOfLines={1}>
                  {item.value}
                </Text>
                {item.helper ? (
                    <Text style={[typography.caption, styles.helper, { color: colors.mutedText }]} numberOfLines={1}>
                      {item.helper}
                    </Text>
                ) : null}
              </View>
          ))}
        </View>
        {footer}
      </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: spacing.xs,
  },
  stripItem: {
    flex: 1,
    flexDirection: 'row',
  },
  separator: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.xs,
  },
  helper: {
    fontSize: 11,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  gridItem: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 2,
  },
});
