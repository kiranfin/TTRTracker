import { Ionicons } from '@expo/vector-icons';
import { ImageBackground, Text, View } from 'react-native';
import { BottomSheet } from '@/src/components/BottomSheet';
import { Button } from '@/src/components/Button';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { SettingsController } from '../hooks/useSettings';
import { styles } from '../styles';
import { MessageText } from './MessageText';

type SheetProps = {
  settings: SettingsController;
  visible: boolean;
  onClose: () => void;
};

export function BackgroundSheet({ settings, visible, onClose }: SheetProps) {
  const { colors, isDark } = useTheme();
  const {
    t,
    backgroundImageUri,
    backgroundMessage,
    backgroundLoading,
    handlePickBackgroundImage,
    handleClearBackgroundImage,
  } = settings;

  return (
      <BottomSheet visible={visible} title={t('settings.background')} onClose={onClose}>
        <View style={styles.sheetBody}>
          <View style={[styles.backgroundPreview, { borderColor: colors.border, backgroundColor: colors.background }]}>
            {backgroundImageUri ? (
                <ImageBackground source={{ uri: backgroundImageUri }} resizeMode="cover" style={styles.backgroundPreviewImage}>
                  <View
                      style={[
                        styles.backgroundPreviewOverlay,
                        { backgroundColor: isDark ? 'rgba(2, 6, 23, 0.52)' : 'rgba(248, 250, 252, 0.48)' },
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

          <MessageText message={backgroundMessage} />
        </View>
      </BottomSheet>
  );
}
