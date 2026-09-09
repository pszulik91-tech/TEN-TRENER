import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("layout deklaruje viewport urządzenia i bezpieczny obszar telefonu", async () => {
  const source = await readFile(new URL("app/layout.tsx", root), "utf8");
  assert.match(source, /width:\s*"device-width"/);
  assert.match(source, /initialScale:\s*1/);
  assert.match(source, /viewportFit:\s*"cover"/);
});

test("plan drużyny zastępuje ręczną listę i układa się responsywnie", async () => {
  const [css, source] = await Promise.all([
    readFile(new URL("app/globals.css", root), "utf8"),
    readFile(new URL("app/gameplay-screens.tsx", root), "utf8"),
  ]);
  assert.match(css, /@media \(max-width: 639px\)/);
  assert.match(css, /@media \(min-width: 960px\)/);
  assert.match(css, /\.team-plan-layout\s*\{[^}]*grid-template-columns:/s);
  assert.match(css, /\.team-plan-grid\s*\{[^}]*grid-template-columns:/s);
  assert.match(source, /team-plan-card/);
  assert.match(source, /Wybierasz pomysł, sztab układa ludzi/);
  assert.match(source, /XI dopasowana automatycznie/);
  assert.doesNotMatch(source, /squad-player-card|squad-table-row|Dotknij pozycji/);
});

test("telefon ma jedną główną ścieżkę Drużyna → Trening → Mecz", async () => {
  const source = await readFile(new URL("app/game-screens.tsx", root), "utf8");
  assert.match(source, /label: "Drużyna"/);
  assert.match(source, /label: "Trening"/);
  assert.match(source, /label: "Mecz"/);
  assert.doesNotMatch(source.match(/const MOBILE_NAV_ITEMS[\s\S]*?\];/)?.[0] ?? "", /label: "Taktyka"/);
});

test("raport pomeczowy pokazuje wynik, kondycję i konsekwencje", async () => {
  const source = await readFile(new URL("app/gameplay-screens.tsx", root), "utf8");
  for (const label of ["RAPORT POMECZOWY", "Kondycja XI", "Presja zarządu", "Wypalenie", "CO ZADZIAŁAŁO", "CO POPRAWIĆ"]) {
    assert.ok(source.includes(label), label);
  }
});
