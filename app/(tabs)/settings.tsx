import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/src/components/Avatar';
import { ListGroup } from '@/src/components/ListGroup';
import { ListRow } from '@/src/components/ListRow';
import { PlayerPickerSheet } from '@/src/components/PlayerPickerSheet';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import type { SegmentOption } from '@/src/components/SegmentedTabs';
import { AppLanguage, languageOptions } from '@/src/i18n';
import { ThemeMode } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import {
  AccentSheet,
  AccountSheet,
  BackendSheet,
  BackgroundSheet,
  GrantsSheet,
  MeClubSheet,
  MyttConnectSheet,
  SettingSegment,
} from '../../src/features/settings/components';
import { useSettings } from '../../src/features/settings/hooks/useSettings';
import { styles } from '../../src/features/settings/styles';
import { formatClubId, getClubDisplayName } from '../../src/features/settings/utils';

type SheetId = 'mePlayer' | 'meClub' | 'account' | 'mytt' | 'grants' | 'accent' | 'background' | 'backend';

export default function SettingsScreen() {
  const settings = useSettings();
  const [sheet, setSheet] = useState<SheetId | null>(null);

  const {
    colors,
    mode,
    setMode,
    language,
    setLanguage,
    t,
    user,
    isAuthenticated,
    savedMeNuid,
    savedMeClub,
    apiBaseUrl,
    draftAccent,
    backgroundImageUri,
    handleSelectMePlayer,
    handleClearMeNuid,
    openSavedMeProfile,
  } = settings;

  const closeSheet = () => setSheet(null);

  const languageSegments = useMemo<SegmentOption<AppLanguage>[]>(
      () => languageOptions.map((option) => ({ value: option.value, label: t(option.labelKey) })),
      [t],
  );

  const themeSegments = useMemo<SegmentOption<ThemeMode>[]>(
      () => [
        { value: 'light', label: t('settings.themeLight'), icon: 'sunny-outline' },
        { value: 'dark', label: t('settings.themeDark'), icon: 'moon-outline' },
      ],
      [t],
  );

  const groupLabel = (label: string) => (
      <Text style={[typography.label, styles.groupLabel, { color: colors.mutedText }]}>{label.toUpperCase()}</Text>
  );

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ScreenHeader title={t('settings.title')} />

          <View style={styles.group}>
            {groupLabel(t('settings.groupProfile'))}

            <ListGroup>
              <ListRow
                  leading={<Avatar icon="person" />}
                  title={t('settings.meTitle')}
                  subtitle={savedMeNuid ? t('settings.nuidValue', { nuid: savedMeNuid }) : t('settings.notSet')}
                  onPress={() => setSheet('mePlayer')}
              />

              {savedMeNuid ? (
                  <ListRow
                      leading={<Ionicons name="open-outline" size={22} color={colors.primary} />}
                      title={t('settings.openProfile')}
                      onPress={openSavedMeProfile}
                  />
              ) : null}

              {savedMeNuid ? (
                  <ListRow
                      leading={<Ionicons name="close-circle-outline" size={22} color={colors.destructive} />}
                      title={t('settings.removeMe')}
                      destructive
                      chevron={false}
                      onPress={() => {
                        handleClearMeNuid().catch(() => undefined);
                      }}
                  />
              ) : null}

              <ListRow
                  leading={<Avatar icon="home" shape="square" />}
                  title={t('settings.myClub')}
                  subtitle={
                    savedMeClub
                        ? getClubDisplayName(savedMeClub) || formatClubId(savedMeClub)
                        : t('settings.notSet')
                  }
                  onPress={() => setSheet('meClub')}
              />
            </ListGroup>
          </View>

          <View style={styles.group}>
            {groupLabel(t('settings.account'))}

            <ListGroup>
              <ListRow
                  leading={<Ionicons name="person-circle-outline" size={26} color={colors.primary} />}
                  title={t('settings.account')}
                  subtitle={
                    isAuthenticated && user
                        ? t('settings.loggedInAs', { username: user.username })
                        : t('settings.notLoggedIn')
                  }
                  onPress={() => setSheet('account')}
              />

              {isAuthenticated ? (
                  <ListRow
                      leading={<Ionicons name="key-outline" size={24} color={colors.primary} />}
                      title={t('settings.myttConnect')}
                      onPress={() => setSheet('mytt')}
                  />
              ) : null}

              {isAuthenticated ? (
                  <ListRow
                      leading={<Ionicons name="share-social-outline" size={24} color={colors.primary} />}
                      title={t('settings.grantsTitle')}
                      onPress={() => setSheet('grants')}
                  />
              ) : null}
            </ListGroup>
          </View>

          <View style={styles.group}>
            {groupLabel(t('settings.groupAppearance'))}

            <ListGroup>
              <SettingSegment
                  title={t('settings.languageTitle')}
                  value={language}
                  onChange={(value) => {
                    setLanguage(value).catch(() => undefined);
                  }}
                  options={languageSegments}
              />

              <SettingSegment
                  title={t('settings.theme')}
                  value={mode}
                  onChange={(value) => {
                    setMode(value).catch(() => undefined);
                  }}
                  options={themeSegments}
              />

              <ListRow
                  leading={<View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: draftAccent }} />}
                  title={t('settings.accentColor')}
                  onPress={() => setSheet('accent')}
              />

              <ListRow
                  leading={<Ionicons name="image-outline" size={26} color={colors.primary} />}
                  title={t('settings.background')}
                  subtitle={
                    backgroundImageUri
                        ? t('settings.backgroundPreviewTitle')
                        : t('settings.backgroundPreviewDefaultTitle')
                  }
                  onPress={() => setSheet('background')}
              />
            </ListGroup>
          </View>

          <View style={styles.group}>
            {groupLabel(t('settings.groupSystem'))}

            <ListGroup>
              <ListRow
                  leading={<Ionicons name="server-outline" size={24} color={colors.primary} />}
                  title={t('settings.backend')}
                  subtitle={apiBaseUrl || t('settings.apiBaseMissing')}
                  onPress={() => setSheet('backend')}
              />
            </ListGroup>
          </View>

          <View style={styles.versionBox}>
            <Text style={[styles.versionText, { color: colors.mutedText }]}>{t('settings.version')}</Text>
          </View>
        </ScrollView>

        <PlayerPickerSheet
            visible={sheet === 'mePlayer'}
            title={t('picker.meTitle')}
            onClose={closeSheet}
            onSelect={(selection) => handleSelectMePlayer(selection.nuid)}
        />

        <MeClubSheet settings={settings} visible={sheet === 'meClub'} onClose={closeSheet} />
        <AccountSheet settings={settings} visible={sheet === 'account'} onClose={closeSheet} />
        <MyttConnectSheet settings={settings} visible={sheet === 'mytt'} onClose={closeSheet} />
        <GrantsSheet settings={settings} visible={sheet === 'grants'} onClose={closeSheet} />
        <AccentSheet settings={settings} visible={sheet === 'accent'} onClose={closeSheet} />
        <BackgroundSheet settings={settings} visible={sheet === 'background'} onClose={closeSheet} />
        <BackendSheet settings={settings} visible={sheet === 'backend'} onClose={closeSheet} />
      </Screen>
  );
}
