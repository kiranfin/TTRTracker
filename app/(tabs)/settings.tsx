import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getApiBaseUrl } from '../../src/api/client';
import {
  createMyttGrant,
  getMyttGrants,
  getMyttStatus,
  revokeMyttGrant,
} from '../../src/api/mytt';
import { ttApi } from '../../src/api/tttracker';
import { useAuth } from '../../src/auth/AuthProvider';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { AccentColor, useTheme } from '../../src/theme/ThemeProvider';

const accentColors: { id: AccentColor; name: string; color: string }[] = [
  { id: 'default', name: 'Weiß', color: '#f3f4f6' },
  { id: 'blue', name: 'Blau', color: '#2563eb' },
  { id: 'green', name: 'Grün', color: '#16a34a' },
  { id: 'orange', name: 'Orange', color: '#ea580c' },
  { id: 'pink', name: 'Pink', color: '#db2777' },
];

type MyttStatusView = {
  hasSession: boolean;
  expired: boolean;
  label: string;
  detail: string;
};

type MyttGrant = {
  id: string;
  granteeUserId?: string;
  granteeUsername?: string;
  scopes?: string[];
  createdAt?: string;
  expiresAt?: string | null;
};

function unwrapData(value: unknown): unknown {
  if (!value || typeof value !== 'object') {
    return value;
  }

  const object = value as Record<string, unknown>;

  if ('data' in object) {
    return object.data;
  }

  return value;
}

function normalizeMyttStatus(response: unknown): MyttStatusView {
  const data = unwrapData(response);

  if (!data || typeof data !== 'object') {
    return {
      hasSession: false,
      expired: false,
      label: 'Unbekannter Status',
      detail: 'Das Backend hat keinen lesbaren Status zurückgegeben.',
    };
  }

  const object = data as Record<string, unknown>;

  const hasSession = Boolean(
      object.ownSession ??
      object.hasOwnSession ??
      object.hasSession ??
      object.connected
  );

  const expired = Boolean(object.expired ?? object.isExpired);

  if (hasSession && !expired) {
    return {
      hasSession,
      expired,
      label: 'Verbunden',
      detail: 'Deine myTischtennis-Verbindung ist aktiv.',
    };
  }

  if (hasSession && expired) {
    return {
      hasSession,
      expired,
      label: 'Abgelaufen',
      detail: 'Deine myTischtennis-Verbindung ist abgelaufen. Bitte neu verbinden.',
    };
  }

  return {
    hasSession,
    expired,
    label: 'Nicht verbunden',
    detail: 'Es ist noch keine myTischtennis-Verbindung gespeichert.',
  };
}

function normalizeGrants(response: unknown): MyttGrant[] {
  const data = unwrapData(response);

  if (Array.isArray(data)) {
    return data as MyttGrant[];
  }

  if (data && typeof data === 'object') {
    const object = data as Record<string, unknown>;

    if (Array.isArray(object.grants)) {
      return object.grants as MyttGrant[];
    }

    if (Array.isArray(object.items)) {
      return object.items as MyttGrant[];
    }

    if (Array.isArray(object.data)) {
      return object.data as MyttGrant[];
    }
  }

  return [];
}

