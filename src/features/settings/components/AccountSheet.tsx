import { Text, View } from 'react-native';
import { BottomSheet } from '@/src/components/BottomSheet';
import { Button } from '@/src/components/Button';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import type { SettingsController } from '../hooks/useSettings';
import { styles } from '../styles';
import { MessageText } from './MessageText';
import { SettingsInput } from './SettingsInput';

type SheetProps = {
  settings: SettingsController;
  visible: boolean;
  onClose: () => void;
};

export function AccountSheet({ settings, visible, onClose }: SheetProps) {
  const { colors } = useTheme();
  const {
    t,
    user,
    isAuthenticated,
    username,
    setUsername,
    password,
    setPassword,
    email,
    setEmailField,
    emailInput,
    setEmailInput,
    emailMessage,
    authMessage,
    authLoading,
    canSubmitAuth,
    handleLogin,
    handleRegister,
    handleSaveEmail,
    openForgotPassword,
    openEnterResetCode,
    handleLogout,
  } = settings;

  // Die Reset Screens liegen über den Tabs, das Sheet muss vorher zu.
  function openResetScreen(open: () => void) {
    onClose();
    open();
  }

  return (
      <BottomSheet visible={visible} title={t('settings.account')} onClose={onClose}>
        <View style={styles.sheetBody}>
          <Text style={[styles.backendText, { color: colors.mutedText }]}>
            {isAuthenticated && user
                ? t('settings.loggedInAs', { username: user.username })
                : t('settings.accountDescription')}
          </Text>

          {!isAuthenticated ? (
              <>
                <SettingsInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder={t('settings.usernamePlaceholder')}
                    autoCapitalize="none"
                />

                <SettingsInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t('settings.passwordPlaceholder')}
                    secureTextEntry
                    autoCapitalize="none"
                />

                {/* Nur für die Registrierung, ohne E-Mail gibt es später keinen Passwort Reset. */}
                <SettingsInput
                    value={email}
                    onChangeText={setEmailField}
                    placeholder={t('settings.emailPlaceholderOptional')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <View style={styles.twoGrid}>
                  <Button
                      variant="primary"
                      icon="log-in-outline"
                      loading={authLoading === 'login'}
                      onPress={handleLogin}
                      style={styles.halfButton}
                  >
                    {t('settings.login')}
                  </Button>

                  <Button
                      variant="outline"
                      icon="person-add-outline"
                      loading={authLoading === 'register'}
                      onPress={handleRegister}
                      style={styles.halfButton}
                  >
                    {t('settings.register')}
                  </Button>
                </View>

                {!canSubmitAuth ? (
                    <Text style={[styles.backendText, { color: colors.mutedText }]}>{t('settings.authHint')}</Text>
                ) : null}

                <View style={styles.twoGrid}>
                  <Button
                      variant="ghost"
                      icon="help-circle-outline"
                      onPress={() => openResetScreen(openForgotPassword)}
                      style={styles.halfButton}
                  >
                    {t('settings.forgotPassword')}
                  </Button>

                  <Button
                      variant="ghost"
                      icon="key-outline"
                      onPress={() => openResetScreen(openEnterResetCode)}
                      style={styles.halfButton}
                  >
                    {t('resetPassword.haveCode')}
                  </Button>
                </View>
              </>
          ) : (
              <>
                <Text style={[typography.bodyStrong, { color: colors.text }]}>{t('settings.email')}</Text>

                <Text style={[styles.backendText, { color: colors.mutedText }]}>
                  {t('settings.emailDescription')}
                </Text>

                <SettingsInput
                    value={emailInput}
                    onChangeText={setEmailInput}
                    placeholder={t('settings.emailPlaceholder')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <Button
                    variant="primary"
                    icon="save-outline"
                    loading={authLoading === 'setEmail'}
                    onPress={handleSaveEmail}
                >
                  {t('settings.saveEmail')}
                </Button>

                <MessageText
                    message={emailMessage}
                    tone={emailMessage === t('settings.emailSaved') ? 'positive' : 'negative'}
                />

                <Button variant="outline" icon="log-out-outline" loading={authLoading === 'logout'} onPress={handleLogout}>
                  {t('settings.logout')}
                </Button>
              </>
          )}

          <MessageText message={authMessage} />
        </View>
      </BottomSheet>
  );
}
