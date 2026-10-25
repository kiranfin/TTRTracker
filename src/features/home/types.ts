import type { ScheduleMatch } from '@/src/types/tttracker';

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
