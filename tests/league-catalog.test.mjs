import test from "node:test";
import assert from "node:assert/strict";
import { regionalTier, VERIFIED_LEAGUE_PACKS, V_LEAGUE_ASSOCIATIONS } from "../app/league-catalog.mjs";

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
  const byId = Object.fromEntries(VERIFIED_LEAGUE_PACKS.map((pack) => [pack.id, pack]));
  assert.equal(byId["podkarpacka-okregowa-jaroslaw"].teams.length, 16);
  assert.equal(byId["podkarpacka-a-krosno-ii"].teams.length, 15);
  assert.equal(byId["podkarpacka-a-jaroslaw"].teams.length, 14);
  assert.equal(byId["podkarpacka-b-jaroslaw"].teams.length, 14);
  assert.equal(byId["slaska-okregowa-rybnik-raciborz"].teams.length, 16);
  assert.equal(byId["slaska-a-rybnik-i"].teams.length, 12);
  assert.equal(byId["slaska-a-rybnik-ii"].teams.length, 12);
});

test("pakiety nie mają zduplikowanych identyfikatorów ani drużyn wewnątrz grup", () => {
  assert.equal(new Set(VERIFIED_LEAGUE_PACKS.map((pack) => pack.id)).size, VERIFIED_LEAGUE_PACKS.length);
  for (const pack of VERIFIED_LEAGUE_PACKS) assert.equal(new Set(pack.teams).size, pack.teams.length, pack.id);
  const entries = VERIFIED_LEAGUE_PACKS.flatMap((pack) => pack.teams.map((team) => [team, pack.id]));
  const locations = new Map();
  for (const [team, packId] of entries) locations.set(team, [...(locations.get(team) ?? []), packId]);
  assert.deepEqual([...locations].filter(([, packIds]) => packIds.length > 1), []);
});
