import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 96,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '800',
  },
  scoreCard: {
    padding: 22,
    gap: 12,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  teamName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
  },
  awayTeam: {
    textAlign: 'center',
  },
  scorePill: {
    minWidth: 72,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 2,
  },
  scoreText: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },
  scoreLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  scoreSummary: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  meetingId: {
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
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
  loader: {
    paddingVertical: 22,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionCard: {
    paddingTop: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    paddingHorizontal: 16,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  rows: {
    width: '100%',
  },
  matchLine: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 7,
  },
  matchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchName: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '800',
  },
  matchType: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playerName: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },
  awayPlayer: {
    textAlign: 'right',
  },
  sets: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
});
