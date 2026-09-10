import { buildMatchStrength, buildSchedule, rngNext, simulateMatchPlan, sortedTable, teamLiveStrength, updateTeamResult } from "../lib/game-rules.mjs";

const TIER_OVR = { 1: 76, 2: 69, 3: 63, 4: 58, 5: 54, 6: 50, 7: 46, 8: 42, 9: 38, 10: 34 };
const ENV = {
  1: ["Ekstraklasa", 6, 96, .005, 1.8], 2: ["I liga", 6, 95, .007, 1.6], 3: ["II liga", 5, 94, .01, 1.35], 4: ["III liga", 5, 92, .025, 1.1], 5: ["IV liga", 4, 90, .05, .9],
  6: ["V liga", 4, 88, .07, .75], 7: ["Okręgówka", 3, 86, .09, .6], 8: ["Klasa A", 2, 84, .12, .45], 9: ["Klasa B", 2, 82, .16, .32], 10: ["Klasa C", 2, 80, .2, .22],
};

function nextNumber(seed, min, max) { const roll = rngNext(seed); return { seed: roll.seed, value: min + (max - min) * roll.value }; }

function season(seed, tier, clubOVR, coachSkill, pressure) {
  const teamCount = tier <= 5 ? 18 : tier <= 7 ? 16 : 12; const teams = [];
  for (let index = 0; index < teamCount; index += 1) {
    const quality = nextNumber(seed, -4, 4); seed = quality.seed;
    teams.push({ id: `t${index}`, name: index === 0 ? "Klub gracza" : `Rywal ${index}`, ovr: index === 0 ? clubOVR : TIER_OVR[tier] + quality.value, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0, form: 50, morale: 55, fatigue: 14, lastFive: [] });
  }
  const fixtures = buildSchedule(teams.map((team) => team.id), 2026, tier); let table = teams;
  for (const fixture of fixtures) {
    const home = table.find((team) => team.id === fixture.home); const away = table.find((team) => team.id === fixture.away); const userHome = home.id === "t0"; const userAway = away.id === "t0";
    let homeStrength = teamLiveStrength(home); let awayStrength = teamLiveStrength(away);
    if (userHome || userAway) {
      const readiness = Math.min(ENV[tier][2], 68 + ENV[tier][1] * 2.5); const condition = tier >= 8 ? 82 : 86;
      const built = buildMatchStrength({ lineupOVR: clubOVR, readiness, coachTactics: coachSkill, averageCondition: condition, tactic: { pressing: "Średni", tempo: "Normalne", line: "Średnia", buildUp: "Mieszane", passingRisk: "Umiarkowane", mentality: "Zrównoważona" }, trainingSynergy: .2, burnout: Math.max(0, pressure - 60) / 8 });
      if (userHome) homeStrength = built.total; else awayStrength = built.total;
    }
    const result = simulateMatchPlan(seed, homeStrength, awayStrength, home.name, away.name); seed = result.seed; table = updateTeamResult(table, home.id, away.id, result.homeGoals, result.awayGoals);
  }
  const sorted = sortedTable(table); return { seed, place: sorted.findIndex((team) => team.id === "t0") + 1, teamCount, points: sorted.find((team) => team.id === "t0").points };
}

function runCareer(initialSeed, startTier = 9, maxSeasons = 35) {
  let seed = initialSeed; let tier = startTier; let clubOVR = TIER_OVR[tier]; let coachSkill = 43; let pressure = 20; const movements = []; let reachedSeason = null;
  for (let year = 1; year <= maxSeasons; year += 1) {
    const result = season(seed, tier, clubOVR, coachSkill, pressure); seed = result.seed;
    const oldTier = tier; let outcome = "utrzymanie";
    if (result.place === 1 && tier > 1) { tier -= 1; outcome = "awans"; }
    else if (result.place >= result.teamCount - 1 && tier < 10) { tier += 1; outcome = "spadek"; }
    const target = TIER_OVR[tier];
    if (outcome === "awans") clubOVR += Math.max(2.2, (target - clubOVR) * .62 + 1.2);
    else if (outcome === "spadek") clubOVR -= 1.2;
    else clubOVR += result.place <= Math.ceil(result.teamCount / 2) ? .9 : .25;
    clubOVR = Math.max(TIER_OVR[tier] - 7, Math.min(TIER_OVR[tier] + 8, clubOVR)); coachSkill = Math.min(86, coachSkill + .85); pressure = Math.max(12, Math.min(85, 18 + (result.place - 1) * 2.4));
    movements.push({ year, oldTier, tier, place: result.place, outcome, ovr: Number(clubOVR.toFixed(1)) });
    if (tier === 1) { reachedSeason = year; break; }
  }
  return { reachedSeason, finalTier: tier, finalOVR: Number(clubOVR.toFixed(1)), movements };
}

const careers = Array.from({ length: 120 }, (_, index) => runCareer(2_026_091 + index * 7919));
const successful = careers.filter((career) => career.reachedSeason !== null).map((career) => career.reachedSeason).sort((a, b) => a - b);
const percentile = (values, fraction) => values.length ? values[Math.min(values.length - 1, Math.floor((values.length - 1) * fraction))] : null;

const tierChecks = {};
for (let tier = 1; tier <= 10; tier += 1) {
  let favoriteWins = 0; let underdogWins = 0; const samples = 1000;
  for (let index = 0; index < samples; index += 1) {
    const match = simulateMatchPlan(90_000_000 + tier * 100_000 + index, TIER_OVR[tier] + 4, TIER_OVR[tier], "Faworyt", "Rywal");
    if (match.homeGoals > match.awayGoals) favoriteWins += 1; if (match.homeGoals < match.awayGoals) underdogWins += 1;
  }
  tierChecks[tier] = { name: ENV[tier][0], base_ovr: TIER_OVR[tier], sessions: ENV[tier][1], readiness_cap: ENV[tier][2], absence_risk_pct: ENV[tier][3] * 100, media_scale: ENV[tier][4], favorite_win_pct: Number((favoriteWins / samples * 100).toFixed(1)), upset_pct: Number((underdogWins / samples * 100).toFixed(1)) };
}

const report = {
  careers: careers.length,
  max_seasons: 35,
  b_to_ekstraklasa_success_pct: Number((successful.length / careers.length * 100).toFixed(1)),
  seasons_to_ekstraklasa: { fastest: successful[0] ?? null, p25: percentile(successful, .25), median: percentile(successful, .5), p75: percentile(successful, .75) },
  final_tier_distribution: Object.fromEntries(Array.from({ length: 10 }, (_, index) => index + 1).map((tier) => [tier, careers.filter((career) => career.finalTier === tier).length])),
  sample_successful_path: careers.find((career) => career.reachedSeason !== null)?.movements ?? [],
  tier_checks: tierChecks,
};

if (!successful.length) throw new Error("Ścieżka Klasa B → Ekstraklasa jest niemożliwa");
if (report.seasons_to_ekstraklasa.fastest < 8) throw new Error("Awans z Klasy B jest nienaturalnie szybki");
if (Object.values(tierChecks).some((item) => item.upset_pct < 10 || item.upset_pct > 30)) throw new Error("Niespodzianki mają złą skalę na którymś szczeblu");
console.log(JSON.stringify(report, null, 2));
