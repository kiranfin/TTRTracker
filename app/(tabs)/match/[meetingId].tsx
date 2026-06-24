import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ttApi } from '../../../src/api/tttracker';
import { Badge } from '../../../src/components/Badge';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { Screen } from '../../../src/components/Screen';
import { useI18n } from '../../../src/i18n/I18nProvider';
import { useTheme } from '../../../src/theme/ThemeProvider';

type IconName = ComponentProps<typeof Ionicons>['name'];

type RawPlayer = {
  firstname?: string | null;
  lastname?: string | null;
  player_id?: string | null;
  person_id?: string | null;
};

type RawMeetingMatch = {
  match_uuid?: string | null;
  match_name?: string | null;
  game_type?: string | null;

  sets_home?: number | string | null;
  sets_guest?: number | string | null;
  games_home?: number | string | null;
  games_guest?: number | string | null;
  matches_home?: number | string | null;
  matches_guest?: number | string | null;

  set1_home?: number | string | null;
  set1_guest?: number | string | null;
  set2_home?: number | string | null;
  set2_guest?: number | string | null;
  set3_home?: number | string | null;
  set3_guest?: number | string | null;
  set4_home?: number | string | null;
  set4_guest?: number | string | null;
  set5_home?: number | string | null;
  set5_guest?: number | string | null;

  mm_player11?: RawPlayer | null;
  mm_player12?: RawPlayer | null;
  mm_player21?: RawPlayer | null;
  mm_player22?: RawPlayer | null;

  home_wo?: boolean | null;
  guest_wo?: boolean | null;
};

type MeetingDetails = {
  live?: boolean | null;
  is_completed?: boolean | null;
  is_meeting_complete?: boolean | null;
  results_available?: boolean | null;

  team_home?: string | null;
  team_guest?: string | null;

  matches_home?: number | string | null;
  matches_guest?: number | string | null;
  sets_home?: number | string | null;
  sets_guest?: number | string | null;
  games_home?: number | string | null;
  games_guest?: number | string | null;

  meeting_id?: number | string | null;
  meeting_number?: number | string | null;
  start_date?: string | null;
  scheduled?: string | null;
  group_name?: string | null;
  play_mode?: string | null;

  location?: {
    label?: string | null;
    city?: string | null;
    street?: string | null;
    zip?: string | null;
  } | null;

  match?: RawMeetingMatch[] | null;
};

type MatchRow = {
  id: string;
  name: string;
  type: 'single' | 'double' | 'other';
  homePlayer: string;
  awayPlayer: string;
  result: string;
  sets: string[];
  games: string | null;
  winner: 'home' | 'guest' | null;
};

