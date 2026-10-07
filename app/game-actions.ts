import { accruePressing, lineupCondition, pressingFatigueCost } from "../lib/pressing.mjs";
import { tacticalPlanImpact } from "../lib/game-rules.mjs";
import { generateCareerIssues, recordStoryDecision, normalizeNarrative } from "../lib/career-stories.mjs";
import {
  BUILD, DEVELOPMENT_GOALS, effectiveOVR, FORMATIONS, GameState, LEAGUE_PACKS,
  License, CoachProfile, POLICY_EFFECTS, SAVE_KEY, Screen, Team, Fixture, LICENSE_CHALLENGES, TIER_OVR,
  buildMatchStrength, buildSchedule, capReadiness, defaultMicrocycle, diagnoseMatchOutcome, dismissalProbability, environmentForPack, evaluateMicrocycle, goalSatisfied, highestEligibleCoachingExperience, highestEligibleStartingLicense, injuryRiskFromFatigue, licenseCoversCompetition, licenseCoversTier, naturalRecoveryForGap, normalizeStartingLicense, offseasonBurnout, positionPenalty, pressureDeltaForResult, requiredLicenseForCompetition, requiredLicenseForTier, rngNext, selectLineupForPlan, simulateMatchPlan, sortedTable, startingLicenseEligibility, trainingTacticSynergy, TEAM_PLANS, teamLiveStrength, updateTeamResult, weeklyBurnoutDelta,
} from "./game-data";
import type { Coach, LeaguePack } from "./game-data";
import { rolloverCareerWorld, buildLeagueForSeason, createGame, currentFixture, environmentIncident, evolveSquad, generateJobOffers, makePlayers, makePresident, skillSet, teamForId } from "./game-engine";
import { describeResolvedEffects, generateRoundIssues, legacyIssue, resolveIssueEffects } from "../lib/career-events.mjs";
import { phrase } from "../lib/game-language.mjs";
import { createWorldSnapshot, evolveWorldSnapshot, simulateWorldToDate } from "../lib/world-engine.mjs";
import { generateMatchMoments, resolveMatchMoment as resolveMomentEffect, contextualizeMatchMoment } from "../lib/match-moments.mjs";

