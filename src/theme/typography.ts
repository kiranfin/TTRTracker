import type { TextStyle } from 'react-native';

export const tabularNums: Pick<TextStyle, 'fontVariant'> = {
  fontVariant: ['tabular-nums'],
};

export const typography = {
  titleLarge: { fontSize: 28, lineHeight: 34, fontWeight: '800' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  section: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
  bodyStrong: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  meta: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
} satisfies Record<string, TextStyle>;

// Zahlen immer mit gleich breiten Ziffern, damit Spalten und Deltas sauber stehen.
export const numeric = {
  hero: { fontSize: 44, lineHeight: 50, fontWeight: '800', ...tabularNums },
  large: { fontSize: 28, lineHeight: 34, fontWeight: '800', ...tabularNums },
  medium: { fontSize: 17, lineHeight: 22, fontWeight: '700', ...tabularNums },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '600', ...tabularNums },
} satisfies Record<string, TextStyle>;
