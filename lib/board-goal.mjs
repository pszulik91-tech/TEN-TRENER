import { clamp, dismissalProbability, sortedTable } from "./game-rules.mjs";

// A season snapshot: results, coach reputation and random seed are not inputs.
export function createBoardGoal(teams, clubId, season, ambition = 50) {
  const count = Math.max(1, teams.length);
  const own = teams.find(team => team.id === clubId);
  const stronger = own ? teams.filter(team => team.ovr > own.ovr).length : count - 1;
  const equals = own ? teams.filter(team => team.id !== clubId && team.ovr === own.ovr).length : 0;
  const predictedPlace = 1 + stronger + Math.floor(equals / 2);
  // Even a weak club is asked to avoid the very bottom; ambition tightens by at most two places.
  const baseline = Math.min(predictedPlace, Math.ceil(count * .85));
  const ambitionLift = Math.min(2, Math.ceil(count * .1), Math.ceil(Math.max(0, clamp(ambition, 0, 100) - 60) / 20));
  const maxPlace = Math.max(1, baseline - ambitionLift);
  const label = maxPlace <= Math.ceil(count * .25) ? "Walka o czołówkę" : maxPlace <= Math.ceil(count * .5) ? "Górna połowa" : "Bezpieczny sezon";
  return { clubId, season, maxPlace, label };
}

export function boardGoalFor(game) {
  const goal = game.boardGoal;
  if (goal?.clubId === game.club.id && goal.season === game.season && Number.isInteger(goal.maxPlace) && goal.maxPlace >= 1 && goal.maxPlace <= game.teams.length) return goal;
  return createBoardGoal(game.teams, game.club.id, game.season, game.president?.ambition ?? 50);
}

export function boardGoalProgress(game) {
  const goal = boardGoalFor(game);
  const place = sortedTable(game.teams).findIndex(team => team.id === game.club.id) + 1;
  const fulfilled = place > 0 && place <= goal.maxPlace;
  const complete = Boolean(game.newSeasonPending || game.pendingSeason);
  return { goal, place, fulfilled, status: complete ? (fulfilled ? "Spełniony" : "Niewykonany") : fulfilled ? "Realizowany" : "Zagrożony" };
}

export function boardGoalDismissalProbability(input, fulfilled) {
  return clamp(dismissalProbability(input) + (fulfilled ? -.06 : .06), .02, .86);
}

export function boardGoalResultText(place, maxPlace, fulfilled) {
  return `CEL ZARZĄDU: ${fulfilled ? "WYKONANY" : "NIEWYKONANY"}. Pozycja końcowa: ${place}. Wymagane: ${maxPlace}. miejsce lub wyżej.`;
}
