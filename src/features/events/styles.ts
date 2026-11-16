import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 112,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  messageCard: {
    padding: 16,
    gap: 12,
  },

  hero: {
    gap: 14,
  },
  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  iconTile: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  descriptionCard: {
    padding: 16,
  },
  priceValue: {
    maxWidth: 160,
    textAlign: 'right',
  },
});
