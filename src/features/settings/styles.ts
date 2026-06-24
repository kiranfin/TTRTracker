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
  card: {
    padding: 16,
    gap: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  twoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  halfButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
  },
  backgroundPreview: {
    height: 148,
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  backgroundPreviewImage: {
    flex: 1,
  },
  backgroundPreviewOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  backgroundPreviewEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    padding: 16,
  },
  backgroundPreviewTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  backgroundPreviewMeta: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  accentPreview: {
    minHeight: 78,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accentPreviewTextBlock: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  accentPreviewTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '900',
  },
  accentPreviewMeta: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    opacity: 0.9,
  },
  contrastBadge: {
    minWidth: 68,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contrastBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },
  colorPickerBox: {
    alignItems: 'center',
    gap: 14,
  },
  colorPreview: {
    width: '100%',
    height: 34,
    borderRadius: 14,
    marginBottom: 12,
  },
  colorWheelRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  hueCircular: {
    width: 132,
    height: 132,
  },
  colorPanel: {
    width: 132,
    height: 132,
    borderRadius: 18,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  swatchButton: {
    width: 31,
    height: 31,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backendText: {
    fontSize: 13,
    lineHeight: 19,
  },
  statusBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  grantList: {
    gap: 10,
  },
  grantItem: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  grantInfo: {
    gap: 3,
  },
  grantTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  grantSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  versionCard: {
    padding: 22,
    alignItems: 'center',
    gap: 4,
  },
  versionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  versionSubtext: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  profileSection: {
    gap: 10,
  },
  profileSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileSectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSectionTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  profileSectionTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
  },
  profileSectionSubtitle: {
    marginTop: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  profileDivider: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.9,
  },
  compactInput: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
    lineHeight: 20,
  },
  savedBox: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  savedBoxText: {
    flex: 1,
    minWidth: 0,
  },
  savedBoxTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },
  savedBoxMeta: {
    marginTop: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
});