// Shared by the live UI and full-career regression runner. No alternate simulator.
export function gameActions(game: GameState | null, setGame: (game: GameState) => void, go: (screen: Screen) => void, selectedGoals: string[] = [], setSelectedGoals: (goals: string[]) => void = () => {}) {
  const applyTraining = () => {
    if (!game || (game.matchState && !game.matchState.completed) || game.employmentStatus !== "employed" || game.careerEnded || game.developmentGoals.length !== 2 || game.training.completedRound === game.round) return;
    const effect = evaluateMicrocycle(game.training.sessions);
    const fixture = currentFixture(game);
    const previousDate = [...game.fixtures].filter(f => f.played && (f.home === game.club.id || f.away === game.club.id)).sort((a,b) => b.date.localeCompare(a.date))[0]?.date ?? `${game.season.slice(0,4)}-07-13`;
    const gapDays = fixture ? daysBetween(previousDate, fixture.date) : 7;
    const naturalRecovery = naturalRecoveryForGap(gapDays, game.club.tier);
    const summary = game.training.sessions.map((session) => `${session.day} ${session.focus} (${session.intensity.toLowerCase()})`).join(" • ");
    const players = game.players.map((player) => {
      const recovered = Math.max(0, player.fatigue - naturalRecovery - ((player.injuryWeeks ?? 0) > 0 ? 3 : 0));
      if ((player.injuryWeeks ?? 0) > 0) return { ...player, fatigue: recovered };
      return { ...player, fatigue: Math.max(0, Math.min(100, recovered + effect.fatigueDelta)), morale: Math.max(0, Math.min(100, player.morale + effect.moraleDelta)), form: Math.max(0, Math.min(100, player.form + effect.formDelta + (player.age <= 21 ? effect.youthFormDelta : 0))) };
    });
    const planned = plannedTactic(game, players);
    const synergy = trainingTacticSynergy(game.training.sessions, planned.tactic, game.teamPlan);
    const memory = game.trainingMemory ?? { youth: 0, analysis: 0, overload: 0, weeks: 0 };
    setGame({ ...game, training: { ...game.training, readiness: capReadiness(game.training.readiness, effect.readinessGain, game.environment.readinessCap), completedRound: game.round }, trainingMemory: { youth: memory.youth + synergy.youthLegacy, analysis: memory.analysis + synergy.analysisLegacy, overload: memory.overload + synergy.overloadLegacy, weeks: memory.weeks + 1 }, players, tactic: planned.tactic, squadPolicy: planned.policy, history: [`${game.date} — Mikrocykl kolejki ${game.round}: regeneracja naturalna −${naturalRecovery} zmęczenia, następnie ${game.training.sessions.length} sesji: ${summary}. Zgodność z planem ${synergy.shortTerm >= 0 ? "+" : ""}${synergy.shortTerm}.`, ...game.history].slice(0, 80) });
    go("dashboard");
  };

  const prepareMatch = () => {
    if (!game || game.employmentStatus !== "employed" || game.careerEnded || game.developmentGoals.length !== 2) return; if (game.matchState && !game.matchState.completed) { go("match"); return; } const fixture = currentFixture(game); if (!fixture) return;
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
    const synergy = trainingTacticSynergy(game.training.sessions, tactic, game.teamPlan);
    const strength = buildMatchStrength({ lineupOVR: squadRating, readiness: game.training.readiness, coachTactics: game.coach.skills.tactics, averageCondition, tactic, policyStrength: policy.matchStrength, burnout: game.burnout, incidentPenalty: incident.penalty, trainingSynergy: synergy.shortTerm });
    const opponent = userHome ? awayTeam : homeTeam; const opponentStrength = teamLiveStrength(opponent); const userStrength = strength.total;
    const homeStrength = userHome ? userStrength : opponentStrength; const awayStrength = userHome ? opponentStrength : userStrength; const simulation = simulateMatchPlan(incident.seed, homeStrength, awayStrength, homeTeam.name, awayTeam.name); const plannedEvents = incident.text ? [{ minute: 1, text: incident.text, kind: "info" as const, side: "neutral" as const }, ...simulation.events] : simulation.events;
    const totalRounds = Math.max(...game.fixtures.map((item) => item.round)); const moments = generateMatchMoments(simulation.seed, { tier: game.club.tier, round: game.round, totalRounds, pressure: Math.max(...Object.values(game.pressures)), strengthGap: userStrength - opponentStrength });
    const factorLabels: Record<string, string> = { lineup: "Automatyczna XI", preparation: "Przygotowanie", coach: "Warsztat trenera", plan: "Spójność planu", training: "Trening × taktyka", policy: "Plan drużyny", burnout: "Wypalenie", incident: "Zdarzenie losowe" };
    const userStrengthFactors = Object.entries(strength.factors).map(([key, value]) => ({ label: factorLabels[key] ?? key, value }));
    setGame({ ...game, players, tactic, squadPolicy: planned.policy, date: fixture.date, round: fixture.round, training: { ...game.training, completedRound: fixture.round }, seed: moments.seed, matchState: { fixture, simulationSeed: incident.seed, minute: 0, homeGoals: simulation.homeGoals, awayGoals: simulation.awayGoals, plannedEvents, shotsHome: simulation.shotsHome, shotsAway: simulation.shotsAway, possessionHome: simulation.possessionHome, homeStrength, awayStrength, homeXg: simulation.homeXg, awayXg: simulation.awayXg, expectedHomeWin: simulation.expected.home, expectedDraw: simulation.expected.draw, expectedAwayWin: simulation.expected.away, userStrengthFactors, completed: false, preparationReadiness: game.training.readiness, preMatchPressure: Math.max(...Object.values(game.pressures)), analysisAttempted: false, reportSeen: false, coachMoments: moments.moments, coachImpact: 0, coachFatigue: 0, coachMorale: 0, pressingExposure: { high: 0, veryHigh: 0, minute: 0 } } }); go("match");
  };

  const changeLiveInstruction = (field: "mentality" | "pressing", value: string) => {
    if (!game || game.tactic[field] === value || (game.matchState && !game.matchState.completed && (game.matchState.lastInstructionMinute === game.matchState.minute || game.matchState.activeMomentId))) return;
    const tactic = { ...game.tactic, [field]: value }; const match = game.matchState;
    if (!match || match.completed) { setGame({ ...game, tactic }); return; }
    const condition = lineupCondition(game.players, game.tactic.assignments);
    const { assignments: _assignments, ...oldPlan } = game.tactic;
    const { assignments: _newAssignments, ...newPlan } = tactic;
    const planDifference = field === "pressing"
      ? tacticalPlanImpact(newPlan, condition, game.training.readiness) - tacticalPlanImpact(oldPlan, condition, game.training.readiness)
      : instructionImpact(field, value) - instructionImpact(field, game.tactic[field]);
    const trainingDifference = field === "pressing"
      ? trainingTacticSynergy(game.training.sessions, tactic, game.teamPlan).shortTerm - trainingTacticSynergy(game.training.sessions, game.tactic, game.teamPlan).shortTerm
      : 0;
    const difference = planDifference + trainingDifference; const userHome = match.fixture.home === game.club.id; const homeStrength = (match.homeStrength ?? teamForId(game, match.fixture.home)?.ovr ?? 40) + (userHome ? difference : 0); const awayStrength = (match.awayStrength ?? teamForId(game, match.fixture.away)?.ovr ?? 40) + (userHome ? 0 : difference); const homeName = teamForId(game, match.fixture.home)?.name; const awayName = teamForId(game, match.fixture.away)?.name; const simulation = simulateMatchPlan(match.simulationSeed ?? game.seed, homeStrength, awayStrength, homeName, awayName); const pastEvents = match.plannedEvents.filter((event) => event.minute <= match.minute); const futureEvents = simulation.events.filter((event) => event.minute > match.minute); const plannedEvents = [...pastEvents, ...futureEvents].sort((a, b) => a.minute - b.minute); const homeGoals = plannedEvents.filter((event) => event.kind === "goal" && event.side === "home").length; const awayGoals = plannedEvents.filter((event) => event.kind === "goal" && event.side === "away").length;
    const dangerousHome = plannedEvents.filter((event) => event.side === "home" && ["goal", "chance"].includes(event.kind)).length; const dangerousAway = plannedEvents.filter((event) => event.side === "away" && ["goal", "chance"].includes(event.kind)).length;
    const currentHomeGoals = match.plannedEvents.filter((event) => event.minute <= match.minute && event.kind === "goal" && event.side === "home").length; const currentAwayGoals = match.plannedEvents.filter((event) => event.minute <= match.minute && event.kind === "goal" && event.side === "away").length; const currentBalance = userHome ? currentHomeGoals - currentAwayGoals : currentAwayGoals - currentHomeGoals; const startsAnalysis = match.minute >= 30 && !match.analysisAttempted;
    const userStrengthFactors = match.userStrengthFactors?.map((factor) => factor.label === "Spójność planu" ? { ...factor, value: Number((factor.value + planDifference).toFixed(2)) } : factor.label === "Trening × taktyka" ? { ...factor, value: Number((factor.value + trainingDifference).toFixed(2)) } : factor);
    setGame({ ...game, seed: game.seed, tactic, matchState: { ...match, pressingExposure: accruePressing(match.pressingExposure, game.tactic.pressing, match.minute), lastInstructionMinute: match.minute, plannedEvents, homeGoals, awayGoals, shotsHome: dangerousHome, shotsAway: dangerousAway, possessionHome: simulation.possessionHome, homeStrength, awayStrength, homeXg: simulation.homeXg, awayXg: simulation.awayXg, userStrengthFactors, analysisAttempted: match.analysisAttempted || startsAnalysis, analysisStartBalance: startsAnalysis ? currentBalance : match.analysisStartBalance }, pressures: { ...game.pressures, personal: Math.min(100, game.pressures.personal + (value === "Ofensywna" || value === "Bardzo wysoki" ? 2 : 0)) } });
  };

  const resolveMatchMoment = (momentId: string, choiceId: string) => {
    if (!game?.matchState || game.matchState.completed) return;
    const match = game.matchState; const moment = match.coachMoments?.find((item) => item.id === momentId && !item.resolvedChoiceId);
    if (!moment || match.activeMomentId !== momentId || !moment.choices.some(c => c.id === choiceId)) return;
    const result = resolveMomentEffect(game.seed, moment, choiceId); const userHome = match.fixture.home === game.club.id;
    const homeStrength = (match.homeStrength ?? 40) + (userHome ? result.strength : 0); const awayStrength = (match.awayStrength ?? 40) + (userHome ? 0 : result.strength);
    const homeName = teamForId(game, match.fixture.home)?.name; const awayName = teamForId(game, match.fixture.away)?.name; const simulation = simulateMatchPlan(match.simulationSeed ?? result.seed, homeStrength, awayStrength, homeName, awayName);
    const pastEvents = match.plannedEvents.filter((event) => event.minute <= match.minute); const reactionEvent = { minute: match.minute, text: `Ławka: ${result.choice.label}. ${result.verdict}`, kind: "info" as const, side: "neutral" as const }; const futureEvents = simulation.events.filter((event) => event.minute > match.minute); const plannedEvents = [...pastEvents, reactionEvent, ...futureEvents].sort((a, b) => a.minute - b.minute);
    const homeGoals = plannedEvents.filter((event) => event.kind === "goal" && event.side === "home").length; const awayGoals = plannedEvents.filter((event) => event.kind === "goal" && event.side === "away").length;
    const currentHomeGoals = pastEvents.filter((event) => event.kind === "goal" && event.side === "home").length; const currentAwayGoals = pastEvents.filter((event) => event.kind === "goal" && event.side === "away").length; const currentBalance = userHome ? currentHomeGoals - currentAwayGoals : currentAwayGoals - currentHomeGoals;
    const coachMoments = match.coachMoments?.map((item) => item.id === momentId ? { ...item, resolvedChoiceId: result.choice.id, outcome: result.verdict } : item);
    setGame({ ...game, seed: result.seed, pressures: { ...game.pressures, personal: Math.max(0, Math.min(100, game.pressures.personal + result.choice.pressure)) }, matchState: { ...match, activeMomentId: undefined, coachMoments, plannedEvents, homeGoals, awayGoals, homeStrength, awayStrength, shotsHome: Math.max(homeGoals, plannedEvents.filter(e => e.side === "home" && ["goal","chance"].includes(e.kind)).length), shotsAway: Math.max(awayGoals, plannedEvents.filter(e => e.side === "away" && ["goal","chance"].includes(e.kind)).length), coachImpact: (match.coachImpact ?? 0) + result.strength, coachFatigue: (match.coachFatigue ?? 0) + result.choice.fatigue, coachMorale: (match.coachMorale ?? 0) + result.choice.morale, analysisAttempted: match.analysisAttempted || match.minute >= 30, analysisStartBalance: !match.analysisAttempted && match.minute >= 30 ? currentBalance : match.analysisStartBalance } });
  };

  const advanceMatch = () => {
    if (!game?.matchState || game.matchState.completed || game.matchState.activeMomentId) return; const minute = Math.min(90, game.matchState.minute + 15); const pendingMoment = game.matchState.coachMoments?.find((item) => !item.resolvedChoiceId && item.minute > game.matchState!.minute && item.minute <= minute); if (pendingMoment) {
      const m = game.matchState; const userHome = m.fixture.home === game.club.id;
      const balance = m.plannedEvents.filter(e => e.minute <= pendingMoment.minute && e.kind === "goal").reduce((n,e) => n + ((e.side === "home") === userHome ? 1 : -1), 0);
      const adapted = contextualizeMatchMoment(pendingMoment, { balance, minute: pendingMoment.minute, tier: game.club.tier, hasYouth: game.players.some(p => p.age <= 21 && Object.values(game.tactic.assignments).includes(p.id)), setPieces: game.training.sessions.some(s => s.focus === "Stałe fragmenty"), recentTitles: m.coachMoments?.filter(c => c.resolvedChoiceId).map(c => c.title) });
      setGame({ ...game, matchState: { ...m, pressingExposure: accruePressing(m.pressingExposure, game.tactic.pressing, pendingMoment.minute), coachMoments: m.coachMoments?.map(item => item.id === pendingMoment.id ? adapted : item), minute: pendingMoment.minute, activeMomentId: pendingMoment.id } }); return;
    } if (minute < 90) { setGame({ ...game, matchState: { ...game.matchState, pressingExposure: accruePressing(game.matchState.pressingExposure, game.tactic.pressing, minute), minute } }); return; }
    const match = { ...game.matchState, pressingExposure: accruePressing(game.matchState.pressingExposure, game.tactic.pressing, 90) }; let teams = updateTeamResult(game.teams, match.fixture.home, match.fixture.away, match.homeGoals, match.awayGoals); let seed = game.seed; const fixtures: Fixture[] = game.fixtures.map((fixture) => ({ ...fixture }));
    const roundFixtures = game.fixtures.filter((fixture) => !fixture.played && fixture.round <= game.round && !(fixture.home === match.fixture.home && fixture.away === match.fixture.away));
    for (const fixture of roundFixtures) { const home = teams.find((team) => team.id === fixture.home) as Team; const away = teams.find((team) => team.id === fixture.away) as Team; const simulation = simulateMatchPlan(seed, teamLiveStrength(home), teamLiveStrength(away), home.name, away.name); seed = simulation.seed; const hg = simulation.homeGoals; const ag = simulation.awayGoals; teams = updateTeamResult(teams, fixture.home, fixture.away, hg, ag); const target = fixtures.find((item) => item.round === fixture.round && item.home === fixture.home && item.away === fixture.away) as Fixture; Object.assign(target, { played: true, homeGoals: hg, awayGoals: ag }); }
    const userTarget = fixtures.find((item) => item.round === match.fixture.round && item.home === match.fixture.home && item.away === match.fixture.away) as Fixture; Object.assign(userTarget, { played: true, homeGoals: match.homeGoals, awayGoals: match.awayGoals });
    const userHome = match.fixture.home === game.club.id; const gf = userHome ? match.homeGoals : match.awayGoals; const ga = userHome ? match.awayGoals : match.homeGoals; const result: "win" | "draw" | "loss" = gf > ga ? "win" : gf === ga ? "draw" : "loss"; const multiplier = game.careerChallenge.pressureMultiplier; const pressureDelta = pressureDeltaForResult(result, multiplier); const finalRound = Math.max(...game.fixtures.map(f => f.round)); const nextFixture = fixtures.find(f => !f.played && f.round > game.round && (f.home === game.club.id || f.away === game.club.id)); const newRound = nextFixture?.round ?? finalRound + 1; const endSeason = !nextFixture; const nextDate = nextFixture?.date ?? match.fixture.date;
    for (const fixture of fixtures.filter(f => !f.played && f.round < newRound)) {
      const home = teams.find(t => t.id === fixture.home)!; const away = teams.find(t => t.id === fixture.away)!;
      const sim = simulateMatchPlan(seed, teamLiveStrength(home), teamLiveStrength(away), home.name, away.name); seed = sim.seed;
      teams = updateTeamResult(teams, home.id, away.id, sim.homeGoals, sim.awayGoals); Object.assign(fixture, { played: true, homeGoals: sim.homeGoals, awayGoals: sim.awayGoals });
    }
    const score = `${teamForId(game, match.fixture.home)?.name} ${match.homeGoals}:${match.awayGoals} ${teamForId(game, match.fixture.away)?.name}`; const policy = POLICY_EFFECTS[game.squadPolicy] ?? POLICY_EFFECTS.BALANCED; const starters = new Set(Object.values(game.tactic.assignments)); const tacticLoad = pressingFatigueCost(match.pressingExposure) + (game.tactic.tempo === "Wysokie" ? 1 : 0);
    const worldUpdate = simulateWorldToDate(game.world, match.fixture.date, seed); seed = worldUpdate.seed;
    const nextPressures = Object.fromEntries(Object.entries(game.pressures).map(([key, value]) => { const environmentDelta = key === "media" && pressureDelta > 0 ? Math.round(pressureDelta * game.environment.mediaScale) : pressureDelta; return [key, Math.max(0, Math.min(100, value + environmentDelta + (key === "dressing" && result === "loss" ? 3 : 0)))]; }));
    const duePromises = (game.promises ?? []).filter(p => p.due <= game.careerStats.matches + 1);
    const promiseMorale = duePromises.reduce((sum,p) => sum + (game.teamPlan === p.plan ? 2 : -3), 0);
    for (const promise of duePromises) nextPressures.dressing = Math.max(0, Math.min(100,nextPressures.dressing + (game.teamPlan === promise.plan ? -2 : 3)));
    const unresolvedIssues = game.inbox.filter((item) => !item.resolved).length;
    const issueBatch = generateCareerIssues({ memory:game.narrative,clubId:game.club.id,match:game.careerStats.matches+1,context:{fatigue:game.players.reduce((n,p)=>n+p.fatigue,0)/game.players.length,burnout:game.burnout},seed, round: game.round, tier: game.club.tier, result, worldHumor: game.worldHumor, recentTitles: game.inbox.map((item) => item.title), recentCategories: game.inbox.map((item) => item.category), maxEvents: Math.max(0, 3 - unresolvedIssues) }); seed = issueBatch.seed; const followups = duePromises.map((p,i) => { const kept = game.teamPlan === p.plan; return { id: `followup-${game.season}-${game.round}-${i}`, category:"Pamięć szatni",title:kept?"Słowo dotrzymane":"Szatnia pamięta inną zapowiedź",body: `${p.source}. ${kept?"Zapowiedziany plan został wykonany. Morale +2, presja szatni −2.":"Ostatecznie wybrałeś inny plan. Morale −3, presja szatni +3."}`,resolved:false,choices:[{id:"ack",label:"Przyjmuję reakcję zespołu",feedback:"Reakcja na decyzję została zapisana. Te skutki już uwzględniono po meczu.",effects:{}}] }; });
    const inbox = [...followups, ...issueBatch.events.map(e => ({ ...e, id: e.story ? e.id : `${game.season}-${e.id}` })), ...game.inbox.filter(e => !e.resolved), ...game.inbox.filter(e => e.resolved).slice(0, 60)];
    const starterPlayers = game.players.filter((player) => starters.has(player.id)); const averageMorale = starterPlayers.length ? starterPlayers.reduce((sum, player) => sum + player.morale, 0) / starterPlayers.length : 0;
    const evidence = { formationsWithPoints: [...game.seasonEvidence.formationsWithPoints], youthStarters: [...game.seasonEvidence.youthStarters], analysisRounds: [...game.seasonEvidence.analysisRounds], tacticalRounds: [...game.seasonEvidence.tacticalRounds], pressureRounds: [...game.seasonEvidence.pressureRounds], positiveDecisions: [...game.seasonEvidence.positiveDecisions] };
    if (goalSatisfied("tactics", { readiness: match.preparationReadiness ?? game.training.readiness, averageMorale, preMatchPressure: match.preMatchPressure ?? 0, result }) && !evidence.tacticalRounds.includes(game.round)) evidence.tacticalRounds.push(game.round);
    const analysisImproved = match.analysisAttempted && game.training.sessions.some(session => session.focus === "Analiza rywala"); if (analysisImproved && !evidence.analysisRounds.includes(game.round)) evidence.analysisRounds.push(game.round);
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
      const starter = starters.has(player.id); const fatigue = Math.max(0, Math.min(100, player.fatigue + (starter ? 8 + policy.fatigue + tacticLoad + (match.coachFatigue ?? 0) : -2))); let injuryWeeks = 0;
      if (starter) { const injuryRoll = rngNext(seed); seed = injuryRoll.seed; if (injuryRoll.value < injuryRiskFromFatigue(fatigue, microcycleEffect.averageIntensity)) { const durationRoll = rngNext(seed); seed = durationRoll.seed; injuryWeeks = 1 + Math.floor(durationRoll.value * 3); injuryHistory.push(`${game.date} — ${player.name}: uraz przeciążeniowy, przerwa ${injuryWeeks} tyg.`); } }
      return {
        ...player,
        fatigue,
        injuryWeeks,
        absenceRounds,
        absenceReason,
        morale: Math.max(0, Math.min(100, player.morale + promiseMorale + (result === "win" ? 4 : result === "loss" ? -4 : 1) + (starter ? policy.morale + (match.coachMorale ?? 0) : 0))),
        form: Math.max(0, Math.min(100, player.form + (starter ? (result === "win" ? 3 : result === "loss" ? -2 : 1) : 0))),
      };
    });
    let licenseCourse = game.licenseCourse; let coach = game.coach; let licenseMessage = game.licenseMessage; const courseHistory: string[] = [];
    if (licenseCourse) { const remaining = licenseCourse.weeksRemaining - 1; if (remaining <= 0) { coach = { ...coach, license: licenseCourse.target }; licenseMessage = `Ukończono kurs ${licenseCourse.target}. Nowa licencja jest aktywna.`; courseHistory.push(`${game.date} — Ukończono kurs ${licenseCourse.target}.`); licenseCourse = undefined; } else licenseCourse = { ...licenseCourse, weeksRemaining: remaining }; }
    const halfway = game.round >= Math.ceil(finalRound / 2) && !game.winterEvaluatedRound; let winterEvaluatedRound = game.winterEvaluatedRound; let finalInbox = inbox; let evaluatedProgress = progress; let jobOffers = game.jobOffers;
    if (halfway && winterEvaluatedRound !== game.round) {
      winterEvaluatedRound = game.round; evaluatedProgress = progress.map((goal) => ({ ...goal, winterProgress: goal.progress }));
      const summary = evaluatedProgress.map((goal) => `${goal.label}: ${goal.progress}/${goal.target}`).join(" • ");
      finalInbox = [{ id: `winter-${game.season}`, category: "Ewaluacja", title: "Zimowa ocena celów", body: `${summary}. To zapis postępu, nie automatyczne zaliczenie. Wiosną nadal możesz domknąć oba cele.`, choices: [{ id: "ack", label: "Przyjmuję ocenę i planuję wiosnę", feedback: "Ocena zimowa została zapisana. Zarząd wróci do celów po ostatniej kolejce.", effects: {} }], resolved: false }, ...finalInbox];
      const winterMarket = generateJobOffers({ ...game, coach }, seed); seed = winterMarket.seed; jobOffers = winterMarket.offers.map((offer) => ({ ...offer, stage: "obserwacja" as const }));
    }
    const userShots = userHome ? match.shotsHome : match.shotsAway; const opponentShots = userHome ? match.shotsAway : match.shotsHome; const preparation = match.preparationReadiness ?? game.training.readiness; const slots = FORMATIONS[game.tactic.formation]; const mismatches = slots.filter((slot) => { const player = game.players.find((item) => item.id === game.tactic.assignments[slot]); return !player || positionPenalty(player, slot) > .04; }).length; const afterStarters = updatedPlayers.filter((player) => starters.has(player.id)); const averageConditionAfter = afterStarters.length ? Math.round(afterStarters.reduce((sum, player) => sum + (100 - player.fatigue), 0) / afterStarters.length) : 0;
    const reportKey = `${game.seed}-${game.season}-${game.round}`; const positives: string[] = []; const warnings: string[] = [];
    if (result === "win") positives.push(phrase(`${reportKey}-win`, "win"));
    if (preparation >= 72) positives.push(phrase(`${reportKey}-prep-good`, "preparationGood", { value: preparation }));
    if (userShots > opponentShots) positives.push(phrase(`${reportKey}-shots-good`, "shotsGood", { for: userShots, against: opponentShots }));
    if (analysisImproved) positives.push(phrase(`${reportKey}-analysis`, "analysisGood"));
    if (averageConditionAfter < 65) warnings.push(phrase(`${reportKey}-condition`, "conditionBad", { value: averageConditionAfter }));
    if (preparation < 55) warnings.push(phrase(`${reportKey}-prep-bad`, "preparationBad", { value: preparation }));
    if (mismatches) warnings.push(`${mismatches} ${mismatches === 1 ? "pozycja była" : "pozycje były"} obsadzone z wyraźną karą dopasowania.`);
    if (game.burnout >= 45) warnings.push(phrase(`${reportKey}-burnout`, "burnout", { value: game.burnout }));
    if (userShots < opponentShots) warnings.push(phrase(`${reportKey}-shots-bad`, "shotsBad", { for: userShots, against: opponentShots }));
    const expectedDifference = userHome ? (match.homeStrength ?? 0) - (match.awayStrength ?? 0) : (match.awayStrength ?? 0) - (match.homeStrength ?? 0);
    const winChance = userHome ? match.expectedHomeWin ?? .33 : match.expectedAwayWin ?? .33; const drawChance = match.expectedDraw ?? .34; const lossChance = userHome ? match.expectedAwayWin ?? .33 : match.expectedHomeWin ?? .33;
    const userXg = userHome ? match.homeXg ?? 0 : match.awayXg ?? 0; const opponentXg = userHome ? match.awayXg ?? 0 : match.homeXg ?? 0;
    const decisiveFactor = diagnoseMatchOutcome({ result, readiness: preparation, expectedWin: winChance, expectedLoss: lossChance, userGoals: gf, opponentGoals: ga, userXg, opponentXg, userShots, opponentShots });
    const surprise = expectedDifference >= 2 && result === "loss" ? "Porażka mimo roli faworyta" : expectedDifference <= -2 && result === "win" ? "Zwycięstwo ponad przedmeczowe szanse" : result === "win" ? "Zwycięstwo" : result === "draw" ? "Remis" : "Porażka";
    const strengthFactors = [...(match.userStrengthFactors ?? []), { label: "Interwencje trenera", value: Number((match.coachImpact ?? 0).toFixed(2)) }];
    const postMatchReport = { verdict: surprise, summary: `${score}. Przed meczem: wygrana ${Math.round(winChance * 100)}%, remis ${Math.round(drawChance * 100)}%, porażka ${Math.round(lossChance * 100)}%. Przewaga siły ${expectedDifference >= 0 ? "+" : ""}${expectedDifference.toFixed(1)}.`, positives: positives.length ? positives : [phrase(`${reportKey}-neutral-good`, "neutralPositive")], warnings: warnings.length ? warnings : [phrase(`${reportKey}-neutral-warning`, "neutralWarning")], boardChange: nextPressures.board - game.pressures.board, burnoutChange: weeklyBurnout, averageCondition: averageConditionAfter, analysisOutcome: match.analysisAttempted ? analysisImproved ? "Analiza rywala i reakcja w meczu — postęp zaliczony niezależnie od wyniku." : "Reakcja zapisana. Do celu brakuje treningu analizy rywala." : "Cel Analiza: przygotuj analizę rywala i zareaguj przy ławce po 30. minucie.", decisiveFactor, winChance, drawChance, lossChance, userXg, opponentXg, strengthFactors };
    const careerStats = { ...game.careerStats, matches: game.careerStats.matches + 1, wins: game.careerStats.wins + (result === "win" ? 1 : 0), draws: game.careerStats.draws + (result === "draw" ? 1 : 0), losses: game.careerStats.losses + (result === "loss" ? 1 : 0) };
    const nextPlan = plannedTactic(game, updatedPlayers);
    setGame({ ...game, narrative:issueBatch.memory, promises: (game.promises ?? []).filter(p => p.due > game.careerStats.matches + 1), seed, coach, teams, fixtures, world: worldUpdate.world, worldActivity: worldUpdate.activity, round: newRound, date: nextDate, matchState: { ...match, minute: 90, completed: true, postMatchReport, reportSeen: false }, tactic: nextPlan.tactic, squadPolicy: nextPlan.policy, pressures: nextPressures, burnout: Math.max(0, Math.min(100, game.burnout + weeklyBurnout)), lastBurnoutChange: weeklyBurnout, players: updatedPlayers, training: { sessions: defaultMicrocycle(game.environment.trainingSessions), readiness: Math.max(60, Math.min(game.environment.readinessCap, game.training.readiness - 1)), completedRound: null, preset: "BALANCED" }, finances: { ...game.finances, personalFunds: game.finances.personalFunds + Math.round(game.finances.monthlySalary / 4) }, licenseCourse, licenseMessage, developmentGoals: evaluatedProgress, seasonEvidence: evidence, history: [...injuryHistory, ...courseHistory, `${match.fixture.date} — ${score}.`, ...game.history].slice(0, 80), inbox: finalInbox, winterEvaluatedRound, careerStats, jobOffers, newSeasonPending: endSeason });
  };

  const resolveDecision = (eventId: string, choiceId: string) => {
    if (!game || (game.matchState && !game.matchState.completed)) return; const event = game.inbox.find((item) => item.id === eventId && !item.resolved); const choice = event?.choices.find((item) => item.id === choiceId); if (!event || !choice) return;
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
    const positivePeople = event.choices.length > 1 && !["Kontrakt", "Archiwum", "Ewaluacja", "Pamięć szatni"].includes(event.category) && (effects.pressures?.dressing ?? 0) <= 0; const evidence = { ...game.seasonEvidence, positiveDecisions: positivePeople && !game.seasonEvidence.positiveDecisions.includes(event.id) ? [...game.seasonEvidence.positiveDecisions, event.id] : game.seasonEvidence.positiveDecisions };
    const effectiveGame = effects.teamPlan ? { ...game, teamPlan: effects.teamPlan } : game; const planned = plannedTactic(effectiveGame, players); const changes = describeResolvedEffects(effects);
    const storyResult=recordStoryDecision(game.narrative,event,choice,game.careerStats.matches,game.club.id,seed); seed=storyResult.seed;
    setGame({ ...effectiveGame, narrative:storyResult.memory, promises: effects.teamPlan ? [...(game.promises ?? []), {due:game.careerStats.matches + 1,plan:effects.teamPlan,source:event.title}] : game.promises, seed, coach: { ...game.coach, reputation: Math.max(0, Math.min(100, game.coach.reputation + (effects.reputation ?? 0))) }, pressures, burnout: Math.max(0, Math.min(100, game.burnout + (effects.burnout ?? 0))), players, tactic: planned.tactic, squadPolicy: planned.policy, training: { ...game.training, readiness: capReadiness(game.training.readiness, effects.readiness ?? 0, game.environment.readinessCap) }, inbox: game.inbox.map((item) => item.id === event.id ? { ...item, resolved: true } : item), lastDecisionOutcome: { title: event.title, choice: choice.label, feedback: choice.feedback, changes: changes.length ? changes : ["Brak natychmiastowej zmiany wskaźników; sprawa zostaje w pamięci świata."] }, history: [`${game.date} — ${choice.feedback}`, ...game.history].slice(0, 40), seasonEvidence: evidence, developmentGoals: game.developmentGoals.map((goal) => goal.id === "people" && positivePeople ? { ...goal, progress: Math.min(goal.target, evidence.positiveDecisions.length) } : goal) });
  };

  const startSeason = (base: GameState, pending: NonNullable<GameState["pendingSeason"]>, offerId?: string) => {
    const offer = offerId ? base.jobOffers.find((item) => item.id === offerId) : undefined; const ownNextCompetition = base.nextWorld?.competitions.find(c => c.teams.some(t => t.id === base.club.id)); const forcedPack = LEAGUE_PACKS.find(pack => pack.id === (offer?.packId ?? ownNextCompetition?.id)); const tier = offer?.tier ?? pending.targetTier; const clubName = offer?.clubName ?? base.club.name;
    let seed = base.seed; let players = base.players; let squadNotes: string[] = [];
    if (offer) { const generated = makePlayers(seed, TIER_OVR[tier] ?? 42, `club${pending.year}`); players = generated.players; seed = generated.seed; squadNotes = [`Nowy klub: przejęto kadrę ${clubName}.`]; }
    else { const evolved = evolveSquad(players, seed, tier, pending.year, pending.outcome, base.trainingMemory); players = evolved.players; seed = evolved.seed; squadNotes = [`Przerwa między sezonami: wypalenie ${base.burnout}% → ${offseasonBurnout(base.burnout)}%. Siła kadry ${evolved.beforeOVR} → ${evolved.afterOVR} OVR.`, ...(evolved.retired.length ? [`Emerytury zawodników: ${evolved.retired.join(", ")}.`] : []), ...(evolved.recruits.length ? [`Wzmocnienia po ruchu ligowym: ${evolved.recruits.join(", ")}.`] : []), ...(evolved.departures.length ? [`Odejścia po ruchu ligowym: ${evolved.departures.join(", ")}.`] : []), ...(evolved.graduates.length ? [`Do kadry weszli juniorzy: ${evolved.graduates.join(", ")}.`] : []), ...(evolved.changes.length ? [`Zmiany Base OVR: ${evolved.changes.slice(0, 8).join(", ")}${evolved.changes.length > 8 ? "…" : ""}.`] : [])]; }
    const working = { ...base, seed, players, club: { ...base.club, name: clubName } }; const league = buildLeagueForSeason(working, tier, pending.year, clubName, forcedPack); const environment = environmentForPack(league.pack); const teamPlan = TEAM_PLANS[base.teamPlan] ? base.teamPlan : "STRONGEST"; const plan = TEAM_PLANS[teamPlan]; const formation = plan.formation as keyof typeof FORMATIONS; const assignments = selectLineupForPlan(players, FORMATIONS[formation], teamPlan);
    const worldUpdate = base.nextWorld ? { seed: league.seed, world: { ...base.nextWorld, competitions: base.nextWorld.competitions.filter(c => c.id !== league.pack.id) } } : evolveWorldSnapshot(base.world, LEAGUE_PACKS, league.pack.id, pending.year, league.seed, TIER_OVR); const presidentUpdate = offer ? makePresident(worldUpdate.seed, tier) : { seed: worldUpdate.seed, president: base.president, presidentName: base.presidentName };
    const required = requiredLicenseForCompetition(league.pack.competition) as License; let licenseCourse = base.licenseCourse; let licenseMessage = base.licenseMessage;
    if (!licenseCoversCompetition(base.coach.license, league.pack.competition) && !licenseCourse) {
      const course = (Object.keys(LICENSE_CHALLENGES) as License[]).find((license) => license === required) ?? required;
      const details = course === "UEFA B" ? 20 : course === "UEFA A" ? 28 : 40;
      licenseCourse = { target: course, weeksRemaining: details, totalWeeks: details, funding: "club" };
      licenseMessage = `${environment.label} wymaga ${required}. Klub uruchomił finansowany kurs; obowiązuje warunkowe dopuszczenie na czas nauki.`;
    }
    const clubs = base.careerStats.clubs.includes(clubName) ? base.careerStats.clubs : [...base.careerStats.clubs, clubName];
    setGame({ ...base, seed: presidentUpdate.seed, club: league.club, teams: league.teams, fixtures: league.fixtures, nextWorld: undefined, inbox: offer ? [] : base.inbox.filter(e=>!e.resolved&&e.story), narrative:normalizeNarrative(base.narrative,league.club.id), promises:offer?[]:base.promises, world: worldUpdate.world, worldActivity: { date: `${pending.year}-07-13`, competitionsAdvanced: 0, matchesPlayed: 0, squadMoves: 0, managerChanges: 0, headlines: [] }, players, coach: base.coach, environment, careerChallenge: LICENSE_CHALLENGES[base.coach.license], season: `${pending.year}/${String(pending.year + 1).slice(-2)}`, date: `${pending.year}-07-13`, round: 1, teamPlan, squadPolicy: plan.policy, tactic: { ...base.tactic, ...plan.tactic, formation, assignments }, training: { sessions: defaultMicrocycle(environment.trainingSessions), readiness: Math.min(environment.readinessCap, 60), completedRound: null, preset: "BALANCED" }, trainingMemory: { youth: 0, analysis: 0, overload: 0, weeks: 0 }, matchState: undefined, lastDecisionOutcome: undefined, newSeasonPending: false, winterEvaluatedRound: undefined, burnout: offseasonBurnout(base.burnout), lastBurnoutChange: -Math.max(0, base.burnout - offseasonBurnout(base.burnout)), developmentGoals: [], seasonEvidence: { formationsWithPoints: [], youthStarters: [], analysisRounds: [], tacticalRounds: [], pressureRounds: [], positiveDecisions: [] }, employmentStatus: "employed", jobOffers: [], pendingSeason: undefined, licenseCourse, licenseMessage, president: presidentUpdate.president, presidentName: presidentUpdate.presidentName, careerStats: { ...base.careerStats, clubs, highestTier: Math.min(base.careerStats.highestTier, tier) }, history: [...squadNotes, `Start sezonu ${pending.year}/${String(pending.year + 1).slice(-2)}: ${clubName}, ${environment.label}.`, ...base.history].slice(0, 80) }); setSelectedGoals([]); go("goals");
  };

  const beginNextSeason = () => {
    if (!game?.newSeasonPending || game.careerEnded) return; const table = sortedTable(game.teams); const place = table.findIndex((team) => team.id === game.club.id) + 1; const userTeam = game.teams.find((team) => team.id === game.club.id) as Team; const rolledWorld = rolloverCareerWorld(game, Number(game.season.slice(0, 4)) + 1); const targetTier = rolledWorld.world.competitions.find(c => c.teams.some(t => t.id === game.club.id))?.tier ?? game.club.tier; const outcome = targetTier < game.club.tier ? "awans" as const : targetTier > game.club.tier ? "spadek" as const : "utrzymanie" as const; const nextYear = Number(game.season.slice(0, 4)) + 1; const completed = game.developmentGoals.filter((goal) => goal.progress >= goal.target); const skillMap: Record<string, string> = { tactics: "tactics", motivation: "motivation", people: "people", analysis: "analysis", pressure: "pressure", adaptability: "adaptability", youth: "youth" }; const skills = { ...game.coach.skills };
    for (const goal of completed) { const skill = skillMap[goal.id]; if (skill) skills[skill] = Math.min(100, skills[skill] + 1); }
    const coach = { ...game.coach, age: game.coach.age + 1, skills, reputation: Math.min(100, game.coach.reputation + (completed.some((goal) => goal.id === "reputation") ? 2 : 0)) }; const record = { season: game.season, club: game.club.name, tier: game.club.tier, place, matches: userTeam.played, wins: userTeam.won, draws: userTeam.drawn, losses: userTeam.lost, outcome, goalsCompleted: completed.length };
    const careerStats = { ...game.careerStats, seasons: game.careerStats.seasons + 1, promotions: game.careerStats.promotions + (outcome === "awans" ? 1 : 0), relegations: game.careerStats.relegations + (outcome === "spadek" ? 1 : 0), goalsCompleted: game.careerStats.goalsCompleted + completed.length, highestTier: Math.min(game.careerStats.highestTier, targetTier) }; const pendingSeason = { year: nextYear, targetTier, place, outcome }; const roll = rngNext(game.seed); const fireChance = dismissalProbability({ place, teamCount: table.length, boardPressure: game.pressures.board, patience: game.president.patience, unpredictability: game.president.unpredictability }); const fired = roll.value < fireChance; const goalText = completed.length ? `Zrealizowane cele: ${completed.map((goal) => goal.label).join(", ")}; przyznano powolny rozwój umiejętności.` : "Nie zrealizowano żadnego z dwóch celów; brak automatycznej nagrody.";
    const settled: GameState = { ...game, nextWorld: rolledWorld.world, seed: rolledWorld.seed, coach, careerStats, seasonRecords: [...game.seasonRecords, record], pendingSeason, history: [`Koniec sezonu ${game.season}: ${place}. miejsce, ${outcome}. ${goalText}`, ...game.history].slice(0, 80) };
    const offers = generateJobOffers(settled, settled.seed); const summerOffers = offers.offers.map((offer) => ({ ...offer, stage: "oferta" as const }));
    if (fired) { const unfair = place <= Math.ceil(table.length / 2); const reputationLoss = unfair ? 1 : 4; setGame({ ...settled, seed: offers.seed, newSeasonPending: false, coach: { ...coach, reputation: Math.max(0, coach.reputation - reputationLoss) }, employmentStatus: "unemployed", jobOffers: summerOffers, history: [`${game.presidentName} zakończył współpracę. ${unfair ? "Dobre wyniki ograniczyły stratę reputacji." : "Rynek ocenia również słabą pozycję i presję."}`, ...settled.history] }); go("jobs"); return; }
    setGame({ ...settled, seed: offers.seed, newSeasonPending: false, jobOffers: summerOffers }); go("jobs");
  };
  const acceptJob = (offerId: string) => { if (!game?.pendingSeason) return; const offer = game.jobOffers.find((item) => item.id === offerId); if (!offer || offer.stage === "obserwacja") return; startSeason(game, game.pendingSeason, offerId); };
  const stayAtClub = () => { if (!game?.pendingSeason || game.employmentStatus !== "employed") return; startSeason(game, game.pendingSeason); };
  const dismissMatchReport = () => { if (!game?.matchState?.postMatchReport) return; setGame({ ...game, matchState: { ...game.matchState, reportSeen: true } }); };
  const retireCareer = () => { if (!game || game.coach.age < 65) return; setGame({ ...game, employmentStatus: "retired", careerEnded: true, history: [`${game.date} — ${game.coach.name} zakończył karierę trenerską z własnej decyzji.`, ...game.history] }); go("career"); };
  const confirmNewSeasonGoals = () => { if (!game || selectedGoals.length !== 2) return; setGame({ ...game, developmentGoals: DEVELOPMENT_GOALS.filter((goal) => selectedGoals.includes(goal.id)).map((goal) => ({ ...goal, progress: 0 })) }); go("dashboard"); };

  return { applyTraining, prepareMatch, changeLiveInstruction, resolveMatchMoment, advanceMatch, resolveDecision, beginNextSeason, acceptJob, stayAtClub, dismissMatchReport, retireCareer, confirmNewSeasonGoals };
}

