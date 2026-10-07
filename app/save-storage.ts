import type { GameState } from './game-data';
import { SAVE_KEY, LICENSES, PROFILE_NOTE, PSYCH_QUESTIONS, DEVELOPMENT_GOALS, LEAGUE_PACKS, licenseCoversCompetition } from './game-data';
import { encodeSave, decodeSave } from '../lib/save-codec.mjs';
import { COACH_REGIONS, interviewProgress } from './coach-onboarding';
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


// A small setup snapshot shares the existing local storage boundary, never SAVE_KEY.
export const CREATOR_DRAFT_KEY = SAVE_KEY + ':creator';
export type CreatorDraftSave = {
  version: 1; draft: import('./coach-onboarding').CoachDraft;
  screen: 'creator' | 'club' | 'goals'; stage: number; questionIndex: number;
  selectedCompetition: string; selectedAssociation: string; selectedDistrict: string;
  selectedPackId: string; selectedClub: string; selectedGoals: string[]; clubStepVisited: boolean;
};
export function storeCreatorDraft(snapshot: CreatorDraftSave) {
  localStorage.setItem(CREATOR_DRAFT_KEY, JSON.stringify(snapshot));
}
export function clearCreatorDraft() { localStorage.removeItem(CREATOR_DRAFT_KEY); }
export function readCreatorDraft(): CreatorDraftSave | null {
  try {
    const raw = localStorage.getItem(CREATOR_DRAFT_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as CreatorDraftSave;
    const d = s?.draft;
    if (s.version !== 1 || !['creator', 'club', 'goals'].includes(s.screen) ||
      !Number.isInteger(s.stage) || s.stage < 0 || s.stage > 3 ||
      !Number.isInteger(s.questionIndex) || s.questionIndex < 0 || s.questionIndex >= PSYCH_QUESTIONS.length ||
      !d || typeof d.name !== 'string' || d.name.length > 60 || !Number.isInteger(d.age) || d.age < 30 || d.age > 45 ||
      !COACH_REGIONS.includes(d.region) || !LICENSES.includes(d.license) || !Object.hasOwn(PROFILE_NOTE, d.profile) ||
      !['Brak', 'Amator', 'Niższe ligi', 'Zawodowiec', 'Reprezentant'].includes(d.playingExperience) ||
      !['Debiutant', '1–3 lata', '4–10 lat', 'Ponad 10 lat'].includes(d.coachingExperience) ||
      !d.psychAnswers || typeof d.psychAnswers !== 'object' || Array.isArray(d.psychAnswers) ||
      Object.entries(d.psychAnswers).some(([id, answer]) => !PSYCH_QUESTIONS.some(q => q.id === id && Number.isInteger(answer) && q.choices[answer])) ||
      !Array.isArray(s.selectedGoals) || s.selectedGoals.length > 2 || new Set(s.selectedGoals).size !== s.selectedGoals.length || s.selectedGoals.some(id => !DEVELOPMENT_GOALS.some(g => g.id === id)) ||
      typeof s.clubStepVisited !== 'boolean' || ![s.selectedCompetition, s.selectedAssociation, s.selectedDistrict, s.selectedPackId, s.selectedClub].every(v => typeof v === 'string')) return null;
    const progress = interviewProgress(d);
    if ((s.stage > 0 && !progress.identity) || (s.stage > 1 && !progress.biography) || (s.stage === 3 && !progress.complete)) return null;
    if (s.screen !== 'creator' && (!progress.complete || !LEAGUE_PACKS.some(p => p.id === s.selectedPackId && p.competition === s.selectedCompetition && p.association === s.selectedAssociation && p.district === s.selectedDistrict && p.teams.includes(s.selectedClub) && licenseCoversCompetition(d.license, p.competition)))) return null;
    return s;
  } catch { return null; }
}
