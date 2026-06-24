import CookieManager from '@preeternal/react-native-cookie-manager';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebView as WebViewType } from 'react-native-webview';

import { saveMyttCookie } from '../src/api/mytt';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { Screen } from '../src/components/Screen';
import { useI18n } from '../src/i18n/I18nProvider';
import { useTheme } from '../src/theme/ThemeProvider';

const MYTT_BASE_URL = 'https://www.mytischtennis.de';

type CookieValue = {
    name?: string;
    value?: string;
};

function cookiesToHeader(cookies: Record<string, CookieValue>) {
    return Object.entries(cookies)
        .filter(([, cookie]) => cookie?.value)
        .map(([key, cookie]) => `${cookie.name || key}=${cookie.value}`)
        .join('; ');
}

export default function MyttConnectScreen() {
    const { colors } = useTheme();
    const { t } = useI18n();
    const webViewRef = useRef<WebViewType | null>(null);

    const [currentUrl, setCurrentUrl] = useState(MYTT_BASE_URL);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const useWebKit = useMemo(() => Platform.OS === 'ios', []);

    async function handleSaveConnection() {
        setSaving(true);
        setMessage(null);

        try {
            const cookies = await CookieManager.get(MYTT_BASE_URL, useWebKit);
            const cookieHeader = cookiesToHeader(cookies as Record<string, CookieValue>);

            if (!cookieHeader || cookieHeader.length < 5) {
                setMessage(t('mytt.noCookies'));
                return;
            }

            await saveMyttCookie(cookieHeader);

            setMessage(t('mytt.savedMessage'));
            Alert.alert(
                t('mytt.savedTitle'),
                t('mytt.savedAlert'),
                [
                    {
                        text: t('common.ok'),
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : t('mytt.saveError')
            );
        } finally {
            setSaving(false);
        }
    }

    function handleReload() {
        webViewRef.current?.reload();
    }

    return (
        <Screen>
            <View style={styles.container}>
                <Card style={styles.headerCard}>
                    <View style={styles.titleRow}>
                        <Ionicons name="key-outline" size={22} color={colors.text} />
                        <Text style={[styles.title, { color: colors.text }]}>
                            {t('mytt.title')}
                        </Text>
                    </View>

                    <Text style={[styles.description, { color: colors.mutedText }]}>
                        {t('mytt.description')}
                    </Text>

                    <Text style={[styles.urlText, { color: colors.mutedText }]} numberOfLines={1}>
                        {currentUrl}
                    </Text>

                    {message ? (
                        <Text
                            style={[
                                styles.message,
                                {
                                    color: message.includes('gespeichert') || message.includes('saved')
                                        ? '#16a34a'
                                        : colors.destructive,
                                },
                            ]}
                        >
                            {message}
                        </Text>
                    ) : null}

                    <View style={styles.actions}>
                        <Button
                            variant="outline"
                            icon="arrow-back-outline"
                            onPress={() => router.back()}
                            style={styles.actionButton}
                        >
                            {t('common.back')}
                        </Button>

                        <Button
                            variant="outline"
                            icon="refresh-outline"
                            onPress={handleReload}
                            style={styles.actionButton}
                        >
                            {t('mytt.reload')}
                        </Button>

                        <Button
                            variant="primary"
                            icon="save-outline"
                            loading={saving}
                            onPress={handleSaveConnection}
                            style={styles.actionButton}
                        >
                            {t('mytt.saving')}
                        </Button>
                    </View>
                </Card>

                <View style={[styles.webContainer, { borderColor: colors.border }]}>
                    {loading ? (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator />
                            <Text style={[styles.loadingText, { color: colors.mutedText }]}>
                                {t('mytt.loading')}
                            </Text>
                        </View>
                    ) : null}

                    <WebView
                        ref={webViewRef}
                        source={{ uri: MYTT_BASE_URL }}
                        sharedCookiesEnabled
                        thirdPartyCookiesEnabled
                        javaScriptEnabled
                        domStorageEnabled
                        onLoadStart={() => setLoading(true)}
                        onLoadEnd={() => setLoading(false)}
                        onNavigationStateChange={(state) => {
                            setCurrentUrl(state.url);
                        }}
                        style={styles.webView}
                    />
                </View>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 12,
        gap: 12,
    },
    headerCard: {
        padding: 14,
        gap: 10,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: '800',
    },
    description: {
        fontSize: 13,
        lineHeight: 19,
    },
    urlText: {
        fontSize: 11,
        lineHeight: 16,
    },
    message: {
        fontSize: 13,
        lineHeight: 19,
        fontWeight: '700',
    },
    actions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        minHeight: 42,
    },
    webContainer: {
        flex: 1,
        overflow: 'hidden',
        borderWidth: 1,
        borderRadius: 18,
    },
    webView: {
        flex: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        zIndex: 2,
        top: 12,
        left: 12,
        right: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
    },
    loadingText: {
        fontSize: 13,
        lineHeight: 18,
    },
});
