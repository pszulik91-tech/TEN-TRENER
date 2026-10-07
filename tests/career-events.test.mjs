import test from "node:test";
import assert from "node:assert/strict";
import { EVENT_POOL, generateRoundIssues, previewIssueEffects, resolveIssueEffects, welcomeIssue } from "../lib/career-events.mjs";

function utilitySigns(effects) {
  const values = [];
  for (const [key, value] of Object.entries(effects)) {
    if (key === "pressures") values.push(...Object.values(value).map((item) => -item));
    else if (key === "burnout" || key === "teamFatigue") values.push(-value);
    else values.push(value);
  }
  return { upside: values.some((value) => value > 0), downside: values.some((value) => value < 0) };
}

test("katalog ma ponad 40 problemów, szerokie kategorie i wybory bez darmowej odpowiedzi", () => {
  assert.ok(EVENT_POOL.length >= 40);
  assert.ok(new Set(EVENT_POOL.map((event) => event.category)).size >= 20);
  assert.equal(new Set(EVENT_POOL.map((event) => event.id)).size, EVENT_POOL.length);
  assert.equal(new Set(EVENT_POOL.map((event) => event.title)).size, EVENT_POOL.length);
  for (const event of EVENT_POOL) {
    assert.ok(event.from >= 1 && event.to <= 10 && event.from <= event.to, event.title);
    assert.equal(event.choices.length, 3, event.title);
    assert.equal(new Set(event.choices.map((choice) => choice.label)).size, 3, event.title);
    for (const choice of event.choices) {
      assert.ok(choice.feedback.length > 35, `${event.title}: ${choice.label}`);
      assert.ok(Object.keys(choice.effects).length > 0, `${event.title}: ${choice.label}`);
      const signs = utilitySigns(choice.effects);
      assert.ok(signs.upside && signs.downside, `wybór bez kompromisu: ${event.title} / ${choice.label}`);
    }
  }
});

test("powitanie ma sensowną odpowiedź zamiast karania nieistniejącego zawodnika", () => {
  const issue = welcomeIssue("Klub Test", "Piotr", "utrzymania", "futbol społecznościowy", "zbierasz dostępnych");
  assert.equal(issue.choices.length, 1);
  assert.match(issue.choices[0].label, /odpowiedzialność/i);
  assert.doesNotMatch(issue.choices[0].label, /kar|zawodnik/i);
});

function simulateIssues(initialSeed, tier, result = "draw", rounds = 30) {
  let seed = initialSeed; const recentTitles = []; const recentCategories = []; const all = [];
  for (let round = 1; round <= rounds; round += 1) {
    const batch = generateRoundIssues({ seed, round, tier, result, worldHumor: 72, recentTitles, recentCategories });
    seed = batch.seed;
    for (const event of batch.events) {
      assert.ok(!recentTitles.slice(0, 8).includes(event.title), `powtórka przed upływem 8 spraw: ${event.title}`);
      assert.ok(!recentCategories.slice(0, 2).includes(event.category), `powtórzona kategoria: ${event.category}`);
      recentTitles.unshift(event.title); recentCategories.unshift(event.category); all.push(event);
    }
  }
  return { seed, all };
}

test("sekwencja jest deterministyczna i nie mieli tych samych tematów", () => {
  const first = simulateIssues(202627, 9);
  const second = simulateIssues(202627, 9);
  assert.deepEqual(first, second);
  assert.ok(first.all.length >= 17 && first.all.length <= 36);
  assert.ok(new Set(first.all.map((event) => event.title)).size >= 14);
  assert.ok(new Set(first.all.flatMap((event) => event.choices.map((choice) => choice.label))).size >= 40);
});

test("zdarzenia amatorskie i zawodowe mają odrębne środowiska", () => {
  const amateurOnly = EVENT_POOL.filter((event) => event.from >= 6);
  const professionalOnly = EVENT_POOL.filter((event) => event.to <= 5);
  assert.ok(amateurOnly.length >= 10);
  assert.ok(professionalOnly.length >= 8);
  const winOnly = EVENT_POOL.find((event) => event.id === "cup-eligibility");
  assert.deepEqual(winOnly.results, ["win"]);
});

test("Monte Carlo 20 tysięcy kolejek zachowuje rytm pracy i różnorodność", () => {
  let seed = 191212; let total = 0; let doubles = 0; let empty = 0; const titles = new Map(); const recentTitles = []; const recentCategories = [];
  for (let round = 1; round <= 20_000; round += 1) {
    const batch = generateRoundIssues({ seed, round: (round - 1) % 34 + 1, tier: round % 2 ? 2 : 9, result: round % 7 === 1 ? "loss" : round % 3 === 0 ? "win" : "draw", worldHumor: 35, recentTitles, recentCategories });
    seed = batch.seed; assert.ok(batch.events.length >= 0 && batch.events.length <= 2); total += batch.events.length;
    if (!batch.events.length) empty += 1; if (batch.events.length === 2) doubles += 1;
    for (const event of batch.events) {
      assert.ok(!recentTitles.slice(0, 8).includes(event.title));
      assert.ok(!recentCategories.slice(0, 2).includes(event.category));
      titles.set(event.title, (titles.get(event.title) ?? 0) + 1); recentTitles.unshift(event.title); recentCategories.unshift(event.category);
    }
  }
  const average = total / 20_000;
  const topShare = Math.max(...titles.values()) / total;
  assert.ok(average > .78 && average < .98, `średnia ${average}`);
  assert.ok(empty / 20_000 > .15, "gra musi pozostawiać spokojne kolejki");
  assert.ok(doubles / 20_000 < .2, "dwa problemy nie mogą stać się normą");
  assert.ok(titles.size >= 35, `pokryto tylko ${titles.size} tematów`);
  assert.ok(topShare < .08, `jeden temat zdominował pulę: ${topShare}`);
});

test("limit zaległych spraw może zatrzymać nową generację", () => {
  const batch = generateRoundIssues({ seed: 123, round: 10, tier: 9, result: "loss", worldHumor: 80, maxEvents: 0 });
  assert.equal(batch.events.length, 0);
});

test("odpowiedź pokazuje kierunek, a dokładny skutek jest losowany deterministycznie", () => {
  const choice = { teamMorale: 3, teamFatigue: -4, pressures: { dressing: -2, board: 2 }, unavailable: { min: 1, max: 2, rounds: 1, reason: "praca zawodowa" } };
  const preview = previewIssueEffects(choice).join(" • ");
  assert.match(preview, /morale.*wzrost/i);
  assert.match(preview, /zmęczenie.*spadek/i);
  assert.match(preview, /niedostępni/i);
  const first = resolveIssueEffects(202627, choice);
  const second = resolveIssueEffects(202627, choice);
  assert.deepEqual(first, second);
  assert.ok(first.effects.teamMorale >= 2 && first.effects.teamMorale <= 4);
  assert.ok(first.effects.unavailable.count >= 1 && first.effects.unavailable.count <= 2);
});
