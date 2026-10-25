import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    content: {
        padding: 16,
        paddingTop: 20,
        paddingBottom: 112,
        gap: 16,
    },
    loader: {
        paddingVertical: 24,
    },
    error: {
        fontSize: 14,
        lineHeight: 20,
    },
    chartCard: {
        padding: 16,
        gap: 14,
    },
    lineChartWrap: {
        gap: 8,
    },
    searchInputWrap: {
        width: '100%',
        minHeight: 44,
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    searchInput: {
        flex: 1,
        minWidth: 0,
        paddingVertical: 0,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '700',
    },
    eventBottomRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    matchDetailCard: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 12,
        gap: 10,
    },
    matchDetailTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    matchPlayers: {
        flex: 1,
    },
    matchPlayerName: {
        fontSize: 14,
        lineHeight: 19,
        fontWeight: '900',
    },
    matchOpponentName: {
        marginTop: 2,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '700',
    },
    matchResultBox: {
        minWidth: 54,
        minHeight: 34,
        borderRadius: 13,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    matchResultText: {
        fontSize: 17,
        lineHeight: 22,
        fontWeight: '900',
    },
    profileHead: {
        gap: 16,
    },
    profileIdentity: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    profileIdentityText: {
        flex: 1,
        minWidth: 0,
        gap: 2,
    },
    clubLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        alignSelf: 'flex-start',
    },
    ttrRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 12,
    },
    ttrDelta: {
        alignItems: 'flex-end',
        gap: 4,
        paddingBottom: 6,
    },
    chartEmpty: {
        minHeight: 96,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
    },
    historySection: {
        gap: 12,
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    monthGroup: {
        gap: 8,
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
        alignItems: 'flex-end',
        gap: 2,
    },
    historyExpanded: {
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 10,
    },
});
