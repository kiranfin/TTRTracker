import { useI18n } from '@/src/i18n/I18nProvider';
import type { MeClub } from '@/src/storage/meClub';
import type { MyttStatusView, MyttGrant } from './types';

export const DEFAULT_ACCENT = '#2563eb';

export const legacyAccentMap: Record<string, string> = {
  default: DEFAULT_ACCENT,
  blue: '#2563eb',
  green: '#16a34a',
  orange: '#ea580c',
  pink: '#db2777',
};

export const accentSwatches = [
  '#111827',
  '#f3f4f6',
  '#dc2626',
  '#e11d48',
  '#ea580c',
  '#d97706',
  '#facc15',
  '#65a30d',
  '#16a34a',
  '#059669',
  '#0d9488',
  '#0891b2',
  '#0284c7',
  '#2563eb',
  '#4f46e5',
  '#7c3aed',
];

export function normalizeHexColor(value?: string | null) {
  if (!value) return DEFAULT_ACCENT;

  const trimmed = value.trim();

  if (legacyAccentMap[trimmed]) {
    return legacyAccentMap[trimmed];
  }

  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];

    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  return DEFAULT_ACCENT;
}

export function hexToRgb(hex: string) {
  const normalized = normalizeHexColor(hex).replace('#', '');

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

export function srgbToLinear(value: number) {
  const normalized = value / 255;

  if (normalized <= 0.04045) {
    return normalized / 12.92;
  }

  return Math.pow((normalized + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);

  const red = srgbToLinear(r);
  const green = srgbToLinear(g);
  const blue = srgbToLinear(b);

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function getContrastRatio(colorA: string, colorB: string) {
  const luminanceA = getRelativeLuminance(colorA);
  const luminanceB = getRelativeLuminance(colorB);

  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);

  return (lighter + 0.05) / (darker + 0.05);
}

export function getReadableTextColor(backgroundColor: string) {
  const whiteContrast = getContrastRatio('#ffffff', backgroundColor);
  const darkContrast = getContrastRatio('#111827', backgroundColor);

  return whiteContrast >= darkContrast ? '#ffffff' : '#111827';
}

export function unwrapData(value: unknown): unknown {
  if (!value || typeof value !== 'object') {
    return value;
  }

  const object = value as Record<string, unknown>;

  if ('data' in object) {
    return object.data;
  }

  return value;
}

export function normalizeMyttStatus(response: unknown, t: ReturnType<typeof useI18n>['t']): MyttStatusView {
  const data = unwrapData(response);

  if (!data || typeof data !== 'object') {
    return {
      hasSession: false,
      expired: false,
      label: t('settings.statusUnknown'),
      detail: t('settings.statusUnknownDetail'),
    };
  }

  const object = data as Record<string, unknown>;

  const hasSession = Boolean(
      object.ownSession ??
      object.hasOwnSession ??
      object.hasSession ??
      object.connected,
  );

  const expired = Boolean(object.expired ?? object.isExpired);

  if (hasSession && !expired) {
    return {
      hasSession,
      expired,
      label: t('settings.statusConnected'),
      detail: t('settings.statusConnectedDetail'),
    };
  }

  if (hasSession && expired) {
    return {
      hasSession,
      expired,
      label: t('settings.statusExpired'),
      detail: t('settings.statusExpiredDetail'),
    };
  }

  return {
    hasSession,
    expired,
    label: t('settings.statusDisconnected'),
    detail: t('settings.statusDisconnectedDetail'),
  };
}

export function normalizeGrants(response: unknown): MyttGrant[] {
  const data = unwrapData(response);

  if (Array.isArray(data)) {
    return data as MyttGrant[];
  }

  if (data && typeof data === 'object') {
    const object = data as Record<string, unknown>;

    if (Array.isArray(object.grants)) {
      return object.grants as MyttGrant[];
    }

    if (Array.isArray(object.items)) {
      return object.items as MyttGrant[];
    }

    if (Array.isArray(object.data)) {
      return object.data as MyttGrant[];
    }
  }

  return [];
}

export function formatClubId(club?: MeClub | null) {
  if (!club?.organization || !club.clubNumber) return '';
  return `${club.organization}:${club.clubNumber}`;
}

export function getClubDisplayName(club?: MeClub | null) {
  return club?.title ?? club?.clubName ?? '';
}

export function parseClubIdInput(value: string) {
  const raw = value.trim();

  const match = raw.match(/^([A-Za-zÄÖÜäöü]{2,10})\s*[:/_\-\s]\s*(\d{4,})$/);

  if (!match) {
    return null;
  }

  return {
    organization: match[1].toUpperCase(),
    clubNumber: match[2],
  };
}
