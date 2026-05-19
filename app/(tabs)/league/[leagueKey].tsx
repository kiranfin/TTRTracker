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
import { SegmentedTabs } from '../../../src/components/SegmentedTabs';
import { useTheme } from '../../../src/theme/ThemeProvider';
import type { ScheduleMatch, TableRow } from '../../../src/types/tttracker';
import { formatDate, matchStatusLabel, normalizeSchedule, normalizeTable } from '../../../src/utils/normalizers';

type DetailTab = 'table' | 'matches';

export default function LeagueDetailsScreen() {
  const params = useLocalSearchParams<Record<string, string>>();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<DetailTab>('table');
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [matches, setMatches] = useState<ScheduleMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const league = useMemo(() => ({
    title: params.title ?? 'Ligadetails',
    association: params.association,
    groupId: params.groupId ?? params.leagueKey,
    season: params.season ?? '25/26',
    leagueSlug: params.leagueSlug ?? 'x',
  }), [params.association, params.groupId, params.leagueKey, params.leagueSlug, params.season, params.title]);

  useEffect(() => {
    async function loadLeague() {
      if (!league.association || !league.groupId) {
        setLoading(false);
        setError('Für diese Liga fehlen association oder groupId.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [tableResponse, scheduleResponse] = await Promise.all([
          ttApi.getLeagueTable(league.association, league.groupId),
          ttApi.getLeagueSchedule(league.association, league.season, league.groupId, league.leagueSlug),
        ]);

        setTableRows(normalizeTable(tableResponse));
        setMatches(normalizeSchedule(scheduleResponse));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Ligadaten konnten nicht geladen werden');
      } finally {
        setLoading(false);
      }
    }

    loadLeague().catch(() => undefined);
  }, [league.association, league.groupId, league.leagueSlug, league.season]);

  const upcoming = matches.filter((match) => match.status !== 'completed');
  const completed = matches.filter((match) => match.status === 'completed');

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Button variant="ghost" icon="arrow-back" onPress={() => router.back()}> </Button>

            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{league.title}</Text>
              <View style={styles.headerMetaRow}>
                <Badge tone="outline" icon="calendar-outline">Saison {league.season}</Badge>
                {league.association ? <Badge tone="secondary">{league.association}</Badge> : null}
                {league.groupId ? <Badge tone="outline">Gruppe {league.groupId}</Badge> : null}
              </View>
            </View>
          </View>

          <SegmentedTabs
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { value: 'table', label: 'Tabelle', icon: 'podium-outline' },
                { value: 'matches', label: 'Spielplan', icon: 'calendar-outline' },
              ]}
          />

          {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
          {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

          {!loading && !error && activeTab === 'table' ? (
              <Card style={styles.tableCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIcon, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder }]}>
                    <Ionicons name="podium-outline" size={18} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Tabelle</Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>Rangliste aus deinem Backend</Text>
                  </View>
                </View>

                {tableRows.length === 0 ? (
                    <EmptyState icon="list-outline" title="Keine Tabelle gefunden" />
                ) : (
                    <View style={styles.tableWrap}>
                      <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.colRank, styles.headerCell, { color: colors.mutedText }]}>#</Text>
                        <Text style={[styles.colTeam, styles.headerCell, { color: colors.mutedText }]}>Mannschaft</Text>
                        <Text style={[styles.colClub, styles.headerCell, { color: colors.mutedText }]}>Verein</Text>
                        <Text style={[styles.colPoints, styles.headerCell, { color: colors.mutedText }]}>Pkt</Text>
                      </View>

                      {tableRows.map((row) => (
                          <View key={row.id} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                            <View style={styles.colRank}>
                              <Badge tone={Number(row.position) <= 3 ? 'green' : 'secondary'}>{row.position}</Badge>
                            </View>

                            <View style={styles.colTeam}>
                              <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2}>{row.teamName}</Text>
                              {row.clubId ? <Text style={[styles.teamSubline, { color: colors.mutedText }]}>Club-ID {row.clubId}</Text> : null}
                            </View>

                            <Text style={[styles.colClub, styles.cellText, { color: colors.text }]}>{row.clubId ?? '-'}</Text>

                            <Text style={[styles.colPoints, styles.pointsText, { color: colors.text }]}>
                              {row.points ?? (row.pointsWon || row.pointsLost ? `${row.pointsWon ?? '0'}:${row.pointsLost ?? '0'}` : '-')}
                            </Text>
                          </View>
                      ))}
                    </View>
                )}
              </Card>
          ) : null}

          {!loading && !error && activeTab === 'matches' ? (
              <View style={styles.stack}>
                {upcoming.length === 0 && completed.length === 0 ? <EmptyState icon="calendar-outline" title="Kein Spielplan gefunden" /> : null}

                {upcoming.length > 0 ? (
                    <Card style={styles.sectionCard}>
                      <View style={styles.sectionHeaderCompact}>
                        <Ionicons name="time-outline" size={18} color={colors.primary} />
                        <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>Anstehend / offen</Text>
                      </View>

                      <View style={styles.stack}>
                        {upcoming.map((match, index) => <MatchCard key={match.id ?? `upcoming-${index}`} match={match} highlighted />)}
                      </View>
                    </Card>
                ) : null}

                {completed.length > 0 ? (
                    <Card style={styles.sectionCard}>
                      <View style={styles.sectionHeaderCompact}>
                        <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                        <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>Ergebnisse</Text>
                      </View>

                      <View style={styles.stack}>
                        {completed.map((match, index) => <MatchCard key={match.id ?? `completed-${index}`} match={match} />)}
                      </View>
                    </Card>
                ) : null}
              </View>
          ) : null}
        </ScrollView>
      </Screen>
  );
}

