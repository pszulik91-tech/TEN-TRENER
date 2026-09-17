import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMatchStrength, buildSchedule, burnoutMatchPenalty, capReadiness, coachingExperienceEligibility, conditionFromFatigue, defaultMicrocycle, diagnoseMatchOutcome, dismissalProbability, effectiveOVR, environmentIncidentOccurs, evaluateMicrocycle, goalSatisfied,
  injuryRiskFromFatigue, licenseCoversCompetition, licenseCoversTier, liveBreakdown, liveOVR, normalizeStartingLicense, offseasonBaseChange, offseasonBurnout, POLICY_EFFECTS, positionPenalty, pressureDeltaForResult,
  requiredLicenseForTier, resolveProfileScores, rngNext, seasonRoundDates, selectBestLineup, selectLineupForPlan, shouldRetirePlayer, simulateMatchPlan, sortedTable, startingLicenseEligibility, highestEligibleStartingLicense, highestEligibleCoachingExperience, naturalRecoveryForGap, teamLiveStrength, trainingPresetSessions, updateTeamResult, weeklyBurnoutDelta, winterBreakDays,
} from "../lib/game-rules.mjs";

const player = (id, primary, baseOVR = 50, secondary = []) => ({ id, primary, secondary, baseOVR, form: 50, morale: 50, fatigue: 10, relation: 50 });

test("Live OVR opisuje dyspozycję, a kara pozycyjna jest osobnym efektem XI", () => {
  const restedWinner = { ...player("p", "ŚO"), form: 53, morale: 62, fatigue: 22, relation: 55 };
  assert.ok(liveOVR(restedWinner) >= restedWinner.baseOVR);
  assert.equal(liveOVR(restedWinner), liveOVR({ ...restedWinner, primary: "BR" }));
  assert.ok(effectiveOVR(restedWinner, "N") < liveOVR(restedWinner));
  assert.ok(liveBreakdown({ ...restedWinner, fatigue: 100 }).total >= -0.2);
  assert.ok(liveBreakdown({ ...restedWinner, form: 100, morale: 100, relation: 100, fatigue: 0 }).total <= 0.14);
});

test("kary pozycyjne mają realistyczną skalę", () => {
  assert.equal(positionPenalty(player("gk", "BR"), "N"), 0.45);
  assert.equal(positionPenalty(player("cb", "ŚO"), "LO"), 0.09);
  assert.equal(positionPenalty(player("cb2", "ŚO", 50, ["LO"]), "LO"), 0.04);
  assert.equal(positionPenalty(player("lb", "LO"), "LO"), 0);
});

test("Najlepsza XI jest unikalna i wybiera specjalistów pozycji przed samym OVR", () => {
  const slots = ["BR", "PO", "ŚO-L", "ŚO-P", "LO", "PP", "ŚP-P", "ŚP-L", "LP", "N-L", "N-P"];
  const primaries = ["BR", "PO", "ŚO", "ŚO", "LO", "PP", "ŚP", "ŚP", "LP", "N", "N"];
  const players = primaries.map((primary, index) => player(`p${index}`, primary, 40 + index));
  players.push(player("star", "N", 99));
  const assignments = selectBestLineup(players, slots);
  assert.equal(new Set(Object.values(assignments)).size, 11);
  for (const slot of slots) {
    const selected = players.find((item) => item.id === assignments[slot]);
    assert.ok(selected);
    assert.equal(positionPenalty(selected, slot), 0);
  }
});

test("Najlepsza XI omija kontuzjowanych, nawet gdy mają najwyższy OVR", () => {
  const players = [
    { ...player("injured", "BR", 99), injuryWeeks: 2 },
    player("healthy", "BR", 38),
    player("striker", "N", 50),
  ];
  const assignments = selectBestLineup(players, ["BR", "N"]);
  assert.equal(assignments.BR, "healthy");
  assert.ok(!Object.values(assignments).includes("injured"));
  assert.equal(effectiveOVR(players[0], "BR"), 1);
});

