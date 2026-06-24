import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    content: {
        padding: 16,
        paddingTop: 20,
        paddingBottom: 112,
        gap: 16,
    },
    headerRow: {
        minHeight: 42,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
    },
    backButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerActionButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
        flex: 1,
        gap: 8,
    },
    title: {
        fontSize: 24,
        lineHeight: 31,
        fontWeight: '900',
    },
    headerMetaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
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
    tableCard: {
        paddingTop: 16,
        paddingHorizontal: 0,
        paddingBottom: 0,
        overflow: 'hidden',
    },
    teamCardList: {
        paddingHorizontal: 10,
        paddingBottom: 10,
        gap: 9,
    },
    leagueTeamCard: {
        borderWidth: 1,
        borderRadius: 24,
        padding: 12,
        gap: 12,
    },
    leagueTeamCardPressed: {
        opacity: 0.78,
        transform: [{ scale: 0.992 }],
    },
    leagueTeamHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
    },
    leagueRankBadge: {
        width: 38,
        height: 38,
        borderRadius: 999,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    leagueRankText: {
        fontSize: 14,
        lineHeight: 18,
        fontWeight: '900',
    },
    leagueTeamTitleBlock: {
        flex: 1,
        minWidth: 0,
    },
    leagueTeamName: {
        fontSize: 15,
        lineHeight: 20,
        fontWeight: '900',
    },
    leagueStatGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    leagueStatTile: {
        flex: 1,
        minWidth: 0,
        minHeight: 52,
        borderRadius: 15,
        borderWidth: 1,
        paddingHorizontal: 7,
        paddingVertical: 7,
        justifyContent: 'center',
    },
    leagueStatLabel: {
        fontSize: 9,
        lineHeight: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    leagueStatValue: {
        marginTop: 3,
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '800',
    },
    leagueStatValueStrong: {
        fontSize: 15,
        lineHeight: 19,
        fontWeight: '900',
    },
    filterCard: {
        padding: 16,
        gap: 14,
    },
    filterBlock: {
        gap: 8,
    },
    filterLabel: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '900',
    },
    filterChipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    filterChipText: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '900',
    },
    filterHint: {
        fontSize: 12,
        lineHeight: 16,
    },
    sectionCard: {
        padding: 16,
        gap: 12,
    },
    sectionHeader: {
        paddingHorizontal: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 9,
    },
    sectionHeaderCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionIcon: {
        width: 34,
        height: 34,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: '900',
    },
    sectionSubtitle: {
        marginTop: 1,
        fontSize: 12,
        lineHeight: 17,
    },
    sectionTitleCompact: {
        fontSize: 17,
        lineHeight: 23,
        fontWeight: '900',
    },
    matchCard: {
        padding: 14,
        gap: 11,
    },
    matchTopMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    matchScoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 9,
    },
    matchTeam: {
        flex: 1,
        fontSize: 14,
        lineHeight: 19,
        fontWeight: '900',
    },
    awayTeam: {
        textAlign: 'right',
    },
    scoreBox: {
        minWidth: 76,
        minHeight: 38,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingHorizontal: 8,
    },
    scoreText: {
        fontSize: 21,
        lineHeight: 27,
        fontWeight: '900',
    },
    scoreDivider: {
        fontSize: 18,
        lineHeight: 24,
    },
    vsBox: {
        minWidth: 54,
        minHeight: 34,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    vsText: {
        fontSize: 11,
        lineHeight: 15,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    matchMetaRow: {
        gap: 5,
    },
    metaLine: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flexShrink: 1,
    },
    metaText: {
        flexShrink: 1,
        fontSize: 13,
        lineHeight: 18,
    },
});
