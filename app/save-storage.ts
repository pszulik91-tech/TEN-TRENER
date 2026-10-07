import type { GameState } from './game-data';
import { SAVE_KEY } from './game-data';
import { encodeSave, decodeSave } from '../lib/save-codec.mjs';
import { migrateGame } from './game-actions';
let latest: GameState | null = null;
let writeSequence = 0;
export function activeCareer() { return latest; }
export async function storeCareer(game: GameState) {
  latest = game;
  const sequence = ++writeSequence;
  const raw = await encodeSave(game);
  if (sequence === writeSequence) localStorage.setItem(SAVE_KEY, raw);
}
export async function readCareer(raw: string) {
  const parsed = await decodeSave(raw) as GameState;
  if (!parsed?.coach?.name || !parsed.club?.id || !Array.isArray(parsed.fixtures) || !Array.isArray(parsed.players) || !Number.isFinite(parsed.seed)) throw new Error('Niepoprawny zapis');
  return migrateGame(parsed);
}
export function resumeScreen(game: GameState) {
  return game.pendingSeason ? 'jobs' : game.developmentGoals.length !== 2 ? 'goals' : game.matchState && !game.matchState.completed ? 'match' : 'dashboard';
}
