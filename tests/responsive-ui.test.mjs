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

test("Kadra i Taktyka mają odrębny układ telefonu oraz komputera", async () => {
  const [css, source] = await Promise.all([
    readFile(new URL("app/globals.css", root), "utf8"),
    readFile(new URL("app/gameplay-screens.tsx", root), "utf8"),
  ]);
  assert.match(css, /@media \(max-width: 639px\)/);
  assert.match(css, /@media \(min-width: 960px\)/);
  assert.match(css, /\.squad-mobile-list\s*\{\s*display:\s*none/);
  assert.match(css, /\.squad-desktop-list\s*\{\s*display:\s*block/);
  assert.match(css, /\.tactics-workspace\s*\{\s*grid-template-columns:/);
  assert.match(source, /squad-player-card/);
  assert.match(source, /squad-table-row/);
  assert.match(source, /Dotknij pozycji/);
});

test("raport pomeczowy pokazuje wynik, kondycję i konsekwencje", async () => {
  const source = await readFile(new URL("app/gameplay-screens.tsx", root), "utf8");
  for (const label of ["RAPORT POMECZOWY", "Kondycja XI", "Presja zarządu", "Wypalenie", "CO ZADZIAŁAŁO", "CO POPRAWIĆ"]) {
    assert.ok(source.includes(label), label);
  }
});
