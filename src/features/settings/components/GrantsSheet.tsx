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

export function GrantsSheet({ settings, visible, onClose }: SheetProps) {
  const { colors } = useTheme();
  const {
    t,
    grants,
    grantUsername,
    setGrantUsername,
    grantMessage,
    grantLoading,
    deletingGrantId,
    canCreateGrant,
    handleCreateGrant,
    handleLoadGrants,
    handleRevokeGrant,
  } = settings;

  return (
      <BottomSheet visible={visible} title={t('settings.grantsTitle')} onClose={onClose}>
        <View style={styles.sheetBody}>
          <Text style={[styles.backendText, { color: colors.mutedText }]}>{t('settings.grantsDescription')}</Text>

          <SettingsInput
              value={grantUsername}
              onChangeText={setGrantUsername}
              placeholder={t('settings.grantUsernamePlaceholder')}
              autoCapitalize="none"
          />

          {!canCreateGrant && grantUsername.length > 0 ? (
              <Text style={[styles.backendText, { color: colors.mutedText }]}>{t('settings.grantUsernameTooShort')}</Text>
          ) : null}

          <View style={styles.twoGrid}>
            <Button
                variant="primary"
                icon="person-add-outline"
                loading={grantLoading === 'create'}
                onPress={handleCreateGrant}
                style={styles.halfButton}
            >
              {t('settings.createGrant')}
            </Button>

            <Button
                variant="outline"
                icon="refresh-outline"
                loading={grantLoading === 'load'}
                onPress={handleLoadGrants}
                style={styles.halfButton}
            >
              {t('settings.loadGrants')}
            </Button>
          </View>

          {grants.length > 0 ? (
              <View style={styles.grantList}>
                {grants.map((grant) => (
                    <View key={grant.id} style={[styles.grantItem, { borderColor: colors.border }]}>
                      <View style={styles.grantInfo}>
                        <Text style={[styles.grantTitle, { color: colors.text }]}>
                          {grant.granteeUsername || t('settings.grantUnknownUser')}
                        </Text>

                        <Text style={[styles.grantSubtitle, { color: colors.mutedText }]}>
                          {t('settings.grantAccess')}
                        </Text>
                      </View>

                      <Button
                          variant="outline"
                          icon="trash-outline"
                          loading={deletingGrantId === grant.id}
                          onPress={() => handleRevokeGrant(grant.id)}
                      >
                        {t('common.remove')}
                      </Button>
                    </View>
                ))}
              </View>
          ) : (
              <Text style={[styles.backendText, { color: colors.mutedText }]}>{t('settings.grantsEmpty')}</Text>
          )}

          <MessageText message={grantMessage} />
        </View>
      </BottomSheet>
  );
}
