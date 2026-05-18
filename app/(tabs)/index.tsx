import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { colors } from '../../src/constants/colors';

export default function HomeScreen() {
  return (
      <Screen
          title="Dein Tischtennis-Dashboard"
          subtitle="Schneller Zugriff auf Spieler, Vereine, Ligen, Tabellen, Spielpläne und Favoriten."
      >
        <View style={styles.grid}>
          <Card
              title="Spieler suchen"
              subtitle="Name eingeben und TTR, Verein sowie Details anzeigen."
              meta="Suche"
              onPress={() => router.push('/search' as any)}
          />
          <Card
              title="Liga öffnen"
              subtitle="Zum Beispiel Bezirksklasse C Gruppe 2 mit Tabelle, Ergebnissen und Spielplan."
              meta="Ligen"
              onPress={() => router.push('/leagues' as any)}
          />
          <Card
              title="Favoriten"
              subtitle="Gespeicherte Spieler, Vereine und Ligen als Schnellzugriff."
              meta="Lokal"
              onPress={() => router.push('/favorites' as any)}
          />
        </View>

        <Card title="Nächster Ausbau" subtitle="Danach verbinden wir die Screens mit deinen echten Backend-Routen.">
          <Text style={styles.note}>
            Priorität: Spielersuche → Spielerdetail → Favoriten → Ligadetail mit Tabelle und Ergebnissen.
          </Text>
        </Card>
      </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: 12,
  },
  note: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});