import test from "node:test";
import assert from "node:assert/strict";
import { languageBankStats } from "../lib/game-language.mjs";
import { generateMatchMoments, matchMomentCount, matchMomentStats, resolveMatchMoment } from "../lib/match-moments.mjs";
import { trainingTacticSynergy } from "../lib/game-rules.mjs";
import fs from "node:fs";

test("mecz generuje deterministycznie 2–5 reakcji zależnie od stawki", () => {
  assert.equal(matchMomentCount({ tier: 9, round: 2, totalRounds: 22, pressure: 20, strengthGap: 5 }), 2);
  assert.equal(matchMomentCount({ tier: 1, round: 34, totalRounds: 34, pressure: 82, strengthGap: 0 }), 5);
  const a = generateMatchMoments(12345, { tier: 3, round: 31, totalRounds: 34, pressure: 60, strengthGap: 1 }); const b = generateMatchMoments(12345, { tier: 3, round: 31, totalRounds: 34, pressure: 60, strengthGap: 1 });
  assert.deepEqual(a, b); assert.ok(a.moments.length >= 2 && a.moments.length <= 5); assert.ok(matchMomentStats().scenarios >= 36);
  const resolved = resolveMatchMoment(a.seed, a.moments[0], a.moments[0].choices[0].id); assert.ok(Number.isFinite(resolved.strength)); assert.match(resolved.verdict, /Reakcja|Korekta|Ryzyko/);
});

test("trening i taktyka mają premię za zgodność oraz karę za brak przygotowania", () => {
  const tactic = { pressing: "Wysoki", buildUp: "Krótkie" };
  const matched = trainingTacticSynergy([{ focus: "Pressing", intensity: "Normalna" }, { focus: "Taktyka", intensity: "Normalna" }], tactic, "PRESS");
  const mismatched = trainingTacticSynergy([{ focus: "Atmosfera", intensity: "Normalna" }, { focus: "Finalizacja", intensity: "Normalna" }], tactic, "PRESS");
  assert.ok(matched.shortTerm > mismatched.shortTerm); assert.ok(mismatched.shortTerm < 0);
});

test("bank meczu przekracza 100 wariantów, a raport jest zamykany w stanie save", () => {
  assert.ok(languageBankStats().match >= 100);
  const gameplay = fs.readFileSync(new URL("../app/gameplay-screens.tsx", import.meta.url), "utf8"); const page = fs.readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(gameplay, /reportSeen/); assert.match(page, /dismissMatchReport/); assert.doesNotMatch(gameplay, /dismissedReport/);
});

test("rynek odróżnia zimową obserwację od formalnej oferty", () => {
  const source = fs.readFileSync(new URL("../app/game-screens.tsx", import.meta.url), "utf8");
  assert.match(source, /OBSERWACJA \/ WAKAT/); assert.match(source, /FORMALNA OFERTA/); assert.match(source, /Zostań w klubie/);
});
