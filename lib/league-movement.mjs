// Career-world rules. Explicit simulation rules, not a claim of official WZPN regulations.
const CENTRAL = "PZPN — rozgrywki centralne";
const THIRD = {
  "grupa I": ["Mazowiecki ZPN", "Łódzki ZPN", "Podlaski ZPN", "Warmińsko-Mazurski ZPN"],
  "grupa II": ["Pomorski ZPN", "Zachodniopomorski ZPN", "Wielkopolski ZPN", "Kujawsko-Pomorski ZPN"],
  "grupa III": ["Śląski ZPN", "Dolnośląski ZPN", "Lubuski ZPN", "Opolski ZPN"],
  "grupa IV": ["Małopolski ZPN", "Podkarpacki ZPN", "Lubelski ZPN", "Świętokrzyski ZPN"],
};
export function parentCompetition(pack, packs) {
  if (pack.tier === 1) return undefined;
  let candidates = packs.filter(p => p.tier < pack.tier && (p.association === pack.association || p.association === CENTRAL));
  if (pack.tier === 5) candidates = candidates.filter(p => p.tier === 4 && THIRD[p.group]?.includes(pack.association));
  if (!candidates.length) return undefined;
  const nearest = Math.max(...candidates.map(p => p.tier));
  candidates = candidates.filter(p => p.tier === nearest);
  return candidates.find(p => p.district === pack.district) ?? candidates[0];
}
// Conservative career rule: a reserve cannot reach the top two divisions or
// catch its known parent team. Full regional reserve regulations remain separate.
export function reservePromotionAllowed(team, target, competitions) {
  if (!/(?:^|\s)(II|III|IV)(?:\s|$)/u.test(team.name)) return true;
  if (target.tier <= 2) return false;
  const parentName = team.name.replace(/(?:^|\s)(II|III|IV)(?=\s|$)/u, ' ').replace(/\s+/g,' ').trim();
  const parent = competitions.find(c => c.teams.some(t => t.name === parentName));
  return !parent || target.tier > parent.tier;
}
export function moveWorldTeams(competitions, packs, sortedTable) {
  const byId = new Map(competitions.map(c => [c.id, c]));
  const destinations = new Map();
  for (const child of packs) {
    const parent = parentCompetition(child, packs);
    if (!parent || !byId.has(parent.id) || !byId.has(child.id)) continue;
    const table = sortedTable(byId.get(child.id).teams);
    const winner = table[0];
    if (!winner || !winner.played) continue;
    const list = destinations.get(parent.id) ?? [];
    list.push({ childId: child.id, team: winner }); destinations.set(parent.id, list);
  }
  const moved = new Set();
  const next = new Map(competitions.map(c => [c.id, { ...c, teams: [...c.teams] }]));
  const movements = [];
  // One move per team. Bottom-up processing would demote a promoted club immediately.
  const parents = [...destinations.keys()].sort((a,b) => byId.get(a).tier - byId.get(b).tier);
  for (const parentId of parents) {
    const parent = byId.get(parentId);
    const candidates = destinations.get(parentId).sort((a,b) => b.team.points / b.team.played - a.team.points / a.team.played || (b.team.gf-b.team.ga)/b.team.played - (a.team.gf-a.team.ga)/a.team.played || a.team.id.localeCompare(b.team.id));
    const seats = Math.min(3, Math.max(1, Math.floor(parent.teams.length / 6)));
    const losers = sortedTable(parent.teams).reverse().filter(t => !moved.has(t.id));
    for (const candidate of candidates.filter(c => reservePromotionAllowed(c.team, parent, [...next.values()])).slice(0, seats)) {
      const loser = losers.shift(); if (!loser || moved.has(candidate.team.id)) continue;
      const child = next.get(candidate.childId); const target = next.get(parentId);
      child.teams = child.teams.map(t => t.id === candidate.team.id ? loser : t);
      target.teams = target.teams.map(t => t.id === loser.id ? candidate.team : t);
      moved.add(loser.id); moved.add(candidate.team.id);
      movements.push({ teamId: candidate.team.id, from: candidate.childId, to: parentId }, { teamId: loser.id, from: parentId, to: candidate.childId });
    }
  }
  return { competitions: [...next.values()], movements };
}
