type MatchContext = { fixture: { home: string; away: string }; minute: number; plannedEvents: Array<{ minute: number; kind: string; side: string }> };
export function mentalityScore(match: MatchContext, clubId: string): { userHome: boolean; own: number; opponent: number; balance: number };
export function mentalityProfile(mentality: string, minute?: number, balance?: number, userHome?: boolean): { homeAttack: number; awayAttack: number; afterMinute: number };
export function mentalityForMatch(match: MatchContext, clubId: string, mentality: string): ReturnType<typeof mentalityProfile>;
export function mentalityAdvice(match: MatchContext, clubId: string, mentality: string): string;
