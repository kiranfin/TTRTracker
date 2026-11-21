# Aufgaben für die nächste Session

Stand: App-Version 0.4.3. Kleine Änderungen nur auf Patch erhöhen, ein Minor-Sprung (z.B. 0.5.0) nur nach Rückfrage. Nichts committen, am Ende immer eine Commit-Nachricht zum Einfügen schicken.

## Erledigt in 0.4.3 (nur von Hand auf dem Handy noch nicht geprüft)

- Logos: `ClubLogo` mit Key je Verein, `knownUrl` wird nur noch angezeigt (Merken nur mit `trustUri`), Speicher `tttracker.clubLogos.v2`, `clubForList` in `src/storage/clubLogos.ts` (DTTB Listen ohne Logo), `getMeetingClub` ohne Rückfall auf `fed_nickname`.
- Spielseite: keine Aufstellung vor Spielbeginn, Doppelnamen gekürzt, beide Mannschaften tippbar (Route, Spielbericht, Teamliste des Vereins, sonst Vereinsseite), zentraler Helfer `src/features/match-details/navigation.ts`.
- Team-Seite: Logo, Kopf und Button "Zum Verein".
- Live-Polling: höchstens 3 Spiele, Liga nur eigener Verein, Team nur eigene Mannschaft, ohne Stand nach 90 Minuten Schluss, Pause bei 429 (`src/api/livePause.ts`).
- Debug-Bereich in den Einstellungen (`src/api/debugStats.ts`, `DebugSheet`).

## Offen: HTML-Weg für den Spielbericht (Phase A getestet, Phase B wartet auf Entscheidung)

Befund (Stand 2026-11-21):
- Seite: `/click-tt/<Verband>/<Saison>/ligen/<Liga>/gruppe/<GruppenId>/spielbericht/<MeetingId>/<Heim>-vs-<Gast>`, Route-ID `routes/click-tt+/$association+/$season+/$type+/$groupname.gruppe.$urlid+/spielbericht.$meeting_id.$meeting_name`.
- Die Seite nutzt `window.__remixContext` (kein turbo-stream). Die Daten liegen unter `loaderData[<Route-ID>].meetingReport` (nicht unter `data` wie bei der API), mit denselben Feldnamen wie `MeetingLiveDataSchema` (`match[]`, `mm_player11` bis `22`, `set1_home` bis `set5_guest`, `matches_home`, `live`, `is_completed`). Zusätzlich `team_home_club_fed_nickname`.
- `?_data=<Route-ID>` liefert dasselbe als JSON (200, ca. 25 KB).
- Der Loader ignoriert Gruppe und Namens-Segmente: nur die Meeting-ID zählt. Mit `/click-tt/TTBW/26--27/ligen/x/gruppe/1/spielbericht/<id>/x` kommt derselbe Bericht. Ein Merkzettel für den URL-Kontext ist damit nicht nötig.
- Nicht geprüft: ob der Zwischenstand eines laufenden Spiels dort genauso aktuell ist wie in der API (am Testtag lief nichts).
- Fixture: `tt-tracker-backend/test/fixtures/meeting-report-loader.json`.

Phase B (nach Zustimmung): `getMeetingLive` über `fetchWithFallback`, Fallback liest `meetingReport` per `getRouteDataFromPage` und verpackt als `{ data: meetingReport }`, Test mit der Fixture, `ARCHITECTURE.md` und README ergänzen.

## Hinweise

- `npx tsc --noEmit` zeigt schon vorher Fehler in `src/data/leagues.ts` (fehlende Felder in `LeagueRegion`), die nichts mit diesen Aufgaben zu tun haben.
- Neue Texte immer in `de.ts` und `en.ts`, Farben nur über `useTheme().colors`.
