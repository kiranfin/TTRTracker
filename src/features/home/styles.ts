import { StyleSheet } from 'react-native';
import { font } from '@/src/theme/typography';

export const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 112,
    gap: 20,
  },
  section: {
    gap: 10,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  headerDate: {
    fontSize: 14,
    lineHeight: 20,
    ...font('500'),
    textTransform: 'capitalize',
  },
  avatarButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroCard: {
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroHeaderLabel: {
    fontSize: 14,
  },
  heroProfileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroDelta: {
    paddingBottom: 6,
  },
  heroStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 8,
  },
  heroStat: {
    flex: 1,
    gap: 2,
  },
  heroLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 96,
  },
  heroError: {
    gap: 12,
  },

  messageCard: {
    padding: 18,
    gap: 12,
  },
  messageText: {
    gap: 4,
  },
  findIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  clubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clubHeaderTitle: {
    flex: 1,
    minWidth: 0,
  },
  clubMessage: {
    padding: 16,
    gap: 12,
  },
  matchCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  matchCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchBadge: {
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 8,
    justifyContent: 'center',
  },
  matchBadgeText: {
    ...font('700'),
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  matchTeam: {
    flex: 1,
    ...font('700'),
  },
  matchTeamAway: {
    textAlign: 'right',
  },
  matchFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  matchFooterText: {
    flex: 1,
  },
});
