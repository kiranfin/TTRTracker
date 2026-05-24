import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type BadgeTone = 'secondary' | 'outline' | 'green' | 'blue' | 'orange' | 'red';

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone | string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function Badge({ children, tone = 'secondary', icon }: BadgeProps) {
  const { colors } = useTheme();

  const palette = getPalette(tone, colors);

  return (
      <View style={[styles.badge, { backgroundColor: palette.bg, borderColor: palette.border }]}>
        {icon ? <Ionicons name={icon} size={13} color={palette.text} /> : null}
        <Text style={[styles.text, { color: palette.text }]} numberOfLines={1}>
          {children}
        </Text>
      </View>
  );
}

function getPalette(tone: BadgeTone | string, colors: any) {
  if (tone === 'green') {
    return { bg: '#dcfce7', border: '#86efac', text: '#15803d' };
  }

  if (tone === 'blue') {
    return { bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8' };
  }

  if (tone === 'orange') {
    return { bg: '#ffedd5', border: '#fdba74', text: '#c2410c' };
  }

  if (tone === 'red') {
    return { bg: '#fee2e2', border: '#fca5a5', text: '#b91c1c' };
  }

  if (tone === 'outline') {
    return { bg: colors.card, border: colors.border, text: colors.text };
  }

  return {
    bg: colors.primarySoft,
    border: colors.primarySoftBorder,
    text: colors.primary,
  };
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 25,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },
});