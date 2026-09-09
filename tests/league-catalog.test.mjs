import test from "node:test";
import assert from "node:assert/strict";
import { LEAGUE_CATALOG_STATS, regionalTier, VERIFIED_LEAGUE_PACKS, V_LEAGUE_ASSOCIATIONS } from "../app/league-catalog.mjs";

test("snapshot 2026/27 ma pełne ligi centralne i cztery grupy III ligi", () => {
  for (const id of ["ekstraklasa", "pierwsza-liga", "druga-liga"]) assert.equal(VERIFIED_LEAGUE_PACKS.find((pack) => pack.id === id)?.teams.length, 18, id);
  const thirdLeague = VERIFIED_LEAGUE_PACKS.filter((pack) => pack.competition === "III liga");
  assert.equal(thirdLeague.length, 4);
  assert.ok(thirdLeague.every((pack) => pack.teams.length === 18));
});

test("każdy z 16 WZPN ma własną IV ligę z rzeczywistymi nazwami klubów", () => {
  const fourthLeague = VERIFIED_LEAGUE_PACKS.filter((pack) => pack.competition === "IV liga");
  assert.equal(fourthLeague.length, 16);
  assert.equal(new Set(fourthLeague.map((pack) => pack.association)).size, 16);
  for (const pack of fourthLeague) {
    assert.ok(pack.teams.length >= 14 && pack.teams.length <= 18, `${pack.id}: ${pack.teams.length}`);
    assert.equal(new Set(pack.teams).size, pack.teams.length, `${pack.id}: duplikat`);
    assert.ok(pack.teams.every((name) => !/(Klub|Team|Drużyna) #?\d/i.test(name)), pack.id);
  }
});

test("V liga ma wszystkie dziewięć rzeczywistych grup sezonu 2026/27", () => {
  const groups = VERIFIED_LEAGUE_PACKS.filter((pack) => pack.competition === "V liga");
  const counts = Object.fromEntries(V_LEAGUE_ASSOCIATIONS.map((association) => [association, groups.filter((pack) => pack.association === association).length]));
  assert.deepEqual(counts, {
    "Małopolski ZPN": 2,
    "Mazowiecki ZPN": 2,
    "Śląski ZPN": 2,
    "Wielkopolski ZPN": 3,
  });
  assert.equal(groups.length, 9);
  assert.ok(groups.every((pack) => pack.teams.length === 16));
  assert.equal(groups.some((pack) => pack.association === "Podkarpacki ZPN"), false);
});

test("poziomy regionalne nie są zaszyte jako jedna drabina dla całej Polski", () => {
  assert.deepEqual(V_LEAGUE_ASSOCIATIONS.sort(), ["Małopolski ZPN", "Mazowiecki ZPN", "Śląski ZPN", "Wielkopolski ZPN"].sort());
  assert.equal(regionalTier("Podkarpacki ZPN", "Klasa okręgowa"), 6);
  assert.equal(regionalTier("Podkarpacki ZPN", "Klasa A"), 7);
  assert.equal(regionalTier("Podkarpacki ZPN", "Klasa B"), 8);
  assert.equal(regionalTier("Śląski ZPN", "Klasa okręgowa"), 7);
  assert.equal(regionalTier("Śląski ZPN", "Klasa A"), 8);
  assert.equal(regionalTier("Śląski ZPN", "Klasa B"), 9);
});

test("testowane okręgi Jarosław, Krosno i Rybnik mają pełne aktualne grupy", () => {
  const find = (association, competition, group) => VERIFIED_LEAGUE_PACKS.find((pack) => pack.association === association && pack.competition === competition && pack.group === group);
  assert.equal(find("Podkarpacki ZPN", "Klasa okręgowa", "Jarosław")?.teams.length, 16);
  assert.equal(find("Podkarpacki ZPN", "Klasa A", "Krosno II")?.teams.length, 15);
  assert.equal(find("Podkarpacki ZPN", "Klasa A", "Jarosław I")?.teams.length, 14);
  assert.equal(find("Podkarpacki ZPN", "Klasa B", "Jarosław")?.teams.length, 14);
  assert.equal(find("Śląski ZPN", "Klasa okręgowa", "śląska III (Racibórz-Rybnik)")?.teams.length, 16);
  assert.equal(find("Śląski ZPN", "Klasa A", "Rybnik I")?.teams.length, 12);
  assert.equal(find("Śląski ZPN", "Klasa A", "Rybnik II")?.teams.length, 12);
});

test("pakiety nie mają zduplikowanych identyfikatorów ani drużyn wewnątrz grup", () => {
  assert.equal(new Set(VERIFIED_LEAGUE_PACKS.map((pack) => pack.id)).size, VERIFIED_LEAGUE_PACKS.length);
  for (const pack of VERIFIED_LEAGUE_PACKS) assert.equal(new Set(pack.teams).size, pack.teams.length, pack.id);
});

test("pełny katalog regionalny obejmuje wszystkie 16 WZPN i najniższe klasy", () => {
  assert.deepEqual(LEAGUE_CATALOG_STATS, { associations: 16, groups: 407, teams: 5517 });
  const regional = VERIFIED_LEAGUE_PACKS.filter((pack) => pack.tier > 4);
  const associations = [...new Set(regional.map((pack) => pack.association))];
  assert.equal(associations.length, 16);
  for (const association of associations) {
    assert.ok(regional.some((pack) => pack.association === association && pack.competition === "IV liga"), `${association}: brak IV ligi`);
    assert.ok(regional.some((pack) => pack.association === association && pack.competition === "Klasa A"), `${association}: brak Klasy A`);
    assert.ok(regional.some((pack) => pack.association === association && pack.competition !== "IV liga"), `${association}: brak lig niższych`);
  }
  assert.equal(VERIFIED_LEAGUE_PACKS.filter((pack) => pack.competition === "Klasa okręgowa").length, 60);
  assert.equal(VERIFIED_LEAGUE_PACKS.filter((pack) => pack.competition === "Klasa A").length, 127);
  assert.equal(VERIFIED_LEAGUE_PACKS.filter((pack) => pack.competition === "Klasa B").length, 185);
  assert.equal(VERIFIED_LEAGUE_PACKS.filter((pack) => pack.competition === "Klasa C").length, 3);
});

test("każda zaimportowana grupa ma hierarchię, źródło i prawdziwe nazwy", () => {
  for (const pack of VERIFIED_LEAGUE_PACKS) {
    assert.ok(pack.association && pack.district && pack.competition && pack.group, pack.id);
    assert.ok(pack.teams.length >= 4, `${pack.id}: tylko ${pack.teams.length} drużyn`);
    assert.ok(pack.teams.every((name) => !/(Klub|Team|Drużyna) #?\d/i.test(name)), pack.id);
    assert.ok(pack.source, `${pack.id}: brak źródła`);
  }
});
