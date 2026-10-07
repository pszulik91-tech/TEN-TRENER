import type { GameState } from "./game-data";
import { boardGoalProgress, boardGoalResultText } from "../lib/board-goal.mjs";

export function BoardGoalPanel({ game }: { game: GameState }) {
  const { goal, place, fulfilled, status } = boardGoalProgress(game);
  const settled = Boolean(game.pendingSeason);
  return <section className="panel board-goal-panel" aria-label="Cel sportowy zarządu">
    <div className="panel-title"><strong>{settled ? "Rozliczenie celu zarządu" : "Cel sportowy zarządu"}</strong><small>{goal.season}</small></div>
    <h2>{goal.label}</h2>
    <p>Zakończ sezon na <b>{goal.maxPlace}. miejscu lub wyżej</b>.</p>
    <p>{settled ? "Pozycja końcowa" : "Aktualna pozycja"}: <b>{place || "—"}</b> • <b>{status}</b></p>
    {settled && <p><strong>{boardGoalResultText(place, goal.maxPlace, fulfilled)}</strong> {fulfilled ? "Wykonanie celu przemawia za dalszą współpracą." : "Niewykonanie celu przemawia przeciw dalszej współpracy."} Ocena zatrudnienia uwzględnia także wyniki, presję i osobowość prezesa.</p>}
    <p className="source-note">Misja klubu na ten sezon. Dwa osobiste cele rozwojowe trenera są rozliczane osobno i rozwijają jego umiejętności.</p>
  </section>;
}
