import { StyleSheet } from 'react-native';
import { font } from '@/src/theme/typography';

export const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 112,
    gap: 16,
  },
  error: {
    ...font('500'),
    fontSize: 14,
    lineHeight: 20,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    ...font('500'),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },

  heroCard: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
    alignItems: 'center',
  },
  heroMeta: {
    textAlign: 'center',
    ...font('500'),
  },
  heroRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroTeamWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  heroBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeText: {
    ...font('800'),
  },
  heroTeam: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 19,
  },
  heroScore: {
    alignItems: 'center',
    gap: 6,
  },
  heroScoreText: {
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1,
    ...font('800'),
    fontVariant: ['tabular-nums'],
  },
  statusPill: {
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 999,
    justifyContent: 'center',
  },
  statusText: {
    ...font('700'),
    textTransform: 'uppercase',
  },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  summaryPill: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
  },

  section: {
    gap: 8,
  },
  matchLine: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 4,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 19,
  },
  awayName: {
    textAlign: 'right',
  },
  result: {
    minWidth: 44,
    textAlign: 'center',
  },
  matchMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  setsText: {
    flex: 1,
  },
  moreRow: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 14,
  },
});
