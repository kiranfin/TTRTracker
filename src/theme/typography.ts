import type { TextStyle } from 'react-native';

// Inter wird in app/_layout.tsx geladen. Jede Stärke ist eine eigene Familie,
// deshalb nie fontWeight setzen, sondern immer font('700') o. ä. verwenden.
export const fontFamilies = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export type FontWeightToken = '400' | '500' | '600' | '700' | '800' | '900';

const familyByWeight: Record<FontWeightToken, string> = {
  '400': fontFamilies.regular,
  '500': fontFamilies.medium,
  '600': fontFamilies.semibold,
  '700': fontFamilies.bold,
  '800': fontFamilies.extrabold,
  '900': fontFamilies.extrabold,
};

export function font(weight: FontWeightToken = '400'): Pick<TextStyle, 'fontFamily'> {
  return { fontFamily: familyByWeight[weight] };
}

export const tabularNums: Pick<TextStyle, 'fontVariant'> = {
  fontVariant: ['tabular-nums'],
};

export const typography = {
  titleLarge: { fontSize: 28, lineHeight: 34, letterSpacing: -0.6, ...font('800') },
  title: { fontSize: 22, lineHeight: 28, letterSpacing: -0.3, ...font('800') },
  heading: { fontSize: 26, lineHeight: 32, letterSpacing: -0.5, ...font('800') },
  section: { fontSize: 17, lineHeight: 22, ...font('700') },
  body: { fontSize: 15, lineHeight: 20, ...font('500') },
  bodyStrong: { fontSize: 15, lineHeight: 20, ...font('600') },
  meta: { fontSize: 13, lineHeight: 18, ...font('400') },
  metaStrong: { fontSize: 13, lineHeight: 18, ...font('600') },
  label: { fontSize: 12, lineHeight: 16, ...font('500') },
  // Kleine graue Überschrift über Listen ("Spieler", "Oktober 2026")
  groupLabel: { fontSize: 13, lineHeight: 18, ...font('700') },
  caption: { fontSize: 11, lineHeight: 14, ...font('600') },
} satisfies Record<string, TextStyle>;

// Zahlen immer mit gleich breiten Ziffern, damit Spalten und Deltas sauber stehen.
export const numeric = {
  display: { fontSize: 56, lineHeight: 60, letterSpacing: -1.6, ...font('800'), ...tabularNums },
  hero: { fontSize: 52, lineHeight: 56, letterSpacing: -1.5, ...font('800'), ...tabularNums },
  large: { fontSize: 26, lineHeight: 32, ...font('800'), ...tabularNums },
  stat: { fontSize: 20, lineHeight: 26, ...font('700'), ...tabularNums },
  medium: { fontSize: 17, lineHeight: 22, ...font('700'), ...tabularNums },
  row: { fontSize: 15, lineHeight: 20, ...font('700'), ...tabularNums },
  small: { fontSize: 13, lineHeight: 18, ...font('600'), ...tabularNums },
} satisfies Record<string, TextStyle>;
