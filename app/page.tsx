"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BUILD, DEVELOPMENT_GOALS, effectiveOVR, FORMATIONS, GameState, LEAGUE_PACKS, LICENSE_MIN_TIER,
  License, CoachProfile, POLICY_EFFECTS, SAVE_KEY, Screen, Team, Fixture, LICENSE_CHALLENGES,
  buildSchedule, capReadiness, environmentForTier, normalizeStartingLicense, pressureDeltaForResult, simulateMatchPlan, sortedTable, updateTeamResult,
} from "./game-data";
import type { Coach, LeaguePack } from "./game-data";
import { createGame, currentFixture, environmentDecision, environmentIncident, skillSet, teamForId } from "./game-engine";
import { ClubPicker, Creator, GoalPicker, StartScreen } from "./setup-screens";
import type { CoachDraft } from "./setup-screens";
import { Career, Dashboard, GameShell, Match, Squad, TableScreen, Tactics, Training } from "./game-screens";

export default function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [game, setGame] = useState<GameState | null>(null);
  const [hasSave, setHasSave] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
  const [draft, setDraft] = useState<CoachDraft>({ name: "Piotr Szulik", age: 35, region: "Śląskie", playingExperience: "Amator", coachingExperience: "Debiutant", profile: "Mentor" as CoachProfile, license: "Grassroots C" as License, psychAnswers: {} });
  const [selectedAssociation, setSelectedAssociation] = useState("Podkarpacki ZPN");
  const [selectedDistrict, setSelectedDistrict] = useState("Jarosław");
  const [selectedPackId, setSelectedPackId] = useState("podkarpacka-b-jaroslaw");
  const [selectedClub, setSelectedClub] = useState("Łazowianka Łazy");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHasSave(Boolean(localStorage.getItem(SAVE_KEY))));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => { if (game) localStorage.setItem(SAVE_KEY, JSON.stringify(game)); }, [game]);

  const eligiblePacks = useMemo(() => LEAGUE_PACKS.filter((pack) => pack.tier >= LICENSE_MIN_TIER[draft.license]), [draft.license]);
  const associations = useMemo(() => [...new Set(eligiblePacks.map((pack) => pack.association))].sort((a, b) => a.localeCompare(b, "pl")), [eligiblePacks]);
  const districts = useMemo(() => [...new Set(eligiblePacks.filter((pack) => pack.association === selectedAssociation).map((pack) => pack.district))], [eligiblePacks, selectedAssociation]);
  const packs = useMemo(() => eligiblePacks.filter((pack) => pack.association === selectedAssociation && pack.district === selectedDistrict), [eligiblePacks, selectedAssociation, selectedDistrict]);
  const selectedPack = eligiblePacks.find((pack) => pack.id === selectedPackId) ?? packs[0];
  const go = (next: Screen) => { if (next === "match" && game?.matchState?.completed && game.matchState.fixture.round < game.round) setGame({ ...game, matchState: undefined }); setScreen(next); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const loadGame = () => {
    try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return; const parsed = migrateGame(JSON.parse(raw)); if (!parsed.coach || !parsed.club || !Array.isArray(parsed.fixtures)) throw new Error("invalid save"); setGame(parsed); go(parsed.matchState && !parsed.matchState.completed ? "match" : "dashboard"); }
    catch { localStorage.removeItem(SAVE_KEY); setHasSave(false); }
  };

  const startClubStep = () => {
    const available = LEAGUE_PACKS.filter((pack) => pack.tier >= LICENSE_MIN_TIER[draft.license]); const first = available.find((pack) => pack.association === selectedAssociation) ?? available[0];
    setSelectedAssociation(first.association); setSelectedDistrict(first.district); setSelectedPackId(first.id); setSelectedClub(first.teams[0]); go("club");
  };
  const chooseAssociation = (value: string) => { const first = eligiblePacks.find((pack) => pack.association === value) as LeaguePack; setSelectedAssociation(value); setSelectedDistrict(first.district); setSelectedPackId(first.id); setSelectedClub(first.teams[0]); };
  const chooseDistrict = (value: string) => { const first = eligiblePacks.find((pack) => pack.association === selectedAssociation && pack.district === value) as LeaguePack; setSelectedDistrict(value); setSelectedPackId(first.id); setSelectedClub(first.teams[0]); };
  const choosePack = (value: string) => { const pack = eligiblePacks.find((item) => item.id === value) as LeaguePack; setSelectedPackId(value); setSelectedClub(pack.teams[0]); };

  const finalizeCareer = () => {
    if (!selectedPack || selectedGoals.length !== 2) return;
    const derived = skillSet(draft.profile, draft.playingExperience, draft.coachingExperience); const coach: Coach = { name: draft.name, age: draft.age, region: draft.region, playingExperience: draft.playingExperience, coachingExperience: draft.coachingExperience, profile: draft.profile, license: draft.license, ...derived };
    setGame(createGame(coach, selectedPack, selectedClub, selectedGoals)); go("dashboard");
  };
  const saveNow = () => { if (!game) return; localStorage.setItem(SAVE_KEY, JSON.stringify(game)); setHasSave(true); setSavedPulse(true); window.setTimeout(() => setSavedPulse(false), 1400); };

  const applyTraining = () => {
    if (!game || game.training.completedRound === game.round) return;
    const policy = POLICY_EFFECTS[game.squadPolicy] ?? POLICY_EFFECTS.BALANCED; const readiness = game.training.intensity === "Wysoka" ? 8 : game.training.intensity === "Niska" ? 1 : 5; const load = game.training.intensity === "Wysoka" ? 8 : game.training.intensity === "Niska" ? 1 : 4; const recovery = game.training.recovery ? 4 : 0;
    setGame({ ...game, training: { ...game.training, readiness: capReadiness(game.training.readiness, readiness, game.environment.readinessCap), completedRound: game.round }, players: game.players.map((player) => ({ ...player, fatigue: Math.max(0, Math.min(100, player.fatigue + load - recovery + policy.fatigue)), morale: Math.max(0, Math.min(100, player.morale + (game.training.focus === "Atmosfera" ? 3 : 0) + policy.morale)), relation: Math.max(0, Math.min(100, player.relation + (game.squadPolicy === "MOTIVATIONAL" ? 1 : 0))) })), burnout: Math.max(0, Math.min(100, game.burnout + (game.training.intensity === "Wysoka" ? 3 : game.training.intensity === "Niska" ? 0 : 1) + policy.burnout)), developmentGoals: game.developmentGoals.map((goal) => goal.id === "tactics" && game.training.focus === "Taktyka" ? { ...goal, progress: Math.min(goal.target, goal.progress + 1) } : goal), history: [`${game.date} — Zrealizowano mikrocykl kolejki ${game.round}: ${game.training.focus}, ${game.environment.trainingSessions} sesje, intensywność ${game.training.intensity.toLowerCase()}.`, ...game.history].slice(0, 40) });
    go("dashboard");
  };

  const prepareMatch = () => {
    if (!game) return; const fixture = currentFixture(game); if (!fixture) return;
    const homeTeam = teamForId(game, fixture.home) as Team; const awayTeam = teamForId(game, fixture.away) as Team; const userHome = fixture.home === game.club.id; const slots = FORMATIONS[game.tactic.formation];
    const squadRating = slots.reduce((sum, slot) => { const player = game.players.find((item) => item.id === game.tactic.assignments[slot]); return sum + (player ? effectiveOVR(player, slot) : 1); }, 0) / 11;
    const policy = POLICY_EFFECTS[game.squadPolicy] ?? POLICY_EFFECTS.BALANCED; const tacticalPlan = (game.tactic.mentality === "Ofensywna" ? .35 : game.tactic.mentality === "Defensywna" ? -.15 : 0) + (game.tactic.pressing === "Wysoki" ? .45 : game.tactic.pressing === "Niski" ? -.1 : 0) + (game.tactic.tempo === "Wysokie" ? .25 : 0); const tactical = (game.coach.skills.tactics - 40) / 16 + (game.training.readiness - 60) / 12 + policy.matchStrength + tacticalPlan; const incident = environmentIncident(game); const userStrength = squadRating + tactical - incident.penalty;
    const homeStrength = userHome ? userStrength : homeTeam.ovr; const awayStrength = userHome ? awayTeam.ovr : userStrength; const simulation = simulateMatchPlan(incident.seed, homeStrength, awayStrength, homeTeam.name, awayTeam.name); const plannedEvents = incident.text ? [{ minute: 1, text: incident.text, kind: "info" as const, side: "neutral" as const }, ...simulation.events] : simulation.events;
    setGame({ ...game, seed: simulation.seed, matchState: { fixture, minute: 0, homeGoals: simulation.homeGoals, awayGoals: simulation.awayGoals, plannedEvents, shotsHome: simulation.shotsHome, shotsAway: simulation.shotsAway, possessionHome: simulation.possessionHome, homeStrength, awayStrength, completed: false } }); go("match");
  };

  const changeLiveInstruction = (field: "mentality" | "pressing", value: string) => {
    if (!game) return;
    const tactic = { ...game.tactic, [field]: value }; const match = game.matchState;
    if (!match || match.completed) { setGame({ ...game, tactic }); return; }
    const oldImpact = instructionImpact(field, game.tactic[field]); const newImpact = instructionImpact(field, value); const difference = newImpact - oldImpact; const userHome = match.fixture.home === game.club.id; const homeStrength = (match.homeStrength ?? teamForId(game, match.fixture.home)?.ovr ?? 40) + (userHome ? difference : 0); const awayStrength = (match.awayStrength ?? teamForId(game, match.fixture.away)?.ovr ?? 40) + (userHome ? 0 : difference); const homeName = teamForId(game, match.fixture.home)?.name; const awayName = teamForId(game, match.fixture.away)?.name; const simulation = simulateMatchPlan(game.seed, homeStrength, awayStrength, homeName, awayName); const pastEvents = match.plannedEvents.filter((event) => event.minute <= match.minute); const futureEvents = simulation.events.filter((event) => event.minute > match.minute); const plannedEvents = [...pastEvents, ...futureEvents].sort((a, b) => a.minute - b.minute); const homeGoals = plannedEvents.filter((event) => event.kind === "goal" && event.side === "home").length; const awayGoals = plannedEvents.filter((event) => event.kind === "goal" && event.side === "away").length;
    const dangerousHome = plannedEvents.filter((event) => event.side === "home" && ["goal", "chance"].includes(event.kind)).length; const dangerousAway = plannedEvents.filter((event) => event.side === "away" && ["goal", "chance"].includes(event.kind)).length;
    setGame({ ...game, seed: simulation.seed, tactic, matchState: { ...match, plannedEvents, homeGoals, awayGoals, shotsHome: Math.max(dangerousHome, simulation.shotsHome), shotsAway: Math.max(dangerousAway, simulation.shotsAway), possessionHome: simulation.possessionHome, homeStrength, awayStrength }, pressures: { ...game.pressures, personal: Math.min(100, game.pressures.personal + (value === "Ofensywna" || value === "Bardzo wysoki" ? 2 : 0)) } });
  };

  const advanceMatch = () => {
    if (!game?.matchState || game.matchState.completed) return; const minute = Math.min(90, game.matchState.minute + 15); if (minute < 90) { setGame({ ...game, matchState: { ...game.matchState, minute } }); return; }
    const match = game.matchState; let teams = updateTeamResult(game.teams, match.fixture.home, match.fixture.away, match.homeGoals, match.awayGoals); let seed = game.seed; const fixtures: Fixture[] = game.fixtures.map((fixture) => ({ ...fixture }));
    const roundFixtures = game.fixtures.filter((fixture) => fixture.round === game.round && !(fixture.home === match.fixture.home && fixture.away === match.fixture.away));
    for (const fixture of roundFixtures) { const home = teams.find((team) => team.id === fixture.home) as Team; const away = teams.find((team) => team.id === fixture.away) as Team; const simulation = simulateMatchPlan(seed, home.ovr, away.ovr, home.name, away.name); seed = simulation.seed; const hg = simulation.homeGoals; const ag = simulation.awayGoals; teams = updateTeamResult(teams, fixture.home, fixture.away, hg, ag); const target = fixtures.find((item) => item.round === fixture.round && item.home === fixture.home && item.away === fixture.away) as Fixture; Object.assign(target, { played: true, homeGoals: hg, awayGoals: ag }); }
    const userTarget = fixtures.find((item) => item.round === match.fixture.round && item.home === match.fixture.home && item.away === match.fixture.away) as Fixture; Object.assign(userTarget, { played: true, homeGoals: match.homeGoals, awayGoals: match.awayGoals });
    const userHome = match.fixture.home === game.club.id; const gf = userHome ? match.homeGoals : match.awayGoals; const ga = userHome ? match.awayGoals : match.homeGoals; const result: "win" | "draw" | "loss" = gf > ga ? "win" : gf === ga ? "draw" : "loss"; const multiplier = game.careerChallenge.pressureMultiplier; const pressureDelta = pressureDeltaForResult(result, multiplier); const newRound = game.round + 1; const endSeason = newRound > Math.max(...game.fixtures.map((fixture) => fixture.round)); const nextDate = new Date(game.date); nextDate.setDate(nextDate.getDate() + 7);
    const inbox = [...game.inbox]; const eventGap = game.club.tier >= 7 ? 4 : 5; if ((game.round + game.worldHumor) % eventGap === 0 || (result === "loss" && game.round % 4 === 0)) { const event = environmentDecision(game, result); inbox.unshift({ id: `decision-${game.round}`, ...event, resolved: false }); }
    const progress = game.developmentGoals.map((goal) => { let add = 0; if (goal.id === "pressure" && Math.max(...Object.values(game.pressures)) > 40 && result !== "loss") add = 1; if (goal.id === "adaptability" && result !== "loss") add = 1; if (goal.id === "reputation" && result === "win") add = 1; if (goal.id === "motivation" && game.players.slice(0, 11).reduce((sum, player) => sum + player.morale, 0) / 11 > 68) add = 1; return { ...goal, progress: Math.min(goal.target, goal.progress + add) }; });
    const score = `${teamForId(game, match.fixture.home)?.name} ${match.homeGoals}:${match.awayGoals} ${teamForId(game, match.fixture.away)?.name}`; const policy = POLICY_EFFECTS[game.squadPolicy] ?? POLICY_EFFECTS.BALANCED; const starters = new Set(Object.values(game.tactic.assignments)); const tacticLoad = (game.tactic.pressing === "Wysoki" || game.tactic.pressing === "Bardzo wysoki" ? 2 : 0) + (game.tactic.tempo === "Wysokie" ? 1 : 0);
    const nextPressures = Object.fromEntries(Object.entries(game.pressures).map(([key, value]) => { const environmentDelta = key === "media" && pressureDelta > 0 ? Math.round(pressureDelta * game.environment.mediaScale) : pressureDelta; return [key, Math.max(0, Math.min(100, value + environmentDelta + (key === "dressing" && result === "loss" ? 3 : 0)))]; }));
    let licenseCourse = game.licenseCourse; let coach = game.coach; let licenseMessage = game.licenseMessage; const courseHistory: string[] = [];
    if (licenseCourse) { const remaining = licenseCourse.weeksRemaining - 1; if (remaining <= 0) { coach = { ...coach, license: licenseCourse.target }; licenseMessage = `Ukończono kurs ${licenseCourse.target}. Nowa licencja jest aktywna.`; courseHistory.push(`${game.date} — Ukończono kurs ${licenseCourse.target}.`); licenseCourse = undefined; } else licenseCourse = { ...licenseCourse, weeksRemaining: remaining }; }
    setGame({ ...game, seed, coach, teams, fixtures, round: newRound, date: nextDate.toISOString().slice(0, 10), matchState: { ...match, minute: 90, completed: true }, pressures: nextPressures, burnout: Math.max(0, Math.min(100, game.burnout + (result === "loss" ? 3 + Math.round((multiplier - 1) * 3) : -1) + policy.burnout)), players: game.players.map((player) => { const starter = starters.has(player.id); return { ...player, fatigue: Math.max(0, Math.min(100, player.fatigue + (starter ? 5 + policy.fatigue + tacticLoad : 1))), morale: Math.max(0, Math.min(100, player.morale + (result === "win" ? 4 : result === "loss" ? -4 : 1) + policy.morale)), form: Math.max(0, Math.min(100, player.form + (starter ? result === "win" ? 3 : result === "loss" ? -2 : 1 : 0))) }; }), training: { ...game.training, readiness: Math.max(50, Math.min(game.environment.readinessCap, 54 + Math.round(game.coach.skills.analysis / 8))), completedRound: null }, finances: { ...game.finances, personalFunds: game.finances.personalFunds + Math.round(game.finances.monthlySalary / 4) }, licenseCourse, licenseMessage, developmentGoals: progress, history: [...courseHistory, `${game.date} — ${score}.`, ...game.history].slice(0, 40), inbox, newSeasonPending: endSeason });
  };

  const resolveDecision = (choice: "defend" | "discipline" | "private") => {
    if (!game) return; const event = game.inbox.find((item) => !item.resolved); if (!event) return; const pressures = { ...game.pressures }; let players = [...game.players]; let note = "";
    if (choice === "defend") { pressures.media += 5; pressures.dressing -= 5; players = players.map((player) => ({ ...player, relation: Math.min(100, player.relation + 3) })); note = "Publicznie obroniono zawodnika. Szatnia to doceniła, media podkręciły temat."; }
    if (choice === "discipline") { pressures.board -= 3; pressures.dressing += 6; players = players.map((player, index) => index === 0 ? { ...player, relation: player.relation - 8, morale: player.morale - 6 } : player); note = "Postawiono na dyscyplinę. Zarząd zadowolony, część szatni chłodniejsza."; }
    if (choice === "private") { pressures.media -= 1; pressures.dressing -= 1; pressures.personal += 2; note = "Temat zamknięto wewnątrz klubu. Bez szybkiej nagrody, bez medialnego pożaru."; }
    setGame({ ...game, pressures: Object.fromEntries(Object.entries(pressures).map(([key, value]) => [key, Math.max(0, Math.min(100, value))])), players, inbox: game.inbox.map((item) => item.id === event.id ? { ...item, resolved: true } : item), history: [`${game.date} — ${note}`, ...game.history].slice(0, 40), developmentGoals: game.developmentGoals.map((goal) => goal.id === "people" ? { ...goal, progress: Math.min(goal.target, goal.progress + 1) } : goal) });
  };

  const beginNextSeason = () => {
    if (!game) return; const table = sortedTable(game.teams); const place = table.findIndex((team) => team.id === game.club.id) + 1; const newTier = place === 1 ? Math.max(1, game.club.tier - 1) : place >= table.length - 1 ? Math.min(10, game.club.tier + 1) : game.club.tier; const nextYear = Number(game.season.slice(0, 4)) + 1; const resetTeams = game.teams.map((team) => ({ ...team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }));
    const environment = environmentForTier(newTier); setGame({ ...game, club: { ...game.club, tier: newTier, competition: newTier === game.club.tier ? game.club.competition : place === 1 ? `szczebel ${newTier} — awans` : `szczebel ${newTier} — spadek` }, environment, season: `${nextYear}/${String(nextYear + 1).slice(-2)}`, date: `${nextYear}-07-13`, round: 1, teams: resetTeams, fixtures: buildSchedule(resetTeams.map((team) => team.id)), training: { ...game.training, readiness: Math.min(environment.readinessCap, 60), completedRound: null }, matchState: undefined, newSeasonPending: false, developmentGoals: [], history: [`Koniec sezonu: ${place}. miejsce. ${newTier < game.club.tier ? "Awans!" : newTier > game.club.tier ? "Spadek." : "Utrzymanie."}`, ...game.history] }); setSelectedGoals([]); go("goals");
  };
  const confirmNewSeasonGoals = () => { if (!game || selectedGoals.length !== 2) return; setGame({ ...game, developmentGoals: DEVELOPMENT_GOALS.filter((goal) => selectedGoals.includes(goal.id)).map((goal) => ({ ...goal, progress: 0 })) }); go("dashboard"); };

  if (screen === "start") return <StartScreen hasSave={hasSave} onNew={() => go("creator")} onLoad={loadGame} />;
  if (screen === "creator") return <Creator draft={draft} setDraft={setDraft} onNext={startClubStep} onBack={() => go("start")} />;
  if (screen === "club") return <ClubPicker draft={draft} associations={associations} districts={districts} packs={packs} pack={selectedPack} selectedAssociation={selectedAssociation} selectedDistrict={selectedDistrict} selectedPackId={selectedPackId} selectedClub={selectedClub} onAssociation={chooseAssociation} onDistrict={chooseDistrict} onPack={choosePack} onClub={setSelectedClub} onBack={() => go("creator")} onNext={() => go("goals")} />;
  if (screen === "goals") return <GoalPicker selected={selectedGoals} setSelected={setSelectedGoals} season={game?.season ?? "2026/27"} onBack={() => go(game ? "dashboard" : "club")} onConfirm={game ? confirmNewSeasonGoals : finalizeCareer} />;
  if (!game) return <StartScreen hasSave={hasSave} onNew={() => go("creator")} onLoad={loadGame} />;
  return <GameShell game={game} screen={screen} go={go} menuOpen={menuOpen} setMenuOpen={setMenuOpen} saveNow={saveNow} savedPulse={savedPulse}>{screen === "dashboard" && <Dashboard game={game} go={go} resolveDecision={resolveDecision} prepareMatch={prepareMatch} beginNextSeason={beginNextSeason} />}{screen === "squad" && <Squad game={game} setGame={setGame} />}{screen === "tactics" && <Tactics game={game} setGame={setGame} />}{screen === "training" && <Training game={game} setGame={setGame} applyTraining={applyTraining} />}{screen === "match" && <Match game={game} go={go} advanceMatch={advanceMatch} prepareMatch={prepareMatch} changeLiveInstruction={changeLiveInstruction} />}{screen === "table" && <TableScreen game={game} />}{screen === "career" && <Career game={game} setGame={setGame} />}</GameShell>;
}

