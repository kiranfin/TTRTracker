import { useEffect, useRef } from 'react';
import { subscribeApiUpdates } from '../api/responseCache';

/**
 * Ruft `onUpdate`, wenn die App einen Backend Pfad im Hintergrund aktualisiert hat (stale-while-revalidate).
 * `prefix` bezieht sich auf den Pfad ohne Basis URL, z.B. "/api/leagues/TTBW/26--27/12345", oder ist eine
 * Funktion, die den Pfad prüft. Die Funktion sollte stabil sein (useCallback), sonst meldet sich der Hook
 * bei jedem Render neu an.
 * `onUpdate` sollte die Daten still neu lesen (ohne Ladeanzeige): der Zwischenspeicher hat jetzt den
 * frischen Stand, es geht keine neue Anfrage raus.
 */
export function useApiUpdates(
    prefix: string | ((path: string) => boolean) | null | undefined,
    onUpdate: () => void,
) {
  const callback = useRef(onUpdate);

  useEffect(() => {
    callback.current = onUpdate;
  });

  useEffect(() => {
    if (!prefix) return;

    return subscribeApiUpdates((event) => {
      if (typeof prefix === 'function' ? prefix(event.path) : event.path.startsWith(prefix)) {
        callback.current();
      }
    });
  }, [prefix]);
}
