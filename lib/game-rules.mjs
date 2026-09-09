const POSITION_GROUPS = {
  defence: ["PO", "ŚO", "LO", "DP"],
  midfield: ["DP", "ŚP", "PP", "ŚPO", "LP"],
  attack: ["PP", "ŚPO", "LP", "N"],
};

export const POLICY_EFFECTS = {
  BALANCED: {
    label: "Zrównoważona",
    short: "Stabilny kompromis bez premii i bez dodatkowego kosztu.",
    matchStrength: 0,
    fatigue: 0,
    morale: 0,
    burnout: 0,
  },
  HARDLINE: {
    label: "Twarda ręka",
    short: "+ chwilowa intensywność • − świeżość i cierpliwość szatni",
    matchStrength: 0.55,
    fatigue: 2,
    morale: -1,
    burnout: 0.5,
  },
  ROTATION: {
    label: "Rotacja",
    short: "+ świeżość i mniejsze ryzyko urazów • − rytm najmocniejszej XI",
    matchStrength: -0.45,
    fatigue: -1,
    morale: 0,
    burnout: -0.5,
  },
  MOTIVATIONAL: {
    label: "Motywacyjna",
    short: "+ morale i relacje • koszt energii, premia nie kumuluje się bez końca",
    matchStrength: 0.2,
    fatigue: 1,
    morale: 1,
    burnout: 0.5,
  },
};

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeStartingLicense(value) {
  if (value === "Grassroots D" || value === "UEFA C") return "Grassroots C";
  return ["Grassroots C", "UEFA B", "UEFA A", "UEFA PRO"].includes(value) ? value : "Grassroots C";
}

const LICENSE_ORDER = ["Grassroots C", "UEFA B", "UEFA A", "UEFA PRO"];

export function requiredLicenseForTier(tier) {
  if (tier <= 2) return "UEFA PRO";
  if (tier <= 5) return "UEFA A";
  if (tier <= 7) return "UEFA B";
  return "Grassroots C";
}

export function licenseCoversTier(license, tier) {
  return LICENSE_ORDER.indexOf(normalizeStartingLicense(license)) >= LICENSE_ORDER.indexOf(requiredLicenseForTier(tier));
}

export function pressureDeltaForResult(result, multiplier) {
  const safeMultiplier = clamp(Number.isFinite(multiplier) ? multiplier : 1, 1, 2);
  if (result === "win") return -Math.max(3, Math.round(7 / safeMultiplier));
  if (result === "draw") return Math.round((safeMultiplier - 1) * 8) - 1;
  return Math.round(8 * safeMultiplier);
}

export function capReadiness(current, gain, cap) {
  return clamp(current + gain, 0, cap);
}

export function environmentIncidentOccurs(roll, risk) {
  return clamp(roll, 0, 0.999999) < clamp(risk, 0, 1);
}

export function weeklyBurnoutDelta({ result, intensity, recovery, policyBurnout, pressure, profile }) {
  const resultLoad = result === "loss" ? 2 : result === "win" ? -1 : 0;
  const trainingLoad = intensity === "Wysoka" ? 2 : intensity === "Niska" ? -1 : 0;
  const recoveryRelief = recovery ? -1 : 0;
  const pressureLoad = pressure >= 75 ? 2 : pressure >= 55 ? 1 : 0;
  const profileLoad = profile === "Trener od zapierdolu" || profile === "Taktyczny obsesyjny" ? 1 : profile === "Spokojny pragmatyk" ? -1 : 0;
  return clamp(Math.round(resultLoad + trainingLoad + recoveryRelief + policyBurnout + pressureLoad + profileLoad), -3, 6);
}

export function burnoutMatchPenalty(burnout) {
  return burnout <= 35 ? 0 : Number(clamp((burnout - 35) / 12, 0, 5).toFixed(2));
}

export function conditionFromFatigue(fatigue) {
  return Math.round(clamp(100 - fatigue, 0, 100));
}

