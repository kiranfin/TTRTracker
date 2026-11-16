import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

import { deleteMyttCookie, getMyttStatus, uploadMyttSnapshot } from '@/src/api/mytt';
import { ApiError } from '@/src/api/client';
import type { useI18n } from '@/src/i18n/I18nProvider';
import type { PlayerTtrHistoryResponse } from '@/src/types/tttracker';

type Translate = ReturnType<typeof useI18n>['t'];

// Geteilt wird der Stand, den das Gerät von myTischtennis geholt hat (Snapshot), nicht die Anmeldung.
// Der Server bekommt ihn nur mit Einwilligung, nur solange eine Freigabe lebt und höchstens einmal pro Stunde.

const CONSENT_KEY = 'tttracker.snapshotConsent';
const UPLOADED_AT_KEY = 'tttracker.snapshotUploadedAt';

const MIN_UPLOAD_INTERVAL_MS = 60 * 60 * 1000;
// So lange gilt die Antwort auf "gibt es eine aktive Freigabe?", damit nicht jeder Abruf nachfragt.
const STATUS_TTL_MS = 10 * 60 * 1000;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

let activeGrantsCache: { value: boolean; checkedAt: number } | null = null;
// Die Einwilligung wird pro App Start höchstens einmal erfragt.
let consentAsked = false;

/** Nach dem Erstellen oder Widerrufen einer Freigabe, damit der nächste Upload neu nachfragt. */
export function forgetSharingStatus() {
  activeGrantsCache = null;
}

export async function hasSnapshotConsent() {
  try {
    return (await AsyncStorage.getItem(CONSENT_KEY)) === 'true';
  } catch {
    return false;
  }
}

async function setSnapshotConsent(value: boolean) {
  try {
    await AsyncStorage.setItem(CONSENT_KEY, String(value));
  } catch {
    // Ohne gespeicherte Einwilligung fragt die App beim nächsten Mal erneut.
  }
}

// Einwilligung "Snapshots teilen". Antwort true bei "Teilen", gemerkt wird sie auf dem Gerät.
export function confirmSnapshotSharing(t: Translate) {
  return new Promise<boolean>((resolve) => {
    const done = (value: boolean) => {
      if (value) setSnapshotConsent(true).catch(() => undefined);

      resolve(value);
    };

    Alert.alert(
        t('settings.shareConsentTitle'),
        t('settings.shareConsentBody'),
        [
          { text: t('settings.shareConsentCancel'), style: 'cancel', onPress: () => done(false) },
          { text: t('settings.shareConsentConfirm'), onPress: () => done(true) },
        ],
        { cancelable: true, onDismiss: () => done(false) },
    );
  });
}

/** Gibt es eine lebende Freigabe von mir an jemanden? Ohne App Konto oder Netz: nein. */
async function hasActiveGrants() {
  if (activeGrantsCache && Date.now() - activeGrantsCache.checkedAt < STATUS_TTL_MS) {
    return activeGrantsCache.value;
  }

  let value = false;

  try {
    value = asRecord(await getMyttStatus()).hasActiveGrants === true;
  } catch {
    value = false;
  }

  activeGrantsCache = { value, checkedAt: Date.now() };

  return value;
}

async function getUploadedAt() {
  try {
    const stored = await AsyncStorage.getItem(UPLOADED_AT_KEY);

    return stored ? Number(stored) || 0 : 0;
  } catch {
    return 0;
  }
}

async function setUploadedAt(value: number) {
  try {
    await AsyncStorage.setItem(UPLOADED_AT_KEY, String(value));
  } catch {
    // Dann kann es einen Upload mehr geben, der Server drosselt ohnehin.
  }
}

export type UploadResult = 'uploaded' | 'skipped' | 'throttled' | 'failed';

/**
 * Lädt den eben vom Gerät geholten Verlauf hoch (der aktuelle TTR steckt darin). Nur mit Einwilligung, nur
 * mit roher Antwort von myTischtennis (also direkt geholt, nicht aus dem Speicher) und höchstens einmal pro
 * Stunde, außer mit `force` (nach einer neuen Freigabe). Fehler bleiben stumm, die Freigabe selbst steht.
 */
export async function uploadOwnSnapshot(params: {
  nuid: string;
  history: PlayerTtrHistoryResponse;
  force?: boolean;
}): Promise<UploadResult> {
  const { nuid, history } = params;

  if (!history.raw || history.data.error || !(await hasSnapshotConsent())) return 'skipped';

  const uploadedAt = await getUploadedAt();

  if (!params.force && Date.now() - uploadedAt < MIN_UPLOAD_INTERVAL_MS) return 'skipped';

  const fetchedAt = typeof history.meta?.fetchedAt === 'string' ? history.meta.fetchedAt : new Date().toISOString();
  const body = { nuid, ttrHistory: { fetchedAt, data: history.raw } };

  try {
    try {
      await uploadMyttSnapshot(body);
    } catch (error) {
      // Der Spieler im Profil ist die Wahrheit: ein anderer hinterlegter Spieler wird ersetzt.
      if (!(error instanceof ApiError) || error.code !== 'PLAYER_MISMATCH') throw error;

      await uploadMyttSnapshot({ ...body, replacePlayer: true });
    }

    await setUploadedAt(Date.now());

    return 'uploaded';
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.code === 'SNAPSHOT_THROTTLED') {
        await setUploadedAt(Date.now() - MIN_UPLOAD_INTERVAL_MS + (error.retryAfterSeconds ?? 0) * 1000);

        return 'throttled';
      }

      // Keine Freigabe mehr: nichts hochladen, bis eine neue entsteht.
      if (error.code === 'NOT_SHARING') forgetSharingStatus();
    }

    return 'failed';
  }
}

/**
 * Nach einem erfolgreichen Abruf des eigenen Verlaufs: teilen, falls jemand eine Freigabe hat. Hatte der
 * Nutzer noch nicht eingewilligt (z.B. Freigabe aus der Zeit mit Cookie Upload), fragt die App einmal pro
 * Start nach.
 */
export async function shareSnapshotIfNeeded(params: { nuid: string; history: PlayerTtrHistoryResponse; t: Translate }) {
  if (!params.history.raw || !(await hasActiveGrants())) return;

  if (!(await hasSnapshotConsent())) {
    if (consentAsked) return;

    consentAsked = true;

    if (!(await confirmSnapshotSharing(params.t))) return;
  }

  await uploadOwnSnapshot({ nuid: params.nuid, history: params.history });
}

/**
 * Der Server braucht keinen Cookie mehr. Ein Altbestand (aus der Zeit mit Cookie Upload) wird gelöscht.
 * Fehler (kein App Konto, Server nicht erreichbar) bleiben stumm.
 */
export async function cleanupServerSession() {
  try {
    const status = asRecord(await getMyttStatus());

    if (status.ownSession) {
      await deleteMyttCookie();
    }
  } catch {
    // Absichtlich leer.
  }
}