export default function MatchDetailsScreen() {
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const { colors } = useTheme();
  const { t } = useI18n();

  const meetingId = getParam(params.meetingId);

  const [meeting, setMeeting] = useState<MeetingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadMeeting() {
      if (!meetingId) {
        setLoading(false);
        setError(t('match.meetingIdMissing'));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await ttApi.getMeetingLive(meetingId);
        const nextMeeting = unwrapMeetingResponse(response);

        if (!nextMeeting) {
          throw new Error(t('match.unexpectedFormat'));
        }

        if (active) {
          setMeeting(nextMeeting);
        }
      } catch (loadError) {
        if (active) {
          setMeeting(null);
          setError(loadError instanceof Error ? loadError.message : t('match.liveLoadError'));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMeeting().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [meetingId, t]);

  const lines = useMemo(() => normalizeMeetingRows(meeting, t), [meeting, t]);
  const singles = useMemo(() => lines.filter((line) => line.type !== 'double'), [lines]);
  const doubles = useMemo(() => lines.filter((line) => line.type === 'double'), [lines]);

  const homeTeam = meeting?.team_home ?? getParam(params.homeTeam) ?? t('match.home');
  const awayTeam = meeting?.team_guest ?? getParam(params.awayTeam) ?? getParam(params.guestTeam) ?? t('match.away');

  const homeMatches = toNumber(meeting?.matches_home);
  const guestMatches = toNumber(meeting?.matches_guest);

  const mainScore =
      homeMatches !== undefined && guestMatches !== undefined
          ? `${homeMatches}:${guestMatches}`
          : 'vs';

  const summaryParts = [
    formatLabeledPair(t('match.sets'), meeting?.sets_home, meeting?.sets_guest),
    formatLabeledPair(t('match.balls'), meeting?.games_home, meeting?.games_guest),
  ].filter(Boolean) as string[];

  const startText = formatDateTime(meeting?.start_date ?? meeting?.scheduled);
  const locationText = formatLocation(meeting);
  const statusText = formatStatus(meeting, t);

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <BackButton />

            <Text style={[styles.title, { color: colors.text }]}>{t('match.detailsTitle')}</Text>
          </View>

          <Card style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.teamsRow}>
              <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={3}>
                {homeTeam}
              </Text>

              <View style={[styles.scorePill, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder }]}>
                <Text style={[styles.scoreText, { color: colors.primary }]}>{mainScore}</Text>
                <Text style={[styles.scoreLabel, { color: colors.mutedText }]}>{statusText}</Text>
              </View>

              <Text style={[styles.teamName, styles.awayTeam, { color: colors.text }]} numberOfLines={3}>
                {awayTeam}
              </Text>
            </View>

            {summaryParts.length > 0 ? (
                <Text style={[styles.scoreSummary, { color: colors.mutedText }]}>{summaryParts.join(' · ')}</Text>
            ) : null}

            <Text style={[styles.meetingId, { color: colors.mutedText }]}>
              Meeting #{meeting?.meeting_id ?? meetingId}
            </Text>
          </Card>

          {!loading && !error ? (
              <View style={styles.infoPills}>
                {startText ? <InfoPill icon="time-outline" text={startText} /> : null}
                {meeting?.group_name ? <InfoPill icon="trophy-outline" text={meeting.group_name} /> : null}
                {locationText ? <InfoPill icon="location-outline" text={locationText} /> : null}
              </View>
          ) : null}

          {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

          {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

          {!loading && !error && lines.length === 0 ? (
              <EmptyState
                  icon="analytics-outline"
                  title={t('match.noLines')}
                  subtitle={t('match.noLinesSubtitle')}
              />
          ) : null}

          {!loading && !error && singles.length > 0 ? <MatchSection title={t('match.singlesMatches')} rows={singles} /> : null}
          {!loading && !error && doubles.length > 0 ? <MatchSection title={t('match.doublesMatches')} rows={doubles} /> : null}
        </ScrollView>
      </Screen>
  );
}

function BackButton() {
  const { colors } = useTheme();
  const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {};

  return (
      <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [
            styles.backButton,
            noWebOutline,
            {
              backgroundColor: pressed ? colors.primarySoft : 'transparent',
              borderColor: pressed ? colors.primarySoftBorder : colors.border,
            },
          ]}
      >
        <Ionicons name="arrow-back" size={23} color={colors.text} />
      </Pressable>
  );
}

function MatchSection({ title, rows }: { title: string; rows: MatchRow[] }) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
      <Card style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>

        <View style={styles.rows}>
          {rows.map((row, index) => {
            const isLast = index === rows.length - 1;
            const homeColor = row.winner === 'home' ? colors.primary : colors.text;
            const awayColor = row.winner === 'guest' ? colors.primary : colors.text;
            const playerLines = row.type === 'double' ? 3 : 2;

            return (
                <View
                    key={row.id}
                    style={[
                      styles.matchLine,
                      {
                        borderBottomColor: colors.border,
                        borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                      },
                    ]}
                >
                  <View style={styles.matchMetaRow}>
                    <Text style={[styles.matchName, { color: colors.mutedText }]}>{row.name}</Text>
                    <Text style={[styles.matchType, { color: colors.mutedText }]}>
                      {row.type === 'double' ? t('match.doubles') : t('match.singles')}
                    </Text>
                  </View>

                  <View style={styles.playersRow}>
                    <Text style={[styles.playerName, { color: homeColor }]} numberOfLines={playerLines}>
                      {row.homePlayer}
                    </Text>

                    <Badge tone="secondary">{row.result}</Badge>

                    <Text style={[styles.playerName, styles.awayPlayer, { color: awayColor }]} numberOfLines={playerLines}>
                      {row.awayPlayer}
                    </Text>
                  </View>

                  {row.sets.length > 0 || row.games ? (
                      <Text style={[styles.sets, { color: colors.mutedText }]}>
                        {[row.sets.length > 0 ? row.sets.join(' · ') : null, row.games].filter(Boolean).join('   ·   ')}
                      </Text>
                  ) : null}
                </View>
            );
          })}
        </View>
      </Card>
  );
}

function InfoPill({ icon, text }: { icon: IconName; text: string }) {
  const { colors } = useTheme();

  return (
      <View style={[styles.infoPill, { borderColor: colors.border }]}>
        <Ionicons name={icon} size={15} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.mutedText }]} numberOfLines={2}>
          {text}
        </Text>
      </View>
  );
}

