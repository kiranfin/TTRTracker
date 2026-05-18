import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

export type ThemeMode = 'light' | 'dark';
export type AccentKey = 'white' | 'green' | 'blue' | 'purple' | 'orange';

type ThemeColors = {
    background: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    muted: string;
    border: string;
    accent: string;
    accentSoft: string;
    accentText: string;
    danger: string;
};

export type AppTheme = {
    mode: ThemeMode;
    isDark: boolean;
    colors: ThemeColors;
    radius: {
        md: number;
        lg: number;
        xl: number;
    };
};

type AccentOption = {
    key: AccentKey;
    label: string;
    light: string;
    dark: string;
    softLight: string;
    softDark: string;
};

const STORAGE_KEY = 'tttracker:theme';

export const accentOptions: AccentOption[] = [
    {
        key: 'white',
        label: 'Weiß',
        light: '#FFFFFF',
        dark: '#FFFFFF',
        softLight: '#F2F4F7',
        softDark: '#1F2937',
    },
    {
        key: 'green',
        label: 'Grün',
        light: '#0B6B57',
        dark: '#32D583',
        softLight: '#D1FADF',
        softDark: '#064E3B',
    },
    {
        key: 'blue',
        label: 'Blau',
        light: '#175CD3',
        dark: '#84CAFF',
        softLight: '#D1E9FF',
        softDark: '#194185',
    },
    {
        key: 'purple',
        label: 'Lila',
        light: '#6941C6',
        dark: '#BDB4FE',
        softLight: '#E9D7FE',
        softDark: '#4A1FB8',
    },
    {
        key: 'orange',
        label: 'Orange',
        light: '#B54708',
        dark: '#FDB022',
        softLight: '#FEF0C7',
        softDark: '#7A2E0E',
    },
];

type ThemeContextValue = {
    theme: AppTheme;
    mode: ThemeMode;
    accent: AccentKey;
    setMode: (mode: ThemeMode) => void;
    setAccent: (accent: AccentKey) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function createTheme(mode: ThemeMode, accentKey: AccentKey): AppTheme {
    const isDark = mode === 'dark';
    const accent = accentOptions.find((item) => item.key === accentKey) ?? accentOptions[0];

    return {
        mode,
        isDark,
        colors: {
            background: isDark ? '#0B0F14' : '#F5F6F8',
            surface: isDark ? '#111827' : '#FFFFFF',
            surfaceAlt: isDark ? '#1F2937' : '#F2F4F7',
            text: isDark ? '#F9FAFB' : '#101828',
            muted: isDark ? '#98A2B3' : '#667085',
            border: isDark ? '#273142' : '#EAECF0',
            accent: isDark ? accent.dark : accent.light,
            accentSoft: isDark ? accent.softDark : accent.softLight,
            accentText: accentKey === 'white' ? '#0B0F14' : isDark ? '#0B0F14' : '#FFFFFF',
            danger: isDark ? '#FDA29B' : '#B42318',
        },
        radius: {
            md: 14,
            lg: 20,
            xl: 26,
        },
    };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setModeState] = useState<ThemeMode>('dark');
    const [accent, setAccentState] = useState<AccentKey>('white');
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        async function loadTheme() {
            try {
                const raw = await AsyncStorage.getItem(STORAGE_KEY);
                if (!raw) return;

                const parsed = JSON.parse(raw) as Partial<{
                    mode: ThemeMode;
                    accent: AccentKey;
                }>;

                if (parsed.mode === 'light' || parsed.mode === 'dark') {
                    setModeState(parsed.mode);
                }

                if (accentOptions.some((item) => item.key === parsed.accent)) {
                    setAccentState(parsed.accent as AccentKey);
                }
            } finally {
                setLoaded(true);
            }
        }

        loadTheme();
    }, []);

    useEffect(() => {
        if (!loaded) return;

        AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                mode,
                accent,
            })
        );
    }, [mode, accent, loaded]);

    const theme = useMemo(() => createTheme(mode, accent), [mode, accent]);

    const value = useMemo(
        () => ({
            theme,
            mode,
            accent,
            setMode: setModeState,
            setAccent: setAccentState,
        }),
        [theme, mode, accent]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const value = useContext(ThemeContext);

    if (!value) {
        throw new Error('useTheme muss innerhalb von ThemeProvider genutzt werden.');
    }

    return value;
}