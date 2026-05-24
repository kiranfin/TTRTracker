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

type TeamScheduleStats = {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  tablePointsWon: number;
  tablePointsLost: number;
  matchesWon: number;
  matchesLost: number;
};

type RichTableRow = TableRow & Record<string, unknown>;

export default function LeagueDetailsScreen() {
  const params = useLocalSearchParams<Record<string, string>>();
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<DetailTab>('table');
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [matches, setMatches] = useState<ScheduleMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const league = useMemo(
      () => ({
        title: params.title ?? 'Ligadetails',
        association: params.association,
        groupId: params.groupId ?? params.leagueKey,
        season: params.season ?? '25/26',
        leagueSlug: params.leagueSlug ?? 'x',
      }),
      [
        params.association,
        params.groupId,
        params.leagueKey,
        params.leagueSlug,
        params.season,
        params.title,
      ],
  );

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
          ttApi.getLeagueSchedule(
              league.association,
              league.season,
              league.groupId,
              league.leagueSlug,
          ),
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

  const scheduleStatsByTeam = useMemo(() => buildScheduleStats(matches), [matches]);

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <Button variant="ghost" icon="arrow-back" onPress={() => router.back()}>
              {' '}
            </Button>

            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                {league.title}
              </Text>

              <View style={styles.headerMetaRow}>
                <Badge tone="outline" icon="calendar-outline">
                  Saison {league.season}
                </Badge>

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
                  <View
                      style={[
                        styles.sectionIcon,
                        {
                          backgroundColor: colors.primarySoft,
                          borderColor: colors.primarySoftBorder,
                        },
                      ]}
                  >
                    <Ionicons name="podium-outline" size={18} color={colors.primary} />
                  </View>

                  <View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Tabelle</Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                      Punkte, Spiele, Bilanz und Verhältnis
                    </Text>
                  </View>
                </View>

                {tableRows.length === 0 ? (
                    <EmptyState icon="list-outline" title="Keine Tabelle gefunden" />
                ) : (
                    <View style={styles.tableList}>
                      {tableRows.map((row, index) => {
                        const scheduleStats = scheduleStatsByTeam.get(normalizeTeamKey(row.teamName));

                        return (
                            <TableTeamCard
                                key={getTableRowKey(row, index)}
                                row={row}
                                index={index}
                                scheduleStats={scheduleStats}
                            />
                        );
                      })}
                    </View>
                )}
              </Card>
          ) : null}

          {!loading && !error && activeTab === 'matches' ? (
              <View style={styles.stack}>
                {upcoming.length === 0 && completed.length === 0 ? (
                    <EmptyState icon="calendar-outline" title="Kein Spielplan gefunden" />
                ) : null}

                {upcoming.length > 0 ? (
                    <Card style={styles.sectionCard}>
                      <View style={styles.sectionHeaderCompact}>
                        <Ionicons name="time-outline" size={18} color={colors.primary} />
                        <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>
                          Anstehend / offen
                        </Text>
                      </View>

                      <View style={styles.stack}>
                        {upcoming.map((match, index) => (
                            <MatchCard
                                key={`upcoming-${match.id ?? 'no-id'}-${index}`}
                                match={match}
                                highlighted
                            />
                        ))}
                      </View>
                    </Card>
                ) : null}

                {completed.length > 0 ? (
                    <Card style={styles.sectionCard}>
                      <View style={styles.sectionHeaderCompact}>
                        <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                        <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>
                          Ergebnisse
                        </Text>
                      </View>

                      <View style={styles.stack}>
                        {completed.map((match, index) => (
                            <MatchCard
                                key={`completed-${match.id ?? 'no-id'}-${index}`}
                                match={match}
                            />
                        ))}
                      </View>
                    </Card>
                ) : null}
              </View>
          ) : null}
        </ScrollView>
      </Screen>
  );
}

function TableTeamCard({
                         row,
                         index,
                         scheduleStats,
                       }: {
  row: TableRow;
  index: number;
  scheduleStats?: TeamScheduleStats;
}) {
  const { colors } = useTheme();
  const stats = getTableStats(row, index, scheduleStats);
  const rankNumber = parseRank(stats.position);

  return (
      <View style={[styles.richTableRow, { borderBottomColor: colors.border }]}>
        <View style={styles.richTableTopRow}>
          <Badge tone={Number.isFinite(rankNumber) && rankNumber <= 3 ? 'green' : 'secondary'}>
            {stats.position}
          </Badge>

          <View style={styles.richTableTeamText}>
            <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2}>
              {stats.teamName}
            </Text>

            {stats.subline ? (
                <Text style={[styles.teamSubline, { color: colors.mutedText }]} numberOfLines={1}>
                  {stats.subline}
                </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.tableStatsGrid}>
          <TableStat label="Punkte" value={stats.points} strong />
          <TableStat label="Spiele" value={stats.games} />
          <TableStat label="S/U/N" value={stats.record} />
          <TableStat label="Verh." value={stats.ratio} />
        </View>
      </View>
  );
}

