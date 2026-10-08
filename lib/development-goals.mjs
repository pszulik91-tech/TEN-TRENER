import { goalSatisfied } from './game-rules.mjs';

export const DEVELOPMENT_GOALS = [
  { id: 'tactics', label: 'Taktyka', description: 'Regularne przygotowanie taktyczne.' },
  { id: 'motivation', label: 'Motywacja', description: 'Regularna gotowość mentalna XI.' },
  { id: 'people', label: 'Zarządzanie ludźmi', description: 'Dobre decyzje dotyczące ludzi przez sezon.' },
  { id: 'analysis', label: 'Analiza', description: 'Powtarzalna analiza i reakcja przy ławce.' },
  { id: 'pressure', label: 'Odporność na presję', description: 'Wyniki mimo presji.' },
  { id: 'adaptability', label: 'Adaptacyjność', description: 'Powtarzalne punktowanie różnymi formacjami.' },
  { id: 'youth', label: 'Rozwój młodych', description: 'Regularne szanse dla różnych U21.' },
  { id: 'reputation', label: 'Reputacja / networking', description: 'Zwycięstwa budujące widoczność trenera.' },
];
const scaled = (matches, share, minimum, maximum) => Math.min(maximum, Math.max(minimum, Math.ceil(matches * share)));
const unique = values => [...new Set(values ?? [])];
const rounds = values => unique(values).filter(n => Number.isInteger(n) && n > 0);
const count = n => Math.max(0, Math.floor(Number(n) || 0));

export function seasonMatchCount(fixtures, clubId) {
  return fixtures.filter(f => f.home === clubId || f.away === clubId).length;
}

export function goalsForSeason(matches, selected) {
  const targets = {
    tactics: scaled(matches, .45, 5, 16), motivation: scaled(matches, .5, 5, 18),
    people: scaled(matches, .3, 6, 10), analysis: scaled(matches, .35, 5, 12),
    pressure: scaled(matches, .25, 5, 9), youth: scaled(matches, .4, 5, 14),
    reputation: scaled(matches, .3, 5, 11),
  };
  const repeats = scaled(matches, .09, 2, 4);
  targets.adaptability = 3 * repeats;
  return DEVELOPMENT_GOALS.filter(g => !selected || selected.includes(g.id)).map(g => {
    const target = targets[g.id];
    const descriptions = {
      tactics: `Rozpocznij ${target} meczów z gotowością taktyczną minimum 72%.`,
      motivation: `Rozpocznij ${target} meczów ze średnim morale wyjściowej XI minimum 68.`,
      people: `Podejmij pozytywną decyzję dotyczącą ludzi w ${target} różnych kolejkach, bez wzrostu presji w szatni. Kilka spraw w jednej kolejce daje jeden krok; odciążenie przeciążonego zawodnika także się liczy.`,
      analysis: `W ${target} meczach wykonaj trening „Analiza rywala” i podejmij decyzję przy ławce po 30. minucie. Wynik nie warunkuje zaliczenia.`,
      pressure: `Nie przegraj ${target} meczów rozpoczynanych przy presji minimum 45%.`,
      adaptability: `Zdobądź punkty co najmniej ${repeats} razy każdą z 3 różnych formacji (${target} punktowanych meczów łącznie).`,
      youth: `Wystaw U21 w wyjściowej XI w ${target} różnych kolejkach i wykorzystaj co najmniej 3 różnych zawodników U21.`,
      reputation: `Wygraj ${target} meczów ligowych — każdy wynik buduje widoczność trenera.`,
    };
    return { ...g, description: descriptions[g.id], target, progress: 0, rulesVersion: 2, seasonMatches: matches,
      ...(g.id === 'youth' ? { distinctPlayers: 3 } : {}),
      ...(g.id === 'adaptability' ? { formationsRequired: 3, repeatsPerFormation: repeats } : {}) };
  });
}

export function emptySeasonEvidence() {
  return { version: 2, formationsWithPoints: [], youthStarters: [], analysisRounds: [], tacticalRounds: [],
    pressureRounds: [], positiveDecisions: [], peopleRounds: [], youthRounds: [],
    motivationRounds: [], reputationRounds: [], formationPointRounds: {} };
}

