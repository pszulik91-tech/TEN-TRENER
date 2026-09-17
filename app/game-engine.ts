import {
  BUILD, DEVELOPMENT_GOALS, FIRST_NAMES, FORMATIONS, GameState, LAST_NAMES,
  JobOffer, LeaguePack, LEAGUE_PACKS, LICENSE_CHALLENGES, PERSONALITIES, Player, POSITIONS, Position, Team, TIER_OVR,
  buildSchedule, defaultMicrocycle, licenseCoversCompetition, offseasonBaseChange, positionPenalty, randomInt, rngNext, selectBestLineup, shouldRetirePlayer,
  environmentForPack, environmentForTier, environmentIncidentOccurs,
} from "./game-data";
import type { Coach, CoachProfile } from "./game-data";
import { welcomeIssue } from "../lib/career-events.mjs";
import { createWorldSnapshot, simulateWorldToDate, evolveWorldSnapshot } from "../lib/world-engine.mjs";

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

export function makePlayers(seed: number, base: number, idPrefix = "p") {
  const roles: Position[] = ["BR", "BR", "PO", "PO", "ŚO", "ŚO", "ŚO", "ŚO", "LO", "LO", "DP", "DP", "ŚP", "ŚP", "ŚP", "PP", "PP", "ŚPO", "LP", "LP", "N", "N", "N"];
  let nextSeed = seed;
  const players: Player[] = roles.map((primary, index) => {
    const a = randomInt(nextSeed, 0, FIRST_NAMES.length - 1); nextSeed = a.seed;
    const b = randomInt(nextSeed, 0, LAST_NAMES.length - 1); nextSeed = b.seed;
    const age = randomInt(nextSeed, 17, 35); nextSeed = age.seed;
    const quality = randomInt(nextSeed, -6, 6); nextSeed = quality.seed;
    const potential = randomInt(nextSeed, base + 2, Math.min(90, base + 16)); nextSeed = potential.seed;
    const positionalNeighbors = POSITIONS.filter((position) => position !== primary && positionPenalty({ primary, secondary: [] }, position) <= 0.09);
    return { id: `${idPrefix}-${index}-${a.value}-${b.value}`, name: `${FIRST_NAMES[a.value]} ${LAST_NAMES[b.value]}`, age: age.value, primary, secondary: positionalNeighbors.slice(0, index % 3 === 0 ? 2 : 1), baseOVR: Math.max(20, base + quality.value), form: 48 + (index % 7), morale: 58 + (index % 11), fatigue: 8 + (index % 12), relation: 55, potential: Math.max(potential.value, base + quality.value), personality: PERSONALITIES[index % PERSONALITIES.length], status: index < 11 ? "Pierwszy skład" : index < 18 ? "Rotacja" : "Rezerwa", injuryWeeks: 0, absenceRounds: 0 };
  });
  return { players, seed: nextSeed };
}