export function injuryRiskFromFatigue(fatigue, intensity = "Normalna") {
  const loadBonus = intensity === "Wysoka" ? 0.025 : intensity === "Niska" ? -0.005 : 0;
  return Number(clamp(0.008 + Math.max(0, fatigue - 55) * 0.0035 + loadBonus, 0.003, 0.22).toFixed(4));
}

export function goalSatisfied(goalId, context) {
  if (goalId === "tactics") return context.readiness >= 72;
  if (goalId === "motivation") return context.averageMorale >= 68;
  if (goalId === "people") return Boolean(context.positiveDecision);
  if (goalId === "analysis") return Boolean(context.analysisAttempted && context.analysisImproved);
  if (goalId === "pressure") return context.preMatchPressure >= 45 && context.result !== "loss";
  if (goalId === "adaptability") return Boolean(context.newPointFormation);
  if (goalId === "youth") return Boolean(context.newYouthStarter);
  if (goalId === "reputation") return context.result === "win";
  return false;
}

export function resolveProfileScores(profiles, questions, answers) {
  const scores = Object.fromEntries(profiles.map((profile) => [profile, 0]));
  for (const question of questions) {
    const choice = question.choices[answers[question.id]];
    if (!choice) continue;
    for (const [profile, points] of Object.entries(choice.scores)) if (profile in scores) scores[profile] += points ?? 0;
  }
  return profiles.reduce((best, profile) => scores[profile] > scores[best] ? profile : best, profiles[0]);
}

export function rngNext(seed) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: (seed + 0x6d2b79f5) >>> 0 };
}

export function normalizeSlot(slot) {
  if (slot.startsWith("ŚO")) return "ŚO";
  if (slot.startsWith("ŚP")) return "ŚP";
  if (slot.startsWith("DP")) return "DP";
  if (slot.startsWith("N")) return "N";
  return slot;
}

export function positionPenalty(player, slot) {
  const target = normalizeSlot(slot);
  if (player.primary === target) return 0;
  if (player.secondary.includes(target)) return 0.04;
  if (player.primary === "BR" || target === "BR") return 0.45;
  if (POSITION_GROUPS.defence.includes(player.primary) && POSITION_GROUPS.defence.includes(target)) return 0.09;
  if (POSITION_GROUPS.midfield.includes(player.primary) && POSITION_GROUPS.midfield.includes(target)) return 0.07;
  if (POSITION_GROUPS.attack.includes(player.primary) && POSITION_GROUPS.attack.includes(target)) return 0.08;
  return 0.2;
}

export function liveBreakdown(player) {
  const form = (player.form - 50) * 0.0015;
  const morale = (player.morale - 50) * 0.0012;
  const relation = (player.relation - 50) * 0.0004;
  const fatigue = -Math.max(0, player.fatigue - 15) * 0.0018;
  return { form, morale, relation, fatigue, total: clamp(form + morale + relation + fatigue, -0.2, 0.14) };
}

export function liveOVR(player) {
  return Math.max(1, Math.round(player.baseOVR * (1 + liveBreakdown(player).total)));
}

export function effectiveOVR(player, slot) {
  if ((player.injuryWeeks ?? 0) > 0) return 1;
  return Math.max(1, Math.round(liveOVR(player) * (1 - positionPenalty(player, slot))));
}

export function selectBestLineup(players, slots) {
  const assignments = {};
  const used = new Set();
  const orderedSlots = [...slots].sort((a, b) => {
    const exactA = players.filter((p) => positionPenalty(p, a) === 0).length;
    const exactB = players.filter((p) => positionPenalty(p, b) === 0).length;
    return exactA - exactB;
  });
  for (const slot of orderedSlots) {
    const player = players
      .filter((candidate) => !used.has(candidate.id) && (candidate.injuryWeeks ?? 0) <= 0)
      .sort((a, b) => positionPenalty(a, slot) - positionPenalty(b, slot) || liveOVR(b) - liveOVR(a))[0];
    if (player) {
      assignments[slot] = player.id;
      used.add(player.id);
    }
  }
  return assignments;
}

