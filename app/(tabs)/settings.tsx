import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ImageBackground, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import ColorPicker, { HueCircular, Panel1, Preview } from 'reanimated-color-picker';
import { getApiBaseUrl } from '@/src/api/client';
import { Button } from '@/src/components/Button';
import { Card } from '@/src/components/Card';
import { Screen } from '@/src/components/Screen';
import { AppLanguage, languageOptions } from '@/src/i18n';
import { useSettings } from '../../src/features/settings/hooks/useSettings';
import { styles } from '../../src/features/settings/styles';
import { normalizeHexColor, getReadableTextColor, formatClubId, getClubDisplayName, accentSwatches } from '../../src/features/settings/utils';

export default function SettingsScreen() {
  const {
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
  } = useSettings();

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>
          </View>

          <Card style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="language-outline" size={21} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {t('settings.languageTitle')}
              </Text>
            </View>

            <Text style={[styles.backendText, { color: colors.mutedText }]}>
              {t('settings.languageDescription')}
            </Text>

            <View style={styles.twoGrid}>
              {languageOptions.map((option) => (
                  <Button
                      key={option.value}
                      variant={language === option.value ? 'primary' : 'outline'}
                      icon={option.value === 'de' ? 'flag-outline' : 'language-outline'}
                      onPress={() => setLanguage(option.value as AppLanguage)}
                      style={styles.halfButton}
                  >
                    {t(option.labelKey)}
                  </Button>
              ))}
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons
                  name={mode === 'dark' ? 'moon' : 'sunny-outline'}
                  size={21}
                  color={colors.text}
              />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.appearance')}</Text>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>{t('settings.theme')}</Text>

            <View style={styles.twoGrid}>
              <Button
                  variant={mode === 'light' ? 'primary' : 'outline'}
                  icon="sunny-outline"
                  onPress={() => setMode('light')}
                  style={styles.halfButton}
              >
                {t('settings.themeLight')}
              </Button>

              <Button
                  variant={mode === 'dark' ? 'primary' : 'outline'}
                  icon="moon-outline"
                  onPress={() => setMode('dark')}
                  style={styles.halfButton}
              >
                {t('settings.themeDark')}
              </Button>
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="color-palette-outline" size={21} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.accentColor')}</Text>
            </View>

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
                  <HueCircular
                      thumbSize={28}
                      sliderThickness={22}
                      style={styles.hueCircular}
                  />

                  <Panel1 style={styles.colorPanel} />
                </View>
              </ColorPicker>
            </View>

            <View style={styles.swatchGrid}>
              {accentSwatches.map((swatch) => {
                const normalizedSwatch = normalizeHexColor(swatch);
                const selected = normalizeHexColor(draftAccent) === normalizedSwatch;
                const swatchIconColor = getReadableTextColor(normalizedSwatch);

                return (
                    <Pressable
                        key={normalizedSwatch}
                        accessibilityRole="button"
                        accessibilityLabel={`${t('settings.accentColor')} ${normalizedSwatch}`}
                        onPress={() => handlePreviewAccent(normalizedSwatch)}
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
                          <Ionicons name="checkmark" size={17} color={swatchIconColor} />
                      ) : null}
                    </Pressable>
                );
              })}
            </View>

            <View style={styles.twoGrid}>
              <Button
                  variant="outline"
                  icon="refresh-outline"
                  onPress={handleResetAccentPreview}
                  style={styles.halfButton}
              >
                {t('settings.resetAccent')}
              </Button>

              <Button
                  variant="primary"
                  icon="checkmark-outline"
                  onPress={handleApplyAccent}
                  style={styles.halfButton}
              >
                {t('settings.applyAccent')}
              </Button>
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="image-outline" size={21} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.background')}</Text>
            </View>

            <View
                style={[
                  styles.backgroundPreview,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
            >
              {backgroundImageUri ? (
                  <ImageBackground
                      source={{ uri: backgroundImageUri }}
                      resizeMode="cover"
                      style={styles.backgroundPreviewImage}
                  >
                    <View
                        style={[
                          styles.backgroundPreviewOverlay,
                          {
                            backgroundColor:
                                mode === 'dark'
                                    ? 'rgba(2, 6, 23, 0.52)'
                                    : 'rgba(248, 250, 252, 0.48)',
                          },
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

            {backgroundMessage ? (
                <Text
                    style={[
                      styles.backendText,
                      {
                        color:
                            backgroundMessage.includes('gespeichert') ||
                            backgroundMessage.includes('Standard') ||
                            backgroundMessage.includes('Keine Änderung') ||
                            backgroundMessage.includes('saved') ||
                            backgroundMessage.includes('restored') ||
                            backgroundMessage.includes('No changes')
                                ? '#16a34a'
                                : colors.destructive,
                      },
                    ]}
                >
                  {backgroundMessage}
                </Text>
            ) : null}
          </Card>

          <Card style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="person-circle-outline" size={21} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.account')}</Text>
            </View>

            <Text style={[styles.backendText, { color: colors.mutedText }]}>
              {isAuthenticated && user
                  ? t('settings.loggedInAs', { username: user.username })
                  : t('settings.accountDescription')}
            </Text>

            {!isAuthenticated ? (
                <>
                  <TextInput
                      value={username}
                      onChangeText={setUsername}
                      placeholder={t('settings.usernamePlaceholder')}
                      placeholderTextColor={colors.mutedText}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={[
                        styles.input,
                        {
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                  />

                  <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder={t('settings.passwordPlaceholder')}
                      placeholderTextColor={colors.mutedText}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={[
                        styles.input,
                        {
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                  />

                  <View style={styles.twoGrid}>
                    <Button
                        variant="primary"
                        icon="log-in-outline"
                        loading={authLoading === 'login'}
                        onPress={handleLogin}
                        style={styles.halfButton}
                    >
                      {t('settings.login')}
                    </Button>

                    <Button
                        variant="outline"
                        icon="person-add-outline"
                        loading={authLoading === 'register'}
                        onPress={handleRegister}
                        style={styles.halfButton}
                    >
                      {t('settings.register')}
                    </Button>
                  </View>

                  {!canSubmitAuth ? (
                      <Text style={[styles.backendText, { color: colors.mutedText }]}>
                        {t('settings.authHint')}
                      </Text>
                  ) : null}
                </>
            ) : (
                <Button
                    variant="outline"
                    icon="log-out-outline"
                    loading={authLoading === 'logout'}
                    onPress={handleLogout}
                >
                  {t('settings.logout')}
                </Button>
            )}

            {authMessage ? (
                <Text
                    style={[
                      styles.backendText,
                      {
                        color:
                            authMessage.includes('Eingeloggt') ||
                            authMessage.includes('Registriert') ||
                            authMessage.includes('ausgeloggt') ||
                            authMessage.includes('Logged') ||
                            authMessage.includes('Registered')
                                ? '#16a34a'
                                : colors.destructive,
                      },
                    ]}
                >
                  {authMessage}
                </Text>
            ) : null}
          </Card>

          <Card style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="id-card-outline" size={21} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.localProfile')}</Text>
            </View>

            <Text style={[styles.backendText, { color: colors.mutedText }]}>
              {t('settings.localProfileDescription')}
            </Text>

            <View style={styles.profileSection}>
              <View style={styles.profileSectionHeader}>
                <View style={[styles.profileSectionIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="person-outline" size={17} color={colors.primary} />
                </View>

                <View style={styles.profileSectionTitleBlock}>
                  <Text style={[styles.profileSectionTitle, { color: colors.text }]}>{t('settings.player')}</Text>
                </View>
              </View>

              <TextInput
                  value={meNuidInput}
                  onChangeText={setMeNuidInput}
                  placeholder={t('settings.nuidPlaceholder')}
                  placeholderTextColor={colors.mutedText}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
              />

              <View style={styles.twoGrid}>
                <Button
                    variant="primary"
                    icon="save-outline"
                    loading={meNuidLoading === 'save'}
                    onPress={handleSaveMeNuid}
                    style={styles.halfButton}
                >
                  {t('common.save')}
                </Button>

                <Button
                    variant="outline"
                    icon="trash-outline"
                    loading={meNuidLoading === 'clear'}
                    onPress={handleClearMeNuid}
                    style={styles.halfButton}
                >
                  {t('common.remove')}
                </Button>
              </View>

              {savedMeNuid ? (
                  <View style={[styles.savedBox, { borderColor: colors.border }]}>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#16a34a" />

                    <View style={styles.savedBoxText}>
                      <Text style={[styles.savedBoxTitle, { color: colors.text }]}>
                        {t('settings.profileSavedTitle')}
                      </Text>
                      <Text style={[styles.savedBoxMeta, { color: colors.mutedText }]} numberOfLines={1}>
                        {savedMeNuid}
                      </Text>
                    </View>

                    <Pressable onPress={openSavedMeProfile} hitSlop={8}>
                      <Ionicons name="open-outline" size={19} color={colors.text} />
                    </Pressable>
                  </View>
              ) : null}

              {meNuidMessage ? (
                  <Text
                      style={[
                        styles.backendText,
                        {
                          color:
                              meNuidMessage.includes('gespeichert') ||
                              meNuidMessage.includes('entfernt') ||
                              meNuidMessage.includes('saved') ||
                              meNuidMessage.includes('removed')
                                  ? '#16a34a'
                                  : colors.destructive,
                        },
                      ]}
                  >
                    {meNuidMessage}
                  </Text>
              ) : null}
            </View>

            <View style={[styles.profileDivider, { backgroundColor: colors.border }]} />

            <View style={styles.profileSection}>
              <View style={styles.profileSectionHeader}>
                <View style={[styles.profileSectionIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="home-outline" size={17} color={colors.primary} />
                </View>

                <View style={styles.profileSectionTitleBlock}>
                  <Text style={[styles.profileSectionTitle, { color: colors.text }]}>{t('settings.club')}</Text>
                </View>
              </View>

              <TextInput
                  value={clubIdInput}
                  onChangeText={setClubIdInput}
                  placeholder={t('settings.clubIdPlaceholder')}
                  placeholderTextColor={colors.mutedText}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
              />

              <TextInput
                  value={clubNameInput}
                  onChangeText={setClubNameInput}
                  placeholder={t('settings.clubNamePlaceholder')}
                  placeholderTextColor={colors.mutedText}
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={[
                    styles.compactInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
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
                    <Ionicons name="checkmark-circle-outline" size={18} color="#16a34a" />

                    <View style={styles.savedBoxText}>
                      <Text style={[styles.savedBoxTitle, { color: colors.text }]}>
                        {t('settings.clubSavedTitle')}
                      </Text>
                      <Text style={[styles.savedBoxMeta, { color: colors.mutedText }]} numberOfLines={1}>
                        {getClubDisplayName(savedMeClub) || t('settings.clubSavedTitle')} · {formatClubId(savedMeClub)}
                      </Text>
                    </View>

                    <Pressable onPress={openSavedMeClub} hitSlop={8}>
                      <Ionicons name="open-outline" size={19} color={colors.text} />
                    </Pressable>
                  </View>
              ) : null}

              {meClubMessage ? (
                  <Text
                      style={[
                        styles.backendText,
                        {
                          color:
                              meClubMessage.includes('gespeichert') ||
                              meClubMessage.includes('entfernt') ||
                              meClubMessage.includes('saved') ||
                              meClubMessage.includes('removed')
                                  ? '#16a34a'
                                  : colors.destructive,
                        },
                      ]}
                  >
                    {meClubMessage}
                  </Text>
              ) : null}
            </View>
          </Card>

          {isAuthenticated ? (
              <>
                <Card style={styles.card}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="key-outline" size={21} color={colors.text} />
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      {t('settings.myttConnect')}
                    </Text>
                  </View>

                  <Text style={[styles.backendText, { color: colors.mutedText }]}>
                    {t('settings.myttConnectDescription')}
                  </Text>

                  <View style={styles.twoGrid}>
                    <Button
                        variant="primary"
                        icon="open-outline"
                        onPress={() => router.push('/mytt-connect')}
                        style={styles.halfButton}
                    >
                      {t('settings.connect')}
                    </Button>

                    <Button
                        variant="outline"
                        icon="refresh-outline"
                        loading={myttLoading === 'status'}
                        onPress={handleCheckMyttStatus}
                        style={styles.halfButton}
                    >
                      {t('settings.checkStatus')}
                    </Button>
                  </View>

                  {myttStatus ? (
                      <View
                          style={[
                            styles.statusBox,
                            {
                              borderColor:
                                  myttStatus.hasSession && !myttStatus.expired
                                      ? '#16a34a'
                                      : colors.border,
                              backgroundColor: colors.primarySoft,
                            },
                          ]}
                      >
                        <View style={styles.statusHeader}>
                          <Ionicons
                              name={
                                myttStatus.hasSession && !myttStatus.expired
                                    ? 'checkmark-circle-outline'
                                    : myttStatus.expired
                                        ? 'warning-outline'
                                        : 'close-circle-outline'
                              }
                              size={20}
                              color={
                                myttStatus.hasSession && !myttStatus.expired
                                    ? '#16a34a'
                                    : myttStatus.expired
                                        ? '#ea580c'
                                        : colors.destructive
                              }
                          />

                          <Text
                              style={[
                                styles.statusTitle,
                                {
                                  color:
                                      myttStatus.hasSession && !myttStatus.expired
                                          ? '#16a34a'
                                          : myttStatus.expired
                                              ? '#ea580c'
                                              : colors.destructive,
                                },
                              ]}
                          >
                            {myttStatus.label}
                          </Text>
                        </View>

                        <Text style={[styles.backendText, { color: colors.mutedText }]}>
                          {myttStatus.detail}
                        </Text>
                      </View>
                  ) : null}

                  {myttMessage ? (
                      <Text style={[styles.backendText, { color: colors.destructive }]}>
                        {myttMessage}
                      </Text>
                  ) : null}
                </Card>

                <Card style={styles.card}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="share-social-outline" size={21} color={colors.text} />
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.grantsTitle')}</Text>
                  </View>

                  <Text style={[styles.backendText, { color: colors.mutedText }]}>
                    {t('settings.grantsDescription')}
                  </Text>

                  <TextInput
                      value={grantUsername}
                      onChangeText={setGrantUsername}
                      placeholder={t('settings.grantUsernamePlaceholder')}
                      placeholderTextColor={colors.mutedText}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={[
                        styles.input,
                        {
                          color: colors.text,
                          borderColor: colors.border,
                        },
                      ]}
                  />

                  {!canCreateGrant && grantUsername.length > 0 ? (
                      <Text style={[styles.backendText, { color: colors.mutedText }]}>
                        {t('settings.grantUsernameTooShort')}
                      </Text>
                  ) : null}

                  <View style={styles.twoGrid}>
                    <Button
                        variant="outline"
                        icon="person-add-outline"
                        loading={grantLoading === 'create'}
                        onPress={handleCreateGrant}
                        style={styles.halfButton}
                    >
                      {t('settings.createGrant')}
                    </Button>

                    <Button
                        variant="outline"
                        icon="refresh-outline"
                        loading={grantLoading === 'load'}
                        onPress={handleLoadGrants}
                        style={styles.halfButton}
                    >
                      {t('settings.loadGrants')}
                    </Button>
                  </View>

                  {grants.length > 0 ? (
                      <View style={styles.grantList}>
                        {grants.map((grant) => {
                          const title = grant.granteeUsername || t('settings.grantUnknownUser');

                          return (
                              <View
                                  key={grant.id}
                                  style={[
                                    styles.grantItem,
                                    {
                                      borderColor: colors.border,
                                    },
                                  ]}
                              >
                                <View style={styles.grantInfo}>
                                  <Text style={[styles.grantTitle, { color: colors.text }]}>
                                    {title}
                                  </Text>

                                  <Text style={[styles.grantSubtitle, { color: colors.mutedText }]}>
                                    {t('settings.grantAccess')}
                                  </Text>
                                </View>

                                <Button
                                    variant="outline"
                                    icon="trash-outline"
                                    loading={deletingGrantId === grant.id}
                                    onPress={() => handleRevokeGrant(grant.id)}
                                >
                                  {t('common.remove')}
                                </Button>
                              </View>
                          );
                        })}
                      </View>
                  ) : (
                      <Text style={[styles.backendText, { color: colors.mutedText }]}>
                        {t('settings.grantsEmpty')}
                      </Text>
                  )}

                  {grantMessage ? (
                      <Text
                          style={[
                            styles.backendText,
                            {
                              color:
                                  grantMessage.includes('erstellt') ||
                                  grantMessage.includes('entfernt') ||
                                  grantMessage.includes('created') ||
                                  grantMessage.includes('removed')
                                      ? '#16a34a'
                                      : colors.destructive,
                            },
                          ]}
                      >
                        {grantMessage}
                      </Text>
                  ) : null}
                </Card>
              </>
          ) : null}

          <Card style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="server-outline" size={21} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t('settings.backend')}</Text>
            </View>

            <Text style={[styles.backendText, { color: colors.mutedText }]}>
              {getApiBaseUrl() || t('settings.apiBaseMissing')}
            </Text>

            <Button variant="outline" icon="pulse-outline" loading={checking} onPress={checkHealth}>
              {t('settings.checkHealth')}
            </Button>

            {health ? (
                <Text
                    style={[
                      styles.backendText,
                      {
                        color: health.includes('erreichbar') || health.includes('reachable') ? '#16a34a' : colors.destructive,
                      },
                    ]}
                >
                  {health}
                </Text>
            ) : null}
          </Card>

          <Card style={styles.versionCard}>
            <Text style={[styles.versionText, { color: colors.mutedText }]}>
              {t('settings.version')}
            </Text>
          </Card>
        </ScrollView>
      </Screen>
  );
}
