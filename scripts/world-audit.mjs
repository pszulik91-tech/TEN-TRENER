import { VERIFIED_LEAGUE_PACKS } from "../app/league-catalog.mjs";
import { createWorldSnapshot, evolveWorldSnapshot, simulateWorldToDate } from "../lib/world-engine.mjs";

const baselines = { 1: 76, 2: 69, 3: 63, 4: 58, 5: 54, 6: 50, 7: 46, 8: 42, 9: 38, 10: 34 };
const seasons = 20;

function audit(initialSeed) {
  let seed = initialSeed;
  let created = createWorldSnapshot(VERIFIED_LEAGUE_PACKS, "", 2026, seed, baselines);
  let world = created.world; seed = created.seed;
  let matches = 0; let ovrChanges = 0;
  for (let index = 0; index < seasons; index += 1) {
    const completed = simulateWorldToDate(world, `${2027 + index}-06-20`, seed); world = completed.world; seed = completed.seed;
    for (const competition of world.competitions) {
      matches += competition.teams.reduce((sum, team) => sum + team.played, 0) / 2;
      if (competition.currentRound !== competition.totalRounds) throw new Error(`${competition.id}: niedokończony sezon`);
      if (competition.teams.reduce((sum, team) => sum + team.gf, 0) !== competition.teams.reduce((sum, team) => sum + team.ga, 0)) throw new Error(`${competition.id}: bilans bramek`);
      for (const team of competition.teams) {
        if (team.won + team.drawn + team.lost !== team.played || team.points !== team.won * 3 + team.drawn) throw new Error(`${competition.id}/${team.name}: tabela`);
        if (!Object.values(team).filter((value) => typeof value === "number").every(Number.isFinite)) throw new Error(`${competition.id}/${team.name}: NaN`);
      }
    }
    if (index < seasons - 1) {
      const before = new Map(world.competitions.flatMap((competition) => competition.teams.map((team) => [`${competition.id}:${team.name}`, team.ovr])));
      const evolved = evolveWorldSnapshot(world, VERIFIED_LEAGUE_PACKS, "", 2027 + index, seed, baselines); world = evolved.world; seed = evolved.seed;
      ovrChanges += world.competitions.flatMap((competition) => competition.teams.map((team) => before.get(`${competition.id}:${team.name}`) !== team.ovr)).filter(Boolean).length;
    }
  }
  const managerChanges = world.competitions.reduce((sum, competition) => sum + competition.managerChanges, 0);
  return { seed, competitions: world.competitions.length, teams: world.competitions.reduce((sum, competition) => sum + competition.teams.length, 0), seasons, matches, managerChanges, ovrChanges };
}

const first = audit(661_903);
const second = audit(661_903);
if (JSON.stringify(first) !== JSON.stringify(second)) throw new Error("Audyt świata nie jest deterministyczny");
if (first.matches < 150_000 || first.ovrChanges === 0 || first.managerChanges === 0) throw new Error("Świat nie wykazuje oczekiwanej aktywności");
console.log(JSON.stringify({ deterministic: true, ...first }, null, 2));
