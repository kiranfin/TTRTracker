import { Text, View } from 'react-native';
import { BottomSheet } from '@/src/components/BottomSheet';
import { Button } from '@/src/components/Button';
import { useTheme } from '@/src/theme/ThemeProvider';
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
    authMessage,
    authLoading,
    canSubmitAuth,
    handleLogin,
    handleRegister,
    handleLogout,
  } = settings;

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
              </>
          ) : (
              <Button variant="outline" icon="log-out-outline" loading={authLoading === 'logout'} onPress={handleLogout}>
                {t('settings.logout')}
              </Button>
          )}

          <MessageText message={authMessage} />
        </View>
      </BottomSheet>
  );
}
