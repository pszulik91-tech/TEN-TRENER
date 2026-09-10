export type MatchMomentChoice = { id: string; label: string; preview: string; strength: number; fatigue: number; morale: number; pressure: number };
export type MatchMoment = { id: string; minute: number; title: string; body: string; choices: MatchMomentChoice[]; resolvedChoiceId?: string; outcome?: string };
export function matchMomentCount(context: { tier?: number; round?: number; totalRounds?: number; pressure?: number; strengthGap?: number }): number;
export function generateMatchMoments(seed: number, context?: { tier?: number; round?: number; totalRounds?: number; pressure?: number; strengthGap?: number }): { seed: number; moments: MatchMoment[] };
export function resolveMatchMoment(seed: number, moment: MatchMoment, choiceId: string): { seed: number; choice: MatchMomentChoice; strength: number; verdict: string };
export function matchMomentStats(): { scenarios: number; choices: number };
