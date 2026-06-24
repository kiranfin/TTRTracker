import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ttApi } from '../../src/api/tttracker';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import type { TranslationKey } from '../../src/i18n';
import { useI18n } from '../../src/i18n/I18nProvider';
import { getMePlayerNuid } from '../../src/storage/mePlayer';
import { useTheme } from '../../src/theme/ThemeProvider';
import type {
  NormalizedPlayerTtrHistory,
  NormalizedTtrHistoryEvent,
  ScheduleMatch,
} from '../../src/types/tttracker';
import {
  formatDate,
  normalizePlayerTtrHistory,
  normalizeSchedule,
} from '../../src/utils/normalizers';
import { getMeClub } from '../../src/storage/meClub';
import type { MeClub } from '../../src/storage/meClub';

type RichObject = Record<string, unknown>;

type ClubReference = {
  organization: string;
  clubNumber: string;
  title?: string;
  state?: string;
  clubSlug?: string;
};

type HomeClubMatch = ScheduleMatch & {
  clubTeamName?: string;
  leagueName?: string;
  roundName?: string;
  meetingNumber?: string;
};

const TEAM_HOME_KEYS = [
  'team_home',
  'teamHome',
  'home_team',
  'homeTeam',
  'home',
  'home_name',
  'teamHomeName',
  'team_home_name',
];

const TEAM_AWAY_KEYS = [
  'team_away',
  'teamAway',
  'away_team',
  'awayTeam',
  'away',
  'away_name',
  'teamAwayName',
  'team_away_name',
];

const MEETING_ID_KEYS = [
  'meeting_id',
  'meetingId',
  'meeting',
  'id',
  'game_id',
  'gameId',
  'match_id',
  'matchId',
];

const MEETING_DATE_KEYS = [
  'date',
  'meeting_date',
  'meetingDate',
  'start_date',
  'startDate',
  'datetime',
  'date_time',
  'dateTime',
  'start_time',
  'startTime',
];

const statusLabelKeys = {
  completed: 'status.completed',
  live: 'status.live',
  free: 'status.free',
  postponed: 'status.postponed',
  scheduled: 'status.scheduled',
} as const satisfies Record<ScheduleMatch['status'], TranslationKey>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getPlayerHistoryData(response: unknown) {
  if (isRecord(response) && isRecord(response.data)) {
    return response.data;
  }

  if (isRecord(response)) {
    return response;
  }

  return null;
}

function parseOptionalNumber(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value !== 'string') return undefined;

  const cleaned = value.trim().replace(/[^\d,.-]/g, '');

  if (!cleaned) return undefined;

  const normalized =
      cleaned.includes(',') && cleaned.includes('.')
          ? cleaned.replace(/\./g, '').replace(',', '.')
          : cleaned.includes(',') && !cleaned.includes('.')
              ? cleaned.replace(',', '.')
              : /^\d{1,3}(\.\d{3})+$/.test(cleaned)
                  ? cleaned.replace(/\./g, '')
                  : cleaned;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatOptionalNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '—';
}

function formatSignedNumber(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return value > 0 ? `+${value}` : String(value);
}

function getEventTtr(event: NormalizedTtrHistoryEvent) {
  return event.ttrAfter ?? event.ttr;
}

function formatPersonName(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) return '';

  if (trimmed.includes(',')) {
    const [lastName, ...firstNameParts] = trimmed.split(',');
    const firstName = firstNameParts.join(',').trim();
    const lastNameClean = lastName.trim();

    if (firstName && lastNameClean) {
      return `${firstName} ${lastNameClean}`;
    }
  }

  return trimmed;
}

