import type { LeagueTeam } from "./game-rules.mjs";
import type { WorldState, WorldLeaguePack } from "./world-engine.mjs";
export type JobSportingContext = { teamCount: number; place?: number; played: number; points: number; gf: number; ga: number; ovr: number; ovrRank: number; seasonYear: number; asOf: string };
export type MarketOffer = { id: string; packId: string; clubName: string; tier: number; competition: string; expectation: string; stage?: "obserwacja" | "oferta"; fit?: number; clubId?: string; reason?: string; situation?: string; coachReason?: string; sporting?: JobSportingContext };
export function assessClubProject(teams: LeagueTeam[], clubId: string): { need: number; reason: string; expectation: string; situation: string; sporting: Omit<JobSportingContext, "seasonYear" | "asOf"> } | undefined;
export function generateWorldJobOffers(game: { world?: WorldState; nextWorld?: WorldState; teams: LeagueTeam[]; season: string; date: string; club: { id: string; name: string; association: string; competition: string; group: string }; coach: { license: string; reputation: number } }, packs: WorldLeaguePack[], initialSeed: number): { seed: number; offers: MarketOffer[] };
