import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';

function RootStack() {
    const { theme } = useTheme();

    return (
        <>
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: theme.colors.background,
                    },
                    headerTintColor: theme.colors.text,
                    headerShadowVisible: false,
                    contentStyle: {
                        backgroundColor: theme.colors.background,
                    },
                }}
            >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="player/[id]" options={{ title: 'Spieler' }} />
                <Stack.Screen name="club/[id]" options={{ title: 'Verein' }} />
                <Stack.Screen name="league/[id]" options={{ title: 'Liga' }} />
                <Stack.Screen name="match/[id]" options={{ title: 'Spiel' }} />
            </Stack>

            <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        </>
    );
}

export default function RootLayout() {
    return (
        <ThemeProvider>
            <RootStack />
        </ThemeProvider>
    );
}