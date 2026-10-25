import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 96,
    gap: 16,
  },
  infoPills: {
    gap: 8,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
  },
  heroCard: {
    padding: 20,
    gap: 14,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroTeamWrap: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  heroTeam: {
    textAlign: 'center',
  },
  heroScore: {
    alignItems: 'center',
    gap: 2,
  },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  section: {
    gap: 10,
  },
  matchLine: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  matchMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  playerName: {
    flex: 1,
  },
  setPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  setPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
});
