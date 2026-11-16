import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { BottomSheet } from '@/src/components/BottomSheet';
import { useOnMyttConnected } from '@/src/features/mytt';
import { Button } from '@/src/components/Button';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { SettingsController } from '../hooks/useSettings';
import { styles } from '../styles';

type SheetProps = {
  settings: SettingsController;
  visible: boolean;
  onClose: () => void;
};

export function MyttConnectSheet({ settings, visible, onClose }: SheetProps) {
  const { colors } = useTheme();
  const { t, myttStatus, myttMessage, myttLoading, handleCheckMyttStatus } = settings;

  // Nach dem Login zeigt der Status sofort die neue Verbindung.
  useOnMyttConnected(handleCheckMyttStatus);

  const connected = Boolean(myttStatus?.hasSession && !myttStatus.expired);
  const statusColor = connected ? colors.positive : myttStatus?.expired ? colors.warning : colors.destructive;
  const statusIcon = connected ? 'checkmark-circle-outline' : myttStatus?.expired ? 'warning-outline' : 'close-circle-outline';

  return (
      <BottomSheet visible={visible} title={t('settings.myttConnect')} onClose={onClose}>
        <View style={styles.sheetBody}>
          <Text style={[styles.backendText, { color: colors.mutedText }]}>{t('settings.myttConnectDescription')}</Text>

          <View style={styles.twoGrid}>
            <Button
                variant="primary"
                icon="open-outline"
                onPress={() => {
                  onClose();
                  router.push('/mytt-connect');
                }}
                style={styles.halfButton}
            >
              {t('settings.connect')}
            </Button>

            <Button
                variant="outline"
                icon="refresh-outline"
                loading={myttLoading === 'status'}
                onPress={handleCheckMyttStatus}
                style={styles.halfButton}
            >
              {t('settings.checkStatus')}
            </Button>
          </View>

          {myttStatus ? (
              <View
                  style={[
                    styles.statusBox,
                    { borderColor: connected ? colors.positive : colors.border, backgroundColor: colors.primarySoft },
                  ]}
              >
                <View style={styles.statusHeader}>
                  <Ionicons name={statusIcon} size={20} color={statusColor} />
                  <Text style={[styles.statusTitle, { color: statusColor }]}>{myttStatus.label}</Text>
                </View>

                <Text style={[styles.backendText, { color: colors.mutedText }]}>{myttStatus.detail}</Text>
              </View>
          ) : null}

          {myttMessage ? <Text style={[styles.backendText, { color: colors.destructive }]}>{myttMessage}</Text> : null}
        </View>
      </BottomSheet>
  );
}
