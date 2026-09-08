import {
  BUILD, DEVELOPMENT_GOALS, FIRST_NAMES, FORMATIONS, GameState, LAST_NAMES,
  LeaguePack, PERSONALITIES, Player, POSITIONS, Position, Team, TIER_OVR,
  buildSchedule, positionPenalty, randomInt, selectBestLineup,
} from "./game-data";
import type { Coach, CoachProfile } from "./game-data";

export function skillSet(profile: CoachProfile, playingExperience: string, coachingExperience: string) {
  const playingBonus = playingExperience === "Reprezentant" ? 10 : playingExperience === "Zawodowiec" ? 7 : playingExperience === "Niższe ligi" ? 3 : 0;
  const coachingBonus = coachingExperience === "Ponad 10 lat" ? 8 : coachingExperience === "4–10 lat" ? 5 : coachingExperience === "1–3 lata" ? 2 : 0;
  const base = 38 + coachingBonus;
  const skills: Record<string, number> = { tactics: base, motivation: base, people: base, analysis: base, pressure: base, adaptability: base, energy: 65, youth: base };
  if (profile === "Mentor") { skills.people += 8; skills.youth += 10; }
  if (profile === "Generał") { skills.motivation += 9; skills.pressure += 5; skills.people -= 5; }
  if (profile === "Taktyczny obsesyjny") { skills.tactics += 12; skills.analysis += 8; skills.energy -= 7; }
  if (profile === "Wynikowiec") { skills.motivation += 7; skills.pressure += 8; skills.youth -= 5; }
  if (profile === "Dyplomata") { skills.people += 10; skills.adaptability += 4; }
  if (profile === "Trener od zapierdolu") { skills.energy += 14; skills.motivation += 6; skills.people -= 4; }
  if (profile === "Hazardzista") { skills.adaptability += 11; skills.tactics += 4; skills.pressure -= 4; }
  if (profile === "Spokojny pragmatyk") { skills.pressure += 11; skills.analysis += 5; skills.energy -= 3; }
  return { skills, reputation: Math.min(45, 8 + playingBonus + Math.round(coachingBonus / 2)) };
}

function makePlayers(seed: number, base: number) {
  const roles: Position[] = ["BR", "BR", "PO", "PO", "ŚO", "ŚO", "ŚO", "ŚO", "LO", "LO", "DP", "DP", "ŚP", "ŚP", "ŚP", "PP", "PP", "ŚPO", "LP", "LP", "N", "N", "N"];
  let nextSeed = seed;
  const players: Player[] = roles.map((primary, index) => {
    const a = randomInt(nextSeed, 0, FIRST_NAMES.length - 1); nextSeed = a.seed;
    const b = randomInt(nextSeed, 0, LAST_NAMES.length - 1); nextSeed = b.seed;
    const age = randomInt(nextSeed, 17, 35); nextSeed = age.seed;
    const quality = randomInt(nextSeed, -6, 6); nextSeed = quality.seed;
    const potential = randomInt(nextSeed, base + 2, Math.min(90, base + 16)); nextSeed = potential.seed;
    const positionalNeighbors = POSITIONS.filter((position) => position !== primary && positionPenalty({ primary, secondary: [] }, position) <= 0.09);
    return { id: `p-${index}-${a.value}-${b.value}`, name: `${FIRST_NAMES[a.value]} ${LAST_NAMES[b.value]}`, age: age.value, primary, secondary: positionalNeighbors.slice(0, index % 3 === 0 ? 2 : 1), baseOVR: Math.max(20, base + quality.value), form: 48 + (index % 7), morale: 58 + (index % 11), fatigue: 8 + (index % 12), relation: 55, potential: potential.value, personality: PERSONALITIES[index % PERSONALITIES.length], status: index < 11 ? "Pierwszy skład" : index < 18 ? "Rotacja" : "Rezerwa" };
  });
  return { players, seed: nextSeed };
}

