import { clamp, licenseCoversCompetition, sortedTable } from "./game-rules.mjs";

const stableOrder = (a, b) => a < b ? -1 : a > b ? 1 : 0;

// This describes a sporting project, never a recorded vacancy or dismissal.
export function assessClubProject(teams, clubId) {
  const team = teams.find(item => item.id === clubId);
  if (!team) return undefined;
  const teamCount = teams.length;
  const stronger = teams.filter(item => item.ovr > team.ovr).length;
  const equals = teams.filter(item => item.id !== team.id && item.ovr === team.ovr).length;
  const ovrRank = 1 + stronger + Math.floor(equals / 2);
  const played = team.played;
  const place = played > 0 ? sortedTable(teams).findIndex(item => item.id === team.id) + 1 : undefined;
  const gap = place === undefined ? 0 : place - ovrRank;
  let reason, expectation, need;
  if (played >= 3 && gap >= 2) {
    reason = "Wyniki poniżej potencjału kadry — projekt poprawy rezultatów.";
    expectation = "poprawa wyników względem potencjału kadry";
    need = 80 + Math.min(20, gap * 2);
  } else if (ovrRank > Math.ceil(teamCount * .7)) {
    reason = "Jedna z najsłabszych kadr w lidze — trudny projekt stabilizacji.";
    expectation = "ustabilizowanie zespołu o niskiej relatywnej sile";
    need = 60 + 20 * ovrRank / teamCount;
  } else if (ovrRank <= Math.ceil(teamCount * .4)) {
    reason = "Silna kadra na tle ligi — projekt wykorzystania jej potencjału.";
    expectation = "wykorzystanie potencjału silnej kadry";
    need = 35;
  } else {
    reason = "Kadra ze środka stawki — projekt rozwoju i stabilizacji wyników.";
    expectation = "rozwój zespołu ze środka stawki";
    need = 45;
  }
  const sporting = { teamCount, ...(place === undefined ? {} : { place }), played, points: team.points, gf: team.gf, ga: team.ga, ovr: team.ovr, ovrRank };
  const strength = `OVR ${team.ovr}; ${ovrRank}. orientacyjna pozycja kadry według OVR w lidze ${teamCount} klubów.`;
  const situation = place === undefined
    ? `Klub bez rozegranych meczów; brak wyników do oceny. ${strength}`
    : `${place}. miejsce; ${team.points} pkt w ${played} meczach; bramki ${team.gf}:${team.ga}. ${strength}`;
  return { need, reason, expectation, situation, sporting };
}

export function generateWorldJobOffers(game, packs, initialSeed) {
  const world = game.nextWorld ?? game.world;
  const competitions = [...(world?.competitions ?? [])];
  // The active league is simulated separately and is absent from game.world.
  if (!game.nextWorld) {
    const ownPack = packs.find(pack => pack.association === game.club.association && pack.competition === game.club.competition && pack.group === game.club.group);
    if (ownPack) {
      const index = competitions.findIndex(competition => competition.id === ownPack.id);
      const current = { ...ownPack, teams: game.teams };
      if (index >= 0) competitions[index] = current;
      else competitions.push(current);
    }
  }
  const packsById = new Map(packs.map(pack => [pack.id, pack]));
  const candidates = [];
  for (const competition of competitions) {
    // Offers must lead to a destination supported by the existing season transition.
    const pack = packsById.get(competition.id);
    if (!pack || !licenseCoversCompetition(game.coach.license, pack.competition)) continue;
    const reputationFloor = 5 + (10 - pack.tier) * 5;
    const localBonus = pack.association === game.club.association ? 6 : 0;
    if (game.coach.reputation + localBonus < reputationFloor - 8) continue;
    const fit = clamp(55 + game.coach.reputation + localBonus - reputationFloor, 1, 99);
    const coachReason = `Licencja ${game.coach.license} uprawnia do pracy w tych rozgrywkach. Reputacja ${game.coach.reputation}/100 wystarcza do zainteresowania klubu.${localBonus ? ` Ten sam ZPN (${pack.association}) zwiększa dopasowanie.` : ""}`;
    for (const team of competition.teams) {
      if (team.id === game.club.id || team.name === game.club.name) continue;
      const project = assessClubProject(competition.teams, team.id);
      if (!project) continue;
      candidates.push({ priority: project.need + fit / 2, offer: {
        id: `job-${world?.seasonYear ?? Number(game.season.slice(0, 4))}-${pack.id}-${team.id}`,
        clubId: team.id, packId: pack.id, clubName: team.name, tier: pack.tier,
        competition: `${pack.competition} • ${pack.group}`, expectation: project.expectation, fit,
        reason: project.reason, situation: project.situation, coachReason,
        sporting: { ...project.sporting, seasonYear: world?.seasonYear ?? Number(game.season.slice(0, 4)), asOf: game.nextWorld ? world.simulatedTo : game.date },
      } });
    }
  }
  candidates.sort((a, b) => b.priority - a.priority || stableOrder(a.offer.packId, b.offer.packId) || stableOrder(a.offer.clubId, b.offer.clubId));
  const seen = new Set();
  const offers = [];
  for (const { offer } of candidates) {
    if (seen.has(offer.clubId)) continue;
    seen.add(offer.clubId);
    offers.push(offer);
    if (offers.length === 3) break;
  }
  return { seed: initialSeed, offers };
}
