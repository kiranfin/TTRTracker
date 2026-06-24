import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { Badge } from '@/src/components/Badge';
import { Card } from '@/src/components/Card';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import type { NormalizedTtrHistoryEvent } from '@/src/types/tttracker';
import { formatDate } from '@/src/utils/normalizers';
import { formatSignedNumber, getEventTtr, getEventWinLoss, parseOptionalNumber } from '../utils';
import { styles } from '../styles';
import { HistoryMatchCard } from './HistoryMatchCard';

export function HistoryEventCard({
                              event,
                              expanded,
                              onPress,
                          }: {
    event: NormalizedTtrHistoryEvent;
    expanded: boolean;
    onPress: () => void;
}) {
    const { colors } = useTheme();
    const { t } = useI18n();

    const delta = event.delta ?? 0;
    const deltaColor = delta > 0 ? '#16a34a' : delta < 0 ? colors.destructive : colors.mutedText;
    const deltaLabel = event.delta !== undefined ? formatSignedNumber(delta) : '—';
    const eventTtr = getEventTtr(event);
    const eventWinLoss = getEventWinLoss(event);
    const eventRatioTotal = eventWinLoss.won + eventWinLoss.lost;
    const eventMatchCount = parseOptionalNumber(event.matchCount) ?? eventRatioTotal;

    return (
        <Card pressable onPress={onPress} style={styles.eventCard}>
            <View style={styles.eventTopRow}>
                <View style={styles.eventMain}>
                    {event.leagueName ? (
                        <View style={[styles.leagueTag, { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder }]}>
                            <Text style={[styles.leagueTagText, { color: colors.primary }]} numberOfLines={1}>
                                {event.leagueName}
                            </Text>
                        </View>
                    ) : null}

                    <Text style={[styles.meetingText, { color: colors.text }]} numberOfLines={2}>
                        {event.meetingLabel ?? event.title}
                    </Text>

                    <View style={styles.eventMetaRow}>
                        <Ionicons name="calendar-outline" size={13} color={colors.mutedText} />
                        <Text style={[styles.eventDate, { color: colors.mutedText }]}>
                            {event.date ? formatDate(event.date) : t('common.dateUnknown')}{event.time ? ` · ${event.time}` : ''}
                        </Text>
                    </View>
                </View>

                <View style={styles.eventScore}>
                    <Text style={[styles.eventTtr, { color: colors.text }]}>
                        {eventTtr ?? '-'}
                    </Text>
                    <Text style={[styles.eventDelta, { color: deltaColor }]}>
                        {deltaLabel}
                    </Text>
                    <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={colors.mutedText}
                    />
                </View>
            </View>

            <View style={styles.eventBottomRow}>
                {event.ttrBefore !== undefined && event.ttrAfter !== undefined ? (
                    <Badge tone="outline">{event.ttrBefore} → {event.ttrAfter}</Badge>
                ) : null}

                {eventMatchCount > 0 ? (
                    <Badge tone="secondary" icon="tennisball-outline">
                        {t('player.gamesCount', { count: eventMatchCount })}
                    </Badge>
                ) : null}

                {eventRatioTotal > 0 ? (
                    <Badge tone="outline">
                        {eventWinLoss.won}:{eventWinLoss.lost}
                    </Badge>
                ) : null}
            </View>

            {expanded ? (
                <View style={[styles.expandedArea, { borderTopColor: colors.border }]}>
                    {event.matches.length > 0 ? (
                        event.matches.map((match) => (
                            <HistoryMatchCard key={match.id} match={match} />
                        ))
                    ) : (
                        <Text style={[styles.mutedText, { color: colors.mutedText }]}>
                            {t('player.noMatchDetails')}
                        </Text>
                    )}
                </View>
            ) : null}
        </Card>
    );
}
