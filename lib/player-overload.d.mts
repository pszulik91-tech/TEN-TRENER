import type { Player, GameState } from '../app/game-data';
import type { CareerIssue } from './career-events.mjs';
export type PlayerOverload = { clubId: string; playerId: string; eventId: string; choice: 'rest' | 'available'; due: number; outcome?: string };
export const OVERLOAD_THRESHOLD: number;
export const OVERLOAD_REASON: string;
export function overloadIssue(input: { players?: Player[]; assignments?: Record<string,string>; clubId: string; match: number; blocked?: boolean }): CareerIssue | undefined;
export function resolveOverload(game: GameState, event: CareerIssue, choiceId: string): { players: Player[]; pending: PlayerOverload } | undefined;
export function overloadFollowup(pending: PlayerOverload | undefined, input: { clubId: string; players: Player[]; starters: Set<string>; match: number; capacity: number }): { pending: PlayerOverload | undefined; event?: CareerIssue };