function formationCounts(evidence) {
  const names = unique([...Object.keys(evidence.formationPointRounds ?? {}), ...Object.keys(evidence.legacyFormationCounts ?? {})]);
  return names.map(name => ({ name, count: rounds(evidence.formationPointRounds?.[name]).length + count(evidence.legacyFormationCounts?.[name]) }))
    .sort((a, b) => b.count - a.count || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

export function developmentProgress(goal, evidence) {
  const field = { tactics: 'tacticalRounds', motivation: 'motivationRounds', people: 'peopleRounds', analysis: 'analysisRounds', pressure: 'pressureRounds', youth: 'youthRounds', reputation: 'reputationRounds' }[goal.id];
  const value = goal.id === 'adaptability'
    ? formationCounts(evidence).slice(0, goal.formationsRequired ?? 3).reduce((sum, f) => sum + Math.min(goal.repeatsPerFormation ?? 2, f.count), 0)
    : rounds(evidence[field]).length + count(evidence.legacyCounts?.[goal.id]);
  return Math.min(goal.target, value);
}

export function developmentGoalComplete(goal, evidence) {
  return developmentProgress(goal, evidence) >= goal.target &&
    (goal.id !== 'youth' || unique(evidence.youthStarters).length >= (goal.distinctPlayers ?? 3));
}

export function refreshDevelopmentGoals(goals, evidence) {
  return goals.map(goal => ({ ...goal, progress: developmentProgress(goal, evidence) }));
}

export function goalProgressText(goal, evidence) {
  const progress = developmentProgress(goal, evidence);
  if (goal.id === 'youth') return `${progress}/${goal.target} kolejek z U21 • ${Math.min(goal.distinctPlayers ?? 3, unique(evidence.youthStarters).length)}/${goal.distinctPlayers ?? 3} różnych zawodników`;
  if (goal.id === 'adaptability') {
    const required = goal.formationsRequired ?? 3, repeats = goal.repeatsPerFormation ?? 2;
    const counts = formationCounts(evidence);
    const done = Math.min(required, counts.filter(f => f.count >= repeats).length);
    return `${done}/${required} formacje z ${repeats} punktowanymi meczami • ${progress}/${goal.target} powtórzeń${counts.length ? ` • ${counts.slice(0, required).map(f => `${f.name}: ${Math.min(repeats, f.count)}/${repeats}`).join(', ')}` : ''}`;
  }
  return `${progress}/${goal.target}${goal.id === 'people' ? ' różnych kolejek' : ' meczów'}`;
}

export function goalProgressPercent(goal, evidence) {
  const main = developmentProgress(goal, evidence) / goal.target;
  return 100 * (goal.id === 'youth' ? Math.min(main, unique(evidence.youthStarters).length / (goal.distinctPlayers ?? 3)) : main);
}

export function recordMatchEvidence(previous, round, context, formation, youthIds) {
  const e = structuredClone(previous);
  const add = field => { e[field] = rounds([...(e[field] ?? []), round]); };
  for (const [id, field] of [['tactics', 'tacticalRounds'], ['motivation', 'motivationRounds'], ['analysis', 'analysisRounds'], ['pressure', 'pressureRounds'], ['reputation', 'reputationRounds']]) {
    if (goalSatisfied(id, context)) add(field);
  }
  if (context.result !== 'loss') {
    e.formationsWithPoints = unique([...e.formationsWithPoints, formation]);
    // One played fixture can provide evidence for only one formation.
    if (!Object.values(e.formationPointRounds ?? {}).some(values => values.includes(round))) {
      e.formationPointRounds = { ...e.formationPointRounds, [formation]: rounds([...(e.formationPointRounds?.[formation] ?? []), round]) };
    }
  }
  if (youthIds.length) { add('youthRounds'); e.youthStarters = unique([...e.youthStarters, ...youthIds]); }
  return e;
}

export function recordPeopleEvidence(previous, round, eventId, positive) {
  if (!positive || previous.positiveDecisions.includes(eventId)) return previous;
  return { ...previous, positiveDecisions: [...previous.positiveDecisions, eventId], peopleRounds: rounds([...(previous.peopleRounds ?? []), round]) };
}

// Old counters cannot prove WHEN several decisions, young players or formations
// appeared. Keep a labelled aggregate credit, never fabricate historical rounds.
export function migrateDevelopmentState(goals, previous, fixtures, clubId) {
  const e = { ...emptySeasonEvidence(), ...structuredClone(previous ?? {}) };
  for (const field of ['formationsWithPoints', 'youthStarters', 'positiveDecisions']) e[field] = unique(e[field]);
  for (const field of ['analysisRounds', 'tacticalRounds', 'pressureRounds', 'peopleRounds', 'youthRounds', 'motivationRounds', 'reputationRounds']) e[field] = rounds(e[field]);
  if (previous?.version !== 2) {
    const played = fixtures.filter(f => f.played && (f.home === clubId || f.away === clubId));
    const motivation = goals.find(g => g.id === 'motivation');
    e.legacyCounts = {
      people: e.positiveDecisions.length ? 1 : 0,
      youth: e.youthStarters.length ? 1 : 0,
      // The old motivation counter proves an aggregate, but not the round IDs.
      motivation: Math.min(played.length, count(motivation?.progress)),
    };
    e.reputationRounds = played.filter(f => f.home === clubId ? f.homeGoals > f.awayGoals : f.awayGoals > f.homeGoals).map(f => f.round);
    e.legacyFormationCounts = Object.fromEntries(e.formationsWithPoints.map(name => [name, 1]));
    e.version = 2;
  }
  const canonical = goalsForSeason(seasonMatchCount(fixtures, clubId), goals.map(g => g.id)).slice(0, 2);
  const refreshed = refreshDevelopmentGoals(canonical, e).map(goal => {
    const old = goals.find(g => g.id === goal.id);
    return old?.winterProgress === undefined ? goal : { ...goal,
      winterProgress: Math.min(goal.progress, count(old.winterProgress)),
      ...(previous?.version === 2 && old.winterDetail ? { winterDetail: old.winterDetail } : {}) };
  });
  return { developmentGoals: refreshed, seasonEvidence: e };
}
