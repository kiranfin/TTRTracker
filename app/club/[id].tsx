import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ttApi } from '../../src/api/tttracker';
import { ActionButton } from '../../src/components/ActionButton';
import { Card } from '../../src/components/Card';
import { Screen } from '../../src/components/Screen';
import { isFavorite, saveFavorite } from '../../src/storage/favorites';
import { AppTheme, useTheme } from '../../src/theme/ThemeProvider';

type TeamItem = {
    id: string;
    title: string;
    subtitle: string;
    meta: string;
    association: string;
    season: string;
    groupId: string;
    teamId: string;
    leagueName: string;
};

function param(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function findTeams(value: unknown): any[] {
    const root = value as any;

    if (Array.isArray(root)) return root;
    if (Array.isArray(root?.data)) return root.data;
    if (Array.isArray(root?.data?.data)) return root.data.data;
    if (Array.isArray(root?.teams)) return root.teams;
    if (Array.isArray(root?.items)) return root.items;

    return [];
}

function mapTeams(response: unknown): TeamItem[] {
    return findTeams(response).map((team, index) => {
        const teamName = String(team.team_name ?? `Mannschaft ${index + 1}`);
        const leagueName = String(team.league_name ?? '');
        const season = String(team.season ?? '');
        const groupId = String(team.group_id ?? '');
        const teamId = String(team.team_id ?? '');
        const association = String(team.team_organisation_short ?? '');
        const rank = String(team.table_rank ?? '');
        const won = String(team.points_won ?? '');
        const lost = String(team.points_lost ?? '');

        return {
            id: `${teamId || groupId}-${index}`,
            title: teamName,
            subtitle: leagueName,
            meta: rank ? `#${rank} · ${won}:${lost}` : `${won}:${lost}`,
            association,
            season,
            groupId,
            teamId,
            leagueName,
        };
    });
}

export default function ClubDetailScreen() {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const params = useLocalSearchParams<{
        id: string;
        title?: string;
        subtitle?: string;
        organization?: string;
        clubNumber?: string;
    }>();

    const id = param(params.id);
    const title = param(params.title) || 'Verein';
    const subtitle = param(params.subtitle);
    const organization = param(params.organization);
    const clubNumber = param(params.clubNumber);

    const [saved, setSaved] = useState(false);
    const [teams, setTeams] = useState<TeamItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        isFavorite('club', id).then(setSaved);
    }, [id]);

    useEffect(() => {
        async function loadTeams() {
            if (!organization || !clubNumber) {
                setMessage('Keine Vereinsnummer gefunden.');
                return;
            }

            setLoading(true);
            setMessage('');

            try {
                const response = await ttApi.getClubTeams(organization, clubNumber);
                const mapped = mapTeams(response);

                setTeams(mapped);
                setMessage(mapped.length === 0 ? 'Keine Teams gefunden.' : '');
            } catch (error) {
                setMessage(error instanceof Error ? error.message : 'Teams konnten nicht geladen werden.');
            } finally {
                setLoading(false);
            }
        }

        loadTeams();
    }, [organization, clubNumber]);

    async function addFavorite() {
        await saveFavorite({
            id,
            type: 'club',
            title,
            subtitle,
            params: {
                id,
                title,
                subtitle,
                organization,
                clubNumber,
            },
        });

        setSaved(true);
    }

    function openLeague(team: TeamItem) {
        if (!team.association || !team.groupId) return;

        router.push({
            pathname: '/league/[id]',
            params: {
                id: team.groupId,
                title: team.leagueName,
                subtitle: team.title,
                association: team.association,
                season: team.season,
                groupId: team.groupId,
                leagueSlug: 'x',
            },
        } as any);
    }

    return (
        <Screen title={title}>
            <Card title="Verein" subtitle={subtitle || `${organization} · ${clubNumber}`} meta={organization} />

            <ActionButton
                label={saved ? 'Gespeichert' : 'Als Favorit speichern'}
                onPress={addFavorite}
                disabled={saved}
            />

            {loading ? (
                <View style={styles.loading}>
                    <ActivityIndicator color={theme.colors.accent} />
                </View>
            ) : null}

            {!loading && message ? <Card title={message} /> : null}

            {!loading && teams.length > 0 ? (
                <View style={styles.list}>
                    <Text style={styles.headline}>Teams</Text>

                    {teams.map((team) => (
                        <Card
                            key={team.id}
                            title={team.title}
                            subtitle={team.subtitle}
                            meta={team.meta}
                            onPress={() => openLeague(team)}
                        />
                    ))}
                </View>
            ) : null}
        </Screen>
    );
}

function createStyles(theme: AppTheme) {
    return StyleSheet.create({
        loading: {
            paddingVertical: 20,
            alignItems: 'center',
        },
        list: {
            gap: 12,
        },
        headline: {
            color: theme.colors.text,
            fontSize: 20,
            fontWeight: '900',
            letterSpacing: -0.4,
        },
    });
}