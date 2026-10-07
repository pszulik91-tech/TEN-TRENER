"use client";
import { Button } from "@/components/ui/button";
import type { GameState, Screen } from "./game-data";
import { currentFixture, teamForId } from "./game-engine";
import { BoardGoalPanel } from "./board-goal-panel";
import { arrivalBriefing } from "./coach-onboarding";

export function ClubArrival({ game, resolveDecision, go }: { game: GameState; resolveDecision: (id: string, choice: string) => void; go: (screen: Screen) => void }) {
  const briefing = arrivalBriefing(game);
  const fixture = currentFixture(game);
  const opponent = fixture ? teamForId(game, fixture.home === game.club.id ? fixture.away : fixture.home)?.name : undefined;
  const enter = (destination: Screen) => { resolveDecision("welcome", "ack"); go(destination); };
  return <section className="club-arrival" aria-labelledby="arrival-heading"><header><span>PIERWSZY DZIEŃ W KLUBIE</span><b>{game.club.competition}</b></header><div className="arrival-body"><p className="arrival-scene">{briefing.scene}</p><h1 id="arrival-heading">Witamy w {game.club.name}.</h1><blockquote><p>{briefing.line}</p><cite>{briefing.speaker}</cite></blockquote><div className="arrival-task"><span>PIERWSZA SPRAWA NA TWOIM BIURKU</span><h2>Przygotuj zespół do debiutu</h2><p>{briefing.task}</p><dl><div><dt>Sesje w mikrocyklu</dt><dd>{game.training.sessions.length}</dd></div><div><dt>Przygotowanie teraz</dt><dd>{Math.round(game.training.readiness)}%</dd></div>{opponent && <div><dt>Pierwszy rywal</dt><dd>{opponent}</dd></div>}</dl></div><BoardGoalPanel game={game} /><details><summary>Twoje dwa cele rozwojowe na sezon</summary>{game.developmentGoals.map(goal => <p key={goal.id}><b>{goal.label}.</b> {goal.description}</p>)}</details><p className="arrival-effect">Przyjęcie odpowiedzialności może nieznacznie zwiększyć stres osobisty. Faktyczny skutek zobaczysz w podsumowaniu decyzji na pulpicie.</p></div><footer><Button variant="outline" onClick={() => enter("dashboard")}>Najpierw rozejrzę się w klubie</Button><Button onClick={() => enter("training")}>Ułóż pierwszy mikrocykl</Button></footer></section>;
}
