import CookieManager from '@preeternal/react-native-cookie-manager';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { WebViewNavigation } from 'react-native-webview';

import { saveMyttCookie } from '@/src/api/mytt';
import { useI18n } from '@/src/i18n/I18nProvider';
import { notifyMyttConnected } from '../utils/connectionEvents';
import { MYTT_BASE_URL, cookiesToHeader, getMyttPath, isAuthPath } from '../utils/login';

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

  async function completeLogin() {
    handled.current = true;
    setStatus('saving');

    try {
      const cookies = await CookieManager.get(MYTT_BASE_URL, useWebKit);
      const cookieHeader = cookiesToHeader(cookies as Parameters<typeof cookiesToHeader>[0]);

      if (cookieHeader.length < 5) {
        throw new Error(t('mytt.noCookies'));
      }

      await saveMyttCookie(cookieHeader);

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

    if (isAuthPath(path)) {
      sawLoginPage.current = true;
      return;
    }

    if (sawLoginPage.current) {
      completeLogin().catch(() => undefined);
    }
  }

  function retry() {
    setAttempt((current) => current + 1);
  }

  return { status, message, attempt, onNavigationStateChange, retry };
}
