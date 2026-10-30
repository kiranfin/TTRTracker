import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PlayerTtrHistoryResponse } from '../types/tttracker';

const ME_SNAPSHOT_KEY = 'tttracker.meSnapshot';

export type MeSnapshot = {
  nuid: string;
  // Stand der Daten.
  savedAt: number;
  // Wann die App sie zuletzt von myTischtennis geholt hat. Fehlt bei älteren Snapshots.
  checkedAt?: number;
  response: PlayerTtrHistoryResponse;
};

// So lange gilt ein geholter Verlauf als frisch: die Startseite fragt bei Fokus oder App Start nicht erneut an.
export const ME_SNAPSHOT_FRESH_MS = 15 * 60 * 1000;

export function isMeSnapshotFresh(snapshot: MeSnapshot, now = Date.now()) {
  return typeof snapshot.checkedAt === 'number' && now - snapshot.checkedAt < ME_SNAPSHOT_FRESH_MS;
}

// Letzter erfolgreich geladener Verlauf fürs eigene Profil. Bremst myTischtennis, zeigt die Startseite
// diesen Stand mit Hinweis statt einer Fehlermeldung.
export async function getMeSnapshot(nuid: string): Promise<MeSnapshot | null> {
  try {
    const stored = await AsyncStorage.getItem(ME_SNAPSHOT_KEY);
    const parsed = stored ? (JSON.parse(stored) as MeSnapshot) : null;

    return parsed?.nuid === nuid && typeof parsed.savedAt === 'number' && parsed.response ? parsed : null;
  } catch {
    return null;
  }
}

// savedAt ist der Stand der Daten, nicht der Zeitpunkt des Speicherns (das Backend kann schon Altes liefern).
export async function setMeSnapshot(nuid: string, response: PlayerTtrHistoryResponse, savedAt: number) {
  const snapshot: MeSnapshot = { nuid, savedAt, checkedAt: Date.now(), response };

  await AsyncStorage.setItem(ME_SNAPSHOT_KEY, JSON.stringify(snapshot));
}