function MatchCard({ match, highlighted }: { match: ScheduleMatch; highlighted?: boolean }) {
  const { colors } = useTheme();
  const canOpen = Boolean(match.id) && match.status !== 'free';

  return (
      <Card
          pressable={canOpen}
          onPress={canOpen ? () => router.push({
            pathname: '/match/[meetingId]',
            params: {
              meetingId: match.id!,
              homeTeam: match.homeTeam,
              awayTeam: match.awayTeam,
            },
          }) : undefined}
          style={[styles.matchCard, highlighted && { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder }]}
      >
        <View style={styles.matchTopMeta}>
          <View style={styles.metaLine}>
            <Ionicons name="calendar-outline" size={13} color={colors.mutedText} />
            <Text style={[styles.metaText, { color: colors.mutedText }]}>
              {formatDate(match.date)}{match.time ? ` • ${match.time}` : ''}{match.endTime ? `–${match.endTime}` : ''}
            </Text>
          </View>

          <Badge tone={match.status === 'completed' ? 'green' : match.status === 'free' ? 'secondary' : 'outline'}>
            {matchStatusLabel(match.status)}
          </Badge>
        </View>

        <View style={styles.matchScoreRow}>
          <Text style={[styles.matchTeam, { color: colors.text }]} numberOfLines={2}>{match.homeTeam}</Text>

          {match.status === 'completed' ? (
              <View style={[styles.scoreBox, { backgroundColor: colors.muted }]}>
                <Text style={[styles.scoreText, { color: colors.text }]}>{match.homeScore ?? '-'}</Text>
                <Text style={[styles.scoreDivider, { color: colors.mutedText }]}>:</Text>
                <Text style={[styles.scoreText, { color: colors.text }]}>{match.awayScore ?? '-'}</Text>
              </View>
          ) : (
              <View style={[styles.vsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.vsText, { color: colors.mutedText }]}>{match.status === 'free' ? 'FREI' : 'VS'}</Text>
              </View>
          )}

          <Text style={[styles.matchTeam, styles.awayTeam, { color: colors.text }]} numberOfLines={2}>{match.awayTeam}</Text>
        </View>

        <View style={styles.matchMetaRow}>
          {match.roundName || match.meetingNumber ? (
              <View style={styles.metaLine}>
                <Ionicons name="flag-outline" size={13} color={colors.mutedText} />
                <Text style={[styles.metaText, { color: colors.mutedText }]}>
                  {[match.roundName, match.meetingNumber ? `Spiel ${match.meetingNumber}` : undefined].filter(Boolean).join(' • ')}
                </Text>
              </View>
          ) : null}

          {match.venue ? (
              <View style={styles.metaLine}>
                <Ionicons name="location-outline" size={13} color={colors.mutedText} />
                <Text style={[styles.metaText, { color: colors.mutedText }]} numberOfLines={2}>{match.venue}</Text>
              </View>
          ) : null}

          {match.confirmed !== undefined ? (
              <View style={styles.metaLine}>
                <Ionicons name={match.confirmed ? 'shield-checkmark-outline' : 'alert-circle-outline'} size={13} color={colors.mutedText} />
                <Text style={[styles.metaText, { color: colors.mutedText }]}>
                  {match.confirmed ? 'Bestätigt' : 'Nicht bestätigt'}
                </Text>
              </View>
          ) : null}
        </View>
      </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 112,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerText: {
    flex: 1,
    gap: 8,
  },
  title: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '900',
  },
  headerMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  loader: {
    paddingVertical: 22,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
  },
  stack: {
    gap: 12,
  },
  tableCard: {
    paddingTop: 16,
    overflow: 'hidden',
  },
  sectionCard: {
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  sectionHeaderCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
  },
  sectionSubtitle: {
    marginTop: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  sectionTitleCompact: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
  },
  tableWrap: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  headerCell: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  cellText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '700',
  },
  colRank: {
    width: 42,
    alignItems: 'center',
  },
  colTeam: {
    flex: 1,
  },
  colClub: {
    width: 62,
  },
  colPoints: {
    width: 48,
  },
  teamName: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },
  teamSubline: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
  },
  pointsText: {
    width: 48,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
    textAlign: 'center',
  },
  matchCard: {
    padding: 14,
    gap: 11,
  },
  matchTopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  matchScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 9,
  },
  matchTeam: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
  },
  awayTeam: {
    textAlign: 'right',
  },
  scoreBox: {
    minWidth: 76,
    minHeight: 38,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 8,
  },
  scoreText: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
  },
  scoreDivider: {
    fontSize: 18,
    lineHeight: 24,
  },
  vsBox: {
    minWidth: 54,
    minHeight: 34,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  matchMetaRow: {
    gap: 5,
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  metaText: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});