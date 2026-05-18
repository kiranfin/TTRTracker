import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getApiBaseUrl } from '../../src/api/client';
import { ttApi } from '../../src/api/tttracker';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import {
    AccentKey,
    accentOptions,
    useTheme,
} from '../../src/theme/ThemeProvider';

export default function SettingsScreen() {
    const { theme, mode, accent, setMode, setAccent } = useTheme();
    const styles = createStyles(theme);

    const [status, setStatus] = useState('Nicht geprüft');
    const [loading, setLoading] = useState(false);

    async function checkBackend() {
        setLoading(true);

        try {
            const result = await ttApi.health();
            setStatus(result.ok ? 'Online' : 'Antwortet');
        } catch {
            setStatus('Offline');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Screen title="Setup">
            <Card title="Design">
                <View style={styles.row}>
                    <Pressable
                        style={[styles.choice, mode === 'light' && styles.choiceActive]}
                        onPress={() => setMode('light')}
                    >
                        <Text style={[styles.choiceText, mode === 'light' && styles.choiceTextActive]}>
                            Light
                        </Text>
                    </Pressable>

                    <Pressable
                        style={[styles.choice, mode === 'dark' && styles.choiceActive]}
                        onPress={() => setMode('dark')}
                    >
                        <Text style={[styles.choiceText, mode === 'dark' && styles.choiceTextActive]}>
                            Dark
                        </Text>
                    </Pressable>
                </View>

                <View style={styles.accentGrid}>
                    {accentOptions.map((item) => {
                        const active = item.key === accent;

                        return (
                            <Pressable
                                key={item.key}
                                style={[styles.accentChoice, active && styles.accentChoiceActive]}
                                onPress={() => setAccent(item.key as AccentKey)}
                            >
                                <View
                                    style={[
                                        styles.accentDot,
                                        {
                                            backgroundColor: theme.isDark ? item.dark : item.light,
                                        },
                                    ]}
                                />
                                <Text
                                    style={[
                                        styles.accentText,
                                        active && styles.accentTextActive,
                                    ]}
                                >
                                    {item.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </Card>

            <Card title="Backend" subtitle={getApiBaseUrl()} meta={status}>
                <Pressable style={styles.button} onPress={checkBackend} disabled={loading}>
                    <Text style={styles.buttonText}>{loading ? 'Prüfe ...' : 'Prüfen'}</Text>
                </Pressable>
            </Card>
        </Screen>
    );
}

function createStyles(theme: ReturnType<typeof useTheme>['theme']) {
    return StyleSheet.create({
        row: {
            flexDirection: 'row',
            gap: 8,
        },
        choice: {
            flex: 1,
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: theme.radius.lg,
            paddingVertical: 12,
            alignItems: 'center',
        },
        choiceActive: {
            backgroundColor: theme.colors.accent,
        },
        choiceText: {
            color: theme.colors.muted,
            fontWeight: '900',
        },
        choiceTextActive: {
            color: theme.colors.accentText,
        },
        accentGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 12,
        },
        accentChoice: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: theme.colors.surfaceAlt,
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 9,
        },
        accentChoiceActive: {
            backgroundColor: theme.colors.accentSoft,
        },
        accentDot: {
            width: 12,
            height: 12,
            borderRadius: 999,
        },
        accentText: {
            color: theme.colors.muted,
            fontWeight: '800',
            fontSize: 13,
        },
        accentTextActive: {
            color: theme.colors.accent,
        },
        button: {
            backgroundColor: theme.colors.accent,
            paddingVertical: 13,
            borderRadius: theme.radius.lg,
            alignItems: 'center',
        },
        buttonText: {
            color: theme.colors.accentText,
            fontWeight: '900',
            fontSize: 15,
        },
    });
}