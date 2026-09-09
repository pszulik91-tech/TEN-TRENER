import test from "node:test";
import assert from "node:assert/strict";
import { VERIFIED_LEAGUE_PACKS } from "../app/league-catalog.mjs";
import { createWorldSnapshot, evolveWorldSnapshot, simulateWorldToDate } from "../lib/world-engine.mjs";

const baselines = { 1: 76, 2: 69, 3: 63, 4: 58, 5: 54, 6: 50, 7: 46, 8: 42, 9: 38, 10: 34 };

test("pozostałe rozgrywki świata wykonują własne kolejki do daty kariery", () => {
  const packs = VERIFIED_LEAGUE_PACKS.slice(0, 8);
  const created = createWorldSnapshot(packs, packs[0].id, 2026, 77123, baselines);
  const simulated = simulateWorldToDate(created.world, "2027-06-20", created.seed);
  assert.equal(simulated.world.competitions.length, packs.length - 1);
  for (const competition of simulated.world.competitions) {
    assert.equal(competition.currentRound, competition.totalRounds);
    const expectedPlayed = (competition.teams.length - 1) * 2;
    assert.ok(competition.teams.every((team) => team.played === expectedPlayed));
    assert.equal(competition.teams.reduce((sum, team) => sum + team.gf, 0), competition.teams.reduce((sum, team) => sum + team.ga, 0));
    assert.ok(competition.teams.every((team) => team.won + team.drawn + team.lost === team.played));
    assert.ok(competition.teams.every((team) => Object.values(team).filter((value) => typeof value === "number").every(Number.isFinite)));
  }
});

test("świat AI jest deterministyczny, a nowy sezon zachowuje pamięć i zmienia siłę", () => {
  const packs = VERIFIED_LEAGUE_PACKS.slice(0, 5);
  const first = createWorldSnapshot(packs, "brak", 2026, 9911, baselines);
  const a = simulateWorldToDate(first.world, "2027-06-20", first.seed);
  const second = createWorldSnapshot(packs, "brak", 2026, 9911, baselines);
  const b = simulateWorldToDate(second.world, "2027-06-20", second.seed);
  assert.deepEqual(a, b);
  const evolved = evolveWorldSnapshot(a.world, packs, "brak", 2027, a.seed, baselines);
  assert.ok(evolved.world.competitions.every((competition) => competition.currentRound === 0));
  const previousOvr = new Map(a.world.competitions.flatMap((competition) => competition.teams.map((team) => [`${competition.id}:${team.name}`, team.ovr])));
  const changes = evolved.world.competitions.flatMap((competition) => competition.teams.map((team) => previousOvr.get(`${competition.id}:${team.name}`) !== team.ovr));
  assert.ok(changes.some(Boolean));
});
