import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';
import { Button } from '@/src/components/Button';
import { DeltaText } from '@/src/components/Delta';
import { useI18n } from '@/src/i18n/I18nProvider';
import { MIN_TOUCH, spacing } from '@/src/theme/spacing';
import { useTheme } from '@/src/theme/ThemeProvider';
import { numeric, typography } from '@/src/theme/typography';
import type { NormalizedTtrHistoryEvent } from '@/src/types/tttracker';
import { formatDate } from '@/src/utils/normalizers';
import { getEventMeetingId, getEventTtr } from '../utils';
import { styles } from '../styles';
import { HistoryMatchCard } from './HistoryMatchCard';

type HistoryEventRowProps = {
    event: NormalizedTtrHistoryEvent;
    expanded: boolean;
    onPress: () => void;
};

// Listenzeile eines Verlaufseintrags, aufgeklappt mit den Einzelspielen.
export function HistoryEventRow({ event, expanded, onPress }: HistoryEventRowProps) {
    const { colors } = useTheme();
    const { t } = useI18n();
    const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

    const date = event.date ? formatDate(event.date) : t('common.dateUnknown');
    const meetingId = getEventMeetingId(event);
    const subtitle = [date, event.leagueName].filter(Boolean).join(' · ');

    return (
        <View>
            <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={onPress}
                style={({ pressed }) => [
                    styles.historyRow,
                    noWebOutline,
                    pressed && { backgroundColor: colors.soft },
                ]}
            >
                <View style={styles.historyRowMain}>
                    <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={2}>
                        {event.meetingLabel ?? event.title}
                    </Text>

                    <Text style={[typography.meta, { color: colors.mutedText }]} numberOfLines={1}>
                        {subtitle}
                    </Text>
                </View>

                <View style={styles.historyRowScore}>
                    <Text style={[numeric.medium, { color: colors.text }]}>{getEventTtr(event) ?? '-'}</Text>
                    <DeltaText value={event.delta} size={12} />
                </View>

                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedText} />
            </Pressable>

            {expanded ? (
                <View style={[styles.historyExpanded, { borderTopColor: colors.border }]}>
                    {event.matches.length > 0 ? (
                        event.matches.map((match) => <HistoryMatchCard key={match.id} match={match} />)
                    ) : (
                        <Text style={[typography.meta, { color: colors.mutedText }]}>{t('player.noMatchDetails')}</Text>
                    )}

                    {meetingId ? (
                        <Button
                            variant="secondary"
                            icon="document-text-outline"
                            style={{ minHeight: MIN_TOUCH, marginTop: spacing.xs }}
                            onPress={() =>
                                router.push({
                                    pathname: '/match/[meetingId]',
                                    params: { meetingId, homeTeam: '', awayTeam: '' },
                                })
                            }
                        >
                            {t('player.openMatchReport')}
                        </Button>
                    ) : null}
                </View>
            ) : null}
        </View>
    );
}
