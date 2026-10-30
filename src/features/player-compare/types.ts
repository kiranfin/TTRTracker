export type SideId = 'left' | 'right';

export type RecentMatch = {
  own_sets?: number | null;
  other_sets?: number | null;
  other_ttr?: number | null;
  own_person_name?: string | null;
  other_person_name?: string | null;
  own_team_name?: string | null;
  other_team_name?: string | null;
  expected_result?: string | null;
};

export type RecentEvent = {
  event_id: number | string;
  event_name?: string | null;
  event_date_time?: string | null;
  ttr_before?: number | null;
  ttr_after?: number | null;
  ttr_delta?: number | null;
  match_count?: number | null;
  matches_won?: number | null;
  matches_lost?: number | null;
  expected_result?: string | null;
  match?: RecentMatch[];
};

export type PlayerCompareSide = {
  nuid: string;
  available?: {
    ttr?: boolean;
    history?: boolean;
    any?: boolean;
  };
  identity?: {
    personName?: string | null;
    clubName?: string | null;
  };
  ratings?: {
    currentTtr?: number | null;
    qttr?: number | null;
    qttrDate?: string | null;
    maxTtr?: number | null;
    maxTtrDate?: string | null;
    ttrDate?: string | null;
  };
  history?: {
    stats?: Record<string, number | string | null>;
    points?: unknown[];
    recentEvents?: RecentEvent[];
  };
  error?: {
    ttr?: unknown;
    history?: unknown;
  };
};

export type HeadToHeadData = {
  available?: boolean;
  perspective?: {
    note?: string | null;
  };
  stats?: {
    itemCount?: number;
    parsedItemCount?: number;
    leftWins?: number;
    rightWins?: number;
    draws?: number;
    leftWinRate?: number | null;
    rightWinRate?: number | null;
  };
  items?: unknown[];
  error?: string | null;
};

export type PlayerComparisonData = {
  left: PlayerCompareSide;
  right: PlayerCompareSide;
  comparison?: {
    sameClub?: boolean;
  };
  headToHead?: HeadToHeadData;
};

export type RecentStats = {
  eventCount: number;
  matchCount: number;
  wins: number;
  losses: number;
  winRate?: number;
  totalDelta?: number;
  recentDelta5?: number;
  averageDelta?: number;
  bestGain?: number;
  worstLoss?: number;
};

// Ergebnis eines Kennzahlen-Vergleichs: wer hat den besseren Wert (höher ist besser)
export type Leader = SideId | 'tie' | 'unknown';

