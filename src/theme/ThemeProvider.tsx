import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';

import {
  clearCustomBackgroundImageUri,
  getCustomBackgroundImageUri,
  saveCustomBackgroundImageUri,
} from '../storage/backgroundImage';

export type ThemeMode = 'light' | 'dark' | 'system';

// Ab jetzt ist jede gültige Hex-Farbe erlaubt, z. B. "#2563eb"
export type AccentColor = string;

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

  backgroundImageUri: string | null;
  setBackgroundImageUri: (uri: string) => Promise<void>;
  clearBackgroundImageUri: () => Promise<void>;
};

const STORAGE_THEME = 'tttracker.theme';
const STORAGE_ACCENT = 'tttracker.accent';

const DEFAULT_ACCENT = '#2563eb';

const legacyAccentMap: Record<string, string> = {
  default: DEFAULT_ACCENT,
  blue: '#2563eb',
  green: '#16a34a',
  orange: '#ea580c',
  pink: '#db2777',
};

function normalizeHexColor(value?: string | null) {
  if (!value) return DEFAULT_ACCENT;

  const trimmed = value.trim();

  if (legacyAccentMap[trimmed]) {
    return legacyAccentMap[trimmed];
  }

  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];

    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  return DEFAULT_ACCENT;
}

function hexToRgb(hex: string) {
  const normalized = normalizeHexColor(hex).replace('#', '');

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function srgbToLinear(value: number) {
  const normalized = value / 255;

  if (normalized <= 0.04045) {
    return normalized / 12.92;
  }

  return Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);

  const red = srgbToLinear(r);
  const green = srgbToLinear(g);
  const blue = srgbToLinear(b);

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function getContrastRatio(colorA: string, colorB: string) {
  const luminanceA = getRelativeLuminance(colorA);
  const luminanceB = getRelativeLuminance(colorB);

  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);

  return (lighter + 0.05) / (darker + 0.05);
}

function getReadableTextColor(backgroundColor: string) {
  const whiteContrast = getContrastRatio('#ffffff', backgroundColor);
  const darkContrast = getContrastRatio('#111827', backgroundColor);

  return whiteContrast >= darkContrast ? '#ffffff' : '#111827';
}

function createColors(isDark: boolean, accent: AccentColor): AppColors {
  const primary = normalizeHexColor(accent);
  const primaryForeground = getReadableTextColor(primary);

  if (isDark) {
    return {
      background: '#171717',
      text: '#fafafa',
      card: '#262626',
      border: '#404040',
      muted: '#333333',
      mutedText: '#a3a3a3',
      input: '#2f2f2f',
      primary,
      primaryForeground,
      primarySoft: withAlpha(primary, 0.18),
      primarySoftBorder: withAlpha(primary, 0.38),
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
    primary,
    primaryForeground,
    primarySoft: withAlpha(primary, 0.11),
    primarySoftBorder: withAlpha(primary, 0.28),
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
  const [accent, setAccentState] = useState<AccentColor>(DEFAULT_ACCENT);
  const [backgroundImageUri, setBackgroundImageUriState] = useState<string | null>(null);

  const isDark = resolveIsDark(mode, systemScheme);

  useEffect(() => {
    let active = true;

    async function loadTheme() {
      const [storedMode, storedAccent, storedBackgroundImageUri] = await Promise.all([
        AsyncStorage.getItem(STORAGE_THEME),
        AsyncStorage.getItem(STORAGE_ACCENT),
        getCustomBackgroundImageUri(),
      ]);

      if (!active) return;

      if (storedMode === 'light' || storedMode === 'dark' || storedMode === 'system') {
        setModeState(storedMode);
      }

      const normalizedAccent = normalizeHexColor(storedAccent);
      setAccentState(normalizedAccent);

      if (storedBackgroundImageUri) {
        setBackgroundImageUriState(storedBackgroundImageUri);
      } else {
        setBackgroundImageUriState(null);
      }

      // Alte Werte wie "blue", "green", "pink" direkt zu Hex migrieren.
      if (storedAccent && storedAccent !== normalizedAccent) {
        await AsyncStorage.setItem(STORAGE_ACCENT, normalizedAccent);
      }
    }

    loadTheme().catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<ThemeContextValue>(
      () => ({
        mode,
        accent,
        isDark,
        colors: createColors(isDark, accent),

        async setMode(nextMode) {
          setModeState(nextMode);
          await AsyncStorage.setItem(STORAGE_THEME, nextMode);
        },

        async setAccent(nextAccent) {
          const normalizedAccent = normalizeHexColor(nextAccent);

          setAccentState(normalizedAccent);
          await AsyncStorage.setItem(STORAGE_ACCENT, normalizedAccent);
        },

        backgroundImageUri,

        async setBackgroundImageUri(uri) {
          await saveCustomBackgroundImageUri(uri);
          setBackgroundImageUriState(uri);
        },

        async clearBackgroundImageUri() {
          await clearCustomBackgroundImageUri();
          setBackgroundImageUriState(null);
        },
      }),
      [accent, backgroundImageUri, isDark, mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return context;
}