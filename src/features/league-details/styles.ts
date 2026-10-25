import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    content: {
        padding: 16,
        paddingTop: 20,
        paddingBottom: 112,
        gap: 16,
    },
    loader: {
        paddingVertical: 22,
    },
    error: {
        fontSize: 14,
        lineHeight: 20,
    },
    stack: {
        gap: 12,
    },
    leagueHead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    leagueHeadText: {
        flex: 1,
        minWidth: 0,
        gap: 4,
    },
    tableCard: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
    tableRow: {
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 14,
        paddingVertical: 8,
    },
    tableHeader: {
        minHeight: 34,
        paddingVertical: 6,
    },
    rankBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
    colRank: {
        width: 40,
        textAlign: 'center',
    },
    colTeam: {
        flex: 1,
        minWidth: 0,
        paddingRight: 8,
    },
    colGames: {
        width: 30,
        textAlign: 'center',
    },
    colDiff: {
        width: 40,
        textAlign: 'center',
    },
    colPoints: {
        width: 52,
        textAlign: 'right',
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 14,
        paddingHorizontal: 4,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
});
