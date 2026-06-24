import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Badge } from '@/src/components/Badge';
import { Card } from '@/src/components/Card';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { ClubScheduleMatch } from '../types';
import { matchStatusLabelKey } from '../utils';
import { styles } from '../styles';

export function ClubMatchCard({ match }: { match: ClubScheduleMatch }) {
    const { colors } = useTheme();
    const { t } = useI18n();
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
            style={styles.matchCard}
        >
            <View style={styles.matchTopMeta}>
                <View style={styles.metaLine}>
                    <Ionicons name="time-outline" size={13} color={colors.mutedText} />
                    <Text style={[styles.metaText, { color: colors.mutedText }]}>
                        {match.time || t('club.timeOpen')}
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
                    {t(matchStatusLabelKey(match.status))}
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
                            {match.status === 'free' ? t('club.freeShort') : t('club.vs')}
                        </Text>
                    </View>
                )}

                <Text style={[styles.matchTeam, styles.awayTeam, { color: colors.text }]} numberOfLines={2}>
                    {match.awayTeam}
                </Text>
            </View>

            <View style={styles.matchMetaRow}>
                {match.clubTeamName || match.leagueName ? (
                    <View style={styles.metaLine}>
                        <Ionicons name="people-outline" size={13} color={colors.mutedText} />
                        <Text style={[styles.metaText, { color: colors.mutedText }]} numberOfLines={1}>
                            {[match.clubTeamName, match.leagueName].filter(Boolean).join(' • ')}
                        </Text>
                    </View>
                ) : null}

                {match.roundName || match.meetingNumber ? (
                    <View style={styles.metaLine}>
                        <Ionicons name="flag-outline" size={13} color={colors.mutedText} />
                        <Text style={[styles.metaText, { color: colors.mutedText }]} numberOfLines={1}>
                            {[match.roundName, match.meetingNumber ? t('home.matchNumber', { number: match.meetingNumber }) : undefined]
                                .filter(Boolean)
                                .join(' • ')}
                        </Text>
                    </View>
                ) : null}
            </View>
        </Card>
    );
}
