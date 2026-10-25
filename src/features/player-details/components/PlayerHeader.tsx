import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { Avatar } from '@/src/components/Avatar';
import { DeltaPill } from '@/src/components/Delta';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import { formatDate } from '@/src/utils/normalizers';
import { styles } from '../styles';

type PlayerHeaderProps = {
    name: string;
    clubName?: string;
    ttr?: number;
    ttrDate?: string;
    monthlyDelta?: number;
    loading: boolean;
    onOpenClub?: () => void;
};

// Avatar, Name, Vereinslink und der aktuelle TTR mit Änderung der letzten 30 Tage.
export function PlayerHeader({ name, clubName, ttr, ttrDate, monthlyDelta, loading, onOpenClub }: PlayerHeaderProps) {
    const { colors } = useTheme();
    const { t } = useI18n();

    return (
        <View style={styles.profileHead}>
            <View style={styles.profileIdentity}>
                <Avatar name={name} size={64} />

                <View style={styles.profileIdentityText}>
                    <Text style={[typography.title, { color: colors.text }]} numberOfLines={2}>
                        {name}
                    </Text>

                    <Pressable
                        accessibilityRole="link"
                        disabled={!onOpenClub}
                        onPress={onOpenClub}
                        hitSlop={{ top: 8, bottom: 8 }}
                        style={styles.clubLink}
                    >
                        <Text
                            style={[typography.meta, { color: onOpenClub ? colors.primary : colors.mutedText, flexShrink: 1 }]}
                            numberOfLines={1}
                        >
                            {clubName ?? t('entities.clubUnknown')}
                        </Text>

                        {onOpenClub ? <Ionicons name="chevron-forward" size={14} color={colors.primary} /> : null}
                    </Pressable>
                </View>
            </View>

            {!loading ? (
                <View style={styles.ttrRow}>
                    <View>
                        <Text style={[numeric.hero, { color: colors.text }]}>{ttr !== undefined ? ttr : '—'}</Text>
                        <Text style={[typography.label, { color: colors.mutedText }]}>
                            {ttrDate ? t('player.currentTtrWithDate', { date: formatDate(ttrDate) }) : t('home.currentTtr')}
                        </Text>
                    </View>

                    {typeof monthlyDelta === 'number' ? (
                        <View style={styles.ttrDelta}>
                            <DeltaPill value={monthlyDelta} />
                            <Text style={[typography.label, { color: colors.mutedText }]}>{t('home.last30Days')}</Text>
                        </View>
                    ) : null}
                </View>
            ) : null}
        </View>
    );
}
