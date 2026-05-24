import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ttApi } from '../../src/api/tttracker';
import { Button, IconButton } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { EmptyState } from '../../src/components/EmptyState';
import { Screen } from '../../src/components/Screen';
import { useTheme } from '../../src/theme/ThemeProvider';
import type { LeagueAssociation } from '../../src/types/tttracker';

export default function LeaguesScreen() {
  const { colors } = useTheme();

  const [associations, setAssociations] = useState<LeagueAssociation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAssociations() {
    setLoading(true);
    setError(null);

    try {
      const result = await ttApi.getLeagueAssociations();
      setAssociations(result);
    } catch (loadError) {
      setAssociations([]);
      setError(loadError instanceof Error ? loadError.message : 'Verbände konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssociations().catch(() => undefined);
  }, []);

  function openAssociation(association: LeagueAssociation) {
    router.push({
      pathname: '/region/[region]',
      params: {
        region: association.association,
        title: association.name,
        shortName: association.shortName,
      },
    });
  }

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View style={styles.titleBlock}>
              <Text style={[styles.title, { color: colors.text }]}>Wähle einen Verband aus</Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                Danach werden Kreise, Bezirke und Spielklassen über dein Backend geladen.
              </Text>
            </View>

            <IconButton
                icon="refresh-outline"
                onPress={loadAssociations}
                accessibilityLabel="Verbände neu laden"
            />
          </View>

          {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

          {error ? (
              <Card style={styles.errorCard}>
                <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
                <Button variant="secondary" icon="refresh-outline" onPress={loadAssociations}>
                  Erneut versuchen
                </Button>
              </Card>
          ) : null}

          {!loading && !error && associations.length === 0 ? (
              <EmptyState
                  icon="map-outline"
                  title="Keine Verbände gefunden"
                  subtitle="Prüfe, ob dein Backend /api/leagues/associations liefert."
              />
          ) : null}

          {!loading && !error && associations.length > 0 ? (
              <View style={styles.grid}>
                {associations.map((association) => (
                    <Card
                        key={association.id}
                        pressable
                        style={styles.associationCard}
                        onPress={() => openAssociation(association)}
                    >
                      <View
                          style={[
                            styles.logoBubble,
                            {
                              backgroundColor: colors.primarySoft,
                              borderColor: colors.primarySoftBorder,
                            },
                          ]}
                      >
                        <Text style={[styles.logoText, { color: colors.primary }]}>
                          {association.shortName.slice(0, 4)}
                        </Text>
                      </View>

                      <View style={styles.associationTextBlock}>
                        <Text style={[styles.associationTitle, { color: colors.text }]} numberOfLines={2}>
                          {association.name}
                        </Text>
                        <Text style={[styles.associationSubtitle, { color: colors.mutedText }]}>
                          {association.shortName}
                        </Text>
                      </View>

                      <View style={[styles.arrowBubble, { backgroundColor: colors.primary }]}>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                      </View>
                    </Card>
                ))}
              </View>
          ) : null}
        </ScrollView>
      </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 112,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 6,
  },
  kicker: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },
  title: {
    fontSize: 25,
    lineHeight: 35,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
  },
  loader: {
    paddingVertical: 24,
  },
  errorCard: {
    padding: 16,
    gap: 12,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  grid: {
    gap: 12,
  },
  associationCard: {
    minHeight: 88,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoBubble: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
  },
  associationTextBlock: {
    flex: 1,
    gap: 3,
  },
  associationTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
  },
  associationSubtitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  arrowBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});