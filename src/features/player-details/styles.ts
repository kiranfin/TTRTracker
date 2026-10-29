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

    profileHead: {
        gap: 18,
    },
    profileIdentity: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    profileIdentityText: {
        flex: 1,
        minWidth: 0,
        gap: 4,
    },
    clubLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        alignSelf: 'flex-start',
    },
    clubLinkText: {
        fontSize: 14,
        flexShrink: 1,
    },
    ttrRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
    },
    ttrValueBlock: {
        gap: 2,
    },
    ttrDelta: {
        paddingBottom: 8,
    },
    claimLink: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
        alignSelf: 'flex-start',
    },

    chartCard: {
        padding: 16,
        gap: 14,
    },
    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    chartEmpty: {
        minHeight: 96,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lineChartWrap: {
        gap: 2,
    },
    axisRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    axisLabel: {
        fontSize: 11,
        lineHeight: 14,
        ...font('600'),
    },

    historySection: {
        gap: 10,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    historyHeaderText: {
        flex: 1,
        gap: 2,
    },
    historyIconButton: {
        minWidth: 44,
        minHeight: 44,
        marginRight: -10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchInputWrap: {
        width: '100%',
        minHeight: 44,
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    searchInput: {
        flex: 1,
        minWidth: 0,
        paddingVertical: 0,
        fontSize: 15,
        ...font('500'),
    },
    monthGroup: {
        gap: 8,
        marginTop: 4,
    },
    monthLabel: {
        paddingHorizontal: 4,
    },
    historyRow: {
        minHeight: 64,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    historyRowMain: {
        flex: 1,
        minWidth: 0,
        gap: 2,
    },
    historyRowScore: {
        minWidth: 44,
        alignItems: 'flex-end',
        gap: 1,
    },
    historyExpanded: {
        paddingLeft: 64,
        paddingRight: 16,
        paddingBottom: 14,
        gap: 8,
    },
    matchDetailCard: {
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    matchDetailMain: {
        flex: 1,
        minWidth: 0,
        gap: 2,
    },
    matchDetailName: {
        fontSize: 14,
        lineHeight: 19,
    },
    reportLink: {
        alignSelf: 'flex-start',
        paddingVertical: 4,
    },
});
