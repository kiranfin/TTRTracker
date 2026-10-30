import { useEffect, useState } from 'react';

import { ttApi } from '@/src/api/tttracker';
import { useI18n } from '@/src/i18n/I18nProvider';
import { expectedResult } from '@/src/utils/ttr';
import { normalizeLineup } from '../../team-details/utils';

// So viele Spieler zählen pro Mannschaft, die obere Hälfte einer Sechser Mannschaft.
const PREVIEW_PLAYER_COUNT = 6;

export type TeamStrength = {
  average: number;
  playerCount: number;
};

export type MatchPreview = {
  home: TeamStrength;
  guest: TeamStrength;
  homeWinChance: number;
};

async function loadStrength(teamId: string, teamName: string, t: ReturnType<typeof useI18n>['t']): Promise<TeamStrength | null> {
  const response = await ttApi.getTeamPlayers(teamId);

  const values = normalizeLineup(response, teamName, t)
      .map((player) => Number(player.qttr?.replace(',', '.')))
      .filter((value) => Number.isFinite(value) && value > 0)
      .slice(0, PREVIEW_PLAYER_COUNT);

  if (values.length === 0) return null;

  return {
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
    playerCount: values.length,
  };
}

// Stärkevergleich zweier Mannschaften aus den Q-TTR Werten der Meldung, solange das Spiel noch nicht läuft.
export function useMatchPreview(params: {
  enabled: boolean;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeam: string;
  awayTeam: string;
}) {
  const { t } = useI18n();
  const [preview, setPreview] = useState<MatchPreview | null>(null);

  const { enabled, homeTeamId, awayTeamId, homeTeam, awayTeam } = params;

  useEffect(() => {
    let active = true;

    setPreview(null);

    if (!enabled || !homeTeamId || !awayTeamId) return;

    Promise.all([loadStrength(homeTeamId, homeTeam, t), loadStrength(awayTeamId, awayTeam, t)])
        .then(([home, guest]) => {
          if (!active || !home || !guest) return;

          setPreview({ home, guest, homeWinChance: expectedResult(home.average, guest.average) });
        })
        .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [enabled, homeTeamId, awayTeamId, homeTeam, awayTeam, t]);

  return preview;
}
