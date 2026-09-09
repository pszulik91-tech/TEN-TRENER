import { buildSchedule, clamp, rngNext, seasonRoundDates, simulateMatchPlan, sortedTable, teamLiveStrength, updateTeamResult } from "./game-rules.mjs";

function initialTeam(pack, name, index, seed, tierBaselines) {
  const roll = rngNext(seed);
  const variation = Math.floor(roll.value * 9) - 4;
  return {
    team: {
      id: `world-${pack.id}-${index}`,
      name,
      ovr: (tierBaselines[pack.tier] ?? 42) + variation,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      points: 0,
      form: 50,
      morale: 55,
      fatigue: 14,
      lastFive: [],
    },
    seed: roll.seed,
  };
}

export function createWorldSnapshot(packs, selectedPackId, seasonYear, initialSeed, tierBaselines) {
  let seed = initialSeed;
  const competitions = [];
  for (const pack of packs.filter((item) => item.id !== selectedPackId)) {
    const teams = [];
    for (const [index, name] of pack.teams.entries()) {
      const generated = initialTeam(pack, name, index, seed, tierBaselines);
      seed = generated.seed;
      teams.push(generated.team);
    }
    const totalRounds = buildSchedule(teams.map((team) => team.id), seasonYear, pack.tier).reduce((maximum, fixture) => Math.max(maximum, fixture.round), 0);
    competitions.push({
      id: pack.id,
      association: pack.association,
      competition: pack.competition,
      group: pack.group,
      tier: pack.tier,
      currentRound: 0,
      totalRounds,
      teams,
      lastResults: [],
      managerChanges: 0,
    });
  }
  return { world: { seasonYear, simulatedTo: `${seasonYear}-07-01`, competitions }, seed };
}

function pairingsForRound(teamIds, round) {
  const teams = [...teamIds];
  if (teams.length % 2) teams.push("bye");
  const legRounds = teams.length - 1;
  const normalized = ((round - 1) % legRounds) + 1;
  const rotation = [...teams];
  for (let value = 1; value < normalized; value += 1) rotation.splice(1, 0, rotation.pop());
  const reverse = round > legRounds;
  const pairings = [];
  for (let index = 0; index < rotation.length / 2; index += 1) {
    let home = rotation[index]; let away = rotation[rotation.length - 1 - index];
    if (normalized % 2 === 0) [home, away] = [away, home];
    if (reverse) [home, away] = [away, home];
    if (home !== "bye" && away !== "bye") pairings.push({ home, away });
  }
  return pairings;
}

function simulateCompetitionRound(competition, initialSeed) {
  const round = competition.currentRound + 1;
  if (round > competition.totalRounds) return { competition, seed: initialSeed };
  let seed = initialSeed;
  let teams = competition.teams.map((team) => ({ ...team, fatigue: clamp((team.fatigue ?? 18) - 1, 0, 75) }));
  const results = [];
  for (const fixture of pairingsForRound(teams.map((team) => team.id), round)) {
    const home = teams.find((team) => team.id === fixture.home);
    const away = teams.find((team) => team.id === fixture.away);
    const match = simulateMatchPlan(seed, teamLiveStrength(home), teamLiveStrength(away), home.name, away.name);
    seed = match.seed;
    teams = updateTeamResult(teams, fixture.home, fixture.away, match.homeGoals, match.awayGoals);
    results.push({ round, home: home.name, away: away.name, homeGoals: match.homeGoals, awayGoals: match.awayGoals });
  }
  let managerChanges = competition.managerChanges;
  if (round % 4 === 0) {
    const bottom = sortedTable(teams).at(-1);
    const roll = rngNext(seed); seed = roll.seed;
    const crisis = bottom && bottom.played >= 4 && bottom.points / bottom.played < 0.75;
    if (crisis && roll.value < 0.24) {
      managerChanges += 1;
      teams = teams.map((team) => team.id === bottom.id ? { ...team, morale: clamp((team.morale ?? 45) + 8, 20, 85), form: 50 } : team);
    }
  }
  return {
    seed,
    competition: { ...competition, currentRound: round, teams, lastResults: [...results, ...competition.lastResults].slice(0, 4), managerChanges },
  };
}

export function simulateWorldToDate(world, targetDate, initialSeed) {
  let seed = initialSeed;
  const competitions = world.competitions.map((competition) => {
    let current = competition;
    const dates = seasonRoundDates(competition.totalRounds, world.seasonYear, competition.tier);
    while (current.currentRound < current.totalRounds && dates[current.currentRound] <= targetDate) {
      const simulated = simulateCompetitionRound(current, seed);
      current = simulated.competition;
      seed = simulated.seed;
    }
    return current;
  });
  return { world: { ...world, simulatedTo: targetDate, competitions }, seed };
}

export function evolveWorldSnapshot(previousWorld, packs, selectedPackId, nextSeasonYear, initialSeed, tierBaselines) {
  let seed = initialSeed;
  const previousById = new Map(previousWorld?.competitions?.map((competition) => [competition.id, competition]) ?? []);
  const competitions = [];
  for (const pack of packs.filter((item) => item.id !== selectedPackId)) {
    const previous = previousById.get(pack.id);
    const position = new Map((previous ? sortedTable(previous.teams) : []).map((team, index) => [team.name, index]));
    const teams = [];
    for (const [index, name] of pack.teams.entries()) {
      const old = previous?.teams.find((team) => team.name === name);
      if (!old) {
        const generated = initialTeam(pack, name, index, seed, tierBaselines); seed = generated.seed; teams.push(generated.team); continue;
      }
      const roll = rngNext(seed); seed = roll.seed;
      const place = position.get(name) ?? Math.floor(previous.teams.length / 2);
      const performanceChange = place <= 2 ? 1 : place >= previous.teams.length - 3 ? -1 : roll.value < 0.2 ? 1 : roll.value > 0.8 ? -1 : 0;
      teams.push({ ...old, ovr: clamp(old.ovr + performanceChange, 18, 90), played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0, form: 50, morale: 55, fatigue: 14, lastFive: [] });
    }
    const totalRounds = buildSchedule(teams.map((team) => team.id), nextSeasonYear, pack.tier).reduce((maximum, fixture) => Math.max(maximum, fixture.round), 0);
    competitions.push({ id: pack.id, association: pack.association, competition: pack.competition, group: pack.group, tier: pack.tier, currentRound: 0, totalRounds, teams, lastResults: [], managerChanges: previous?.managerChanges ?? 0 });
  }
  return { world: { seasonYear: nextSeasonYear, simulatedTo: `${nextSeasonYear}-07-01`, competitions }, seed };
}
