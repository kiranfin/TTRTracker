import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { resetDebugStats, useDebugStats } from '@/src/api/debugStats';
import { getDevicePausedUntil } from '@/src/api/devicePause';
import { getApiCacheStats, getApiPausedUntil } from '@/src/api/responseCache';
import { BottomSheet } from '@/src/components/BottomSheet';
import { Button } from '@/src/components/Button';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useTheme } from '@/src/theme/ThemeProvider';
import { font, typography } from '@/src/theme/typography';
import type { SettingsController } from '../hooks/useSettings';
import { styles } from '../styles';

type SheetProps = {
  settings: SettingsController;
  visible: boolean;
  onClose: () => void;
};

// Relay ist an, solange er nicht ausdrücklich abgeschaltet wurde (wie in relay.ts, der Wert wird beim Build eingesetzt).
const RELAY_ENABLED = process.env.EXPO_PUBLIC_RELAY_ENABLED !== 'false';

function Line({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();

  return (
      <View style={styles.debugLine}>
        <Text style={[typography.meta, styles.debugLabel, { color: colors.mutedText }]}>{label}</Text>
        <Text style={[typography.meta, styles.debugValue, { color: colors.text, ...font('600') }]}>{value}</Text>
      </View>
  );
}

// Debug Infos: das Kontingent dieses Geräts, Zähler der Sitzung, letzte Abrufe, Zwischenspeicher, Live Abfragen und System.
export function DebugSheet({ settings, visible, onClose }: SheetProps) {
  const { colors } = useTheme();
  const { t, language, apiTarget, apiBaseUrl, health, healthOk, checking, checkHealth } = settings;
  const stats = useDebugStats();
  const [cache, setCache] = useState<{ entries: number; oldestSavedAt: number | null } | null>(null);
  // Erhöht sich beim Aktualisieren, damit die Pausen (kein Store) neu gelesen werden
  const [, setTick] = useState(0);

  const locale = language === 'en' ? 'en-GB' : 'de-DE';
  const time = (ms: number) => new Date(ms).toLocaleTimeString(locale);
  const dateTime = (ms: number) => new Date(ms).toLocaleString(locale);

  const refresh = useCallback(() => {
    setTick((value) => value + 1);
    getApiCacheStats().then(setCache).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (visible) refresh();
  }, [visible, refresh]);

  const now = Date.now();
  const devicePausedUntil = getDevicePausedUntil();
  const apiPausedUntil = getApiPausedUntil();
  const pauseText = (until: number) => (until > now ? time(until) : t('settings.debugNoPause'));
  const onOff = (value: boolean) => (value ? t('settings.debugOn') : t('settings.debugOff'));
  const quota = stats.quota;
  const liveEntries = Object.entries(stats.live);

  return (
      <BottomSheet visible={visible} title={t('settings.debugInfo')} onClose={onClose}>
        <View style={styles.sheetBody}>
          <SectionHeader variant="label" title={t('settings.debugQuota')} />
          <Line label={t('settings.debugQuotaRemaining')} value={quota ? String(quota.remaining) : t('settings.debugUnknown')} />
          {quota?.resetSeconds !== undefined ? (
              <Line label={t('settings.debugQuotaReset')} value={`${quota.resetSeconds} s`} />
          ) : null}
          {quota ? <Line label={t('settings.debugQuotaUpdated')} value={time(quota.at)} /> : null}
          {quota ? <Line label={t('settings.debugQuotaHeader')} value={quota.raw} /> : null}
          <Text style={[styles.backendText, { color: colors.mutedText }]}>{t('settings.debugQuotaHint')}</Text>

          <SectionHeader variant="label" title={t('settings.debugPause')} />
          <Line label={t('settings.debugPauseDevice')} value={pauseText(devicePausedUntil)} />
          <Line label={t('settings.debugPauseBackend')} value={pauseText(apiPausedUntil)} />

          <SectionHeader variant="label" title={t('settings.debugSession')} />
          <Line label={t('settings.debugBackendRequests')} value={String(stats.backendRequests)} />
          <Line label={t('settings.debugCacheFresh')} value={String(stats.cacheFresh)} />
          <Line label={t('settings.debugCacheStale')} value={String(stats.cacheStale)} />
          <Line label={t('settings.debugCacheLoads')} value={String(stats.cacheLoads)} />
          <Line label={t('settings.debugDeviceRequests')} value={String(stats.deviceRequests)} />

          <SectionHeader variant="label" title={t('settings.debugRecent')} />
          {stats.calls.length === 0 ? (
              <Text style={[styles.backendText, { color: colors.mutedText }]}>{t('settings.debugRecentEmpty')}</Text>
          ) : (
              stats.calls.map((call, index) => (
                  <Text
                      key={`${call.at}-${index}`}
                      style={[styles.backendText, { color: call.status === 'ERR' || Number(call.status) >= 400 ? colors.destructive : colors.text }]}
                  >
                    {`${time(call.at)}  ${call.source === 'device' ? 'myTT' : 'API'}  ${call.method} ${call.path}  ${call.status}  ${call.durationMs} ms`}
                  </Text>
              ))
          )}

          <SectionHeader variant="label" title={t('settings.debugCache')} />
          <Line label={t('settings.debugCacheEntries')} value={cache ? String(cache.entries) : '–'} />
          <Line label={t('settings.debugCacheOldest')} value={cache?.oldestSavedAt ? dateTime(cache.oldestSavedAt) : '–'} />

          <SectionHeader variant="label" title={t('settings.debugLive')} />
          {liveEntries.length === 0 ? (
              <Text style={[styles.backendText, { color: colors.mutedText }]}>{t('settings.debugLiveEmpty')}</Text>
          ) : (
              liveEntries.map(([id, activity]) => (
                  <Line key={id} label={id} value={t('settings.debugLiveLine', { count: activity.count, time: time(activity.lastAt) })} />
              ))
          )}

          <SectionHeader variant="label" title={t('settings.debugSystem')} />
          <Line label={t('settings.versionLabel')} value={Constants.expoConfig?.version ?? '–'} />
          <Line label={t('settings.debugPlatform')} value={`${Platform.OS} ${String(Platform.Version)}`} />
          <Line label={t('settings.debugApiTarget')} value={apiTarget} />
          <Line label={t('settings.debugBaseUrl')} value={apiBaseUrl || '–'} />
          <Line label={t('settings.debugRelay')} value={onOff(RELAY_ENABLED)} />
          <Line label={t('settings.debugDevBuild')} value={__DEV__ ? t('settings.debugYes') : t('settings.debugNo')} />
          <Line
              label={t('settings.debugBackendHealth')}
              value={checking ? t('settings.checkingStatus') : (health ?? (healthOk === null ? '–' : String(healthOk)))}
          />
          <Line label={t('settings.debugLanguage')} value={language} />

          <Button
              variant="outline"
              icon="refresh-outline"
              loading={checking}
              onPress={() => {
                refresh();
                checkHealth().catch(() => undefined);
              }}
          >
            {t('settings.debugRefresh')}
          </Button>

          <Button
              variant="outline"
              icon="trash-outline"
              onPress={() => {
                resetDebugStats();
                refresh();
              }}
          >
            {t('settings.debugReset')}
          </Button>
        </View>
      </BottomSheet>
  );
}
