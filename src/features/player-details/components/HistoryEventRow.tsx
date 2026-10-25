import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Platform, Pressable, Text, View } from 'react-native';
import { DateBlock } from '@/src/components/DateBlock';
import { DeltaText } from '@/src/components/Delta';
import { useI18n } from '@/src/i18n/I18nProvider';
import { useTheme } from '@/src/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';
import type { NormalizedTtrHistoryEvent } from '@/src/types/tttracker';
import { getEventMeetingId, getEventTtr, getEventWinLoss } from '../utils';
import { styles } from '../styles';
import { HistoryMatchCard } from './HistoryMatchCard';

type HistoryEventRowProps = {
  event: NormalizedTtrHistoryEvent;
  expanded: boolean;
  onPress: () => void;
};

// Listenzeile eines Verlaufseintrags: Datum, Begegnung, Änderung und TTR danach; aufgeklappt die Einzelspiele.
export function HistoryEventRow({ event, expanded, onPress }: HistoryEventRowProps) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const noWebOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null;

  const meetingId = getEventMeetingId(event);
  const winLoss = getEventWinLoss(event);
  const record = winLoss.won + winLoss.lost > 0 ? `${winLoss.won}:${winLoss.lost}` : undefined;
  const subtitle = [event.leagueName, record].filter(Boolean).join(' · ');
  const ttr = getEventTtr(event);

  return (
      <View>
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            onPress={onPress}
            style={({ pressed }) => [styles.historyRow, noWebOutline, pressed && { backgroundColor: colors.soft }]}
        >
          <DateBlock date={event.date} />

          <View style={styles.historyRowMain}>
            <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={2}>
              {event.meetingLabel ?? event.title}
            </Text>
            {subtitle ? (
                <Text style={[typography.meta, { color: colors.mutedText }]} numberOfLines={1}>
                  {subtitle}
                </Text>
            ) : null}
          </View>

          <View style={styles.historyRowScore}>
            <DeltaText value={event.delta} />
            {ttr !== undefined ? (
                <Text style={[typography.label, { color: colors.mutedText }]}>{ttr}</Text>
            ) : null}
          </View>

          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedText} />
        </Pressable>

        {expanded ? (
            <View style={styles.historyExpanded}>
              {event.matches.length > 0 ? (
                  event.matches.map((match) => <HistoryMatchCard key={match.id} match={match} />)
              ) : (
                  <Text style={[typography.meta, { color: colors.mutedText }]}>{t('player.noMatchDetails')}</Text>
              )}

              {meetingId ? (
                  <Pressable
                      accessibilityRole="link"
                      onPress={() =>
                          router.push({
                            pathname: '/match/[meetingId]',
                            params: { meetingId, homeTeam: '', awayTeam: '' },
                          })
                      }
                      hitSlop={{ top: 10, bottom: 10 }}
                      style={styles.reportLink}
                  >
                    <Text style={[typography.metaStrong, { color: colors.primary }]}>{t('player.openMatchReport')}</Text>
                  </Pressable>
              ) : null}
            </View>
        ) : null}
      </View>
  );
}
