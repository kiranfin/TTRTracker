import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { ttApi } from '@/src/api/tttracker';
import { useI18n } from '@/src/i18n/I18nProvider';
import { getFavorites } from '@/src/storage/favorites';
import { getMeClub } from '@/src/storage/meClub';
import type { LeagueAssociation } from '@/src/types/tttracker';
import { getCurrentSeason } from '@/src/utils/dates';
import { normalizeTable, normalizeTeams } from '@/src/utils/normalizers';
import type { LeagueStanding, MyLeague } from '../types';

// Höchstens so viele Tabellen laden, damit der Ligen-Tab das Backend nicht flutet.
const MAX_STANDINGS = 6;

function normalizeTeamName(value?: string) {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function leagueKey(league: Pick<MyLeague, 'association' | 'groupId'>) {
  return `${league.association}:${league.groupId}`;
}

export function useLeagues() {
  const { t } = useI18n();

  const [associations, setAssociations] = useState<LeagueAssociation[]>([]);
  const [myLeagues, setMyLeagues] = useState<MyLeague[]>([]);
  const [standings, setStandings] = useState<Record<string, LeagueStanding>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssociations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setAssociations(await ttApi.getLeagueAssociations());
    } catch (loadError) {
      setAssociations([]);
      setError(loadError instanceof Error ? loadError.message : t('leagues.loadError'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAssociations().catch(() => undefined);
  }, [loadAssociations]);

  // "Deine Ligen": Liga-Favoriten plus die Ligen der Mannschaften des gespeicherten Vereins
  useFocusEffect(
      useCallback(() => {
        let active = true;

        async function loadMyLeagues() {
          const result = new Map<string, MyLeague>();

          try {
            const favorites = await getFavorites();

            for (const item of favorites) {
              if (item.type !== 'league') continue;

              const association = item.params?.association ?? '';
              const groupId = item.params?.groupId ?? item.id;

              if (!association || !groupId) continue;

              result.set(leagueKey({ association, groupId }), {
                id: item.id,
                title: item.params?.title ?? item.title,
                association,
                groupId,
                season: item.params?.season ?? '',
                leagueSlug: item.params?.leagueSlug,
                source: 'favorite',
              });
            }
          } catch {
            // Ohne Favoriten gibt es nur die Vereinsligen.
          }

          try {
            const club = await getMeClub();

            if (club) {
              const teams = normalizeTeams(await ttApi.getClubTeams(club.organization, club.clubNumber));

              for (const team of teams) {
                if (!team.association || !team.groupId) continue;

                const key = leagueKey({ association: team.association, groupId: team.groupId });
                if (result.has(key)) continue;

                result.set(key, {
                  id: key,
                  title: team.leagueName,
                  association: team.association,
                  groupId: team.groupId,
                  season: team.season ?? '',
                  leagueSlug: team.leagueSlug,
                  source: 'club',
                  teamName: team.teamName,
                  teamId: team.teamId,
                });
              }
            }
          } catch {
            // Vereinsligen sind eine Zugabe, ein Fehler soll die Verbandsliste nicht blockieren.
          }

          if (!active) return;

          const leagues = [...result.values()];
          setMyLeagues(leagues);

          // Platz und Punkte der eigenen Mannschaft bzw. Größe der Liga nachladen
          const next: Record<string, LeagueStanding> = {};

          await Promise.all(
              leagues.slice(0, MAX_STANDINGS).map(async (league) => {
                try {
                  const rows = normalizeTable(
                      await ttApi.getLeagueTable(
                          league.association,
                          league.season || getCurrentSeason(),
                          league.groupId,
                          league.leagueSlug ?? 'x',
                          'gesamt',
                      ),
                  );

                  // Die Teamliste des Vereins nennt die Mannschaft nur "Erwachsene II", die Tabelle
                  // "TTV Pleidelsheim II". Die Team-ID passt dagegen immer.
                  const own =
                      (league.teamId ? rows.find((row) => row.id === league.teamId) : undefined) ??
                      (league.teamName
                          ? rows.find((row) => normalizeTeamName(row.teamName) === normalizeTeamName(league.teamName))
                          : undefined);

                  next[leagueKey(league)] = {
                    size: rows.length,
                    rank: own?.position,
                    points: own?.points ?? (own?.pointsWon && own?.pointsLost ? `${own.pointsWon}:${own.pointsLost}` : undefined),
                  };
                } catch {
                  // Ohne Tabelle bleibt die Zeile einfach ohne Platz.
                }
              }),
          );

          if (active) setStandings(next);
        }

        loadMyLeagues().catch(() => undefined);

        return () => {
          active = false;
        };
      }, []),
  );

  function openAssociation(association: LeagueAssociation, season?: string) {
    router.push({
      pathname: '/region/[region]',
      params: {
        region: association.association,
        title: association.name,
        shortName: association.shortName,
        season: season || getCurrentSeason(),
      },
    });
  }

  function openMyLeague(league: MyLeague) {
    router.push({
      pathname: '/league/[leagueKey]',
      params: {
        leagueKey: league.groupId,
        association: league.association,
        groupId: league.groupId,
        season: league.season || getCurrentSeason(),
        leagueSlug: league.leagueSlug ?? 'x',
        title: league.title,
      },
    });
  }

  function getStanding(league: MyLeague) {
    return standings[leagueKey(league)];
  }

  return { associations, myLeagues, getStanding, loading, error, loadAssociations, openAssociation, openMyLeague };
}