test("automatyczne plany omijają kontuzje i absencje oraz zachowują pozycje", () => {
  const slots = ["BR", "PO", "ŚO-L", "ŚO-P", "LO", "PP", "ŚP-P", "ŚP-L", "LP", "N-L", "N-P"];
  const primaries = ["BR", "PO", "ŚO", "ŚO", "LO", "PP", "ŚP", "ŚP", "LP", "N", "N"];
  const healthy = primaries.map((primary, index) => ({ ...player(`healthy-${index}`, primary, 45 + index), age: 24 + index % 5 }));
  const unavailable = [
    { ...player("injured-star", "N", 99), age: 24, injuryWeeks: 2 },
    { ...player("work-shift-star", "ŚP", 98), age: 25, absenceRounds: 1 },
  ];
  for (const plan of ["STRONGEST", "ROTATION", "YOUTH", "FRESH", "PRESS"]) {
    const assignments = selectLineupForPlan([...healthy, ...unavailable], slots, plan);
    assert.equal(new Set(Object.values(assignments)).size, 11, plan);
    assert.ok(!Object.values(assignments).includes("injured-star"), plan);
    assert.ok(!Object.values(assignments).includes("work-shift-star"), plan);
    for (const slot of slots) assert.equal(positionPenalty(healthy.find((item) => item.id === assignments[slot]), slot), 0, `${plan}: ${slot}`);
  }
});

test("plany Młodzi i Świeże nogi rzeczywiście zmieniają automatyczną XI", () => {
  const slots = ["BR", "PO", "ŚO-L", "ŚO-P", "LO", "PP", "ŚP-P", "ŚP-L", "LP", "N-L", "N-P"];
  const primaries = ["BR", "PO", "ŚO", "ŚO", "LO", "PP", "ŚP", "ŚP", "LP", "N", "N"];
  const veterans = primaries.map((primary, index) => ({ ...player(`v-${index}`, primary, 56), age: 31, fatigue: index < 5 ? 78 : 38 }));
  const youth = primaries.map((primary, index) => ({ ...player(`u-${index}`, primary, 52), age: 19, fatigue: 8 }));
  const strongest = Object.values(selectLineupForPlan([...veterans, ...youth], slots, "STRONGEST"));
  const young = Object.values(selectLineupForPlan([...veterans, ...youth], slots, "YOUTH"));
  const fresh = Object.values(selectLineupForPlan([...veterans, ...youth], slots, "FRESH"));
  assert.ok(young.filter((id) => id.startsWith("u-")).length > strongest.filter((id) => id.startsWith("u-")).length);
  assert.ok(fresh.filter((id) => id.startsWith("u-")).length >= 5);
});

test("Rotacja odstawia zmęczonego lidera, gdy świeży zmiennik jest wystarczająco dobry", () => {
  const tiredLeader = { ...player("leader", "N", 60), age: 29, fatigue: 50 };
  const freshReserve = { ...player("reserve", "N", 55), age: 24, fatigue: 0 };
  assert.equal(selectLineupForPlan([tiredLeader, freshReserve], ["N"], "STRONGEST").N, "leader");
  assert.equal(selectLineupForPlan([tiredLeader, freshReserve], ["N"], "ROTATION").N, "reserve");
});

test("symulacja jest deterministyczna i nie generuje NaN", () => {
  const first = simulateMatchPlan(202627, 52, 48, "A", "B");
  const second = simulateMatchPlan(202627, 52, 48, "A", "B");
  assert.deepEqual(first, second);
  for (const value of [first.homeGoals, first.awayGoals, first.shotsHome, first.shotsAway, first.possessionHome]) assert.ok(Number.isFinite(value) && value >= 0);
});

