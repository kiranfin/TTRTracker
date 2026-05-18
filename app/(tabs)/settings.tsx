import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ttApi } from '@/src/api/tttracker';
import { getApiBaseUrl } from '@/src/api/client';
import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';
import { colors } from '@/src/constants/colors';

export default function SettingsScreen() {
    const [status, setStatus] = useState<string>('Noch nicht geprüft');
    const [loading, setLoading] = useState(false);

    async function checkBackend() {
        setLoading(true);
        setStatus('Prüfe Backend ...');

        try {
            const result = await ttApi.health();
            setStatus(result.ok ? 'Backend erreichbar ✅' : 'Backend antwortet, aber ok=false');
        } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Backend nicht erreichbar');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Screen title="Setup" subtitle="Prüfe, ob die App dein Tischtennis-Backend erreicht.">
            <Card title="API Base URL" subtitle={getApiBaseUrl() || 'Nicht gesetzt'} />

            <Card title="Backend-Status" subtitle={status}>
                <Pressable style={styles.button} onPress={checkBackend} disabled={loading}>
                    <Text style={styles.buttonText}>{loading ? 'Prüfe ...' : 'Backend prüfen'}</Text>
                </Pressable>
            </Card>
        </Screen>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: colors.primary,
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 15,
    },
});