function getFirstName(value?: string | null) {
  const formatted = formatPersonName(value);

  if (!formatted) return '';

  return formatted.split(/\s+/)[0] ?? '';
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();

  const [meNuid, setMeNuid] = useState<string | null>(null);
  const [meHistory, setMeHistory] = useState<NormalizedPlayerTtrHistory | null>(null);
  const [meApiHistoryData, setMeApiHistoryData] = useState<Record<string, unknown> | null>(null);
  const [meLoading, setMeLoading] = useState(false);
  const [meError, setMeError] = useState<string | null>(null);

  const [meClub, setMeClub] = useState<MeClub | null>(null);
  const [clubCompletedMatches, setClubCompletedMatches] = useState<HomeClubMatch[]>([]);
  const [clubLoading, setClubLoading] = useState(false);
  const [clubError, setClubError] = useState<string | null>(null);

  useFocusEffect(
      useCallback(() => {
        let active = true;

        async function loadMe() {
          setMeLoading(true);
          setMeError(null);

          try {
            const storedNuid = await getMePlayerNuid();

            if (!active) return;

            setMeNuid(storedNuid);

            if (!storedNuid) {
              setMeHistory(null);
              setMeApiHistoryData(null);
              return;
            }

            const response = await ttApi.getPlayerTtrHistory(storedNuid);

            if (!active) return;

            setMeApiHistoryData(getPlayerHistoryData(response));
            setMeHistory(normalizePlayerTtrHistory(response));
          } catch (error) {
            if (!active) return;

            setMeHistory(null);
            setMeApiHistoryData(null);
            setMeError(
                error instanceof Error
                    ? error.message
                    : t('home.quickStatsError'),
            );
          } finally {
            if (active) {
              setMeLoading(false);
            }
          }
        }

        loadMe().catch(() => undefined);

        return () => {
          active = false;
        };
      }, []),
  );

  useFocusEffect(
      useCallback(() => {
        let active = true;

        async function loadStoredClub() {
          try {
            const stored = await getMeClub();

            if (!active) return;

            setMeClub(stored);
          } catch {
            if (!active) return;

            setMeClub(null);
          }
        }

        loadStoredClub().catch(() => undefined);

        return () => {
          active = false;
        };
      }, []),
  );

  const displayName = formatPersonName(meHistory?.personName) || t('home.profileFallback');
  const firstName = meHistory?.personName ? getFirstName(meHistory.personName) : '';
  const clubName = meHistory?.clubName;

  const currentTtr =
      parseOptionalNumber(meHistory?.ttr) ??
      parseOptionalNumber(meApiHistoryData?.ttr);

  const qTtr =
      parseOptionalNumber(meHistory?.qttr) ??
      parseOptionalNumber(meApiHistoryData?.qttr);

  const maxTtr =
      parseOptionalNumber(meHistory?.maxTtr) ??
      parseOptionalNumber(meApiHistoryData?.maxTtr);

  const recentEvents = useMemo(() => {
    return [...(meHistory?.events ?? [])].reverse().slice(0, 2);
  }, [meHistory?.events]);

  useEffect(() => {
    let active = true;

    async function loadClubMatches() {
      if (!meClub?.organization || !meClub.clubNumber) {
        setClubCompletedMatches([]);
        setClubError(null);
        setClubLoading(false);
        return;
      }

      setClubLoading(true);
      setClubError(null);
      setClubCompletedMatches([]);

      try {
        const season = meClub.season ?? getCurrentBackendSeason();
        const dateRange = getDefaultSeasonDateRange(season);

        const response = await ttApi.getClubSchedule(
            meClub.organization,
            meClub.clubNumber,
            season,
            dateRange.dateStart,
            dateRange.dateEnd,
            meClub.clubSlug ?? 'x',
        );

        if (!active) return;

        const matches = normalizeHomeClubSchedule(response)
            .filter(isCompletedClubMatch)
            .sort(compareMatchesNewestFirst)
            .slice(0, 3);

        setClubCompletedMatches(matches);
      } catch (error) {
        if (!active) return;

        setClubCompletedMatches([]);
        setClubError(
            error instanceof Error
                ? error.message
                : t('home.clubMatchesError'),
        );
      } finally {
        if (active) {
          setClubLoading(false);
        }
      }
    }

    loadClubMatches().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [meClub]);

  function openMeProfile() {
    if (!meNuid) {
      router.push('/settings');
      return;
    }

    router.push({
      pathname: '/(tabs)/player/[nuid]',
      params: {
        nuid: meNuid,
        title: displayName,
        clubName: clubName ?? '',
      },
    });
  }

  function openMyClub() {
    if (!meClub) {
      router.push('/search');
      return;
    }

    router.push({
      pathname: '/(tabs)/club/[clubKey]',
      params: {
        clubKey: `${meClub.organization}-${meClub.clubNumber}`,
        organization: meClub.organization,
        clubNumber: meClub.clubNumber,
        title: meClub.title ?? meClub.clubName ?? t('entities.club'),
        clubName: meClub.clubName ?? meClub.title ?? '',
        state: meClub.state ?? '',
        season: meClub.season ?? getCurrentBackendSeason(),
      },
    });
  }

  return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topArea}>
            <View style={styles.hero}>
              <Text style={[styles.heroTitle, { color: colors.text }]}>
                {t('home.welcome')}{firstName ? ` ${firstName}` : ''}
              </Text>
            </View>

            <View style={styles.shortcutGrid}>
              <ShortcutCard
                  title={t('tabs.search')}
                  icon="search"
                  iconBg="#dbeafe"
                  iconColor="#2563eb"
                  onPress={() => router.push('/search')}
              />

              <ShortcutCard
                  title={t('tabs.leagues')}
                  icon="trophy"
                  iconBg="#f3e8ff"
                  iconColor="#9333ea"
                  onPress={() => router.push('/leagues')}
              />

              <ShortcutCard
                  title={t('tabs.favorites')}
                  icon="star"
                  iconBg="#fef3c7"
                  iconColor="#d97706"
                  onPress={() => router.push('/favorites')}
              />
            </View>
          </View>

          <MeQuickStatsCard
              meNuid={meNuid}
              displayName={displayName}
              clubName={clubName}
              currentTtr={currentTtr}
              qTtr={qTtr}
              maxTtr={maxTtr}
              recentEvents={recentEvents}
              loading={meLoading}
              error={meError}
              onOpenProfile={openMeProfile}
              onOpenSettings={() => router.push('/settings')}
          />

          <ClubQuickStatsCard
              meNuid={meNuid}
              clubName={meClub?.title ?? meClub?.clubName ?? clubName}
              hasSavedClub={Boolean(meClub)}
              matches={clubCompletedMatches}
              loading={clubLoading}
              error={clubError}
              onOpenClub={openMyClub}
              onOpenSearch={() => router.push('/search')}
          />
        </ScrollView>
      </Screen>
  );
}

