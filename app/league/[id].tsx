import { useLocalSearchParams } from 'expo-router';
import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';

export default function LeagueDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <Screen title="Liga" subtitle="Tabelle, Ergebnisse und Spielplan kommen hier rein.">
            <Card title="Liga-ID" subtitle={String(id)} />
        </Screen>
    );
}