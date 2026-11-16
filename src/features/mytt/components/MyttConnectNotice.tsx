import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { MyttConnectPrompt, type MyttConnectReason } from './MyttConnectPrompt';

type MyttConnectNoticeProps = {
  message: string;
  reason?: MyttConnectReason;
  returnTo?: string;
};

// Hinweis statt Fehlermeldung, wenn ein Wert eine myTischtennis Verbindung braucht.
export function MyttConnectNotice({ message, reason = 'missing', returnTo }: MyttConnectNoticeProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [promptOpen, setPromptOpen] = useState(false);

  return (
      <>
        <Card style={{ gap: 12 }}>
          <View>
            <Text style={[typography.body, { color: colors.mutedText }]}>{message}</Text>
          </View>

          <Button variant="outline" icon="link-outline" onPress={() => setPromptOpen(true)}>
            {reason === 'expired' ? t('mytt.renewTitle') : t('mytt.noticeConnect')}
          </Button>
        </Card>

        <MyttConnectPrompt visible={promptOpen} onClose={() => setPromptOpen(false)} reason={reason} returnTo={returnTo} />
      </>
  );
}
