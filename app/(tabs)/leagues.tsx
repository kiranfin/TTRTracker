import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { ActionButton } from '../../src/components/ActionButton';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { getFavorites } from '../../src/storage/favorites';
import { AppTheme, useTheme } from '../../src/theme/ThemeProvider';
import type { FavoriteItem } from '../../src/types/tttracker';

type Styles = {
    form: ViewStyle;
    input: TextStyle;
    row: ViewStyle;
    list: ViewStyle;
    headline: TextStyle;
};

export default function LeaguesScreen() {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const [association, setAssociation] = useState('TTBW');
    const [season, setSeason] = useState('25/26');
    const [groupId, setGroupId] = useState('');
    const [title, setTitle] = useState('');
    const [leagueFavorites, setLeagueFavorites] = useState<FavoriteItem[]>([]);

    const refresh = useCallback(() => {
        getFavorites().then((favorites) => {
            setLeagueFavorites(favorites.filter((item) => item.type === 'league'));
        });
    }, []);

    useFocusEffect(refresh);

    function openLeague() {
        const cleanAssociation = association.trim().toUpperCase();
        const cleanSeason = season.trim();
        const cleanGroupId = groupId.trim();

        if (!cleanAssociation || !cleanSeason || !cleanGroupId) return;

        router.push({
            pathname: '/league/[id]',
            params: {
                id: cleanGroupId,
                title: title.trim() || `Liga ${cleanGroupId}`,
                subtitle: `${cleanAssociation} · ${cleanSeason}`,
                association: cleanAssociation,
                season: cleanSeason,
                groupId: cleanGroupId,
                leagueSlug: 'x',
            },
        } as any);
    }

    function openFavorite(favorite: FavoriteItem) {
        router.push({
            pathname: '/league/[id]',
            params: {
                id: favorite.id,
                ...(favorite.params ?? {}),
            },
        } as any);
    }

    return (
        <Screen title="Ligen">
            <Card title="Liga öffnen" subtitle="Verband, Saison und Gruppen-ID eintragen.">
                <View style={styles.form}>
                    <View style={styles.row}>
                        <TextInput
                            value={association}
                            onChangeText={setAssociation}
                            placeholder="Verband"
                            placeholderTextColor={theme.colors.muted}
                            autoCapitalize="characters"
                            style={[styles.input, { flex: 1 }]}
                        />

                        <TextInput
                            value={season}
                            onChangeText={setSeason}
                            placeholder="Saison"
                            placeholderTextColor={theme.colors.muted}
                            style={[styles.input, { flex: 1 }]}
                        />
                    </View>

                    <TextInput
                        value={groupId}
                        onChangeText={setGroupId}
                        placeholder="Gruppen-ID, z. B. 494804"
                        placeholderTextColor={theme.colors.muted}
                        keyboardType="number-pad"
                        style={styles.input}
                    />

                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Name optional"
                        placeholderTextColor={theme.colors.muted}
                        style={styles.input}
                    />

                    <ActionButton
                        label="Liga öffnen"
                        onPress={openLeague}
                        disabled={!association.trim() || !season.trim() || !groupId.trim()}
                    />
                </View>
            </Card>

            {leagueFavorites.length > 0 ? (
                <View style={styles.list}>
                    <Text style={styles.headline}>Gespeichert</Text>

                    {leagueFavorites.map((favorite) => (
                        <Card
                            key={`league:${favorite.id}`}
                            title={favorite.title}
                            subtitle={favorite.subtitle}
                            meta="Liga"
                            onPress={() => openFavorite(favorite)}
                        />
                    ))}
                </View>
            ) : null}
        </Screen>
    );
}

function createStyles(theme: AppTheme) {
    return StyleSheet.create<Styles>({
        form: {
            gap: 10,
        },
        row: {
            flexDirection: 'row',
            gap: 10,
        },
        input: {
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: theme.radius.lg,
            paddingHorizontal: 14,
            paddingVertical: 13,
            color: theme.colors.text,
            fontSize: 15,
            fontWeight: '700',
        },
        list: {
            gap: 12,
        },
        headline: {
            color: theme.colors.text,
            fontSize: 20,
            fontWeight: '900',
            letterSpacing: -0.4,
        },
    });
}