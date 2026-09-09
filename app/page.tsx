"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BUILD, DEVELOPMENT_GOALS, effectiveOVR, FORMATIONS, GameState, LEAGUE_PACKS,
  License, CoachProfile, POLICY_EFFECTS, SAVE_KEY, Screen, Team, Fixture, LICENSE_CHALLENGES, TIER_OVR,
  buildMatchStrength, buildSchedule, capReadiness, defaultMicrocycle, diagnoseMatchOutcome, dismissalProbability, environmentForPack, evaluateMicrocycle, goalSatisfied, highestEligibleCoachingExperience, highestEligibleStartingLicense, injuryRiskFromFatigue, licenseCoversCompetition, licenseCoversTier, naturalRecoveryForGap, normalizeStartingLicense, offseasonBurnout, positionPenalty, pressureDeltaForResult, requiredLicenseForCompetition, requiredLicenseForTier, rngNext, selectBestLineup, selectLineupForPlan, simulateMatchPlan, sortedTable, startingLicenseEligibility, TEAM_PLANS, teamLiveStrength, updateTeamResult, weeklyBurnoutDelta,
} from "./game-data";
import type { Coach, LeaguePack } from "./game-data";
import { buildLeagueForSeason, createGame, currentFixture, environmentIncident, evolveSquad, generateJobOffers, makePlayers, makePresident, skillSet, teamForId } from "./game-engine";
import { describeResolvedEffects, generateRoundIssues, legacyIssue, resolveIssueEffects } from "../lib/career-events.mjs";
import { ClubPicker, Creator, GoalPicker, StartScreen } from "./setup-screens";
import type { CoachDraft } from "./setup-screens";
import { CareerV14 as Career, GameShell, Jobs, TableScreenV14 as TableScreen, Training } from "./game-screens";
import { DashboardV15 as Dashboard, MatchV15 as Match, SquadV15 as Squad, TacticsV15 as Tactics } from "./gameplay-screens";
import { createWorldSnapshot, evolveWorldSnapshot, simulateWorldToDate } from "../lib/world-engine.mjs";

