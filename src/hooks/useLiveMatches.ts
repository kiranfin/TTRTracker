import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ttApi } from '@/src/api/tttracker';
import {
  applyOverlay,
  isSameOverlay,
  mayHaveLiveMatches,
  pickLiveCandidates,
  responseToOverlay,
  type LiveMatchLike,
  type LiveOverlay,
} from '@/src/utils/liveMeetings';
import { useLivePolling } from './useLivePolling';

// Das Backend hält laufende Begegnungen eine Minute. Alle 30 Sekunden nachsehen, dafür darf der Stand
// auf dem Gerät höchstens 25 Sekunden alt sein, sonst käme beim Nachfragen nur der Zwischenspeicher zurück.
const POLL_MS = 30 * 1000;
const MAX_AGE_MS = 25 * 1000;
// Mehr als so viele Begegnungen gleichzeitig abzufragen belastet das Kontingent von myTischtennis zu stark.
const MAX_MEETINGS = 6;

/**
 * Zeigt Begegnungen, die gerade laufen oder gleich beginnen, mit dem Stand aus dem Spielbericht.
 * Der Spielplan hinkt hinterher: er wird nur alle paar Minuten aktualisiert und kennt den laufenden
 * Zwischenstand gar nicht, ein laufendes Spiel stünde dort noch mit der Uhrzeit des Beginns.
 * Liefert die Liste mit Status und Ergebnis der Begegnungen, die der Spielbericht schon kennt.
 */
export function useLiveMatches<T extends LiveMatchLike>(matches: T[]): T[] {
  const [overlays, setOverlays] = useState<Record<string, LiveOverlay>>({});
  const matchesRef = useRef(matches);
  const overlaysRef = useRef(overlays);
  const mounted = useRef(true);

  useEffect(() => {
    matchesRef.current = matches;
    overlaysRef.current = overlays;
  });

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  const poll = useCallback(async () => {
    // Beendete Begegnungen ändern sich nicht mehr, sie werden nicht weiter abgefragt.
    const open = matchesRef.current.filter((match) => !match.id || overlaysRef.current[match.id]?.status !== 'completed');
    const candidates = pickLiveCandidates(open, Date.now(), MAX_MEETINGS);

    if (candidates.length === 0) return;

    const results = await Promise.all(
        candidates.map(async (match) => {
          try {
            const response = await ttApi.getMeetingLive(match.id!, { maxAgeMs: MAX_AGE_MS });

            return [match.id!, responseToOverlay(response)] as const;
          } catch {
            // Ein Fehler lässt den bisherigen Stand stehen, der nächste Durchlauf versucht es erneut.
            return null;
          }
        }),
    );

    if (!mounted.current) return;

    setOverlays((previous) => {
      let next = previous;

      for (const result of results) {
        if (!result) continue;

        const [id, overlay] = result;

        if (isSameOverlay(previous[id], overlay ?? undefined)) continue;

        if (next === previous) next = { ...previous };

        if (overlay) {
          next[id] = overlay;
        } else {
          delete next[id];
        }
      }

      return next;
    });
  }, []);

  const mayBeLive = useMemo(() => mayHaveLiveMatches(matches, Date.now()), [matches]);

  // Sobald eine Liste da ist (oder neu geladen wurde), gleich einmal nachsehen.
  useEffect(() => {
    if (mayBeLive) poll().catch(() => undefined);
  }, [matches, mayBeLive, poll]);

  useLivePolling(() => poll().catch(() => undefined), { enabled: mayBeLive, intervalMs: POLL_MS });

  return useMemo(
      () => (Object.keys(overlays).length === 0 ? matches : matches.map((match) => applyOverlay(match, match.id ? overlays[match.id] : undefined))),
      [matches, overlays],
  );
}
