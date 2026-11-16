import { ApiError } from '../api/client';
import type { TranslationKey, TranslationParams } from '../i18n';
import { formatAge } from './staleness';

type Translate = (key: TranslationKey, params?: TranslationParams) => string;

/**
 * Verständlicher Text für einen Fehler beim Laden von Backend Daten, nie der rohe Backend Text.
 * `fallbackKey` ist der Text der jeweiligen Ansicht ("Ligadaten konnten nicht geladen werden"), wenn
 * der Fehler keinen eigenen Hinweis hat. Mit `since` (Stand der noch angezeigten Daten) steht der
 * Datenstand dahinter.
 */
export function describeApiError(
    error: unknown,
    t: Translate,
    fallbackKey: TranslationKey,
    since?: number | null,
): string {
  const message = baseMessage(error, t, fallbackKey);

  return typeof since === 'number' ? t('apiErrors.withAge', { message, age: formatAge(t, since) }) : message;
}

function baseMessage(error: unknown, t: Translate, fallbackKey: TranslationKey): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'UPSTREAM_BLOCKED':
        return t('apiErrors.blocked');
      case 'UPSTREAM_UNAVAILABLE':
        return t('apiErrors.unavailable');
      case 'UPSTREAM_FORMAT_CHANGED':
        return t('apiErrors.formatChanged');
      case 'UPSTREAM_DISABLED':
        return t('apiErrors.disabled');
      case 'FEATURE_DISABLED':
        return t('apiErrors.featureDisabled');
      case 'RATE_LIMITED':
        return rateLimitMessage(error, t);
      default:
        break;
    }

    if (error.status === 429) return rateLimitMessage(error, t);
    if (error.status !== undefined && error.status >= 500) return t('apiErrors.unavailable');

    return t(fallbackKey);
  }

  // fetch wirft einen TypeError ("Network request failed"), wenn der Server nicht erreichbar ist.
  if (error instanceof TypeError) return t('apiErrors.network');

  return t(fallbackKey);
}

function rateLimitMessage(error: ApiError, t: Translate) {
  const minutes = error.retryAfterSeconds ? Math.ceil(error.retryAfterSeconds / 60) : 0;

  return minutes > 1 ? t('apiErrors.rateLimited', { minutes }) : t('apiErrors.rateLimitedShort');
}
