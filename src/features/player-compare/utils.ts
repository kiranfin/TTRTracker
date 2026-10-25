import type { useI18n } from '@/src/i18n/I18nProvider';
import type { Leader, PlayerCompareSide, PlayerComparisonData, RecentEvent, RecentStats } from './types';

export { formatOptionalNumber, formatPercent, formatSignedAverage, formatSignedNumber } from '../player-details/utils';

type Translate = ReturnType<typeof useI18n>['t'];

// Skalierung der TTR-Differenz in der Siegchance-Formel
const WIN_CHANCE_SCALE = 150;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function unwrapComparisonResponse(response: unknown): PlayerComparisonData | null {
  if (isRecord(response) && isRecord(response.data)) {
    return response.data as PlayerComparisonData;
  }

  if (isRecord(response) && isRecord(response.left) && isRecord(response.right)) {
    return response as PlayerComparisonData;
  }

  return null;
}

export function numberFromUnknown(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;

  const parsed = Number(value.trim().replace(',', '.'));

  return Number.isFinite(parsed) ? parsed : undefined;
}

export function getPlayerName(player: PlayerCompareSide | null | undefined, t: Translate) {
  return player?.identity?.personName ?? t('player.unknownPlayer');
}

export function getClubName(player: PlayerCompareSide | null | undefined, t: Translate) {
  return player?.identity?.clubName ?? t('entities.clubUnknown');
}

export function getEvents(player?: PlayerCompareSide | null) {
  return player?.history?.recentEvents ?? [];
}

function getEventTimestamp(event: RecentEvent) {
  if (!event.event_date_time) return 0;

  const timestamp = new Date(event.event_date_time.replace(' ', 'T')).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function sortEventsNewestFirst(events: RecentEvent[]) {
  return [...events].sort((a, b) => getEventTimestamp(b) - getEventTimestamp(a));
}

function getEventMatchCount(event: RecentEvent) {
  const direct = numberFromUnknown(event.match_count);
  if (direct !== undefined) return direct;

  const wins = numberFromUnknown(event.matches_won) ?? 0;
  const losses = numberFromUnknown(event.matches_lost) ?? 0;

  if (wins + losses > 0) return wins + losses;

  return event.match?.length ?? 0;
}

function getEventWins(event: RecentEvent) {
  const direct = numberFromUnknown(event.matches_won);
  if (direct !== undefined) return direct;

  return (event.match ?? []).filter(
      (match) => isFiniteNumber(match.own_sets) && isFiniteNumber(match.other_sets) && match.own_sets > match.other_sets,
  ).length;
}

function getEventLosses(event: RecentEvent) {
  const direct = numberFromUnknown(event.matches_lost);
  if (direct !== undefined) return direct;

  return (event.match ?? []).filter(
      (match) => isFiniteNumber(match.own_sets) && isFiniteNumber(match.other_sets) && match.own_sets < match.other_sets,
  ).length;
}

export function buildRecentStats(player: PlayerCompareSide): RecentStats {
  const events = getEvents(player);
  const sortedEvents = sortEventsNewestFirst(events);

  const deltas = events
      .map((event) => numberFromUnknown(event.ttr_delta))
      .filter((value): value is number => value !== undefined);

  const wins = events.reduce((sum, event) => sum + getEventWins(event), 0);
  const losses = events.reduce((sum, event) => sum + getEventLosses(event), 0);
  const matchCount = events.reduce((sum, event) => sum + getEventMatchCount(event), 0);
  const totalRatedMatches = wins + losses;

  const totalDelta = deltas.length > 0 ? deltas.reduce((sum, value) => sum + value, 0) : undefined;

  const recentFiveDeltas = sortedEvents
      .slice(0, 5)
      .map((event) => numberFromUnknown(event.ttr_delta))
      .filter((value): value is number => value !== undefined);

  const statsEventCount = numberFromUnknown(player.history?.stats?.eventCount);

  return {
    eventCount: statsEventCount && statsEventCount > 0 ? statsEventCount : events.length,
    matchCount,
    wins,
    losses,
    winRate: totalRatedMatches > 0 ? (wins / totalRatedMatches) * 100 : undefined,
    totalDelta,
    recentDelta5:
        recentFiveDeltas.length > 0 ? recentFiveDeltas.reduce((sum, value) => sum + value, 0) : undefined,
    averageDelta: totalDelta !== undefined && deltas.length > 0 ? totalDelta / deltas.length : undefined,
    bestGain: deltas.length > 0 ? Math.max(...deltas) : undefined,
    worstLoss: deltas.length > 0 ? Math.min(...deltas) : undefined,
  };
}

// Siegwahrscheinlichkeit von Spieler A gegen B: 1 / (1 + 10^((b - a) / 150))
export function getWinChance(a?: number | null, b?: number | null) {
  if (!isFiniteNumber(a) || !isFiniteNumber(b)) return undefined;

  const left = 1 / (1 + Math.pow(10, (b - a) / WIN_CHANCE_SCALE));

  return { left, right: 1 - left };
}

// Höher ist besser. Fehlende Werte machen den Vergleich unklar.
export function getLeader(left?: number | null, right?: number | null): Leader {
  if (!isFiniteNumber(left) || !isFiniteNumber(right)) return 'unknown';
  if (left > right) return 'left';
  if (right > left) return 'right';
  return 'tie';
}