function isoAtUtc(value) {
  return new Date(`${value}T12:00:00Z`);
}

function plusDays(value, days) {
  const date = isoAtUtc(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function roundDates(count, start, end) {
  if (count <= 1) return [start];
  const spanWeeks = Math.round((isoAtUtc(end).getTime() - isoAtUtc(start).getTime()) / 604800000);
  return Array.from({ length: count }, (_, index) => plusDays(start, Math.round(index * spanWeeks / (count - 1)) * 7));
}

export function seasonRoundDates(roundCount, startYear = 2026, tier = 9) {
  const firstLegRounds = Math.ceil(roundCount / 2);
  const secondLegRounds = roundCount - firstLegRounds;
  const professional = tier <= 4;
  const autumnStart = tier <= 2 ? `${startYear}-07-18` : tier <= 4 ? `${startYear}-08-01` : `${startYear}-08-08`;
  const autumnEnd = professional ? `${startYear}-12-05` : `${startYear}-11-21`;
  const springStart = tier <= 2 ? `${startYear + 1}-02-20` : tier <= 4 ? `${startYear + 1}-02-27` : `${startYear + 1}-03-06`;
  const springEnd = professional ? `${startYear + 1}-05-29` : `${startYear + 1}-06-12`;
  return [...roundDates(firstLegRounds, autumnStart, autumnEnd), ...roundDates(secondLegRounds, springStart, springEnd)];
}

export function buildSchedule(teamIds, startYear = 2026, tier = 9) {
  const teams = [...teamIds];
  if (teams.length % 2) teams.push("bye");
  const firstLeg = [];
  const rotation = [...teams];
  for (let round = 1; round < teams.length; round += 1) {
    for (let index = 0; index < teams.length / 2; index += 1) {
      const home = rotation[index];
      const away = rotation[rotation.length - 1 - index];
      if (home !== "bye" && away !== "bye") firstLeg.push({ round, home: round % 2 ? home : away, away: round % 2 ? away : home, played: false });
    }
    rotation.splice(1, 0, rotation.pop());
  }
  const offset = teams.length - 1;
  const fixtures = [...firstLeg, ...firstLeg.map((fixture) => ({ ...fixture, round: fixture.round + offset, home: fixture.away, away: fixture.home }))];
  const dates = seasonRoundDates(offset * 2, startYear, tier);
  return fixtures.map((fixture) => ({ ...fixture, date: dates[fixture.round - 1] }));
}

export function winterBreakDays(fixtures) {
  const rounds = Math.max(0, ...fixtures.map((fixture) => fixture.round));
  const firstSpringRound = Math.ceil(rounds / 2) + 1;
  const autumn = fixtures.find((fixture) => fixture.round === firstSpringRound - 1)?.date;
  const spring = fixtures.find((fixture) => fixture.round === firstSpringRound)?.date;
  if (!autumn || !spring) return 0;
  return Math.round((isoAtUtc(spring).getTime() - isoAtUtc(autumn).getTime()) / 86400000);
}

export function offseasonBaseChange(player, roll) {
  if (player.age <= 20 && player.baseOVR < player.potential) return roll < 0.18 ? 2 : 1;
  if (player.age <= 24 && player.baseOVR < player.potential) return roll < 0.58 ? 1 : 0;
  if (player.age <= 29) return roll < 0.12 && player.baseOVR < player.potential ? 1 : 0;
  if (player.age <= 32) return roll < 0.35 ? -1 : 0;
  if (player.age <= 35) return roll < 0.72 ? -1 : 0;
  return roll < 0.45 ? -2 : -1;
}

export function shouldRetirePlayer(age, roll) {
  if (age < 36) return false;
  if (age === 36) return roll < 0.08;
  if (age === 37) return roll < 0.25;
  if (age === 38) return roll < 0.58;
  return true;
}

export function offseasonBurnout(burnout) {
  return Math.max(0, Math.round(burnout * 0.55 - 8));
}

export function dismissalProbability({ place, teamCount, boardPressure, patience, unpredictability }) {
  const positionLoad = place >= teamCount - 1 ? 0.34 : place > Math.ceil(teamCount * 0.7) ? 0.16 : place <= Math.ceil(teamCount * 0.4) ? -0.12 : 0;
  return clamp(0.04 + positionLoad + boardPressure / 250 + (50 - patience) / 220 + unpredictability / 650, 0.02, 0.86);
}

export function updateTeamResult(teams, home, away, homeGoals, awayGoals) {
  return teams.map((team) => {
    if (team.id !== home && team.id !== away) return team;
    const isHome = team.id === home;
    const goalsFor = isHome ? homeGoals : awayGoals;
    const goalsAgainst = isHome ? awayGoals : homeGoals;
    return { ...team, played: team.played + 1, won: team.won + (goalsFor > goalsAgainst ? 1 : 0), drawn: team.drawn + (goalsFor === goalsAgainst ? 1 : 0), lost: team.lost + (goalsFor < goalsAgainst ? 1 : 0), gf: team.gf + goalsFor, ga: team.ga + goalsAgainst, points: team.points + (goalsFor > goalsAgainst ? 3 : goalsFor === goalsAgainst ? 1 : 0) };
  });
}

export function sortedTable(teams) {
  return [...teams].sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.name.localeCompare(b.name, "pl"));
}

export function simulateMatchPlan(seed, homeStrength, awayStrength, homeName = "Gospodarze", awayName = "Goście") {
  const difference = clamp(homeStrength - awayStrength, -24, 24);
  const homeXg = clamp(1.32 + 0.045 * difference + 0.2, 0.28, 3.25);
  const awayXg = clamp(1.2 - 0.045 * difference, 0.24, 3.05);
  const events = [];
  let homeGoals = 0;
  let awayGoals = 0;
  let shotsHome = 0;
  let shotsAway = 0;
  let nextSeed = seed >>> 0;

  for (let minute = 3; minute <= 90; minute += 3) {
    let roll = rngNext(nextSeed); nextSeed = roll.seed;
    if (roll.value < 0.145) {
      shotsHome += 1;
      const finish = rngNext(nextSeed); nextSeed = finish.seed;
      if (finish.value < homeXg / (30 * 0.145)) {
        homeGoals += 1;
        events.push({ minute, text: `Gol dla ${homeName}! Skuteczne wykończenie akcji w polu karnym.`, kind: "goal", side: "home" });
      } else if (roll.value < 0.09) events.push({ minute, text: `${homeName} tworzy groźną sytuację, ale bramkarz interweniuje.`, kind: "chance", side: "home" });
    }

    roll = rngNext(nextSeed); nextSeed = roll.seed;
    if (roll.value < 0.135) {
      shotsAway += 1;
      const finish = rngNext(nextSeed); nextSeed = finish.seed;
      if (finish.value < awayXg / (30 * 0.135)) {
        awayGoals += 1;
        events.push({ minute: Math.min(90, minute + 1), text: `Gol dla ${awayName}. Szybka akcja i pewne wykończenie.`, kind: "goal", side: "away" });
      } else if (roll.value < 0.085) events.push({ minute: Math.min(90, minute + 1), text: `${awayName} dochodzi do strzału — piłka mija słupek.`, kind: "chance", side: "away" });
    }

    roll = rngNext(nextSeed); nextSeed = roll.seed;
    if (roll.value > 0.977) events.push({ minute: Math.min(90, minute + 2), text: "Żółta kartka po spóźnionym wejściu w środku pola.", kind: "card", side: roll.value > 0.988 ? "away" : "home" });
  }

  if (!events.length) events.push({ minute: 12, text: "Obie drużyny ostrożnie walczą o przewagę w środku pola.", kind: "info", side: "neutral" });
  events.sort((a, b) => a.minute - b.minute);
  return {
    seed: nextSeed,
    events,
    homeGoals,
    awayGoals,
    shotsHome,
    shotsAway,
    possessionHome: Math.round(clamp(51.5 + difference * 0.55, 35, 65)),
    homeXg,
    awayXg,
  };
}
