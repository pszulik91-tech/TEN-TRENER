import { effectiveOVR, FORMATIONS, playerAvailable } from "./game-data";
import type { GameState, Player } from "./game-data";
import { lineupSelectionReason } from "../lib/game-rules.mjs";

type SquadState = Pick<GameState, "players" | "tactic" | "teamPlan">;
export function lineupView(game: SquadState) {
  const entries = FORMATIONS[game.tactic.formation].map(slot => ({ slot, player: game.players.find(p => p.id === game.tactic.assignments[slot]) }));
  const players = entries.flatMap(e => e.player ? [e.player] : []);
  const ids = new Set(players.map(p => p.id));
  return {
    entries,
    outside: game.players.filter(p => !ids.has(p.id)),
    quality: Math.round(entries.reduce((sum, e) => sum + (e.player ? effectiveOVR(e.player, e.slot) : 0), 0) / entries.length),
    condition: players.length ? Math.round(players.reduce((sum, p) => sum + 100 - p.fatigue, 0) / players.length) : 0,
  };
}
export function lineupChange(before: SquadState, after: SquadState) {
  const previous = lineupView(before); const current = lineupView(after);
  const oldIds = new Set(previous.entries.map(e => e.player?.id));
  const newIds = new Set(current.entries.map(e => e.player?.id));
  return {
    from: before.teamPlan, to: after.teamPlan,
    entering: current.entries.flatMap(e => e.player && !oldIds.has(e.player.id) ? [{ player: e.player, slot: e.slot, reason: lineupSelectionReason(e.player, e.slot, after.teamPlan) }] : []),
    leaving: previous.entries.flatMap(e => e.player && !newIds.has(e.player.id) ? [e.player] : []),
    qualityBefore: previous.quality, qualityAfter: current.quality,
    conditionBefore: previous.condition, conditionAfter: current.condition,
  };
}
export function absenceLabel(player: Player) {
  if (playerAvailable(player)) return "Dostępny poza XI";
  const reasons = [];
  if ((player.injuryWeeks ?? 0) > 0) reasons.push(`Kontuzja: ${player.injuryWeeks} tyg.`);
  if ((player.absenceRounds ?? 0) > 0) reasons.push(`${player.absenceReason || "Nieobecność"}: ${player.absenceRounds} kolejek`);
  return reasons.join(" • ");
}
