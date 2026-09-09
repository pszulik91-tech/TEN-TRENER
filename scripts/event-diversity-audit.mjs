import assert from "node:assert/strict";
import { EVENT_POOL, generateRoundIssues } from "../lib/career-events.mjs";

const SEASONS_PER_TIER = 1_000;
const ROUNDS = 34;

function entropy(counts) {
  const values = [...counts.values()]; const total = values.reduce((sum, value) => sum + value, 0);
  if (!total || values.length < 2) return 0;
  const raw = -values.reduce((sum, value) => { const p = value / total; return sum + p * Math.log(p); }, 0);
  return raw / Math.log(values.length);
}

function auditTier(tier) {
  let seed = (202627 + tier * 104729) >>> 0; let eventCount = 0; let emptyRounds = 0; let doubleRounds = 0; let repeatViolations = 0; let categoryViolations = 0;
  const titles = new Map(); const categories = new Map(); const choiceLabels = new Set();
  for (let season = 0; season < SEASONS_PER_TIER; season += 1) {
    const recentTitles = []; const recentCategories = [];
    for (let round = 1; round <= ROUNDS; round += 1) {
      const result = (season + round) % 7 === 0 ? "loss" : (season * 3 + round) % 4 === 0 ? "win" : "draw";
      const batch = generateRoundIssues({ seed, round, tier, result, worldHumor: tier >= 7 ? 82 : 35, recentTitles, recentCategories }); seed = batch.seed;
      if (!batch.events.length) emptyRounds += 1; if (batch.events.length === 2) doubleRounds += 1;
      for (const event of batch.events) {
        if (recentTitles.slice(0, 8).includes(event.title)) repeatViolations += 1;
        if (recentCategories.slice(0, 2).includes(event.category)) categoryViolations += 1;
        eventCount += 1; titles.set(event.title, (titles.get(event.title) ?? 0) + 1); categories.set(event.category, (categories.get(event.category) ?? 0) + 1);
        event.choices.forEach((choice) => choiceLabels.add(choice.label)); recentTitles.unshift(event.title); recentCategories.unshift(event.category);
      }
    }
  }
  const rounds = SEASONS_PER_TIER * ROUNDS; const topShare = Math.max(...titles.values()) / eventCount;
  const eligible = EVENT_POOL.filter((event) => tier >= event.from && tier <= event.to);
  const coverage = titles.size / eligible.length;
  assert.equal(repeatViolations, 0, `tier ${tier}: powtórki w oknie`);
  assert.equal(categoryViolations, 0, `tier ${tier}: seria jednej kategorii`);
  assert.ok(eventCount / rounds >= .75 && eventCount / rounds <= 1.02, `tier ${tier}: częstotliwość ${eventCount / rounds}`);
  assert.ok(emptyRounds / rounds >= .14, `tier ${tier}: za mało spokojnych kolejek`);
  assert.ok(doubleRounds / rounds <= .19, `tier ${tier}: za dużo podwójnych spraw`);
  assert.ok(topShare < .09, `tier ${tier}: dominujący temat ${topShare}`);
  assert.ok(entropy(titles) > .93, `tier ${tier}: niska entropia tematów`);
  assert.ok(entropy(categories) > .86, `tier ${tier}: niska entropia kategorii`);
  assert.ok(coverage > .82, `tier ${tier}: pokrycie ${coverage}`);
  return { tier, rounds, events: eventCount, perRound: eventCount / rounds, emptyShare: emptyRounds / rounds, doubleShare: doubleRounds / rounds, uniqueTitles: titles.size, categories: categories.size, choiceLabels: choiceLabels.size, topShare, titleEntropy: entropy(titles), categoryEntropy: entropy(categories), coverage };
}

const results = Array.from({ length: 10 }, (_, index) => auditTier(index + 1));
const deterministicA = generateRoundIssues({ seed: 777, round: 12, tier: 9, result: "loss", worldHumor: 82, recentTitles: [], recentCategories: [] });
const deterministicB = generateRoundIssues({ seed: 777, round: 12, tier: 9, result: "loss", worldHumor: 82, recentTitles: [], recentCategories: [] });
assert.deepEqual(deterministicA, deterministicB, "generator utracił deterministyczność");

console.log("TEN TRENER — AUDYT ZDARZEŃ I NUDY");
console.table(results.map((row) => ({
  poziom: row.tier,
  kolejki: row.rounds,
  "zdarzeń/kolejkę": row.perRound.toFixed(3),
  "spokojne": `${(row.emptyShare * 100).toFixed(1)}%`,
  "podwójne": `${(row.doubleShare * 100).toFixed(1)}%`,
  tematy: row.uniqueTitles,
  kategorie: row.categories,
  odpowiedzi: row.choiceLabels,
  "top temat": `${(row.topShare * 100).toFixed(1)}%`,
  "entropia tematów": row.titleEntropy.toFixed(3),
  "pokrycie puli": `${(row.coverage * 100).toFixed(1)}%`,
})));
console.log(`PASS: ${SEASONS_PER_TIER * 10} sezonów, ${SEASONS_PER_TIER * 10 * ROUNDS} kolejek, zero powtórek w oknie 8 spraw i zero serii tej samej kategorii.`);
