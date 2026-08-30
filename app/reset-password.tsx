import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { resetPassword } from '../src/api/auth';
import { ApiError } from '../src/api/client';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { Screen } from '../src/components/Screen';
import { useI18n } from '../src/i18n/I18nProvider';
import { useTheme } from '../src/theme/ThemeProvider';

// Accepts either a bare token or a full deep link / URL that was pasted from the
// email (e.g. "tttracker://reset-password?token=XYZ") and returns the token.
function extractToken(input: string): string {
    const trimmed = input.trim();
    const match = trimmed.match(/[?&]token=([^&\s]+)/);

    if (match) {
        try {
            return decodeURIComponent(match[1]);
        } catch {
            return match[1];
        }
    }

    return trimmed;
}

export default function ResetPasswordScreen() {
    const { colors } = useTheme();
    const { t } = useI18n();
    const { token } = useLocalSearchParams<{ token?: string }>();

    const [tokenInput, setTokenInput] = useState(token ?? '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [invalidToken, setInvalidToken] = useState(false);
    const [success, setSuccess] = useState(false);

    async function handleSubmit() {
        setErrorMessage(null);
        setInvalidToken(false);

        const trimmedToken = extractToken(tokenInput);

        if (!trimmedToken) {
            setErrorMessage(t('resetPassword.tokenMissing'));
            return;
        }

        if (password.length < 8) {
            setErrorMessage(t('settings.authHint'));
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage(t('resetPassword.passwordsDontMatch'));
            return;
        }

        setLoading(true);

        try {
            await resetPassword({ token: trimmedToken, password });
            setSuccess(true);
        } catch (error) {
            if (error instanceof ApiError && error.code === 'INVALID_RESET_TOKEN') {
                setInvalidToken(true);
                setErrorMessage(t('resetPassword.invalidToken'));
            } else {
                setErrorMessage(
                    error instanceof Error ? error.message : t('resetPassword.genericError')
                );
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <Screen>
            <View style={styles.container}>
                <Card style={styles.card}>
                    <View style={styles.titleRow}>
                        <Ionicons name="lock-closed-outline" size={22} color={colors.text} />
                        <Text style={[styles.title, { color: colors.text }]}>
                            {t('resetPassword.newPasswordTitle')}
                        </Text>
                    </View>

                    {success ? (
                        <>
                            <View style={[styles.infoBox, { borderColor: colors.border, backgroundColor: colors.primarySoft }]}>
                                <Ionicons name="checkmark-circle-outline" size={20} color="#16a34a" />
                                <Text style={[styles.infoText, { color: colors.text }]}>
                                    {t('resetPassword.success')}
                                </Text>
                            </View>

                            <Button
                                variant="primary"
                                icon="log-in-outline"
                                onPress={() => router.replace('/(tabs)/settings')}
                            >
                                {t('resetPassword.backToLogin')}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Text style={[styles.description, { color: colors.mutedText }]}>
                                {t('resetPassword.newPasswordDescription')}
                            </Text>

                            <TextInput
                                value={tokenInput}
                                onChangeText={setTokenInput}
                                placeholder={t('resetPassword.tokenPlaceholder')}
                                placeholderTextColor={colors.mutedText}
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

                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                placeholder={t('resetPassword.newPasswordPlaceholder')}
                                placeholderTextColor={colors.mutedText}
                                secureTextEntry
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

                            <TextInput
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder={t('resetPassword.confirmPlaceholder')}
                                placeholderTextColor={colors.mutedText}
                                secureTextEntry
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
                                icon="save-outline"
                                loading={loading}
                                onPress={handleSubmit}
                            >
                                {t('resetPassword.submitCta')}
                            </Button>

                            {invalidToken ? (
                                <Button
                                    variant="outline"
                                    icon="refresh-outline"
                                    onPress={() => router.replace('/request-password-reset')}
                                >
                                    {t('resetPassword.requestCta')}
                                </Button>
                            ) : null}

                            {errorMessage ? (
                                <Text style={[styles.errorText, { color: colors.destructive }]}>
                                    {errorMessage}
                                </Text>
                            ) : null}
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
    errorText: {
        fontSize: 13,
        lineHeight: 19,
        fontWeight: '700',
    },
});
