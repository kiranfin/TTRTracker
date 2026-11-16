import { Ionicons } from '@expo/vector-icons';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';
import { useTheme, type AppColors } from '../theme/ThemeProvider';
import { font, tabularNums } from '../theme/typography';

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

// Echtes Minuszeichen statt Bindestrich, damit Vorzeichen gleich breit sind.
export function formatDelta(value: DeltaValue, decimals = 0) {
  if (!isValid(value)) return '–';

  const rounded = decimals > 0 ? Number(value.toFixed(decimals)) : Math.round(value);
  const text = (decimals > 0 ? Math.abs(rounded).toFixed(decimals).replace('.', ',') : String(Math.abs(rounded)));

  if (rounded > 0) return `+${text}`;
  if (rounded < 0) return `−${text}`;
  return '±0';
}

export function getDeltaColor(value: DeltaValue, colors: AppColors) {
  if (!isValid(value) || value === 0) return colors.mutedText;
  return value > 0 ? colors.positive : colors.negative;
}

export function DeltaText({ value, fallback, decimals = 0, arrow, size = 15, style }: DeltaTextProps) {
  const { colors } = useTheme();
  const color = getDeltaColor(value, colors);
  const valid = isValid(value);

  return (
      <View style={styles.inline}>
        {arrow && valid && value !== 0 ? (
            <Ionicons name={value > 0 ? 'arrow-up' : 'arrow-down'} size={size} color={color} />
        ) : null}

        <Text style={[styles.text, tabularNums, { color, fontSize: size, lineHeight: size + 5 }, style]}>
          {valid ? formatDelta(value, decimals) : fallback ?? '–'}
        </Text>
      </View>
  );
}

type DeltaPillProps = {
  value: DeltaValue;
  decimals?: number;
  // Text hinter der Zahl, z. B. "in 30 Tagen"
  suffix?: string;
  // Auf farbigem Grund (Hero-Karte): weiß auf halbtransparentem Weiß
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
              ? `${colors.positive}21`
              : `${colors.negative}21`;

  // Mit Pfeil steht nur der Betrag da, das Vorzeichen zeigt der Pfeil.
  const label = valid && value !== 0 ? String(Math.abs(Math.round(value))) : formatDelta(value, decimals);

  return (
      <View style={[styles.pill, { backgroundColor }]}>
        {valid && value !== 0 ? (
            <Ionicons name={value > 0 ? 'arrow-up' : 'arrow-down'} size={14} color={color} />
        ) : null}

        <Text style={[styles.pillText, tabularNums, { color }]}>
          {label}
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
    ...font('700'),
  },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 13,
    lineHeight: 18,
    ...font('700'),
  },
});
