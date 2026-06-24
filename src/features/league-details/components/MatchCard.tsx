import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Badge } from '@/src/components/Badge';
import { Card } from '@/src/components/Card';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { ScheduleMatch } from '@/src/types/tttracker';
import { formatDateLabel, leagueMatchStatusLabel } from '../utils';
import { styles } from '../styles';

export function MatchCard({ match, highlighted }: { match: ScheduleMatch; highlighted?: boolean }) {
    const { colors } = useTheme();
    const { language, t } = useI18n();
    const canOpen = Boolean(match.id) && match.status !== 'free';

    return (
        <Card
            pressable={canOpen}
            onPress={
                canOpen
                    ? () =>
                        router.push({
                            pathname: '/match/[meetingId]',
                            params: {
                                meetingId: match.id!,
                                homeTeam: match.homeTeam,
                                awayTeam: match.awayTeam,
                            },
                        })
                    : undefined
            }
            style={[
                styles.matchCard,
                highlighted && {
                    backgroundColor: colors.primarySoft,
                    borderColor: colors.primarySoftBorder,
                },
            ]}
        >
            <View style={styles.matchTopMeta}>
                <View style={styles.metaLine}>
                    <Ionicons name="calendar-outline" size={13} color={colors.mutedText} />
                    <Text style={[styles.metaText, { color: colors.mutedText }]}>
                        {formatDateLabel(match.date, language)}
                        {match.time ? ` • ${match.time}` : ''}
                        {match.endTime ? `–${match.endTime}` : ''}
                    </Text>
                </View>

                <Badge
                    tone={
                        match.status === 'completed'
                            ? 'green'
                            : match.status === 'free'
                                ? 'secondary'
                                : 'outline'
                    }
                >
                    {leagueMatchStatusLabel(match.status, t)}
                </Badge>
            </View>

            <View style={styles.matchScoreRow}>
                <Text style={[styles.matchTeam, { color: colors.text }]} numberOfLines={2}>
                    {match.homeTeam}
                </Text>

                {match.status === 'completed' ? (
                    <View style={[styles.scoreBox, { backgroundColor: colors.muted }]}>
                        <Text style={[styles.scoreText, { color: colors.text }]}>
                            {match.homeScore ?? '-'}
                        </Text>
                        <Text style={[styles.scoreDivider, { color: colors.mutedText }]}>:</Text>
                        <Text style={[styles.scoreText, { color: colors.text }]}>
                            {match.awayScore ?? '-'}
                        </Text>
                    </View>
                ) : (
                    <View style={[styles.vsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.vsText, { color: colors.mutedText }]}>
                            {match.status === 'free' ? t('team.freeShort') : t('team.vs')}
                        </Text>
                    </View>
                )}

                <Text style={[styles.matchTeam, styles.awayTeam, { color: colors.text }]} numberOfLines={2}>
                    {match.awayTeam}
                </Text>
            </View>

            <View style={styles.matchMetaRow}>
                {match.roundName || match.meetingNumber ? (
                    <View style={styles.metaLine}>
                        <Ionicons name="flag-outline" size={13} color={colors.mutedText} />
                        <Text style={[styles.metaText, { color: colors.mutedText }]}>
                            {[match.roundName, match.meetingNumber ? t('match.matchNumber', { number: match.meetingNumber }) : undefined]
                                .filter(Boolean)
                                .join(' • ')}
                        </Text>
                    </View>
                ) : null}

                {match.confirmed !== undefined ? (
                    <View style={styles.metaLine}>
                        <Ionicons
                            name={match.confirmed ? 'shield-checkmark-outline' : 'alert-circle-outline'}
                            size={13}
                            color={colors.mutedText}
                        />
                        <Text style={[styles.metaText, { color: colors.mutedText }]}>
                            {match.confirmed ? t('status.confirmed') : t('status.notConfirmed')}
                        </Text>
                    </View>
                ) : null}
            </View>
        </Card>
    );
}