export function migrateGame(value: unknown): GameState {
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
  const tactic = parsed.matchState && !parsed.matchState.completed ? parsed.tactic : { ...parsed.tactic, ...plan.tactic, formation, assignments: selectLineupForPlan(players, FORMATIONS[formation], teamPlan) };
  return {
    ...parsed,
    build: BUILD,
    narrative: normalizeNarrative(parsed.narrative, parsed.club.id),
    seed: generatedWorld.seed,
    coach: { ...parsed.coach, license },
    environment,
    careerChallenge,
    worldHumor: parsed.worldHumor ?? environment.humorBase,
    fixtures,
    date: parsed.date ?? currentScheduledDate ?? `${seasonYear}-07-13`,
    matchState: parsed.matchState ? { ...parsed.matchState, reportSeen: parsed.matchState.reportSeen ?? false, fixture: fixtures.find((fixture) => fixture.round === parsed.matchState?.fixture.round && fixture.home === parsed.matchState?.fixture.home && fixture.away === parsed.matchState?.fixture.away) ?? { ...parsed.matchState.fixture, date: parsed.matchState.fixture.date ?? parsed.date } } : undefined,
    licenseCourse,
    burnout: legacyBurnout ? Math.min(parsed.burnout ?? 8, burnoutCeilingForLegacySave) : parsed.burnout ?? 8,
    lastBurnoutChange: parsed.lastBurnoutChange ?? 0,
    teams: (parsed.teams ?? []).map((team) => ({ ...team, form: team.form ?? 50, morale: team.morale ?? 55, fatigue: team.fatigue ?? 14, lastFive: team.lastFive ?? [] })),
    players,
    tactic,
    world: generatedWorld.world,
    worldActivity: { ...(parsed.worldActivity ?? { date: parsed.date ?? currentScheduledDate ?? `${seasonYear}-07-13`, competitionsAdvanced: 0, matchesPlayed: 0, managerChanges: 0, headlines: [] }) },
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
    trainingMemory: parsed.trainingMemory ?? { youth: 0, analysis: 0, overload: 0, weeks: 0 },
    history,
  };
}

function instructionImpact(field: "mentality" | "pressing", value: string) {
  if (field === "mentality") return value === "Ofensywna" ? .35 : value === "Defensywna" ? -.15 : 0;
  return 0; // Pressing uses the same condition-aware plan impact as at kick-off.
}

function daysBetween(from: string, to: string) {
  const start = new Date(`${from}T12:00:00Z`).getTime(); const end = new Date(`${to}T12:00:00Z`).getTime();
  return Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, Math.round((end - start) / 86400000)) : 7;
}

function plannedTactic(game: GameState, players: GameState["players"]) {
  const teamPlan = TEAM_PLANS[game.teamPlan] ? game.teamPlan : "STRONGEST"; const plan = TEAM_PLANS[teamPlan]; const formation = plan.formation as keyof typeof FORMATIONS;
  const assignments = selectLineupForPlan(players, FORMATIONS[formation], teamPlan);
  return { policy: plan.policy, tactic: { ...game.tactic, ...plan.tactic, formation, assignments } as GameState["tactic"] };
}
