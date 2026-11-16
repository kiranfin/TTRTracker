import CookieManager from '@preeternal/react-native-cookie-manager';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { WebViewNavigation } from 'react-native-webview';

import { ApiError } from '@/src/api/client';
import { saveLocalMyttSession } from '@/src/api/myttData';
import { myttDirect } from '@/src/api/myttDirect';
import { useI18n } from '@/src/i18n/I18nProvider';
import { getMePlayerNuid } from '@/src/storage/mePlayer';
import { notifyMyttConnected } from '../utils/connectionEvents';
import { cleanupServerSession } from '../utils/sharing';
import { MYTT_BASE_URL, cookiesToHeader, getMyttPath, hasUnauthenticatedStatus, isAuthPath } from '../utils/login';

export type MyttConnectStatus = 'preparing' | 'login' | 'saving' | 'error';

export function useMyttConnect(returnTo?: string) {
  const { t } = useI18n();

  const [status, setStatus] = useState<MyttConnectStatus>('preparing');
  const [message, setMessage] = useState<string | null>(null);
  // Neuer Wert startet die WebView frisch (Retry).
  const [attempt, setAttempt] = useState(0);

  const handled = useRef(false);
  const sawLoginPage = useRef(false);
  const useWebKit = useMemo(() => Platform.OS === 'ios', []);

  // Jeder Connect beginnt mit einem frischen Login, sonst würde eine abgelaufene Session aus dem
  // WebView Cookie Speicher als Erfolg durchgehen.
  useEffect(() => {
    let active = true;

    handled.current = false;
    sawLoginPage.current = false;
    setMessage(null);
    setStatus('preparing');

    CookieManager.clearAll(useWebKit)
        .catch(() => undefined)
        .then(() => {
          if (active) setStatus('login');
        });

    return () => {
      active = false;
    };
  }, [attempt, useWebKit]);

  function finish() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace((returnTo || '/') as Parameters<typeof router.replace>[0]);
  }

  // Prüft den Cookie mit einem echten Aufruf für das Ich-Profil, damit ein Cookie ohne Anmeldung nicht als
  // Verbindung gespeichert wird. Ohne Ich-Profil gibt es nichts zum Prüfen, dann zählt der Cookie.
  async function assertLoggedIn(cookieHeader: string) {
    const meNuid = await getMePlayerNuid();

    if (!meNuid) return;

    try {
      const response = await myttDirect.getPlayerTtr(cookieHeader, meNuid);

      if (response.data.error) throw new ApiError('not logged in', 401, 'MYTT_AUTH_EXPIRED');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'MYTT_AUTH_EXPIRED') {
        throw new Error(t('mytt.notLoggedIn'));
      }

      // Andere Fehler (Netz, Störung bei myTischtennis) sagen nichts über die Anmeldung.
    }
  }

  async function completeLogin() {
    handled.current = true;
    setStatus('saving');

    try {
      const cookies = await CookieManager.get(MYTT_BASE_URL, useWebKit);
      const cookieHeader = cookiesToHeader(cookies as Parameters<typeof cookiesToHeader>[0]);

      if (cookieHeader.length < 5) {
        throw new Error(t('mytt.noCookies'));
      }

      await assertLoggedIn(cookieHeader);

      // Der Cookie bleibt auf dem Gerät. Der Server bekommt höchstens den geholten Stand, bei einer Freigabe.
      await saveLocalMyttSession(cookieHeader);
      cleanupServerSession().catch(() => undefined);

      notifyMyttConnected();
      finish();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('mytt.saveError'));
      setStatus('error');
    }
  }

  // Login erkannt: Login Seite gesehen und danach auf eine Seite außerhalb der Anmelde Seiten gewechselt.
  function onNavigationStateChange(state: WebViewNavigation) {
    if (handled.current || state.loading) return;

    const path = getMyttPath(state.url);

    if (path === null) return;

    if (isAuthPath(path) || hasUnauthenticatedStatus(state.url)) {
      sawLoginPage.current = true;
      return;
    }

    if (sawLoginPage.current) {
      completeLogin().catch(() => undefined);
    }
  }

  // Sicherheitsnetz, falls die automatische Erkennung den Login nicht bemerkt hat.
  function saveNow() {
    if (handled.current) return;

    completeLogin().catch(() => undefined);
  }

  function retry() {
    setAttempt((current) => current + 1);
  }

  return { status, message, attempt, onNavigationStateChange, saveNow, retry };
}
