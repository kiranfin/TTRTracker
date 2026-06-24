import { Ionicons } from '@expo/vector-icons';
import { Image, Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { EmptyState } from '@/src/components/EmptyState';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { TeamContext, TeamInfo, ScheduleSummary } from '../types';
import { formatDateLabel, getOpponentName, hasDisplayableValues, joinParts } from '../utils';
import { styles } from '../styles';
import { ExternalLinkRow } from './ExternalLinkRow';
import { InfoRow } from './InfoRow';
import { VenueCard } from './VenueCard';

export function InfosTab({
                      team,
                      info,
                      summary,
                  }: {
    team: TeamContext;
    info: TeamInfo | null;
    summary: ScheduleSummary;
}) {
    const { colors } = useTheme();
    const { t, language } = useI18n();

    const contact = info?.contact;
    const headInfos = info?.headInfos;
    const venues = info?.venues?.length ? info.venues : info?.venue ? [info.venue] : [];

    return (
        <View style={styles.stack}>
            {info?.teamPhotoUrl ? (
                <Card style={styles.imageCard}>
                    <Image source={{ uri: info.teamPhotoUrl }} style={styles.teamImage} resizeMode="cover" />
                </Card>
            ) : null}

            <Card style={styles.sectionCard}>
                <View style={styles.sectionHeaderCompact}>
                    <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                    <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>
                        {t('team.teamInfos')}
                    </Text>
                </View>

                <View style={styles.infoList}>
                    <InfoRow icon="people-outline" label={t('team.team')} value={team.teamName} />
                    <InfoRow icon="trophy-outline" label={t('team.league')} value={team.leagueTitle ?? headInfos?.league_name} />
                    <InfoRow icon="calendar-outline" label={t('common.season')} value={headInfos?.season ?? team.season} />
                    <InfoRow icon="git-branch-outline" label={t('team.association')} value={headInfos?.organization_short ?? team.association} />
                    <InfoRow icon="map-outline" label={t('team.region')} value={headInfos?.region} />
                    <InfoRow icon="business-outline" label={t('team.club')} value={headInfos?.club_name} />
                    <InfoRow icon="albums-outline" label={t('team.playMode')} value={headInfos?.play_mode} />
                    <InfoRow icon="person-outline" label={t('team.ageGroup')} value={headInfos?.gender_age_group} />
                    <InfoRow
                        icon="time-outline"
                        label={t('team.nextMatch')}
                        value={
                            summary.nextMatch
                                ? t('team.nextMatchValue', {
                                    date: formatDateLabel(summary.nextMatch.date, language),
                                    opponent: getOpponentName(summary.nextMatch, team),
                                })
                                : undefined
                        }
                    />
                </View>
            </Card>

            <Card style={styles.sectionCard}>
                <View style={styles.sectionHeaderCompact}>
                    <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
                    <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>
                        {t('team.teamLeadership')}
                    </Text>
                </View>

                {contact && hasDisplayableValues(contact) ? (
                    <View style={styles.infoList}>
                        <InfoRow icon="person-outline" label={t('team.contact')} value={contact.contact_name} />
                        <InfoRow icon="location-outline" label={t('team.address')} value={joinParts([contact.street, contact.zipcode, contact.city])} />
                        <InfoRow icon="call-outline" label={t('team.privatePhone')} value={contact.phone_home} />
                        <InfoRow icon="briefcase-outline" label={t('team.workPhone')} value={contact.phone_work} />
                        <InfoRow icon="phone-portrait-outline" label={t('team.mobile')} value={contact.phone_mobile} />
                        <InfoRow icon="mail-outline" label={t('team.privateEmail')} value={contact.email_home} />
                        <InfoRow icon="mail-unread-outline" label={t('team.workEmail')} value={contact.email_work} />
                    </View>
                ) : (
                    <EmptyState icon="person-circle-outline" title={t('team.leadershipEmpty')} />
                )}
            </Card>

            <Card style={styles.sectionCard}>
                <View style={styles.sectionHeaderCompact}>
                    <Ionicons name="home-outline" size={18} color={colors.primary} />
                    <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>
                        {venues.length > 1 ? t('team.venues') : t('team.venue')}
                    </Text>
                </View>

                {venues.length > 0 ? (
                    <View style={styles.stack}>
                        {venues.map((item, index) => (
                            <VenueCard
                                key={`${item.label ?? 'venue'}-${item.street ?? ''}-${index}`}
                                venue={item}
                                index={index}
                                total={venues.length}
                            />
                        ))}
                    </View>
                ) : (
                    <EmptyState icon="home-outline" title={t('team.venueEmpty')} />
                )}
            </Card>

            {info?.remarks || info?.pdfVersionUrl || info?.pdfMaterialsUrl ? (
                <Card style={styles.sectionCard}>
                    <View style={styles.sectionHeaderCompact}>
                        <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                        <Text style={[styles.sectionTitleCompact, { color: colors.text }]}>{t('team.documents')}</Text>
                    </View>

                    <View style={styles.infoList}>
                        <InfoRow icon="chatbox-ellipses-outline" label={t('team.remarks')} value={info.remarks} />
                        <ExternalLinkRow icon="document-outline" label={t('team.schedulePdf')} value={info.pdfVersionUrl} />
                        <ExternalLinkRow icon="documents-outline" label={t('team.materialsPdf')} value={info.pdfMaterialsUrl} />
                    </View>
                </Card>
            ) : null}
        </View>
    );
}
