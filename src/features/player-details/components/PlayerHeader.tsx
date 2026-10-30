import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Avatar } from '@/src/components/Avatar';
import { Badge } from '@/src/components/Badge';
import { ClubLogo } from '@/src/components/ClubLogo';
import { DeltaPill } from '@/src/components/Delta';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { PlayerRatingSource } from '@/src/types/tttracker';
import { numeric, typography } from '@/src/theme/typography';
import { formatDate } from '@/src/utils/normalizers';
import { styles } from '../styles';

type PlayerHeaderProps = {
  name: string;
  clubName?: string;
  clubOrganization?: string;
  clubNumber?: string;
  ttr?: number;
  ttrDate?: string;
  ttrSource?: PlayerRatingSource;
  monthlyDelta?: number;
  loading: boolean;
  claimLoading?: boolean;
  onOpenClub?: () => void;
  onClaimProfile?: () => void;
};

// Avatar, Name und Vereinslink, darunter der TTR groß mit Stand-Datum und Änderung der letzten 30 Tage.
// Ist noch gar kein Ich-Profil gesetzt, steht darunter ein Hinweislink zum Festlegen.
export function PlayerHeader({
  name,
  clubName,
  clubOrganization,
  clubNumber,
  ttr,
  ttrDate,
  ttrSource,
  monthlyDelta,
  loading,
  claimLoading,
  onOpenClub,
  onClaimProfile,
}: PlayerHeaderProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
      <View style={styles.profileHead}>
        <View style={styles.profileIdentity}>
          <Avatar name={name} size={60} tone="accent" />

          <View style={styles.profileIdentityText}>
            <Text style={[typography.heading, { color: colors.text }]} numberOfLines={2}>
              {name}
            </Text>

            <Pressable
                accessibilityRole="link"
                disabled={!onOpenClub}
                onPress={onOpenClub}
                hitSlop={{ top: 8, bottom: 8 }}
                style={styles.clubLink}
            >
              <ClubLogo organization={clubOrganization} clubNumber={clubNumber} size={20} fallback="none" />
              <Text
                  style={[typography.metaStrong, styles.clubLinkText, { color: onOpenClub ? colors.primary : colors.mutedText }]}
                  numberOfLines={1}
              >
                {clubName ?? t('entities.clubUnknown')}
              </Text>
              {onOpenClub ? <Ionicons name="chevron-forward" size={15} color={colors.primary} /> : null}
            </Pressable>
          </View>
        </View>

        {onClaimProfile ? (
            <Pressable
                accessibilityRole="button"
                disabled={claimLoading}
                onPress={onClaimProfile}
                hitSlop={{ top: 8, bottom: 8 }}
                style={({ pressed }) => [styles.claimLink, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Ionicons name="person-outline" size={15} color={colors.mutedText} />
              <Text style={[typography.meta, { color: colors.mutedText }]}>{t('player.claimQuestion')}</Text>
              <Text style={[typography.metaStrong, { color: colors.primary }]}>{t('player.claimAction')}</Text>
              {claimLoading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
            </Pressable>
        ) : null}

        {!loading ? (
            <View style={styles.ttrRow}>
              <View style={styles.ttrValueBlock}>
                <Text style={[typography.label, { color: colors.mutedText }]}>
                  {ttrDate ? t('player.ttrAsOf', { date: formatDate(ttrDate) }) : 'TTR'}
                </Text>
                <Text style={[numeric.hero, { color: colors.text }]}>{ttr !== undefined ? ttr : '–'}</Text>
                {ttr !== undefined && ttrSource && ttrSource !== 'official' ? (
                    <Badge tone="outline">{t(`player.ratingSource.${ttrSource}`)}</Badge>
                ) : null}
              </View>

              {typeof monthlyDelta === 'number' ? (
                  <View style={styles.ttrDelta}>
                    <DeltaPill value={monthlyDelta} suffix={t('home.in30Days')} />
                  </View>
              ) : null}
            </View>
        ) : null}
      </View>
  );
}