function TableStat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const { colors } = useTheme();

  return (
      <View style={[styles.tableStatBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Text style={[styles.tableStatLabel, { color: colors.mutedText }]}>{label}</Text>

        <Text
            style={[
              styles.tableStatValue,
              strong ? styles.tableStatValueStrong : null,
              { color: colors.text },
            ]}
            numberOfLines={1}
        >
          {value}
        </Text>
      </View>
  );
}

function MatchCard({ match, highlighted }: { match: ScheduleMatch; highlighted?: boolean }) {
  const { colors } = useTheme();
  const canOpen = Boolean(match.id) && match.status !== 'free';

  return (
      <Card
          pressable={canOpen}
          onPress={
            canOpen
                ? () =>
                    router.push({
                      pathname: '/match/[meetingId]',
                      params: {
                        meetingId: match.id!,
                        homeTeam: match.homeTeam,
                        awayTeam: match.awayTeam,
                      },
                    })
                : undefined
          }
          style={[
            styles.matchCard,
            highlighted && {
              backgroundColor: colors.primarySoft,
              borderColor: colors.primarySoftBorder,
            },
          ]}
      >
        <View style={styles.matchTopMeta}>
          <View style={styles.metaLine}>
            <Ionicons name="calendar-outline" size={13} color={colors.mutedText} />
            <Text style={[styles.metaText, { color: colors.mutedText }]}>
              {formatDate(match.date)}
              {match.time ? ` • ${match.time}` : ''}
              {match.endTime ? `–${match.endTime}` : ''}
            </Text>
          </View>

          <Badge tone={match.status === 'completed' ? 'green' : match.status === 'free' ? 'secondary' : 'outline'}>
            {matchStatusLabel(match.status)}
          </Badge>
        </View>

        <View style={styles.matchScoreRow}>
          <Text style={[styles.matchTeam, { color: colors.text }]} numberOfLines={2}>
            {match.homeTeam}
          </Text>

          {match.status === 'completed' ? (
              <View style={[styles.scoreBox, { backgroundColor: colors.muted }]}>
                <Text style={[styles.scoreText, { color: colors.text }]}>{match.homeScore ?? '-'}</Text>
                <Text style={[styles.scoreDivider, { color: colors.mutedText }]}>:</Text>
                <Text style={[styles.scoreText, { color: colors.text }]}>{match.awayScore ?? '-'}</Text>
              </View>
          ) : (
              <View style={[styles.vsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.vsText, { color: colors.mutedText }]}>
                  {match.status === 'free' ? 'FREI' : 'VS'}
                </Text>
              </View>
          )}

          <Text style={[styles.matchTeam, styles.awayTeam, { color: colors.text }]} numberOfLines={2}>
            {match.awayTeam}
          </Text>
        </View>

        <View style={styles.matchMetaRow}>
          {match.roundName || match.meetingNumber ? (
              <View style={styles.metaLine}>
                <Ionicons name="flag-outline" size={13} color={colors.mutedText} />
                <Text style={[styles.metaText, { color: colors.mutedText }]}>
                  {[match.roundName, match.meetingNumber ? `Spiel ${match.meetingNumber}` : undefined]
                      .filter(Boolean)
                      .join(' • ')}
                </Text>
              </View>
          ) : null}

          {match.venue ? (
              <View style={styles.metaLine}>
                <Ionicons name="location-outline" size={13} color={colors.mutedText} />
                <Text style={[styles.metaText, { color: colors.mutedText }]} numberOfLines={2}>
                  {match.venue}
                </Text>
              </View>
          ) : null}

          {match.confirmed !== undefined ? (
              <View style={styles.metaLine}>
                <Ionicons
                    name={match.confirmed ? 'shield-checkmark-outline' : 'alert-circle-outline'}
                    size={13}
                    color={colors.mutedText}
                />
                <Text style={[styles.metaText, { color: colors.mutedText }]}>
                  {match.confirmed ? 'Bestätigt' : 'Nicht bestätigt'}
                </Text>
              </View>
          ) : null}
        </View>
      </Card>
  );
}

function getTableStats(row: TableRow, index: number, scheduleStats?: TeamScheduleStats) {
  const raw = row as RichTableRow;

  const position =
      valueToString(row.position) ??
      pickString(raw, ['position', 'tableRank', 'table_rank', 'rank']) ??
      String(index + 1);

  const teamName =
      valueToString(row.teamName) ??
      pickString(raw, ['teamName', 'team_name', 'name']) ??
      'Unbekannte Mannschaft';

  const clubId = valueToString(row.clubId) ?? pickString(raw, ['clubId', 'club_id']);
  const teamId = pickString(raw, ['teamId', 'team_id']);

  const officialPoints =
      valueToString(row.points) ??
      joinPair(valueToString(row.pointsWon), valueToString(row.pointsLost)) ??
      pickString(raw, ['tablePoints', 'table_points', 'pointsText', 'score']);

  const schedulePoints = scheduleStats
      ? `${scheduleStats.tablePointsWon}:${scheduleStats.tablePointsLost}`
      : undefined;

  const games =
      valueToString(row.matches) ??
      pickString(raw, [
        'played',
        'playedGames',
        'played_games',
        'meetings',
        'meetingsPlayed',
        'meetings_played',
        'matchesPlayed',
        'matches_played',
        'anzahl_spiele',
      ]) ??
      (scheduleStats ? String(scheduleStats.played) : undefined);

  const wins = valueToString(row.wins) ?? pickString(raw, ['won', 'meetingsWon', 'meetings_won']);
  const draws = valueToString(row.draws) ?? pickString(raw, ['ties', 'meetingsDraw', 'meetings_draw']);
  const losses = valueToString(row.losses) ?? pickString(raw, ['lost', 'meetingsLost', 'meetings_lost']);

  const record =
      joinRecord(wins, draws, losses) ??
      (scheduleStats ? `${scheduleStats.wins}-${scheduleStats.draws}-${scheduleStats.losses}` : undefined);

  const ratio =
      pickString(raw, [
        'ratio',
        'matchRatio',
        'match_ratio',
        'matchesRatio',
        'matches_ratio',
        'gamesRatio',
        'games_ratio',
        'balance',
      ]) ??
      joinPair(
          pickString(raw, ['matchesWon', 'matches_won', 'gamesWon', 'games_won']),
          pickString(raw, ['matchesLost', 'matches_lost', 'gamesLost', 'games_lost']),
      ) ??
      (scheduleStats ? `${scheduleStats.matchesWon}:${scheduleStats.matchesLost}` : undefined) ??
      valueToString(row.games);

  return {
    position,
    teamName,
    subline: [clubId ? `Club-ID ${clubId}` : undefined, teamId ? `Team-ID ${teamId}` : undefined]
        .filter(Boolean)
        .join(' • '),
    points: officialPoints ?? schedulePoints ?? '-',
    games: games ?? '-',
    record: record ?? '-',
    ratio: ratio ?? '-',
  };
}

function buildScheduleStats(matches: ScheduleMatch[]) {
  const statsByTeam = new Map<string, TeamScheduleStats>();

  for (const match of matches) {
    if (match.status !== 'completed') continue;
    if (isFreeTeam(match.homeTeam) || isFreeTeam(match.awayTeam)) continue;

    const homeScore = toNumber(match.homeScore);
    const awayScore = toNumber(match.awayScore);

    if (homeScore === undefined || awayScore === undefined) continue;

    addTeamScheduleResult(statsByTeam, match.homeTeam, homeScore, awayScore);
    addTeamScheduleResult(statsByTeam, match.awayTeam, awayScore, homeScore);
  }

  return statsByTeam;
}

function addTeamScheduleResult(
    statsByTeam: Map<string, TeamScheduleStats>,
    teamName: string,
    ownScore: number,
    opponentScore: number,
) {
  const key = normalizeTeamKey(teamName);
  if (!key) return;

  const current =
      statsByTeam.get(key) ??
      {
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        tablePointsWon: 0,
        tablePointsLost: 0,
        matchesWon: 0,
        matchesLost: 0,
      };

  current.played += 1;
  current.matchesWon += ownScore;
  current.matchesLost += opponentScore;

  if (ownScore > opponentScore) {
    current.wins += 1;
    current.tablePointsWon += 2;
  } else if (ownScore < opponentScore) {
    current.losses += 1;
    current.tablePointsLost += 2;
  } else {
    current.draws += 1;
    current.tablePointsWon += 1;
    current.tablePointsLost += 1;
  }

  statsByTeam.set(key, current);
}

function getTableRowKey(row: TableRow, index: number) {
  const raw = row as RichTableRow;

  return [
    valueToString(row.id),
    valueToString(row.teamName),
    valueToString(row.clubId),
    pickString(raw, ['teamId', 'team_id']),
    index,
  ]
      .filter(Boolean)
      .join('-');
}

function normalizeTeamKey(teamName?: string) {
  return (teamName ?? '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
}

function isFreeTeam(teamName?: string) {
  return normalizeTeamKey(teamName).includes('spielfrei');
}

function parseRank(value?: string) {
  const match = String(value ?? '').match(/\d+/);
  return match ? Number(match[0]) : Number.NaN;
}

function pickString(row: RichTableRow, keys: string[]) {
  for (const key of keys) {
    const value = valueToString(row[key]);
    if (value !== undefined) return value;
  }

  return undefined;
}

function valueToString(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;
  return String(value);
}

function joinPair(left?: string, right?: string) {
  if (!left && !right) return undefined;
  return `${left ?? '0'}:${right ?? '0'}`;
}

function joinRecord(wins?: string, draws?: string, losses?: string) {
  if (!wins && !draws && !losses) return undefined;
  return `${wins ?? '0'}-${draws ?? '0'}-${losses ?? '0'}`;
}

function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
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
  tableList: {
    width: '100%',
  },
  richTableRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  richTableTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  richTableTeamText: {
    flex: 1,
  },
  tableStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tableStatBox: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 120,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableStatLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
  },
  tableStatValue: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
  },
  tableStatValueStrong: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
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