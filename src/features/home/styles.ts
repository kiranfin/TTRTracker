import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: {
    padding: 16,
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
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroDeltaBlock: {
    alignItems: 'flex-end',
    gap: 4,
    paddingBottom: 6,
  },
  heroStats: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
  },
  heroStatCell: {
    flex: 1,
    flexDirection: 'row',
  },
  heroStat: {
    flex: 1,
    gap: 2,
  },
  heroStatDivider: {
    width: StyleSheet.hairlineWidth,
    marginHorizontal: 12,
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

  rowTrailing: {
    alignItems: 'flex-end',
    gap: 2,
  },
  clubMessage: {
    padding: 16,
    gap: 12,
  },
  scoreText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
