import { Ionicons } from '@expo/vector-icons';
import type { NormalizedTtrHistoryEvent, ScheduleMatch } from '@/src/types/tttracker';

export type RichObject = Record<string, unknown>;

export type ClubReference = {
  organization: string;
  clubNumber: string;
  title?: string;
  state?: string;
  clubSlug?: string;
};

export type HomeClubMatch = ScheduleMatch & {
  clubTeamName?: string;
  leagueName?: string;
  roundName?: string;
  meetingNumber?: string;
};

export type ShortcutCardProps = {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  onPress: () => void;
};

export type MeQuickStatsCardProps = {
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
