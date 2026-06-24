import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import ColorPicker, {
  HueCircular,
  Panel1,
  Preview,
} from 'reanimated-color-picker';

import { getApiBaseUrl } from '../../src/api/client';
import {
  createMyttGrant,
  getMyttGrants,
  getMyttStatus,
  revokeMyttGrant,
} from '../../src/api/mytt';
import { ttApi } from '../../src/api/tttracker';
import { useAuth } from '../../src/auth/AuthProvider';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { AppLanguage, languageOptions } from '../../src/i18n';
import { useI18n } from '../../src/i18n/I18nProvider';
import {
  clearMeClub,
  getMeClub,
  setMeClub as saveMeClub,
} from '../../src/storage/meClub';
import type { MeClub } from '../../src/storage/meClub';
import {
  clearMePlayerNuid,
  getMePlayerNuid,
  setMePlayerNuid,
} from '../../src/storage/mePlayer';
import { useTheme } from '../../src/theme/ThemeProvider';

const DEFAULT_ACCENT = '#2563eb';

const legacyAccentMap: Record<string, string> = {
  default: DEFAULT_ACCENT,
  blue: '#2563eb',
  green: '#16a34a',
  orange: '#ea580c',
  pink: '#db2777',
};

const accentSwatches = [
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

type MyttStatusView = {
  hasSession: boolean;
  expired: boolean;
  label: string;
  detail: string;
};

type MyttGrant = {
  id: string;
  granteeUserId?: string;
  granteeUsername?: string;
  scopes?: string[];
  createdAt?: string;
  expiresAt?: string | null;
};

function normalizeHexColor(value?: string | null) {
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

function hexToRgb(hex: string) {
  const normalized = normalizeHexColor(hex).replace('#', '');

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function srgbToLinear(value: number) {
  const normalized = value / 255;

  if (normalized <= 0.04045) {
    return normalized / 12.92;
  }

  return Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);

  const red = srgbToLinear(r);
  const green = srgbToLinear(g);
  const blue = srgbToLinear(b);

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function getContrastRatio(colorA: string, colorB: string) {
  const luminanceA = getRelativeLuminance(colorA);
  const luminanceB = getRelativeLuminance(colorB);

  const lighter = Math.max(luminanceA, luminanceB);
  const darker = Math.min(luminanceA, luminanceB);

  return (lighter + 0.05) / (darker + 0.05);
}

function getReadableTextColor(backgroundColor: string) {
  const whiteContrast = getContrastRatio('#ffffff', backgroundColor);
  const darkContrast = getContrastRatio('#111827', backgroundColor);

  return whiteContrast >= darkContrast ? '#ffffff' : '#111827';
}

function unwrapData(value: unknown): unknown {
  if (!value || typeof value !== 'object') {
    return value;
  }

  const object = value as Record<string, unknown>;

  if ('data' in object) {
    return object.data;
  }

  return value;
}

function normalizeMyttStatus(response: unknown, t: ReturnType<typeof useI18n>['t']): MyttStatusView {
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

function normalizeGrants(response: unknown): MyttGrant[] {
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

function formatClubId(club?: MeClub | null) {
  if (!club?.organization || !club.clubNumber) return '';
  return `${club.organization}:${club.clubNumber}`;
}

function getClubDisplayName(club?: MeClub | null) {
  return club?.title ?? club?.clubName ?? '';
}

function parseClubIdInput(value: string) {
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

export default function SettingsScreen() {
  const {
    colors,
    mode,
    accent,
    setMode,
    setAccent,
    backgroundImageUri,
    setBackgroundImageUri,
    clearBackgroundImageUri,
  } = useTheme();

  const { language, setLanguage, t } = useI18n();
  const { user, isAuthenticated, login, register, logout } = useAuth();

  const [health, setHealth] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<
      'login' | 'register' | 'logout' | null
  >(null);

  const [myttStatus, setMyttStatus] = useState<MyttStatusView | null>(null);
  const [myttMessage, setMyttMessage] = useState<string | null>(null);
  const [myttLoading, setMyttLoading] = useState<'status' | null>(null);

  const [grants, setGrants] = useState<MyttGrant[]>([]);
  const [grantUsername, setGrantUsername] = useState('');
  const [grantMessage, setGrantMessage] = useState<string | null>(null);
  const [grantLoading, setGrantLoading] = useState<'load' | 'create' | null>(null);
  const [deletingGrantId, setDeletingGrantId] = useState<string | null>(null);

  const [meNuidInput, setMeNuidInput] = useState('');
  const [savedMeNuid, setSavedMeNuid] = useState<string | null>(null);
  const [meNuidMessage, setMeNuidMessage] = useState<string | null>(null);
  const [meNuidLoading, setMeNuidLoading] = useState<'save' | 'clear' | null>(null);

  const [clubIdInput, setClubIdInput] = useState('');
  const [clubNameInput, setClubNameInput] = useState('');
  const [savedMeClub, setSavedMeClub] = useState<MeClub | null>(null);
  const [meClubMessage, setMeClubMessage] = useState<string | null>(null);
  const [meClubLoading, setMeClubLoading] = useState<'save' | 'clear' | null>(null);

  const [backgroundMessage, setBackgroundMessage] = useState<string | null>(null);
  const [backgroundLoading, setBackgroundLoading] = useState<'pick' | 'clear' | null>(null);

  const [draftAccent, setDraftAccent] = useState(() => normalizeHexColor(accent));

  const savedAccent = useMemo(() => normalizeHexColor(accent), [accent]);

  useEffect(() => {
    setDraftAccent((current) => {
      if (current === savedAccent) return current;
      return savedAccent;
    });
  }, [savedAccent]);

  const accentTextColor = useMemo(
      () => getReadableTextColor(draftAccent),
      [draftAccent],
  );

  const accentContrast = useMemo(
      () => getContrastRatio(accentTextColor, draftAccent),
      [accentTextColor, draftAccent],
  );

  function handlePreviewAccent(hex: string) {
    const normalized = normalizeHexColor(hex);

    setDraftAccent((current) => {
      if (current === normalized) return current;
      return normalized;
    });
  }

  function handleApplyAccent() {
    const normalized = normalizeHexColor(draftAccent);

    setDraftAccent((current) => {
      if (current === normalized) return current;
      return normalized;
    });

    setAccent(normalized).catch(() => undefined);
  }

  function handleResetAccentPreview() {
    handlePreviewAccent(DEFAULT_ACCENT);
  }

  async function handlePickBackgroundImage() {
    setBackgroundLoading('pick');
    setBackgroundMessage(null);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        throw new Error(
            t('settings.backgroundPermissionError'),
        );
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.88,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        setBackgroundMessage(t('settings.backgroundNoChange'));
        return;
      }

      await setBackgroundImageUri(result.assets[0].uri);
      setBackgroundMessage(t('settings.backgroundSaved'));
    } catch (error) {
      setBackgroundMessage(
          error instanceof Error
              ? error.message
              : t('settings.backgroundSaveError'),
      );
    } finally {
      setBackgroundLoading(null);
    }
  }

  async function handleClearBackgroundImage() {
    setBackgroundLoading('clear');
    setBackgroundMessage(null);

    try {
      await clearBackgroundImageUri();
      setBackgroundMessage(t('settings.backgroundRestored'));
    } catch (error) {
      setBackgroundMessage(
          error instanceof Error
              ? error.message
              : t('settings.backgroundRemoveError'),
      );
    } finally {
      setBackgroundLoading(null);
    }
  }

  useFocusEffect(
      useCallback(() => {
        let active = true;

        async function loadLocalProfileSettings() {
          try {
            const [storedNuid, storedClub] = await Promise.all([
              getMePlayerNuid(),
              getMeClub(),
            ]);

            if (!active) return;

            setSavedMeNuid(storedNuid);
            setMeNuidInput(storedNuid ?? '');

            setSavedMeClub(storedClub);
            setClubIdInput(formatClubId(storedClub));
            setClubNameInput(getClubDisplayName(storedClub));
          } catch {
            if (!active) return;

            setSavedMeNuid(null);
            setSavedMeClub(null);
          }
        }

        loadLocalProfileSettings().catch(() => undefined);

        return () => {
          active = false;
        };
      }, []),
  );

  async function checkHealth() {
    setChecking(true);
    setHealth(null);

    try {
      const response = await ttApi.health();
      setHealth(response.ok ? t('settings.backendReachable') : t('settings.backendOkFalse'));
    } catch (error) {
      setHealth(error instanceof Error ? error.message : t('settings.backendUnreachable'));
    } finally {
      setChecking(false);
    }
  }

  async function handleLogin() {
    setAuthLoading('login');
    setAuthMessage(null);

    try {
      const loggedInUser = await login({
        username: username.trim(),
        password,
      });

      setPassword('');
      setAuthMessage(t('settings.loggedInAs', { username: loggedInUser.username }));
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : t('settings.loginFailed'));
    } finally {
      setAuthLoading(null);
    }
  }

  async function handleRegister() {
    setAuthLoading('register');
    setAuthMessage(null);

    try {
      const registeredUser = await register({
        username: username.trim(),
        password,
      });

      setPassword('');
      setAuthMessage(t('settings.registeredAs', { username: registeredUser.username }));
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : t('settings.registerFailed'));
    } finally {
      setAuthLoading(null);
    }
  }

  async function handleLogout() {
    setAuthLoading('logout');
    setAuthMessage(null);
    setMyttMessage(null);
    setMyttStatus(null);
    setGrantMessage(null);
    setGrants([]);

    try {
      await logout();
      setPassword('');
      setAuthMessage(t('settings.logoutSuccess'));
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : t('settings.logoutFailed'));
    } finally {
      setAuthLoading(null);
    }
  }

  async function handleCheckMyttStatus() {
    setMyttLoading('status');
    setMyttMessage(null);

    try {
      const status = await getMyttStatus();
      setMyttStatus(normalizeMyttStatus(status, t));
    } catch (error) {
      setMyttStatus(null);
      setMyttMessage(error instanceof Error ? error.message : t('settings.statusLoadError'));
    } finally {
      setMyttLoading(null);
    }
  }

  async function handleLoadGrants() {
    setGrantLoading('load');
    setGrantMessage(null);

    try {
      const response = await getMyttGrants();
      setGrants(normalizeGrants(response));
    } catch (error) {
      setGrantMessage(error instanceof Error ? error.message : t('settings.grantsLoadError'));
    } finally {
      setGrantLoading(null);
    }
  }

  async function handleCreateGrant() {
    setGrantLoading('create');
    setGrantMessage(null);

    try {
      await createMyttGrant({
        granteeUsername: grantUsername.trim(),
        scopes: ['ttr:read', 'ttr_history:read'],
      });

      setGrantUsername('');
      setGrantMessage(t('settings.grantCreated'));

      const response = await getMyttGrants();
      setGrants(normalizeGrants(response));
    } catch (error) {
      setGrantMessage(error instanceof Error ? error.message : t('settings.grantCreateError'));
    } finally {
      setGrantLoading(null);
    }
  }

  async function handleRevokeGrant(grantId: string) {
    setDeletingGrantId(grantId);
    setGrantMessage(null);

    try {
      await revokeMyttGrant(grantId);
      setGrants((current) => current.filter((grant) => grant.id !== grantId));
      setGrantMessage(t('settings.grantRemoved'));
    } catch (error) {
      setGrantMessage(error instanceof Error ? error.message : t('settings.grantRemoveError'));
    } finally {
      setDeletingGrantId(null);
    }
  }

  async function handleSaveMeNuid() {
    setMeNuidLoading('save');
    setMeNuidMessage(null);

    try {
      const saved = await setMePlayerNuid(meNuidInput);
      setSavedMeNuid(saved);
      setMeNuidInput(saved);
      setMeNuidMessage(t('settings.profileSaved'));
    } catch (error) {
      setMeNuidMessage(error instanceof Error ? error.message : t('settings.nuidSaveError'));
    } finally {
      setMeNuidLoading(null);
    }
  }

  async function handleClearMeNuid() {
    setMeNuidLoading('clear');
    setMeNuidMessage(null);

    try {
      await clearMePlayerNuid();
      setSavedMeNuid(null);
      setMeNuidInput('');
      setMeNuidMessage(t('settings.profileRemoved'));
    } catch (error) {
      setMeNuidMessage(error instanceof Error ? error.message : t('settings.nuidRemoveError'));
    } finally {
      setMeNuidLoading(null);
    }
  }

  async function handleSaveMeClub() {
    setMeClubLoading('save');
    setMeClubMessage(null);

    try {
      const parsed = parseClubIdInput(clubIdInput);

      if (!parsed) {
        throw new Error(t('settings.clubFormatError'));
      }

      const displayName = clubNameInput.trim();

      const saved = await saveMeClub({
        organization: parsed.organization,
        clubNumber: parsed.clubNumber,
        title: displayName || undefined,
        clubName: displayName || undefined,
      });

      setSavedMeClub(saved);
      setClubIdInput(formatClubId(saved));
      setClubNameInput(getClubDisplayName(saved));
      setMeClubMessage(t('settings.clubSaved'));
    } catch (error) {
      setMeClubMessage(error instanceof Error ? error.message : t('settings.clubSaveError'));
    } finally {
      setMeClubLoading(null);
    }
  }

  async function handleClearMeClub() {
    setMeClubLoading('clear');
    setMeClubMessage(null);

    try {
      await clearMeClub();
      setSavedMeClub(null);
      setClubIdInput('');
      setClubNameInput('');
      setMeClubMessage(t('settings.clubRemoved'));
    } catch (error) {
      setMeClubMessage(error instanceof Error ? error.message : t('settings.clubRemoveError'));
    } finally {
      setMeClubLoading(null);
    }
  }

  function openSavedMeClub() {
    if (!savedMeClub) return;

    router.push({
      pathname: '/(tabs)/club/[clubKey]',
      params: {
        clubKey: `${savedMeClub.organization}-${savedMeClub.clubNumber}`,
        organization: savedMeClub.organization,
        clubNumber: savedMeClub.clubNumber,
        title: savedMeClub.title ?? savedMeClub.clubName ?? t('settings.clubSavedTitle'),
        clubName: savedMeClub.clubName ?? savedMeClub.title ?? '',
        state: savedMeClub.state ?? '',
        season: savedMeClub.season ?? '',
      },
    });
  }

  function openSavedMeProfile() {
    if (!savedMeNuid) return;

    router.push({
      pathname: '/(tabs)/player/[nuid]',
      params: {
        nuid: savedMeNuid,
        title: t('home.profileFallback'),
      },
    });
  }

  const canSubmitAuth = username.trim().length >= 2 && password.length >= 8;
  const canCreateGrant = grantUsername.trim().length >= 2;

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>
          </View>

          <Card style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="language-outline" size={21} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t('settings.languageTitle')}
              </Text>
            </View>

            <Text style={[styles.backendText, { color: colors.mutedText }]}>
              {t('settings.languageDescription')}
            </Text>

            <View style={styles.twoGrid}>
              {languageOptions.map((option) => (
                  <Button
                      key={option.value}
                      variant={language === option.value ? 'primary' : 'outline'}
                      icon={option.value === 'de' ? 'flag-outline' : 'language-outline'}
                      onPress={() => setLanguage(option.value as AppLanguage)}
                      style={styles.halfButton}
                  >
                    {t(option.labelKey)}
                  </Button>
              ))}
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons
                  name={mode === 'dark' ? 'moon' : 'sunny-outline'}
                  size={21}
                  color={colors.text}
              />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.appearance')}</Text>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>{t('settings.theme')}</Text>

            <View style={styles.twoGrid}>
              <Button
                  variant={mode === 'light' ? 'primary' : 'outline'}
                  icon="sunny-outline"
                  onPress={() => setMode('light')}
                  style={styles.halfButton}
              >
                {t('settings.themeLight')}
              </Button>

              <Button
                  variant={mode === 'dark' ? 'primary' : 'outline'}
                  icon="moon-outline"
                  onPress={() => setMode('dark')}
                  style={styles.halfButton}
              >
                {t('settings.themeDark')}
              </Button>
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="color-palette-outline" size={21} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.accentColor')}</Text>
            </View>

            <View style={styles.colorPickerBox}>
              <ColorPicker
                  value={draftAccent}
                  thumbAnimationDuration={0}
                  onCompleteJS={({ hex }) => {
                    handlePreviewAccent(hex);
                  }}
              >
                <Preview style={styles.colorPreview} hideInitialColor hideText />

                <View style={styles.colorWheelRow}>
                  <HueCircular
                      thumbSize={28}
                      sliderThickness={22}
                      style={styles.hueCircular}
                  />

                  <Panel1 style={styles.colorPanel} />
                </View>
              </ColorPicker>
            </View>

            <View style={styles.swatchGrid}>
              {accentSwatches.map((swatch) => {
                const normalizedSwatch = normalizeHexColor(swatch);
                const selected = normalizeHexColor(draftAccent) === normalizedSwatch;
                const swatchIconColor = getReadableTextColor(normalizedSwatch);

                return (
                    <Pressable
                        key={normalizedSwatch}
                        accessibilityRole="button"
                        accessibilityLabel={`${t('settings.accentColor')} ${normalizedSwatch}`}
                        onPress={() => handlePreviewAccent(normalizedSwatch)}
                        style={({ pressed }) => [
                          styles.swatchButton,
                          {
                            backgroundColor: normalizedSwatch,
                            borderColor: selected ? colors.text : colors.border,
                            opacity: pressed ? 0.72 : 1,
                            transform: [{ scale: selected ? 1.06 : 1 }],
                          },
                        ]}
                    >
                      {selected ? (
                          <Ionicons name="checkmark" size={17} color={swatchIconColor} />
                      ) : null}
                    </Pressable>
                );
              })}
            </View>

            <View style={styles.twoGrid}>
              <Button
                  variant="outline"
                  icon="refresh-outline"
                  onPress={handleResetAccentPreview}
                  style={styles.halfButton}
              >
                {t('settings.resetAccent')}
              </Button>

              <Button
                  variant="primary"
                  icon="checkmark-outline"
                  onPress={handleApplyAccent}
                  style={styles.halfButton}
              >
                {t('settings.applyAccent')}
              </Button>
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="image-outline" size={21} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.background')}</Text>
            </View>

            <View
                style={[
                  styles.backgroundPreview,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
            >
              {backgroundImageUri ? (
                  <ImageBackground
                      source={{ uri: backgroundImageUri }}
                      resizeMode="cover"
                      style={styles.backgroundPreviewImage}
                  >
                    <View
                        style={[
                          styles.backgroundPreviewOverlay,
                          {
                            backgroundColor:
                                mode === 'dark'
                                    ? 'rgba(2, 6, 23, 0.52)'
                                    : 'rgba(248, 250, 252, 0.48)',
                          },
                        ]}
                    >
                      <Ionicons name="checkmark-circle-outline" size={24} color={colors.text} />

                      <Text style={[styles.backgroundPreviewTitle, { color: colors.text }]}>
                        {t('settings.backgroundPreviewTitle')}
                      </Text>

                      <Text style={[styles.backgroundPreviewMeta, { color: colors.mutedText }]}>
                        {t('settings.backgroundDescription')}
                      </Text>
                    </View>
                  </ImageBackground>
              ) : (
                  <View style={styles.backgroundPreviewEmpty}>
                    <Ionicons name="image-outline" size={28} color={colors.mutedText} />

                    <Text style={[styles.backgroundPreviewTitle, { color: colors.text }]}>
                      {t('settings.backgroundPreviewDefaultTitle')}
                    </Text>

                    <Text style={[styles.backgroundPreviewMeta, { color: colors.mutedText }]}>
                      {t('settings.backgroundPreviewDefaultMeta')}
                    </Text>
                  </View>
              )}
            </View>

            <View style={styles.twoGrid}>
              <Button
                  variant="primary"
                  icon="image-outline"
                  loading={backgroundLoading === 'pick'}
                  onPress={handlePickBackgroundImage}
                  style={styles.halfButton}
              >
                {t('settings.backgroundPick')}
              </Button>

              <Button
                  variant="outline"
                  icon="trash-outline"
                  loading={backgroundLoading === 'clear'}
                  onPress={handleClearBackgroundImage}
                  style={styles.halfButton}
              >
                {t('common.remove')}
              </Button>
            </View>

            {backgroundMessage ? (
                <Text
                    style={[
                      styles.backendText,
                      {
                        color:
                            backgroundMessage.includes('gespeichert') ||
                            backgroundMessage.includes('Standard') ||
                            backgroundMessage.includes('Keine Änderung') ||
                            backgroundMessage.includes('saved') ||
                            backgroundMessage.includes('restored') ||
                            backgroundMessage.includes('No changes')
                                ? '#16a34a'
                                : colors.destructive,
                      },
                    ]}
                >
                  {backgroundMessage}
                </Text>
            ) : null}
          </Card>

          <Card style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="person-circle-outline" size={21} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.account')}</Text>
            </View>

            <Text style={[styles.backendText, { color: colors.mutedText }]}>
              {isAuthenticated && user
                  ? t('settings.loggedInAs', { username: user.username })
                  : t('settings.accountDescription')}
            </Text>

            {!isAuthenticated ? (
                <>
                  <TextInput
                      value={username}
                      onChangeText={setUsername}
                      placeholder={t('settings.usernamePlaceholder')}
                      placeholderTextColor={colors.mutedText}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={[
                        styles.input,
                        {
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                  />

                  <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder={t('settings.passwordPlaceholder')}
                      placeholderTextColor={colors.mutedText}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={[
                        styles.input,
                        {
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                  />

                  <View style={styles.twoGrid}>
                    <Button
                        variant="primary"
                        icon="log-in-outline"
                        loading={authLoading === 'login'}
                        onPress={handleLogin}
                        style={styles.halfButton}
                    >
                      {t('settings.login')}
                    </Button>

                    <Button
                        variant="outline"
                        icon="person-add-outline"
                        loading={authLoading === 'register'}
                        onPress={handleRegister}
                        style={styles.halfButton}
                    >
                      {t('settings.register')}
                    </Button>
                  </View>

                  {!canSubmitAuth ? (
                      <Text style={[styles.backendText, { color: colors.mutedText }]}>
                        {t('settings.authHint')}
                      </Text>
                  ) : null}
                </>
            ) : (
                <Button
                    variant="outline"
                    icon="log-out-outline"
                    loading={authLoading === 'logout'}
                    onPress={handleLogout}
                >
                  {t('settings.logout')}
                </Button>
            )}

            {authMessage ? (
                <Text
                    style={[
                      styles.backendText,
                      {
                        color:
                            authMessage.includes('Eingeloggt') ||
                            authMessage.includes('Registriert') ||
                            authMessage.includes('ausgeloggt') ||
                            authMessage.includes('Logged') ||
                            authMessage.includes('Registered')
                                ? '#16a34a'
                                : colors.destructive,
                      },
                    ]}
                >
                  {authMessage}
                </Text>
            ) : null}
          </Card>

          <Card style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="id-card-outline" size={21} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.localProfile')}</Text>
            </View>

            <Text style={[styles.backendText, { color: colors.mutedText }]}>
              {t('settings.localProfileDescription')}
            </Text>

            <View style={styles.profileSection}>
              <View style={styles.profileSectionHeader}>
                <View style={[styles.profileSectionIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="person-outline" size={17} color={colors.primary} />
                </View>

                <View style={styles.profileSectionTitleBlock}>
                  <Text style={[styles.profileSectionTitle, { color: colors.text }]}>{t('settings.player')}</Text>
                </View>
              </View>

              <TextInput
                  value={meNuidInput}
                  onChangeText={setMeNuidInput}
                  placeholder={t('settings.nuidPlaceholder')}
                  placeholderTextColor={colors.mutedText}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
              />

              <View style={styles.twoGrid}>
                <Button
                    variant="primary"
                    icon="save-outline"
                    loading={meNuidLoading === 'save'}
                    onPress={handleSaveMeNuid}
                    style={styles.halfButton}
                >
                  {t('common.save')}
                </Button>

                <Button
                    variant="outline"
                    icon="trash-outline"
                    loading={meNuidLoading === 'clear'}
                    onPress={handleClearMeNuid}
                    style={styles.halfButton}
                >
                  {t('common.remove')}
                </Button>
              </View>

              {savedMeNuid ? (
                  <View style={[styles.savedBox, { borderColor: colors.border }]}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#16a34a" />

                    <View style={styles.savedBoxText}>
                      <Text style={[styles.savedBoxTitle, { color: colors.text }]}>
                        {t('settings.profileSavedTitle')}
                      </Text>
                      <Text style={[styles.savedBoxMeta, { color: colors.mutedText }]} numberOfLines={1}>
                        {savedMeNuid}
                      </Text>
                    </View>

                    <Pressable onPress={openSavedMeProfile} hitSlop={8}>
                      <Ionicons name="open-outline" size={19} color={colors.text} />
                    </Pressable>
                  </View>
              ) : null}

              {meNuidMessage ? (
                  <Text
                      style={[
                        styles.backendText,
                        {
                          color:
                              meNuidMessage.includes('gespeichert') ||
                              meNuidMessage.includes('entfernt') ||
                              meNuidMessage.includes('saved') ||
                              meNuidMessage.includes('removed')
                                  ? '#16a34a'
                                  : colors.destructive,
                        },
                      ]}
                  >
                    {meNuidMessage}
                  </Text>
              ) : null}
            </View>

            <View style={[styles.profileDivider, { backgroundColor: colors.border }]} />

            <View style={styles.profileSection}>
              <View style={styles.profileSectionHeader}>
                <View style={[styles.profileSectionIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="home-outline" size={17} color={colors.primary} />
                </View>

                <View style={styles.profileSectionTitleBlock}>
                  <Text style={[styles.profileSectionTitle, { color: colors.text }]}>{t('settings.club')}</Text>
                </View>
              </View>

              <TextInput
                  value={clubIdInput}
                  onChangeText={setClubIdInput}
                  placeholder={t('settings.clubIdPlaceholder')}
                  placeholderTextColor={colors.mutedText}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
              />

              <TextInput
                  value={clubNameInput}
                  onChangeText={setClubNameInput}
                  placeholder={t('settings.clubNamePlaceholder')}
                  placeholderTextColor={colors.mutedText}
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={[
                    styles.compactInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
              />

              <View style={styles.twoGrid}>
                <Button
                    variant="primary"
                    icon="save-outline"
                    loading={meClubLoading === 'save'}
                    onPress={handleSaveMeClub}
                    style={styles.halfButton}
                >
                  {t('common.save')}
                </Button>

                <Button
                    variant="outline"
                    icon="trash-outline"
                    loading={meClubLoading === 'clear'}
                    onPress={handleClearMeClub}
                    style={styles.halfButton}
                >
                  {t('common.remove')}
                </Button>
              </View>

              {savedMeClub ? (
                  <View style={[styles.savedBox, { borderColor: colors.border }]}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#16a34a" />

                    <View style={styles.savedBoxText}>
                      <Text style={[styles.savedBoxTitle, { color: colors.text }]}>
                        {t('settings.clubSavedTitle')}
                      </Text>
                      <Text style={[styles.savedBoxMeta, { color: colors.mutedText }]} numberOfLines={1}>
                        {getClubDisplayName(savedMeClub) || t('settings.clubSavedTitle')} · {formatClubId(savedMeClub)}
                      </Text>
                    </View>

                    <Pressable onPress={openSavedMeClub} hitSlop={8}>
                      <Ionicons name="open-outline" size={19} color={colors.text} />
                    </Pressable>
                  </View>
              ) : null}

              {meClubMessage ? (
                  <Text
                      style={[
                        styles.backendText,
                        {
                          color:
                              meClubMessage.includes('gespeichert') ||
                              meClubMessage.includes('entfernt') ||
                              meClubMessage.includes('saved') ||
                              meClubMessage.includes('removed')
                                  ? '#16a34a'
                                  : colors.destructive,
                        },
                      ]}
                  >
                    {meClubMessage}
                  </Text>
              ) : null}
            </View>
          </Card>

          {isAuthenticated ? (
              <>
                <Card style={styles.card}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="key-outline" size={21} color={colors.text} />
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      {t('settings.myttConnect')}
                    </Text>
                  </View>

                  <Text style={[styles.backendText, { color: colors.mutedText }]}>
                    {t('settings.myttConnectDescription')}
                  </Text>

                  <View style={styles.twoGrid}>
                    <Button
                        variant="primary"
                        icon="open-outline"
                        onPress={() => router.push('/mytt-connect')}
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
                            {
                              borderColor:
                                  myttStatus.hasSession && !myttStatus.expired
                                      ? '#16a34a'
                                      : colors.border,
                              backgroundColor: colors.primarySoft,
                            },
                          ]}
                      >
                        <View style={styles.statusHeader}>
                          <Ionicons
                              name={
                                myttStatus.hasSession && !myttStatus.expired
                                    ? 'checkmark-circle-outline'
                                    : myttStatus.expired
                                        ? 'warning-outline'
                                        : 'close-circle-outline'
                              }
                              size={20}
                              color={
                                myttStatus.hasSession && !myttStatus.expired
                                    ? '#16a34a'
                                    : myttStatus.expired
                                        ? '#ea580c'
                                        : colors.destructive
                              }
                          />

                          <Text
                              style={[
                                styles.statusTitle,
                                {
                                  color:
                                      myttStatus.hasSession && !myttStatus.expired
                                          ? '#16a34a'
                                          : myttStatus.expired
                                              ? '#ea580c'
                                              : colors.destructive,
                                },
                              ]}
                          >
                            {myttStatus.label}
                          </Text>
                        </View>

                        <Text style={[styles.backendText, { color: colors.mutedText }]}>
                          {myttStatus.detail}
                        </Text>
                      </View>
                  ) : null}

                  {myttMessage ? (
                      <Text style={[styles.backendText, { color: colors.destructive }]}>
                        {myttMessage}
                      </Text>
                  ) : null}
                </Card>

                <Card style={styles.card}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="share-social-outline" size={21} color={colors.text} />
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.grantsTitle')}</Text>
                  </View>

                  <Text style={[styles.backendText, { color: colors.mutedText }]}>
                    {t('settings.grantsDescription')}
                  </Text>

                  <TextInput
                      value={grantUsername}
                      onChangeText={setGrantUsername}
                      placeholder={t('settings.grantUsernamePlaceholder')}
                      placeholderTextColor={colors.mutedText}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={[
                        styles.input,
                        {
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                  />

                  {!canCreateGrant && grantUsername.length > 0 ? (
                      <Text style={[styles.backendText, { color: colors.mutedText }]}>
                        {t('settings.grantUsernameTooShort')}
                      </Text>
                  ) : null}

                  <View style={styles.twoGrid}>
                    <Button
                        variant="outline"
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
                        {grants.map((grant) => {
                          const title = grant.granteeUsername || t('settings.grantUnknownUser');

                          return (
                              <View
                                  key={grant.id}
                                  style={[
                                    styles.grantItem,
                                    {
                                      borderColor: colors.border,
                                    },
                                  ]}
                              >
                                <View style={styles.grantInfo}>
                                  <Text style={[styles.grantTitle, { color: colors.text }]}>
                                    {title}
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
                          );
                        })}
                      </View>
                  ) : (
                      <Text style={[styles.backendText, { color: colors.mutedText }]}>
                        {t('settings.grantsEmpty')}
                      </Text>
                  )}

                  {grantMessage ? (
                      <Text
                          style={[
                            styles.backendText,
                            {
                              color:
                                  grantMessage.includes('erstellt') ||
                                  grantMessage.includes('entfernt') ||
                                  grantMessage.includes('created') ||
                                  grantMessage.includes('removed')
                                      ? '#16a34a'
                                      : colors.destructive,
                            },
                          ]}
                      >
                        {grantMessage}
                      </Text>
                  ) : null}
                </Card>
              </>
          ) : null}

          <Card style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="server-outline" size={21} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.backend')}</Text>
            </View>

            <Text style={[styles.backendText, { color: colors.mutedText }]}>
              {getApiBaseUrl() || t('settings.apiBaseMissing')}
            </Text>

            <Button variant="outline" icon="pulse-outline" loading={checking} onPress={checkHealth}>
              {t('settings.checkHealth')}
            </Button>

            {health ? (
                <Text
                    style={[
                      styles.backendText,
                      {
                        color: health.includes('erreichbar') || health.includes('reachable') ? '#16a34a' : colors.destructive,
                      },
                    ]}
                >
                  {health}
                </Text>
            ) : null}
          </Card>

          <Card style={styles.versionCard}>
            <Text style={[styles.versionText, { color: colors.mutedText }]}>
              {t('settings.version')}
            </Text>
          </Card>
        </ScrollView>
      </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 112,
    gap: 16,
  },
  titleBlock: {
    gap: 4,
  },
  title: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
  },
  card: {
    padding: 16,
    gap: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  twoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  halfButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
  },
  backgroundPreview: {
    height: 148,
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  backgroundPreviewImage: {
    flex: 1,
  },
  backgroundPreviewOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  backgroundPreviewEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    padding: 16,
  },
  backgroundPreviewTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  backgroundPreviewMeta: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  accentPreview: {
    minHeight: 78,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accentPreviewTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  accentPreviewTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
  },
  accentPreviewMeta: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    opacity: 0.9,
  },
  contrastBadge: {
    minWidth: 68,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contrastBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },
  colorPickerBox: {
    alignItems: 'center',
    gap: 14,
  },
  colorPreview: {
    width: '100%',
    height: 34,
    borderRadius: 14,
    marginBottom: 12,
  },
  colorWheelRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  hueCircular: {
    width: 132,
    height: 132,
  },
  colorPanel: {
    width: 132,
    height: 132,
    borderRadius: 18,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  swatchButton: {
    width: 31,
    height: 31,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backendText: {
    fontSize: 13,
    lineHeight: 19,
  },
  statusBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  grantList: {
    gap: 10,
  },
  grantItem: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  grantInfo: {
    gap: 3,
  },
  grantTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  grantSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  versionCard: {
    padding: 22,
    alignItems: 'center',
    gap: 4,
  },
  versionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  versionSubtext: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  profileSection: {
    gap: 10,
  },
  profileSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileSectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSectionTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  profileSectionTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
  },
  profileSectionSubtitle: {
    marginTop: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  profileDivider: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.9,
  },
  compactInput: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    lineHeight: 20,
  },
  savedBox: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  savedBoxText: {
    flex: 1,
    minWidth: 0,
  },
  savedBoxTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },
  savedBoxMeta: {
    marginTop: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
});
