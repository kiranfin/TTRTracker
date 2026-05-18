import { Text } from 'react-native';
import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';

export default function SearchScreen() {
    return (
        <Screen title="Suche" subtitle="Hier kommt als Nächstes die Suche nach Spielern, Vereinen und Ligen rein.">
            <Card title="Noch leer" subtitle="Im nächsten Schritt bauen wir die echte Suchmaske.">
                <Text>Spieler, Vereine und Ligen werden über dein Backend gesucht.</Text>
            </Card>
        </Screen>
    );
}