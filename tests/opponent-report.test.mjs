import test from "node:test";
import assert from "node:assert/strict";
import { opponentDossier } from "../app/opponent-report.ts";

const own = { id: "own", ovr: 50 };
const game = { club: { id: "own", tier: 10 }, teams: [own], season: "2026/27", round: 1 };
const rival = { id: "rival", name: "Rywal", ovr: 55, played: 3, won: 2, drawn: 1, lost: 0, points: 7, gf: 6, ga: 2, fatigue: 24, lastFive: ["win", "draw", "win"] };

test("raport zawiera wyłącznie cztery fakty z danych rywala i jedno zalecenie", () => {
  const report = opponentDossier(game, rival);
  assert.deepEqual(report.facts.map(f => f.value), [
    "OVR rywala: 55; nasz OVR: 50.", "7 pkt / 3 meczów; bramki 6:2.",
    "W–R–W (W: wygrana, R: remis, P: porażka).", "Zmęczenie rywala: 24/100."
  ]);
  assert.deepEqual(Object.keys(report), ["facts", "recommendation", "reason"]);
  assert.equal(report.recommendation, "Wybierz plan Najsilniejsza XI.");
  assert.match(report.reason, /OVR 55, a my 50.*przekracza 2/);
});

test("raport reaguje na rzeczywiste dane, a uzasadnienie odpowiada porównaniu", () => {
  for (const ovr of [45, 50, 52, 53, 60]) {
    const report = opponentDossier(game, { ...rival, ovr, points: 0, played: 0, gf: 0, ga: 0, fatigue: 60, lastFive: [] });
    assert.equal(report.recommendation, ovr > 52 ? "Wybierz plan Najsilniejsza XI." : "Zacznij ze zrównoważoną mentalnością.");
    assert.ok(report.reason.includes(`OVR ${ovr}, a my 50`));
    assert.equal(report.facts[1].value, "0 pkt / 0 meczów; bramki 0:0.");
    assert.equal(report.facts[2].value, "Brak zapisanych ostatnich wyników.");
    assert.equal(report.facts[3].value, "Zmęczenie rywala: 60/100.");
  }
});

test("raport jest deterministyczny i niezależny od hasha ID, kolejki i poziomu ligi", () => {
  const before = structuredClone({ game, rival });
  const report = opponentDossier(game, rival);
  assert.deepEqual(opponentDossier(game, rival), report);
  assert.deepEqual(opponentDossier({ ...game, round: 20, season: "2030/31", club: { ...game.club, tier: 1 } }, { ...rival, id: "other", name: "Inny" }), report);
  assert.deepEqual({ game, rival }, before);
});

test("brak danych nie jest zastępowany wymyślonym stanem ani obserwacją", () => {
  const report = opponentDossier({ ...game, teams: [] }, { ...rival, fatigue: undefined, lastFive: undefined });
  assert.equal(report.facts[0].value, "OVR rywala: 55; nasz OVR: brak danych.");
  assert.equal(report.facts[3].value, "Brak danych o zmęczeniu rywala.");
  assert.match(report.reason, /Brak naszego OVR/);
  assert.equal(report.recommendation, "Zacznij ze zrównoważoną mentalnością.");
});
