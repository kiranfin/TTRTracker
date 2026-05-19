import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getApiBaseUrl } from '../../src/api/client';
import { ttApi } from '../../src/api/tttracker';
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

export default function SettingsScreen() {
  const { colors, mode, accent, setMode, setAccent } = useTheme();
  const [health, setHealth] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

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

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.text }]}>Einstellungen</Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]}>Passe die App nach deinen Wünschen an</Text>
          </View>

          <Card style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name={mode === 'dark' ? 'moon' : 'sunny-outline'} size={21} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Erscheinungsbild</Text>
            </View>
            <Text style={[styles.label, { color: colors.text }]}>Theme</Text>
            <View style={styles.twoGrid}>
              <Button variant={mode === 'light' ? 'primary' : 'outline'} icon="sunny-outline" onPress={() => setMode('light')} style={styles.halfButton}>Hell</Button>
              <Button variant={mode === 'dark' ? 'primary' : 'outline'} icon="moon-outline" onPress={() => setMode('dark')} style={styles.halfButton}>Dunkel</Button>
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
                          backgroundColor: accent === entry.id ? colors.primarySoft : 'transparent',
                          borderColor: accent === entry.id ? colors.primarySoftBorder : colors.border,
                          opacity: pressed ? 0.75 : 1,
                        },
                      ]}
                  >
                    <View style={[styles.colorDot, { backgroundColor: entry.color, borderColor: colors.border }]} />
                    <Text style={[styles.accentButtonText, { color: accent === entry.id ? colors.primary : colors.text }]}>{entry.name}</Text>
                  </Pressable>
              ))}
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="server-outline" size={21} color={colors.text} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Backend</Text>
            </View>
            <Text style={[styles.backendText, { color: colors.mutedText }]}>{getApiBaseUrl() || 'EXPO_PUBLIC_API_BASE_URL fehlt'}</Text>
            <Button variant="outline" icon="pulse-outline" loading={checking} onPress={checkHealth}>Health prüfen</Button>
            {health ? <Text style={[styles.backendText, { color: health.includes('erreichbar') ? '#16a34a' : colors.destructive }]}>{health}</Text> : null}
          </Card>

          <Card style={styles.versionCard}>
            <Text style={[styles.versionText, { color: colors.mutedText }]}>Tischtennis Tracker v1.0</Text>
            <Text style={[styles.versionSubtext, { color: colors.mutedText }]}>Daten von myTischtennis über dein eigenes Backend</Text>
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