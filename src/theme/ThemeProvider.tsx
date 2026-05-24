import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'default' | 'blue' | 'green' | 'orange' | 'pink';

export type AppColors = {
  background: string;
  text: string;
  card: string;
  border: string;
  muted: string;
  mutedText: string;
  input: string;
  primary: string;
  primaryForeground: string;
  primarySoft: string;
  primarySoftBorder: string;
  secondary: string;
  secondaryText: string;
  destructive: string;
  shadow: string;
};

type ThemeContextValue = {
  mode: ThemeMode;
  accent: AccentColor;
  isDark: boolean;
  colors: AppColors;
  setMode: (mode: ThemeMode) => Promise<void>;
  setAccent: (accent: AccentColor) => Promise<void>;
};

const STORAGE_THEME = 'tttracker.theme';
const STORAGE_ACCENT = 'tttracker.accent';

const accentMap: Record<AccentColor, { light: string; dark: string; soft: string; softBorder: string }> = {
  default: { light: '#030213', dark: '#f8fafc', soft: '#f1f5f9', softBorder: '#dbe2ea' },
  blue: { light: '#2563eb', dark: '#3b82f6', soft: '#eff6ff', softBorder: '#bfdbfe' },
  green: { light: '#16a34a', dark: '#22c55e', soft: '#f0fdf4', softBorder: '#bbf7d0' },
  orange: { light: '#ea580c', dark: '#f97316', soft: '#fff7ed', softBorder: '#fed7aa' },
  pink: { light: '#db2777', dark: '#ec4899', soft: '#fdf2f8', softBorder: '#fbcfe8' },
};

function createColors(isDark: boolean, accent: AccentColor): AppColors {
  const selected = accentMap[accent];

  if (isDark) {
    return {
      background: '#171717',
      text: '#fafafa',
      card: '#262626',
      border: '#404040',
      muted: '#333333',
      mutedText: '#a3a3a3',
      input: '#2f2f2f',
      primary: selected.dark,
      primaryForeground: accent === 'default' ? '#171717' : '#ffffff',
      primarySoft: '#262626',
      primarySoftBorder: '#404040',
      secondary: '#333333',
      secondaryText: '#fafafa',
      destructive: '#ef4444',
      shadow: '#000000',
    };
  }

  return {
    background: '#f9fafb',
    text: '#030213',
    card: '#ffffff',
    border: 'rgba(0,0,0,0.10)',
    muted: '#ececf0',
    mutedText: '#717182',
    input: '#f3f3f5',
    primary: selected.light,
    primaryForeground: '#ffffff',
    primarySoft: selected.soft,
    primarySoftBorder: selected.softBorder,
    secondary: '#f1f5f9',
    secondaryText: '#030213',
    destructive: '#d4183d',
    shadow: '#000000',
  };
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveIsDark(mode: ThemeMode, systemScheme: ColorSchemeName) {
  if (mode === 'system') return systemScheme === 'dark';
  return mode === 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [accent, setAccentState] = useState<AccentColor>('default');
  const isDark = resolveIsDark(mode, systemScheme);

  useEffect(() => {
    async function loadTheme() {
      const [storedMode, storedAccent] = await Promise.all([
        AsyncStorage.getItem(STORAGE_THEME),
        AsyncStorage.getItem(STORAGE_ACCENT),
      ]);

      if (storedMode === 'light' || storedMode === 'dark' || storedMode === 'system') {
        setModeState(storedMode);
      }

      if (storedAccent === 'default' || storedAccent === 'blue' || storedAccent === 'green' || storedAccent === 'orange' || storedAccent === 'pink') {
        setAccentState(storedAccent);
      }
    }

    loadTheme().catch(() => undefined);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    accent,
    isDark,
    colors: createColors(isDark, accent),
    async setMode(nextMode) {
      setModeState(nextMode);
      await AsyncStorage.setItem(STORAGE_THEME, nextMode);
    },
    async setAccent(nextAccent) {
      setAccentState(nextAccent);
      await AsyncStorage.setItem(STORAGE_ACCENT, nextAccent);
    },
  }), [accent, isDark, mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
}
