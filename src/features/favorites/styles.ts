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
  editText: {
    ...font('600'),
  },
  editButton: {
    minHeight: 44,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
});
