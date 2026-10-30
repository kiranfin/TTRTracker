import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { canSwitchApiTarget, type ApiTarget } from '@/src/api/apiTarget';
import { BottomSheet } from '@/src/components/BottomSheet';
import { Button } from '@/src/components/Button';
import { SegmentedTabs, type SegmentOption } from '@/src/components/SegmentedTabs';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { SettingsController } from '../hooks/useSettings';
import { styles } from '../styles';
import { MessageText } from './MessageText';

type SheetProps = {
  settings: SettingsController;
  visible: boolean;
  onClose: () => void;
};

export function BackendSheet({ settings, visible, onClose }: SheetProps) {
  const { colors } = useTheme();
  const {
    t,
    apiTarget,
    apiBaseUrl,
    health,
    checking,
    handleChangeApiTarget,
    checkHealth,
    cacheMessage,
    handleClearCache,
  } = settings;

  const apiTargetOptions = useMemo<SegmentOption<ApiTarget>[]>(
      () => [
        { value: 'server', label: t('settings.apiTargetServer'), icon: 'cloud-outline' },
        { value: 'local', label: t('settings.apiTargetLocal'), icon: 'desktop-outline' },
      ],
      [t],
  );

  return (
      <BottomSheet visible={visible} title={t('settings.backend')} onClose={onClose}>
        <View style={styles.sheetBody}>
          {/* Der Umschalter existiert nur im Dev Build (__DEV__) */}
          {canSwitchApiTarget ? (
              <>
                <Text style={[styles.backendText, { color: colors.mutedText }]}>{t('settings.apiTargetDescription')}</Text>

                <SegmentedTabs
                    value={apiTarget}
                    onChange={(target) => {
                      handleChangeApiTarget(target).catch(() => undefined);
                    }}
                    options={apiTargetOptions}
                />
              </>
          ) : null}

          <Text style={[styles.backendText, { color: colors.mutedText }]}>
            {apiBaseUrl || (apiTarget === 'local' ? t('settings.apiTargetLocalMissing') : t('settings.apiBaseMissing'))}
          </Text>

          <Button variant="outline" icon="pulse-outline" loading={checking} onPress={checkHealth}>
            {t('settings.checkHealth')}
          </Button>

          <MessageText message={health} tone={health === t('settings.backendReachable') ? 'positive' : 'negative'} />

          <Text style={[styles.backendText, { color: colors.mutedText }]}>{t('settings.clearCacheDescription')}</Text>

          <Button
              variant="outline"
              icon="trash-outline"
              onPress={() => {
                handleClearCache().catch(() => undefined);
              }}
          >
            {t('settings.clearCache')}
          </Button>

          <MessageText message={cacheMessage} tone="positive" />
        </View>
      </BottomSheet>
  );
}
