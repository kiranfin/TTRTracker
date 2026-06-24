import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { TeamContext, ScheduleSummary, TeamScheduleMatch } from '../types';
import { styles } from '../styles';
import { MiniStat } from './MiniStat';
import { TeamMatchCard } from './TeamMatchCard';

export function ScheduleTab({
                         matches,
                         team,
                         summary,
                     }: {
    matches: TeamScheduleMatch[];
    team: TeamContext;
    summary: ScheduleSummary;
}) {
    const { colors } = useTheme();
    const { t } = useI18n();

    const upcoming = matches.filter((match) => match.status !== 'completed');
    const completed = matches.filter((match) => match.status === 'completed');

    if (matches.length === 0) {
        return <EmptyState icon="calendar-outline" title={t('team.scheduleEmpty')} />;
    }

    return (
        <View style={styles.stack}>
            <Card style={styles.sectionCard}>
                <View style={styles.sectionHeaderCompact}>
                    <Ionicons name="analytics-outline" size={18} color={colors.primary} />
                    <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>{t('team.seasonOverview')}</Text>
                </View>

                <View style={styles.miniStatRow}>
                    <MiniStat label={t('team.resultRecord')} value={`${summary.wins}-${summary.draws}-${summary.losses}`} />
                    <MiniStat label={t('team.played')} value={String(summary.played)} />
                    <MiniStat label={t('team.open')} value={String(summary.open)} />
                </View>
            </Card>

            {upcoming.length > 0 ? (
                <Card style={styles.sectionCard}>
                    <View style={styles.sectionHeaderCompact}>
                        <Ionicons name="time-outline" size={18} color={colors.primary} />
                        <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>
                            {t('team.openGames')} ({upcoming.length})
                        </Text>
                    </View>

                    <View style={styles.stack}>
                        {upcoming.map((match, index) => (
                            <TeamMatchCard
                                key={`upcoming-${match.id ?? 'no-id'}-${index}`}
                                match={match}
                                team={team}
                                highlighted
                            />
                        ))}
                    </View>
                </Card>
            ) : null}

            {completed.length > 0 ? (
                <Card style={styles.sectionCard}>
                    <View style={styles.sectionHeaderCompact}>
                        <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                        <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>
                            {t('team.completedGames')} ({completed.length})
                        </Text>
                    </View>

                    <View style={styles.stack}>
                        {completed.map((match, index) => (
                            <TeamMatchCard
                                key={`completed-${match.id ?? 'no-id'}-${index}`}
                                match={match}
                                team={team}
                            />
                        ))}
                    </View>
                </Card>
            ) : null}
        </View>
    );
}
