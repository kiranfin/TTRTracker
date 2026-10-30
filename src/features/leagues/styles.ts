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
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  seasonButton: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  seasonText: {
    fontSize: 14,
  },
  errorCard: {
    padding: 16,
    gap: 12,
  },
  rankBadge: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 6,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    ...font('800'),
  },
  associationBadge: {
    width: 50,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  associationBadgeText: {
    fontSize: 12,
    lineHeight: 15,
    ...font('800'),
  },
  headerBlock: {
    gap: 6,
  },
});
