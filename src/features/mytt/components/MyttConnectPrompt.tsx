import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { BottomSheet } from '@/src/components/BottomSheet';
import { Button } from '@/src/components/Button';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';

export type MyttConnectReason = 'missing' | 'expired';

type MyttConnectPromptProps = {
  visible: boolean;
  onClose: () => void;
  reason?: MyttConnectReason;
  // Zielroute für den Fall, dass es nach dem Login kein "Zurück" gibt.
  returnTo?: string;
};

// Erklärt kurz, wofür myTischtennis nötig ist, und öffnet den Login Flow.
export function MyttConnectPrompt({ visible, onClose, reason = 'missing', returnTo }: MyttConnectPromptProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const expired = reason === 'expired';

  function openConnect() {
    onClose();
    router.push({ pathname: '/mytt-connect', params: returnTo ? { returnTo } : {} });
  }

  return (
      <BottomSheet
          visible={visible}
          title={expired ? t('mytt.renewTitle') : t('mytt.promptTitle')}
          onClose={onClose}
      >
        <View style={{ gap: 16 }}>
          <Text style={[typography.body, { color: colors.mutedText }]}>
            {expired ? t('mytt.renewBody') : t('mytt.promptBody')}
          </Text>

          <View style={{ gap: 8 }}>
            <Button variant="primary" icon="log-in-outline" onPress={openConnect}>
              {expired ? t('mytt.renewAction') : t('mytt.promptConnect')}
            </Button>

            <Button variant="ghost" onPress={onClose}>
              {t('mytt.promptLater')}
            </Button>
          </View>
        </View>
      </BottomSheet>
  );
}
