import { useState } from 'react';
import { Text, View } from 'react-native';
import { BottomSheet } from '@/src/components/BottomSheet';
import { Button } from '@/src/components/Button';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { isValidDateInput } from '../utils';
import { styles } from '../styles';
import { CalendarPickerModal } from './CalendarPickerModal';
import { DateFilterButton } from './DateFilterButton';

type SchedulePeriodSheetProps = {
    visible: boolean;
    season: string;
    dateStart: string;
    dateEnd: string;
    loading: boolean;
    onChangeDateStart: (value: string) => void;
    onChangeDateEnd: (value: string) => void;
    // Gibt false zurück, wenn der Zeitraum ungültig ist (Sheet bleibt dann offen)
    onApply: () => boolean;
    onReset: () => void;
    onClose: () => void;
};

// Zeitraumwahl im Bottom Sheet. Der Kalender ist ein eigenes Modal und wird deshalb nicht verschachtelt,
// sondern ersetzt das Sheet, solange er offen ist.
export function SchedulePeriodSheet({
                                        visible,
                                        season,
                                        dateStart,
                                        dateEnd,
                                        loading,
                                        onChangeDateStart,
                                        onChangeDateEnd,
                                        onApply,
                                        onReset,
                                        onClose,
                                    }: SchedulePeriodSheetProps) {
    const { colors } = useTheme();
    const { t } = useI18n();
    const [picker, setPicker] = useState<'start' | 'end' | null>(null);

    const startInvalid = !isValidDateInput(dateStart);
    const endInvalid = !isValidDateInput(dateEnd);

    return (
        <>
            <BottomSheet visible={visible && picker === null} title={t('club.period')} onClose={onClose}>
                <View style={styles.periodBody}>
                    <Text style={[typography.meta, { color: colors.mutedText }]}>
                        {t('favorites.seasonValue', { season })}
                    </Text>

                    <View style={styles.filterRow}>
                        <DateFilterButton
                            label={t('common.start')}
                            value={dateStart}
                            invalid={startInvalid}
                            disabled={loading}
                            onPress={() => setPicker('start')}
                        />

                        <DateFilterButton
                            label={t('common.end')}
                            value={dateEnd}
                            invalid={endInvalid}
                            disabled={loading}
                            onPress={() => setPicker('end')}
                        />
                    </View>

                    <View style={styles.filterButtonRow}>
                        <Button
                            variant="outline"
                            style={styles.periodButton}
                            onPress={() => {
                                onReset();
                                onClose();
                            }}
                        >
                            {t('common.reset')}
                        </Button>

                        <Button
                            variant="primary"
                            style={styles.periodButton}
                            disabled={loading || startInvalid || endInvalid}
                            onPress={() => {
                                if (onApply()) onClose();
                            }}
                        >
                            {t('common.apply')}
                        </Button>
                    </View>
                </View>
            </BottomSheet>

            <CalendarPickerModal
                visible={visible && picker === 'start'}
                title={t('club.chooseStartDate')}
                value={dateStart}
                onSelect={onChangeDateStart}
                onClose={() => setPicker(null)}
            />

            <CalendarPickerModal
                visible={visible && picker === 'end'}
                title={t('club.chooseEndDate')}
                value={dateEnd}
                onSelect={onChangeDateEnd}
                onClose={() => setPicker(null)}
            />
        </>
    );
}
