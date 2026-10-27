import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { EmptyState } from '@/src/components/EmptyState';
import { useI18n } from '@/src/i18n/I18nProvider';
import type { MeClub } from '@/src/storage/meClub';
import { useTheme } from '@/src/theme/ThemeProvider';
import { font, numeric, typography } from '@/src/theme/typography';
import type { TableRow } from '@/src/types/tttracker';
import type { LeagueInfo, TeamScheduleStats } from '../types';
import {
    formatTablePoints,
    getPromotionState,
    getTableRowKey,
    getTableStats,
    getTeamRouteId,
    normalizeTeamKey,
} from '../utils';
import { styles } from '../styles';

type LeagueTableProps = {
    rows: TableRow[];
    league: LeagueInfo;
    scheduleStatsByTeam: Map<string, TeamScheduleStats>;
    meClub: MeClub | null;
};

function normalizeName(value?: string) {
    return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

// Eigene Mannschaft: Vereinsnummer passt oder der Mannschaftsname enthält den gespeicherten Vereinsnamen.
function isOwnTeam(row: TableRow, teamName: string, meClub: MeClub | null) {
    if (!meClub) return false;

    if (row.clubId && String(row.clubId) === meClub.clubNumber) return true;

    const clubName = normalizeName(meClub.clubName ?? meClub.title);

    return clubName.length > 2 && normalizeName(teamName).includes(clubName);
}

// "12:8" wird zu +4. Fehlt das Verhältnis oder ist es nicht lesbar, bleibt die Zelle leer.
function getDiff(ratio: string) {
    const match = ratio.match(/(\d+)\s*:\s*(\d+)/);
    if (!match) return undefined;

    return Number(match[1]) - Number(match[2]);
}

export function LeagueTable({ rows, league, scheduleStatsByTeam, meClub }: LeagueTableProps) {
    const { colors } = useTheme();
    const { t } = useI18n();

    if (rows.length === 0) {
        return <EmptyState icon="list-outline" title={t('league.noTable')} />;
    }

    const headerStyle = [typography.caption, styles.headerLabel, { color: colors.mutedText }];

    return (
        <View style={{ gap: 10 }}>
            <View style={[styles.tableCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[headerStyle, styles.colRank]}>{t('league.rankShort')}</Text>
                    <Text style={[headerStyle, styles.colTeam]}>{t('league.teamShort')}</Text>
                    <Text style={[headerStyle, styles.colGames]}>{t('league.gamesShort')}</Text>
                    <Text style={[headerStyle, styles.colDiff]}>{t('league.diffShort')}</Text>
                    <Text style={[headerStyle, styles.colPoints]}>{t('league.pointsShort')}</Text>
                </View>

                {rows.map((row, index) => {
                    const stats = getTableStats(row, index, scheduleStatsByTeam.get(normalizeTeamKey(row.teamName)), t);
                    const promotion = getPromotionState(row);
                    const own = isOwnTeam(row, stats.teamName, meClub);
                    const diff = getDiff(stats.ratio);
                    const barColor =
                        promotion === 'promotion'
                            ? colors.positive
                            : promotion === 'relegation'
                                ? colors.negative
                                : promotion === 'none'
                                    ? 'transparent'
                                    : colors.warning;

                    return (
                        <Pressable
                            key={getTableRowKey(row, index)}
                            accessibilityRole="button"
                            accessibilityLabel={stats.teamName}
                            onPress={() =>
                                router.push({
                                    pathname: '/team/[teamId]',
                                    params: {
                                        teamId: getTeamRouteId(row, stats.teamName),
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
                                styles.tableRow,
                                index > 0 && { borderTopWidth: 0.5, borderTopColor: colors.border },
                                own && { backgroundColor: colors.primarySoft },
                                pressed && { opacity: 0.7 },
                            ]}
                        >
                            <View style={[styles.rankBar, { backgroundColor: barColor }]} />

                            <Text style={[numeric.small, styles.colRank, { color: own ? colors.primary : colors.text, ...font('700') }]}>
                                {stats.position}
                            </Text>

                            <Text
                                style={[typography.body, styles.colTeam, { color: colors.text, ...font(own ? '800' : '600') }]}
                                numberOfLines={1}
                            >
                                {stats.teamName}
                            </Text>

                            <Text style={[numeric.small, styles.colGames, { color: colors.mutedText }]}>{stats.games}</Text>

                            <Text
                                style={[
                                    numeric.small,
                                    styles.colDiff,
                                    { color: colors.mutedText },
                                ]}
                            >
                                {diff === undefined ? '-' : diff > 0 ? `+${diff}` : diff < 0 ? `−${Math.abs(diff)}` : '0'}
                            </Text>

                            <Text style={[numeric.small, styles.colPoints, { color: colors.text, ...font('800') }]}>
                                {formatTablePoints(stats.points)}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.positive }]} />
                    <Text style={[typography.label, { color: colors.mutedText }]}>{t('league.legendPromotion')}</Text>
                </View>

                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.negative }]} />
                    <Text style={[typography.label, { color: colors.mutedText }]}>{t('league.legendRelegation')}</Text>
                </View>

                {rows.some((row) => {
                    const state = getPromotionState(row);
                    return state === 'promotionPlayoff' || state === 'relegationPlayoff';
                }) ? (
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                        <Text style={[typography.label, { color: colors.mutedText }]}>{t('league.legendPlayoff')}</Text>
                    </View>
                ) : null}

                {meClub ? (
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                        <Text style={[typography.label, { color: colors.mutedText }]}>{t('league.ownTeam')}</Text>
                    </View>
                ) : null}
            </View>
        </View>
    );
}
