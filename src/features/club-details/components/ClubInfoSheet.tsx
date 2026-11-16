import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { BottomSheet } from '@/src/components/BottomSheet';
import { ListGroup } from '@/src/components/ListGroup';
import { ListRow } from '@/src/components/ListRow';
import { SectionHeader } from '@/src/components/SectionHeader';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import type { ClubAddress, ClubInfo, ClubOfficial } from '../types';
import {
  buildMapsUrl,
  formatAddress,
  formatOfficialRole,
  formatPersonName,
  openExternalUrl,
  toPhoneUrl,
  toWebsiteUrl,
} from '../utils';
import { styles } from '../styles';

type IconName = keyof typeof Ionicons.glyphMap;

function RowIcon({ icon }: { icon: IconName }) {
  const { colors } = useTheme();

  return (
      <View style={[styles.infoIcon, { backgroundColor: colors.soft }]}>
        <Ionicons name={icon} size={17} color={colors.text} />
      </View>
  );
}

// Kleiner runder Button für Mail oder Anruf rechts in einer Zeile.
function ContactButton({ icon, label, url }: { icon: IconName; label: string; url: string }) {
  const { colors } = useTheme();

  return (
      <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={() => openExternalUrl(url)}
          hitSlop={4}
          style={({ pressed }) => [styles.contactButton, { backgroundColor: colors.primarySoft, opacity: pressed ? 0.6 : 1 }]}
      >
        <Ionicons name={icon} size={17} color={colors.primary} />
      </Pressable>
  );
}

function ContactButtons({ email, phone }: { email?: string; phone?: string }) {
  const { t } = useI18n();

  if (!email && !phone) return null;

  return (
      <View style={styles.contactButtons}>
        {phone ? <ContactButton icon="call-outline" label={t('club.callAction', { phone })} url={toPhoneUrl(phone)} /> : null}
        {email ? <ContactButton icon="mail-outline" label={t('club.mailAction', { email })} url={`mailto:${email}`} /> : null}
      </View>
  );
}

function VenueGroup({ venue, index, total }: { venue: ClubAddress; index: number; total: number }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const mapsUrl = buildMapsUrl(venue);
  const fallbackTitle = total > 1 ? t('club.venueNumber', { number: index + 1 }) : t('club.venue');

  return (
      <View style={styles.sheetSection}>
        <SectionHeader variant="label" title={venue.label ?? fallbackTitle} />
        <ListGroup>
          <ListRow
              leading={<RowIcon icon="location-outline" />}
              title={venue.name ?? venue.city ?? fallbackTitle}
              subtitle={formatAddress(venue)}
              trailing={mapsUrl ? <Ionicons name="navigate-outline" size={18} color={colors.primary} /> : undefined}
              chevron={false}
              accessibilityLabel={t('club.openInMaps')}
              onPress={mapsUrl ? () => openExternalUrl(mapsUrl) : undefined}
          />
          {venue.phone ? (
              <ListRow
                  leading={<RowIcon icon="call-outline" />}
                  title={venue.phone}
                  chevron={false}
                  onPress={() => openExternalUrl(toPhoneUrl(venue.phone!))}
              />
          ) : null}
        </ListGroup>
        {venue.note ? (
            <Text style={[typography.meta, styles.sheetNote, { color: colors.mutedText }]}>{venue.note}</Text>
        ) : null}
      </View>
  );
}

function OfficialRow({ official }: { official: ClubOfficial }) {
  return (
      <ListRow
          leading={<RowIcon icon="person-outline" />}
          title={official.name}
          subtitle={formatOfficialRole(official.role)}
          trailing={<ContactButtons email={official.email} phone={official.phone} />}
      />
  );
}

type ClubInfoSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  info: ClubInfo | null;
  organization?: string;
  clubNumber?: string;
};

// Alles, was myTT unter "Vereinsinfo" zeigt: Spiellokale mit Kartenlink, Kontaktadresse, Vorstand, Stammdaten.
export function ClubInfoSheet({ visible, onClose, title, info, organization, clubNumber }: ClubInfoSheetProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const contact = info?.contact;
  const contactAddress = contact ? formatAddress(contact) : undefined;

  return (
      <BottomSheet visible={visible} title={title} onClose={onClose}>
        <View style={styles.sheetBody}>
          {info?.venues.map((venue, index) => (
              <VenueGroup key={`${venue.label ?? 'venue'}-${index}`} venue={venue} index={index} total={info.venues.length} />
          ))}

          {contact ? (
              <View style={styles.sheetSection}>
                <SectionHeader variant="label" title={t('club.contact')} />
                <ListGroup>
                  <ListRow
                      leading={<RowIcon icon="person-outline" />}
                      title={formatPersonName(contact.name) ?? t('club.contact')}
                      subtitle={contactAddress}
                      trailing={<ContactButtons email={contact.email} phone={contact.phone} />}
                  />
                  {contact.website ? (
                      <ListRow
                          leading={<RowIcon icon="globe-outline" />}
                          title={contact.website}
                          trailing={<Ionicons name="open-outline" size={16} color={colors.mutedText} />}
                          chevron={false}
                          onPress={() => openExternalUrl(toWebsiteUrl(contact.website!))}
                      />
                  ) : null}
                </ListGroup>
              </View>
          ) : null}

          {info && info.officials.length > 0 ? (
              <View style={styles.sheetSection}>
                <SectionHeader variant="label" title={t('club.officials')} />
                <ListGroup>
                  {info.officials.map((official, index) => (
                      <OfficialRow key={`${official.name}-${index}`} official={official} />
                  ))}
                </ListGroup>
              </View>
          ) : null}

          <View style={styles.sheetSection}>
            <SectionHeader variant="label" title={t('club.masterData')} />
            <ListGroup>
              {info?.organizationName || organization ? (
                  <ListRow
                      leading={<RowIcon icon="git-branch-outline" />}
                      title={info?.organizationName ?? organization!}
                      subtitle={info?.region ? t('club.regionValue', { region: info.region }) : undefined}
                  />
              ) : null}
              {clubNumber ? (
                  <ListRow leading={<RowIcon icon="pricetag-outline" />} title={t('club.clubNumberShort', { clubNumber })} />
              ) : null}
              {info?.foundationYear ? (
                  <ListRow
                      leading={<RowIcon icon="flag-outline" />}
                      title={t('club.foundedValue', { year: info.foundationYear })}
                  />
              ) : null}
            </ListGroup>
          </View>

          {!info ? (
              <Text style={[typography.meta, styles.sheetNote, { color: colors.mutedText }]}>{t('club.infoUnavailable')}</Text>
          ) : null}
        </View>
      </BottomSheet>
  );
}