test("benchmark 5000 meczów: faworyt ma przewagę, ale słabszy nadal wygrywa", () => {
  let favoriteWins = 0; let underdogWins = 0; let draws = 0; let goals = 0;
  for (let seed = 1; seed <= 5000; seed += 1) {
    const match = simulateMatchPlan(seed, 58, 48);
    goals += match.homeGoals + match.awayGoals;
    if (match.homeGoals > match.awayGoals) favoriteWins += 1;
    else if (match.homeGoals < match.awayGoals) underdogWins += 1;
    else draws += 1;
  }
  assert.ok(favoriteWins > underdogWins);
  assert.ok(underdogWins / 5000 > 0.08);
  assert.ok(draws / 5000 > 0.12);
  assert.ok(goals / 5000 > 1.5 && goals / 5000 < 4.2);
});

test("każda polityka kadry ma koszt, jeśli daje premię", () => {
  assert.equal(POLICY_EFFECTS.BALANCED.matchStrength, 0);
  for (const [id, effect] of Object.entries(POLICY_EFFECTS)) {
    if (id !== "BALANCED" && effect.matchStrength > 0) assert.ok(effect.fatigue > 0 || effect.burnout > 0 || effect.morale < 0);
  }
  assert.ok(POLICY_EFFECTS.ROTATION.fatigue < 0 && POLICY_EFFECTS.ROTATION.matchStrength < 0);
});

test("kondycja jest jawna, a granie jedną XI przez całą rundę ma koszt", () => {
  assert.equal(conditionFromFatigue(0), 100);
  assert.equal(conditionFromFatigue(63), 37);
  assert.equal(conditionFromFatigue(130), 0);
  const base = player("p", "ŚP", 50);
  let fatigue = 10;
  for (let week = 0; week < 12; week += 1) fatigue += 5 + POLICY_EFFECTS.BALANCED.fatigue;
  assert.equal(fatigue, 70);
  assert.ok(liveOVR({ ...base, fatigue }) <= 45);
  assert.ok(injuryRiskFromFatigue(fatigue, "Normalna") > injuryRiskFromFatigue(20, "Normalna") * 5);
});

test("Monte Carlo urazów rozróżnia świeżego i przeciążonego zawodnika", () => {
  let seed = 812733; let fresh = 0; let exhausted = 0;
  for (let sample = 0; sample < 20_000; sample += 1) {
    let roll = rngNext(seed); seed = roll.seed; if (roll.value < injuryRiskFromFatigue(25, "Normalna")) fresh += 1;
    roll = rngNext(seed); seed = roll.seed; if (roll.value < injuryRiskFromFatigue(82, "Wysoka")) exhausted += 1;
  }
  assert.ok(fresh / 20_000 < 0.015);
  assert.ok(exhausted / 20_000 > 0.10);
  assert.ok(exhausted > fresh * 8);
});

test("wypalenie jest liczone raz na tydzień i nie może skoczyć do 47 po starcie", () => {
  let maximum = -Infinity;
  for (const result of ["win", "draw", "loss"]) for (const intensity of ["Niska", "Normalna", "Wysoka"]) for (const recovery of [false, true]) for (const policy of Object.values(POLICY_EFFECTS)) for (const pressure of [10, 60, 85]) for (const profile of ["Generał", "Trener od zapierdolu", "Spokojny pragmatyk"]) {
    maximum = Math.max(maximum, weeklyBurnoutDelta({ result, intensity, recovery, policyBurnout: policy.burnout, pressure, profile }));
  }
  assert.equal(maximum, 3);
  assert.ok(8 + maximum < 20);
  assert.equal(burnoutMatchPenalty(35), 0);
  assert.ok(burnoutMatchPenalty(47) > 0);
  assert.ok(burnoutMatchPenalty(90) <= 5);
});

