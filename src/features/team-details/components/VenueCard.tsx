import { Text, View } from 'react-native';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { joinParts, isProbablyUrl } from '../utils';
import { styles } from '../styles';
import { ExternalLinkRow } from './ExternalLinkRow';
import { InfoRow } from './InfoRow';

export function VenueCard({
                       venue,
                       index,
                       total,
                   }: {
    venue: Record<string, string>;
    index: number;
    total: number;
}) {
    const { colors } = useTheme();
    const { t } = useI18n();

    const title = venue.label ?? t('team.venueWithNumber', { number: index + 1 });
    const name = venue.contact_name ?? venue.name;

    return (
        <View style={[styles.venueBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            {total > 1 ? (
                <Text style={[styles.venueTitle, { color: colors.text }]}>{title}</Text>
            ) : null}

            <View style={styles.infoList}>
                <InfoRow icon="business-outline" label={t('team.name')} value={name ?? title} />
                <InfoRow
                    icon="location-outline"
                    label={t('team.address')}
                    value={joinParts([venue.street, venue.zipcode, venue.city])}
                />

                {isProbablyUrl(venue.website) ? (
                    <ExternalLinkRow icon="globe-outline" label={t('team.website')} value={venue.website} />
                ) : (
                    <InfoRow icon="chatbox-ellipses-outline" label={t('team.note')} value={venue.website} />
                )}

                <InfoRow icon="call-outline" label={t('team.phone')} value={venue.phone_home ?? venue.phone_mobile} />
            </View>
        </View>
    );
}
