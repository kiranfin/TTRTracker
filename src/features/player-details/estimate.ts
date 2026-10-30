import type {
  EstimatedTtrEvent,
  NormalizedPlayerTtrHistory,
  NormalizedTtrHistoryEvent,
  NormalizedTtrHistoryMatch,
  PlayerTtrEstimate,
} from '@/src/types/tttracker';

function toMatch(single: EstimatedTtrEvent, index: number): NormalizedTtrHistoryMatch {
  return {
    id: `${single.meetingId}-${index}`,
    otherPlayerName: single.opponentName,
    ownSets: single.setsOwn,
    otherSets: single.setsOther,
    otherTtr: single.opponentTtr,
    setResults: [],
    raw: single,
  };
}

// Die Schätzung liegt pro Einzel vor, die Profilansicht zeigt pro Mannschaftskampf einen Eintrag.
// Deshalb werden die Einzel eines Spiels zu einem Eintrag zusammengefasst, wie beim offiziellen Verlauf.
export function estimateToHistory(estimate: PlayerTtrEstimate): NormalizedPlayerTtrHistory {
  const groups = new Map<string, EstimatedTtrEvent[]>();

  estimate.events.forEach((single) => {
    groups.set(single.meetingId, [...(groups.get(single.meetingId) ?? []), single]);
  });

  const events = [...groups.entries()].map(([meetingId, singles]): NormalizedTtrHistoryEvent => {
    const first = singles[0]!;
    const last = singles[singles.length - 1]!;
    const won = singles.filter((single) => single.won).length;

    return {
      id: meetingId,
      title: [first.teamHome, first.teamGuest].filter(Boolean).join(' - '),
      date: first.date ?? undefined,
      ttrBefore: first.ttrBefore,
      ttrAfter: last.ttrAfter,
      delta: last.ttrAfter - first.ttrBefore,
      matchCount: singles.length,
      matchesWon: String(won),
      matchesLost: String(singles.length - won),
      matches: singles.map(toMatch),
      raw: singles,
    };
  });

  return {
    nuid: estimate.nuid,
    available: events.length > 0,
    ttr: estimate.rating?.value,
    events,
  };
}
