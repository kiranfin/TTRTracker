import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ColorPicker, { HueCircular, Panel1, Preview } from 'reanimated-color-picker';
import { BottomSheet } from '@/src/components/BottomSheet';
import { Button } from '@/src/components/Button';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { SettingsController } from '../hooks/useSettings';
import { styles } from '../styles';
import { accentSwatches, getReadableTextColor, normalizeHexColor } from '../utils';

type SheetProps = {
  settings: SettingsController;
  visible: boolean;
  onClose: () => void;
};

export function AccentSheet({ settings, visible, onClose }: SheetProps) {
  const { colors } = useTheme();
  const { t, draftAccent, handlePreviewAccent, handleApplyAccent, handleResetAccentPreview } = settings;

  return (
      <BottomSheet visible={visible} title={t('settings.accentColor')} onClose={onClose}>
        {/* Modals brauchen auf Android eine eigene Gesten-Wurzel, sonst reagiert der Picker nicht. */}
        <GestureHandlerRootView>
          <View style={styles.sheetBody}>
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
                  <HueCircular thumbSize={28} sliderThickness={22} style={styles.hueCircular} />
                  <Panel1 style={styles.colorPanel} />
                </View>
              </ColorPicker>
            </View>

            <View style={styles.swatchGrid}>
              {accentSwatches.map((swatch) => {
                const normalizedSwatch = normalizeHexColor(swatch);
                const selected = normalizeHexColor(draftAccent) === normalizedSwatch;

                return (
                    <Pressable
                        key={normalizedSwatch}
                        accessibilityRole="button"
                        accessibilityLabel={`${t('settings.accentColor')} ${normalizedSwatch}`}
                        onPress={() => handlePreviewAccent(normalizedSwatch)}
                        hitSlop={8}
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
                          <Ionicons name="checkmark" size={17} color={getReadableTextColor(normalizedSwatch)} />
                      ) : null}
                    </Pressable>
                );
              })}
            </View>

            <View style={styles.twoGrid}>
              <Button variant="outline" icon="refresh-outline" onPress={handleResetAccentPreview} style={styles.halfButton}>
                {t('settings.resetAccent')}
              </Button>

              <Button
                  variant="primary"
                  icon="checkmark-outline"
                  onPress={() => {
                    handleApplyAccent();
                    onClose();
                  }}
                  style={styles.halfButton}
              >
                {t('settings.applyAccent')}
              </Button>
            </View>
          </View>
        </GestureHandlerRootView>
      </BottomSheet>
  );
}
