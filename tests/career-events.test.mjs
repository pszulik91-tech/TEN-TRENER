import test from "node:test";
import assert from "node:assert/strict";
import { EVENT_POOL, generateRoundIssues, welcomeIssue } from "../lib/career-events.mjs";

test("pula problemów ma co najmniej 12 odrębnych sytuacji i własne odpowiedzi", () => {
  assert.ok(EVENT_POOL.length >= 12);
  assert.equal(new Set(EVENT_POOL.map((event) => event.title)).size, EVENT_POOL.length);
  for (const event of EVENT_POOL) {
    assert.equal(event.choices.length, 3, event.title);
    assert.equal(new Set(event.choices.map((choice) => choice.label)).size, 3, event.title);
    for (const choice of event.choices) {
      assert.ok(choice.feedback.length > 20);
      assert.ok(Object.keys(choice.effects).length > 0);
    }
  }
});

test("powitanie ma sensowną odpowiedź zamiast karania nieistniejącego zawodnika", () => {
  const issue = welcomeIssue("Klub Test", "Piotr", "utrzymania", "futbol społecznościowy", "zbierasz dostępnych");
  assert.equal(issue.choices.length, 1);
  assert.match(issue.choices[0].label, /odpowiedzialność/i);
  assert.doesNotMatch(issue.choices[0].label, /kar|zawodnik/i);
});

function simulateIssues(initialSeed, tier, result = "draw") {
  let seed = initialSeed; const recent = []; const all = [];
  for (let round = 1; round <= 18; round += 1) {
    const batch = generateRoundIssues({ seed, round, tier, result, worldHumor: 72, recentTitles: recent });
    seed = batch.seed;
    for (const event of batch.events) { assert.ok(!recent.slice(0, 4).includes(event.title)); recent.unshift(event.title); all.push(event); }
  }
  return { seed, all };
}

test("sekwencja zdarzeń jest deterministyczna, ale nie powtarza tematu w czterech ostatnich sprawach", () => {
  const first = simulateIssues(202627, 9);
  const second = simulateIssues(202627, 9);
  assert.deepEqual(first, second);
  assert.ok(first.all.length >= 12 && first.all.length <= 28);
  assert.ok(new Set(first.all.map((event) => event.title)).size >= 6);
  assert.ok(new Set(first.all.flatMap((event) => event.choices.map((choice) => choice.label))).size >= 14);
});

test("Monte Carlo 1000 rund zachowuje realistyczną częstotliwość 0–2 spraw", () => {
  let seed = 191212; let total = 0; const titles = new Set(); const recent = [];
  for (let round = 1; round <= 1000; round += 1) {
    const batch = generateRoundIssues({ seed, round, tier: round % 2 ? 2 : 9, result: round % 4 === 1 ? "loss" : "draw", worldHumor: 35, recentTitles: recent });
    seed = batch.seed; assert.ok(batch.events.length >= 0 && batch.events.length <= 2); total += batch.events.length;
    for (const event of batch.events) { titles.add(event.title); recent.unshift(event.title); }
  }
  assert.ok(total / 1000 > .8 && total / 1000 < 1.3);
  assert.ok(titles.size >= 10);
});