test("Monte Carlo 5000 półsezonów: normalna praca nie produkuje masowo krytycznego wypalenia", () => {
  let seed = 188194; let critical = 0; let sum = 0;
  for (let season = 0; season < 5000; season += 1) {
    let burnout = 8; let pressure = 20;
    for (let week = 0; week < 18; week += 1) {
      const roll = rngNext(seed); seed = roll.seed; const result = roll.value < .4 ? "win" : roll.value < .68 ? "draw" : "loss";
      const delta = weeklyBurnoutDelta({ result, intensity: "Normalna", recovery: week % 4 === 3, policyBurnout: 0, pressure, profile: "Dyplomata" });
      burnout = Math.max(0, Math.min(100, burnout + delta));
      pressure = Math.max(0, Math.min(100, pressure + pressureDeltaForResult(result, 1)));
    }
    sum += burnout; if (burnout >= 65) critical += 1;
  }
  assert.ok(sum / 5000 < 24);
  assert.ok(critical / 5000 < 0.01);
});

test("wszystkie osiem celów ma osiągalny i nieautomatyczny warunek", () => {
  const positive = { readiness: 75, averageMorale: 72, positiveDecision: true, analysisAttempted: true, analysisImproved: true, preMatchPressure: 50, result: "win", newPointFormation: true, newYouthStarter: true };
  for (const id of ["tactics", "motivation", "people", "analysis", "pressure", "adaptability", "youth", "reputation"]) assert.equal(goalSatisfied(id, positive), true, id);
  assert.equal(goalSatisfied("analysis", { ...positive, analysisAttempted: false }), false);
  assert.equal(goalSatisfied("analysis", { ...positive, analysisImproved: false }), false);
  assert.equal(goalSatisfied("pressure", { ...positive, result: "loss" }), false);
  assert.equal(goalSatisfied("adaptability", { ...positive, newPointFormation: false }), false);
  assert.equal(goalSatisfied("youth", { ...positive, newYouthStarter: false }), false);
});

test("stare licencje migrują do Grassroots C, a wyższy start zwiększa koszt wyniku", () => {
  assert.equal(normalizeStartingLicense("Grassroots D"), "Grassroots C");
  assert.equal(normalizeStartingLicense("UEFA C"), "Grassroots C");
  assert.equal(normalizeStartingLicense("UEFA A"), "UEFA A");
  assert.equal(normalizeStartingLicense("nieznana"), "Grassroots C");
  assert.ok(pressureDeltaForResult("loss", 1.6) > pressureDeltaForResult("loss", 1));
  assert.ok(pressureDeltaForResult("draw", 1.6) > pressureDeltaForResult("draw", 1));
  assert.ok(pressureDeltaForResult("win", 1.6) > pressureDeltaForResult("win", 1));
});

test("licencja startowa wynika z wiarygodnego życiorysu trenera", () => {
  assert.equal(startingLicenseEligibility("Grassroots C", "Brak", "Debiutant").eligible, true);
  assert.equal(startingLicenseEligibility("UEFA B", "Brak", "Debiutant").eligible, false);
  assert.equal(startingLicenseEligibility("UEFA B", "Niższe ligi", "Debiutant").eligible, true);
  assert.equal(startingLicenseEligibility("UEFA A", "Zawodowiec", "1–3 lata").eligible, true);
  assert.equal(startingLicenseEligibility("UEFA PRO", "Brak", "Debiutant").eligible, false);
  assert.equal(startingLicenseEligibility("UEFA PRO", "Reprezentant", "4–10 lat").eligible, true);
  assert.equal(highestEligibleStartingLicense("Brak", "Debiutant"), "Grassroots C");
  assert.equal(highestEligibleStartingLicense("Reprezentant", "4–10 lat"), "UEFA PRO");
});

test("wiek i kariera zawodnicza ograniczają możliwy staż trenerski", () => {
  assert.equal(coachingExperienceEligibility(35, "Zawodowiec", "Ponad 10 lat").eligible, false);
  assert.equal(coachingExperienceEligibility(35, "Zawodowiec", "4–10 lat").eligible, true);
  assert.equal(highestEligibleCoachingExperience(35, "Zawodowiec"), "4–10 lat");
  assert.equal(startingLicenseEligibility("UEFA PRO", "Zawodowiec", "Ponad 10 lat", 35).eligible, false);
  assert.equal(coachingExperienceEligibility(45, "Zawodowiec", "Ponad 10 lat").eligible, true);
});

