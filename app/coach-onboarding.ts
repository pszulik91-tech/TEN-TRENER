import { coachingExperienceEligibility, highestEligibleCoachingExperience, highestEligibleStartingLicense, LICENSE_CHALLENGES, licenseCoversCompetition, PSYCH_QUESTIONS, startingLicenseEligibility } from "./game-data";
import type { CoachProfile, GameState, License } from "./game-data";

export type CoachDraft = { name: string; age: number; region: string; playingExperience: string; coachingExperience: string; profile: CoachProfile; license: License; psychAnswers: Record<string, number> };
export const COACH_REGIONS = ["Dolnośląskie", "Kujawsko-pomorskie", "Lubelskie", "Lubuskie", "Łódzkie", "Małopolskie", "Mazowieckie", "Opolskie", "Podkarpackie", "Podlaskie", "Pomorskie", "Śląskie", "Świętokrzyskie", "Warmińsko-mazurskie", "Wielkopolskie", "Zachodniopomorskie"];
export const INTERVIEW_STEPS = ["Przedstaw się", "Twoja droga", "Twoja szatnia", "Wizytówka"];
export const initialCoachDraft = (): CoachDraft => ({ name: "", age: 35, region: "Śląskie", playingExperience: "Amator", coachingExperience: "Debiutant", profile: "Mentor", license: "Grassroots C", psychAnswers: {} });

export function updateCoachDraft(current: CoachDraft, key: keyof CoachDraft, value: CoachDraft[keyof CoachDraft]): CoachDraft {
  const next = { ...current, [key]: value } as CoachDraft;
  if (["age", "playingExperience"].includes(key) && !coachingExperienceEligibility(next.age, next.playingExperience, next.coachingExperience).eligible) next.coachingExperience = highestEligibleCoachingExperience(next.age, next.playingExperience);
  if (["age", "playingExperience", "coachingExperience"].includes(key) && !startingLicenseEligibility(next.license, next.playingExperience, next.coachingExperience, next.age).eligible) next.license = highestEligibleStartingLicense(next.playingExperience, next.coachingExperience, next.age) as License;
  return next;
}

export function interviewProgress(draft: CoachDraft) {
  const answers = PSYCH_QUESTIONS.filter(q => Number.isInteger(draft.psychAnswers[q.id]) && Boolean(q.choices[draft.psychAnswers[q.id]])).length;
  const identity = draft.name.trim().length >= 3 && draft.name.trim().length <= 60 && Number.isInteger(draft.age) && draft.age >= 30 && draft.age <= 45 && COACH_REGIONS.includes(draft.region);
  const biography = startingLicenseEligibility(draft.license, draft.playingExperience, draft.coachingExperience, draft.age).eligible;
  return { answers, identity, biography, complete: identity && biography && answers === PSYCH_QUESTIONS.length };
}

export function entrySummary(draft: CoachDraft) {
  const competitions = ["Ekstraklasa", "I liga", "II liga", "III liga", "IV liga", "V liga", "Klasa okręgowa", "Klasa A", "Klasa B", "Klasa C"].filter(c => licenseCoversCompetition(draft.license, c));
  return { competitions, challenge: LICENSE_CHALLENGES[draft.license], highest: competitions[0], pressure: ({ "Grassroots C": "Spokojniejsze wejście", "UEFA B": "Większe oczekiwania", "UEFA A": "Krótki kredyt zaufania", "UEFA PRO": "Wynik od pierwszego dnia" })[draft.license] };
}

export function arrivalBriefing(game: GameState) {
  const local = game.club.tier >= 7;
  const professional = game.club.tier <= 3;
  return {
    scene: local ? "Świetlica klubowa · rozmowa z prezesem" : professional ? "Sala prasowa · przedstawienie trenera" : "Gabinet prezesa · pierwsza odprawa",
    speaker: local ? game.presidentName : professional ? "Rzecznik klubu" : game.presidentName,
    line: local ? "Klucze do szatni są. Piłki też. Teraz trzeba jeszcze sprawić, żeby wszyscy dotarli na tę samą godzinę." : professional ? "Zdjęcia już zrobione. Teraz dziennikarze chcą wiedzieć, jak będzie grał zespół. W poniedziałek zapytają ponownie." : "Część zespołu wraca z pracy, część myśli już o zawodowym kontrakcie. Trzeba z tego zbudować jeden plan.",
    task: local ? "Masz ograniczony czas na boisku. Wybierz priorytet mikrocyklu i sprawdź obciążenie przed debiutem." : professional ? "Uzgodnij pomysł na grę z pracą sztabu. Intensywność bez regeneracji szybko wróci w postaci zmęczenia." : "Dopasuj obciążenie i taktykę do realnych możliwości zespołu. Ambicje nie zastąpią przygotowania.",
  };
}

export function needsClubArrival(game: GameState) {
  return game.employmentStatus === "employed" && game.round === 1 && game.careerStats.matches === 0 && game.inbox.some(issue => issue.id === "welcome" && !issue.resolved);
}
