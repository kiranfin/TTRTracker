import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ttApi } from '../../../src/api/tttracker';
import { Badge } from '../../../src/components/Badge';
import { Button } from '../../../src/components/Button';
import { Card } from '../../../src/components/Card';
import { EmptyState } from '../../../src/components/EmptyState';
import { Screen } from '../../../src/components/Screen';
import { useTheme } from '../../../src/theme/ThemeProvider';
import type { ClubTeam } from '../../../src/types/tttracker';
import { normalizeTeams } from '../../../src/utils/normalizers';

export default function ClubDetailsScreen() {
    const params = useLocalSearchParams<Record<string, string>>();
    const { colors } = useTheme();
    const [teams, setTeams] = useState<ClubTeam[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const title = params.title ?? 'Verein';
    const organization = params.organization;
    const clubNumber = params.clubNumber;

    useEffect(() => {
        async function load() {
            if (!organization || !clubNumber) {
                setLoading(false);
                setError('Für diesen Verein fehlen Verband oder Vereinsnummer.');
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await ttApi.getClubTeams(organization, clubNumber);
                setTeams(normalizeTeams(response));
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : 'Vereinsdaten konnten nicht geladen werden');
            } finally {
                setLoading(false);
            }
        }

        load().catch(() => undefined);
    }, [organization, clubNumber]);

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                    <Button variant="ghost" icon="arrow-back" onPress={() => router.back()}> </Button>

                    <View style={styles.headerText}>
                        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{title}</Text>
                        <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={1}>
                            {[params.state, organization].filter(Boolean).join(' • ') || 'Verein'}
                        </Text>
                    </View>
                </View>

                <Card style={styles.infoCard}>
                    <View style={styles.badgeRow}>
                        {clubNumber ? <Badge tone="secondary" icon="people-outline">#{clubNumber}</Badge> : null}
                        {params.state ? <Badge tone="outline">{params.state}</Badge> : null}
                        {organization ? <Badge tone="outline">{organization}</Badge> : null}
                    </View>

                    <InfoRow label="Vereinsnummer" value={clubNumber || 'Nicht verfügbar'} />
                    <InfoRow label="Bundesland" value={params.state || 'Nicht verfügbar'} />
                    <InfoRow label="Verband" value={organization || params.organizationName || 'Nicht verfügbar'} />
                    <InfoRow label="External-ID" value={params.externalId || 'Nicht verfügbar'} />
                </Card>

                <View style={styles.sectionHeader}>
                    <View>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Mannschaften</Text>
                        <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>Teams und zugehörige Ligen</Text>
                    </View>
                    <Badge tone="secondary">{teams.length}</Badge>
                </View>

                {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
                {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}

                {!loading && !error && teams.length === 0 ? (
                    <EmptyState icon="people-outline" title="Keine Mannschaften gefunden" />
                ) : null}

                <View style={styles.stack}>
                    {teams.map((team, index) => {
                        const teamKey = [
                            team.association,
                            team.groupId,
                            team.id,
                            team.season,
                            team.leagueSlug,
                            index,
                        ]
                            .filter(Boolean)
                            .join('-');

                        return (
                            <Card
                                key={teamKey}
                                pressable={Boolean(team.groupId && team.association)}
                                style={styles.teamCard}
                                onPress={() => {
                                    if (!team.groupId || !team.association) return;

                                    router.push({
                                        pathname: '/league/[leagueKey]',
                                        params: {
                                            leagueKey: team.groupId,
                                            association: team.association,
                                            groupId: team.groupId,
                                            season: team.season ?? '25/26',
                                            leagueSlug: team.leagueSlug ?? 'x',
                                            title: team.leagueName,
                                        },
                                    });
                                }}
                            >
                                <View style={styles.teamTopRow}>
                                    <View style={[styles.teamIcon, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder }]}>
                                        <Ionicons name="people-outline" size={20} color={colors.primary} />
                                    </View>

                                    <View style={styles.teamText}>
                                        <Text style={[styles.teamName, { color: colors.text }]}>{team.teamName}</Text>
                                        <Text style={[styles.teamLeague, { color: colors.mutedText }]}>{team.leagueName}</Text>
                                    </View>

                                    <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
                                </View>

                                <View style={styles.badgeRow}>
                                    {team.tableRank ? <Badge tone="secondary">Platz {team.tableRank}</Badge> : null}
                                    {team.pointsWon || team.pointsLost ? <Badge tone="outline">{team.pointsWon ?? '0'}:{team.pointsLost ?? '0'} Punkte</Badge> : null}
                                    {team.season ? <Badge tone="outline">{team.season}</Badge> : null}
                                </View>
                            </Card>
                        );
                    })}
                </View>
            </ScrollView>
        </Screen>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    const { colors } = useTheme();

    return (
        <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.mutedText }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 16,
        paddingBottom: 112,
        gap: 16,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 25,
        lineHeight: 32,
        fontWeight: '900',
    },
    subtitle: {
        marginTop: 2,
        fontSize: 14,
        lineHeight: 20,
    },
    infoCard: {
        padding: 16,
        gap: 10,
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    infoRow: {
        minHeight: 42,
        paddingVertical: 9,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    infoLabel: {
        fontSize: 14,
        lineHeight: 20,
    },
    infoValue: {
        flex: 1,
        textAlign: 'right',
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '800',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionTitle: {
        fontSize: 20,
        lineHeight: 26,
        fontWeight: '900',
    },
    sectionSubtitle: {
        marginTop: 2,
        fontSize: 13,
        lineHeight: 18,
    },
    loader: {
        paddingVertical: 24,
    },
    error: {
        fontSize: 14,
        lineHeight: 20,
    },
    stack: {
        gap: 12,
    },
    teamCard: {
        padding: 14,
        gap: 12,
    },
    teamTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    teamIcon: {
        width: 42,
        height: 42,
        borderRadius: 15,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    teamText: {
        flex: 1,
    },
    teamName: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '900',
    },
    teamLeague: {
        marginTop: 2,
        fontSize: 13,
        lineHeight: 18,
    },
});