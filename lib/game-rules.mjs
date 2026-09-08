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
    matchStrength: 0.8,
    fatigue: 3,
    morale: -1,
    burnout: 2,
  },
  ROTATION: {
    label: "Rotacja",
    short: "+ świeżość i mniejsze ryzyko urazów • − rytm najmocniejszej XI",
    matchStrength: -0.35,
    fatigue: -3,
    morale: 1,
    burnout: -1,
  },
  MOTIVATIONAL: {
    label: "Motywacyjna",
    short: "+ morale i relacje • koszt energii, premia nie kumuluje się bez końca",
    matchStrength: 0.35,
    fatigue: 1,
    morale: 2,
    burnout: 1,
  },
};

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
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
      .filter((candidate) => !used.has(candidate.id))
      .sort((a, b) => positionPenalty(a, slot) - positionPenalty(b, slot) || liveOVR(b) - liveOVR(a))[0];
    if (player) {
      assignments[slot] = player.id;
      used.add(player.id);
    }
  }
  return assignments;
}

export function buildSchedule(teamIds) {
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
  return [...firstLeg, ...firstLeg.map((fixture) => ({ ...fixture, round: fixture.round + offset, home: fixture.away, away: fixture.home }))];
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
