import { useLocalSearchParams } from 'expo-router';
import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';

export default function PlayerDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <Screen title="Spieler" subtitle="Spielerdetails werden im nächsten Schritt geladen.">
            <Card title="Spieler-ID" subtitle={String(id)} />
        </Screen>
    );
}