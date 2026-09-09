import type { LeagueTeam } from "./game-rules.mjs";

export type WorldLeaguePack = { id: string; association: string; competition: string; group: string; tier: number; teams: string[] };
export type WorldResult = { round: number; home: string; away: string; homeGoals: number; awayGoals: number };
export type WorldCompetition = { id: string; association: string; competition: string; group: string; tier: number; currentRound: number; totalRounds: number; teams: LeagueTeam[]; lastResults: WorldResult[]; managerChanges: number };
export type WorldState = { seasonYear: number; simulatedTo: string; competitions: WorldCompetition[] };
export function createWorldSnapshot(packs: WorldLeaguePack[], selectedPackId: string, seasonYear: number, initialSeed: number, tierBaselines: Record<number, number>): { world: WorldState; seed: number };
export function simulateWorldToDate(world: WorldState, targetDate: string, initialSeed: number): { world: WorldState; seed: number };
export function evolveWorldSnapshot(previousWorld: WorldState | undefined, packs: WorldLeaguePack[], selectedPackId: string, nextSeasonYear: number, initialSeed: number, tierBaselines: Record<number, number>): { world: WorldState; seed: number };
