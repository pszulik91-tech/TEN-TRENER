import {
  POLICY_EFFECTS, burnoutMatchPenalty, licenseCoversTier, offseasonBurnout, pressureDeltaForResult,
  requiredLicenseForTier, simulateMatchPlan, weeklyBurnoutDelta,
} from "../lib/game-rules.mjs";

const POLICIES = Object.keys(POLICY_EFFECTS);
const CAREERS_PER_POLICY = 160;
const SEASONS = 30;

function runCareer(initialSeed, policyId) {
  let seed = initialSeed; let tier = 9; let burnout = 8; let pressure = 20; let age = 35;
  let promotions = 0; let relegations = 0; let criticalSeasons = 0; let pointsTotal = 0; let peakBurnout = burnout;
  const policy = POLICY_EFFECTS[policyId]; const licenses = ["Grassroots C", "UEFA B", "UEFA A", "UEFA PRO"]; let license = licenses[0];
  for (let season = 0; season < SEASONS; season += 1) {
    const fatigue = Array(23).fill(10); let seasonPoints = 0;
    for (let round = 1; round <= 18; round += 1) {
      const ordered = fatigue.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
      const starters = policyId === "HARDLINE" ? Array.from({ length: 11 }, (_, index) => index) : ordered.slice(0, 11).map((item) => item.index);
      const starterFatigue = starters.reduce((sum, index) => sum + fatigue[index], 0) / 11; const recovery = starterFatigue > 38;
      for (let index = 0; index < fatigue.length; index += 1) fatigue[index] = Math.max(0, Math.min(100, fatigue[index] + 4 - (recovery ? 4 : 0)));
      const freshnessPenalty = Math.max(0, starterFatigue - 30) * .035; const base = 46 - (tier - 7) * 4;
      const strength = base + policy.matchStrength - burnoutMatchPenalty(burnout) - freshnessPenalty; const opponent = base;
      const match = round % 2 ? simulateMatchPlan(seed, strength + .2, opponent, "Gracz", "Rywal") : simulateMatchPlan(seed, opponent + .2, strength, "Rywal", "Gracz"); seed = match.seed;
      const gf = round % 2 ? match.homeGoals : match.awayGoals; const ga = round % 2 ? match.awayGoals : match.homeGoals; const result = gf > ga ? "win" : gf === ga ? "draw" : "loss";
      seasonPoints += result === "win" ? 3 : result === "draw" ? 1 : 0; pressure = Math.max(0, Math.min(100, pressure + pressureDeltaForResult(result, 1)));
      burnout = Math.max(0, Math.min(100, burnout + weeklyBurnoutDelta({ result, intensity: "Normalna", recovery, policyBurnout: policy.burnout, pressure, profile: "Dyplomata" })));
      for (let index = 0; index < fatigue.length; index += 1) fatigue[index] = Math.max(0, Math.min(100, fatigue[index] + (starters.includes(index) ? 5 + policy.fatigue : 1)));
      peakBurnout = Math.max(peakBurnout, burnout);
    }
    pointsTotal += seasonPoints; if (burnout >= 65) criticalSeasons += 1;
    if (seasonPoints >= 31 && tier > 1) { tier -= 1; promotions += 1; }
    else if (seasonPoints <= 14 && tier < 10) { tier += 1; relegations += 1; }
    const required = requiredLicenseForTier(tier); while (!licenseCoversTier(license, tier)) license = licenses[Math.min(licenses.length - 1, licenses.indexOf(license) + 1)];
    if (!licenseCoversTier(license, tier) || required !== requiredLicenseForTier(tier)) throw new Error("Błąd ścieżki licencji");
    burnout = offseasonBurnout(burnout); pressure = Math.max(12, Math.round(pressure * .55)); age += 1;
  }
  return { pointsTotal, promotions, relegations, criticalSeasons, peakBurnout, finalBurnout: burnout, finalTier: tier, age, retirementEligible: age >= 65 };
}

function audit(seedBase = 913_027) {
  const report = {};
  for (const [policyIndex, policy] of POLICIES.entries()) {
    const careers = Array.from({ length: CAREERS_PER_POLICY }, (_, index) => runCareer(seedBase + policyIndex * 100_000 + index * 97, policy));
    const avg = (key) => careers.reduce((sum, career) => sum + career[key], 0) / careers.length;
    report[policy] = {
      careers: careers.length,
      seasons: careers.length * SEASONS,
      avg_points_per_season: Number((avg("pointsTotal") / SEASONS).toFixed(2)),
      avg_promotions: Number(avg("promotions").toFixed(2)),
      avg_relegations: Number(avg("relegations").toFixed(2)),
      critical_seasons_pct: Number((avg("criticalSeasons") / SEASONS * 100).toFixed(2)),
      avg_peak_burnout: Number(avg("peakBurnout").toFixed(2)),
      avg_final_burnout: Number(avg("finalBurnout").toFixed(2)),
      avg_final_tier: Number(avg("finalTier").toFixed(2)),
      retirement_eligible_pct: Number((careers.filter((career) => career.retirementEligible).length / careers.length * 100).toFixed(2)),
    };
  }
  return report;
}

const first = audit(); const second = audit();
if (JSON.stringify(first) !== JSON.stringify(second)) throw new Error("Audyt nie jest deterministyczny");
const pointAverages = Object.values(first).map((item) => item.avg_points_per_season);
if (Math.max(...pointAverages) - Math.min(...pointAverages) > 7) throw new Error("Jedna polityka stała się dominującą metą");
if (Object.values(first).some((item) => item.retirement_eligible_pct !== 100)) throw new Error("Wiek trenera nie postępuje poprawnie");
console.log(JSON.stringify({ sample: { careers: CAREERS_PER_POLICY * POLICIES.length, seasons: CAREERS_PER_POLICY * POLICIES.length * SEASONS, matches: CAREERS_PER_POLICY * POLICIES.length * SEASONS * 18 }, deterministic: true, policies: first }, null, 2));
