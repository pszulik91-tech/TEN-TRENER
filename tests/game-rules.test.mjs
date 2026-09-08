import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSchedule, capReadiness, effectiveOVR, environmentIncidentOccurs, liveBreakdown, liveOVR, normalizeStartingLicense,
  POLICY_EFFECTS, positionPenalty, pressureDeltaForResult, resolveProfileScores, selectBestLineup, simulateMatchPlan, sortedTable, updateTeamResult,
} from "../lib/game-rules.mjs";

const player = (id, primary, baseOVR = 50, secondary = []) => ({ id, primary, secondary, baseOVR, form: 50, morale: 50, fatigue: 10, relation: 50 });

test("Live OVR opisuje dyspozycję, a kara pozycyjna jest osobnym efektem XI", () => {
  const restedWinner = { ...player("p", "ŚO"), form: 53, morale: 62, fatigue: 22, relation: 55 };
  assert.ok(liveOVR(restedWinner) >= restedWinner.baseOVR);
  assert.equal(liveOVR(restedWinner), liveOVR({ ...restedWinner, primary: "BR" }));
  assert.ok(effectiveOVR(restedWinner, "N") < liveOVR(restedWinner));
  assert.ok(liveBreakdown({ ...restedWinner, fatigue: 100 }).total >= -0.2);
  assert.ok(liveBreakdown({ ...restedWinner, form: 100, morale: 100, relation: 100, fatigue: 0 }).total <= 0.14);
});

test("kary pozycyjne mają realistyczną skalę", () => {
  assert.equal(positionPenalty(player("gk", "BR"), "N"), 0.45);
  assert.equal(positionPenalty(player("cb", "ŚO"), "LO"), 0.09);
  assert.equal(positionPenalty(player("cb2", "ŚO", 50, ["LO"]), "LO"), 0.04);
  assert.equal(positionPenalty(player("lb", "LO"), "LO"), 0);
});

test("Najlepsza XI jest unikalna i wybiera specjalistów pozycji przed samym OVR", () => {
  const slots = ["BR", "PO", "ŚO-L", "ŚO-P", "LO", "PP", "ŚP-P", "ŚP-L", "LP", "N-L", "N-P"];
  const primaries = ["BR", "PO", "ŚO", "ŚO", "LO", "PP", "ŚP", "ŚP", "LP", "N", "N"];
  const players = primaries.map((primary, index) => player(`p${index}`, primary, 40 + index));
  players.push(player("star", "N", 99));
  const assignments = selectBestLineup(players, slots);
  assert.equal(new Set(Object.values(assignments)).size, 11);
  for (const slot of slots) {
    const selected = players.find((item) => item.id === assignments[slot]);
    assert.ok(selected);
    assert.equal(positionPenalty(selected, slot), 0);
  }
});

test("symulacja jest deterministyczna i nie generuje NaN", () => {
  const first = simulateMatchPlan(202627, 52, 48, "A", "B");
  const second = simulateMatchPlan(202627, 52, 48, "A", "B");
  assert.deepEqual(first, second);
  for (const value of [first.homeGoals, first.awayGoals, first.shotsHome, first.shotsAway, first.possessionHome]) assert.ok(Number.isFinite(value) && value >= 0);
});

test("benchmark 5000 meczów: faworyt ma przewagę, ale słabszy nadal wygrywa", () => {
  let favoriteWins = 0; let underdogWins = 0; let draws = 0; let goals = 0;
  for (let seed = 1; seed <= 5000; seed += 1) {
    const match = simulateMatchPlan(seed, 58, 48);
    goals += match.homeGoals + match.awayGoals;
    if (match.homeGoals > match.awayGoals) favoriteWins += 1;
    else if (match.homeGoals < match.awayGoals) underdogWins += 1;
    else draws += 1;
  }
  assert.ok(favoriteWins > underdogWins);
  assert.ok(underdogWins / 5000 > 0.08);
  assert.ok(draws / 5000 > 0.12);
  assert.ok(goals / 5000 > 1.5 && goals / 5000 < 4.2);
});

