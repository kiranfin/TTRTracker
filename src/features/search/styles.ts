import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 112,
    gap: 16,
  },
  titleBlock: {
    gap: 4,
  },
  title: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
  },
  searchBlock: {
    gap: 10,
  },
  searchButton: {
    minHeight: 48,
    borderRadius: 16,
  },
  loader: {
    paddingVertical: 16,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
  stack: {
    gap: 12,
  },
  resultCard: {
    padding: 16,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  resultSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  badgeRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sheetStack: {
    gap: 12,
    paddingBottom: 8,
  },
  detailRow: {
    minHeight: 45,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  monospace: {
    fontVariant: ['tabular-nums'],
  },
  sheetMuted: {
    fontSize: 14,
    lineHeight: 20,
  },
  sheetStatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
