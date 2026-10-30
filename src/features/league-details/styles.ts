import { StyleSheet } from 'react-native';
import { font } from '@/src/theme/typography';

export const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 112,
        gap: 16,
    },
    error: { ...font('400'),
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
        gap: 4,
    },
    leagueHeadSubtitle: {
        fontSize: 14,
    },
    tableCard: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
    tableRow: {
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 14,
        paddingVertical: 6,
    },
    tableHeader: {
        minHeight: 36,
        paddingVertical: 4,
    },
    headerLabel: {
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },
    rankBar: {
        position: 'absolute',
        left: 0,
        top: 8,
        bottom: 8,
        width: 4,
        borderTopRightRadius: 3,
        borderBottomRightRadius: 3,
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
    teamCell: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    teamName: {
        flexShrink: 1,
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
        borderRadius: 3,
    },
});