export function createGame(coach: Coach, pack: LeaguePack, clubName: string, goals: string[]): GameState {
  let seed = Math.abs(Array.from(`${coach.name}-${clubName}`).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 202627)) >>> 0;
  const environment = environmentForPack(pack);
  const careerChallenge = LICENSE_CHALLENGES[coach.license];
  const teams: Team[] = pack.teams.map((name, index) => {
    const quality = randomInt(seed, -4, 4); seed = quality.seed;
    return { id: `team-${index}`, name, ovr: (TIER_OVR[pack.tier] ?? 42) + quality.value, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0, form: 50, morale: 55, fatigue: 14, lastFive: [] };
  });
  const clubTeam = teams.find((team) => team.name === clubName) ?? teams[0];
  const generated = makePlayers(seed, clubTeam.ovr); seed = generated.seed;
  const humorRoll = randomInt(seed, 0, 55); seed = humorRoll.seed;
  const worldHumor = Math.max(12, Math.min(94, Math.round(environment.humorBase * .45) + humorRoll.value));
  const challengedCoach = { ...coach, reputation: Math.min(100, coach.reputation + careerChallenge.reputationBonus) };
  const assignments = selectBestLineup(generated.players, FORMATIONS["4-2-3-1"]);
  const generatedWorld = createWorldSnapshot(LEAGUE_PACKS, pack.id, 2026, seed, TIER_OVR); seed = generatedWorld.seed;
  return {
    build: BUILD, seed, coach: challengedCoach,
    club: { id: clubTeam.id, name: clubTeam.name, association: pack.association, district: pack.district, competition: pack.competition, group: pack.group, tier: pack.tier },
    season: "2026/27", date: "2026-07-13", round: 1, teams, fixtures: buildSchedule(teams.map((team) => team.id), 2026, pack.tier), players: generated.players,
    tactic: { formation: "4-2-3-1", mentality: "Zrównoważona", tempo: "Normalne", pressing: "Średni", line: "Średnia", width: "Standardowa", buildUp: "Mieszane", passingRisk: "Umiarkowane", assignments },
    training: { sessions: defaultMicrocycle(environment.trainingSessions), readiness: Math.min(environment.readinessCap, 62), completedRound: null, preset: "BALANCED" }, squadPolicy: "BALANCED", teamPlan: "STRONGEST",
    pressures: { board: 18 + careerChallenge.pressureBonus, fans: 20 + Math.round(careerChallenge.pressureBonus * .8), media: Math.round((12 + careerChallenge.pressureBonus) * environment.mediaScale), dressing: 15, personal: 16 + Math.round(careerChallenge.pressureBonus * .7) }, burnout: 8 + Math.round(careerChallenge.pressureBonus * .15), lastBurnoutChange: 0,
    careerChallenge, environment, worldHumor, trainingMemory: { youth: 0, analysis: 0, overload: 0, weeks: 0 },
    world: generatedWorld.world,
    worldActivity: { date: "2026-07-13", competitionsAdvanced: 0, matchesPlayed: 0, squadMoves: 0, managerChanges: 0, headlines: [] },
    president: { ambition: 58 + Math.round(careerChallenge.pressureBonus * .4), patience: Math.max(22, 54 - Math.round(careerChallenge.pressureBonus * .65)), ego: 46, footballKnowledge: 52, financialCaution: 68, fanPressureSensitivity: 55, mediaPressureSensitivity: 41, riskTolerance: 43, localPatriotism: pack.tier >= 7 ? 82 : 55, unpredictability: 28 },
    presidentName: `Prezes ${LAST_NAMES[(seed + 11) % LAST_NAMES.length]}`,
    finances: { monthlySalary: Math.max(1800, 14000 - pack.tier * 1200), personalFunds: 9000 },
    developmentGoals: DEVELOPMENT_GOALS.filter((goal) => goals.includes(goal.id)).map((goal) => ({ ...goal, progress: 0 })),
    seasonEvidence: { formationsWithPoints: [], youthStarters: [], analysisRounds: [], tacticalRounds: [], pressureRounds: [], positiveDecisions: [] },
    history: [`13.07.2026 — ${coach.name} podpisał kontrakt z ${clubName}. Profil: ${coach.profile}. Świat kariery: humor ${worldHumor}/100.`],
    inbox: [welcomeIssue(clubName, coach.name.split(" ")[0], careerChallenge.expectation, environment.status, environment.work)],
    employmentStatus: "employed", jobOffers: [],
    careerStats: { seasons: 0, matches: 0, wins: 0, draws: 0, losses: 0, promotions: 0, relegations: 0, goalsCompleted: 0, highestTier: pack.tier, clubs: [clubName] },
    seasonRecords: [],
  };
}

export function squadBaseOVR(players: Player[]) {
  const starters = [...players].sort((a, b) => b.baseOVR - a.baseOVR).slice(0, Math.min(11, players.length));
  return starters.length ? Number((starters.reduce((sum, player) => sum + player.baseOVR, 0) / starters.length).toFixed(1)) : 0;
}

