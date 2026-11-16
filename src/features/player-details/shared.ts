import type { PlayerTtrHistoryResponse, SharedPlayerResponse } from '@/src/types/tttracker';
import type { Freshness } from '@/src/utils/staleness';

// Ein Snapshot, den jemand mit dir teilt, in der Form des eigenen Verlaufs, damit das Profil ihn
// wie einen offiziellen Verlauf anzeigt. Ohne Freigabe für den Verlauf bleibt nur der aktuelle TTR.
export function sharedToHistory(shared: SharedPlayerResponse): PlayerTtrHistoryResponse | null {
  const { nuid, history, ttr } = shared.data;

  if (history) {
    return { data: history, meta: { source: 'snapshot', fetchedAt: history.fetchedAt } };
  }

  if (ttr && ttr.ttr !== null) {
    return {
      data: {
        nuid,
        available: true,
        ttr: ttr.ttr,
        qttr: null,
        maxTtr: null,
        ttrDate: null,
        maxTtrDate: null,
        clubName: null,
        personName: null,
        events: [],
        error: null,
      },
      meta: { source: 'snapshot', fetchedAt: ttr.fetchedAt },
    };
  }

  return null;
}

// Der Stand eines geteilten Snapshots ist keine Störung von myTischtennis: nie als "veraltet" markieren.
export function sharedFreshness(shared: SharedPlayerResponse): Freshness | null {
  const since = Date.parse(String(shared.meta?.fetchedAt ?? ''));

  return Number.isFinite(since) ? { since, stale: false } : null;
}
