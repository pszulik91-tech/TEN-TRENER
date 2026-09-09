"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BUILD, DEVELOPMENT_GOALS, effectiveOVR, FORMATIONS, GameState, LEAGUE_PACKS, LICENSE_MIN_TIER,
  License, CoachProfile, POLICY_EFFECTS, SAVE_KEY, Screen, Team, Fixture, LICENSE_CHALLENGES, TIER_OVR,
  buildSchedule, burnoutMatchPenalty, capReadiness, dismissalProbability, environmentForTier, goalSatisfied, injuryRiskFromFatigue, licenseCoversTier, normalizeStartingLicense, offseasonBurnout, pressureDeltaForResult, requiredLicenseForTier, rngNext, selectBestLineup, simulateMatchPlan, sortedTable, updateTeamResult, weeklyBurnoutDelta,
} from "./game-data";
import type { Coach, LeaguePack } from "./game-data";
import { buildLeagueForSeason, createGame, currentFixture, environmentIncident, evolveSquad, generateJobOffers, makePlayers, makePresident, skillSet, teamForId } from "./game-engine";
import { generateRoundIssues, legacyIssue } from "../lib/career-events.mjs";
import { ClubPicker, Creator, GoalPicker, StartScreen } from "./setup-screens";
import type { CoachDraft } from "./setup-screens";
import { CareerV14 as Career, DashboardV14 as Dashboard, GameShell, Jobs, Match, Squad, TableScreenV14 as TableScreen, Tactics, Training } from "./game-screens";

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
    if (!game || game.employmentStatus !== "employed" || game.careerEnded || game.training.completedRound === game.round) return;
    const readiness = game.training.intensity === "Wysoka" ? 8 : game.training.intensity === "Niska" ? 1 : 5; const load = game.training.intensity === "Wysoka" ? 8 : game.training.intensity === "Niska" ? 1 : 4; const recovery = game.training.recovery ? 4 : 0;
    setGame({ ...game, training: { ...game.training, readiness: capReadiness(game.training.readiness, readiness, game.environment.readinessCap), completedRound: game.round }, players: game.players.map((player) => ({ ...player, fatigue: Math.max(0, Math.min(100, player.fatigue + load - recovery - (game.training.focus === "Regeneracja" ? 2 : 0))), morale: Math.max(0, Math.min(100, player.morale + (game.training.focus === "Atmosfera" ? 3 : 0))), form: Math.max(0, Math.min(100, player.form + (["Finalizacja", "Pressing", "Rozwój młodych"].includes(game.training.focus) && (game.training.focus !== "Rozwój młodych" || player.age <= 21) ? 1 : 0))) })), history: [`${game.date} — Zrealizowano mikrocykl kolejki ${game.round}: ${game.training.focus}, ${game.environment.trainingSessions} sesje, intensywność ${game.training.intensity.toLowerCase()}.`, ...game.history].slice(0, 80) });
    go("dashboard");
  };

  const prepareMatch = () => {
    if (!game || game.employmentStatus !== "employed" || game.careerEnded) return; const fixture = currentFixture(game); if (!fixture) return;
    const homeTeam = teamForId(game, fixture.home) as Team; const awayTeam = teamForId(game, fixture.away) as Team; const userHome = fixture.home === game.club.id; const slots = FORMATIONS[game.tactic.formation];
    const squadRating = slots.reduce((sum, slot) => { const player = game.players.find((item) => item.id === game.tactic.assignments[slot]); return sum + (player ? effectiveOVR(player, slot) : 1); }, 0) / 11;
    const policy = POLICY_EFFECTS[game.squadPolicy] ?? POLICY_EFFECTS.BALANCED; const tacticalPlan = (game.tactic.mentality === "Ofensywna" ? .35 : game.tactic.mentality === "Defensywna" ? -.15 : 0) + (game.tactic.pressing === "Wysoki" ? .45 : game.tactic.pressing === "Niski" ? -.1 : 0) + (game.tactic.tempo === "Wysokie" ? .25 : 0); const tactical = (game.coach.skills.tactics - 40) / 16 + (game.training.readiness - 60) / 12 + policy.matchStrength + tacticalPlan - burnoutMatchPenalty(game.burnout); const incident = environmentIncident(game); const userStrength = squadRating + tactical - incident.penalty;
    const homeStrength = userHome ? userStrength : homeTeam.ovr; const awayStrength = userHome ? awayTeam.ovr : userStrength; const simulation = simulateMatchPlan(incident.seed, homeStrength, awayStrength, homeTeam.name, awayTeam.name); const plannedEvents = incident.text ? [{ minute: 1, text: incident.text, kind: "info" as const, side: "neutral" as const }, ...simulation.events] : simulation.events;
    setGame({ ...game, date: fixture.date, seed: simulation.seed, matchState: { fixture, minute: 0, homeGoals: simulation.homeGoals, awayGoals: simulation.awayGoals, plannedEvents, shotsHome: simulation.shotsHome, shotsAway: simulation.shotsAway, possessionHome: simulation.possessionHome, homeStrength, awayStrength, completed: false, preparationReadiness: game.training.readiness, preMatchPressure: Math.max(...Object.values(game.pressures)), analysisAttempted: false } }); go("match");
  };

  const changeLiveInstruction = (field: "mentality" | "pressing", value: string) => {
    if (!game) return;
    const tactic = { ...game.tactic, [field]: value }; const match = game.matchState;
    if (!match || match.completed) { setGame({ ...game, tactic }); return; }
    const oldImpact = instructionImpact(field, game.tactic[field]); const newImpact = instructionImpact(field, value); const difference = newImpact - oldImpact; const userHome = match.fixture.home === game.club.id; const homeStrength = (match.homeStrength ?? teamForId(game, match.fixture.home)?.ovr ?? 40) + (userHome ? difference : 0); const awayStrength = (match.awayStrength ?? teamForId(game, match.fixture.away)?.ovr ?? 40) + (userHome ? 0 : difference); const homeName = teamForId(game, match.fixture.home)?.name; const awayName = teamForId(game, match.fixture.away)?.name; const simulation = simulateMatchPlan(game.seed, homeStrength, awayStrength, homeName, awayName); const pastEvents = match.plannedEvents.filter((event) => event.minute <= match.minute); const futureEvents = simulation.events.filter((event) => event.minute > match.minute); const plannedEvents = [...pastEvents, ...futureEvents].sort((a, b) => a.minute - b.minute); const homeGoals = plannedEvents.filter((event) => event.kind === "goal" && event.side === "home").length; const awayGoals = plannedEvents.filter((event) => event.kind === "goal" && event.side === "away").length;
    const dangerousHome = plannedEvents.filter((event) => event.side === "home" && ["goal", "chance"].includes(event.kind)).length; const dangerousAway = plannedEvents.filter((event) => event.side === "away" && ["goal", "chance"].includes(event.kind)).length;
    const currentHomeGoals = match.plannedEvents.filter((event) => event.minute <= match.minute && event.kind === "goal" && event.side === "home").length; const currentAwayGoals = match.plannedEvents.filter((event) => event.minute <= match.minute && event.kind === "goal" && event.side === "away").length; const currentBalance = userHome ? currentHomeGoals - currentAwayGoals : currentAwayGoals - currentHomeGoals; const startsAnalysis = match.minute >= 30 && !match.analysisAttempted;
    setGame({ ...game, seed: simulation.seed, tactic, matchState: { ...match, plannedEvents, homeGoals, awayGoals, shotsHome: Math.max(dangerousHome, simulation.shotsHome), shotsAway: Math.max(dangerousAway, simulation.shotsAway), possessionHome: simulation.possessionHome, homeStrength, awayStrength, analysisAttempted: match.analysisAttempted || startsAnalysis, analysisStartBalance: startsAnalysis ? currentBalance : match.analysisStartBalance }, pressures: { ...game.pressures, personal: Math.min(100, game.pressures.personal + (value === "Ofensywna" || value === "Bardzo wysoki" ? 2 : 0)) } });
  };

  const advanceMatch = () => {
    if (!game?.matchState || game.matchState.completed) return; const minute = Math.min(90, game.matchState.minute + 15); if (minute < 90) { setGame({ ...game, matchState: { ...game.matchState, minute } }); return; }
    const match = game.matchState; let teams = updateTeamResult(game.teams, match.fixture.home, match.fixture.away, match.homeGoals, match.awayGoals); let seed = game.seed; const fixtures: Fixture[] = game.fixtures.map((fixture) => ({ ...fixture }));
    const roundFixtures = game.fixtures.filter((fixture) => fixture.round === game.round && !(fixture.home === match.fixture.home && fixture.away === match.fixture.away));
    for (const fixture of roundFixtures) { const home = teams.find((team) => team.id === fixture.home) as Team; const away = teams.find((team) => team.id === fixture.away) as Team; const simulation = simulateMatchPlan(seed, home.ovr, away.ovr, home.name, away.name); seed = simulation.seed; const hg = simulation.homeGoals; const ag = simulation.awayGoals; teams = updateTeamResult(teams, fixture.home, fixture.away, hg, ag); const target = fixtures.find((item) => item.round === fixture.round && item.home === fixture.home && item.away === fixture.away) as Fixture; Object.assign(target, { played: true, homeGoals: hg, awayGoals: ag }); }
    const userTarget = fixtures.find((item) => item.round === match.fixture.round && item.home === match.fixture.home && item.away === match.fixture.away) as Fixture; Object.assign(userTarget, { played: true, homeGoals: match.homeGoals, awayGoals: match.awayGoals });
    const userHome = match.fixture.home === game.club.id; const gf = userHome ? match.homeGoals : match.awayGoals; const ga = userHome ? match.awayGoals : match.homeGoals; const result: "win" | "draw" | "loss" = gf > ga ? "win" : gf === ga ? "draw" : "loss"; const multiplier = game.careerChallenge.pressureMultiplier; const pressureDelta = pressureDeltaForResult(result, multiplier); const newRound = game.round + 1; const finalRound = Math.max(...game.fixtures.map((fixture) => fixture.round)); const endSeason = newRound > finalRound; const nextFixture = fixtures.find((fixture) => fixture.round === newRound && (fixture.home === game.club.id || fixture.away === game.club.id)); const nextDate = nextFixture?.date ?? match.fixture.date;
    const score = `${teamForId(game, match.fixture.home)?.name} ${match.homeGoals}:${match.awayGoals} ${teamForId(game, match.fixture.away)?.name}`; const policy = POLICY_EFFECTS[game.squadPolicy] ?? POLICY_EFFECTS.BALANCED; const starters = new Set(Object.values(game.tactic.assignments)); const tacticLoad = (game.tactic.pressing === "Wysoki" || game.tactic.pressing === "Bardzo wysoki" ? 2 : 0) + (game.tactic.tempo === "Wysokie" ? 1 : 0);
    const nextPressures = Object.fromEntries(Object.entries(game.pressures).map(([key, value]) => { const environmentDelta = key === "media" && pressureDelta > 0 ? Math.round(pressureDelta * game.environment.mediaScale) : pressureDelta; return [key, Math.max(0, Math.min(100, value + environmentDelta + (key === "dressing" && result === "loss" ? 3 : 0)))]; }));
    const issueBatch = generateRoundIssues({ seed, round: game.round, tier: game.club.tier, result, worldHumor: game.worldHumor, recentTitles: game.inbox.map((item) => item.title) }); seed = issueBatch.seed; const inbox = [...issueBatch.events, ...game.inbox];
    const starterPlayers = game.players.filter((player) => starters.has(player.id)); const averageMorale = starterPlayers.length ? starterPlayers.reduce((sum, player) => sum + player.morale, 0) / starterPlayers.length : 0;
    const evidence = { formationsWithPoints: [...game.seasonEvidence.formationsWithPoints], youthStarters: [...game.seasonEvidence.youthStarters], analysisRounds: [...game.seasonEvidence.analysisRounds], tacticalRounds: [...game.seasonEvidence.tacticalRounds], pressureRounds: [...game.seasonEvidence.pressureRounds], positiveDecisions: [...game.seasonEvidence.positiveDecisions] };
    if (goalSatisfied("tactics", { readiness: match.preparationReadiness ?? game.training.readiness, averageMorale, preMatchPressure: match.preMatchPressure ?? 0, result }) && !evidence.tacticalRounds.includes(game.round)) evidence.tacticalRounds.push(game.round);
    const finalBalance = gf - ga; const analysisImproved = match.analysisAttempted && finalBalance > (match.analysisStartBalance ?? finalBalance); if (analysisImproved && !evidence.analysisRounds.includes(game.round)) evidence.analysisRounds.push(game.round);
    if (goalSatisfied("pressure", { readiness: 0, averageMorale, preMatchPressure: match.preMatchPressure ?? Math.max(...Object.values(game.pressures)), result }) && !evidence.pressureRounds.includes(game.round)) evidence.pressureRounds.push(game.round);
    if (result !== "loss" && !evidence.formationsWithPoints.includes(game.tactic.formation)) evidence.formationsWithPoints.push(game.tactic.formation);
    for (const player of starterPlayers.filter((item) => item.age <= 21)) if (!evidence.youthStarters.includes(player.id)) evidence.youthStarters.push(player.id);
    const progress = game.developmentGoals.map((goal) => {
      if (goal.id === "tactics") return { ...goal, progress: Math.min(goal.target, evidence.tacticalRounds.length) };
      if (goal.id === "analysis") return { ...goal, progress: Math.min(goal.target, evidence.analysisRounds.length) };
      if (goal.id === "pressure") return { ...goal, progress: Math.min(goal.target, evidence.pressureRounds.length) };
      if (goal.id === "adaptability") return { ...goal, progress: Math.min(goal.target, evidence.formationsWithPoints.length) };
      if (goal.id === "youth") return { ...goal, progress: Math.min(goal.target, evidence.youthStarters.length) };
      const add = goalSatisfied(goal.id, { readiness: match.preparationReadiness ?? 0, averageMorale, preMatchPressure: match.preMatchPressure ?? 0, result }) ? 1 : 0;
      return { ...goal, progress: Math.min(goal.target, goal.progress + add) };
    });
    const weeklyBurnout = weeklyBurnoutDelta({ result, intensity: game.training.intensity, recovery: game.training.recovery, policyBurnout: policy.burnout, pressure: match.preMatchPressure ?? Math.max(...Object.values(game.pressures)), profile: game.coach.profile });
    const injuryHistory: string[] = []; const updatedPlayers = game.players.map((player) => {
      if ((player.injuryWeeks ?? 0) > 0) return { ...player, injuryWeeks: Math.max(0, (player.injuryWeeks ?? 0) - 1), fatigue: Math.max(0, player.fatigue - 8) };
      const starter = starters.has(player.id); const fatigue = Math.max(0, Math.min(100, player.fatigue + (starter ? 5 + policy.fatigue + tacticLoad : 1))); let injuryWeeks = 0;
      if (starter) { const injuryRoll = rngNext(seed); seed = injuryRoll.seed; if (injuryRoll.value < injuryRiskFromFatigue(fatigue, game.training.intensity)) { const durationRoll = rngNext(seed); seed = durationRoll.seed; injuryWeeks = 1 + Math.floor(durationRoll.value * 3); injuryHistory.push(`${game.date} — ${player.name}: uraz przeciążeniowy, przerwa ${injuryWeeks} tyg.`); } }
      return {
        ...player,
        fatigue,
        injuryWeeks,
        morale: Math.max(0, Math.min(100, player.morale + (result === "win" ? 4 : result === "loss" ? -4 : 1) + (starter ? policy.morale : 0))),
        form: Math.max(0, Math.min(100, player.form + (starter ? (result === "win" ? 3 : result === "loss" ? -2 : 1) : 0))),
      };
    });
    let licenseCourse = game.licenseCourse; let coach = game.coach; let licenseMessage = game.licenseMessage; const courseHistory: string[] = [];
    if (licenseCourse) { const remaining = licenseCourse.weeksRemaining - 1; if (remaining <= 0) { coach = { ...coach, license: licenseCourse.target }; licenseMessage = `Ukończono kurs ${licenseCourse.target}. Nowa licencja jest aktywna.`; courseHistory.push(`${game.date} — Ukończono kurs ${licenseCourse.target}.`); licenseCourse = undefined; } else licenseCourse = { ...licenseCourse, weeksRemaining: remaining }; }
    const halfway = game.round === Math.ceil(finalRound / 2); let winterEvaluatedRound = game.winterEvaluatedRound; let finalInbox = inbox; let evaluatedProgress = progress;
    if (halfway && winterEvaluatedRound !== game.round) {
      winterEvaluatedRound = game.round; evaluatedProgress = progress.map((goal) => ({ ...goal, winterProgress: goal.progress }));
      const summary = evaluatedProgress.map((goal) => `${goal.label}: ${goal.progress}/${goal.target}`).join(" • ");
      finalInbox = [{ id: `winter-${game.season}`, category: "Ewaluacja", title: "Zimowa ocena celów", body: `${summary}. To zapis postępu, nie automatyczne zaliczenie. Wiosną nadal możesz domknąć oba cele.`, choices: [{ id: "ack", label: "Przyjmuję ocenę i planuję wiosnę", feedback: "Ocena zimowa została zapisana. Zarząd wróci do celów po ostatniej kolejce.", effects: {} }], resolved: false }, ...finalInbox];
    }
    const careerStats = { ...game.careerStats, matches: game.careerStats.matches + 1, wins: game.careerStats.wins + (result === "win" ? 1 : 0), draws: game.careerStats.draws + (result === "draw" ? 1 : 0), losses: game.careerStats.losses + (result === "loss" ? 1 : 0) };
    setGame({ ...game, seed, coach, teams, fixtures, round: newRound, date: nextDate, matchState: { ...match, minute: 90, completed: true }, pressures: nextPressures, burnout: Math.max(0, Math.min(100, game.burnout + weeklyBurnout)), lastBurnoutChange: weeklyBurnout, players: updatedPlayers, training: { ...game.training, readiness: Math.max(50, Math.min(game.environment.readinessCap, 54 + Math.round(game.coach.skills.analysis / 8))), completedRound: null }, finances: { ...game.finances, personalFunds: game.finances.personalFunds + Math.round(game.finances.monthlySalary / 4) }, licenseCourse, licenseMessage, developmentGoals: evaluatedProgress, seasonEvidence: evidence, history: [...injuryHistory, ...courseHistory, `${match.fixture.date} — ${score}.`, ...game.history].slice(0, 80), inbox: finalInbox, winterEvaluatedRound, careerStats, newSeasonPending: endSeason });
  };

  const resolveDecision = (eventId: string, choiceId: string) => {
    if (!game) return; const event = game.inbox.find((item) => item.id === eventId && !item.resolved); const choice = event?.choices.find((item) => item.id === choiceId); if (!event || !choice) return; const effects = choice.effects; const pressures = { ...game.pressures };
    for (const [key, value] of Object.entries(effects.pressures ?? {})) pressures[key] = Math.max(0, Math.min(100, (pressures[key] ?? 0) + value));
    const players = game.players.map((player) => ({ ...player, morale: Math.max(0, Math.min(100, player.morale + (effects.teamMorale ?? 0))), fatigue: Math.max(0, Math.min(100, player.fatigue + (effects.teamFatigue ?? 0))), relation: Math.max(0, Math.min(100, player.relation + (effects.relation ?? 0))) }));
    const positivePeople = !["Kontrakt", "Archiwum", "Ewaluacja"].includes(event.category) && (effects.pressures?.dressing ?? 0) <= 0; const evidence = { ...game.seasonEvidence, positiveDecisions: positivePeople && !game.seasonEvidence.positiveDecisions.includes(event.id) ? [...game.seasonEvidence.positiveDecisions, event.id] : game.seasonEvidence.positiveDecisions };
    setGame({ ...game, coach: { ...game.coach, reputation: Math.max(0, Math.min(100, game.coach.reputation + (effects.reputation ?? 0))) }, pressures, burnout: Math.max(0, Math.min(100, game.burnout + (effects.burnout ?? 0))), players, training: { ...game.training, readiness: capReadiness(game.training.readiness, effects.readiness ?? 0, game.environment.readinessCap) }, inbox: game.inbox.map((item) => item.id === event.id ? { ...item, resolved: true } : item), history: [`${game.date} — ${choice.feedback}`, ...game.history].slice(0, 40), seasonEvidence: evidence, developmentGoals: game.developmentGoals.map((goal) => goal.id === "people" && positivePeople ? { ...goal, progress: Math.min(goal.target, evidence.positiveDecisions.length) } : goal) });
  };

  const startSeason = (base: GameState, pending: NonNullable<GameState["pendingSeason"]>, offerId?: string) => {
    const offer = offerId ? base.jobOffers.find((item) => item.id === offerId) : undefined; const forcedPack = offer ? LEAGUE_PACKS.find((pack) => pack.id === offer.packId) : undefined; const tier = offer?.tier ?? pending.targetTier; const clubName = offer?.clubName ?? base.club.name;
    let seed = base.seed; let players = base.players; let squadNotes: string[] = [];
    if (offer) { const generated = makePlayers(seed, TIER_OVR[tier] ?? 42, `club${pending.year}`); players = generated.players; seed = generated.seed; squadNotes = [`Nowy klub: przejęto kadrę ${clubName}.`]; }
    else { const evolved = evolveSquad(players, seed, tier, pending.year); players = evolved.players; seed = evolved.seed; squadNotes = [`Przerwa między sezonami: wypalenie ${base.burnout}% → ${offseasonBurnout(base.burnout)}%.`, ...(evolved.retired.length ? [`Emerytury zawodników: ${evolved.retired.join(", ")}.`] : []), ...(evolved.graduates.length ? [`Do kadry weszli juniorzy: ${evolved.graduates.join(", ")}.`] : []), ...(evolved.changes.length ? [`Zmiany Base OVR: ${evolved.changes.slice(0, 8).join(", ")}${evolved.changes.length > 8 ? "…" : ""}.`] : [])]; }
    const working = { ...base, seed, players, club: { ...base.club, name: clubName } }; const league = buildLeagueForSeason(working, tier, pending.year, clubName, forcedPack); const environment = environmentForTier(tier); const assignments = selectBestLineup(players, FORMATIONS[base.tactic.formation]); const presidentUpdate = offer ? makePresident(league.seed, tier) : { seed: league.seed, president: base.president, presidentName: base.presidentName };
    const required = requiredLicenseForTier(tier) as License; let licenseCourse = base.licenseCourse; let licenseMessage = base.licenseMessage;
    if (!licenseCoversTier(base.coach.license, tier) && !licenseCourse) {
      const course = (Object.keys(LICENSE_CHALLENGES) as License[]).find((license) => license === required) ?? required;
      const details = course === "UEFA B" ? 20 : course === "UEFA A" ? 28 : 40;
      licenseCourse = { target: course, weeksRemaining: details, totalWeeks: details, funding: "club" };
      licenseMessage = `${environment.label} wymaga ${required}. Klub uruchomił finansowany kurs; obowiązuje warunkowe dopuszczenie na czas nauki.`;
    }
    const clubs = base.careerStats.clubs.includes(clubName) ? base.careerStats.clubs : [...base.careerStats.clubs, clubName];
    setGame({ ...base, seed: presidentUpdate.seed, club: league.club, teams: league.teams, fixtures: league.fixtures, players, coach: base.coach, environment, careerChallenge: LICENSE_CHALLENGES[base.coach.license], season: `${pending.year}/${String(pending.year + 1).slice(-2)}`, date: `${pending.year}-07-13`, round: 1, tactic: { ...base.tactic, assignments }, training: { ...base.training, readiness: Math.min(environment.readinessCap, 60), completedRound: null }, matchState: undefined, newSeasonPending: false, winterEvaluatedRound: undefined, burnout: offseasonBurnout(base.burnout), lastBurnoutChange: -Math.max(0, base.burnout - offseasonBurnout(base.burnout)), developmentGoals: [], seasonEvidence: { formationsWithPoints: [], youthStarters: [], analysisRounds: [], tacticalRounds: [], pressureRounds: [], positiveDecisions: [] }, employmentStatus: "employed", jobOffers: [], pendingSeason: undefined, licenseCourse, licenseMessage, president: presidentUpdate.president, presidentName: presidentUpdate.presidentName, careerStats: { ...base.careerStats, clubs, highestTier: Math.min(base.careerStats.highestTier, tier) }, history: [...squadNotes, `Start sezonu ${pending.year}/${String(pending.year + 1).slice(-2)}: ${clubName}, ${environment.label}.`, ...base.history].slice(0, 80) }); setSelectedGoals([]); go("goals");
  };

  const beginNextSeason = () => {
    if (!game?.newSeasonPending || game.careerEnded) return; const table = sortedTable(game.teams); const place = table.findIndex((team) => team.id === game.club.id) + 1; const userTeam = game.teams.find((team) => team.id === game.club.id) as Team; const targetTier = place === 1 ? Math.max(1, game.club.tier - 1) : place >= table.length - 1 ? Math.min(10, game.club.tier + 1) : game.club.tier; const outcome = targetTier < game.club.tier ? "awans" as const : targetTier > game.club.tier ? "spadek" as const : "utrzymanie" as const; const nextYear = Number(game.season.slice(0, 4)) + 1; const completed = game.developmentGoals.filter((goal) => goal.progress >= goal.target); const skillMap: Record<string, string> = { tactics: "tactics", motivation: "motivation", people: "people", analysis: "analysis", pressure: "pressure", adaptability: "adaptability", youth: "youth" }; const skills = { ...game.coach.skills };
    for (const goal of completed) { const skill = skillMap[goal.id]; if (skill) skills[skill] = Math.min(100, skills[skill] + 1); }
    const coach = { ...game.coach, age: game.coach.age + 1, skills, reputation: Math.min(100, game.coach.reputation + (completed.some((goal) => goal.id === "reputation") ? 2 : 0)) }; const record = { season: game.season, club: game.club.name, tier: game.club.tier, place, matches: userTeam.played, wins: userTeam.won, draws: userTeam.drawn, losses: userTeam.lost, outcome, goalsCompleted: completed.length };
    const careerStats = { ...game.careerStats, seasons: game.careerStats.seasons + 1, promotions: game.careerStats.promotions + (outcome === "awans" ? 1 : 0), relegations: game.careerStats.relegations + (outcome === "spadek" ? 1 : 0), goalsCompleted: game.careerStats.goalsCompleted + completed.length, highestTier: Math.min(game.careerStats.highestTier, targetTier) }; const pendingSeason = { year: nextYear, targetTier, place, outcome }; const roll = rngNext(game.seed); const fireChance = dismissalProbability({ place, teamCount: table.length, boardPressure: game.pressures.board, patience: game.president.patience, unpredictability: game.president.unpredictability }); const fired = roll.value < fireChance; const goalText = completed.length ? `Zrealizowane cele: ${completed.map((goal) => goal.label).join(", ")}; przyznano powolny rozwój umiejętności.` : "Nie zrealizowano żadnego z dwóch celów; brak automatycznej nagrody.";
    const settled: GameState = { ...game, seed: roll.seed, coach, careerStats, seasonRecords: [...game.seasonRecords, record], pendingSeason, history: [`Koniec sezonu ${game.season}: ${place}. miejsce, ${outcome}. ${goalText}`, ...game.history].slice(0, 80) };
    if (fired) { const offers = generateJobOffers(settled, settled.seed); const unfair = place <= Math.ceil(table.length / 2); const reputationLoss = unfair ? 1 : 4; setGame({ ...settled, seed: offers.seed, coach: { ...coach, reputation: Math.max(0, coach.reputation - reputationLoss) }, employmentStatus: "unemployed", jobOffers: offers.offers, history: [`${game.presidentName} zakończył współpracę. ${unfair ? "Dobre wyniki ograniczyły stratę reputacji." : "Rynek ocenia również słabą pozycję i presję."}`, ...settled.history] }); go("jobs"); return; }
    startSeason(settled, pendingSeason);
  };
  const acceptJob = (offerId: string) => { if (!game?.pendingSeason || game.employmentStatus !== "unemployed") return; startSeason(game, game.pendingSeason, offerId); };
  const retireCareer = () => { if (!game || game.coach.age < 65) return; setGame({ ...game, employmentStatus: "retired", careerEnded: true, history: [`${game.date} — ${game.coach.name} zakończył karierę trenerską z własnej decyzji.`, ...game.history] }); go("career"); };
  const confirmNewSeasonGoals = () => { if (!game || selectedGoals.length !== 2) return; setGame({ ...game, developmentGoals: DEVELOPMENT_GOALS.filter((goal) => selectedGoals.includes(goal.id)).map((goal) => ({ ...goal, progress: 0 })) }); go("dashboard"); };

  if (screen === "start") return <StartScreen hasSave={hasSave} onNew={() => go("creator")} onLoad={loadGame} />;
  if (screen === "creator") return <Creator draft={draft} setDraft={setDraft} onNext={startClubStep} onBack={() => go("start")} />;
  if (screen === "club") return <ClubPicker draft={draft} associations={associations} districts={districts} packs={packs} pack={selectedPack} selectedAssociation={selectedAssociation} selectedDistrict={selectedDistrict} selectedPackId={selectedPackId} selectedClub={selectedClub} onAssociation={chooseAssociation} onDistrict={chooseDistrict} onPack={choosePack} onClub={setSelectedClub} onBack={() => go("creator")} onNext={() => go("goals")} />;
  if (screen === "goals") return <GoalPicker selected={selectedGoals} setSelected={setSelectedGoals} season={game?.season ?? "2026/27"} onBack={() => go(game ? "dashboard" : "club")} onConfirm={game ? confirmNewSeasonGoals : finalizeCareer} />;
  if (!game) return <StartScreen hasSave={hasSave} onNew={() => go("creator")} onLoad={loadGame} />;
  return <GameShell game={game} screen={screen} go={go} menuOpen={menuOpen} setMenuOpen={setMenuOpen} saveNow={saveNow} savedPulse={savedPulse}>{screen === "dashboard" && <Dashboard game={game} go={go} resolveDecision={resolveDecision} prepareMatch={prepareMatch} beginNextSeason={beginNextSeason} />}{screen === "squad" && <Squad game={game} setGame={setGame} />}{screen === "tactics" && <Tactics game={game} setGame={setGame} />}{screen === "training" && <Training game={game} setGame={setGame} applyTraining={applyTraining} />}{screen === "match" && <Match game={game} go={go} advanceMatch={advanceMatch} prepareMatch={prepareMatch} changeLiveInstruction={changeLiveInstruction} />}{screen === "table" && <TableScreen game={game} />}{screen === "jobs" && <Jobs game={game} acceptJob={acceptJob} />}{screen === "career" && <Career game={game} setGame={setGame} retireCareer={retireCareer} />}</GameShell>;
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
  const legacyBurnout = typeof parsed.lastBurnoutChange !== "number";
  const burnoutCeilingForLegacySave = Math.max(18, 8 + Math.max(0, (parsed.round ?? 1) - 1) * 2);
  const seasonYear = Number(parsed.season?.slice(0, 4)) || 2026; const canonicalSchedule = buildSchedule((parsed.teams ?? []).map((team) => team.id), seasonYear, parsed.club?.tier ?? 9);
  const fixtures = (parsed.fixtures ?? []).map((fixture) => ({ ...fixture, date: fixture.date ?? canonicalSchedule.find((item) => item.round === fixture.round && item.home === fixture.home && item.away === fixture.away)?.date ?? `${seasonYear}-08-08` }));
  const currentScheduledDate = fixtures.find((fixture) => fixture.round === parsed.round && (fixture.home === parsed.club.id || fixture.away === parsed.club.id))?.date;
  const played = parsed.teams?.find((team) => team.id === parsed.club.id);
  const careerStats = parsed.careerStats ?? { seasons: 0, matches: played?.played ?? 0, wins: played?.won ?? 0, draws: played?.drawn ?? 0, losses: played?.lost ?? 0, promotions: 0, relegations: 0, goalsCompleted: 0, highestTier: parsed.club.tier, clubs: [parsed.club.name] };
  return {
    ...parsed,
    build: BUILD,
    coach: { ...parsed.coach, license },
    environment,
    careerChallenge,
    worldHumor: parsed.worldHumor ?? environment.humorBase,
    fixtures,
    date: currentScheduledDate ?? parsed.date ?? `${seasonYear}-07-13`,
    matchState: parsed.matchState ? { ...parsed.matchState, fixture: fixtures.find((fixture) => fixture.round === parsed.matchState?.fixture.round && fixture.home === parsed.matchState?.fixture.home && fixture.away === parsed.matchState?.fixture.away) ?? { ...parsed.matchState.fixture, date: parsed.matchState.fixture.date ?? parsed.date } } : undefined,
    licenseCourse,
    burnout: legacyBurnout ? Math.min(parsed.burnout ?? 8, burnoutCeilingForLegacySave) : parsed.burnout ?? 8,
    lastBurnoutChange: parsed.lastBurnoutChange ?? 0,
    players: (parsed.players ?? []).map((player) => ({ ...player, injuryWeeks: player.injuryWeeks ?? 0 })),
    seasonEvidence: parsed.seasonEvidence ?? { formationsWithPoints: [], youthStarters: [], analysisRounds: [], tacticalRounds: [], pressureRounds: [], positiveDecisions: [] },
    developmentGoals: (parsed.developmentGoals ?? []).map((goal) => { const canonical = DEVELOPMENT_GOALS.find((item) => item.id === goal.id); return canonical ? { ...canonical, progress: Math.min(canonical.target, goal.progress ?? 0) } : goal; }),
    inbox: (parsed.inbox ?? []).map((item) => legacyIssue(item)),
    squadPolicy: POLICY_EFFECTS[parsed.squadPolicy] ? parsed.squadPolicy : "BALANCED",
    training: { focus: parsed.training?.focus ?? "Taktyka", intensity: parsed.training?.intensity ?? "Normalna", recovery: parsed.training?.recovery ?? true, readiness: Math.min(environment.readinessCap, parsed.training?.readiness ?? 60), completedRound: parsed.training?.completedRound ?? (trainedToday ? parsed.round : null) },
    finances: parsed.finances ?? { monthlySalary: Math.max(1800, 14000 - parsed.club.tier * 1200), personalFunds: 9000 },
    employmentStatus: parsed.employmentStatus ?? "employed",
    jobOffers: parsed.jobOffers ?? [],
    careerEnded: parsed.careerEnded ?? false,
    careerStats,
    seasonRecords: parsed.seasonRecords ?? [],
    history,
  };
}

function instructionImpact(field: "mentality" | "pressing", value: string) {
  if (field === "mentality") return value === "Ofensywna" ? .35 : value === "Defensywna" ? -.15 : 0;
  return value === "Bardzo wysoki" ? .65 : value === "Wysoki" ? .45 : value === "Niski" ? -.1 : 0;
}
