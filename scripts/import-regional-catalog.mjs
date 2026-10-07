import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";

const run = promisify(execFile);
const snapshotDate = "20260909";
const seasonPath = `2026/2027/${snapshotDate}`;
const base = "https://regiowyniki.pl";
const output = new URL("../app/regional-catalog.generated.mjs", import.meta.url);
const cacheDirectory = "/tmp/ten-trener-regional-2026-27";

const regions = {
  Dolnoslaskie: "Dolnośląski ZPN",
  "Kujawsko-Pomorskie": "Kujawsko-Pomorski ZPN",
  Lubelskie: "Lubelski ZPN",
  Lubuskie: "Lubuski ZPN",
  Lodzkie: "Łódzki ZPN",
  Malopolskie: "Małopolski ZPN",
  Mazowieckie: "Mazowiecki ZPN",
  Opolskie: "Opolski ZPN",
  Podkarpackie: "Podkarpacki ZPN",
  Podlaskie: "Podlaski ZPN",
  Pomorskie: "Pomorski ZPN",
  Slaskie: "Śląski ZPN",
  Swietokrzyskie: "Świętokrzyski ZPN",
  "Warminsko-Mazurskie": "Warmińsko-Mazurski ZPN",
  Wielkopolskie: "Wielkopolski ZPN",
  Zachodniopomorskie: "Zachodniopomorski ZPN",
};

const competitions = {
  "4_Liga": "IV liga",
  Superscore_IV_Liga: "IV liga",
  "5_Liga": "V liga",
  Klasa_okregowa: "Klasa okręgowa",
  Liga_okregowa: "Klasa okręgowa",
  Klasa_A: "Klasa A",
  Klasa_B: "Klasa B",
  Klasa_C: "Klasa C",
};

const vLeagueAssociations = new Set(["Małopolski ZPN", "Mazowiecki ZPN", "Śląski ZPN", "Wielkopolski ZPN"]);
const competitionOrder = ["IV liga", "V liga", "Klasa okręgowa", "Klasa A", "Klasa B", "Klasa C"];

function regionalTier(association, competition) {
  if (competition === "IV liga") return 5;
  if (competition === "V liga") return 6;
  const tier = { "Klasa okręgowa": 6, "Klasa A": 7, "Klasa B": 8, "Klasa C": 9 }[competition] ?? 10;
  return tier + (vLeagueAssociations.has(association) ? 1 : 0);
}

function decodeHtml(value) {
  const named = { amp: "&", quot: '"', apos: "'", nbsp: " ", lt: "<", gt: ">" };
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (_, entity) => {
      if (entity[0] !== "#") return named[entity.toLowerCase()] ?? `&${entity};`;
      const hexadecimal = entity[1].toLowerCase() === "x";
      return String.fromCodePoint(Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10));
    })
    .replace(/\s+/g, " ")
    .trim();
}

function anchors(html) {
  return [...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((match) => ({ href: match[1], text: decodeHtml(match[2]) }));
}

async function fetchPage(url) {
  const { stdout } = await run("curl", ["-L", "--fail", "--silent", "--show-error", "--retry", "2", "--max-time", "45", url], { maxBuffer: 12 * 1024 * 1024 });
  return stdout;
}

async function mapPool(items, concurrency, callback) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await callback(items[index], index);
    }
  }));
  return results;
}

