import { useLocalSearchParams } from 'expo-router';
import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';

export default function ClubDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <Screen title="Verein" subtitle="Vereinsdetails werden im nächsten Schritt geladen.">
            <Card title="Vereins-ID" subtitle={String(id)} />
        </Screen>
    );
}