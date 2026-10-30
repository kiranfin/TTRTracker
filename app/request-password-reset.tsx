import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { requestPasswordReset } from '../src/api/auth';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { Screen } from '../src/components/Screen';
import { useI18n } from '../src/i18n/I18nProvider';
import { useTheme } from '../src/theme/ThemeProvider';

export default function RequestPasswordResetScreen() {
    const { colors } = useTheme();
    const { t } = useI18n();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    async function handleRequest() {
        setLoading(true);

        try {
            await requestPasswordReset({ email: email.trim() });
        } catch {
            // Bewusst kein Enumeration-Leak: unabhängig vom Ergebnis
            // dieselbe generische Erfolgsmeldung anzeigen.
        } finally {
            setLoading(false);
            setSent(true);
        }
    }

    return (
        <Screen>
            <View style={styles.container}>
                <Card style={styles.card}>
                    <View style={styles.titleRow}>
                        <Ionicons name="mail-outline" size={22} color={colors.text} />
                        <Text style={[styles.title, { color: colors.text }]}>
                            {t('resetPassword.requestTitle')}
                        </Text>
                    </View>

                    {sent ? (
                        <>
                            <View style={[styles.infoBox, { borderColor: colors.border, backgroundColor: colors.primarySoft }]}>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#16a34a" />
                                <Text style={[styles.infoText, { color: colors.text }]}>
                                    {t('resetPassword.requestSent')}
                                </Text>
                            </View>

                            <Button
                                variant="primary"
                                icon="key-outline"
                                onPress={() => router.push('/reset-password')}
                            >
                                {t('resetPassword.haveCode')}
                            </Button>

                            <Button
                                variant="outline"
                                icon="arrow-back-outline"
                                onPress={() => router.back()}
                            >
                                {t('common.back')}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Text style={[styles.description, { color: colors.mutedText }]}>
                                {t('resetPassword.requestDescription')}
                            </Text>

                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                placeholder={t('settings.emailPlaceholder')}
                                placeholderTextColor={colors.mutedText}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                style={[
                                    styles.input,
                                    {
                                        color: colors.text,
                                        borderColor: colors.border,
                                    },
                                ]}
                            />

                            <Button
                                variant="primary"
                                icon="paper-plane-outline"
                                loading={loading}
                                onPress={handleRequest}
                            >
                                {t('resetPassword.requestCta')}
                            </Button>

                            <Button
                                variant="ghost"
                                icon="arrow-back-outline"
                                onPress={() => router.back()}
                            >
                                {t('common.back')}
                            </Button>
                        </>
                    )}
                </Card>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    card: {
        padding: 16,
        gap: 14,
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
        flex: 1,
    },
    description: {
        fontSize: 13,
        lineHeight: 19,
    },
    input: {
        minHeight: 46,
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        lineHeight: 20,
    },
    infoBox: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 19,
    },
});
