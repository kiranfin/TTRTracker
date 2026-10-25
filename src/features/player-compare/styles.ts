import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 112,
    gap: 16,
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  sideCard: {
    flex: 1,
    minWidth: 0,
    padding: 14,
    gap: 8,
    alignItems: 'center',
  },
  sideCardTop: {
    width: '100%',
    alignItems: 'center',
  },
  sideOpenProfile: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideName: {
    textAlign: 'center',
  },
  swapButton: {
    alignSelf: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: 16,
    gap: 14,
  },
  chanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  chanceSide: {
    flex: 1,
    gap: 2,
  },
  chanceSideRight: {
    alignItems: 'flex-end',
  },
  chanceTrack: {
    height: 12,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  metricRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  metricValue: {
    flex: 1,
    textAlign: 'center',
  },
  metricLabel: {
    flex: 1.2,
    textAlign: 'center',
  },
  h2hRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  h2hSide: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  h2hCenter: {
    alignItems: 'center',
    gap: 2,
  },
  message: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  eventTrailing: {
    alignItems: 'flex-end',
    gap: 2,
  },
});
