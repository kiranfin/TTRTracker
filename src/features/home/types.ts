import type { ScheduleMatch } from '@/src/types/tttracker';

export type RichObject = Record<string, unknown>;

export type HomeClubMatch = ScheduleMatch & {
  clubTeamName?: string;
  leagueName?: string;
  roundName?: string;
  meetingNumber?: string;
};
