export function phrase(key: string | number, bank: string, values?: Record<string, string | number>): string;
export function matchPhrase(kind: string, side: string, key: string | number, team?: string): string;
export function languageBankStats(): { match: number; report: number };