export function evolveSquad(players: Player[], initialSeed: number, tier: number, seasonYear: number, movement: "awans" | "utrzymanie" | "spadek" = "utrzymanie", trainingMemory?: { youth: number; analysis: number; overload: number; weeks: number }) {
  let seed = initialSeed; const kept: Player[] = []; const retired: string[] = []; const changes: string[] = []; const beforeOVR = squadBaseOVR(players);
  const weeks = Math.max(1, trainingMemory?.weeks ?? 1); const youthShare = (trainingMemory?.youth ?? 0) / weeks; const overloadShare = (trainingMemory?.overload ?? 0) / weeks;
  for (const player of players) {
    let roll = rngNext(seed); seed = roll.seed; const nextAge = player.age + 1;
    if (shouldRetirePlayer(nextAge, roll.value)) { retired.push(player.name); continue; }
    roll = rngNext(seed); seed = roll.seed; let change = offseasonBaseChange({ ...player, age: nextAge }, roll.value);
    if (nextAge <= 22 && youthShare >= .45 && player.baseOVR < player.potential) { const developmentRoll = rngNext(seed); seed = developmentRoll.seed; if (developmentRoll.value < Math.min(.55, youthShare * .45)) change += 1; }
    if (overloadShare >= .8 && nextAge >= 30) { const overloadRoll = rngNext(seed); seed = overloadRoll.seed; if (overloadRoll.value < .22) change -= 1; }
    change = Math.max(-3, Math.min(2, change));
    const baseOVR = Math.max(18, Math.min(player.potential, player.baseOVR + change));
    if (change) changes.push(`${player.name} ${change > 0 ? "+" : ""}${change}`);
    kept.push({ ...player, age: nextAge, baseOVR, form: 50, morale: Math.round((player.morale + 55) / 2), fatigue: 10, relation: Math.round((player.relation + 55) / 2), injuryWeeks: 0, absenceRounds: 0, absenceReason: undefined });
  }
  const academy = makePlayers(seed, Math.max(22, (TIER_OVR[tier] ?? 42) - 5), `y${seasonYear}`); seed = academy.seed;
  const needed = Math.max(0, 23 - kept.length); const absentRoles = players.filter(p => !kept.some(k => k.id === p.id)).map(p => p.primary);
  const graduates = absentRoles.slice(0, needed).map((role, i) => ({ ...academy.players.find(p => p.primary === role)!, id: `y${seasonYear}-${i}` })).map((player, index) => ({ ...player, age: 17 + (index % 3), baseOVR: Math.min(player.baseOVR, (TIER_OVR[tier] ?? 42) - 1), potential: Math.max(player.potential, player.baseOVR + 10), status: "Młodzież" }));
  let nextPlayers = [...kept, ...graduates]; const recruits: string[] = []; const departures: string[] = [];
  if (movement === "awans") {
    const generated = makePlayers(seed, Math.max(22, (TIER_OVR[tier] ?? 42) - 1), `transfer${seasonYear}`); seed = generated.seed;
    const replace = [...nextPlayers].sort((a,b) => a.baseOVR-b.baseOVR).slice(0, tier <= 4 ? 6 : 5);
    const arrivals = replace.map((out, i) => ({ ...generated.players.find(p => p.primary === out.primary)!, id: `transfer${seasonYear}-${i}` })).map((player, index) => ({ ...player, id: `${player.id}-in-${index}`, morale: 58, fatigue: 8, status: index < 3 ? "Pierwszy skład" : "Rotacja" }));
    const outgoing = [...nextPlayers].sort((a, b) => a.baseOVR - b.baseOVR).slice(0, arrivals.length); const outgoingIds = new Set(outgoing.map((player) => player.id)); departures.push(...outgoing.map((player) => player.name)); recruits.push(...arrivals.map((player) => player.name)); nextPlayers = [...nextPlayers.filter((player) => !outgoingIds.has(player.id)), ...arrivals];
  } else if (movement === "spadek" && nextPlayers.length > 13) {
    const leaders = [...nextPlayers].sort((a, b) => b.baseOVR - a.baseOVR).slice(0, 2); const leaderIds = new Set(leaders.map((player) => player.id)); departures.push(...leaders.map((player) => player.name));
    const generated = makePlayers(seed, (TIER_OVR[tier] ?? 42) + 1, `rebuild${seasonYear}`); seed = generated.seed; const arrivals = leaders.map((out, i) => ({ ...generated.players.find(p => p.primary === out.primary)!, id: `rebuild${seasonYear}-${i}` })).map((player, index) => ({ ...player, id: `${player.id}-rebuild-${index}`, morale: 52, fatigue: 8, status: "Rotacja" })); recruits.push(...arrivals.map((player) => player.name)); nextPlayers = [...nextPlayers.filter((player) => !leaderIds.has(player.id)), ...arrivals];
  }
  return { players: nextPlayers, seed, retired, changes, graduates: graduates.map((player) => player.name), recruits, departures, beforeOVR, afterOVR: squadBaseOVR(nextPlayers) };
}

function packForTier(tier: number, association: string, district: string) {
  const exact = LEAGUE_PACKS.find((pack) => pack.tier === tier && pack.association === association && pack.district === district)
    ?? LEAGUE_PACKS.find((pack) => pack.tier === tier && pack.association === association)
    ?? LEAGUE_PACKS.find((pack) => pack.tier === tier);
  if (exact) return exact;
  const neighbors = [...LEAGUE_PACKS].sort((a, b) => Math.abs(a.tier - tier) - Math.abs(b.tier - tier));
  return neighbors[0];
}

