import test from "node:test";
import assert from "node:assert/strict";
import { languageBankStats, matchPhrase, phrase } from "../lib/game-language.mjs";

test("język meczu i raportów ma szeroki bank, ale pozostaje deterministyczny", () => {
  const stats = languageBankStats();
  assert.ok(stats.match >= 75, `za mały bank meczu: ${stats.match}`);
  assert.ok(stats.report >= 35, `za mały bank raportu: ${stats.report}`);
  assert.equal(matchPhrase("goal", "home", "save-12-48", "Orzeł"), matchPhrase("goal", "home", "save-12-48", "Orzeł"));
  assert.match(matchPhrase("goal", "home", "save-12-48", "Orzeł"), /Orzeł/);
});

test("różne seedy wykorzystują wiele wariantów narracji", () => {
  const goals = new Set(Array.from({ length: 100 }, (_, index) => matchPhrase("goal", "home", `seed-${index}`, "Klub")));
  const reports = new Set(Array.from({ length: 100 }, (_, index) => phrase(`report-${index}`, "conditionBad", { value: 64 })));
  assert.ok(goals.size >= 10);
  assert.ok(reports.size >= 4);
});
