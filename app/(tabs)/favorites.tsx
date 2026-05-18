import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';
import { getFavorites } from '@/src/storage/favorites';
import type { FavoriteItem } from '@/src/types/tttracker';

export default function FavoritesScreen() {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

    useFocusEffect(
        useCallback(() => {
            getFavorites().then(setFavorites);
        }, [])
    );

    return (
        <Screen title="Favoriten" subtitle="Deine gespeicherten Spieler, Vereine und Ligen.">
            {favorites.length === 0 ? (
                <Card title="Noch keine Favoriten" subtitle="Speichere später Spieler, Vereine oder Ligen.">
                    <Text>Favoriten werden lokal auf deinem Gerät gespeichert.</Text>
                </Card>
            ) : (
                favorites.map((favorite) => (
                    <Card
                        key={`${favorite.type}:${favorite.id}`}
                        title={favorite.title}
                        subtitle={favorite.subtitle}
                        meta={favorite.type}
                    />
                ))
            )}
        </Screen>
    );
}