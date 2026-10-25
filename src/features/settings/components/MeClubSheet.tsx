import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { BottomSheet } from '@/src/components/BottomSheet';
import { Button } from '@/src/components/Button';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { SettingsController } from '../hooks/useSettings';
import { styles } from '../styles';
import { formatClubId, getClubDisplayName } from '../utils';
import { MessageText } from './MessageText';
import { SettingsInput } from './SettingsInput';

type SheetProps = {
  settings: SettingsController;
  visible: boolean;
  onClose: () => void;
};

export function MeClubSheet({ settings, visible, onClose }: SheetProps) {
  const { colors } = useTheme();
  const {
    t,
    clubIdInput,
    setClubIdInput,
    clubNameInput,
    setClubNameInput,
    savedMeClub,
    meClubMessage,
    meClubLoading,
    handleSaveMeClub,
    handleClearMeClub,
    openSavedMeClub,
  } = settings;

  return (
      <BottomSheet visible={visible} title={t('settings.myClub')} onClose={onClose}>
        <View style={styles.sheetBody}>
          <SettingsInput
              value={clubIdInput}
              onChangeText={setClubIdInput}
              placeholder={t('settings.clubIdPlaceholder')}
              autoCapitalize="characters"
          />

          <SettingsInput
              value={clubNameInput}
              onChangeText={setClubNameInput}
              placeholder={t('settings.clubNamePlaceholder')}
              autoCapitalize="words"
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
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.positive} />

                <View style={styles.savedBoxText}>
                  <Text style={[styles.savedBoxTitle, { color: colors.text }]}>{t('settings.clubSavedTitle')}</Text>
                  <Text style={[styles.savedBoxMeta, { color: colors.mutedText }]} numberOfLines={1}>
                    {getClubDisplayName(savedMeClub) || t('settings.clubSavedTitle')} · {formatClubId(savedMeClub)}
                  </Text>
                </View>

                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('settings.openClub')}
                    onPress={() => {
                      onClose();
                      openSavedMeClub();
                    }}
                    hitSlop={12}
                >
                  <Ionicons name="open-outline" size={20} color={colors.text} />
                </Pressable>
              </View>
          ) : null}

          <MessageText message={meClubMessage} />
        </View>
      </BottomSheet>
  );
}
