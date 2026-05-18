import { useLocalSearchParams } from 'expo-router';
import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';

export default function MatchDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <Screen title="Begegnung" subtitle="Details zur Begegnung kommen hier rein.">
            <Card title="Begegnungs-ID" subtitle={String(id)} />
        </Screen>
    );
}