function slug(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function districtFor(competition, group) {
  if (["IV liga", "V liga"].includes(competition)) return "województwo";
  return group
    .replace(/^grupa\s+/i, "")
    .replace(/\s+(?:grupa\s+)?(?:[IVXLCDM]+|\d+)$/i, "")
    .replace(/\s+(?:wschodnia|zachodnia|północna|południowa)$/i, "")
    .trim() || "województwo";
}

async function discoverGroups(region) {
  const root = `/wyniki/Pilka_Nozna/${seasonPath}/mecze/${region}/`;
  const html = await fetchPage(`${base}${root}`);
  const pattern = new RegExp(`^${root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^/]+)/([^/]+)/$`);
  const found = new Map();
  for (const anchor of anchors(html)) {
    const match = anchor.href.match(pattern);
    if (!match || !competitions[match[1]]) continue;
    found.set(anchor.href, { region, path: anchor.href, competitionSlug: match[1], groupSlug: match[2] });
  }
  return [...found.values()];
}

async function importGroup(item) {
  const calendarPath = item.path.replace(`/wyniki/Pilka_Nozna/${seasonPath}/mecze/`, "/kalendarz/Pilka_Nozna/2026/2027/");
  const html = await fetchPage(`${base}${calendarPath}`);
  const title = decodeHtml(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const titleParts = title.split("|").map((part) => part.trim());
  const competition = competitions[item.competitionSlug];
  const association = regions[item.region];
  const group = titleParts[3] && !/wyniki na żywo/i.test(titleParts[3]) ? titleParts[3] : item.groupSlug.replaceAll("_", " ");
  const teamPathEnd = `/${item.groupSlug}/`;
  const teams = [...new Set(anchors(html)
    .filter((anchor) => anchor.text && anchor.href.startsWith(`/druzyna/Pilka_Nozna/${item.region}/`) && anchor.href.endsWith(teamPathEnd))
    .map((anchor) => anchor.text))];
  if (teams.length < 4) throw new Error(`${association} / ${competition} / ${group} (${calendarPath}): znaleziono tylko ${teams.length} drużyn`);
  return {
    id: `regional-${slug(association)}-${slug(competition)}-${slug(group)}`,
    association,
    district: districtFor(competition, group),
    competition,
    group,
    tier: regionalTier(association, competition),
    teams,
    source: "RegioWyniki / WZPN — snapshot 2026/27 (09.09.2026)",
  };
}

await mkdir(cacheDirectory, { recursive: true });
const argumentsList = process.argv.slice(2);
const selectedRegions = argumentsList.filter((argument) => regions[argument]);
const regionSlugs = selectedRegions.length ? selectedRegions : Object.keys(regions);

if (argumentsList.includes("--list-competition-slugs")) {
  const rows = await mapPool(regionSlugs, 16, async (region) => {
    const root = `/wyniki/Pilka_Nozna/${seasonPath}/mecze/${region}/`;
    const html = await fetchPage(`${base}${root}`);
    const pattern = new RegExp(`^${root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^/]+)/([^/]+)/$`);
    return { region, slugs: [...new Set(anchors(html).map((anchor) => anchor.href.match(pattern)?.[1]).filter(Boolean))].sort() };
  });
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

if (!argumentsList.includes("--merge")) {
  await mapPool(regionSlugs, Math.min(3, regionSlugs.length), async (region) => {
    const discovered = await discoverGroups(region);
    const packs = await mapPool(discovered, Math.min(24, discovered.length), importGroup);
    await writeFile(`${cacheDirectory}/${region}.json`, JSON.stringify(packs), "utf8");
    console.log(`${region}: ${packs.length} grup`);
  });
}

const imported = [];
for (const region of Object.keys(regions)) {
  try { imported.push(...JSON.parse(await readFile(`${cacheDirectory}/${region}.json`, "utf8"))); }
  catch { /* fragment zostanie pobrany przy następnym uruchomieniu */ }
}
if (new Set(imported.map((pack) => pack.association)).size !== Object.keys(regions).length) {
  console.log(JSON.stringify({ cachedAssociations: new Set(imported.map((pack) => pack.association)).size, expectedAssociations: Object.keys(regions).length }, null, 2));
  process.exit(2);
}

const packs = imported.sort((a, b) => competitionOrder.indexOf(a.competition) - competitionOrder.indexOf(b.competition)
  || a.association.localeCompare(b.association, "pl") || a.group.localeCompare(b.group, "pl"));

const duplicateIds = packs.filter((pack, index) => packs.findIndex((candidate) => candidate.id === pack.id) !== index);
if (duplicateIds.length) throw new Error(`Zduplikowane identyfikatory: ${duplicateIds.map((pack) => pack.id).join(", ")}`);

const content = `// Wygenerowano z publicznego katalogu rozgrywek 2026/27.\n// Nie edytuj ręcznie — uruchom npm run import:regional.\nexport const GENERATED_REGIONAL_PACKS = ${JSON.stringify(packs, null, 2)};\n`;
await writeFile(output, content, "utf8");

const teams = packs.reduce((sum, pack) => sum + pack.teams.length, 0);
const byCompetition = Object.fromEntries(competitionOrder.map((competition) => [competition, packs.filter((pack) => pack.competition === competition).length]));
console.log(JSON.stringify({ snapshotDate, groups: packs.length, teams, byCompetition }, null, 2));
