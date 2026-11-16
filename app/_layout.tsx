import 'react-native-gesture-handler';

import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { AuthProvider } from '../src/auth/AuthProvider';
import { I18nProvider } from '../src/i18n/I18nProvider';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

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
    const [fontsLoaded, fontError] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
        Inter_800ExtraBold,
    });

    // Schlägt das Laden fehl, läuft die App mit der Systemschrift weiter.
    const ready = fontsLoaded || Boolean(fontError);

    useEffect(() => {
        if (ready) {
            SplashScreen.hideAsync().catch(() => undefined);
        }
    }, [ready]);

    if (!ready) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider>
                <I18nProvider>
                    <AuthProvider>
                        <RootStack />
                    </AuthProvider>
                </I18nProvider>
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}
