import { router } from 'expo-router';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';

export default function HomeScreen() {
  return (
      <Screen title="Tracker">
        <Card
            title="Spieler suchen"
            subtitle="TTR, Verein, Details"
            meta="Suche"
            onPress={() => router.push('/search' as any)}
        />

        <Card
            title="Ligen"
            subtitle="Tabellen und Spielpläne"
            meta="Liga"
            onPress={() => router.push('/leagues' as any)}
        />

        <Card
            title="Favoriten"
            subtitle="Spieler, Vereine, Ligen"
            meta="Lokal"
            onPress={() => router.push('/favorites' as any)}
        />
      </Screen>
  );
}