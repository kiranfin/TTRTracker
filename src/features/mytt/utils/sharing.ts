import { Alert } from 'react-native';

import { deleteMyttCookie, getMyttStatus, saveMyttCookie } from '@/src/api/mytt';
import type { useI18n } from '@/src/i18n/I18nProvider';

type Translate = ReturnType<typeof useI18n>['t'];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

// Nach einem Login: Wer gerade eine Freigabe hat, lädt den neuen Cookie still nach, sonst läuft sie ins Leere.
// Wer nicht teilt, hat keinen Grund für einen Cookie auf dem Server, ein Altbestand wird gelöscht.
// Fehler (kein App Konto, Server nicht erreichbar) bleiben stumm, die lokale Session ist schon gespeichert.
export async function syncServerSession(cookie: string) {
  try {
    const status = asRecord(await getMyttStatus());

    if (status.hasActiveGrants === true) {
      await saveMyttCookie(cookie);
    } else if (status.ownSession) {
      await deleteMyttCookie();
    }
  } catch {
    // Absichtlich leer.
  }
}

// Einwilligung, bevor der Cookie auf den Server geladen wird. Antwort true bei "Hochladen".
export function confirmCookieUpload(t: Translate) {
  return new Promise<boolean>((resolve) => {
    Alert.alert(
        t('settings.shareConsentTitle'),
        t('settings.shareConsentBody'),
        [
          { text: t('settings.shareConsentCancel'), style: 'cancel', onPress: () => resolve(false) },
          { text: t('settings.shareConsentConfirm'), onPress: () => resolve(true) },
        ],
        { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
