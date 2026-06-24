import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { TableRow } from '@/src/types/tttracker';
import type { LeagueInfo, TeamScheduleStats } from '../types';
import { getTableStats, getTeamRouteId, getTableCardAccent, formatTablePoints } from '../utils';
import { styles } from '../styles';
import { TableStatTile } from './TableStatTile';

export function TableTeamRow({
                          row,
                          index,
                          league,
                          scheduleStats,
                      }: {
    row: TableRow;
    index: number;
    league: LeagueInfo;
    scheduleStats?: TeamScheduleStats;
}) {
    const { colors } = useTheme();
    const { t } = useI18n();
    const stats = getTableStats(row, index, scheduleStats, t);
    const teamId = getTeamRouteId(row, stats.teamName);
    const accent = getTableCardAccent(row, colors);

    return (
        <Pressable
            onPress={() =>
                router.push({
                    pathname: '/team/[teamId]',
                    params: {
                        teamId,
                        teamName: stats.teamName,
                        leagueTitle: league.title,
                        season: league.season,
                        association: league.association ?? '',
                        groupId: league.groupId ?? '',
                        leagueSlug: league.leagueSlug,
                    },
                })
            }
            style={({ pressed }) => [
                styles.leagueTeamCard,
                {
                    backgroundColor: accent.background,
                    borderColor: accent.border,
                },
                pressed ? styles.leagueTeamCardPressed : null,
            ]}
        >
            <View style={styles.leagueTeamHeader}>
                <View
                    style={[
                        styles.leagueRankBadge,
                        {
                            backgroundColor: accent.rankBackground,
                            borderColor: accent.rankBorder,
                        },
                    ]}
                >
                    <Text style={[styles.leagueRankText, { color: accent.rankText }]}>
                        {stats.position}
                    </Text>
                </View>

                <View style={styles.leagueTeamTitleBlock}>
                    <Text style={[styles.leagueTeamName, { color: colors.text }]} numberOfLines={2}>
                        {stats.teamName}
                    </Text>
                </View>
            </View>

            <View style={styles.leagueStatGrid}>
                <TableStatTile
                    label={t('league.points')}
                    value={formatTablePoints(stats.points)}
                    tone="points"
                    strong
                />

                <TableStatTile label={t('league.games')} value={stats.games} tone="games" />
                <TableStatTile label={t('league.record')} value={stats.record} tone="record" />
                <TableStatTile label={t('league.ratio')} value={stats.ratio} tone="ratio" />
            </View>
        </Pressable>
    );
}