type ShortcutCardProps = {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  onPress: () => void;
};

function ShortcutCard({
                        title,
                        icon,
                        iconBg,
                        iconColor,
                        onPress,
                      }: ShortcutCardProps) {
  const { colors } = useTheme();

  return (
      <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.shortcutCard,
            {
              backgroundColor: pressed ? colors.primarySoft : colors.card,
              borderColor: pressed ? colors.primarySoftBorder : colors.border,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
      >
        <View style={[styles.shortcutIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>

        <Text style={[styles.shortcutTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
      </Pressable>
  );
}

type MeQuickStatsCardProps = {
  meNuid: string | null;
  displayName: string;
  clubName?: string | null;
  currentTtr?: number;
  qTtr?: number;
  maxTtr?: number;
  recentEvents: NormalizedTtrHistoryEvent[];
  loading: boolean;
  error: string | null;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
};

function MeQuickStatsCard({
                            meNuid,
                            displayName,
                            clubName,
                            currentTtr,
                            qTtr,
                            maxTtr,
                            recentEvents,
                            loading,
                            error,
                            onOpenProfile,
                            onOpenSettings,
                          }: MeQuickStatsCardProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  if (!meNuid) {
    return (
        <Card style={styles.emptyMeCard}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="person-add-outline" size={24} color={colors.primary} />
          </View>

          <View style={styles.emptyTextBlock}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t('home.missingProfileTitle')}
            </Text>

            <Text style={[styles.emptySubtitle, { color: colors.mutedText }]}>
              {t('home.missingProfileSubtitle')}
            </Text>
          </View>

          <Button variant="primary" icon="settings-outline" onPress={onOpenSettings}>
            {t('home.setNuid')}
          </Button>
        </Card>
    );
  }

  return (
      <Card style={styles.meCard}>
        <View style={styles.meHeader}>
          <View style={styles.meHeaderText}>
            <Text style={[styles.meTitle, { color: colors.text }]} numberOfLines={1}>
              {displayName}
            </Text>

            <Text style={[styles.meSubtitle, { color: colors.mutedText }]} numberOfLines={1}>
              {clubName ?? t('entities.clubUnknown')}
            </Text>
          </View>

          <Pressable
              onPress={onOpenProfile}
              hitSlop={10}
              style={({ pressed }) => [
                styles.profileButton,
                {
                  backgroundColor: pressed ? colors.primarySoft : colors.muted,
                  borderColor: pressed ? colors.primarySoftBorder : colors.border,
                },
              ]}
          >
            <Ionicons name="open-outline" size={19} color={colors.text} />
          </Pressable>
        </View>

        {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />

              <Text style={[styles.homeBody, { color: colors.mutedText }]}>
                {t('home.loadingMyData')}
              </Text>
            </View>
        ) : error ? (
            <>
              <Text style={[styles.homeBody, { color: colors.destructive }]}>
                {error}
              </Text>

              <Button variant="outline" icon="settings-outline" onPress={onOpenSettings}>
                {t('home.checkNuid')}
              </Button>
            </>
        ) : (
            <>
              <View style={styles.ttrOverview}>
                <View
                    style={[
                      styles.primaryTtrTile,
                      {
                        backgroundColor: colors.primarySoft,
                        borderColor: colors.primarySoftBorder,
                      },
                    ]}
                >
                  <Text style={[styles.primaryTtrLabel, { color: colors.primary }]}>
                    {t('home.currentTtr')}
                  </Text>

                  <Text style={[styles.primaryTtrValue, { color: colors.text }]}>
                    {formatOptionalNumber(currentTtr)}
                  </Text>
                </View>

                <View style={styles.secondaryStats}>
                  <MiniStat label="Q-TTR" value={formatOptionalNumber(qTtr)} />
                  <MiniStat label="Peak" value={formatOptionalNumber(maxTtr)} />
                </View>
              </View>

              <View style={styles.historyHeader}>
                <Text style={[styles.historyTitle, { color: colors.text }]}>
                  {t('home.lastEntries')}
                </Text>

                <Pressable onPress={onOpenProfile} hitSlop={8}>
                  <Text style={[styles.historyLink, { color: colors.primary }]}>
                    {t('common.viewAll')}
                  </Text>
                </Pressable>
              </View>

              {recentEvents.length > 0 ? (
                  <View style={styles.recentList}>
                    {recentEvents.map((event) => (
                        <RecentHistoryRow key={event.id} event={event} />
                    ))}
                  </View>
              ) : (
                  <Text style={[styles.homeBody, { color: colors.mutedText }]}>
                    {t('home.noHistoryEntries')}
                  </Text>
              )}
            </>
        )}
      </Card>
  );
}

function ClubQuickStatsCard({
                              meNuid,
                              clubName,
                              hasSavedClub,
                              matches,
                              loading,
                              error,
                              onOpenClub,
                              onOpenSearch,
                            }: {
  meNuid: string | null;
  clubName?: string | null;
  hasSavedClub: boolean;
  matches: HomeClubMatch[];
  loading: boolean;
  error: string | null;
  onOpenClub: () => void;
  onOpenSearch: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();

  if (!meNuid) {
    return null;
  }

  if (!hasSavedClub) {
    return (
        <Card style={styles.clubCard}>
          <View style={styles.clubHeader}>
            <View style={styles.clubHeaderText}>
              <Text style={[styles.clubTitle, { color: colors.text }]}>
                {t('home.noClubTitle')}
              </Text>

              <Text style={[styles.clubSubtitle, { color: colors.mutedText }]}>
                {t('home.noClubSubtitle')}
              </Text>
            </View>
          </View>

          <Button variant="primary" icon="search-outline" onPress={onOpenSearch}>
            {t('home.searchClub')}
          </Button>
        </Card>
    );
  }

  return (
      <Card style={styles.clubCard}>
        <View style={styles.clubHeader}>
          <View style={styles.clubHeaderText}>
            <Text style={[styles.clubTitle, { color: colors.text }]} numberOfLines={1}>
              {clubName ?? t('entities.clubUnknown')}
            </Text>

            <Text style={[styles.clubSubtitle, { color: colors.mutedText }]} numberOfLines={1}>
              {t('home.latestCompletedMatches')}
            </Text>
          </View>

          <Pressable
              onPress={onOpenClub}
              hitSlop={10}
              style={({ pressed }) => [
                styles.profileButton,
                {
                  backgroundColor: pressed ? colors.primarySoft : colors.muted,
                  borderColor: pressed ? colors.primarySoftBorder : colors.border,
                },
              ]}
          >
            <Ionicons name="open-outline" size={19} color={colors.text} />
          </Pressable>
        </View>

        {loading ? (
            <View style={styles.clubLoadingBox}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.homeBody, { color: colors.mutedText }]}>
                {t('home.loadingClubMatches')}
              </Text>
            </View>
        ) : error ? (
            <View style={styles.clubMessageBox}>
              <Text style={[styles.homeBody, { color: colors.destructive }]}>
                {error}
              </Text>

              <Button variant="outline" icon="search-outline" onPress={onOpenSearch}>
                {t('home.searchClub')}
              </Button>
            </View>
        ) : matches.length > 0 ? (
            <View style={styles.clubMatchList}>
              {matches.map((match, index) => (
                  <ClubCompletedMatchRow
                      key={`${match.id ?? 'match'}-${match.date ?? 'date'}-${index}`}
                      match={match}
                  />
              ))}
            </View>
        ) : (
            <Text style={[styles.homeBody, { color: colors.mutedText }]}>
              {t('home.noCompletedMatches')}
            </Text>
        )}
      </Card>
  );
}

function MiniStat({
                    label,
                    value,
                  }: {
  label: string;
  value: string;
}) {
  const { colors } = useTheme();

  return (
      <View style={[styles.miniStat, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Text style={[styles.miniStatLabel, { color: colors.mutedText }]}>
          {label}
        </Text>

        <Text style={[styles.miniStatValue, { color: colors.text }]}>
          {value}
        </Text>
      </View>
  );
}

function RecentHistoryRow({ event }: { event: NormalizedTtrHistoryEvent }) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const delta = event.delta;
  const deltaColor =
      typeof delta === 'number' && delta > 0
          ? '#16a34a'
          : typeof delta === 'number' && delta < 0
              ? colors.destructive
              : colors.mutedText;

  return (
      <View style={[styles.recentRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <View style={styles.recentMain}>
          <Text style={[styles.recentTitle, { color: colors.text }]} numberOfLines={1}>
            {event.meetingLabel ?? event.title ?? t('home.historyEntry')}
          </Text>

          <Text style={[styles.recentMeta, { color: colors.mutedText }]} numberOfLines={1}>
            {event.date ? formatDate(event.date) : t('common.dateUnknown')}
            {event.leagueName ? ` · ${event.leagueName}` : ''}
          </Text>
        </View>

        <View style={styles.recentScore}>
          <Text style={[styles.recentTtr, { color: colors.text }]}>
            {getEventTtr(event) ?? '—'}
          </Text>

          <Text style={[styles.recentDelta, { color: deltaColor }]}>
            {formatSignedNumber(delta)}
          </Text>
        </View>
      </View>
  );
}

function ClubCompletedMatchRow({ match }: { match: HomeClubMatch }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const canOpen = Boolean(match.id) && match.status !== 'free';

  return (
      <Pressable
          disabled={!canOpen}
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
          style={({ pressed }) => [
            styles.clubMatchRow,
            {
              backgroundColor: colors.muted,
              borderColor: colors.border,
              opacity: pressed && canOpen ? 0.78 : 1,
            },
          ]}
      >
        <View style={styles.clubMatchTopRow}>
          <View style={styles.clubMatchMeta}>
            <Ionicons name="calendar-outline" size={13} color={colors.mutedText} />
            <Text style={[styles.clubMatchMetaText, { color: colors.mutedText }]} numberOfLines={1}>
              {match.date ? formatDate(match.date) : t('common.dateUnknown')}
              {match.time ? ` · ${match.time}` : ''}
            </Text>
          </View>

          <View style={[styles.completedPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.completedPillText, { color: colors.mutedText }]}>
              {t(statusLabelKeys[match.status])}
            </Text>
          </View>
        </View>

        <View style={styles.clubMatchScoreRow}>
          <Text style={[styles.clubMatchTeam, { color: colors.text }]} numberOfLines={2}>
            {match.homeTeam}
          </Text>

          <View style={[styles.clubScoreBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.clubScoreText, { color: colors.text }]}>
              {match.homeScore ?? '-'}
            </Text>

            <Text style={[styles.clubScoreDivider, { color: colors.mutedText }]}>:</Text>

            <Text style={[styles.clubScoreText, { color: colors.text }]}>
              {match.awayScore ?? '-'}
            </Text>
          </View>

          <Text
              style={[styles.clubMatchTeam, styles.clubMatchAwayTeam, { color: colors.text }]}
              numberOfLines={2}
          >
            {match.awayTeam}
          </Text>
        </View>

        {match.leagueName || match.roundName || match.meetingNumber ? (
            <Text style={[styles.clubMatchFooter, { color: colors.mutedText }]} numberOfLines={1}>
              {[match.leagueName, match.roundName, match.meetingNumber ? t('home.matchNumber', { number: match.meetingNumber }) : undefined]
                  .filter(Boolean)
                  .join(' • ')}
            </Text>
        ) : null}
      </Pressable>
  );
}

async function findClubReferencesByName(clubName: string) {
  const results = await ttApi.searchClubs(clubName);
  return resolveClubReferences(results as unknown[], clubName);
}

function resolveClubReferences(results: unknown[], clubName: string): ClubReference[] {
  const candidates = results
      .map((result) => normalizeClubSearchResult(result))
      .filter((result): result is ClubReference => Boolean(result));

  const targetName = normalizeComparableText(clubName);

  return [...candidates].sort((left, right) => {
    const leftScore = getClubNameScore(left.title, targetName);
    const rightScore = getClubNameScore(right.title, targetName);

    if (leftScore !== rightScore) {
      return leftScore - rightScore;
    }

    return `${left.organization}-${left.clubNumber}`.localeCompare(
        `${right.organization}-${right.clubNumber}`,
    );
  });
}

function normalizeClubSearchResult(value: unknown): ClubReference | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as RichObject;

  const title = pickString(raw, [
    'title',
    'name',
    'clubName',
    'club_name',
    'displayName',
    'display_name',
    'label',
  ]);

  const directOrganization = pickString(raw, [
    'organization',
    'association',
    'fedNickname',
    'fed_nickname',
    'federation',
    'verband',
  ]);

  const directClubNumber = pickString(raw, [
    'clubNumber',
    'club_number',
    'clubnr',
    'clubNr',
    'clubNo',
    'club_no',
    'number',
    'clubId',
    'club_id',
  ]);

  const compositeValues = [
    pickString(raw, ['id', 'key', 'clubKey', 'value']),
    pickString(raw, ['url', 'href', 'link']),
  ].filter(Boolean) as string[];

  const composite = compositeValues
      .map(extractOrganizationAndClubNumber)
      .find((entry) => entry?.organization && entry.clubNumber);

  const organization = directOrganization ?? composite?.organization;
  const clubNumber = extractClubNumber(directClubNumber) ?? composite?.clubNumber;

  if (!organization || !clubNumber) {
    return null;
  }

  return {
    organization,
    clubNumber,
    title,
    state: pickString(raw, ['state', 'bundesland', 'region']),
    clubSlug: pickString(raw, ['clubSlug', 'club_slug', 'slug']),
  };
}

function getClubNameScore(value: string | undefined, targetName: string) {
  const normalized = normalizeComparableText(value);

  if (!normalized) return 10;
  if (normalized === targetName) return 0;
  if (normalized.includes(targetName)) return 1;
  if (targetName.includes(normalized)) return 2;

  return 5;
}

function extractOrganizationAndClubNumber(value?: string) {
  const raw = String(value ?? '');
  const match = raw.match(/\b([A-ZÄÖÜ]{2,8})[:/_-](\d{4,})\b/i);

  if (!match) {
    return null;
  }

  return {
    organization: match[1].toUpperCase(),
    clubNumber: match[2],
  };
}

function extractClubNumber(value?: string) {
  const raw = String(value ?? '').trim();

  if (!raw) return undefined;

  const exact = raw.match(/^\d{4,}$/);
  if (exact) return raw;

  const match = raw.match(/\b\d{4,}\b/);
  return match?.[0];
}

function normalizeHomeClubSchedule(response: unknown) {
  const customMatches = normalizeClubScheduleResponse(response);
  const fallbackMatches = (normalizeSchedule(response) as HomeClubMatch[]).map((match) => ({
    ...match,
  }));

  return dedupeSchedule([...customMatches, ...fallbackMatches]);
}

function normalizeClubScheduleResponse(response: unknown) {
  const meetings = collectClubMeetings(response);

  return meetings
      .map((meeting, index) => normalizeClubScheduleMeeting(meeting, index))
      .filter((match): match is HomeClubMatch => Boolean(match));
}

function collectClubMeetings(value: unknown): unknown[] {
  const result: unknown[] = [];
  collectClubMeetingsInto(value, result);

  const seen = new Set<string>();

  return result.filter((item) => {
    const key = JSON.stringify(item);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function collectClubMeetingsInto(value: unknown, result: unknown[], depth = 0) {
  if (depth > 10 || value === null || value === undefined) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectClubMeetingsInto(item, result, depth + 1);
    }

    return;
  }

  if (typeof value !== 'object') {
    return;
  }

  const object = value as RichObject;

  if (looksLikeClubMeeting(object)) {
    result.push(object);
    return;
  }

  for (const key of ['meetings', 'matches', 'rows', 'items', 'data', 'meetings_by_date', 'meetingsByDate']) {
    if (key in object) {
      collectClubMeetingsInto(object[key], result, depth + 1);
    }
  }

  for (const nestedValue of Object.values(object)) {
    collectClubMeetingsInto(nestedValue, result, depth + 1);
  }
}

function looksLikeClubMeeting(row: RichObject) {
  const hasHomeTeam = Boolean(pickDeepString(row, TEAM_HOME_KEYS));
  const hasAwayTeam = Boolean(pickDeepString(row, TEAM_AWAY_KEYS));
  const hasAnyTeam = hasHomeTeam || hasAwayTeam;
  const hasId = Boolean(pickDeepString(row, MEETING_ID_KEYS));
  const hasDate = Boolean(pickDeepString(row, MEETING_DATE_KEYS));
  const hasStatus = Boolean(pickDeepString(row, ['state', 'status', 'meeting_state', 'meetingState']));

  return Boolean((hasAnyTeam && (hasDate || hasId || hasStatus)) || (hasId && hasDate));
}

function normalizeClubScheduleMeeting(value: unknown, index: number): HomeClubMatch | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as RichObject;

  const homeTeam = pickDeepString(raw, TEAM_HOME_KEYS) ?? 'Heim';
  const awayTeam = pickDeepString(raw, TEAM_AWAY_KEYS) ?? 'Gast';
  const id = pickDeepString(raw, MEETING_ID_KEYS);
  const date = pickDeepString(raw, MEETING_DATE_KEYS) ?? undefined;

  const time =
      pickDeepString(raw, ['time', 'start_time_label', 'startTimeLabel', 'start_time', 'startTime']) ??
      extractTimeFromDateValue(date);

  const homeScore = pickDeepString(raw, [
    'matches_won',
    'matchesWon',
    'home_score',
    'homeScore',
    'score_home',
    'scoreHome',
    'sets_home',
  ]);

  const awayScore = pickDeepString(raw, [
    'matches_lost',
    'matchesLost',
    'away_score',
    'awayScore',
    'score_away',
    'scoreAway',
    'sets_away',
  ]);

  const leagueName = pickDeepString(raw, [
    'league_name',
    'leagueName',
    'league',
    'group_name',
    'groupName',
    'class_name',
    'className',
  ]);

  const roundName = pickDeepString(raw, [
    'round_name',
    'roundName',
    'round',
    'game_day',
    'gameDay',
    'match_day',
    'matchDay',
  ]);

  const meetingNumber = pickDeepString(raw, [
    'meeting_number',
    'meetingNumber',
    'match_number',
    'matchNumber',
    'number',
  ]);

  const rawStatus = pickDeepString(raw, ['state', 'status', 'meeting_state', 'meetingState']);
  const status = normalizeClubMeetingStatus(rawStatus, homeScore, awayScore);

  return {
    id: id ?? `${date ?? 'no-date'}-${homeTeam}-${awayTeam}-${index}`,
    date,
    time,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    status,
    leagueName,
    roundName,
    meetingNumber,
  } as HomeClubMatch;
}

function normalizeClubMeetingStatus(
    rawStatus?: string,
    homeScore?: string,
    awayScore?: string,
): ScheduleMatch['status'] {
  const normalized = String(rawStatus ?? '').trim().toLowerCase();

  if (normalized.includes('spielfrei') || normalized.includes('frei')) {
    return 'free';
  }

  if (
      normalized.includes('beendet') ||
      normalized.includes('gespielt') ||
      normalized.includes('completed') ||
      normalized.includes('done') ||
      (homeScore !== undefined && awayScore !== undefined)
  ) {
    return 'completed';
  }

  return 'scheduled';
}

function isCompletedClubMatch(match: HomeClubMatch) {
  if (match.status === 'completed') return true;
  if (match.status === 'free') return false;

  return match.homeScore !== undefined && match.awayScore !== undefined;
}

function dedupeSchedule(matches: HomeClubMatch[]) {
  const seen = new Set<string>();
  const result: HomeClubMatch[] = [];

  for (const match of matches) {
    const key = getScheduleMatchKey(match);

    if (seen.has(key)) continue;

    seen.add(key);
    result.push(match);
  }

  return result;
}

function getScheduleMatchKey(match: HomeClubMatch) {
  return (
      [
        match.id,
        match.date,
        match.time,
        normalizeTeamKey(match.homeTeam),
        normalizeTeamKey(match.awayTeam),
        match.homeScore,
        match.awayScore,
      ]
          .filter((value) => value !== undefined && value !== null && value !== '')
          .join('|') || Math.random().toString(36)
  );
}

function compareMatchesNewestFirst(left: HomeClubMatch, right: HomeClubMatch) {
  const leftDate = parseMatchDate(left.date)?.getTime() ?? 0;
  const rightDate = parseMatchDate(right.date)?.getTime() ?? 0;

  if (leftDate !== rightDate) return rightDate - leftDate;

  return getTimeValue(right.time) - getTimeValue(left.time);
}

function getCurrentBackendSeason() {
  const now = new Date();
  const fullYear = now.getFullYear();
  const month = now.getMonth() + 1;
  const startYear = month >= 7 ? fullYear : fullYear - 1;
  const endYear = startYear + 1;

  return `${String(startYear).slice(-2)}--${String(endYear).slice(-2)}`;
}

function getDefaultSeasonDateRange(season: string) {
  const match = season.match(/^(\d{2})--(\d{2})$/);

  if (!match) {
    return {
      dateStart: '',
      dateEnd: '',
    };
  }

  return {
    dateStart: `20${match[1]}-07-01`,
    dateEnd: `20${match[2]}-06-30`,
  };
}

function pickDeepString(row: RichObject, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (value === undefined || value === null || value === '') {
      continue;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      const nested = value as RichObject;
      const nestedValue = pickString(nested, [
        'name',
        'team_name',
        'teamName',
        'label',
        'title',
        'display_name',
        'displayName',
        'value',
      ]);

      if (nestedValue !== undefined) {
        return nestedValue;
      }
    }
  }

  return undefined;
}

function pickString(row: RichObject, keys: string[]) {
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

function extractTimeFromDateValue(value?: string) {
  const raw = String(value ?? '').trim();

  const isoTime = raw.match(/T(\d{2}):(\d{2})/);
  if (isoTime) {
    return `${isoTime[1]}:${isoTime[2]}`;
  }

  const plainTime = raw.match(/\b(\d{1,2}):(\d{2})\b/);
  if (plainTime) {
    return `${plainTime[1].padStart(2, '0')}:${plainTime[2]}`;
  }

  return undefined;
}

function parseMatchDate(value?: string) {
  const raw = String(value ?? '').trim();
  if (!raw) return undefined;

  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return startOfDay(
        new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3])),
    );
  }

  const germanMatch = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
  if (germanMatch) {
    const year =
        germanMatch[3].length === 2 ? 2000 + Number(germanMatch[3]) : Number(germanMatch[3]);

    return startOfDay(new Date(year, Number(germanMatch[2]) - 1, Number(germanMatch[1])));
  }

  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? undefined : startOfDay(fallback);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getTimeValue(value?: string) {
  const raw = String(value ?? '').trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})/);

  if (!match) {
    return 0;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function normalizeTeamKey(teamName?: string) {
  return (teamName ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeComparableText(value?: string) {
  return String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
      .replace(/\s+/g, ' ');
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 96,
    gap: 14,
  },
  topArea: {
    gap: 14,
  },
  hero: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  heroTitle: {
    marginTop: 2,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 330,
  },
  shortcutGrid: {
    flexDirection: 'row',
    gap: 9,
  },
  shortcutCard: {
    flex: 1,
    minHeight: 92,
    borderRadius: 20,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  shortcutIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  shortcutTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  shortcutSubtitle: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyMeCard: {
    padding: 18,
    gap: 14,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTextBlock: {
    gap: 4,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptySubtitle: {
    maxWidth: 320,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  meCard: {
    padding: 16,
    gap: 14,
  },
  meHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  meHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  sectionEyebrow: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },
  meTitle: {
    marginTop: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
  },
  meSubtitle: {
    marginTop: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ttrOverview: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryTtrTile: {
    flex: 1.45,
    minHeight: 108,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    justifyContent: 'center',
  },
  primaryTtrLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },
  primaryTtrValue: {
    marginTop: 4,
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '900',
  },
  secondaryStats: {
    flex: 1,
    gap: 5,
  },
  miniStat: {
    flex: 1,
    minHeight: 45,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  miniStatLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  miniStatValue: {
    marginTop: 2,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },
  historyHeader: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
  },
  historyLink: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },
  recentList: {
    gap: 8,
  },
  recentRow: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recentMain: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  recentTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },
  recentMeta: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  recentScore: {
    alignItems: 'flex-end',
    minWidth: 48,
  },
  recentTtr: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
  },
  recentDelta: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },
  clubCard: {
    padding: 16,
    gap: 14,
  },
  clubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clubHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  clubTitle: {
    marginTop: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
  },
  clubSubtitle: {
    marginTop: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  clubLoadingBox: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  clubMessageBox: {
    gap: 12,
  },
  clubMatchList: {
    gap: 8,
  },
  clubMatchRow: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 11,
    gap: 9,
  },
  clubMatchTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  clubMatchMeta: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  clubMatchMetaText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  completedPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  completedPillText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.25,
  },
  clubMatchScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  clubMatchTeam: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },
  clubMatchAwayTeam: {
    textAlign: 'right',
  },
  clubScoreBox: {
    minWidth: 64,
    minHeight: 34,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  clubScoreText: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },
  clubScoreDivider: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  clubMatchFooter: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  homeBody: {
    fontSize: 14,
    lineHeight: 21,
  },
});
