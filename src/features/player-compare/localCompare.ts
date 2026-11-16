import type { HeadToHeadResult } from '@/src/api/myttDirect';
import type { PlayerTtrHistoryResponse, PlayerTtrResponse } from '@/src/types/tttracker';
import type { HeadToHeadData, PlayerCompareSide, PlayerComparisonData, RecentEvent } from './types';
import { isRecord, numberFromUnknown } from './utils';

// Gegenstück zum Vergleich im Backend (playerRoutes.ts), für den Fall, dass die myTischtennis Session
// auf dem Gerät liegt und das Backend keinen Cookie hat. Liefert dieselbe Form wie das Backend.

function eventTimestamp(event: unknown) {
  const value = isRecord(event) ? event.event_date_time : undefined;
  const timestamp = typeof value === 'string' ? Date.parse(value) : Number.NaN;

  return Number.isFinite(timestamp) ? timestamp : null;
}

// Die letzten zehn Events, ältestes zuerst. Ohne Datum bleibt die Reihenfolge von myTischtennis.
function getRecentEvents(events: unknown[]): RecentEvent[] {
  const sorted = events
      .map((event, index) => ({ event, index, timestamp: eventTimestamp(event) }))
      .sort((left, right) => {
        if (left.timestamp === null || right.timestamp === null) return left.index - right.index;

        return left.timestamp - right.timestamp;
      })
      .map((item) => item.event as RecentEvent);

  return sorted.slice(-10);
}

function buildSide(nuid: string, ttrResponse: PlayerTtrResponse, historyResponse: PlayerTtrHistoryResponse): PlayerCompareSide {
  const ttr = ttrResponse.data;
  const history = historyResponse.data;
  const currentTtr = ttr.ttr ?? history.ttr;

  return {
    nuid,
    available: {
      ttr: !ttr.error && currentTtr !== null,
      history: !history.error,
      any: (!ttr.error && currentTtr !== null) || !history.error,
    },
    identity: { personName: history.personName, clubName: history.clubName },
    ratings: {
      currentTtr,
      qttr: history.qttr,
      qttrDate: history.qttrDate ?? null,
      maxTtr: history.maxTtr,
      maxTtrDate: history.maxTtrDate,
      ttrDate: history.ttrDate,
    },
    history: {
      stats: { eventCount: history.events.length },
      recentEvents: getRecentEvents(history.events),
    },
    error: { ttr: ttr.error ?? null, history: history.error ?? null },
  };
}

function getOwnOtherScore(item: unknown) {
  const record = isRecord(item) ? item : {};

  for (const key of ['set_points', 'points']) {
    const group = isRecord(record[key]) ? (record[key] as Record<string, unknown>) : {};
    const own = numberFromUnknown(group.own);
    const other = numberFromUnknown(group.other);

    if (own !== undefined && other !== undefined) return { left: own, right: other };
  }

  for (const key of ['result', 'ergebnis', 'score', 'match_result']) {
    const match = typeof record[key] === 'string' ? /(\d+)\s*[:.-]\s*(\d+)/.exec(record[key] as string) : null;

    if (match) return { left: Number(match[1]), right: Number(match[2]) };
  }

  return null;
}

function roundRate(value: number) {
  return Math.round(value * 1000) / 1000;
}

function buildHeadToHead(leftNuid: string, rightNuid: string, result: HeadToHeadResult | null): HeadToHeadData {
  const items = result?.data ?? [];
  let parsed = 0;
  let leftWins = 0;
  let rightWins = 0;
  let draws = 0;

  for (const item of items) {
    const score = getOwnOtherScore(item);

    if (!score) continue;

    parsed += 1;

    if (score.left > score.right) leftWins += 1;
    else if (score.right > score.left) rightWins += 1;
    else draws += 1;
  }

  return {
    available: result !== null && !result.error,
    perspective: {
      note: `myTischtennis liefert Head-to-Head nur aus Sicht des eingeloggten Users gegen ${rightNuid}. Der Block passt nur dann genau, wenn ${leftNuid} der eingeloggte User ist.`,
    },
    stats: {
      itemCount: items.length,
      parsedItemCount: parsed,
      leftWins,
      rightWins,
      draws,
      leftWinRate: parsed === 0 ? null : roundRate(leftWins / parsed),
      rightWinRate: parsed === 0 ? null : roundRate(rightWins / parsed),
    },
    items,
    error: result?.error ? String(result.error) : null,
  };
}

export function buildLocalComparison(params: {
  leftNuid: string;
  rightNuid: string;
  leftTtr: PlayerTtrResponse;
  rightTtr: PlayerTtrResponse;
  leftHistory: PlayerTtrHistoryResponse;
  rightHistory: PlayerTtrHistoryResponse;
  headToHead: HeadToHeadResult | null;
}): PlayerComparisonData {
  const left = buildSide(params.leftNuid, params.leftTtr, params.leftHistory);
  const right = buildSide(params.rightNuid, params.rightTtr, params.rightHistory);

  return {
    left,
    right,
    comparison: {
      sameClub:
          Boolean(left.identity?.clubName) && Boolean(right.identity?.clubName) && left.identity?.clubName === right.identity?.clubName,
    },
    headToHead: buildHeadToHead(params.leftNuid, params.rightNuid, params.headToHead),
  };
}
