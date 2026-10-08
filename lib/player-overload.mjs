import { playerAvailable, conditionFromFatigue, conditionStatus } from './game-rules.mjs';

export const OVERLOAD_CONDITION = 59;
export const OVERLOAD_REASON = 'Regeneracja po przeciążeniu';

export function overloadIssue({ players = [], assignments = {}, clubId, match, blocked = false }) {
  if (blocked) return undefined;
  const starters = new Set(Object.values(assignments));
  const candidate = players.filter(p => playerAvailable(p) && conditionFromFatigue(p.fatigue) <= OVERLOAD_CONDITION)
    .sort((a, b) => Number(starters.has(b.id)) - Number(starters.has(a.id)) || b.fatigue - a.fatigue || b.baseOVR - a.baseOVR || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0];
  if (!candidate) return undefined;
  return {
    id: `overload-${clubId}-${match}-${candidate.id}`, templateId: 'player-overload',
    targetPlayerId: candidate.id, playerCase: { clubId, kind: 'overload' },
    category: 'Sprawa zawodnika', title: `${candidate.name}: ryzyko przeciążenia`,
    body: `${candidate.name} (${candidate.primary}): Kondycja ${conditionFromFatigue(candidate.fatigue)}% • ${conditionStatus(conditionFromFatigue(candidate.fatigue)).toLowerCase()}. Sztab widzi ryzyko przeciążenia. To ocena obciążeń, nie diagnoza medyczna. Odciążenie oznacza opuszczenie najbliższego meczu, kondycja +8 p.p. i relację +2; utrzymanie do dyspozycji oznacza relację −2, bez gwarancji występu.`, resolved: false,
    choices: [
      { id: 'rest', label: 'Odciążam zawodnika', feedback: `${candidate.name}: odpoczynek w najbliższym meczu, kondycja +8 p.p., relacja +2. Sztab dobierze zastępstwo.`, effects: {} },
      { id: 'available', label: 'Utrzymuję go do dyspozycji', feedback: `${candidate.name} pozostaje dostępny; relacja −2. Sztab nadal wybiera XI. Jeśli zagra, obowiązuje zwykłe ryzyko przeciążenia.`, effects: {} },
    ],
  };
}

export function resolveOverload(game, event, choiceId) {
  const player = game.players.find(p => p.id === event.targetPlayerId);
  if (event.playerCase?.kind !== 'overload' || event.playerCase.clubId !== game.club.id || !player || !playerAvailable(player) || game.playerOverload || !['rest', 'available'].includes(choiceId)) return undefined;
  const rest = choiceId === 'rest';
  return {
    players: game.players.map(p => p.id !== player.id ? p : rest
      ? { ...p, fatigue: Math.max(0, p.fatigue - 8), relation: Math.min(100, p.relation + 2), absenceRounds: 1, absenceReason: OVERLOAD_REASON }
      : { ...p, relation: Math.max(0, p.relation - 2) }),
    pending: { clubId: game.club.id, playerId: player.id, eventId: event.id, choice: choiceId, due: game.careerStats.matches + 1 },
  };
}

// Capture the actual next-match outcome once, even if a full inbox delays delivery.
export function overloadFollowup(pending, { clubId, players, starters, match, capacity }) {
  if (!pending || pending.clubId !== clubId) return { pending: undefined };
  const player = players.find(p => p.id === pending.playerId);
  if (!player) return { pending: undefined };
  if (match < pending.due) return { pending };
  const played = starters.has(player.id);
  const participation = pending.choice === 'rest'
    ? played ? 'Znalazł się w XI mimo decyzji o odpoczynku.' : 'Opuścił spotkanie zgodnie z decyzją o odpoczynku.'
    : played ? 'Pozostał do dyspozycji i znalazł się w XI.' : 'Pozostał do dyspozycji, ale automatyczna XI go nie wybrała.';
  const availability = player.injuryWeeks > 0 ? `Uraz: ${player.injuryWeeks} tyg.` : playerAvailable(player) ? 'Jest ponownie dostępny.' : `Niedostępny: ${player.absenceReason ?? 'inna absencja'}.`;
  const outcome = pending.outcome ?? `${player.name} (${player.primary}): ${participation} Po tym meczu kondycja ${conditionFromFatigue(player.fatigue)}% • ${conditionStatus(conditionFromFatigue(player.fatigue)).toLowerCase()}. ${availability}`;
  if (capacity < 1) return { pending: { ...pending, outcome } };
  return { pending: undefined, event: {
    id: `${pending.eventId}-followup`, targetPlayerId: player.id, playerCase: { clubId, kind: 'overload-followup' },
    category: 'Sprawa zawodnika', title: `${player.name}: po meczu`, body: outcome, resolved: false,
    choices: [{ id: 'ack', label: 'Zamykam sprawę', feedback: 'Sportowa konsekwencja decyzji została zapisana. Sprawa zamknięta.', effects: {} }],
  } };
}
