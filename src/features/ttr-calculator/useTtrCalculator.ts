import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { ttApi } from '@/src/api/tttracker';
import { getMePlayerNuid } from '@/src/storage/mePlayer';
import { expectedResult, ratingChange } from '@/src/utils/ttr';

export type CalculatorOutcome = 'win' | 'loss';

function parseTtr(text: string) {
  const value = Number(text.trim().replace(',', '.'));

  return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
}

async function loadTtr(nuid: string) {
  const response = await ttApi.getPlayerTtr(nuid);
  const ttr = response.data.ttr;

  return typeof ttr === 'number' ? ttr : null;
}

export function useTtrCalculator() {
  const params = useLocalSearchParams<Record<string, string>>();

  const [ownText, setOwnText] = useState(params.own ?? '');
  const [opponentText, setOpponentText] = useState(params.opponent ?? '');
  const [outcome, setOutcome] = useState<CalculatorOutcome>('win');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [lookupFailed, setLookupFailed] = useState(false);

  // Ohne vorgegebenen Wert startet der Rechner mit dem TTR des gespeicherten Ich-Profils.
  useEffect(() => {
    if (params.own) return;

    let active = true;

    getMePlayerNuid()
        .then((nuid) => (nuid ? loadTtr(nuid) : null))
        .then((ttr) => {
          if (active && ttr !== null) setOwnText(String(ttr));
        })
        .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [params.own]);

  async function selectOpponent(nuid: string, name?: string) {
    setOpponentName(name ?? null);
    setLookupFailed(false);

    try {
      const ttr = await loadTtr(nuid);

      if (ttr === null) throw new Error('no ttr');

      setOpponentText(String(ttr));
    } catch {
      // Ohne Verbindung oder Wert bleibt das Feld zum Selbsteintragen.
      setLookupFailed(true);
    }
  }

  const own = parseTtr(ownText);
  const opponent = parseTtr(opponentText);

  const result = useMemo(() => {
    if (own === null || opponent === null) return null;

    const won = outcome === 'win';
    const ownDelta = ratingChange({ own, opponent, won });
    const opponentDelta = ratingChange({ own: opponent, opponent: own, won: !won });

    return {
      winChance: expectedResult(own, opponent),
      ownDelta,
      opponentDelta,
      ownAfter: own + ownDelta,
      opponentAfter: opponent + opponentDelta,
    };
  }, [own, opponent, outcome]);

  return {
    ownText,
    setOwnText,
    opponentText,
    setOpponentText,
    own,
    opponent,
    outcome,
    setOutcome,
    pickerOpen,
    setPickerOpen,
    opponentName,
    lookupFailed,
    selectOpponent,
    result,
  };
}
