import { router } from 'expo-router';

/** Öffnet die Vereinsseite. Ohne Verband oder Nummer passiert nichts. */
export function openClub({ organization, clubNumber, title }: { organization?: string; clubNumber?: string; title?: string }) {
  if (!organization || !clubNumber) return;

  router.push({
    pathname: '/club/[clubKey]',
    params: { clubKey: `${organization}-${clubNumber}`, organization, clubNumber, title: title ?? '' },
  });
}
