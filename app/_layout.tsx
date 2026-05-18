import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
      <>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="player/[id]" options={{ title: 'Spieler' }} />
          <Stack.Screen name="club/[id]" options={{ title: 'Verein' }} />
          <Stack.Screen name="league/[id]" options={{ title: 'Liga' }} />
          <Stack.Screen name="match/[id]" options={{ title: 'Begegnung' }} />
        </Stack>
        <StatusBar style="dark" />
      </>
  );
}