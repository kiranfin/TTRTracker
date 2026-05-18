import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActionButton } from '../../src/components/ActionButton';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { isFavorite, saveFavorite } from '../../src/storage/favorites';

function param(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function PlayerDetailScreen() {
    const params = useLocalSearchParams<{
        id: string;
        title?: string;
        subtitle?: string;
        meta?: string;
    }>();

    const id = param(params.id);
    const title = param(params.title) || 'Spieler';
    const subtitle = param(params.subtitle);
    const meta = param(params.meta);

    const [saved, setSaved] = useState(false);

    useEffect(() => {
        isFavorite('player', id).then(setSaved);
    }, [id]);

    async function addFavorite() {
        await saveFavorite({
            id,
            type: 'player',
            title,
            subtitle,
            params: {
                id,
                title,
                subtitle,
                meta,
            },
        });

        setSaved(true);
    }

    return (
        <Screen title={title}>
            <Card title="Info" subtitle={subtitle || 'Keine weiteren Daten'} meta={meta || 'Spieler'} />

            <ActionButton
                label={saved ? 'Gespeichert' : 'Als Favorit speichern'}
                onPress={addFavorite}
                disabled={saved}
            />
        </Screen>
    );
}