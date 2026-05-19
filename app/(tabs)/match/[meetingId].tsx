import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ttApi } from '../../../src/api/tttracker';
import { Badge } from '../../../src/components/Badge';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { Screen } from '../../../src/components/Screen';
import { useTheme } from '../../../src/theme/ThemeProvider';
import type { MeetingMatchLine } from '../../../src/types/tttracker';
import { normalizeMeetingLines } from '../../../src/utils/normalizers';

export default function MatchDetailsScreen() {
  const params = useLocalSearchParams<Record<string, string>>();
  const { colors } = useTheme();
  const [lines, setLines] = useState<MeetingMatchLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMeeting() {
      if (!params.meetingId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await ttApi.getMeetingLive(params.meetingId);
        setLines(normalizeMeetingLines(response));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Begegnung konnte nicht geladen werden');
      } finally {
        setLoading(false);
      }
    }

    loadMeeting().catch(() => undefined);
  }, [params.meetingId]);

  const singles = useMemo(() => lines.filter((line) => line.type !== 'double'), [lines]);
  const doubles = useMemo(() => lines.filter((line) => line.type === 'double'), [lines]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Button variant="ghost" icon="arrow-back" onPress={() => router.back()}> </Button>
          <Text style={[styles.title, { color: colors.text }]}>Begegnungsdetails</Text>
        </View>

        <Card style={[styles.scoreCard, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder }]}> 
          <View style={styles.teamsRow}>
            <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2}>{params.homeTeam ?? 'Heim'}</Text>
            <View style={styles.scoreMiddle}>
              <Ionicons name="flash-outline" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.teamName, styles.awayTeam, { color: colors.text }]} numberOfLines={2}>{params.awayTeam ?? 'Gast'}</Text>
          </View>
          <Text style={[styles.meetingId, { color: colors.mutedText }]}>Meeting #{params.meetingId}</Text>
        </Card>

        {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

        {!loading && !error && lines.length === 0 ? <EmptyState icon="analytics-outline" title="Keine Live-Details gefunden" subtitle="Das Backend hat keine Einzel- oder Doppelspiele geliefert." /> : null}

        {!loading && singles.length > 0 ? <MatchSection title="Einzelspiele" rows={singles} /> : null}
        {!loading && doubles.length > 0 ? <MatchSection title="Doppelspiele" rows={doubles} /> : null}
      </ScrollView>
    </Screen>
  );
}

function MatchSection({ title, rows }: { title: string; rows: MeetingMatchLine[] }) {
  const { colors } = useTheme();
  return (
    <Card style={styles.sectionCard}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.rows}>
        {rows.map((row) => (
          <View key={row.id} style={[styles.matchLine, { borderBottomColor: colors.border }]}> 
            <View style={styles.playersRow}>
              <Text style={[styles.playerName, { color: colors.text }]} numberOfLines={2}>{row.homePlayer}</Text>
              <Badge tone="secondary">{row.result}</Badge>
              <Text style={[styles.playerName, styles.awayPlayer, { color: colors.text }]} numberOfLines={2}>{row.awayPlayer}</Text>
            </View>
            {row.sets.length > 0 ? <Text style={[styles.sets, { color: colors.mutedText }]}>{row.sets.join(' · ')}</Text> : null}
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 96,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '800',
  },
  scoreCard: {
    padding: 22,
    gap: 14,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  teamName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '900',
  },
  awayTeam: {
    textAlign: 'center',
  },
  scoreMiddle: {
    width: 58,
    alignItems: 'center',
  },
  meetingId: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  loader: {
    paddingVertical: 22,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionCard: {
    paddingTop: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    paddingHorizontal: 16,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  rows: {
    width: '100%',
  },
  matchLine: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playerName: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
  },
  awayPlayer: {
    textAlign: 'right',
  },
  sets: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
});
