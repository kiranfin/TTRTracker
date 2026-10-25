import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/src/components/Avatar';
import { BottomSheet } from '@/src/components/BottomSheet';
import { ListGroup } from '@/src/components/ListGroup';
import { ListRow } from '@/src/components/ListRow';
import { PlayerPickerSheet } from '@/src/components/PlayerPickerSheet';
import { Screen } from '@/src/components/Screen';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { SectionHeader } from '@/src/components/SectionHeader';
import { SegmentedTabs } from '@/src/components/SegmentedTabs';
import { languageOptions } from '@/src/i18n';
import { ThemeMode, useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import {
  AccentSheet,
  AccountSheet,
  BackendSheet,
  BackgroundSheet,
  GrantsSheet,
  MeClubSheet,
  MyttConnectSheet,
} from '../../src/features/settings/components';
import { useSettings } from '../../src/features/settings/hooks/useSettings';
import { styles } from '../../src/features/settings/styles';
import { getClubDisplayName } from '../../src/features/settings/utils';

type SheetId = 'mePlayer' | 'meClub' | 'account' | 'mytt' | 'grants' | 'accent' | 'background' | 'backend' | 'language';

// Gleiche Vorschläge wie im Design; eigene Farben gibt es weiter im Akzent-Sheet.
const ACCENT_PRESETS = [
  { hex: '#2563eb', labelKey: 'settings.accentBlue' },
  { hex: '#0f766e', labelKey: 'settings.accentTeal' },
  { hex: '#7c3aed', labelKey: 'settings.accentViolet' },
  { hex: '#ea580c', labelKey: 'settings.accentOrange' },
] as const;

function IconTile({ icon }: { icon: keyof typeof Ionicons.glyphMap }) {
  const { colors } = useTheme();

  return (
      <View style={[styles.iconTile, { backgroundColor: colors.soft }]}>
        <Ionicons name={icon} size={18} color={colors.text} />
      </View>
  );
}

function StatusValue({ label, tone }: { label: string; tone: 'ok' | 'off' | 'neutral' }) {
  const { colors } = useTheme();
  const dotColor = tone === 'ok' ? colors.positive : tone === 'off' ? colors.negative : colors.mutedText;

  return (
      <View style={styles.statusValue}>
        <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
        <Text style={[typography.meta, styles.rowValue, { color: colors.mutedText }]}>{label}</Text>
      </View>
  );
}

function RowValue({ children }: { children: string }) {
  const { colors } = useTheme();

  return (
      <Text style={[typography.meta, styles.rowValue, { color: colors.mutedText }]} numberOfLines={1}>
        {children}
      </Text>
  );
}

export default function SettingsScreen() {
  const settings = useSettings();
  const { accent, setAccent } = useTheme();
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
    healthOk,
    checking,
    myttStatus,
    grants,
    savedMeNuid,
    savedMeName,
    savedMeClub,
    backgroundImageUri,
    authLoading,
    handleLogout,
    handleSelectMePlayer,
    handleClearMeNuid,
    openSavedMeProfile,
  } = settings;

  const closeSheet = () => setSheet(null);
  const version = Constants.expoConfig?.version ?? '';
  const clubName = savedMeClub ? getClubDisplayName(savedMeClub) : '';
  const languageLabel = t(languageOptions.find((option) => option.value === language)?.labelKey ?? 'settings.german');
  const myttConnected = Boolean(myttStatus?.hasSession && !myttStatus.expired);

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
    { value: 'system', label: t('settings.themeSystem') },
  ];

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ScreenHeader title={t('settings.title')} />

          <Pressable
              accessibilityRole="button"
              onPress={savedMeNuid ? openSavedMeProfile : () => setSheet('mePlayer')}
              style={({ pressed }) => [
                styles.profileCard,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
              ]}
          >
            {savedMeNuid ? (
                <Avatar name={savedMeName} size={52} tone="accent" />
            ) : (
                <Avatar icon="person-add-outline" size={52} tone="accent" />
            )}

            <View style={styles.profileText}>
              <Text style={[typography.section, { color: colors.text }]} numberOfLines={1}>
                {savedMeNuid ? savedMeName ?? t('settings.meFallbackName') : t('settings.meNotSetTitle')}
              </Text>
              <Text style={[typography.meta, { color: colors.mutedText }]} numberOfLines={1}>
                {savedMeNuid
                    ? clubName
                        ? t('settings.meSubtitleWithClub', { club: clubName })
                        : t('settings.meSubtitle')
                    : t('settings.meNotSetSubtitle')}
              </Text>
            </View>

            <Pressable
                accessibilityRole="button"
                onPress={() => setSheet('mePlayer')}
                style={({ pressed }) => [styles.changePill, { backgroundColor: colors.soft, opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[typography.metaStrong, { color: colors.text }]}>
                {savedMeNuid ? t('settings.change') : t('settings.setUp')}
              </Text>
            </Pressable>
          </Pressable>

          <ListGroup>
            <ListRow
                leading={<IconTile icon="business-outline" />}
                title={t('settings.myClub')}
                trailing={<RowValue>{clubName || t('settings.notSet')}</RowValue>}
                onPress={() => setSheet('meClub')}
            />
          </ListGroup>

          <View style={styles.group}>
            <SectionHeader variant="label" title={t('settings.account')} />
            <ListGroup>
              <ListRow
                  leading={<IconTile icon="person-outline" />}
                  title={isAuthenticated ? t('settings.signedIn') : t('settings.signIn')}
                  trailing={<RowValue>{isAuthenticated && user ? user.username : t('settings.notLoggedIn')}</RowValue>}
                  onPress={() => setSheet('account')}
              />
              {isAuthenticated ? (
                  <ListRow
                      leading={<IconTile icon="link-outline" />}
                      title="myTischtennis"
                      trailing={
                        <StatusValue
                            label={myttConnected ? t('settings.connected') : t('settings.notConnected')}
                            tone={myttStatus ? (myttConnected ? 'ok' : 'off') : 'neutral'}
                        />
                      }
                      onPress={() => setSheet('mytt')}
                  />
              ) : null}
              {isAuthenticated ? (
                  <ListRow
                      leading={<IconTile icon="people-outline" />}
                      title={t('settings.grantsRow')}
                      trailing={
                        <RowValue>
                          {grants.length > 0 ? t('settings.grantsCount', { count: grants.length }) : t('settings.grantsNone')}
                        </RowValue>
                      }
                      onPress={() => setSheet('grants')}
                  />
              ) : null}
            </ListGroup>
          </View>

          <View style={styles.group}>
            <SectionHeader variant="label" title={t('settings.groupAppearance')} />
            <ListGroup>
              <View style={styles.inlineRow}>
                <IconTile icon="moon-outline" />
                <Text style={[typography.body, styles.inlineTitle, { color: colors.text }]}>{t('settings.theme')}</Text>
                <View style={styles.inlineSegment}>
                  <SegmentedTabs
                      compact
                      value={mode}
                      onChange={(value) => {
                        setMode(value).catch(() => undefined);
                      }}
                      options={themeOptions}
                  />
                </View>
              </View>

              <View style={styles.inlineRow}>
                <IconTile icon="color-palette-outline" />
                <Text style={[typography.body, styles.inlineTitle, { color: colors.text }]}>{t('settings.accentColor')}</Text>
                <View style={styles.swatchRow}>
                  {ACCENT_PRESETS.map((preset) => {
                    const active = accent.toLowerCase() === preset.hex;

                    return (
                        <Pressable
                            key={preset.hex}
                            accessibilityRole="button"
                            accessibilityLabel={t(preset.labelKey)}
                            accessibilityState={{ selected: active }}
                            onPress={() => {
                              setAccent(preset.hex).catch(() => undefined);
                            }}
                            style={[
                              styles.swatch,
                              { backgroundColor: preset.hex },
                              active && { borderColor: colors.text, borderWidth: 2 },
                            ]}
                        />
                    );
                  })}
                  <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('settings.accentCustom')}
                      onPress={() => setSheet('accent')}
                      style={[styles.swatch, styles.swatchCustom, { borderColor: colors.border }]}
                  >
                    <Ionicons name="add" size={16} color={colors.mutedText} />
                  </Pressable>
                </View>
              </View>

              <ListRow
                  leading={<IconTile icon="globe-outline" />}
                  title={t('settings.languageTitle')}
                  trailing={<RowValue>{languageLabel}</RowValue>}
                  onPress={() => setSheet('language')}
              />

              <ListRow
                  leading={<IconTile icon="image-outline" />}
                  title={t('settings.backgroundRow')}
                  trailing={<RowValue>{backgroundImageUri ? t('settings.backgroundCustom') : t('settings.backgroundNone')}</RowValue>}
                  onPress={() => setSheet('background')}
              />
            </ListGroup>
          </View>

          <View style={styles.group}>
            <SectionHeader variant="label" title={t('settings.groupSystem')} />
            <ListGroup>
              <ListRow
                  leading={<IconTile icon="server-outline" />}
                  title={t('settings.server')}
                  trailing={
                    <StatusValue
                        label={checking ? t('settings.checkingStatus') : healthOk ? t('settings.online') : healthOk === false ? t('settings.offline') : '–'}
                        tone={checking || healthOk === null ? 'neutral' : healthOk ? 'ok' : 'off'}
                    />
                  }
                  onPress={() => setSheet('backend')}
              />
              <ListRow
                  leading={<IconTile icon="information-circle-outline" />}
                  title={t('settings.versionLabel')}
                  trailing={<RowValue>{version}</RowValue>}
              />
            </ListGroup>
          </View>

          {isAuthenticated ? (
              <Pressable
                  accessibilityRole="button"
                  disabled={authLoading === 'logout'}
                  onPress={() => {
                    handleLogout().catch(() => undefined);
                  }}
                  style={({ pressed }) => [
                    styles.logoutButton,
                    { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed || authLoading === 'logout' ? 0.6 : 1 },
                  ]}
              >
                <Text style={[typography.bodyStrong, { color: colors.negative }]}>{t('settings.logout')}</Text>
              </Pressable>
          ) : null}
        </ScrollView>

        <PlayerPickerSheet
            visible={sheet === 'mePlayer'}
            title={t('picker.meTitle')}
            onClose={closeSheet}
            onSelect={(selection) => handleSelectMePlayer(selection.nuid, selection.name)}
            clearLabel={savedMeNuid ? t('settings.removeMe') : undefined}
            onClear={savedMeNuid ? handleClearMeNuid : undefined}
        />

        <BottomSheet visible={sheet === 'language'} title={t('settings.languageTitle')} onClose={closeSheet}>
          <ListGroup>
            {languageOptions.map((option) => (
                <ListRow
                    key={option.value}
                    title={t(option.labelKey)}
                    chevron={false}
                    trailing={language === option.value ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : undefined}
                    onPress={() => {
                      setLanguage(option.value).catch(() => undefined);
                      closeSheet();
                    }}
                />
            ))}
          </ListGroup>
        </BottomSheet>

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
