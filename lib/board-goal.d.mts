import type { LeagueTeam } from "./game-rules.mjs";
export type BoardGoal = { clubId: string; season: string; maxPlace: number; label: string };
type GoalGame = { teams: LeagueTeam[]; club: { id: string }; season: string; president?: Record<string, number>; boardGoal?: BoardGoal; newSeasonPending?: boolean; pendingSeason?: unknown };
export function createBoardGoal(teams: LeagueTeam[], clubId: string, season: string, ambition?: number): BoardGoal;
export function boardGoalFor(game: GoalGame): BoardGoal;
export function boardGoalProgress(game: GoalGame): { goal: BoardGoal; place: number; fulfilled: boolean; status: string };
export function boardGoalDismissalProbability(input: { place: number; teamCount: number; boardPressure: number; patience: number; unpredictability: number }, fulfilled: boolean): number;
export function boardGoalResultText(place: number, maxPlace: number, fulfilled: boolean): string;