test("każda polityka kadry ma koszt, jeśli daje premię", () => {
  assert.equal(POLICY_EFFECTS.BALANCED.matchStrength, 0);
  for (const [id, effect] of Object.entries(POLICY_EFFECTS)) {
    if (id !== "BALANCED" && effect.matchStrength > 0) assert.ok(effect.fatigue > 0 || effect.burnout > 0 || effect.morale < 0);
  }
  assert.ok(POLICY_EFFECTS.ROTATION.fatigue < 0 && POLICY_EFFECTS.ROTATION.matchStrength < 0);
});

test("stare licencje migrują do Grassroots C, a wyższy start zwiększa koszt wyniku", () => {
  assert.equal(normalizeStartingLicense("Grassroots D"), "Grassroots C");
  assert.equal(normalizeStartingLicense("UEFA C"), "Grassroots C");
  assert.equal(normalizeStartingLicense("UEFA A"), "UEFA A");
  assert.equal(normalizeStartingLicense("nieznana"), "Grassroots C");
  assert.ok(pressureDeltaForResult("loss", 1.6) > pressureDeltaForResult("loss", 1));
  assert.ok(pressureDeltaForResult("draw", 1.6) > pressureDeltaForResult("draw", 1));
  assert.ok(pressureDeltaForResult("win", 1.6) > pressureDeltaForResult("win", 1));
});

test("środowisko ogranicza gotowość i ma kontrolowane ryzyko absencji", () => {
  assert.equal(capReadiness(80, 8, 82), 82);
  assert.equal(capReadiness(60, 5, 96), 65);
  assert.equal(environmentIncidentOccurs(.05, .16), true);
  assert.equal(environmentIncidentOccurs(.5, .16), false);
  assert.equal(environmentIncidentOccurs(.5, 0), false);
});

test("ankieta przypisuje profil deterministycznie i ignoruje nieznane punkty", () => {
  const profiles = ["Mentor", "Generał", "Hazardzista"];
  const questions = [
    { id: "q1", choices: [{ scores: { Mentor: 3 } }, { scores: { Generał: 3 } }] },
    { id: "q2", choices: [{ scores: { Hazardzista: 4 } }, { scores: { Mentor: 2, Inny: 99 } }] },
  ];
  const answers = { q1: 0, q2: 0 };
  assert.equal(resolveProfileScores(profiles, questions, answers), "Hazardzista");
  assert.equal(resolveProfileScores(profiles, questions, answers), resolveProfileScores(profiles, questions, answers));
  assert.equal(resolveProfileScores(profiles, questions, { q1: 1, q2: 1 }), "Generał");
});

test("pełny sezon ligi zachowuje wszystkie inwarianty tabeli", () => {
  const teams = Array.from({ length: 10 }, (_, index) => ({ id: `t${index}`, name: `Drużyna ${index}`, ovr: 40 + index, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }));
  const fixtures = buildSchedule(teams.map((team) => team.id));
  assert.equal(fixtures.length, 90);
  let table = teams; let seed = 9191;
  for (const fixture of fixtures) {
    const home = table.find((team) => team.id === fixture.home);
    const away = table.find((team) => team.id === fixture.away);
    const match = simulateMatchPlan(seed, home.ovr, away.ovr); seed = match.seed;
    table = updateTeamResult(table, fixture.home, fixture.away, match.homeGoals, match.awayGoals);
  }
  for (const team of table) {
    assert.equal(team.played, 18);
    assert.equal(team.won + team.drawn + team.lost, team.played);
    assert.equal(team.points, team.won * 3 + team.drawn);
    for (const value of Object.values(team).filter((item) => typeof item === "number")) assert.ok(Number.isFinite(value));
  }
  assert.equal(table.reduce((sum, team) => sum + team.gf, 0), table.reduce((sum, team) => sum + team.ga, 0));
  const sorted = sortedTable(table);
  assert.ok(sorted.every((team, index) => index === 0 || sorted[index - 1].points >= team.points));
});
