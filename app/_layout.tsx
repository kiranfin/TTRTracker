import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { AuthProvider } from '../src/auth/AuthProvider';

function RootStack() {
    const { colors, isDark } = useTheme();

    return (
        <>
            <StatusBar
                style={isDark ? 'light' : 'dark'}
                backgroundColor={colors.background}
            />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                }}
            />
        </>
    );
}

export default function RootLayout() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <RootStack />
            </AuthProvider>
        </ThemeProvider>
    );
}