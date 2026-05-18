import { Text } from 'react-native';
import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';

export default function LeaguesScreen() {
    return (
        <Screen
            title="Ligen"
            subtitle="Schneller Zugriff auf gespeicherte Ligen wie Bezirksklasse C Gruppe 2."
        >
            <Card title="Liga-Übersicht" subtitle="Hier kommen Tabellen, Ergebnisse und Spielpläne hin.">
                <Text>Im nächsten Schritt hängen wir Suche und Favoriten an.</Text>
            </Card>
        </Screen>
    );
}