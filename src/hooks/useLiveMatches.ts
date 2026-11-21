import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { setLiveActivity } from '@/src/api/debugStats';
import { getPauseUntilFromError, isLivePaused } from '@/src/api/livePause';
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
const MAX_MEETINGS = 3;

type UseLiveMatchesOptions<T> = {
  // Nur diese Begegnungen werden live abgefragt (z. B. die des eigenen Vereins), die anderen behalten den Spielplan Stand.
  isRelevant?: (match: T) => boolean;
  // Name der Liste im Debug Bereich ("home", "club", "league", "team")
  label?: string;
};

/**
 * Zeigt Begegnungen, die gerade laufen oder gleich beginnen, mit dem Stand aus dem Spielbericht.
 * Der Spielplan hinkt hinterher: er wird nur alle paar Minuten aktualisiert und kennt den laufenden
 * Zwischenstand gar nicht, ein laufendes Spiel stünde dort noch mit der Uhrzeit des Beginns.
 * Liefert die Liste mit Status und Ergebnis der Begegnungen, die der Spielbericht schon kennt.
 */
export function useLiveMatches<T extends LiveMatchLike>(matches: T[], options: UseLiveMatchesOptions<T> = {}): T[] {
  const [overlays, setOverlays] = useState<Record<string, LiveOverlay>>({});
  const isRelevantRef = useRef(options.isRelevant);
  const hasFilter = Boolean(options.isRelevant);
  const mounted = useRef(true);
  const pausedUntilRef = useRef(0);
  const [debugId] = useState(() => `${options.label ?? 'liste'}-${Math.random().toString(36).slice(2, 6)}`);

  useEffect(() => {
    isRelevantRef.current = options.isRelevant;
  });

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      setLiveActivity(debugId, 0);
    };
  }, [debugId]);

  // Spielplan mit dem bisher bekannten Live Stand. Auf dieser Liste wird entschieden, was noch abgefragt wird:
  // beendete Begegnungen fallen heraus, und eine laufende hat ein längeres Zeitfenster als eine ohne Stand.
  const applied = useMemo(
      () => (Object.keys(overlays).length === 0 ? matches : matches.map((match) => applyOverlay(match, match.id ? overlays[match.id] : undefined))),
      [matches, overlays],
  );

  const appliedRef = useRef(applied);

  useEffect(() => {
    appliedRef.current = applied;
  });

  const poll = useCallback(async () => {
    // Bei einer Pause (429 vom Backend oder vom Gerät bei myTischtennis) kämen nur alte Stände zurück.
    if (isLivePaused(pausedUntilRef.current)) return;

    const filter = isRelevantRef.current;
    const pool = filter ? appliedRef.current.filter(filter) : appliedRef.current;
    const candidates = pickLiveCandidates(pool, Date.now(), MAX_MEETINGS);

    setLiveActivity(debugId, candidates.length);

    if (candidates.length === 0) return;

    const results = await Promise.all(
        candidates.map(async (match) => {
          try {
            const response = await ttApi.getMeetingLive(match.id!, { maxAgeMs: MAX_AGE_MS });

            return [match.id!, responseToOverlay(response)] as const;
          } catch (error) {
            const pauseUntil = getPauseUntilFromError(error);

            if (pauseUntil) pausedUntilRef.current = Math.max(pausedUntilRef.current, pauseUntil);

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
  }, [debugId]);

  const mayBeLive = useMemo(() => {
    const pool = options.isRelevant ? applied.filter(options.isRelevant) : applied;

    return mayHaveLiveMatches(pool, Date.now());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied, hasFilter]);

  // Sobald eine Liste da ist (oder neu geladen wurde), gleich einmal nachsehen.
  useEffect(() => {
    if (mayBeLive) poll().catch(() => undefined);
  }, [matches, mayBeLive, poll]);

  useEffect(() => {
    if (!mayBeLive) setLiveActivity(debugId, 0);
  }, [mayBeLive, debugId]);

  useLivePolling(() => poll().catch(() => undefined), { enabled: mayBeLive, intervalMs: POLL_MS });

  return applied;
}