export function buildLeagueForSeason(game: GameState, tier: number, seasonYear: number, clubName = game.club.name, forcedPack?: LeaguePack) {
  let seed = game.seed; const pack = forcedPack ?? packForTier(tier, game.club.association, game.club.district);
  const existing = game.nextWorld?.competitions.find(c => c.id === pack.id);
  const names = existing?.teams.map(team => team.name) ?? [...pack.teams];
  if (!names.includes(clubName)) names[names.length - 1] = clubName;
  const squadBaseline = game.players.length ? Math.round(squadBaseOVR(game.players)) : TIER_OVR[tier];
  const teams: Team[] = names.map((name, index) => {
    const quality = randomInt(seed, -4, 4); seed = quality.seed;
    return { id: existing?.teams.find(t => t.name === name)?.id ?? (name === clubName ? game.club.id : `s${seasonYear}-team-${index}`), name, ovr: name === clubName ? squadBaseline : (TIER_OVR[tier] ?? 42) + quality.value, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0, form: 50, morale: 55, fatigue: 14, lastFive: [] };
  });
  return { seed, teams, fixtures: buildSchedule(teams.map((team) => team.id), seasonYear, tier), pack, club: { ...game.club, id: teams.find(t => t.name === clubName)!.id, name: clubName, association: forcedPack?.association ?? pack.association ?? game.club.association, district: forcedPack?.district ?? pack.district ?? game.club.district, competition: pack.competition ?? environmentForTier(tier).label, group: forcedPack?.group ?? pack.group, tier: pack.tier } };
}

export function generateJobOffers(game: GameState, initialSeed: number): { seed: number; offers: JobOffer[] } {
  let seed = initialSeed; const eligible = LEAGUE_PACKS.filter((pack) => {
    if (!licenseCoversCompetition(game.coach.license, pack.competition)) return false;
    const reputationFloor = 5 + (10 - pack.tier) * 5;
    const localBonus = pack.association === game.club.association ? 6 : 0;
    return game.coach.reputation + localBonus >= reputationFloor - 8;
  }); const pool = [...eligible]; const offers: JobOffer[] = [];
  while (pool.length && offers.length < 3) {
    const pick = randomInt(seed, 0, pool.length - 1); seed = pick.seed; const pack = pool.splice(pick.value, 1)[0];
    const candidates = (game.nextWorld?.competitions.find(c => c.id === pack.id)?.teams.map(t => t.name) ?? pack.teams).filter((name) => name !== game.club.name); const clubPick = randomInt(seed, 0, candidates.length - 1); seed = clubPick.seed; const clubName = candidates[clubPick.value];
    const reputationFloor = 5 + (10 - pack.tier) * 5; const localBonus = pack.association === game.club.association ? 6 : 0; const fit = Math.max(1, Math.min(99, 55 + game.coach.reputation + localBonus - reputationFloor));
    offers.push({ id: `job-${seasonYearFrom(game.season)}-${pack.id}-${clubPick.value}`, packId: pack.id, clubName, tier: pack.tier, competition: `${pack.competition} • ${pack.group}`, expectation: pack.tier <= 3 ? "wynik od pierwszej kolejki" : pack.tier <= 6 ? "walka o górną połowę" : "ustabilizowanie zespołu", fit });
  }
  return { seed, offers };
}

export function makePresident(initialSeed: number, tier: number) {
  let seed = initialSeed; const values: number[] = [];
  for (let index = 0; index < 10; index += 1) { const value = randomInt(seed, 28, 82); seed = value.seed; values.push(value.value); }
  const surname = randomInt(seed, 0, LAST_NAMES.length - 1); seed = surname.seed;
  const [ambition, patience, ego, footballKnowledge, financialCaution, fanPressureSensitivity, mediaPressureSensitivity, riskTolerance, localBase, unpredictability] = values;
  return { seed, presidentName: `Prezes ${LAST_NAMES[surname.value]}`, president: { ambition: Math.min(92, ambition + Math.max(0, 6 - tier) * 3), patience, ego, footballKnowledge, financialCaution, fanPressureSensitivity, mediaPressureSensitivity, riskTolerance, localPatriotism: tier >= 7 ? Math.max(65, localBase) : localBase, unpredictability } };
}

function seasonYearFrom(season: string) { return Number(season.slice(0, 4)) + 1; }

