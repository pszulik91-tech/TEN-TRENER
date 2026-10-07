import type { GameState, Team } from "./game-data";

/** Facts only: no inferred tactical traits or fictional scouting sources. */
export function opponentDossier(game: GameState, opponent: Team) {
  const own = game.teams.find((team) => team.id === game.club.id);
  const recent = opponent.lastFive?.slice(0, 5) ?? [];
  const labels: Record<string, string> = { win: "W", draw: "R", loss: "P" };
  const stronger = own !== undefined && opponent.ovr > own.ovr + 2;
  return {
    facts: [
      { label: "JAKOŚĆ", value: `OVR rywala: ${opponent.ovr}; nasz OVR: ${own?.ovr ?? "brak danych"}.` },
      { label: "BILANS LIGOWY", value: `${opponent.points} pkt / ${opponent.played} meczów; bramki ${opponent.gf}:${opponent.ga}.` },
      { label: "OSTATNIE WYNIKI (OD NAJNOWSZEGO)", value: recent.length ? recent.map((result) => labels[result] ?? "?").join("–") + " (W: wygrana, R: remis, P: porażka)." : "Brak zapisanych ostatnich wyników." },
      { label: "ZMĘCZENIE", value: opponent.fatigue === undefined ? "Brak danych o zmęczeniu rywala." : `Zmęczenie rywala: ${opponent.fatigue}/100.` },
    ],
    recommendation: stronger ? "Wybierz plan Najsilniejsza XI." : "Zacznij ze zrównoważoną mentalnością.",
    reason: own === undefined
      ? "Brak naszego OVR do porównania; sztab proponuje neutralny punkt wyjścia."
      : stronger
        ? `Rywal ma OVR ${opponent.ovr}, a my ${own.ovr} — przewaga przekracza 2 punkty. Plan dobiera zawodników według bieżącej jakości i pozycji.`
        : `Rywal ma OVR ${opponent.ovr}, a my ${own.ovr} — nie ma przewagi rywala większej niż 2 punkty. Sztab proponuje zrównoważony punkt wyjścia.`,
  };
}
