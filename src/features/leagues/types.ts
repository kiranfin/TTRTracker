export type MyLeague = {
  id: string;
  title: string;
  association: string;
  groupId: string;
  season: string;
  leagueSlug?: string;
  // favorite: als Liga gemerkt, club: Liga einer Mannschaft des gespeicherten Vereins
  source: 'favorite' | 'club';
  teamName?: string;
};

// Platz und Punkte der eigenen Mannschaft in "Deine Ligen", size = Anzahl Mannschaften
export type LeagueStanding = {
  size: number;
  rank?: string;
  points?: string;
};
