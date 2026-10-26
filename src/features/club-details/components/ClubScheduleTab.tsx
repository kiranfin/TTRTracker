import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Chip, ChipRow } from '@/src/components/Chip';
import { EmptyState } from '@/src/components/EmptyState';
import { ListGroup } from '@/src/components/ListGroup';
import { MatchRow } from '@/src/components/MatchRow';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import type { ClubDetailsController } from '../hooks/useClubDetails';
import { styles } from '../styles';
import { SchedulePeriodSheet } from './SchedulePeriodSheet';
import { SkeletonList } from '@/src/components/SkeletonRow';

export function ClubScheduleTab({ club }: { club: ClubDetailsController }) {
    const { colors } = useTheme();
    const { t } = useI18n();
    const [periodOpen, setPeriodOpen] = useState(false);

    const {
        scheduleFilter,
        selectScheduleFilter,
        scheduleGroups,
        scheduleLoading,
        scheduleError,
        scheduleSeason,
        dateStartDraft,
        dateEndDraft,
        setDateStartDraft,
        setDateEndDraft,
        applyCustomPeriod,
        resetSchedulePeriod,
    } = club;

    return (
        <View style={styles.stack}>
            <ChipRow>
                <Chip label={t('common.all')} active={scheduleFilter === 'all'} onPress={() => selectScheduleFilter('all')} />
                <Chip label={t('club.upcoming')} active={scheduleFilter === 'upcoming'} onPress={() => selectScheduleFilter('upcoming')} />
                <Chip label={t('club.past')} active={scheduleFilter === 'past'} onPress={() => selectScheduleFilter('past')} />
                <Chip label={t('club.period')} active={scheduleFilter === 'custom'} onPress={() => setPeriodOpen(true)} />
            </ChipRow>

            {scheduleError ? <Text style={[typography.meta, { color: colors.destructive }]}>{scheduleError}</Text> : null}
            {scheduleLoading ? <SkeletonList count={3} /> : null}

            {!scheduleLoading && !scheduleError && scheduleGroups.length === 0 ? (
                <EmptyState icon="calendar-outline" title={t('club.noMatches')} />
            ) : null}

            {scheduleGroups.map((group) => (
                <View key={group.dateKey} style={styles.dayGroup}>
                    <Text style={[typography.groupLabel, styles.dayLabel, { color: colors.mutedText }]}>
                        {(group.dateKey === '9999-99-99' ? t('common.dateUnknown') : group.dateLabel)}
                    </Text>

                    <ListGroup>
                        {group.matches.map((match, index) => (
                            <MatchRow
                                key={`${group.dateKey}-${match.id ?? 'no-id'}-${index}`}
                                homeTeam={match.homeTeam}
                                awayTeam={match.awayTeam}
                                homeScore={match.homeScore}
                                awayScore={match.awayScore}
                                status={match.status}
                                time={match.time}
                                meta={match.leagueName || undefined}
                                highlightTeam={match.clubTeamName}
                                onPress={
                                    match.id && match.status !== 'free'
                                        ? () =>
                                            router.push({
                                                pathname: '/match/[meetingId]',
                                                params: { meetingId: match.id!, homeTeam: match.homeTeam, awayTeam: match.awayTeam },
                                            })
                                        : undefined
                                }
                            />
                        ))}
                    </ListGroup>
                </View>
            ))}

            <SchedulePeriodSheet
                visible={periodOpen}
                season={scheduleSeason}
                dateStart={dateStartDraft}
                dateEnd={dateEndDraft}
                loading={scheduleLoading}
                onChangeDateStart={setDateStartDraft}
                onChangeDateEnd={setDateEndDraft}
                onApply={applyCustomPeriod}
                onReset={resetSchedulePeriod}
                onClose={() => setPeriodOpen(false)}
            />
        </View>
    );
}
