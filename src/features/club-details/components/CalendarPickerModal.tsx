import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { parseDateInput, buildCalendarMonthDays, formatDateInput, addMonths } from '../utils';
import { styles } from '../styles';

export function CalendarPickerModal({
                                 visible,
                                 title,
                                 value,
                                 onSelect,
                                 onClose,
                             }: {
    visible: boolean;
    title: string;
    value: string;
    onSelect: (value: string) => void;
    onClose: () => void;
}) {
    const { colors } = useTheme();
    const { t } = useI18n();
    const [visibleMonth, setVisibleMonth] = useState(() => parseDateInput(value) ?? new Date());

    useEffect(() => {
        if (!visible) return;

        setVisibleMonth(parseDateInput(value) ?? new Date());
    }, [visible, value]);

    const calendarDays = useMemo(
        () => buildCalendarMonthDays(visibleMonth),
        [visibleMonth],
    );

    const selectedKey = parseDateInput(value) ? formatDateInput(parseDateInput(value)!) : '';
    const todayKey = formatDateInput(new Date());

    const monthLabel = visibleMonth.toLocaleDateString('de-DE', {
        month: 'long',
        year: 'numeric',
    });

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable
                style={styles.calendarOverlay}
                onPress={onClose}
            >
                <Pressable
                    style={[
                        styles.calendarSheet,
                        {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                        },
                    ]}
                    onPress={() => undefined}
                >
                    <View style={styles.calendarTopRow}>
                        <View>
                            <Text style={[styles.calendarTitle, { color: colors.text }]}>
                                {title}
                            </Text>
                            <Text style={[styles.calendarSubtitle, { color: colors.mutedText }]}>
                                {monthLabel}
                            </Text>
                        </View>

                        <Pressable
                            onPress={onClose}
                            hitSlop={10}
                            style={[
                                styles.calendarCloseButton,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <Ionicons name="close" size={18} color={colors.text} />
                        </Pressable>
                    </View>

                    <View style={styles.calendarMonthRow}>
                        <Pressable
                            onPress={() => setVisibleMonth((current) => addMonths(current, -1))}
                            style={[
                                styles.calendarNavButton,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <Ionicons name="chevron-back" size={18} color={colors.text} />
                        </Pressable>

                        <Text style={[styles.calendarMonthText, { color: colors.text }]}>
                            {monthLabel}
                        </Text>

                        <Pressable
                            onPress={() => setVisibleMonth((current) => addMonths(current, 1))}
                            style={[
                                styles.calendarNavButton,
                                {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <Ionicons name="chevron-forward" size={18} color={colors.text} />
                        </Pressable>
                    </View>

                    <View style={styles.weekdayRow}>
                        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((weekday) => (
                            <Text
                                key={weekday}
                                style={[styles.weekdayText, { color: colors.mutedText }]}
                            >
                                {weekday}
                            </Text>
                        ))}
                    </View>

                    <View style={styles.calendarGrid}>
                        {calendarDays.map((day, index) => {
                            if (!day) {
                                return <View key={`empty-${index}`} style={styles.calendarDaySlot} />;
                            }

                            const dayKey = formatDateInput(day);
                            const selected = dayKey === selectedKey;
                            const today = dayKey === todayKey;

                            return (
                                <Pressable
                                    key={dayKey}
                                    onPress={() => {
                                        onSelect(dayKey);
                                        onClose();
                                    }}
                                    style={({ pressed }) => [
                                        styles.calendarDaySlot,
                                        styles.calendarDayButton,
                                        {
                                            backgroundColor: selected
                                                ? colors.primary
                                                : pressed
                                                    ? colors.primarySoft
                                                    : today
                                                        ? colors.card
                                                        : 'transparent',
                                            borderColor: selected
                                                ? colors.primary
                                                : today
                                                    ? colors.primarySoftBorder
                                                    : 'transparent',
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.calendarDayText,
                                            {
                                                color: selected ? '#fff' : colors.text,
                                            },
                                        ]}
                                    >
                                        {day.getDate()}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    <View style={styles.calendarFooter}>
                        <Pressable
                            onPress={() => {
                                onSelect('');
                                onClose();
                            }}
                            style={({ pressed }) => [
                                styles.calendarClearButton,
                                {
                                    backgroundColor: pressed ? colors.muted : 'transparent',
                                    borderColor: colors.border,
                                },
                            ]}
                        >
                            <Text style={[styles.calendarClearButtonText, { color: colors.text }]}>
                                {t('club.clear')}
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={() => {
                                onSelect(formatDateInput(new Date()));
                                onClose();
                            }}
                            style={({ pressed }) => [
                                styles.calendarTodayButton,
                                {
                                    backgroundColor: pressed ? colors.primarySoft : colors.primary,
                                },
                            ]}
                        >
                            <Text style={styles.calendarTodayButtonText}>{t('club.today')}</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}
