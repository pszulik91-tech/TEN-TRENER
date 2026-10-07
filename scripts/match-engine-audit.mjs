import { buildMatchStrength, simulateMatchPlan } from "../lib/game-rules.mjs";

const samples = 20_000;
const gaps = [-8, -4, 0, 4, 8];
const report = {};

for (const gap of gaps) {
  let wins = 0; let draws = 0; let losses = 0; let goals = 0; let shots = 0; let extremeUpsets = 0;
  for (let index = 1; index <= samples; index += 1) {
    const match = simulateMatchPlan(index * 97 + gap * 100_000, 50 + gap, 50, "A", "B");
    goals += match.homeGoals + match.awayGoals;
    shots += match.shotsHome + match.shotsAway;
    if (match.homeGoals > match.awayGoals) wins += 1;
    else if (match.homeGoals === match.awayGoals) draws += 1;
    else { losses += 1; if (gap >= 4 && match.awayGoals - match.homeGoals >= 3) extremeUpsets += 1; }
  }
  report[`gap_${gap}`] = {
    win_pct: Number((wins / samples * 100).toFixed(2)),
    draw_pct: Number((draws / samples * 100).toFixed(2)),
    loss_pct: Number((losses / samples * 100).toFixed(2)),
    goals_per_match: Number((goals / samples).toFixed(2)),
    shots_per_match: Number((shots / samples).toFixed(2)),
    extreme_upset_pct: Number((extremeUpsets / samples * 100).toFixed(2)),
  };
}

const preparation = Object.fromEntries([50, 62, 70, 80, 90].map((readiness) => {
  const built = buildMatchStrength({ lineupOVR: 50, readiness, coachTactics: 50, averageCondition: 82, tactic: { pressing: "Średni", tempo: "Normalne", line: "Średnia", buildUp: "Mieszane", passingRisk: "Umiarkowane", mentality: "Zrównoważona" } });
  return [readiness, { impact: built.factors.preparation, total_strength: built.total }];
}));

const winRates = gaps.map((gap) => report[`gap_${gap}`].win_pct);
if (!winRates.every((value, index) => index === 0 || value > winRates[index - 1])) throw new Error("Szanse nie rosną wraz z przewagą siły");
if (report.gap_0.goals_per_match < 2 || report.gap_0.goals_per_match > 3.4) throw new Error("Nierealistyczna liczba bramek");
if (report.gap_0.shots_per_match < 10 || report.gap_0.shots_per_match > 16) throw new Error("Nierealistyczna liczba strzałów");
if (report.gap_4.loss_pct < 10 || report.gap_4.loss_pct > 30) throw new Error("Słabszy zespół ma złą skalę szans");
if (report.gap_4.extreme_upset_pct <= 0 || report.gap_4.extreme_upset_pct > 3) throw new Error("Skrajne niespodzianki mają złą częstotliwość");

console.log(JSON.stringify({ samples_per_gap: samples, total_matches: samples * gaps.length, deterministic: true, report, preparation }, null, 2));
