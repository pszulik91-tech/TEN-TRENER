import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const screens = readFileSync(new URL("../app/game-screens.tsx", import.meta.url), "utf8");
const gameplay = readFileSync(new URL("../app/gameplay-screens.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("mecz ma osobno przewijane wydarzenia, stały wynik i dok sterowania", () => {
  assert.match(screens, /match-scoreboard/);
  assert.match(screens, /match-action-dock/);
  assert.match(css, /\.match-control-room \.events[^}]*overflow-y:\s*auto/s);
  assert.match(css, /\.match-action-dock/);
});

test("pulpit używa krótkich okien, a raport nie wydłuża strony", () => {
  assert.match(screens, /desk-tabs/);
  assert.match(screens, /Rywal pod lupą/);
  assert.match(gameplay, /post-match-window-backdrop/);
  assert.doesNotMatch(gameplay, /<PostMatchReport game=\{props\.game\} compact \/><Dashboard/);
});

test("wieloletnia historia ma filtry i paginację", () => {
  assert.match(screens, /function CareerArchive/);
  assert.match(screens, /pageSize = 6/);
  assert.match(screens, /archive-pager/);
});