export function createGame(coach: Coach, pack: LeaguePack, clubName: string, goals: string[]): GameState {
  let seed = Math.abs(Array.from(`${coach.name}-${clubName}`).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 202627)) >>> 0;
  const teams: Team[] = pack.teams.map((name, index) => {
    const quality = randomInt(seed, -4, 4); seed = quality.seed;
    return { id: `team-${index}`, name, ovr: (TIER_OVR[pack.tier] ?? 42) + quality.value, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
  });
  const clubTeam = teams.find((team) => team.name === clubName) ?? teams[0];
  const generated = makePlayers(seed, clubTeam.ovr); seed = generated.seed;
  const assignments = selectBestLineup(generated.players, FORMATIONS["4-2-3-1"]);
  return {
    build: BUILD, seed, coach,
    club: { id: clubTeam.id, name: clubTeam.name, association: pack.association, district: pack.district, competition: pack.competition, group: pack.group, tier: pack.tier },
    season: "2026/27", date: "2026-07-13", round: 1, teams, fixtures: buildSchedule(teams.map((team) => team.id)), players: generated.players,
    tactic: { formation: "4-2-3-1", mentality: "Zrównoważona", tempo: "Normalne", pressing: "Średni", line: "Średnia", width: "Standardowa", buildUp: "Mieszane", passingRisk: "Umiarkowane", assignments },
    training: { focus: "Taktyka", intensity: "Normalna", recovery: true, readiness: 62, completedRound: null }, squadPolicy: "BALANCED",
    pressures: { board: 18, fans: 20, media: 12, dressing: 15, personal: 16 }, burnout: 8,
    president: { ambition: 58, patience: 54, ego: 46, footballKnowledge: 52, financialCaution: 68, fanPressureSensitivity: 55, mediaPressureSensitivity: 41, riskTolerance: 43, localPatriotism: pack.tier >= 7 ? 82 : 55, unpredictability: 28 },
    presidentName: `Prezes ${LAST_NAMES[(seed + 11) % LAST_NAMES.length]}`,
    finances: { monthlySalary: Math.max(1800, 14000 - pack.tier * 1200), personalFunds: 9000 },
    developmentGoals: DEVELOPMENT_GOALS.filter((goal) => goals.includes(goal.id)).map((goal) => ({ ...goal, progress: 0 })),
    history: [`13.07.2026 — ${coach.name} podpisał kontrakt z ${clubName}.`],
    inbox: [{ id: "welcome", title: `Witamy w ${clubName}`, body: `${coach.name.split(" ")[0] || "Trenerze"}, zarząd oczekuje spokojnego wejścia w sezon i miejsca w górnej połowie tabeli. Zakres transferów: SHARED.`, resolved: false }],
  };
}

export function teamForId(game: GameState, id: string) { return game.teams.find((team) => team.id === id); }
export function currentFixture(game: GameState) { return game.fixtures.find((fixture) => fixture.round === game.round && (fixture.home === game.club.id || fixture.away === game.club.id)); }
export function formatDate(value: string) { try { return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00Z`)); } catch { return value; } }
export function pressureLabel(value: number) { return value < 30 ? "niska" : value < 60 ? "odczuwalna" : value < 80 ? "wysoka" : "krytyczna"; }
export function pressureName(key: string) { return ({ board: "Zarząd", fans: "Kibice", media: "Media", dressing: "Szatnia", personal: "Stres osobisty" } as Record<string, string>)[key] ?? key; }
export function skillLabel(key: string) { return ({ tactics: "Taktyka", motivation: "Motywacja", people: "Zarządzanie ludźmi", analysis: "Analiza", pressure: "Odporność na presję", adaptability: "Adaptacyjność", energy: "Energia", youth: "Rozwój młodych" } as Record<string, string>)[key] ?? key; }
export function presidentLabel(key: string) { return ({ ambition: "Ambicja", patience: "Cierpliwość", ego: "Ego", footballKnowledge: "Wiedza piłkarska", financialCaution: "Ostrożność finansowa", fanPressureSensitivity: "Wrażliwość na kibiców", mediaPressureSensitivity: "Wrażliwość na media", riskTolerance: "Tolerancja ryzyka", localPatriotism: "Lokalny patriotyzm", unpredictability: "Nieprzewidywalność" } as Record<string, string>)[key] ?? key; }
