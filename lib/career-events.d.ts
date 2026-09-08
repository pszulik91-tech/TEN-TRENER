export type IssueEffects = { pressures?: Record<string, number>; burnout?: number; teamMorale?: number; teamFatigue?: number; relation?: number; readiness?: number; reputation?: number };
export type IssueChoice = { id: string; label: string; feedback: string; effects: IssueEffects };
export type CareerIssue = { id: string; category: string; title: string; body: string; choices: IssueChoice[]; resolved: boolean };
export const EVENT_POOL: Array<{ id: string; title: string; category: string; from: number; to: number }>;
export function generateRoundIssues(input: { seed: number; round: number; tier: number; result: "win" | "draw" | "loss"; worldHumor: number; recentTitles?: string[] }): { seed: number; events: CareerIssue[] };
export function welcomeIssue(clubName: string, coachFirstName: string, expectation: string, environmentStatus: string, environmentWork: string): CareerIssue;
export function legacyIssue(item: Partial<CareerIssue> & { id: string; title: string; body: string; resolved: boolean }): CareerIssue;
