import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Card } from '@/src/components/Card';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import { formatDate } from '@/src/utils/normalizers';
import type { ClubScheduleMatch } from '../types';
import { styles } from '../styles';

export function NextMatchCard({ match }: { match: ClubScheduleMatch | null }) {
    const { colors } = useTheme();
    const { t } = useI18n();

    const canOpen = Boolean(match?.id);

    return (
        <Card
            pressable={canOpen}
            style={styles.nextMatchCard}
            onPress={
                match && canOpen
                    ? () =>
                        router.push({
                            pathname: '/match/[meetingId]',
                            params: { meetingId: match.id!, homeTeam: match.homeTeam, awayTeam: match.awayTeam },
                        })
                    : undefined
            }
        >
            <View style={styles.nextMatchHeader}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                <Text style={[typography.label, { color: colors.primary, fontWeight: '800' }]}>
                    {t('home.nextMatch').toUpperCase()}
                </Text>
            </View>

            {match ? (
                <>
                    <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={2}>
                        {match.homeTeam} - {match.awayTeam}
                    </Text>

                    <Text style={[typography.meta, { color: colors.mutedText }]} numberOfLines={1}>
                        {[match.date ? formatDate(match.date) : undefined, match.time, match.leagueName]
                            .filter(Boolean)
                            .join(' · ')}
                    </Text>
                </>
            ) : (
                <Text style={[typography.body, { color: colors.mutedText }]}>{t('club.noUpcomingMatch')}</Text>
            )}
        </Card>
    );
}