test("rozkład siły oddziela OVR, przygotowanie, warsztat, plan i zdarzenia", () => {
  const strength = buildMatchStrength({ lineupOVR: 44, readiness: 62, coachTactics: 48, averageCondition: 82, tactic: { pressing: "Średni", tempo: "Normalne", line: "Średnia", buildUp: "Mieszane", passingRisk: "Umiarkowane", mentality: "Zrównoważona" }, policyStrength: 0, burnout: 8, incidentPenalty: 0 });
  assert.equal(strength.factors.lineup, 44);
  assert.ok(strength.factors.preparation < 0 && strength.factors.preparation > -1);
  assert.equal(Number.isFinite(strength.total), true);
  assert.ok(Math.abs(strength.total - Object.values(strength.factors).reduce((sum, value) => sum + value, 0)) < .01);
});

test("raport nie obwinia przygotowania 62% za skrajnie skutecznego rywala", () => {
  const diagnosis = diagnoseMatchOutcome({ result: "loss", readiness: 62, expectedWin: .58, expectedLoss: .2, userGoals: 1, opponentGoals: 4, userXg: 1.7, opponentXg: 1.05, userShots: 8, opponentShots: 8 });
  assert.match(diagnosis, /skuteczny/);
  assert.doesNotMatch(diagnosis, /gotowość/i);
});

test("forma, morale i zmęczenie zmieniają siłę drużyn AI w sezonie", () => {
  const base = { id: "a", name: "A", ovr: 50, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0, form: 50, morale: 55, fatigue: 14 };
  assert.ok(teamLiveStrength({ ...base, form: 70, morale: 70 }) > teamLiveStrength(base));
  assert.ok(teamLiveStrength({ ...base, fatigue: 70 }) < teamLiveStrength(base));
});

test("środowisko ogranicza gotowość i ma kontrolowane ryzyko absencji", () => {
  assert.equal(capReadiness(80, 8, 82), 82);
  assert.equal(capReadiness(60, 5, 96), 65);
  assert.equal(environmentIncidentOccurs(.05, .16), true);
  assert.equal(environmentIncidentOccurs(.5, .16), false);
  assert.equal(environmentIncidentOccurs(.5, 0), false);
});

test("mikrocykl ma od 2 do 6 osobno edytowalnych sesji zależnie od środowiska", () => {
  for (let count = 2; count <= 6; count += 1) {
    const sessions = defaultMicrocycle(count);
    assert.equal(sessions.length, count);
    assert.equal(new Set(sessions.map((session) => session.id)).size, count);
    assert.ok(sessions.every((session) => session.day && session.focus && session.intensity));
  }
  assert.deepEqual(defaultMicrocycle(1), defaultMicrocycle(2));
  assert.deepEqual(defaultMicrocycle(9), defaultMicrocycle(6));
});

test("skutek mikrocyklu wynika ze wszystkich sesji, a regeneracja ma realny koszt i zysk", () => {
  const normal = evaluateMicrocycle(defaultMicrocycle(4));
  const hard = evaluateMicrocycle(defaultMicrocycle(4).map((session) => ({ ...session, focus: "Pressing", intensity: "Wysoka" })));
  const recovery = evaluateMicrocycle(defaultMicrocycle(4).map((session) => ({ ...session, focus: "Regeneracja", intensity: "Niska" })));
  assert.ok(hard.readinessGain > 0);
  assert.ok(hard.fatigueDelta > normal.fatigueDelta);
  assert.equal(hard.risk, "wysokie");
  assert.ok(recovery.fatigueDelta < 0);
  assert.ok(recovery.readinessGain < normal.readinessGain);
  assert.equal(recovery.hasRecovery, true);
});

test("preset mikrocyklu zawsze rozpisuje właściwą liczbę sesji", () => {
  for (const count of [2, 3, 4, 5, 6]) for (const preset of ["BALANCED", "RECOVERY", "OPPONENT", "INTENSE", "YOUTH"]) {
    const sessions = trainingPresetSessions(count, preset);
    assert.equal(sessions.length, count, `${preset}/${count}`);
    assert.ok(sessions.every((session) => session.day && session.focus && session.intensity));
  }
});