export function environmentIncident(game: GameState) {
  const roll = randomInt(game.seed, 0, 999); let seed = roll.seed;
  if (!environmentIncidentOccurs(roll.value / 1000, game.environment.absenceRisk)) return { seed, penalty: 0, text: undefined as string | undefined, unavailableIds: [] as string[], absenceReason: undefined as string | undefined };
  const pick = randomInt(seed, 0, 2); seed = pick.seed;
  const humorous = game.worldHumor >= 60;
  const lower = game.club.tier >= 7;
  const texts = lower
    ? humorous
      ? ["Jeden z podstawowych zawodników kończy zmianę w pracy tuż przed zbiórką. Dojedzie, ale rozgrzewka będzie ekspresowa.", "Kierownik melduje, że linia boczna wygląda dziś pewniej niż fragment murawy. Trzeba uprościć pierwsze podania.", "Bus utknął po drodze po dwóch zawodników. Obaj są w kadrze, lecz przygotowanie nie będzie podręcznikowe."]
      : ["Obowiązki zawodowe ograniczyły przygotowanie jednego z podstawowych graczy.", "Stan boiska wymusza prostszy plan rozegrania niż zakładano.", "Opóźniony transport skrócił zespołowi rozgrzewkę."]
    : ["Drobny problem mięśniowy wykryty na rozgrzewce ogranicza gotowość jednego z liderów.", "Opóźnienie w podróży skróciło odprawę przedmeczową.", "Nagła infekcja w kadrze zmusza sztab do korekty obciążeń."];
  const unavailableCount = lower ? (pick.value === 0 ? 1 : 0) : (pick.value === 0 || pick.value === 2 ? 1 : 0);
  const candidates = game.players.filter((player) => (player.injuryWeeks ?? 0) <= 0 && (player.absenceRounds ?? 0) <= 0);
  const unavailableIds: string[] = [];
  for (let index = 0; index < unavailableCount && candidates.length; index += 1) {
    const chosen = randomInt(seed, 0, candidates.length - 1); seed = chosen.seed;
    unavailableIds.push(candidates.splice(chosen.value, 1)[0].id);
  }
  return { seed, penalty: lower ? 2.2 : 1.4, text: texts[pick.value], unavailableIds, absenceReason: lower ? "obowiązki zawodowe" : "nagła niedyspozycja" };
}

export function teamForId(game: GameState, id: string) { return game.teams.find((team) => team.id === id); }
export function currentFixture(game: GameState) { return game.fixtures.find((fixture) => !fixture.played && fixture.round >= game.round && (fixture.home === game.club.id || fixture.away === game.club.id)); }
export function formatDate(value: string) { try { return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00Z`)); } catch { return value; } }
export function pressureLabel(value: number) { return value < 30 ? "niska" : value < 60 ? "odczuwalna" : value < 80 ? "wysoka" : "krytyczna"; }
export function pressureName(key: string) { return ({ board: "Zarząd", fans: "Kibice", media: "Media", dressing: "Szatnia", personal: "Stres osobisty" } as Record<string, string>)[key] ?? key; }
export function skillLabel(key: string) { return ({ tactics: "Taktyka", motivation: "Motywacja", people: "Zarządzanie ludźmi", analysis: "Analiza", pressure: "Odporność na presję", adaptability: "Adaptacyjność", energy: "Energia", youth: "Rozwój młodych" } as Record<string, string>)[key] ?? key; }
export function presidentLabel(key: string) { return ({ ambition: "Ambicja", patience: "Cierpliwość", ego: "Ego", footballKnowledge: "Wiedza piłkarska", financialCaution: "Ostrożność finansowa", fanPressureSensitivity: "Wrażliwość na kibiców", mediaPressureSensitivity: "Wrażliwość na media", riskTolerance: "Tolerancja ryzyka", localPatriotism: "Lokalny patriotyzm", unpredictability: "Nieprzewidywalność" } as Record<string, string>)[key] ?? key; }

export function rolloverCareerWorld(game: GameState, year: number) {
  const pack = LEAGUE_PACKS.find(p => p.association === game.club.association && p.competition === game.club.competition && p.group === game.club.group)!;
  const completed = simulateWorldToDate(game.world, `${year}-06-30`, game.seed);
  const competitions = [...completed.world.competitions.filter(c => c.id !== pack.id), { id: pack.id, association: pack.association, competition: pack.competition, group: pack.group, tier: pack.tier, currentRound: Math.max(...game.fixtures.map(f => f.round)), totalRounds: Math.max(...game.fixtures.map(f => f.round)), teams: game.teams, lastResults: [], managerChanges: 0, squadMoves: 0 }];
  return evolveWorldSnapshot({ ...completed.world, competitions }, LEAGUE_PACKS, "", year, completed.seed, TIER_OVR);
}
