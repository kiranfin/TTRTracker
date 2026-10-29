import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { ListRow } from '@/src/components/ListRow';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import { getCurrentSeason } from '@/src/utils/dates';
import type { ClubTeam } from '@/src/types/tttracker';
import { styles } from '../styles';

// Mannschaft mit Liga. Der Tabellenplatz erscheint nur, wenn ihn die Teamliste schon mitliefert.
export function ClubTeamRow({
  team,
  organization,
  clubNumber,
  logoUrl,
}: {
  team: ClubTeam;
  organization?: string;
  clubNumber?: string;
  logoUrl?: string;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
      <ListRow
          title={team.teamName}
          subtitle={team.leagueName || undefined}
          trailing={
            team.tableRank ? (
                <View style={styles.rankBlock}>
                  <Text style={[numeric.row, { color: colors.text }]}>{team.tableRank}.</Text>
                  {team.pointsWon && team.pointsLost ? (
                      <Text style={[typography.label, { color: colors.mutedText }]}>
                        {t('club.pointsValue', { won: team.pointsWon, lost: team.pointsLost })}
                      </Text>
                  ) : null}
                </View>
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
                        season: team.season || getCurrentSeason(),
                        leagueSlug: team.leagueSlug ?? 'x',
                        clubOrganization: organization ?? '',
                        clubNumber: clubNumber ?? '',
                        clubLogoUrl: logoUrl ?? '',
                      },
                    })
                : undefined
          }
      />
  );
}
