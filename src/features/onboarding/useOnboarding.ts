import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { getMeClub, setMeClub } from '@/src/storage/meClub';
import { getMePlayerName, getMePlayerNuid, setMePlayerName, setMePlayerNuid } from '@/src/storage/mePlayer';
import { isOnboardingDone, markOnboardingDone } from '@/src/storage/onboarding';
import type { NormalizedClub } from '@/src/types/tttracker';

// Zeigt beim allerersten Start "Wer bist du?". Wer schon ein Profil oder einen Verein gespeichert hat
// (bestehende Installation) oder das Onboarding abgeschlossen hat, sieht es nicht.
export function useOnboardingRedirect() {
  useEffect(() => {
    let active = true;

    async function check() {
      const [done, nuid, club] = await Promise.all([isOnboardingDone(), getMePlayerNuid(), getMeClub()]);

      if (active && !done && !nuid && !club) {
        router.push('/onboarding');
      }
    }

    check().catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);
}

export function useOnboarding() {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [hasPlayer, setHasPlayer] = useState(false);
  const [clubName, setClubName] = useState<string | null>(null);
  const [playerPickerOpen, setPlayerPickerOpen] = useState(false);
  const [clubPickerOpen, setClubPickerOpen] = useState(false);

  useEffect(() => {
    Promise.all([getMePlayerNuid(), getMePlayerName(), getMeClub()])
        .then(([nuid, name, club]) => {
          setHasPlayer(Boolean(nuid));
          setPlayerName(name);
          setClubName(club?.title ?? club?.clubName ?? null);
        })
        .catch(() => undefined);
  }, []);

  // Jede Auswahl wird sofort gespeichert, damit sie auch bei einem Abbruch erhalten bleibt.
  async function selectPlayer(nuid: string, name?: string) {
    await setMePlayerNuid(nuid);
    await setMePlayerName(name);
    setHasPlayer(true);
    setPlayerName(name?.trim() || null);
    setPlayerPickerOpen(false);
  }

  async function selectClub(club: NormalizedClub) {
    if (!club.organization || !club.clubNumber) return;

    await setMeClub({
      organization: club.organization,
      clubNumber: club.clubNumber,
      title: club.name,
      clubName: club.name,
      state: club.state,
    });

    setClubName(club.name);
    setClubPickerOpen(false);
  }

  async function finish() {
    await markOnboardingDone().catch(() => undefined);

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  }

  return {
    hasPlayer,
    playerName,
    clubName,
    playerPickerOpen,
    setPlayerPickerOpen,
    clubPickerOpen,
    setClubPickerOpen,
    selectPlayer,
    selectClub,
    finish,
  };
}