test("regeneracja między meczami stabilizuje normalny rytm, ale nie kasuje kosztu przeciążania", () => {
  const balancedLoad = evaluateMicrocycle(trainingPresetSessions(2, "BALANCED")).fatigueDelta;
  const intenseLoad = evaluateMicrocycle(trainingPresetSessions(2, "INTENSE")).fatigueDelta;
  let balancedFatigue = 10; let intenseFatigue = 10;
  for (let week = 0; week < 18; week += 1) {
    const recovery = naturalRecoveryForGap(7, 9);
    balancedFatigue = Math.max(0, Math.min(100, balancedFatigue - recovery + balancedLoad + 8));
    intenseFatigue = Math.max(0, Math.min(100, intenseFatigue - recovery + intenseLoad + 8 + POLICY_EFFECTS.HARDLINE.fatigue));
  }
  assert.ok(conditionFromFatigue(balancedFatigue) >= 60, `kondycja ${conditionFromFatigue(balancedFatigue)}`);
  assert.ok(intenseFatigue > balancedFatigue + 20);
  assert.ok(naturalRecoveryForGap(14, 2) > naturalRecoveryForGap(7, 2));
  assert.ok(naturalRecoveryForGap(7, 2) > naturalRecoveryForGap(7, 9));
});

test("ankieta przypisuje profil deterministycznie i ignoruje nieznane punkty", () => {
  const profiles = ["Mentor", "Generał", "Hazardzista"];
  const questions = [
    { id: "q1", choices: [{ scores: { Mentor: 3 } }, { scores: { Generał: 3 } }] },
    { id: "q2", choices: [{ scores: { Hazardzista: 4 } }, { scores: { Mentor: 2, Inny: 99 } }] },
  ];
  const answers = { q1: 0, q2: 0 };
  assert.equal(resolveProfileScores(profiles, questions, answers), "Hazardzista");
  assert.equal(resolveProfileScores(profiles, questions, answers), resolveProfileScores(profiles, questions, answers));
  assert.equal(resolveProfileScores(profiles, questions, { q1: 1, q2: 1 }), "Generał");
});

test("pełny sezon ligi zachowuje wszystkie inwarianty tabeli", () => {
  const teams = Array.from({ length: 10 }, (_, index) => ({ id: `t${index}`, name: `Drużyna ${index}`, ovr: 40 + index, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }));
  const fixtures = buildSchedule(teams.map((team) => team.id));
  assert.equal(fixtures.length, 90);
  let table = teams; let seed = 9191;
  for (const fixture of fixtures) {
    const home = table.find((team) => team.id === fixture.home);
    const away = table.find((team) => team.id === fixture.away);
    const match = simulateMatchPlan(seed, home.ovr, away.ovr); seed = match.seed;
    table = updateTeamResult(table, fixture.home, fixture.away, match.homeGoals, match.awayGoals);
  }
  for (const team of table) {
    assert.equal(team.played, 18);
    assert.equal(team.won + team.drawn + team.lost, team.played);
    assert.equal(team.points, team.won * 3 + team.drawn);
    for (const value of Object.values(team).filter((item) => typeof item === "number")) assert.ok(Number.isFinite(value));
  }
  assert.equal(table.reduce((sum, team) => sum + team.gf, 0), table.reduce((sum, team) => sum + team.ga, 0));
  const sorted = sortedTable(table);
  assert.ok(sorted.every((team, index) => index === 0 || sorted[index - 1].points >= team.points));
});

