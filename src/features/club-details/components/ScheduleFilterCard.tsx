import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge } from '@/src/components/Badge';
import { Card } from '@/src/components/Card';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { isValidDateInput } from '../utils';
import { styles } from '../styles';
import { CalendarPickerModal } from './CalendarPickerModal';
import { DateFilterButton } from './DateFilterButton';

export function ScheduleFilterCard({
                                season,
                                dateStart,
                                dateEnd,
                                loading,
                                onChangeDateStart,
                                onChangeDateEnd,
                                onApply,
                                onReset,
                            }: {
    season: string;
    dateStart: string;
    dateEnd: string;
    loading: boolean;
    onChangeDateStart: (value: string) => void;
    onChangeDateEnd: (value: string) => void;
    onApply: () => void;
    onReset: () => void;
}) {
    const { colors } = useTheme();
    const { t } = useI18n();
    const [openPicker, setOpenPicker] = useState<'start' | 'end' | null>(null);

    const startInvalid = !isValidDateInput(dateStart);
    const endInvalid = !isValidDateInput(dateEnd);
    const canApply = !loading && !startInvalid && !endInvalid;

    return (
        <Card style={styles.filterCard}>
            <View style={styles.filterHeader}>
                <View>
                    <Text style={[styles.filterTitle, { color: colors.text }]}>{t('club.period')}</Text>
                    <Text style={[styles.filterSubtitle, { color: colors.mutedText }]}>{t('favorites.seasonValue', { season })}</Text>
                </View>

                <Badge tone="outline">{t('club.calendar')}</Badge>
            </View>

            <View style={styles.filterRow}>
                <DateFilterButton
                    label={t('common.start')}
                    value={dateStart}
                    invalid={startInvalid}
                    disabled={loading}
                    onPress={() => setOpenPicker('start')}
                />

                <DateFilterButton
                    label={t('common.end')}
                    value={dateEnd}
                    invalid={endInvalid}
                    disabled={loading}
                    onPress={() => setOpenPicker('end')}
                />
            </View>

            <View style={styles.filterButtonRow}>
                <Pressable
                    onPress={onReset}
                    disabled={loading}
                    style={({ pressed }) => [
                        styles.resetButton,
                        {
                            backgroundColor: pressed ? colors.muted : 'transparent',
                            borderColor: colors.border,
                            opacity: loading ? 0.6 : 1,
                        },
                    ]}
                >
                    <Text style={[styles.resetButtonText, { color: colors.text }]}>{t('common.reset')}</Text>
                </Pressable>

                <Pressable
                    onPress={onApply}
                    disabled={!canApply}
                    style={({ pressed }) => [
                        styles.applyButton,
                        {
                            backgroundColor: pressed ? colors.primarySoft : colors.primary,
                            opacity: canApply ? 1 : 0.55,
                        },
                    ]}
                >
                    <Text style={styles.applyButtonText}>{t('common.apply')}</Text>
                </Pressable>
            </View>

            <CalendarPickerModal
                visible={openPicker === 'start'}
                title={t('club.chooseStartDate')}
                value={dateStart}
                onSelect={onChangeDateStart}
                onClose={() => setOpenPicker(null)}
            />

            <CalendarPickerModal
                visible={openPicker === 'end'}
                title={t('club.chooseEndDate')}
                value={dateEnd}
                onSelect={onChangeDateEnd}
                onClose={() => setOpenPicker(null)}
            />
        </Card>
    );
}
