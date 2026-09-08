import {
  BUILD, DEVELOPMENT_GOALS, FIRST_NAMES, FORMATIONS, GameState, LAST_NAMES,
  LeaguePack, LICENSE_CHALLENGES, PERSONALITIES, Player, POSITIONS, Position, Team, TIER_OVR,
  buildSchedule, positionPenalty, randomInt, selectBestLineup,
  environmentForTier, environmentIncidentOccurs,
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
  const environment = environmentForTier(pack.tier);
  const careerChallenge = LICENSE_CHALLENGES[coach.license];
  const teams: Team[] = pack.teams.map((name, index) => {
    const quality = randomInt(seed, -4, 4); seed = quality.seed;
    return { id: `team-${index}`, name, ovr: (TIER_OVR[pack.tier] ?? 42) + quality.value, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
  });
  const clubTeam = teams.find((team) => team.name === clubName) ?? teams[0];
  const generated = makePlayers(seed, clubTeam.ovr); seed = generated.seed;
  const humorRoll = randomInt(seed, 0, 55); seed = humorRoll.seed;
  const worldHumor = Math.max(12, Math.min(94, Math.round(environment.humorBase * .45) + humorRoll.value));
  const challengedCoach = { ...coach, reputation: Math.min(100, coach.reputation + careerChallenge.reputationBonus) };
  const assignments = selectBestLineup(generated.players, FORMATIONS["4-2-3-1"]);
  return {
    build: BUILD, seed, coach: challengedCoach,
    club: { id: clubTeam.id, name: clubTeam.name, association: pack.association, district: pack.district, competition: pack.competition, group: pack.group, tier: pack.tier },
    season: "2026/27", date: "2026-07-13", round: 1, teams, fixtures: buildSchedule(teams.map((team) => team.id)), players: generated.players,
    tactic: { formation: "4-2-3-1", mentality: "Zrównoważona", tempo: "Normalne", pressing: "Średni", line: "Średnia", width: "Standardowa", buildUp: "Mieszane", passingRisk: "Umiarkowane", assignments },
    training: { focus: "Taktyka", intensity: "Normalna", recovery: true, readiness: Math.min(environment.readinessCap, 62), completedRound: null }, squadPolicy: "BALANCED",
    pressures: { board: 18 + careerChallenge.pressureBonus, fans: 20 + Math.round(careerChallenge.pressureBonus * .8), media: Math.round((12 + careerChallenge.pressureBonus) * environment.mediaScale), dressing: 15, personal: 16 + Math.round(careerChallenge.pressureBonus * .7) }, burnout: 8 + Math.round(careerChallenge.pressureBonus * .15),
    careerChallenge, environment, worldHumor,
    president: { ambition: 58 + Math.round(careerChallenge.pressureBonus * .4), patience: Math.max(22, 54 - Math.round(careerChallenge.pressureBonus * .65)), ego: 46, footballKnowledge: 52, financialCaution: 68, fanPressureSensitivity: 55, mediaPressureSensitivity: 41, riskTolerance: 43, localPatriotism: pack.tier >= 7 ? 82 : 55, unpredictability: 28 },
    presidentName: `Prezes ${LAST_NAMES[(seed + 11) % LAST_NAMES.length]}`,
    finances: { monthlySalary: Math.max(1800, 14000 - pack.tier * 1200), personalFunds: 9000 },
    developmentGoals: DEVELOPMENT_GOALS.filter((goal) => goals.includes(goal.id)).map((goal) => ({ ...goal, progress: 0 })),
    history: [`13.07.2026 — ${coach.name} podpisał kontrakt z ${clubName}. Profil: ${coach.profile}. Świat kariery: humor ${worldHumor}/100.`],
    inbox: [{ id: "welcome", title: `Witamy w ${clubName}`, body: `${coach.name.split(" ")[0] || "Trenerze"}, zarząd oczekuje ${careerChallenge.expectation}. To ${environment.status}: ${environment.work.toLowerCase()} Zakres transferów: SHARED.`, resolved: false }],
  };
}

export function environmentIncident(game: GameState) {
  const roll = randomInt(game.seed, 0, 999); let seed = roll.seed;
  if (!environmentIncidentOccurs(roll.value / 1000, game.environment.absenceRisk)) return { seed, penalty: 0, text: undefined as string | undefined };
  const pick = randomInt(seed, 0, 2); seed = pick.seed;
  const humorous = game.worldHumor >= 60;
  const lower = game.club.tier >= 7;
  const texts = lower
    ? humorous
      ? ["Jeden z podstawowych zawodników kończy zmianę w pracy tuż przed zbiórką. Dojedzie, ale rozgrzewka będzie ekspresowa.", "Kierownik melduje, że linia boczna wygląda dziś pewniej niż fragment murawy. Trzeba uprościć pierwsze podania.", "Bus utknął po drodze po dwóch zawodników. Obaj są w kadrze, lecz przygotowanie nie będzie podręcznikowe."]
      : ["Obowiązki zawodowe ograniczyły przygotowanie jednego z podstawowych graczy.", "Stan boiska wymusza prostszy plan rozegrania niż zakładano.", "Opóźniony transport skrócił zespołowi rozgrzewkę."]
    : ["Drobny problem mięśniowy wykryty na rozgrzewce ogranicza gotowość jednego z liderów.", "Opóźnienie w podróży skróciło odprawę przedmeczową.", "Nagła infekcja w kadrze zmusza sztab do korekty obciążeń."];
  return { seed, penalty: lower ? 2.2 : 1.4, text: texts[pick.value] };
}

export function environmentDecision(game: GameState, result: "win" | "draw" | "loss") {
  const humorous = game.worldHumor >= 60;
  if (game.club.tier >= 8) return result === "loss"
    ? { title: "Pytanie lokalnego portalu", body: humorous ? "Portal pyta, czy problemem był plan meczu, czy fakt, że trzech piłkarzy poznało skład między pracą a rozgrzewką." : "Lokalny portal pyta, czy bierzesz odpowiedzialność za przygotowanie zespołu." }
    : { title: "Głos z szatni", body: humorous ? "Rezerwowy napastnik twierdzi, że jest w formie. Na dowód przypomina hat-tricka z zakładowego turnieju, którego nikt ze sztabu nie widział." : "Rezerwowy napastnik oczekuje rozmowy o swojej roli i minutach." };
  if (game.club.tier >= 5) return result === "loss"
    ? { title: "Sponsor oczekuje wyjaśnień", body: "Lokalny sponsor chce wiedzieć, czy słabszy wynik wymaga wzmocnień, czy zmiany planu pracy." }
    : { title: "Napięcie o rolę w zespole", body: "Doświadczony zawodnik chce publicznego potwierdzenia swojej pozycji w drużynie." };
  return result === "loss"
    ? { title: "Konferencja po meczu", body: "Media żądają wskazania odpowiedzialnego za wynik, a zarząd obserwuje ton odpowiedzi." }
    : { title: "Pytanie o hierarchię", body: "Dziennikarze pytają, czy ostatni wybór składu oznacza trwałą zmianę hierarchii w zespole." };
}

export function teamForId(game: GameState, id: string) { return game.teams.find((team) => team.id === id); }
export function currentFixture(game: GameState) { return game.fixtures.find((fixture) => fixture.round === game.round && (fixture.home === game.club.id || fixture.away === game.club.id)); }
export function formatDate(value: string) { try { return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00Z`)); } catch { return value; } }
export function pressureLabel(value: number) { return value < 30 ? "niska" : value < 60 ? "odczuwalna" : value < 80 ? "wysoka" : "krytyczna"; }
export function pressureName(key: string) { return ({ board: "Zarząd", fans: "Kibice", media: "Media", dressing: "Szatnia", personal: "Stres osobisty" } as Record<string, string>)[key] ?? key; }
export function skillLabel(key: string) { return ({ tactics: "Taktyka", motivation: "Motywacja", people: "Zarządzanie ludźmi", analysis: "Analiza", pressure: "Odporność na presję", adaptability: "Adaptacyjność", energy: "Energia", youth: "Rozwój młodych" } as Record<string, string>)[key] ?? key; }
export function presidentLabel(key: string) { return ({ ambition: "Ambicja", patience: "Cierpliwość", ego: "Ego", footballKnowledge: "Wiedza piłkarska", financialCaution: "Ostrożność finansowa", fanPressureSensitivity: "Wrażliwość na kibiców", mediaPressureSensitivity: "Wrażliwość na media", riskTolerance: "Tolerancja ryzyka", localPatriotism: "Lokalny patriotyzm", unpredictability: "Nieprzewidywalność" } as Record<string, string>)[key] ?? key; }
