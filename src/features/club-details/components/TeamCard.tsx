import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Badge } from '@/src/components/Badge';
import { Card } from '@/src/components/Card';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { ClubTeam } from '@/src/types/tttracker';
import { styles } from '../styles';

export function TeamCard({ team }: { team: ClubTeam }) {
    const { colors } = useTheme();
    const canOpen = Boolean(team.id);

    return (
        <Card
            pressable={canOpen}
            style={styles.teamCard}
            onPress={
                canOpen
                    ? () =>
                        router.push({
                            pathname: '/team/[teamId]',
                            params: {
                                teamId: team.id!,
                                teamName: team.teamName,
                                leagueTitle: team.leagueName ?? '',
                                association: team.association ?? '',
                                groupId: team.groupId ?? '',
                                season: team.season ?? '25/26',
                                leagueSlug: team.leagueSlug ?? 'x',
                            },
                        })
                    : undefined
            }
        >
            <View style={styles.teamTopRow}>
                <View
                    style={[
                        styles.teamIcon,
                        {
                            backgroundColor: colors.primarySoft,
                            borderColor: colors.primarySoftBorder,
                        },
                    ]}
                >
                    <Ionicons name="people-outline" size={20} color={colors.primary} />
                </View>

                <View style={styles.teamText}>
                    <Text style={[styles.teamName, { color: colors.text }]} numberOfLines={2}>
                        {team.teamName}
                    </Text>
                    <Text style={[styles.teamLeague, { color: colors.mutedText }]} numberOfLines={2}>
                        {team.leagueName}
                    </Text>
                </View>

                {canOpen ? <Ionicons name="chevron-forward" size={18} color={colors.mutedText} /> : null}
            </View>

            <View style={styles.badgeRow}>
                {team.tableRank ? <Badge tone="secondary">Platz {team.tableRank}</Badge> : null}

                {team.pointsWon || team.pointsLost ? (
                    <Badge tone="outline">
                        {team.pointsWon ?? '0'}:{team.pointsLost ?? '0'} Punkte
                    </Badge>
                ) : null}

                {team.season ? <Badge tone="outline">{team.season}</Badge> : null}
            </View>
        </Card>
    );
}