function migrateGame(value: unknown): GameState {
  const parsed = value as GameState;
  const history = Array.isArray(parsed.history) ? parsed.history : [];
  const trainedToday = history.some((entry) => typeof entry === "string" && entry.startsWith(`${parsed.date} — Zrealizowano mikrocykl`));
  const license = normalizeStartingLicense(parsed.coach?.license) as License;
  const environment = parsed.environment ?? environmentForTier(parsed.club.tier);
  const careerChallenge = parsed.careerChallenge ?? LICENSE_CHALLENGES[license];
  const rawCourse = parsed.licenseCourse as GameState["licenseCourse"] | undefined;
  const licenseCourse = rawCourse && String(rawCourse.target) === "UEFA C"
    ? { ...rawCourse, target: "UEFA B" as License, totalWeeks: 20, weeksRemaining: Math.max(1, Math.ceil((rawCourse.weeksRemaining / Math.max(1, rawCourse.totalWeeks)) * 20)) }
    : rawCourse;
  return {
    ...parsed,
    build: BUILD,
    coach: { ...parsed.coach, license },
    environment,
    careerChallenge,
    worldHumor: parsed.worldHumor ?? environment.humorBase,
    licenseCourse,
    squadPolicy: POLICY_EFFECTS[parsed.squadPolicy] ? parsed.squadPolicy : "BALANCED",
    training: { focus: parsed.training?.focus ?? "Taktyka", intensity: parsed.training?.intensity ?? "Normalna", recovery: parsed.training?.recovery ?? true, readiness: Math.min(environment.readinessCap, parsed.training?.readiness ?? 60), completedRound: parsed.training?.completedRound ?? (trainedToday ? parsed.round : null) },
    finances: parsed.finances ?? { monthlySalary: Math.max(1800, 14000 - parsed.club.tier * 1200), personalFunds: 9000 },
    history,
  };
}

function instructionImpact(field: "mentality" | "pressing", value: string) {
  if (field === "mentality") return value === "Ofensywna" ? .35 : value === "Defensywna" ? -.15 : 0;
  return value === "Bardzo wysoki" ? .65 : value === "Wysoki" ? .45 : value === "Niski" ? -.1 : 0;
}
