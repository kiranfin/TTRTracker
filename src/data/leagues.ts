import type { LeagueRegion } from '../types/tttracker';

export const REGIONS: LeagueRegion[] = [
  { id: 'baden-wuerttemberg', name: 'Baden-Württemberg' },
  { id: 'bayern', name: 'Bayern' },
  { id: 'berlin', name: 'Berlin' },
  { id: 'brandenburg', name: 'Brandenburg' },
  { id: 'bremen', name: 'Bremen' },
  { id: 'hamburg', name: 'Hamburg' },
  { id: 'hessen', name: 'Hessen' },
  { id: 'mecklenburg-vorpommern', name: 'Mecklenburg-Vorpommern' },
  { id: 'niedersachsen', name: 'Niedersachsen' },
  { id: 'nordrhein-westfalen', name: 'Nordrhein-Westfalen' },
  { id: 'rheinland-pfalz', name: 'Rheinland-Pfalz' },
  { id: 'saarland', name: 'Saarland' },
  { id: 'sachsen', name: 'Sachsen' },
  { id: 'sachsen-anhalt', name: 'Sachsen-Anhalt' },
  { id: 'schleswig-holstein', name: 'Schleswig-Holstein' },
  { id: 'thueringen', name: 'Thüringen' },
];

export function getRegionById(id?: string) {
  return REGIONS.find((region) => region.id === id);
}