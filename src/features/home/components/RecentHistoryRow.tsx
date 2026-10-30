import { router } from 'expo-router';
import { DateBlock } from '@/src/components/DateBlock';
import { DeltaText } from '@/src/components/Delta';
import { ListRow } from '@/src/components/ListRow';
import { useI18n } from '@/src/i18n/I18nProvider';
import type { NormalizedTtrHistoryEvent } from '@/src/types/tttracker';
import { getEventMeetingId, getEventWinLoss } from '../../player-details/utils';

// Ein Eintrag der letzten Spiele: Datum links, Gegner und Bilanz in der Mitte, TTR-Änderung rechts.
// Mit Spielbericht öffnet die Zeile diesen, sonst das eigene Profil.
export function RecentHistoryRow({
                                   event,
                                   onOpenProfile,
                                 }: {
  event: NormalizedTtrHistoryEvent;
  onOpenProfile: () => void;
}) {
  const { t } = useI18n();
  const meetingId = getEventMeetingId(event);
  const winLoss = getEventWinLoss(event);
  const hasRecord = winLoss.won + winLoss.lost > 0;

  const subtitle = [
    event.leagueName,
    hasRecord ? t('home.singlesRecord', { won: winLoss.won, lost: winLoss.lost }) : undefined,
  ]
      .filter(Boolean)
      .join(' · ');

  return (
      <ListRow
          leading={<DateBlock date={event.date} />}
          title={event.meetingLabel ?? event.title ?? t('home.historyEntry')}
          subtitle={subtitle || undefined}
          chevron={false}
          onPress={
            meetingId
                ? () =>
                    router.push({
                      pathname: '/match/[meetingId]',
                      params: { meetingId, homeTeam: '', awayTeam: '' },
                    })
                : onOpenProfile
          }
          trailing={<DeltaText value={event.delta} />}
      />
  );
}
