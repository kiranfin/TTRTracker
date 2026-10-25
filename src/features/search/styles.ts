import { StyleSheet } from 'react-native';
import { font } from '@/src/theme/typography';

export const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 112,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ttrBlock: {
    alignItems: 'flex-end',
  },
  ttrCaption: {
    fontSize: 11,
    lineHeight: 14,
    ...font('600'),
  },
  showAllRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  showAllText: {
    fontSize: 14,
  },
});
