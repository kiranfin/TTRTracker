import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { createMyttGrant, getMyttGrants, getMyttStatus, revokeMyttGrant } from '@/src/api/mytt';
import { ttApi } from '@/src/api/tttracker';
import { useAuth } from '@/src/auth/AuthProvider';
import { useI18n } from '@/src/i18n/I18nProvider';
import { clearMeClub, getMeClub, setMeClub as saveMeClub } from '@/src/storage/meClub';
import type { MeClub } from '@/src/storage/meClub';
import { clearMePlayerNuid, getMePlayerNuid, setMePlayerNuid } from '@/src/storage/mePlayer';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { MyttGrant, MyttStatusView } from '../types';
import { DEFAULT_ACCENT, formatClubId, getClubDisplayName, normalizeGrants, normalizeHexColor, normalizeMyttStatus, parseClubIdInput } from '../utils';

export function useSettings() {
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

  return {
    colors,
    mode,
    setMode,
    backgroundImageUri,
    language,
    setLanguage,
    t,
    user,
    isAuthenticated,
    health,
    checking,
    username,
    setUsername,
    password,
    setPassword,
    authMessage,
    authLoading,
    myttStatus,
    myttMessage,
    myttLoading,
    grants,
    grantUsername,
    setGrantUsername,
    grantMessage,
    grantLoading,
    deletingGrantId,
    meNuidInput,
    setMeNuidInput,
    savedMeNuid,
    meNuidMessage,
    meNuidLoading,
    clubIdInput,
    setClubIdInput,
    clubNameInput,
    setClubNameInput,
    savedMeClub,
    meClubMessage,
    meClubLoading,
    backgroundMessage,
    backgroundLoading,
    draftAccent,
    handlePreviewAccent,
    handleApplyAccent,
    handleResetAccentPreview,
    handlePickBackgroundImage,
    handleClearBackgroundImage,
    checkHealth,
    handleLogin,
    handleRegister,
    handleLogout,
    handleCheckMyttStatus,
    handleLoadGrants,
    handleCreateGrant,
    handleRevokeGrant,
    handleSaveMeNuid,
    handleClearMeNuid,
    handleSaveMeClub,
    handleClearMeClub,
    openSavedMeClub,
    openSavedMeProfile,
    canSubmitAuth,
    canCreateGrant,
  };
}
