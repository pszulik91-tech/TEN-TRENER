import {
  POLICY_EFFECTS, TEAM_PLANS, buildMatchStrength, conditionFromFatigue, evaluateMicrocycle,
  naturalRecoveryForGap, rngNext, selectLineupForPlan, simulateMatchPlan, trainingPresetSessions,
} from "../lib/game-rules.mjs";

const FORMATIONS = {
  "4-2-3-1": ["BR", "PO", "ŚO-P", "ŚO-L", "LO", "DP-P", "DP-L", "PP", "ŚPO", "LP", "N"],
  "4-3-3": ["BR", "PO", "ŚO-P", "ŚO-L", "LO", "ŚP-P", "ŚP", "ŚP-L", "PP", "LP", "N"],
  "4-4-2": ["BR", "PO", "ŚO-P", "ŚO-L", "LO", "PP", "ŚP-P", "ŚP-L", "LP", "N-P", "N-L"],
  "3-5-2": ["BR", "ŚO-P", "ŚO", "ŚO-L", "PP", "ŚP-P", "DP", "ŚP-L", "LP", "N-P", "N-L"],
};

const positions = ["BR", "BR", "PO", "PO", "ŚO", "ŚO", "ŚO", "ŚO", "LO", "LO", "DP", "DP", "ŚP", "ŚP", "ŚP", "ŚPO", "PP", "PP", "LP", "LP", "N", "N", "N"];
const presetForPlan = (id) => id === "PRESS" ? "INTENSE" : id === "FRESH" || id === "ROTATION" ? "RECOVERY" : id === "YOUTH" ? "YOUTH" : id === "LOW_BLOCK" || id === "COUNTER" || id === "POSSESSION" ? "OPPONENT" : "BALANCED";

function makeRoster(seed) {
  const players = [];
  for (const [index, primary] of positions.entries()) {
    let roll = rngNext(seed); seed = roll.seed; const age = index % 5 === 0 ? 19 + index % 3 : 23 + Math.floor(roll.value * 12);
    roll = rngNext(seed); seed = roll.seed; const baseOVR = 47 + Math.floor(roll.value * 10);
    players.push({ id: `p${index}`, primary, secondary: [], age, baseOVR, form: 50, morale: 55, fatigue: 10, relation: 50, injuryWeeks: 0, absenceRounds: 0 });
  }
  return { players, seed };
}

function runSeason(initialSeed, planId) {
  let seed = initialSeed; const generated = makeRoster(seed); let players = generated.players; seed = generated.seed;
  const plan = TEAM_PLANS[planId]; const policy = POLICY_EFFECTS[plan.policy]; const slots = FORMATIONS[plan.formation];
  let points = 0; let conditionSum = 0; let youngStarts = 0; const startersUsed = new Set();
  for (let round = 1; round <= 18; round += 1) {
    const microcycle = evaluateMicrocycle(trainingPresetSessions(2, presetForPlan(planId)));
    players = players.map((player) => ({ ...player, fatigue: Math.max(0, Math.min(100, player.fatigue - naturalRecoveryForGap(7, 9) + microcycle.fatigueDelta)), absenceRounds: Math.max(0, player.absenceRounds - 1) }));
    if (round % 7 === 0) {
      const roll = rngNext(seed); seed = roll.seed; const index = Math.floor(roll.value * players.length);
      players = players.map((player, playerIndex) => playerIndex === index ? { ...player, absenceRounds: 1 } : player);
    }
    const assignments = selectLineupForPlan(players, slots, planId); const starterIds = new Set(Object.values(assignments));
    const starters = players.filter((player) => starterIds.has(player.id));
    if (starters.length !== 11) throw new Error(`${planId}: niepełna XI`);
    for (const player of starters) { startersUsed.add(player.id); if (player.age <= 21) youngStarts += 1; }
    const averageCondition = starters.reduce((sum, player) => sum + conditionFromFatigue(player.fatigue), 0) / 11;
    const lineupOVR = starters.reduce((sum, player) => sum + player.baseOVR, 0) / 11;
    const strength = buildMatchStrength({ lineupOVR, readiness: 68 + microcycle.readinessGain, coachTactics: 50, averageCondition, tactic: plan.tactic, policyStrength: policy.matchStrength, burnout: 12 });
    const match = simulateMatchPlan(seed, strength.total + .2, 52, "Gracz", "Rywal"); seed = match.seed;
    const result = match.homeGoals > match.awayGoals ? "win" : match.homeGoals === match.awayGoals ? "draw" : "loss";
    points += result === "win" ? 3 : result === "draw" ? 1 : 0; conditionSum += averageCondition;
    players = players.map((player) => ({
      ...player,
      fatigue: Math.max(0, Math.min(100, player.fatigue + (starterIds.has(player.id) ? 8 + policy.fatigue : -2))),
      form: Math.max(20, Math.min(85, player.form + (starterIds.has(player.id) ? (result === "win" ? 2 : result === "loss" ? -1 : 0) : 0))),
      morale: Math.max(20, Math.min(85, player.morale + (starterIds.has(player.id) ? (result === "win" ? 2 : result === "loss" ? -2 : 0) + policy.morale : 0))),
    }));
  }
  return { points, averageCondition: conditionSum / 18, youngStarts, startersUsed: startersUsed.size };
}

const report = {};
for (const [planIndex, planId] of Object.keys(TEAM_PLANS).entries()) {
  const seasons = Array.from({ length: 300 }, (_, index) => runSeason(910_000 + planIndex * 100_000 + index * 137, planId));
  const average = (key) => seasons.reduce((sum, season) => sum + season[key], 0) / seasons.length;
  report[planId] = { seasons: seasons.length, matches: seasons.length * 18, points: Number(average("points").toFixed(2)), condition: Number(average("averageCondition").toFixed(1)), youth_starts: Number(average("youngStarts").toFixed(1)), players_used: Number(average("startersUsed").toFixed(1)) };
}
if (Object.values(report).some((item) => !Object.values(item).every(Number.isFinite))) throw new Error("NaN w audycie planów");
if (report.YOUTH.youth_starts <= report.STRONGEST.youth_starts) throw new Error("Plan młodzieżowy nie daje młodym więcej minut");
if (report.ROTATION.players_used < report.STRONGEST.players_used || report.ROTATION.condition < report.STRONGEST.condition) throw new Error("Rotacja nie chroni lub nie poszerza kadry");
if (report.FRESH.condition <= report.PRESS.condition) throw new Error("Świeże nogi nie chronią kondycji");
if (Math.max(...Object.values(report).map((item) => item.points)) - Math.min(...Object.values(report).map((item) => item.points)) > 8) throw new Error("Jeden plan stał się stałą metą");
console.log(JSON.stringify({ deterministic_seed: true, plans: Object.keys(TEAM_PLANS).length, seasons: 3000, matches: 54000, report }, null, 2));
