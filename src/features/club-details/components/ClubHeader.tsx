import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import type { ClubAddress } from '../types';
import { styles } from '../styles';
import { ClubLogo } from '@/src/components/ClubLogo';

type ClubHeaderProps = {
  title: string;
  meta: string;
  organization?: string;
  clubNumber?: string;
  logoUrl?: string;
  venue?: ClubAddress;
  venueCount: number;
  claimLoading?: boolean;
  onOpenInfo?: () => void;
  onClaimClub?: () => void;
};

// Logo, Name und Region, darunter das Spiellokal als Link zu den Vereinsinfos.
// Ist noch kein eigener Verein gesetzt, folgt wie beim Spielerprofil ein Hinweislink zum Festlegen.
export function ClubHeader({
  title,
  meta,
  organization,
  clubNumber,
  logoUrl,
  venue,
  venueCount,
  claimLoading,
  onOpenInfo,
  onClaimClub,
}: ClubHeaderProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const venueLabel = venue ? [venue.name, venue.city].filter(Boolean).join(', ') : undefined;

  return (
      <View style={styles.clubHead}>
        <View style={styles.clubIdentity}>
          <ClubLogo organization={organization} clubNumber={clubNumber} uri={logoUrl} size={64} />

          <View style={styles.clubHeadText}>
            <Text style={[typography.heading, { color: colors.text }]} numberOfLines={2}>
              {title}
            </Text>

            {meta ? (
                <Text style={[typography.meta, { color: colors.mutedText }]} numberOfLines={1}>
                  {meta}
                </Text>
            ) : null}

            {venueLabel ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('club.venueA11y', { venue: venueLabel })}
                    disabled={!onOpenInfo}
                    onPress={onOpenInfo}
                    hitSlop={{ top: 8, bottom: 8 }}
                    style={({ pressed }) => [styles.venueLink, { opacity: pressed ? 0.6 : 1 }]}
                >
                  <Ionicons name="location-outline" size={15} color={colors.primary} />
                  <Text style={[typography.metaStrong, styles.venueLinkText, { color: colors.primary }]} numberOfLines={1}>
                    {venueLabel}
                  </Text>
                  {venueCount > 1 ? (
                      <Text style={[typography.metaStrong, { color: colors.primary }]}>+{venueCount - 1}</Text>
                  ) : null}
                  <Ionicons name="chevron-forward" size={15} color={colors.primary} />
                </Pressable>
            ) : null}
          </View>
        </View>

        {onClaimClub ? (
            <Pressable
                accessibilityRole="button"
                disabled={claimLoading}
                onPress={onClaimClub}
                hitSlop={{ top: 8, bottom: 8 }}
                style={({ pressed }) => [styles.claimLink, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Ionicons name="home-outline" size={15} color={colors.mutedText} />
              <Text style={[typography.meta, { color: colors.mutedText }]}>{t('club.claimQuestion')}</Text>
              <Text style={[typography.metaStrong, { color: colors.primary }]}>{t('club.claimAction')}</Text>
              {claimLoading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
            </Pressable>
        ) : null}
      </View>
  );
}
