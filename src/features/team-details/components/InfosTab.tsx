import { Image, Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { ListGroup } from '@/src/components/ListGroup';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import type { TeamContext, TeamInfo, ScheduleSummary } from '../types';
import { formatDateLabel, getOpponentName, isProbablyUrl, joinParts } from '../utils';
import { styles } from '../styles';
import { filterInfoItems, InfoRow, type InfoItem } from './InfoRow';

function InfoSection({ title, items, emptyText }: { title: string; items: InfoItem[]; emptyText?: string }) {
  const { colors } = useTheme();
  const visible = filterInfoItems(items);

  if (visible.length === 0 && !emptyText) return null;

  return (
      <View style={styles.section}>
        <SectionHeader variant="label" title={title} />
        {visible.length > 0 ? (
            <ListGroup>
              {visible.map((item) => (
                  <InfoRow key={`${item.label}-${item.value}`} item={item} />
              ))}
            </ListGroup>
        ) : (
            <Card style={styles.emptyCard}>
              <Text style={[typography.body, { color: colors.mutedText }]}>{emptyText}</Text>
            </Card>
        )}
      </View>
  );
}

export function InfosTab({
                           team,
                           info,
                           summary,
                         }: {
  team: TeamContext;
  info: TeamInfo | null;
  summary: ScheduleSummary;
}) {
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

        <InfoSection
            title={t('team.teamInfos')}
            items={[
              { icon: 'trophy-outline', label: t('team.league'), value: team.leagueTitle ?? headInfos?.league_name },
              { icon: 'calendar-outline', label: t('common.season'), value: headInfos?.season ?? team.season },
              { icon: 'git-branch-outline', label: t('team.association'), value: headInfos?.organization_short ?? team.association },
              { icon: 'map-outline', label: t('team.region'), value: headInfos?.region },
              { icon: 'business-outline', label: t('team.club'), value: headInfos?.club_name },
              { icon: 'albums-outline', label: t('team.playMode'), value: headInfos?.play_mode },
              { icon: 'person-outline', label: t('team.ageGroup'), value: headInfos?.gender_age_group },
              {
                icon: 'time-outline',
                label: t('team.nextMatch'),
                value: summary.nextMatch
                    ? t('team.nextMatchValue', {
                      date: formatDateLabel(summary.nextMatch.date, language),
                      opponent: getOpponentName(summary.nextMatch, team),
                    })
                    : undefined,
              },
            ]}
        />

        <InfoSection
            title={t('team.teamLeadership')}
            emptyText={t('team.leadershipEmpty')}
            items={[
              { icon: 'person-outline', label: t('team.contact'), value: contact?.contact_name },
              { icon: 'location-outline', label: t('team.address'), value: joinParts([contact?.street, contact?.zipcode, contact?.city]) },
              { icon: 'call-outline', label: t('team.privatePhone'), value: contact?.phone_home },
              { icon: 'briefcase-outline', label: t('team.workPhone'), value: contact?.phone_work },
              { icon: 'phone-portrait-outline', label: t('team.mobile'), value: contact?.phone_mobile },
              { icon: 'mail-outline', label: t('team.privateEmail'), value: contact?.email_home },
              { icon: 'mail-unread-outline', label: t('team.workEmail'), value: contact?.email_work },
            ]}
        />

        {venues.length === 0 ? (
            <InfoSection title={t('team.venue')} emptyText={t('team.venueEmpty')} items={[]} />
        ) : (
            venues.map((venue, index) => (
                <InfoSection
                    key={`${venue.label ?? 'venue'}-${venue.street ?? ''}-${index}`}
                    title={venues.length > 1 ? venue.label ?? t('team.venueWithNumber', { number: index + 1 }) : t('team.venue')}
                    items={[
                      { icon: 'business-outline', label: t('team.name'), value: venue.contact_name ?? venue.name ?? venue.label },
                      { icon: 'location-outline', label: t('team.address'), value: joinParts([venue.street, venue.zipcode, venue.city]) },
                      isProbablyUrl(venue.website)
                          ? { icon: 'globe-outline', label: t('team.website'), value: venue.website, link: true }
                          : { icon: 'chatbox-ellipses-outline', label: t('team.note'), value: venue.website },
                      { icon: 'call-outline', label: t('team.phone'), value: venue.phone_home ?? venue.phone_mobile },
                    ]}
                />
            ))
        )}

        <InfoSection
            title={t('team.documents')}
            items={[
              { icon: 'chatbox-ellipses-outline', label: t('team.remarks'), value: info?.remarks },
              { icon: 'document-outline', label: t('team.schedulePdf'), value: info?.pdfVersionUrl, link: true },
              { icon: 'documents-outline', label: t('team.materialsPdf'), value: info?.pdfMaterialsUrl, link: true },
            ]}
        />
      </View>
  );
}
