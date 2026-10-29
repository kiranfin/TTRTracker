import { ApiError } from '@/src/api/client';

export type MyttUnavailableReason = 'missing' | 'expired';

const EXPIRED_CODES = new Set(['MYTT_AUTH_EXPIRED', 'MYTT_SHARED_SESSION_EXPIRED']);
const MISSING_CODES = new Set(['MYTT_ACCOUNT_REQUIRED', 'APP_USER_REQUIRED']);

// Werte mit Login brauchen eine myTischtennis Session. Fehlt oder läuft sie ab, ist das kein Fehler
// der Seite, sondern ein Fall für den Verbinden Hinweis. Alles andere gibt null zurück.
export function getMyttUnavailableReason(error: unknown): MyttUnavailableReason | null {
  if (!(error instanceof ApiError)) return null;

  if (error.code && EXPIRED_CODES.has(error.code)) return 'expired';
  if ((error.code && MISSING_CODES.has(error.code)) || error.status === 401) return 'missing';

  return null;
}