const COMPETITION_ORDER = ["Ekstraklasa", "I liga", "II liga", "III liga", "IV liga", "V liga", "Klasa okręgowa", "Klasa A", "Klasa B", "Klasa C"];
const REGION_ASSOCIATION: Record<string, string> = {
  Dolnośląskie: "Dolnośląski ZPN", "Kujawsko-pomorskie": "Kujawsko-Pomorski ZPN", Lubelskie: "Lubelski ZPN", Lubuskie: "Lubuski ZPN",
  Łódzkie: "Łódzki ZPN", Małopolskie: "Małopolski ZPN", Mazowieckie: "Mazowiecki ZPN", Opolskie: "Opolski ZPN",
  Podkarpackie: "Podkarpacki ZPN", Podlaskie: "Podlaski ZPN", Pomorskie: "Pomorski ZPN", Śląskie: "Śląski ZPN",
  Świętokrzyskie: "Świętokrzyski ZPN", "Warmińsko-mazurskie": "Warmińsko-Mazurski ZPN", Wielkopolskie: "Wielkopolski ZPN", Zachodniopomorskie: "Zachodniopomorski ZPN",
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [game, setGame] = useState<GameState | null>(null);
  const [hasSave, setHasSave] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
  const [draft, setDraft] = useState<CoachDraft>({ name: "Piotr Szulik", age: 35, region: "Śląskie", playingExperience: "Amator", coachingExperience: "Debiutant", profile: "Mentor" as CoachProfile, license: "Grassroots C" as License, psychAnswers: {} });
  const [selectedAssociation, setSelectedAssociation] = useState("Podkarpacki ZPN");
  const [selectedCompetition, setSelectedCompetition] = useState("Klasa B");
  const [selectedDistrict, setSelectedDistrict] = useState("Jarosław");
  const [selectedPackId, setSelectedPackId] = useState("podkarpacka-b-jaroslaw");
  const [selectedClub, setSelectedClub] = useState("Łazowianka Łazy");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHasSave(Boolean(localStorage.getItem(SAVE_KEY))));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => { if (game) localStorage.setItem(SAVE_KEY, JSON.stringify(game)); }, [game]);

  const competitionOptions = useMemo(() => COMPETITION_ORDER.filter((competition) => LEAGUE_PACKS.some((pack) => pack.competition === competition)).map((competition) => ({ competition, available: licenseCoversCompetition(draft.license, competition), required: requiredLicenseForCompetition(competition) })), [draft.license]);
  const eligiblePacks = useMemo(() => LEAGUE_PACKS.filter((pack) => licenseCoversCompetition(draft.license, pack.competition)), [draft.license]);
  const competitionPacks = useMemo(() => eligiblePacks.filter((pack) => pack.competition === selectedCompetition), [eligiblePacks, selectedCompetition]);
  const associations = useMemo(() => [...new Set(competitionPacks.map((pack) => pack.association))].sort((a, b) => a.localeCompare(b, "pl")), [competitionPacks]);
  const associationPacks = useMemo(() => competitionPacks.filter((pack) => pack.association === selectedAssociation), [competitionPacks, selectedAssociation]);
  const districts = useMemo(() => selectedAssociation === "PZPN — rozgrywki centralne" ? [] : [...new Set(associationPacks.map((pack) => pack.district).filter((district) => !["Polska", "województwo"].includes(district)))].sort((a, b) => a.localeCompare(b, "pl")), [associationPacks, selectedAssociation]);
  const packs = useMemo(() => associationPacks.filter((pack) => !districts.length || pack.district === selectedDistrict), [associationPacks, districts, selectedDistrict]);
  const selectedPack = eligiblePacks.find((pack) => pack.id === selectedPackId) ?? packs[0];
  const go = (next: Screen) => { const destination = next === "tactics" ? "squad" : next; if (destination === "match" && game?.matchState?.completed && game.matchState.fixture.round < game.round) setGame({ ...game, matchState: undefined }); setScreen(destination); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const loadGame = () => {
    try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return; const parsed = migrateGame(JSON.parse(raw)); if (!parsed.coach || !parsed.club || !Array.isArray(parsed.fixtures)) throw new Error("invalid save"); setGame(parsed); go(parsed.matchState && !parsed.matchState.completed ? "match" : "dashboard"); }
    catch { localStorage.removeItem(SAVE_KEY); setHasSave(false); }
  };

  const startClubStep = () => {
    const available = LEAGUE_PACKS.filter((pack) => licenseCoversCompetition(draft.license, pack.competition));
    const bestTier = Math.min(...available.map((pack) => pack.tier)); const preferredAssociation = REGION_ASSOCIATION[draft.region];
    const first = available.find((pack) => pack.tier === bestTier && pack.association === preferredAssociation) ?? available.find((pack) => pack.tier === bestTier) ?? available[0];
    setSelectedCompetition(first.competition); setSelectedAssociation(first.association); setSelectedDistrict(first.district); setSelectedPackId(first.id); setSelectedClub(first.teams[0]); go("club");
  };
  const chooseCompetition = (value: string) => { const available = eligiblePacks.filter((pack) => pack.competition === value); const preferredAssociation = REGION_ASSOCIATION[draft.region]; const first = available.find((pack) => pack.association === preferredAssociation) ?? available[0]; setSelectedCompetition(value); setSelectedAssociation(first.association); setSelectedDistrict(first.district); setSelectedPackId(first.id); setSelectedClub(first.teams[0]); };
  const chooseAssociation = (value: string) => { const first = eligiblePacks.find((pack) => pack.competition === selectedCompetition && pack.association === value) as LeaguePack; setSelectedAssociation(value); setSelectedDistrict(first.district); setSelectedPackId(first.id); setSelectedClub(first.teams[0]); };
  const chooseDistrict = (value: string) => { const first = eligiblePacks.find((pack) => pack.competition === selectedCompetition && pack.association === selectedAssociation && pack.district === value) as LeaguePack; setSelectedDistrict(value); setSelectedPackId(first.id); setSelectedClub(first.teams[0]); };
  const choosePack = (value: string) => { const pack = eligiblePacks.find((item) => item.id === value) as LeaguePack; setSelectedPackId(value); setSelectedClub(pack.teams[0]); };

  const finalizeCareer = () => {
    if (!selectedPack || selectedGoals.length !== 2) return;
    const credibleExperience = highestEligibleCoachingExperience(draft.age, draft.playingExperience);
    const coachingExperience = startingLicenseEligibility("Grassroots C", draft.playingExperience, draft.coachingExperience, draft.age).eligible ? draft.coachingExperience : credibleExperience;
    const startingLicense = startingLicenseEligibility(draft.license, draft.playingExperience, coachingExperience, draft.age).eligible ? draft.license : highestEligibleStartingLicense(draft.playingExperience, coachingExperience, draft.age) as License;
    const derived = skillSet(draft.profile, draft.playingExperience, coachingExperience); const coach: Coach = { name: draft.name, age: draft.age, region: draft.region, playingExperience: draft.playingExperience, coachingExperience, profile: draft.profile, license: startingLicense, ...derived };
    setGame(createGame(coach, selectedPack, selectedClub, selectedGoals)); go("dashboard");
  };
  const saveNow = () => { if (!game) return; localStorage.setItem(SAVE_KEY, JSON.stringify(game)); setHasSave(true); setSavedPulse(true); window.setTimeout(() => setSavedPulse(false), 1400); };

  const applyTraining = () => {
    if (!game || game.employmentStatus !== "employed" || game.careerEnded || game.training.completedRound === game.round) return;
    const effect = evaluateMicrocycle(game.training.sessions);
    const fixture = currentFixture(game);
    const previousDate = game.matchState?.completed ? game.matchState.fixture.date : game.date;
    const gapDays = fixture ? daysBetween(previousDate, fixture.date) : 7;
    const naturalRecovery = naturalRecoveryForGap(gapDays, game.club.tier);
    const summary = game.training.sessions.map((session) => `${session.day} ${session.focus} (${session.intensity.toLowerCase()})`).join(" • ");
    const players = game.players.map((player) => {
      const recovered = Math.max(0, player.fatigue - naturalRecovery - ((player.injuryWeeks ?? 0) > 0 ? 3 : 0));
      if ((player.injuryWeeks ?? 0) > 0) return { ...player, fatigue: recovered };
      return { ...player, fatigue: Math.max(0, Math.min(100, recovered + effect.fatigueDelta)), morale: Math.max(0, Math.min(100, player.morale + effect.moraleDelta)), form: Math.max(0, Math.min(100, player.form + effect.formDelta + (player.age <= 21 ? effect.youthFormDelta : 0))) };
    });
    const planned = plannedTactic(game, players);
    setGame({ ...game, training: { ...game.training, readiness: capReadiness(game.training.readiness, effect.readinessGain, game.environment.readinessCap), completedRound: game.round }, players, tactic: planned.tactic, squadPolicy: planned.policy, history: [`${game.date} — Mikrocykl kolejki ${game.round}: regeneracja naturalna −${naturalRecovery} zmęczenia, następnie ${game.training.sessions.length} sesji: ${summary}.`, ...game.history].slice(0, 80) });
    go("dashboard");
  };

  const prepareMatch = () => {
    if (!game || game.employmentStatus !== "employed" || game.careerEnded) return; const fixture = currentFixture(game); if (!fixture) return;
    if (game.training.completedRound !== game.round) { go("training"); return; }
    const incident = environmentIncident(game);
    const unavailable = new Set(incident.unavailableIds);
    const players = game.players.map((player) => unavailable.has(player.id) ? { ...player, absenceRounds: Math.max(1, player.absenceRounds ?? 0), absenceReason: incident.absenceReason } : player);
    const planned = plannedTactic(game, players);
    const tactic = planned.tactic;
    const homeTeam = teamForId(game, fixture.home) as Team; const awayTeam = teamForId(game, fixture.away) as Team; const userHome = fixture.home === game.club.id; const slots = FORMATIONS[tactic.formation];
    const selectedPlayers = slots.map((slot) => players.find((item) => item.id === tactic.assignments[slot]));
    const squadRating = slots.reduce((sum, slot) => { const player = players.find((item) => item.id === tactic.assignments[slot]); return sum + (player ? effectiveOVR(player, slot) : 1); }, 0) / 11;
    const averageCondition = selectedPlayers.length ? selectedPlayers.reduce((sum, player) => sum + (player ? 100 - player.fatigue : 0), 0) / selectedPlayers.length : 0;
    const policy = POLICY_EFFECTS[planned.policy] ?? POLICY_EFFECTS.BALANCED;
    const strength = buildMatchStrength({ lineupOVR: squadRating, readiness: game.training.readiness, coachTactics: game.coach.skills.tactics, averageCondition, tactic, policyStrength: policy.matchStrength, burnout: game.burnout, incidentPenalty: incident.penalty });
    const opponent = userHome ? awayTeam : homeTeam; const opponentStrength = teamLiveStrength(opponent); const userStrength = strength.total;
    const homeStrength = userHome ? userStrength : opponentStrength; const awayStrength = userHome ? opponentStrength : userStrength; const simulation = simulateMatchPlan(incident.seed, homeStrength, awayStrength, homeTeam.name, awayTeam.name); const plannedEvents = incident.text ? [{ minute: 1, text: incident.text, kind: "info" as const, side: "neutral" as const }, ...simulation.events] : simulation.events;
    const factorLabels: Record<string, string> = { lineup: "Automatyczna XI", preparation: "Przygotowanie", coach: "Warsztat trenera", plan: "Spójność planu", policy: "Plan drużyny", burnout: "Wypalenie", incident: "Zdarzenie losowe" };
    const userStrengthFactors = Object.entries(strength.factors).map(([key, value]) => ({ label: factorLabels[key] ?? key, value }));
    setGame({ ...game, players, tactic, squadPolicy: planned.policy, date: fixture.date, seed: simulation.seed, matchState: { fixture, minute: 0, homeGoals: simulation.homeGoals, awayGoals: simulation.awayGoals, plannedEvents, shotsHome: simulation.shotsHome, shotsAway: simulation.shotsAway, possessionHome: simulation.possessionHome, homeStrength, awayStrength, homeXg: simulation.homeXg, awayXg: simulation.awayXg, expectedHomeWin: simulation.expected.home, expectedDraw: simulation.expected.draw, expectedAwayWin: simulation.expected.away, userStrengthFactors, completed: false, preparationReadiness: game.training.readiness, preMatchPressure: Math.max(...Object.values(game.pressures)), analysisAttempted: false } }); go("match");
  };

  const changeLiveInstruction = (field: "mentality" | "pressing", value: string) => {
    if (!game) return;
    const tactic = { ...game.tactic, [field]: value }; const match = game.matchState;
    if (!match || match.completed) { setGame({ ...game, tactic }); return; }
    const oldImpact = instructionImpact(field, game.tactic[field]); const newImpact = instructionImpact(field, value); const difference = newImpact - oldImpact; const userHome = match.fixture.home === game.club.id; const homeStrength = (match.homeStrength ?? teamForId(game, match.fixture.home)?.ovr ?? 40) + (userHome ? difference : 0); const awayStrength = (match.awayStrength ?? teamForId(game, match.fixture.away)?.ovr ?? 40) + (userHome ? 0 : difference); const homeName = teamForId(game, match.fixture.home)?.name; const awayName = teamForId(game, match.fixture.away)?.name; const simulation = simulateMatchPlan(game.seed, homeStrength, awayStrength, homeName, awayName); const pastEvents = match.plannedEvents.filter((event) => event.minute <= match.minute); const futureEvents = simulation.events.filter((event) => event.minute > match.minute); const plannedEvents = [...pastEvents, ...futureEvents].sort((a, b) => a.minute - b.minute); const homeGoals = plannedEvents.filter((event) => event.kind === "goal" && event.side === "home").length; const awayGoals = plannedEvents.filter((event) => event.kind === "goal" && event.side === "away").length;
    const dangerousHome = plannedEvents.filter((event) => event.side === "home" && ["goal", "chance"].includes(event.kind)).length; const dangerousAway = plannedEvents.filter((event) => event.side === "away" && ["goal", "chance"].includes(event.kind)).length;
    const currentHomeGoals = match.plannedEvents.filter((event) => event.minute <= match.minute && event.kind === "goal" && event.side === "home").length; const currentAwayGoals = match.plannedEvents.filter((event) => event.minute <= match.minute && event.kind === "goal" && event.side === "away").length; const currentBalance = userHome ? currentHomeGoals - currentAwayGoals : currentAwayGoals - currentHomeGoals; const startsAnalysis = match.minute >= 30 && !match.analysisAttempted;
    const userStrengthFactors = match.userStrengthFactors?.map((factor) => factor.label === "Spójność planu" ? { ...factor, value: Number((factor.value + difference).toFixed(2)) } : factor);
    setGame({ ...game, seed: simulation.seed, tactic, matchState: { ...match, plannedEvents, homeGoals, awayGoals, shotsHome: Math.max(dangerousHome, simulation.shotsHome), shotsAway: Math.max(dangerousAway, simulation.shotsAway), possessionHome: simulation.possessionHome, homeStrength, awayStrength, homeXg: simulation.homeXg, awayXg: simulation.awayXg, expectedHomeWin: simulation.expected.home, expectedDraw: simulation.expected.draw, expectedAwayWin: simulation.expected.away, userStrengthFactors, analysisAttempted: match.analysisAttempted || startsAnalysis, analysisStartBalance: startsAnalysis ? currentBalance : match.analysisStartBalance }, pressures: { ...game.pressures, personal: Math.min(100, game.pressures.personal + (value === "Ofensywna" || value === "Bardzo wysoki" ? 2 : 0)) } });
  };

  const advanceMatch = () => {
    if (!game?.matchState || game.matchState.completed) return; const minute = Math.min(90, game.matchState.minute + 15); if (minute < 90) { setGame({ ...game, matchState: { ...game.matchState, minute } }); return; }
    const match = game.matchState; let teams = updateTeamResult(game.teams, match.fixture.home, match.fixture.away, match.homeGoals, match.awayGoals); let seed = game.seed; const fixtures: Fixture[] = game.fixtures.map((fixture) => ({ ...fixture }));
    const roundFixtures = game.fixtures.filter((fixture) => fixture.round === game.round && !(fixture.home === match.fixture.home && fixture.away === match.fixture.away));
    for (const fixture of roundFixtures) { const home = teams.find((team) => team.id === fixture.home) as Team; const away = teams.find((team) => team.id === fixture.away) as Team; const simulation = simulateMatchPlan(seed, teamLiveStrength(home), teamLiveStrength(away), home.name, away.name); seed = simulation.seed; const hg = simulation.homeGoals; const ag = simulation.awayGoals; teams = updateTeamResult(teams, fixture.home, fixture.away, hg, ag); const target = fixtures.find((item) => item.round === fixture.round && item.home === fixture.home && item.away === fixture.away) as Fixture; Object.assign(target, { played: true, homeGoals: hg, awayGoals: ag }); }
    const userTarget = fixtures.find((item) => item.round === match.fixture.round && item.home === match.fixture.home && item.away === match.fixture.away) as Fixture; Object.assign(userTarget, { played: true, homeGoals: match.homeGoals, awayGoals: match.awayGoals });
    const userHome = match.fixture.home === game.club.id; const gf = userHome ? match.homeGoals : match.awayGoals; const ga = userHome ? match.awayGoals : match.homeGoals; const result: "win" | "draw" | "loss" = gf > ga ? "win" : gf === ga ? "draw" : "loss"; const multiplier = game.careerChallenge.pressureMultiplier; const pressureDelta = pressureDeltaForResult(result, multiplier); const newRound = game.round + 1; const finalRound = Math.max(...game.fixtures.map((fixture) => fixture.round)); const endSeason = newRound > finalRound; const nextFixture = fixtures.find((fixture) => fixture.round === newRound && (fixture.home === game.club.id || fixture.away === game.club.id)); const nextDate = nextFixture?.date ?? match.fixture.date;
    const score = `${teamForId(game, match.fixture.home)?.name} ${match.homeGoals}:${match.awayGoals} ${teamForId(game, match.fixture.away)?.name}`; const policy = POLICY_EFFECTS[game.squadPolicy] ?? POLICY_EFFECTS.BALANCED; const starters = new Set(Object.values(game.tactic.assignments)); const tacticLoad = (game.tactic.pressing === "Wysoki" || game.tactic.pressing === "Bardzo wysoki" ? 2 : 0) + (game.tactic.tempo === "Wysokie" ? 1 : 0);
    const worldUpdate = simulateWorldToDate(game.world, match.fixture.date, seed); seed = worldUpdate.seed;
    const nextPressures = Object.fromEntries(Object.entries(game.pressures).map(([key, value]) => { const environmentDelta = key === "media" && pressureDelta > 0 ? Math.round(pressureDelta * game.environment.mediaScale) : pressureDelta; return [key, Math.max(0, Math.min(100, value + environmentDelta + (key === "dressing" && result === "loss" ? 3 : 0)))]; }));
    const unresolvedIssues = game.inbox.filter((item) => !item.resolved).length;
    const issueBatch = generateRoundIssues({ seed, round: game.round, tier: game.club.tier, result, worldHumor: game.worldHumor, recentTitles: game.inbox.map((item) => item.title), recentCategories: game.inbox.map((item) => item.category), maxEvents: Math.max(0, 3 - unresolvedIssues) }); seed = issueBatch.seed; const inbox = [...issueBatch.events, ...game.inbox];
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
    const microcycleEffect = evaluateMicrocycle(game.training.sessions); const weeklyBurnout = weeklyBurnoutDelta({ result, intensity: microcycleEffect.averageIntensity, recovery: microcycleEffect.hasRecovery, policyBurnout: policy.burnout, pressure: match.preMatchPressure ?? Math.max(...Object.values(game.pressures)), profile: game.coach.profile });
    const injuryHistory: string[] = []; const updatedPlayers = game.players.map((player) => {
      const absenceRounds = Math.max(0, (player.absenceRounds ?? 0) - 1);
      const absenceReason = absenceRounds > 0 ? player.absenceReason : undefined;
      if ((player.injuryWeeks ?? 0) > 0) return { ...player, injuryWeeks: Math.max(0, (player.injuryWeeks ?? 0) - 1), fatigue: Math.max(0, player.fatigue - 6), absenceRounds, absenceReason };
      const starter = starters.has(player.id); const fatigue = Math.max(0, Math.min(100, player.fatigue + (starter ? 8 + policy.fatigue + tacticLoad : -2))); let injuryWeeks = 0;
      if (starter) { const injuryRoll = rngNext(seed); seed = injuryRoll.seed; if (injuryRoll.value < injuryRiskFromFatigue(fatigue, microcycleEffect.averageIntensity)) { const durationRoll = rngNext(seed); seed = durationRoll.seed; injuryWeeks = 1 + Math.floor(durationRoll.value * 3); injuryHistory.push(`${game.date} — ${player.name}: uraz przeciążeniowy, przerwa ${injuryWeeks} tyg.`); } }
      return {
        ...player,
        fatigue,
        injuryWeeks,
        absenceRounds,
        absenceReason,
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
    const userShots = userHome ? match.shotsHome : match.shotsAway; const opponentShots = userHome ? match.shotsAway : match.shotsHome; const preparation = match.preparationReadiness ?? game.training.readiness; const slots = FORMATIONS[game.tactic.formation]; const mismatches = slots.filter((slot) => { const player = game.players.find((item) => item.id === game.tactic.assignments[slot]); return !player || positionPenalty(player, slot) > .04; }).length; const afterStarters = updatedPlayers.filter((player) => starters.has(player.id)); const averageConditionAfter = afterStarters.length ? Math.round(afterStarters.reduce((sum, player) => sum + (100 - player.fatigue), 0) / afterStarters.length) : 0;
    const positives: string[] = []; const warnings: string[] = [];
    if (result === "win") positives.push("Wynik został dowieziony — morale wyjściowej XI wzrosło.");
    if (preparation >= 72) positives.push(`Mikrocykl dał ${preparation}% gotowości i realnie wsparł plan meczu.`);
    if (userShots > opponentShots) positives.push(`Zespół stworzył więcej strzałów: ${userShots}–${opponentShots}.`);
    if (analysisImproved) positives.push("Zmiana po 30. minucie poprawiła bilans wyniku i zaliczyła postęp celu „Analiza”.");
    if (averageConditionAfter < 65) warnings.push(`Kondycja XI spadła do ${averageConditionAfter}%. Przed kolejnym meczem potrzebna jest rotacja lub regeneracja.`);
    if (preparation < 55) warnings.push(`Gotowość ${preparation}% wyraźnie ograniczyła realizację planu.`);
    if (mismatches) warnings.push(`${mismatches} ${mismatches === 1 ? "pozycja była" : "pozycje były"} obsadzone z wyraźną karą dopasowania.`);
    if (game.burnout >= 45) warnings.push(`Wypalenie ${game.burnout}% zabrało część jakości przygotowania trenera.`);
    if (userShots < opponentShots) warnings.push(`Rywal oddał więcej strzałów: ${opponentShots}–${userShots}.`);
    const expectedDifference = userHome ? (match.homeStrength ?? 0) - (match.awayStrength ?? 0) : (match.awayStrength ?? 0) - (match.homeStrength ?? 0);
    const winChance = userHome ? match.expectedHomeWin ?? .33 : match.expectedAwayWin ?? .33; const drawChance = match.expectedDraw ?? .34; const lossChance = userHome ? match.expectedAwayWin ?? .33 : match.expectedHomeWin ?? .33;
    const userXg = userHome ? match.homeXg ?? 0 : match.awayXg ?? 0; const opponentXg = userHome ? match.awayXg ?? 0 : match.homeXg ?? 0;
    const decisiveFactor = diagnoseMatchOutcome({ result, readiness: preparation, expectedWin: winChance, expectedLoss: lossChance, userGoals: gf, opponentGoals: ga, userXg, opponentXg, userShots, opponentShots });
    const surprise = expectedDifference >= 2 && result === "loss" ? "Porażka mimo roli faworyta" : expectedDifference <= -2 && result === "win" ? "Zwycięstwo ponad przedmeczowe szanse" : result === "win" ? "Zwycięstwo" : result === "draw" ? "Remis" : "Porażka";
    const postMatchReport = { verdict: surprise, summary: `${score}. Przed meczem: wygrana ${Math.round(winChance * 100)}%, remis ${Math.round(drawChance * 100)}%, porażka ${Math.round(lossChance * 100)}%. Przewaga siły ${expectedDifference >= 0 ? "+" : ""}${expectedDifference.toFixed(1)}.`, positives: positives.length ? positives : ["Mecz dostarczył danych do korekty kolejnego mikrocyklu."], warnings: warnings.length ? warnings : ["Brak alarmu kondycyjnego lub pozycyjnego po tym spotkaniu."], boardChange: nextPressures.board - game.pressures.board, burnoutChange: weeklyBurnout, averageCondition: averageConditionAfter, analysisOutcome: match.analysisAttempted ? analysisImproved ? "Korekta skuteczna — postęp celu zaliczony." : "Korekta wykonana, ale bilans wyniku się nie poprawił." : "Brak korekty po 30. minucie — cel „Analiza” bez postępu.", decisiveFactor, winChance, drawChance, lossChance, userXg, opponentXg, strengthFactors: match.userStrengthFactors };
    const careerStats = { ...game.careerStats, matches: game.careerStats.matches + 1, wins: game.careerStats.wins + (result === "win" ? 1 : 0), draws: game.careerStats.draws + (result === "draw" ? 1 : 0), losses: game.careerStats.losses + (result === "loss" ? 1 : 0) };
    const nextPlan = plannedTactic(game, updatedPlayers);
    setGame({ ...game, seed, coach, teams, fixtures, world: worldUpdate.world, worldActivity: worldUpdate.activity, round: newRound, date: nextDate, matchState: { ...match, minute: 90, completed: true, postMatchReport }, tactic: nextPlan.tactic, squadPolicy: nextPlan.policy, pressures: nextPressures, burnout: Math.max(0, Math.min(100, game.burnout + weeklyBurnout)), lastBurnoutChange: weeklyBurnout, players: updatedPlayers, training: { sessions: defaultMicrocycle(game.environment.trainingSessions), readiness: Math.max(50, Math.min(game.environment.readinessCap, 54 + Math.round(game.coach.skills.analysis / 8))), completedRound: null, preset: "BALANCED" }, finances: { ...game.finances, personalFunds: game.finances.personalFunds + Math.round(game.finances.monthlySalary / 4) }, licenseCourse, licenseMessage, developmentGoals: evaluatedProgress, seasonEvidence: evidence, history: [...injuryHistory, ...courseHistory, `${match.fixture.date} — ${score}.`, ...game.history].slice(0, 80), inbox: finalInbox, winterEvaluatedRound, careerStats, newSeasonPending: endSeason });
  };

  const resolveDecision = (eventId: string, choiceId: string) => {
    if (!game) return; const event = game.inbox.find((item) => item.id === eventId && !item.resolved); const choice = event?.choices.find((item) => item.id === choiceId); if (!event || !choice) return;
    const resolved = resolveIssueEffects(game.seed, choice.effects); let seed = resolved.seed; const effects = resolved.effects; const pressures = { ...game.pressures };
    for (const [key, value] of Object.entries(effects.pressures ?? {})) pressures[key] = Math.max(0, Math.min(100, (pressures[key] ?? 0) + value));
    const starters = new Set(Object.values(game.tactic.assignments));
    const relationPool = [...game.players].sort((a, b) => Number(starters.has(b.id)) - Number(starters.has(a.id))); const relationTargets = new Set<string>();
    for (let index = 0; index < Math.min(3, relationPool.length); index += 1) { const roll = rngNext(seed); seed = roll.seed; const player = relationPool.splice(Math.floor(roll.value * relationPool.length), 1)[0]; relationTargets.add(player.id); }
    let players = game.players.map((player) => ({ ...player, morale: Math.max(0, Math.min(100, player.morale + (effects.teamMorale ?? 0))), fatigue: Math.max(0, Math.min(100, player.fatigue + (effects.teamFatigue ?? 0))), relation: relationTargets.has(player.id) ? Math.max(0, Math.min(100, player.relation + (effects.relation ?? 0))) : player.relation }));
    if (effects.unavailable?.count) {
      const selected: string[] = []; const preferred = players.filter((player) => starters.has(player.id) && (player.injuryWeeks ?? 0) <= 0 && (player.absenceRounds ?? 0) <= 0); const reserves = players.filter((player) => !starters.has(player.id) && (player.injuryWeeks ?? 0) <= 0 && (player.absenceRounds ?? 0) <= 0);
      while (selected.length < effects.unavailable.count && (preferred.length || reserves.length)) { const pool = preferred.length ? preferred : reserves; const roll = rngNext(seed); seed = roll.seed; selected.push(pool.splice(Math.floor(roll.value * pool.length), 1)[0].id); }
      const unavailableIds = new Set(selected); players = players.map((player) => unavailableIds.has(player.id) ? { ...player, absenceRounds: effects.unavailable?.rounds ?? 1, absenceReason: effects.unavailable?.reason } : player);
    }
    const positivePeople = !["Kontrakt", "Archiwum", "Ewaluacja"].includes(event.category) && (effects.pressures?.dressing ?? 0) <= 0; const evidence = { ...game.seasonEvidence, positiveDecisions: positivePeople && !game.seasonEvidence.positiveDecisions.includes(event.id) ? [...game.seasonEvidence.positiveDecisions, event.id] : game.seasonEvidence.positiveDecisions };
    const planned = plannedTactic(game, players); const changes = describeResolvedEffects(effects);
    setGame({ ...game, seed, coach: { ...game.coach, reputation: Math.max(0, Math.min(100, game.coach.reputation + (effects.reputation ?? 0))) }, pressures, burnout: Math.max(0, Math.min(100, game.burnout + (effects.burnout ?? 0))), players, tactic: planned.tactic, squadPolicy: planned.policy, training: { ...game.training, readiness: capReadiness(game.training.readiness, effects.readiness ?? 0, game.environment.readinessCap) }, inbox: game.inbox.map((item) => item.id === event.id ? { ...item, resolved: true } : item), lastDecisionOutcome: { title: event.title, choice: choice.label, feedback: choice.feedback, changes: changes.length ? changes : ["Brak natychmiastowej zmiany wskaźników; sprawa zostaje w pamięci świata."] }, history: [`${game.date} — ${choice.feedback}`, ...game.history].slice(0, 40), seasonEvidence: evidence, developmentGoals: game.developmentGoals.map((goal) => goal.id === "people" && positivePeople ? { ...goal, progress: Math.min(goal.target, evidence.positiveDecisions.length) } : goal) });
  };

  const startSeason = (base: GameState, pending: NonNullable<GameState["pendingSeason"]>, offerId?: string) => {
    const offer = offerId ? base.jobOffers.find((item) => item.id === offerId) : undefined; const forcedPack = offer ? LEAGUE_PACKS.find((pack) => pack.id === offer.packId) : undefined; const tier = offer?.tier ?? pending.targetTier; const clubName = offer?.clubName ?? base.club.name;
    let seed = base.seed; let players = base.players; let squadNotes: string[] = [];
    if (offer) { const generated = makePlayers(seed, TIER_OVR[tier] ?? 42, `club${pending.year}`); players = generated.players; seed = generated.seed; squadNotes = [`Nowy klub: przejęto kadrę ${clubName}.`]; }
    else { const evolved = evolveSquad(players, seed, tier, pending.year); players = evolved.players; seed = evolved.seed; squadNotes = [`Przerwa między sezonami: wypalenie ${base.burnout}% → ${offseasonBurnout(base.burnout)}%.`, ...(evolved.retired.length ? [`Emerytury zawodników: ${evolved.retired.join(", ")}.`] : []), ...(evolved.graduates.length ? [`Do kadry weszli juniorzy: ${evolved.graduates.join(", ")}.`] : []), ...(evolved.changes.length ? [`Zmiany Base OVR: ${evolved.changes.slice(0, 8).join(", ")}${evolved.changes.length > 8 ? "…" : ""}.`] : [])]; }
    const working = { ...base, seed, players, club: { ...base.club, name: clubName } }; const league = buildLeagueForSeason(working, tier, pending.year, clubName, forcedPack); const environment = environmentForPack(league.pack); const teamPlan = TEAM_PLANS[base.teamPlan] ? base.teamPlan : "STRONGEST"; const plan = TEAM_PLANS[teamPlan]; const formation = plan.formation as keyof typeof FORMATIONS; const assignments = selectLineupForPlan(players, FORMATIONS[formation], teamPlan);
    const worldUpdate = evolveWorldSnapshot(base.world, LEAGUE_PACKS, league.pack.id, pending.year, league.seed, TIER_OVR); const presidentUpdate = offer ? makePresident(worldUpdate.seed, tier) : { seed: worldUpdate.seed, president: base.president, presidentName: base.presidentName };
    const required = requiredLicenseForTier(tier) as License; let licenseCourse = base.licenseCourse; let licenseMessage = base.licenseMessage;
    if (!licenseCoversTier(base.coach.license, tier) && !licenseCourse) {
      const course = (Object.keys(LICENSE_CHALLENGES) as License[]).find((license) => license === required) ?? required;
      const details = course === "UEFA B" ? 20 : course === "UEFA A" ? 28 : 40;
      licenseCourse = { target: course, weeksRemaining: details, totalWeeks: details, funding: "club" };
      licenseMessage = `${environment.label} wymaga ${required}. Klub uruchomił finansowany kurs; obowiązuje warunkowe dopuszczenie na czas nauki.`;
    }
    const clubs = base.careerStats.clubs.includes(clubName) ? base.careerStats.clubs : [...base.careerStats.clubs, clubName];
    setGame({ ...base, seed: presidentUpdate.seed, club: league.club, teams: league.teams, fixtures: league.fixtures, world: worldUpdate.world, worldActivity: { date: `${pending.year}-07-13`, competitionsAdvanced: 0, matchesPlayed: 0, squadMoves: 0, managerChanges: 0, headlines: [] }, players, coach: base.coach, environment, careerChallenge: LICENSE_CHALLENGES[base.coach.license], season: `${pending.year}/${String(pending.year + 1).slice(-2)}`, date: `${pending.year}-07-13`, round: 1, teamPlan, squadPolicy: plan.policy, tactic: { ...base.tactic, ...plan.tactic, formation, assignments }, training: { sessions: defaultMicrocycle(environment.trainingSessions), readiness: Math.min(environment.readinessCap, 60), completedRound: null, preset: "BALANCED" }, matchState: undefined, lastDecisionOutcome: undefined, newSeasonPending: false, winterEvaluatedRound: undefined, burnout: offseasonBurnout(base.burnout), lastBurnoutChange: -Math.max(0, base.burnout - offseasonBurnout(base.burnout)), developmentGoals: [], seasonEvidence: { formationsWithPoints: [], youthStarters: [], analysisRounds: [], tacticalRounds: [], pressureRounds: [], positiveDecisions: [] }, employmentStatus: "employed", jobOffers: [], pendingSeason: undefined, licenseCourse, licenseMessage, president: presidentUpdate.president, presidentName: presidentUpdate.presidentName, careerStats: { ...base.careerStats, clubs, highestTier: Math.min(base.careerStats.highestTier, tier) }, history: [...squadNotes, `Start sezonu ${pending.year}/${String(pending.year + 1).slice(-2)}: ${clubName}, ${environment.label}.`, ...base.history].slice(0, 80) }); setSelectedGoals([]); go("goals");
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
  if (screen === "club") return <ClubPicker draft={draft} competitionOptions={competitionOptions} selectedCompetition={selectedCompetition} associations={associations} districts={districts} packs={packs} pack={selectedPack} selectedAssociation={selectedAssociation} selectedDistrict={selectedDistrict} selectedPackId={selectedPackId} selectedClub={selectedClub} onCompetition={chooseCompetition} onAssociation={chooseAssociation} onDistrict={chooseDistrict} onPack={choosePack} onClub={setSelectedClub} onBack={() => go("creator")} onNext={() => go("goals")} />;
  if (screen === "goals") return <GoalPicker selected={selectedGoals} setSelected={setSelectedGoals} season={game?.season ?? "2026/27"} onBack={() => go(game ? "dashboard" : "club")} onConfirm={game ? confirmNewSeasonGoals : finalizeCareer} />;
  if (!game) return <StartScreen hasSave={hasSave} onNew={() => go("creator")} onLoad={loadGame} />;
  return <GameShell game={game} screen={screen} go={go} menuOpen={menuOpen} setMenuOpen={setMenuOpen} saveNow={saveNow} savedPulse={savedPulse}>{screen === "dashboard" && <Dashboard game={game} go={go} resolveDecision={resolveDecision} prepareMatch={prepareMatch} beginNextSeason={beginNextSeason} />}{screen === "squad" && <Squad game={game} setGame={setGame} go={go} />}{screen === "tactics" && <Tactics game={game} setGame={setGame} />}{screen === "training" && <Training game={game} setGame={setGame} applyTraining={applyTraining} />}{screen === "match" && <Match game={game} go={go} advanceMatch={advanceMatch} prepareMatch={prepareMatch} changeLiveInstruction={changeLiveInstruction} />}{screen === "table" && <TableScreen game={game} />}{screen === "jobs" && <Jobs game={game} acceptJob={acceptJob} />}{screen === "career" && <Career game={game} setGame={setGame} retireCareer={retireCareer} />}</GameShell>;
}

function migrateGame(value: unknown): GameState {
  const parsed = value as GameState;
  const history = Array.isArray(parsed.history) ? parsed.history : [];
  const trainedToday = history.some((entry) => typeof entry === "string" && entry.startsWith(`${parsed.date} — Zrealizowano mikrocykl`));
  const license = normalizeStartingLicense(parsed.coach?.license) as License;
  const environment = parsed.environment ? { ...parsed.environment, ...environmentForPack({ tier: parsed.club.tier, competition: parsed.club.competition }) } : environmentForPack({ tier: parsed.club.tier, competition: parsed.club.competition });
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
  const legacyTraining = parsed.training as GameState["training"] & { focus?: string; intensity?: string; recovery?: boolean };
  let trainingSessions = Array.isArray(legacyTraining?.sessions) && legacyTraining.sessions.length === environment.trainingSessions ? legacyTraining.sessions : defaultMicrocycle(environment.trainingSessions);
  if (!Array.isArray(legacyTraining?.sessions) && legacyTraining?.focus) trainingSessions = trainingSessions.map((session, index) => index === Math.max(0, trainingSessions.length - 2) ? { ...session, focus: legacyTraining.focus as typeof session.focus, intensity: (legacyTraining.intensity ?? session.intensity) as typeof session.intensity } : legacyTraining.recovery && index === 0 ? { ...session, focus: "Regeneracja", intensity: "Niska" } : session);
  const selectedPack = LEAGUE_PACKS.find((pack) => pack.association === parsed.club.association && pack.competition === parsed.club.competition && pack.group === parsed.club.group);
  const generatedWorld = parsed.world ? { world: parsed.world, seed: parsed.seed } : createWorldSnapshot(LEAGUE_PACKS, selectedPack?.id ?? "", seasonYear, parsed.seed, TIER_OVR);
  const players = (parsed.players ?? []).map((player) => ({ ...player, injuryWeeks: player.injuryWeeks ?? 0, absenceRounds: player.absenceRounds ?? 0 }));
  const teamPlan = TEAM_PLANS[parsed.teamPlan] ? parsed.teamPlan : "STRONGEST"; const plan = TEAM_PLANS[teamPlan]; const formation = plan.formation as keyof typeof FORMATIONS;
  const tactic = { ...parsed.tactic, ...plan.tactic, formation, assignments: selectLineupForPlan(players, FORMATIONS[formation], teamPlan) };
  return {
    ...parsed,
    build: BUILD,
    seed: generatedWorld.seed,
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
    teams: (parsed.teams ?? []).map((team) => ({ ...team, form: team.form ?? 50, morale: team.morale ?? 55, fatigue: team.fatigue ?? 14, lastFive: team.lastFive ?? [] })),
    players,
    tactic,
    world: generatedWorld.world,
    worldActivity: { squadMoves: 0, ...(parsed.worldActivity ?? { date: currentScheduledDate ?? parsed.date ?? `${seasonYear}-07-13`, competitionsAdvanced: 0, matchesPlayed: 0, managerChanges: 0, headlines: [] }) },
    seasonEvidence: parsed.seasonEvidence ?? { formationsWithPoints: [], youthStarters: [], analysisRounds: [], tacticalRounds: [], pressureRounds: [], positiveDecisions: [] },
    developmentGoals: (parsed.developmentGoals ?? []).map((goal) => { const canonical = DEVELOPMENT_GOALS.find((item) => item.id === goal.id); return canonical ? { ...canonical, progress: Math.min(canonical.target, goal.progress ?? 0) } : goal; }),
    inbox: (parsed.inbox ?? []).map((item) => legacyIssue(item)),
    squadPolicy: plan.policy,
    teamPlan,
    training: { sessions: trainingSessions, readiness: Math.min(environment.readinessCap, parsed.training?.readiness ?? 60), completedRound: parsed.training?.completedRound ?? (trainedToday ? parsed.round : null), preset: parsed.training?.preset ?? "BALANCED" },
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

function daysBetween(from: string, to: string) {
  const start = new Date(`${from}T12:00:00Z`).getTime(); const end = new Date(`${to}T12:00:00Z`).getTime();
  return Number.isFinite(start) && Number.isFinite(end) ? Math.max(2, Math.round((end - start) / 86400000)) : 7;
}

function plannedTactic(game: GameState, players: GameState["players"]) {
  const teamPlan = TEAM_PLANS[game.teamPlan] ? game.teamPlan : "STRONGEST"; const plan = TEAM_PLANS[teamPlan]; const formation = plan.formation as keyof typeof FORMATIONS;
  const assignments = selectLineupForPlan(players, FORMATIONS[formation], teamPlan);
  return { policy: plan.policy, tactic: { ...game.tactic, ...plan.tactic, formation, assignments } as GameState["tactic"] };
}
