import { StyleSheet } from 'react-native';
import { font } from '@/src/theme/typography';

export const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 112,
    gap: 18,
  },
  section: {
    gap: 8,
  },

  playersCard: {
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  half: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  halfIdentity: {
    alignItems: 'center',
    gap: 4,
  },
  halfAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  halfText: {
    textAlign: 'center',
  },
  changePill: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
  },
  changePillText: {
    ...font('600'),
  },
  vsWrap: {
    justifyContent: 'center',
  },
  vsBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsText: {
    ...font('800'),
  },

  card: {
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  chanceTrack: {
    height: 12,
    flexDirection: 'row',
    gap: 3,
  },
  chanceSegment: {
    borderRadius: 6,
  },
  chanceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  h2hHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  h2hTitle: {
    flex: 1,
  },
  h2hRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  h2hSide: {
    flex: 1,
    gap: 2,
  },
  h2hSideRight: {
    alignItems: 'flex-end',
  },
  message: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  metricRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  metricValueWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricValueWrapRight: {
    justifyContent: 'flex-end',
  },
  metricLabel: {
    flex: 1.2,
    textAlign: 'center',
  },
  leadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eventTrailing: {
    alignItems: 'flex-end',
    gap: 2,
  },
});
