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

function StatCell({ item, align }: { item: StatItem; align: 'center' | 'flex-start' }) {
  const { colors } = useTheme();

  return (
      <View style={[styles.cell, { alignItems: align }]}>
        <Text style={[numeric.medium, { color: item.color ?? colors.text }]} numberOfLines={1}>
          {item.value}
        </Text>

        <Text style={[typography.label, { color: colors.mutedText }]} numberOfLines={1}>
          {item.label}
        </Text>

        {item.helper ? (
            <Text style={[typography.label, { color: colors.mutedText }]} numberOfLines={1}>
              {item.helper}
            </Text>
        ) : null}
      </View>
  );
}

// Drei (oder zwei) Werte nebeneinander, getrennt durch dünne Linien.
export function StatStrip({ items }: { items: StatItem[] }) {
  const { colors } = useTheme();

  return (
      <View style={[styles.strip, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {items.map((item, index) => (
            <View key={`${item.label}-${index}`} style={styles.stripItem}>
              {index > 0 ? <View style={[styles.separator, { backgroundColor: colors.border }]} /> : null}
              <StatCell item={item} align="center" />
            </View>
        ))}
      </View>
  );
}

// 2x2 Raster für Kennzahlen mit Label oben.
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

                <Text style={[numeric.large, { color: item.color ?? colors.text }]} numberOfLines={1}>
                  {item.value}
                </Text>

                {item.helper ? (
                    <Text style={[typography.label, { color: colors.mutedText }]} numberOfLines={1}>
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
    paddingVertical: spacing.lg,
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
    gap: 2,
    paddingHorizontal: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.lg,
    gap: 4,
  },
});
