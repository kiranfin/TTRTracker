import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export type RawPlayer = {
  firstname?: string | null;
  lastname?: string | null;
  player_id?: string | null;
  person_id?: string | null;
};

export type RawMeetingMatch = {
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

export type MeetingClub = {
  organization?: string;
  clubNumber?: string;
  logoUrl?: string;
};

export type MeetingDetails = {
  live?: boolean | null;
  is_completed?: boolean | null;
  is_meeting_complete?: boolean | null;
  results_available?: boolean | null;

  team_home?: string | null;
  team_guest?: string | null;

  // Verein hinter der Mannschaft: Logo ID, Vereinsnummer und URI mit Verband (".../federations/TTBW/clubs/2055064")
  home_image_url?: string | null;
  guest_image_url?: string | null;
  team_home_club_nr?: string | null;
  team_guest_club_nr?: string | null;
  team_home_club_uri?: string | null;
  team_guest_club_uri?: string | null;
  fed_nickname?: string | null;

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

export type MatchRow = {
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

// Zeile mit dem Spielstand der Begegnung nach diesem Spiel (Doppel zuerst, dann Einzel)
export type MatchRowWithScore = MatchRow & {
  runningScore: string;
};

// Optionaler Kontext aus der Route, mit dem die Mannschaften verlinkt werden können
export type TeamLinkContext = {
  teamId: string;
  teamName: string;
  leagueTitle?: string;
  association: string;
  groupId: string;
  season?: string;
  leagueSlug?: string;
  // Verein der Mannschaft, für das Logo auf der Mannschaftsseite
  club?: MeetingClub;
};
