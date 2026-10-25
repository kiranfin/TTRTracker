import { Ionicons } from '@expo/vector-icons';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import { useTheme, type AppColors } from '../theme/ThemeProvider';
import { tabularNums } from '../theme/typography';

type DeltaValue = number | null | undefined;

type DeltaTextProps = {
  value: DeltaValue;
  // Anzeige bei fehlendem Wert
  fallback?: string;
  decimals?: number;
  arrow?: boolean;
  size?: number;
  style?: StyleProp<TextStyle>;
};

function isValid(value: DeltaValue): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function formatDelta(value: DeltaValue, decimals = 0) {
  if (!isValid(value)) return '—';

  const rounded = decimals > 0 ? Number(value.toFixed(decimals)) : Math.round(value);
  const text = decimals > 0 ? rounded.toFixed(decimals).replace('.', ',') : String(rounded);

  return rounded > 0 ? `+${text}` : text;
}

export function getDeltaColor(value: DeltaValue, colors: AppColors) {
  if (!isValid(value) || value === 0) return colors.mutedText;
  return value > 0 ? colors.positive : colors.negative;
}

export function DeltaText({ value, fallback, decimals = 0, arrow, size = 13, style }: DeltaTextProps) {
  const { colors } = useTheme();
  const color = getDeltaColor(value, colors);
  const valid = isValid(value);

  return (
      <View style={styles.inline}>
        {arrow && valid && value !== 0 ? (
            <Ionicons name={value > 0 ? 'arrow-up' : 'arrow-down'} size={size} color={color} />
        ) : null}

        <Text style={[styles.text, tabularNums, { color, fontSize: size, lineHeight: size + 5 }, style]}>
          {valid ? formatDelta(value, decimals) : fallback ?? '—'}
        </Text>
      </View>
  );
}

type DeltaPillProps = {
  value: DeltaValue;
  decimals?: number;
  suffix?: string;
  // Auf farbigem Grund (z. B. Hero-Karte) statt der Vorzeichenfarbe weiß auf transparentem Weiß
  onPrimary?: boolean;
};

export function DeltaPill({ value, decimals = 0, suffix, onPrimary }: DeltaPillProps) {
  const { colors } = useTheme();
  const valid = isValid(value);

  const color = onPrimary ? colors.primaryForeground : getDeltaColor(value, colors);
  const backgroundColor = onPrimary
      ? 'rgba(255,255,255,0.18)'
      : !valid || value === 0
          ? colors.soft
          : value > 0
              ? `${colors.positive}1F`
              : `${colors.negative}1F`;

  return (
      <View style={[styles.pill, { backgroundColor }]}>
        {valid && value !== 0 ? (
            <Ionicons name={value > 0 ? 'arrow-up' : 'arrow-down'} size={12} color={color} />
        ) : null}

        <Text style={[styles.pillText, tabularNums, { color }]}>
          {formatDelta(value, decimals)}
          {suffix ? ` ${suffix}` : ''}
        </Text>
      </View>
  );
}

const styles = StyleSheet.create({
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  text: {
    fontWeight: '700',
  },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
});
