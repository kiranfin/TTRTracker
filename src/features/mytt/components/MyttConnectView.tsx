import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Button } from '@/src/components/Button';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { useMyttConnect } from '../hooks/useMyttConnect';
import { CONSENT_BANNER_FIX_SCRIPT, MYTT_LOGIN_URL } from '../utils/login';

type MyttConnectViewProps = {
  returnTo?: string;
};

// Login Seite von myTischtennis in einer WebView. Der Login wird erkannt und gespeichert, ohne weitere Eingabe.
export function MyttConnectView({ returnTo }: MyttConnectViewProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { status, message, attempt, onNavigationStateChange, saveNow, retry } = useMyttConnect(returnTo);

  const busy = status === 'preparing' || status === 'saving';

  return (
      <Screen>
        <View style={styles.container}>
          <ScreenHeader title={t('mytt.title')} />

          <Text style={[typography.meta, styles.hint, { color: colors.mutedText }]}>{t('mytt.loginHint')}</Text>

          <View style={[styles.webContainer, { borderColor: colors.border }]}>
            {status === 'login' || status === 'saving' ? (
                <WebView
                    key={attempt}
                    source={{ uri: MYTT_LOGIN_URL }}
                    sharedCookiesEnabled
                    thirdPartyCookiesEnabled
                    javaScriptEnabled
                    domStorageEnabled
                    injectedJavaScriptBeforeContentLoaded={CONSENT_BANNER_FIX_SCRIPT}
                    onNavigationStateChange={onNavigationStateChange}
                    style={styles.webView}
                />
            ) : null}

            {busy ? (
                <View style={[styles.overlay, { backgroundColor: colors.background }]}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={[typography.body, { color: colors.mutedText }]}>
                    {status === 'saving' ? t('mytt.saving') : t('mytt.loading')}
                  </Text>
                </View>
            ) : null}

            {status === 'error' ? (
                <View style={[styles.overlay, { backgroundColor: colors.background }]}>
                  <Text style={[typography.body, styles.errorText, { color: colors.destructive }]}>{message}</Text>
                  <Button variant="primary" icon="refresh-outline" onPress={retry}>
                    {t('mytt.retry')}
                  </Button>
                </View>
            ) : null}
          </View>

          <Button variant="outline" icon="checkmark-circle-outline" disabled={status !== 'login'} onPress={saveNow}>
            {t('mytt.finish')}
          </Button>
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
  hint: {
    paddingHorizontal: 4,
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  errorText: {
    textAlign: 'center',
  },
});
