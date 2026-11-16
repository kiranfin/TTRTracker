import { useEffect, useSyncExternalStore } from 'react';
import {
  clubLogoRef,
  getCachedClubLogo,
  rememberClubLogo,
  requestClubLogo,
  subscribeClubLogos,
} from '../storage/clubLogos';

// Logo URL eines Vereins. knownUrl (z. B. aus den Vereinsinfos) wird übernommen und gemerkt,
// sonst wird das Logo gebündelt nachgeladen. undefined, solange keins da ist oder der Verein keins hat.
export function useClubLogo(organization?: string, clubNumber?: string, knownUrl?: string) {
  const ref = clubLogoRef(organization, clubNumber);

  const cached = useSyncExternalStore(
      subscribeClubLogos,
      () => (ref ? getCachedClubLogo(ref) : undefined),
      () => undefined,
  );

  useEffect(() => {
    if (!ref) return;

    if (knownUrl) {
      rememberClubLogo(ref, knownUrl);
    } else {
      requestClubLogo(ref);
    }
  }, [ref, knownUrl]);

  return knownUrl ?? cached ?? undefined;
}
