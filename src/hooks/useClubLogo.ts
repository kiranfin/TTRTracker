import { useEffect, useSyncExternalStore } from 'react';
import {
  clubLogoRef,
  getCachedClubLogo,
  rememberClubLogo,
  requestClubLogo,
  subscribeClubLogos,
} from '../storage/clubLogos';

// Logo URL eines Vereins. knownUrl (z. B. aus einem Spielbericht) wird nur angezeigt. Gemerkt wird sie nur mit
// trustKnownUrl, also wenn sie sicher aus den Infos genau dieses Vereins stammt. Sonst würde eine falsche Zuordnung
// den Schlüssel überall vergiften. Ohne knownUrl wird das Logo gebündelt nachgeladen.
// undefined, solange keins da ist oder der Verein keins hat.
export function useClubLogo(organization?: string, clubNumber?: string, knownUrl?: string, trustKnownUrl = false) {
  const ref = clubLogoRef(organization, clubNumber);

  const cached = useSyncExternalStore(
      subscribeClubLogos,
      () => (ref ? getCachedClubLogo(ref) : undefined),
      () => undefined,
  );

  useEffect(() => {
    if (!ref) return;

    if (knownUrl) {
      if (trustKnownUrl) rememberClubLogo(ref, knownUrl);
    } else {
      requestClubLogo(ref);
    }
  }, [ref, knownUrl, trustKnownUrl]);

  return knownUrl ?? cached ?? undefined;
}
