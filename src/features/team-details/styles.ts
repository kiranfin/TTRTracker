import { StyleSheet } from 'react-native';
import { font } from '@/src/theme/typography';

export const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 112,
        gap: 18,
    },
    error: {
        ...font('500'),
        fontSize: 14,
        lineHeight: 20,
    },
    stack: {
        gap: 18,
    },
    section: {
        gap: 8,
    },

    teamHead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    teamHeadText: {
        flex: 1,
        minWidth: 0,
        gap: 4,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
    },

    warningCard: {
        padding: 14,
    },
    sectionHeaderCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        ...font('500'),
    },

    imageCard: {
        overflow: 'hidden',
    },
    teamImage: {
        width: '100%',
        aspectRatio: 16 / 9,
    },
    emptyCard: {
        padding: 16,
    },
    infoRow: {
        minHeight: 56,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoContent: {
        flex: 1,
        minWidth: 0,
        gap: 1,
    },
    positionBadge: {
        minWidth: 30,
        height: 30,
        paddingHorizontal: 6,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    valueBlock: {
        alignItems: 'flex-end',
        gap: 1,
    },
});
