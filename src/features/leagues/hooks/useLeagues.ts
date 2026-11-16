import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { ttApi } from '@/src/api/tttracker';
import { useApiUpdates } from '@/src/hooks/useApiUpdates';
import { useI18n } from '@/src/i18n/I18nProvider';
import { getFavorites } from '@/src/storage/favorites';
import { getMeClub } from '@/src/storage/meClub';
import type { LeagueAssociation } from '@/src/types/tttracker';
import { getCurrentSeason } from '@/src/utils/dates';
import { normalizeTable, normalizeTeams } from '@/src/utils/normalizers';
import type { LeagueStanding, MyLeague } from '../types';
import { describeApiError } from '@/src/utils/apiErrors';

function leagueKey(league: Pick<MyLeague, 'association' | 'groupId'>) {
  return `${league.association}:${league.groupId}`;
}

// "26--27" und "26/27" gelten als gleiche Saison, eine leere Saison als die aktuelle.
function sameSeason(left: string, right: string) {
  const clean = (value: string) => (value || getCurrentSeason()).replace(/--/g, '/');
  return clean(left) === clean(right);
}

export function useLeagues(season: string) {
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
      setError(describeApiError(loadError, t, 'leagues.loadError'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAssociations().catch(() => undefined);
  }, [loadAssociations]);

  // "Deine Ligen": Liga-Favoriten plus die Ligen der Mannschaften des gespeicherten Vereins.
  // Die Antworten kommen aus dem Zwischenspeicher der App: bei frischen Einträgen geht keine Anfrage raus,
  // bei abgelaufenen wird sofort der letzte Stand gezeigt und im Hintergrund aktualisiert.
  const loadMyLeagues = useCallback(async (isActive: () => boolean) => {
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
            tableRank: team.tableRank,
            pointsWon: team.pointsWon,
            pointsLost: team.pointsLost,
          });
        }
      }
    } catch {
      // Vereinsligen sind eine Zugabe, ein Fehler soll die Verbandsliste nicht blockieren.
    }

    if (!isActive()) return;

    // Das Backend liefert Vereinsmannschaften nur für die aktuelle Saison, Favoriten tragen ihre eigene.
    const leagues = [...result.values()].filter((league) => sameSeason(league.season, season));
    setMyLeagues(leagues);

    // Platz und Punkte der Vereinsmannschaften stehen schon in der Mannschaftsliste des Vereins, es wird keine
    // Tabelle geladen. Bei Favoriten kommt die Mannschaftszahl nur aus einer Tabelle, die schon auf dem Gerät liegt.
    const next: Record<string, LeagueStanding> = {};

    await Promise.all(
        leagues.map(async (league) => {
          if (league.source === 'club') {
            next[leagueKey(league)] = {
              rank: league.tableRank,
              points: league.pointsWon && league.pointsLost ? `${league.pointsWon}:${league.pointsLost}` : undefined,
            };

            return;
          }

          try {
            const table = await ttApi.peekLeagueTable(
                league.association,
                league.season || getCurrentSeason(),
                league.groupId,
                league.leagueSlug ?? 'x',
                'gesamt',
            );

            if (table) {
              next[leagueKey(league)] = { size: normalizeTable(table).length };
            }
          } catch {
            // Ohne gespeicherte Tabelle bleibt die Zeile ohne Mannschaftszahl.
          }
        }),
    );

    if (isActive()) setStandings(next);
  }, [season]);

  useFocusEffect(
      useCallback(() => {
        let active = true;

        loadMyLeagues(() => active).catch(() => undefined);

        return () => {
          active = false;
        };
      }, [loadMyLeagues]),
  );

  // Wurden Tabellen oder Vereinsmannschaften im Hintergrund aktualisiert, die Liste still neu aufbauen.
  const isMyLeagueData = useCallback(
      (path: string) => /^\/api\/clubs\/[^/]+\/[^/]+\/teams$/.test(path) || /^\/api\/leagues\/[^/]+\/[^/]+\/[^/]+\/table$/.test(path),
      [],
  );

  useApiUpdates(isMyLeagueData, () => {
    loadMyLeagues(() => true).catch(() => undefined);
  });

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
