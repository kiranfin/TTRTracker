import { router } from 'expo-router';
import { Text } from 'react-native';
import { Avatar } from '@/src/components/Avatar';
import { ListRow } from '@/src/components/ListRow';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import type { ClubTeam } from '@/src/types/tttracker';

// Mannschaft mit Liga. Der Tabellenplatz erscheint nur, wenn ihn die Teamliste schon mitliefert.
export function ClubTeamRow({ team }: { team: ClubTeam }) {
    const { colors } = useTheme();
    const { t } = useI18n();

    return (
        <ListRow
            leading={<Avatar icon="people" size={40} />}
            title={team.teamName}
            subtitle={team.leagueName || undefined}
            trailing={
                team.tableRank ? (
                    <Text style={[typography.meta, { color: colors.mutedText, fontWeight: '700' }]}>
                        {t('club.rankValue', { rank: team.tableRank })}
                    </Text>
                ) : undefined
            }
            onPress={
                team.id
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
        />
    );
}
