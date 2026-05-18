import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../../src/components/ActionButton';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { getFavorites, removeFavorite } from '../../src/storage/favorites';
import { AppTheme, useTheme } from '../../src/theme/ThemeProvider';
import type { FavoriteItem } from '../../src/types/tttracker';

function typeLabel(type: FavoriteItem['type']) {
    if (type === 'player') return 'Spieler';
    if (type === 'club') return 'Verein';
    return 'Liga';
}

export default function FavoritesScreen() {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

    const refresh = useCallback(() => {
        getFavorites().then(setFavorites);
    }, []);

    useFocusEffect(refresh);

    function openFavorite(favorite: FavoriteItem) {
        if (favorite.type === 'player') {
            router.push({
                pathname: '/player/[id]',
                params: {
                    id: favorite.id,
                    ...(favorite.params ?? {}),
                },
            } as any);
            return;
        }

        if (favorite.type === 'club') {
            router.push({
                pathname: '/club/[id]',
                params: {
                    id: favorite.id,
                    ...(favorite.params ?? {}),
                },
            } as any);
            return;
        }

        router.push({
            pathname: '/league/[id]',
            params: {
                id: favorite.id,
                ...(favorite.params ?? {}),
            },
        } as any);
    }

    async function deleteFavorite(favorite: FavoriteItem) {
        const next = await removeFavorite(favorite.type, favorite.id);
        setFavorites(next);
    }

    return (
        <Screen title="Favoriten">
            {favorites.length === 0 ? (
                <Card title="Noch leer" subtitle="Speichere Spieler oder Vereine aus der Suche." />
            ) : (
                <View style={styles.list}>
                    {favorites.map((favorite) => (
                        <Card
                            key={`${favorite.type}:${favorite.id}`}
                            title={favorite.title}
                            subtitle={favorite.subtitle}
                            meta={typeLabel(favorite.type)}
                            onPress={() => openFavorite(favorite)}
                        >
                            <ActionButton
                                label="Entfernen"
                                variant="danger"
                                onPress={() => deleteFavorite(favorite)}
                            />
                        </Card>
                    ))}
                </View>
            )}
        </Screen>
    );
}

function createStyles(theme: AppTheme) {
    return StyleSheet.create({
        list: {
            gap: 12,
        },
        empty: {
            color: theme.colors.muted,
        },
    });
}