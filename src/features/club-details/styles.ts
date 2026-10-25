import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    content: {
        padding: 16,
        paddingTop: 20,
        paddingBottom: 112,
        gap: 16,
    },
    filterRow: {
        flexDirection: 'row',
        gap: 10,
    },
    dateInputBlock: {
        flex: 1,
        gap: 6,
    },
    inputLabel: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '800',
    },
    filterButtonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    loader: {
        paddingVertical: 24,
    },
    inlineLoader: {
        paddingVertical: 12,
    },
    error: {
        fontSize: 14,
        lineHeight: 20,
    },
    stack: {
        gap: 12,
    },
    dateButton: {
        height: 42,
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    dateButtonText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '800',
    },
    calendarOverlay: {
        flex: 1,
        padding: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendarSheet: {
        width: '100%',
        maxWidth: 390,
        borderRadius: 28,
        borderWidth: 1,
        padding: 16,
        gap: 16,
    },
    calendarTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    calendarTitle: {
        fontSize: 18,
        lineHeight: 24,
        fontWeight: '900',
    },
    calendarSubtitle: {
        marginTop: 2,
        fontSize: 13,
        lineHeight: 18,
    },
    calendarCloseButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendarMonthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    calendarNavButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendarMonthText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 15,
        lineHeight: 21,
        fontWeight: '900',
        textTransform: 'capitalize',
    },
    weekdayRow: {
        flexDirection: 'row',
    },
    weekdayText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '900',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: 6,
    },
    calendarDaySlot: {
        width: `${100 / 7}%`,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendarDayButton: {
        borderRadius: 14,
        borderWidth: 1,
    },
    calendarDayText: {
        fontSize: 14,
        lineHeight: 19,
        fontWeight: '900',
    },
    calendarFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    calendarClearButton: {
        minHeight: 40,
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendarClearButtonText: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '900',
    },
    calendarTodayButton: {
        minHeight: 40,
        borderRadius: 14,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendarTodayButtonText: {
        color: '#fff',
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '900',
    },
    clubHead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    clubHeadText: {
        flex: 1,
        minWidth: 0,
        gap: 2,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
    },
    nextMatchCard: {
        padding: 16,
        gap: 6,
    },
    nextMatchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    playerTrailing: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    periodBody: {
        gap: 14,
        paddingBottom: 12,
    },
    periodButton: {
        flex: 1,
    },
    dayGroup: {
        gap: 8,
    },
    dayLabel: {
        paddingHorizontal: 4,
    },
});