export default function SettingsScreen() {
  const { colors, mode, accent, setMode, setAccent } = useTheme();
  const { user, isAuthenticated, login, register, logout } = useAuth();

  const [health, setHealth] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<
      'login' | 'register' | 'logout' | null
  >(null);

  const [myttStatus, setMyttStatus] = useState<MyttStatusView | null>(null);
  const [myttMessage, setMyttMessage] = useState<string | null>(null);
  const [myttLoading, setMyttLoading] = useState<'status' | null>(null);

  const [grants, setGrants] = useState<MyttGrant[]>([]);
  const [grantUsername, setGrantUsername] = useState('');
  const [grantMessage, setGrantMessage] = useState<string | null>(null);
  const [grantLoading, setGrantLoading] = useState<'load' | 'create' | null>(null);
  const [deletingGrantId, setDeletingGrantId] = useState<string | null>(null);

  async function checkHealth() {
    setChecking(true);
    setHealth(null);

    try {
      const response = await ttApi.health();
      setHealth(response.ok ? 'Backend erreichbar' : 'Backend antwortet, aber ok=false');
    } catch (error) {
      setHealth(error instanceof Error ? error.message : 'Backend nicht erreichbar');
    } finally {
      setChecking(false);
    }
  }

  async function handleLogin() {
    setAuthLoading('login');
    setAuthMessage(null);

    try {
      const loggedInUser = await login({
        username: username.trim(),
        password,
      });

      setPassword('');
      setAuthMessage(`Eingeloggt als ${loggedInUser.username}`);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Login fehlgeschlagen');
    } finally {
      setAuthLoading(null);
    }
  }

  async function handleRegister() {
    setAuthLoading('register');
    setAuthMessage(null);

    try {
      const registeredUser = await register({
        username: username.trim(),
        password,
      });

      setPassword('');
      setAuthMessage(`Registriert und eingeloggt als ${registeredUser.username}`);
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Registrierung fehlgeschlagen');
    } finally {
      setAuthLoading(null);
    }
  }

  async function handleLogout() {
    setAuthLoading('logout');
    setAuthMessage(null);
    setMyttMessage(null);
    setMyttStatus(null);
    setGrantMessage(null);
    setGrants([]);

    try {
      await logout();
      setPassword('');
      setAuthMessage('Erfolgreich ausgeloggt');
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Logout fehlgeschlagen');
    } finally {
      setAuthLoading(null);
    }
  }

  async function handleCheckMyttStatus() {
    setMyttLoading('status');
    setMyttMessage(null);

    try {
      const status = await getMyttStatus();
      setMyttStatus(normalizeMyttStatus(status));
    } catch (error) {
      setMyttStatus(null);
      setMyttMessage(error instanceof Error ? error.message : 'Status konnte nicht geladen werden');
    } finally {
      setMyttLoading(null);
    }
  }

  async function handleLoadGrants() {
    setGrantLoading('load');
    setGrantMessage(null);

    try {
      const response = await getMyttGrants();
      setGrants(normalizeGrants(response));
    } catch (error) {
      setGrantMessage(error instanceof Error ? error.message : 'Freigaben konnten nicht geladen werden');
    } finally {
      setGrantLoading(null);
    }
  }

  async function handleCreateGrant() {
    setGrantLoading('create');
    setGrantMessage(null);

    try {
      await createMyttGrant({
        granteeUsername: grantUsername.trim(),
        scopes: ['ttr:read', 'ttr_history:read'],
      });

      setGrantUsername('');
      setGrantMessage('Freigabe erstellt');

      const response = await getMyttGrants();
      setGrants(normalizeGrants(response));
    } catch (error) {
      setGrantMessage(error instanceof Error ? error.message : 'Freigabe konnte nicht erstellt werden');
    } finally {
      setGrantLoading(null);
    }
  }

  async function handleRevokeGrant(grantId: string) {
    setDeletingGrantId(grantId);
    setGrantMessage(null);

    try {
      await revokeMyttGrant(grantId);
      setGrants((current) => current.filter((grant) => grant.id !== grantId));
      setGrantMessage('Freigabe entfernt');
    } catch (error) {
      setGrantMessage(error instanceof Error ? error.message : 'Freigabe konnte nicht entfernt werden');
    } finally {
      setDeletingGrantId(null);
    }
  }

  const canSubmitAuth = username.trim().length >= 2 && password.length >= 8;
  const canCreateGrant = grantUsername.trim().length >= 2;

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.text }]}>Einstellungen</Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]}>
              App-Design, Konto und myTischtennis-Verbindung
            </Text>
          </View>

          <Card style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons
                  name={mode === 'dark' ? 'moon' : 'sunny-outline'}
                  size={21}
                  color={colors.text}
              />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Erscheinungsbild</Text>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>Theme</Text>

            <View style={styles.twoGrid}>
              <Button
                  variant={mode === 'light' ? 'primary' : 'outline'}
                  icon="sunny-outline"
                  onPress={() => setMode('light')}
                  style={styles.halfButton}
              >
                Hell
              </Button>

              <Button
                  variant={mode === 'dark' ? 'primary' : 'outline'}
                  icon="moon-outline"
                  onPress={() => setMode('dark')}
                  style={styles.halfButton}
              >
                Dunkel
              </Button>
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="color-palette-outline" size={21} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Akzentfarbe</Text>
            </View>

            <View style={styles.twoGrid}>
              {accentColors.map((entry) => (
                  <Pressable
                      key={entry.id}
                      onPress={() => setAccent(entry.id)}
                      style={({ pressed }) => [
                        styles.accentButton,
                        {
                          backgroundColor:
                              accent === entry.id ? colors.primarySoft : 'transparent',
                          borderColor:
                              accent === entry.id ? colors.primarySoftBorder : colors.border,
                          opacity: pressed ? 0.75 : 1,
                        },
                      ]}
                  >
                    <View
                        style={[
                          styles.colorDot,
                          {
                            backgroundColor: entry.color,
                            borderColor: colors.border,
                          },
                        ]}
                    />

                    <Text
                        style={[
                          styles.accentButtonText,
                          {
                            color: accent === entry.id ? colors.primary : colors.text,
                          },
                        ]}
                    >
                      {entry.name}
                    </Text>
                  </Pressable>
              ))}
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="person-circle-outline" size={21} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Konto</Text>
            </View>

            <Text style={[styles.backendText, { color: colors.mutedText }]}>
              {isAuthenticated && user
                  ? `Eingeloggt als ${user.username}`
                  : 'Melde dich an oder erstelle einen neuen TTTracker-Account.'}
            </Text>

            {!isAuthenticated ? (
                <>
                  <TextInput
                      value={username}
                      onChangeText={setUsername}
                      placeholder="TTTracker-Benutzername"
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
                      placeholder="App-Passwort"
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
                      Login
                    </Button>

                    <Button
                        variant="outline"
                        icon="person-add-outline"
                        loading={authLoading === 'register'}
                        onPress={handleRegister}
                        style={styles.halfButton}
                    >
                      Registrieren
                    </Button>
                  </View>

                  {!canSubmitAuth ? (
                      <Text style={[styles.backendText, { color: colors.mutedText }]}>
                        Benutzername mindestens 2 Zeichen, Passwort mindestens 8 Zeichen.
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
                  Logout
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
                            authMessage.includes('ausgeloggt')
                                ? '#16a34a'
                                : colors.destructive,
                      },
                    ]}
                >
                  {authMessage}
                </Text>
            ) : null}
          </Card>

          {isAuthenticated ? (
              <>
                <Card style={styles.card}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="key-outline" size={21} color={colors.text} />
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      myTischtennis verbinden
                    </Text>
                  </View>

                  <Text style={[styles.backendText, { color: colors.mutedText }]}>
                    Verbinde deinen myTischtennis-Account, damit TTR und TTR-Verlauf geladen
                    werden können. Deine Anmeldung erfolgt direkt über myTischtennis.
                  </Text>

                  <View style={styles.twoGrid}>
                    <Button
                        variant="primary"
                        icon="open-outline"
                        onPress={() => router.push('/mytt-connect')}
                        style={styles.halfButton}
                    >
                      Verbinden
                    </Button>

                    <Button
                        variant="outline"
                        icon="refresh-outline"
                        loading={myttLoading === 'status'}
                        onPress={handleCheckMyttStatus}
                        style={styles.halfButton}
                    >
                      Status prüfen
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
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Session freigeben</Text>
                  </View>

                  <Text style={[styles.backendText, { color: colors.mutedText }]}>
                    Gib einem anderen App-User Zugriff auf TTR und TTR-Verlauf, ohne deinen
                    Cookie zu teilen.
                  </Text>

                  <TextInput
                      value={grantUsername}
                      onChangeText={setGrantUsername}
                      placeholder="Benutzername des anderen Users"
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
                        Benutzername ist zu kurz.
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
                      Freigabe erstellen
                    </Button>

                    <Button
                        variant="outline"
                        icon="refresh-outline"
                        loading={grantLoading === 'load'}
                        onPress={handleLoadGrants}
                        style={styles.halfButton}
                    >
                      Freigaben laden
                    </Button>
                  </View>

                  {grants.length > 0 ? (
                      <View style={styles.grantList}>
                        {grants.map((grant) => {
                          const title = grant.granteeUsername || 'Unbekannter Benutzer';

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
                                    Zugriff auf TTR und TTR-Verlauf
                                  </Text>
                                </View>

                                <Button
                                    variant="outline"
                                    icon="trash-outline"
                                    loading={deletingGrantId === grant.id}
                                    onPress={() => handleRevokeGrant(grant.id)}
                                >
                                  Entfernen
                                </Button>
                              </View>
                          );
                        })}
                      </View>
                  ) : (
                      <Text style={[styles.backendText, { color: colors.mutedText }]}>
                        Noch keine Freigaben geladen oder keine Freigaben vorhanden.
                      </Text>
                  )}

                  {grantMessage ? (
                      <Text
                          style={[
                            styles.backendText,
                            {
                              color:
                                  grantMessage.includes('erstellt') ||
                                  grantMessage.includes('entfernt')
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
              <Text style={[styles.cardTitle, { color: colors.text }]}>Backend</Text>
            </View>

            <Text style={[styles.backendText, { color: colors.mutedText }]}>
              {getApiBaseUrl() || 'EXPO_PUBLIC_API_BASE_URL fehlt'}
            </Text>

            <Button variant="outline" icon="pulse-outline" loading={checking} onPress={checkHealth}>
              Health prüfen
            </Button>

            {health ? (
                <Text
                    style={[
                      styles.backendText,
                      {
                        color: health.includes('erreichbar') ? '#16a34a' : colors.destructive,
                      },
                    ]}
                >
                  {health}
                </Text>
            ) : null}
          </Card>

          <Card style={styles.versionCard}>
            <Text style={[styles.versionText, { color: colors.mutedText }]}>
              Tischtennis Tracker v1.0
            </Text>
            <Text style={[styles.versionSubtext, { color: colors.mutedText }]}>
              Daten von myTischtennis über dein eigenes Backend
            </Text>
          </Card>
        </ScrollView>
      </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 112,
    gap: 16,
  },
  titleBlock: {
    gap: 4,
  },
  title: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
  },
  card: {
    padding: 16,
    gap: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  twoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  halfButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
  },
  accentButton: {
    minHeight: 42,
    minWidth: '47%',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  accentButtonText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  backendText: {
    fontSize: 13,
    lineHeight: 19,
  },
  statusBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  grantList: {
    gap: 10,
  },
  grantItem: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  grantInfo: {
    gap: 3,
  },
  grantTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  grantSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  versionCard: {
    padding: 22,
    alignItems: 'center',
    gap: 4,
  },
  versionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  versionSubtext: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});