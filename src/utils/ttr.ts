// Dieselbe Formel wie im Backend (tt-tracker-backend/src/rating/formula.ts), mit denselben Testwerten:
//   expectedResult(1500, 1500) = 0.5
//   expectedResult(1650, 1500) = 10/11
//   ratingChange(1500, 1500, Sieg) = +8, Niederlage = -8
//   ratingChange(1500, 1650, Sieg) = +15, Niederlage = -1
//   ratingChange(1650, 1500, Sieg) = +1, Niederlage = -15

/** Skalierung der Wertungsdifferenz: bei 150 Punkten Unterschied gewinnt der Stärkere mit rund 91 Prozent. */
export const TTR_SCALE = 150;

/** Änderungsfaktor ohne Zuschläge. */
export const BASE_K = 16;

/** Erwartete Siegwahrscheinlichkeit von Spieler A gegen B: 1 / (1 + 10^((B - A) / 150)). */
export function expectedResult(own: number, opponent: number) {
  return 1 / (1 + 10 ** ((opponent - own) / TTR_SCALE));
}

/** Punkteänderung für Spieler A nach einem Einzel: round((Ergebnis - Erwartung) * k). */
export function ratingChange(params: { own: number; opponent: number; won: boolean; k?: number }) {
  const result = params.won ? 1 : 0;

  return Math.round((result - expectedResult(params.own, params.opponent)) * (params.k ?? BASE_K));
}

/** Änderung für Sieg und Niederlage auf einen Blick. */
export function ratingChangeRange(own: number, opponent: number, k = BASE_K) {
  return {
    win: ratingChange({ own, opponent, won: true, k }),
    loss: ratingChange({ own, opponent, won: false, k }),
  };
}

/** "+8" oder "-8", für Anzeige der Punkteänderung. */
export function formatChange(value: number) {
  return value > 0 ? `+${value}` : String(value);
}