function normalizeMeetingRows(meeting: MeetingDetails | null, t: ReturnType<typeof useI18n>['t']): MatchRow[] {
  const matches = Array.isArray(meeting?.match) ? meeting.match : [];

  return matches.map((match, index) => {
    const type = match.game_type === 'double' ? 'double' : match.game_type === 'single' ? 'single' : 'other';

    const setsHome = toNumber(match.sets_home);
    const setsGuest = toNumber(match.sets_guest);
    const matchesHome = toNumber(match.matches_home);
    const matchesGuest = toNumber(match.matches_guest);

    const setScores = buildSetScores(match);

    const hasResult =
        setsHome !== undefined &&
        setsGuest !== undefined &&
        (setsHome !== 0 || setsGuest !== 0 || setScores.length > 0);

    const winner =
        matchesHome !== undefined && matchesGuest !== undefined && matchesHome !== matchesGuest
            ? matchesHome > matchesGuest
                ? 'home'
                : 'guest'
            : setsHome !== undefined && setsGuest !== undefined && setsHome !== setsGuest
                ? setsHome > setsGuest
                    ? 'home'
                    : 'guest'
                : null;

    const games = formatLabeledPair(t('match.balls'), match.games_home, match.games_guest);

    return {
      id: match.match_uuid ?? `${match.match_name ?? 'match'}-${index}`,
      name: match.match_name ?? t('match.matchNumber', { number: index + 1 }),
      type,
      homePlayer: formatSide([match.mm_player11, match.mm_player12], match.home_wo ? t('match.walkover') : t('match.home')),
      awayPlayer: formatSide([match.mm_player21, match.mm_player22], match.guest_wo ? t('match.walkover') : t('match.away')),
      result: hasResult ? `${setsHome}:${setsGuest}` : '-',
      sets: setScores,
      games,
      winner,
    };
  });
}

function buildSetScores(match: RawMeetingMatch): string[] {
  const scores: string[] = [];

  for (let setNumber = 1; setNumber <= 5; setNumber += 1) {
    const home = toNumber(match[`set${setNumber}_home` as keyof RawMeetingMatch]);
    const guest = toNumber(match[`set${setNumber}_guest` as keyof RawMeetingMatch]);

    if (home === undefined || guest === undefined) continue;
    if (home === 0 && guest === 0) continue;

    scores.push(`${home}:${guest}`);
  }

  return scores;
}

function formatSide(players: Array<RawPlayer | null | undefined>, fallback: string): string {
  const names = players.map(formatPlayer).filter(Boolean);

  if (names.length === 0) {
    return fallback;
  }

  return names.join('\n');
}

function formatPlayer(player: RawPlayer | null | undefined): string | null {
  if (!player) return null;

  const name = [player.firstname, player.lastname]
      .map((part) => (typeof part === 'string' ? part.trim() : ''))
      .filter(Boolean)
      .join(' ');

  return name.length > 0 ? name : null;
}

function unwrapMeetingResponse(response: unknown): MeetingDetails | null {
  const root = asRecord(response);
  if (!root) return null;

  const data = asRecord(root.data);
  const candidates = [data?.data, root.data, response];

  for (const candidate of candidates) {
    const record = asRecord(candidate);

    if (!record) continue;

    const looksLikeMeeting =
        Array.isArray(record.match) ||
        typeof record.team_home === 'string' ||
        typeof record.team_guest === 'string' ||
        record.meeting_id !== undefined;

    if (looksLikeMeeting) {
      return record as MeetingDetails;
    }
  }

  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function formatLabeledPair(label: string, home: unknown, guest: unknown): string | null {
  const homeValue = toNumber(home);
  const guestValue = toNumber(guest);

  if (homeValue === undefined || guestValue === undefined) {
    return null;
  }

  return `${label} ${homeValue}:${guestValue}`;
}

function formatDateTime(value: string | null | undefined): string | null {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatLocation(meeting: MeetingDetails | null): string | null {
  const location = meeting?.location;

  if (!location) {
    return null;
  }

  const hall = typeof location.label === 'string' ? location.label.trim() : '';
  const city = typeof location.city === 'string' ? location.city.trim() : '';

  return [hall, city].filter(Boolean).join(', ') || null;
}

function formatStatus(meeting: MeetingDetails | null, t: ReturnType<typeof useI18n>['t']): string {
  if (meeting?.live) {
    return t('status.live');
  }

  if (meeting?.is_completed || meeting?.is_meeting_complete) {
    return t('match.finalScore');
  }

  if (meeting?.results_available) {
    return t('match.result');
  }

  return t('status.scheduled');
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
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '800',
  },
  scoreCard: {
    padding: 22,
    gap: 12,
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
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
  },
  awayTeam: {
    textAlign: 'center',
  },
  scorePill: {
    minWidth: 72,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 2,
  },
  scoreText: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },
  scoreLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  scoreSummary: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  meetingId: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
  },
  infoPills: {
    gap: 8,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
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
    gap: 7,
  },
  matchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchName: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
  },
  matchType: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
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
    fontWeight: '800',
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
