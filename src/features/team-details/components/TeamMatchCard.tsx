import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Badge } from '@/src/components/Badge';
import { Card } from '@/src/components/Card';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { TeamContext, TeamScheduleMatch } from '../types';
import { formatDateLabel, getOpponentName, joinParts, teamMatchStatusLabel, isOwnTeam } from '../utils';
import { styles } from '../styles';

export function TeamMatchCard({
                           match,
                           team,
                           highlighted,
                       }: {
    match: TeamScheduleMatch;
    team: TeamContext;
    highlighted?: boolean;
}) {
    const { colors } = useTheme();
    const { t, language } = useI18n();
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
                    {teamMatchStatusLabel(match.status, t)}
                </Badge>
            </View>

            <View style={styles.matchScoreRow}>
                <Text
                    style={[
                        styles.matchTeam,
                        isOwnTeam(match.homeTeam, match.homeTeamId, team)
                            ? { color: colors.primary }
                            : { color: colors.text },
                    ]}
                    numberOfLines={2}
                >
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

                <Text
                    style={[
                        styles.matchTeam,
                        styles.awayTeam,
                        isOwnTeam(match.awayTeam, match.awayTeamId, team)
                            ? { color: colors.primary }
                            : { color: colors.text },
                    ]}
                    numberOfLines={2}
                >
                    {match.awayTeam}
                </Text>
            </View>

            <View style={styles.matchMetaRow}>
                {match.locationLabel || match.locationCity ? (
                    <View style={styles.metaLine}>
                        <Ionicons name="location-outline" size={13} color={colors.mutedText} />
                        <Text style={[styles.metaText, { color: colors.mutedText }]}>
                            {joinParts([match.locationLabel, match.locationCity])}
                        </Text>
                    </View>
                ) : null}

                {getOpponentName(match, team) ? (
                    <View style={styles.metaLine}>
                        <Ionicons name="swap-horizontal-outline" size={13} color={colors.mutedText} />
                        <Text style={[styles.metaText, { color: colors.mutedText }]}>
                            {t('team.opponent', { opponent: getOpponentName(match, team) })}
                        </Text>
                    </View>
                ) : null}
            </View>
        </Card>
    );
}