test("terminarz 2026/27 ma jesień, przerwę zimową i pełną wiosnę", () => {
  const fixtures = buildSchedule(Array.from({ length: 10 }, (_, index) => `t${index}`), 2026, 9);
  const dates = seasonRoundDates(18, 2026, 9);
  assert.equal(new Set(fixtures.map((fixture) => fixture.date)).size, 18);
  assert.deepEqual([...new Set(fixtures.map((fixture) => fixture.date))], dates);
  assert.ok(dates[0] >= "2026-08-01" && dates[0] <= "2026-08-15");
  assert.ok(dates[8] >= "2026-11-14");
  assert.ok(dates[9] >= "2027-03-01");
  assert.ok(dates.at(-1) >= "2027-06-01");
  assert.ok(winterBreakDays(fixtures) >= 90);
  for (const date of dates) assert.equal(new Date(`${date}T12:00:00Z`).getUTCDay(), 6);
});

test("licencja blokuje poziom rynku, ale awans może uruchomić ścieżkę kursu", () => {
  assert.equal(requiredLicenseForTier(9), "Grassroots C");
  assert.equal(requiredLicenseForTier(7), "UEFA B");
  assert.equal(requiredLicenseForTier(5), "UEFA A");
  assert.equal(requiredLicenseForTier(1), "UEFA PRO");
  assert.equal(licenseCoversTier("Grassroots C", 7), false);
  assert.equal(licenseCoversTier("UEFA A", 4), true);
  assert.equal(licenseCoversTier("UEFA PRO", 9), true);
  assert.equal(licenseCoversCompetition("Grassroots C", "Klasa A"), true);
  assert.equal(licenseCoversCompetition("Grassroots C", "Klasa okręgowa"), false);
  assert.equal(licenseCoversCompetition("UEFA B", "Klasa okręgowa"), true);
  assert.equal(licenseCoversCompetition("UEFA A", "III liga"), true);
});

test("po sezonie zawodnicy starzeją się i Base OVR zmienia się tylko według wieku", () => {
  assert.equal(offseasonBaseChange({ age: 19, baseOVR: 40, potential: 60 }, .9), 1);
  assert.equal(offseasonBaseChange({ age: 27, baseOVR: 50, potential: 50 }, .01), 0);
  assert.ok(offseasonBaseChange({ age: 36, baseOVR: 50, potential: 60 }, .9) < 0);
  assert.equal(shouldRetirePlayer(35, 0), false);
  assert.equal(shouldRetirePlayer(39, .99), true);
  assert.equal(offseasonBurnout(80), 36);
  assert.equal(offseasonBurnout(10), 0);
});

test("zwolnienie zależy od pozycji, presji i cierpliwości prezesa", () => {
  const safe = dismissalProbability({ place: 2, teamCount: 10, boardPressure: 15, patience: 75, unpredictability: 20 });
  const crisis = dismissalProbability({ place: 10, teamCount: 10, boardPressure: 92, patience: 22, unpredictability: 75 });
  assert.ok(safe >= .02 && safe < .12);
  assert.ok(crisis > .65 && crisis <= .86);
});

test("30 sezonów całego świata nie tworzy NaN ani niespójnej tabeli", () => {
  let seed = 771991;
  for (let season = 0; season < 30; season += 1) {
    let table = Array.from({ length: 10 }, (_, index) => ({ id: `s${season}-t${index}`, name: `Klub ${index}`, ovr: 34 + ((index * 3 + season) % 17), played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }));
    const fixtures = buildSchedule(table.map((team) => team.id));
    for (const fixture of fixtures) {
      const home = table.find((team) => team.id === fixture.home);
      const away = table.find((team) => team.id === fixture.away);
      const match = simulateMatchPlan(seed, home.ovr, away.ovr); seed = match.seed;
      table = updateTeamResult(table, fixture.home, fixture.away, match.homeGoals, match.awayGoals);
    }
    assert.equal(table.reduce((sum, team) => sum + team.played, 0), 180);
    assert.equal(table.reduce((sum, team) => sum + team.gf, 0), table.reduce((sum, team) => sum + team.ga, 0));
    for (const team of table) {
      assert.equal(team.played, 18);
      assert.equal(team.points, team.won * 3 + team.drawn);
      assert.ok(Object.values(team).filter((value) => typeof value === "number").every(Number.isFinite));
    }
  }
});
