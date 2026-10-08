import type { MarketOffer } from "../lib/job-market.mjs";
import type { BoardGoal } from "../lib/board-goal.mjs";
import {
  buildMatchStrength, buildSchedule, burnoutMatchPenalty, capReadiness, coachingExperienceEligibility, conditionFromFatigue, defaultMicrocycle, diagnoseMatchOutcome, dismissalProbability, effectiveOVR, environmentIncidentOccurs, evaluateMicrocycle, expectedOutcomeProbabilities, goalSatisfied, injuryRiskFromFatigue, licenseCoversCompetition, licenseCoversTier, liveBreakdown, liveOVR, normalizeSlot, normalizeStartingLicense, offseasonBaseChange, offseasonBurnout, POLICY_EFFECTS,
  highestEligibleCoachingExperience, highestEligibleStartingLicense, naturalRecoveryForGap, playerAvailable, positionPenalty, pressureDeltaForResult, readinessStrengthImpact, requiredLicenseForCompetition, requiredLicenseForTier, resolveProfileScores, rngNext, seasonRoundDates, selectBestLineup, selectLineupForPlan, shouldRetirePlayer, simulateMatchPlan, sortedTable, startingLicenseEligibility, tacticalPlanImpact, trainingTacticSynergy, TEAM_PLANS, teamLiveStrength, TRAINING_PRESETS, trainingPresetSessions, updateTeamResult, weeklyBurnoutDelta, winterBreakDays,
} from "../lib/game-rules.mjs";
import type { CareerIssue } from "../lib/career-events.mjs";
import type { WorldState } from "../lib/world-engine.mjs";
import { LEAGUE_CATALOG_STATS, VERIFIED_LEAGUE_PACKS } from "./league-catalog.mjs";

export type Screen = "start" | "creator" | "club" | "goals" | "dashboard" | "squad" | "tactics" | "training" | "match" | "table" | "jobs" | "career";
export type Position = "BR" | "PO" | "ŚO" | "LO" | "DP" | "ŚP" | "PP" | "ŚPO" | "LP" | "N";
export type License = "Grassroots C" | "UEFA B" | "UEFA A" | "UEFA PRO";
export type CoachProfile = "Mentor" | "Generał" | "Taktyczny obsesyjny" | "Wynikowiec" | "Dyplomata" | "Trener od zapierdolu" | "Hazardzista" | "Spokojny pragmatyk";
export type CareerChallenge = { label: string; description: string; expectation: string; pressureMultiplier: number; pressureBonus: number; reputationBonus: number };
export type LevelEnvironment = {
  tier: number; label: string; status: string; work: string; positives: string[]; risks: string[];
  trainingSessions: number; readinessCap: number; absenceRisk: number; mediaScale: number; humorBase: number;
};
export type PsychChoice = { label: string; scores: Partial<Record<CoachProfile, number>> };
export type PsychQuestion = { id: string; question: string; context: string; choices: PsychChoice[] };
export type TrainingFocus = "Regeneracja" | "Analiza rywala" | "Motoryka" | "Taktyka" | "Finalizacja" | "Pressing" | "Atmosfera" | "Rozwój młodych" | "Stałe fragmenty";
export type TrainingIntensity = "Niska" | "Normalna" | "Wysoka";
export type TrainingSession = { id: string; day: string; focus: string; intensity: string };

export type LeaguePack = { id: string; association: string; district: string; competition: string; group: string; tier: number; teams: string[]; source?: string };
export type Player = { id: string; name: string; age: number; primary: Position; secondary: Position[]; baseOVR: number; form: number; morale: number; fatigue: number; relation: number; potential: number; personality: string; status: string; injuryWeeks?: number; absenceRounds?: number; absenceReason?: string };
export type Team = { id: string; name: string; ovr: number; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; points: number; form?: number; morale?: number; fatigue?: number; lastFive?: string[] };
export type Fixture = { round: number; date: string; home: string; away: string; played: boolean; homeGoals?: number; awayGoals?: number };
export type MatchEvent = { minute: number; text: string; kind: "goal" | "card" | "injury" | "chance" | "info"; side: "home" | "away" | "neutral" };
export type StrengthFactor = { label: string; value: number };
export type PostMatchReport = { verdict: string; summary: string; positives: string[]; warnings: string[]; boardChange: number; burnoutChange: number; averageCondition: number; analysisOutcome: string; decisiveFactor?: string; winChance?: number; drawChance?: number; lossChance?: number; userXg?: number; opponentXg?: number; strengthFactors?: StrengthFactor[] };
export type MatchMomentChoice = { id: string; label: string; preview: string; strength: number; fatigue: number; morale: number; pressure: number };
export type MatchMoment = { id: string; minute: number; title: string; body: string; choices: MatchMomentChoice[]; resolvedChoiceId?: string; outcome?: string };
export type MatchState = { fixture: Fixture; minute: number; homeGoals: number; awayGoals: number; plannedEvents: MatchEvent[]; shotsHome: number; shotsAway: number; possessionHome: number; completed: boolean; homeStrength?: number; awayStrength?: number; homeXg?: number; awayXg?: number; expectedHomeWin?: number; expectedDraw?: number; expectedAwayWin?: number; userStrengthFactors?: StrengthFactor[]; preparationReadiness?: number; preMatchPressure?: number; analysisAttempted?: boolean; analysisStartBalance?: number; lastInstructionMinute?: number; simulationSeed?: number; postMatchReport?: PostMatchReport; reportSeen?: boolean; coachMoments?: MatchMoment[]; activeMomentId?: string; coachImpact?: number; coachFatigue?: number; coachMorale?: number; pressingExposure?: { high: number; veryHigh: number; minute: number } };
export type DevelopmentGoal = { id: string; label: string; description: string; progress: number; target: number; winterProgress?: number };
export type SeasonEvidence = { formationsWithPoints: string[]; youthStarters: string[]; analysisRounds: number[]; tacticalRounds: number[]; pressureRounds: number[]; positiveDecisions: string[] };
export type Coach = { name: string; age: number; region: string; playingExperience: string; coachingExperience: string; profile: CoachProfile; license: License; reputation: number; skills: Record<string, number> };
export type Club = { id: string; name: string; association: string; district: string; competition: string; group: string; tier: number };
export type Tactic = { formation: keyof typeof FORMATIONS; mentality: string; tempo: string; pressing: string; line: string; width: string; buildUp: string; passingRisk: string; assignments: Record<string, string> };
export type SeasonRecord = { season: string; club: string; tier: number; place: number; matches: number; wins: number; draws: number; losses: number; outcome: "awans" | "utrzymanie" | "spadek"; goalsCompleted: number; boardGoal?: { maxPlace: number; fulfilled: boolean } };
export type CareerStats = { seasons: number; matches: number; wins: number; draws: number; losses: number; promotions: number; relegations: number; goalsCompleted: number; highestTier: number; clubs: string[] };
export type JobOffer = MarketOffer;
export type WorldActivity = { date: string; competitionsAdvanced: number; matchesPlayed: number; squadMoves: number; managerChanges: number; headlines: string[] };
export type DecisionOutcome = { title: string; choice: string; feedback: string; changes: string[] };
export type PendingSeason = { year: number; targetTier: number; place: number; outcome: "awans" | "utrzymanie" | "spadek" };
export type GameState = {
  playerOverload?: import("../lib/player-overload.mjs").PlayerOverload;
  narrative?: import("../lib/career-stories.mjs").NarrativeMemory;
  build: string; seed: number; coach: Coach; club: Club; season: string; date: string; round: number; teams: Team[]; fixtures: Fixture[]; players: Player[]; tactic: Tactic;
  training: { sessions: TrainingSession[]; readiness: number; completedRound: number | null; preset?: string };
  squadPolicy: string; teamPlan: string; pressures: Record<string, number>; burnout: number; lastBurnoutChange: number; president: Record<string, number>; presidentName: string;
  careerChallenge: CareerChallenge; environment: LevelEnvironment; worldHumor: number; promises?: { due:number;plan:string;source:string }[]; trainingMemory?: { youth: number; analysis: number; overload: number; weeks: number };
  world: WorldState; nextWorld?: WorldState; worldActivity: WorldActivity;
  finances: { monthlySalary: number; personalFunds: number };
  licenseCourse?: { target: License; weeksRemaining: number; totalWeeks: number; funding: "self" | "club" };
  licenseMessage?: string;
  boardGoal?: BoardGoal; developmentGoals: DevelopmentGoal[]; seasonEvidence: SeasonEvidence; history: string[]; inbox: CareerIssue[]; lastDecisionOutcome?: DecisionOutcome; matchState?: MatchState; newSeasonPending?: boolean;
  winterEvaluatedRound?: number; employmentStatus: "employed" | "unemployed" | "retired"; jobOffers: JobOffer[]; pendingSeason?: PendingSeason; careerEnded?: boolean;
  careerStats: CareerStats; seasonRecords: SeasonRecord[];
};

export const SAVE_KEY = "ten-trener-save-v1";
export { BUILD } from "./build-info";
export const DATABASE_STATS = LEAGUE_CATALOG_STATS;
export const LICENSES: License[] = ["Grassroots C", "UEFA B", "UEFA A", "UEFA PRO"];
export const LICENSE_MIN_TIER: Record<License, number> = { "Grassroots C": 8, "UEFA B": 6, "UEFA A": 3, "UEFA PRO": 1 };
export const LICENSE_COURSES: Partial<Record<License, { weeks: number; cost: number }>> = {
  "UEFA B": { weeks: 20, cost: 3200 }, "UEFA A": { weeks: 28, cost: 6000 }, "UEFA PRO": { weeks: 40, cost: 18000 },
};
export const LICENSE_CHALLENGES: Record<License, CareerChallenge> = {
  "Grassroots C": { label: "Od szatni i wapna", description: "Mało mediów, dużo pracy u podstaw. Wynik nie przykryje problemów z frekwencją i boiskiem.", expectation: "zbudowania wiarygodnej drużyny i walki o górną połowę", pressureMultiplier: 1, pressureBonus: 0, reputationBonus: 0 },
  "UEFA B": { label: "Ambicja od pierwszej kolejki", description: "Szerszy rynek, ale zarząd płaci za kompetencje i szybciej pyta o postęp.", expectation: "miejsca w górnej połowie i widocznego stylu gry", pressureMultiplier: 1.15, pressureBonus: 7, reputationBonus: 7 },
  "UEFA A": { label: "Licencja nie daje alibi", description: "Półprofesjonalne i centralne realia: kontrakty, wyjazdy, analiza oraz presja awansu.", expectation: "realnej walki o czołówkę bez okresu ochronnego", pressureMultiplier: 1.35, pressureBonus: 14, reputationBonus: 15 },
  "UEFA PRO": { label: "Nazwisko pod lupą", description: "Największe kluby są dostępne, lecz każdy remis ma nagłówek, a następca już siedzi na trybunie.", expectation: "natychmiastowego wyniku zgodnego z budżetem i reputacją", pressureMultiplier: 1.6, pressureBonus: 22, reputationBonus: 24 },
};
export const COACH_PROFILES: CoachProfile[] = ["Mentor", "Generał", "Taktyczny obsesyjny", "Wynikowiec", "Dyplomata", "Trener od zapierdolu", "Hazardzista", "Spokojny pragmatyk"];
export const PROFILE_NOTE: Record<CoachProfile, string> = {
  Mentor: "Rozwój i relacje. Trudniej narzucić dyscyplinę w kryzysie.", Generał: "Dyscyplina i reakcja na presję. Ryzyko konfliktów w szatni.",
  "Taktyczny obsesyjny": "Mocne przygotowanie meczowe. Wyższe obciążenie psychiczne.", Wynikowiec: "Duża mobilizacja na teraz. Słabsza cierpliwość do rozwoju.",
  Dyplomata: "Lepsze relacje z prezesem i mediami. Mniej ostrych reakcji.", "Trener od zapierdolu": "Wysoka intensywność i energia. Więcej zmęczenia oraz urazów.",
  Hazardzista: "Większy sufit odważnych decyzji. Duża zmienność konsekwencji.", "Spokojny pragmatyk": "Stabilność i odporność. Mniej gwałtownych skoków formy.",
};
export const PSYCH_QUESTIONS: PsychQuestion[] = [
  { id: "mistake", context: "Derby, 0:1. Młody stoper zawalił bramkę i nie patrzy nikomu w oczy.", question: "Co robisz w przerwie?", choices: [
    { label: "Daję mu prostą wskazówkę i zostawiam w grze.", scores: { Mentor: 3, Dyplomata: 1 } },
    { label: "Zmieniam go. Zespół musi znać granice.", scores: { Generał: 3, Wynikowiec: 1 } },
    { label: "Koryguję asekurację całej linii, nie jednego człowieka.", scores: { "Taktyczny obsesyjny": 3, "Spokojny pragmatyk": 1 } },
    { label: "Przesuwam go wyżej i odwracam problem w przewagę.", scores: { Hazardzista: 3, Mentor: 1 } },
  ] },
  { id: "rain", context: "Ostatni trening przed meczem. Leje, boisko ciężkie, połowa kadry rano pracowała.", question: "Jak kończysz mikrocykl?", choices: [
    { label: "Krótko i konkretnie. Świeżość jest częścią planu.", scores: { "Spokojny pragmatyk": 3, Dyplomata: 1 } },
    { label: "Robimy pełną jednostkę. Charakter nie rośnie pod dachem.", scores: { "Trener od zapierdolu": 3, Generał: 1 } },
    { label: "Przenoszę akcent na odprawę i warianty rozegrania.", scores: { "Taktyczny obsesyjny": 3, Mentor: 1 } },
    { label: "Trenujemy jeden ryzykowny schemat, który może wygrać mecz.", scores: { Hazardzista: 3, Wynikowiec: 1 } },
  ] },
  { id: "board", context: "Prezes obiecał spokój, po dwóch remisach oczekuje publicznej deklaracji awansu.", question: "Jak odpowiadasz?", choices: [
    { label: "Ustalamy wspólny komunikat i konkretne warunki oceny.", scores: { Dyplomata: 3, "Spokojny pragmatyk": 1 } },
    { label: "Biorę cel. Presja ma napędzać zespół.", scores: { Wynikowiec: 3, Generał: 1 } },
    { label: "Odmawiam pustych deklaracji i pokazuję dane z meczów.", scores: { "Taktyczny obsesyjny": 2, "Spokojny pragmatyk": 2 } },
    { label: "Deklaruję awans, ale proszę o jednego konkretnego piłkarza.", scores: { Hazardzista: 2, Dyplomata: 2 } },
  ] },
  { id: "captain", context: "Kapitan spóźnia się trzeci raz. Jest najlepszy w zespole i lubiany w szatni.", question: "Jaka jest reakcja?", choices: [
    { label: "Taka sama kara jak dla każdego.", scores: { Generał: 3, Wynikowiec: 1 } },
    { label: "Najpierw rozmowa: chcę znać przyczynę, potem decyzja.", scores: { Mentor: 2, Dyplomata: 2 } },
    { label: "Traci opaskę, ale skład ustalam pod wynik.", scores: { Wynikowiec: 3, "Spokojny pragmatyk": 1 } },
    { label: "Daję mu odpowiedzialność za część odprawy.", scores: { Mentor: 3, Hazardzista: 1 } },
  ] },
  { id: "minute80", context: "80. minuta, 1:1. Zarząd chce zwycięstwa, rywal groźnie kontruje.", question: "Wybierasz…", choices: [
    { label: "Drugiego napastnika i bardzo wysoki pressing.", scores: { Hazardzista: 3, "Trener od zapierdolu": 1 } },
    { label: "Jedną przygotowaną zmianę struktury bez otwierania środka.", scores: { "Taktyczny obsesyjny": 3, "Spokojny pragmatyk": 1 } },
    { label: "Najlepszego zmiennika, niezależnie od pozycji. Potrzebuję gola.", scores: { Wynikowiec: 3, Hazardzista: 1 } },
    { label: "Uspokajam mecz. Punkt też buduje sezon.", scores: { "Spokojny pragmatyk": 3, Dyplomata: 1 } },
  ] },
  { id: "crisis", context: "Po słabej serii zespół jest fizycznie zdrowy, ale mentalnie pusty.", question: "Pierwszy ruch w nowym tygodniu?", choices: [
    { label: "Indywidualne rozmowy i odbudowa odpowiedzialności.", scores: { Mentor: 3, Dyplomata: 1 } },
    { label: "Najcięższa jednostka miesiąca. Reset przez pracę.", scores: { "Trener od zapierdolu": 3, Generał: 1 } },
    { label: "Zamykam grupę i jasno wskazuję standardy.", scores: { Generał: 3, Wynikowiec: 1 } },
    { label: "Upraszczam plan do dwóch zachowań, które umiemy najlepiej.", scores: { "Spokojny pragmatyk": 2, "Taktyczny obsesyjny": 2 } },
  ] },
  { id: "paperwork", context: "Przed meczem kierownik nie potrafi jednoznacznie potwierdzić uprawnienia ważnego rezerwowego.", question: "Jak rozstrzygasz konflikt sportu z regulaminem?", choices: [
    { label: "Wykreślam go. Ryzyko walkowera jest nieakceptowalne.", scores: { "Spokojny pragmatyk": 3, Generał: 1 } },
    { label: "Czekam na potwierdzenie i w tym czasie układam dwa warianty XI.", scores: { "Taktyczny obsesyjny": 2, Dyplomata: 2 } },
    { label: "Biorę ryzyko. Mecze wygrywa się jakością na boisku.", scores: { Hazardzista: 3, Wynikowiec: 1 } },
    { label: "Oddaję decyzję kierownikowi, ale wspieram zawodnika rozmową.", scores: { Mentor: 2, Dyplomata: 2 } },
  ] },
  { id: "headline", context: "Media skróciły Twoją wypowiedź tak, że brzmi jak krytyka drużyny. Szatnia już widziała nagłówek.", question: "Co robisz jako pierwsze?", choices: [
    { label: "Rozmawiam z zespołem, zanim odpowiem publicznie.", scores: { Mentor: 3, Dyplomata: 1 } },
    { label: "Na konferencji przedstawiam pełny kontekst i dane.", scores: { "Taktyczny obsesyjny": 2, Dyplomata: 2 } },
    { label: "Nie tłumaczę się. Następny wynik zamknie temat.", scores: { Wynikowiec: 3, Generał: 1 } },
    { label: "Odwracam narrację jednym mocnym, ryzykownym komunikatem.", scores: { Hazardzista: 3, "Trener od zapierdolu": 1 } },
  ] },
];

export function resolveCoachProfile(answers: Record<string, number>): CoachProfile {
  return resolveProfileScores(COACH_PROFILES, PSYCH_QUESTIONS, answers);
}

export const LEVEL_ENVIRONMENTS: Record<number, LevelEnvironment> = {
  1: { tier: 1, label: "Ekstraklasa", status: "pełny profesjonalizm", work: "Zarządzasz sztabem, danymi, agentami i kalendarzem pod stałą obserwacją mediów.", positives: ["najlepsza infrastruktura", "pełny sztab i analiza"], risks: ["ultrasi i telewizja", "wynik wymagany natychmiast"], trainingSessions: 6, readinessCap: 96, absenceRisk: .005, mediaScale: 1.8, humorBase: 24 },
  2: { tier: 2, label: "I liga", status: "pełny profesjonalizm", work: "Łączysz walkę o awans z kontraktami, rotacją i presją właściciela.", positives: ["profesjonalny rytm", "duża widoczność trenera"], risks: ["karuzela trenerska", "agenci i budżet płac"], trainingSessions: 6, readinessCap: 95, absenceRisk: .007, mediaScale: 1.6, humorBase: 28 },
  3: { tier: 3, label: "II liga", status: "profesjonalna liga centralna", work: "Logistyka całej Polski, analiza rywali i utrzymanie szerokiej kadry są codziennością.", positives: ["regularny trening", "centralny rynek pracy"], risks: ["długie wyjazdy", "mały margines finansowy"], trainingSessions: 5, readinessCap: 94, absenceRisk: .01, mediaScale: 1.35, humorBase: 32 },
  4: { tier: 4, label: "III liga", status: "półprofesjonalizm", work: "Godzisz ambicje awansu z międzyregionalnymi wyjazdami i nierównymi warunkami klubów.", positives: ["rozwój młodych", "wyraźna ścieżka w górę"], risks: ["koszty transportu", "wąska kadra"], trainingSessions: 5, readinessCap: 92, absenceRisk: .025, mediaScale: 1.1, humorBase: 40 },
  5: { tier: 5, label: "IV liga", status: "próg profesjonalizacji", work: "Pilnujesz treningu, budżetu, licencji i zawodników łączących futbol z pracą.", positives: ["duży wpływ trenera", "silne lokalne derby"], risks: ["nierówna infrastruktura", "presja sponsora"], trainingSessions: 4, readinessCap: 90, absenceRisk: .05, mediaScale: .9, humorBase: 50 },
  6: { tier: 6, label: "V liga", status: "półamatorstwo", work: "Budujesz jakość przy regionalnych wyjazdach, ograniczonych płacach i trzech–czterech treningach.", positives: ["bliskość szatni", "lokalny scouting"], risks: ["krótka ławka", "praca zawodowa piłkarzy"], trainingSessions: 4, readinessCap: 88, absenceRisk: .07, mediaScale: .75, humorBase: 58 },
  7: { tier: 7, label: "Klasa okręgowa", status: "futbol regionalny", work: "Ustalasz wieczorne treningi, transport i skład zależny od dostępności zawodników.", positives: ["lokalna tożsamość", "bezpośredni wpływ"], risks: ["absencje w pracy", "ograniczona regeneracja"], trainingSessions: 3, readinessCap: 86, absenceRisk: .09, mediaScale: .6, humorBase: 66 },
  8: { tier: 8, label: "Klasa A", status: "amatorstwo z ambicją", work: "Rekrutujesz lokalnie, pilnujesz frekwencji i przekładasz taktykę na dwa treningi wieczorem.", positives: ["wyraźna wspólnota", "szybko widać pracę trenera"], risks: ["zmiany i praca", "mała głębia składu"], trainingSessions: 2, readinessCap: 84, absenceRisk: .12, mediaScale: .45, humorBase: 73 },
  9: { tier: 9, label: "Klasa B", status: "futbol społecznościowy", work: "Najpierw zbierasz jedenastu dostępnych, potem dopiero dopasowujesz plan do murawy i rywala.", positives: ["autentyczna szatnia", "lokalne derby znaczą wszystko"], risks: ["praca zawodowa", "boisko i sprzęt bywają dwunastym rywalem"], trainingSessions: 2, readinessCap: 82, absenceRisk: .16, mediaScale: .32, humorBase: 82 },
  10: { tier: 10, label: "Klasa C", status: "najniższy szczebel", work: "Trener bywa analitykiem, kierownikiem i człowiekiem od chorągiewek w jednej osobie.", positives: ["pełna swoboda budowy", "najbliżej lokalnej piłki"], risks: ["skrajna dostępność", "minimalna infrastruktura"], trainingSessions: 2, readinessCap: 80, absenceRisk: .2, mediaScale: .22, humorBase: 88 },
};

export function environmentForTier(tier: number): LevelEnvironment { return LEVEL_ENVIRONMENTS[Math.max(1, Math.min(10, tier))]; }
export function environmentForPack(pack: Pick<LeaguePack, "tier" | "competition">): LevelEnvironment {
  const profileTier = ({ Ekstraklasa: 1, "I liga": 2, "II liga": 3, "III liga": 4, "IV liga": 5, "V liga": 6, "Klasa okręgowa": 7, "Klasa A": 8, "Klasa B": 9, "Klasa C": 10 } as Record<string, number>)[pack.competition] ?? pack.tier;
  return { ...environmentForTier(profileTier), tier: pack.tier, label: pack.competition };
}
export const DEVELOPMENT_GOALS: Omit<DevelopmentGoal, "progress">[] = [
  { id: "tactics", label: "Taktyka", description: "Rozpocznij 8 meczów z gotowością taktyczną minimum 72%.", target: 8 },
  { id: "motivation", label: "Motywacja", description: "Rozpocznij 10 meczów ze średnim morale wyjściowej XI minimum 68.", target: 10 },
  { id: "people", label: "Zarządzanie ludźmi", description: "Rozwiąż 4 problemy bez zwiększenia presji w szatni.", target: 4 },
  { id: "analysis", label: "Analiza", description: "W 6 meczach wykonaj trening „Analiza rywala” i podejmij decyzję przy ławce po 30. minucie. Wynik nie warunkuje zaliczenia.", target: 6 },
  { id: "pressure", label: "Odporność na presję", description: "Nie przegraj 5 meczów rozpoczynanych przy presji minimum 45%.", target: 5 },
  { id: "adaptability", label: "Adaptacyjność", description: "Zdobądź punkty trzema różnymi formacjami.", target: 3 },
  { id: "youth", label: "Rozwój młodych", description: "Wystaw od pierwszej minuty trzech różnych zawodników U21.", target: 3 },
  { id: "reputation", label: "Reputacja / networking", description: "Wygraj 6 meczów ligowych — każdy wynik buduje widoczność trenera.", target: 6 },
];
export const POSITIONS: Position[] = ["BR", "PO", "ŚO", "LO", "DP", "ŚP", "PP", "ŚPO", "LP", "N"];
export const PERSONALITIES = ["Professional", "Emotional", "Ambitious", "Loyal", "Fragile", "Hot Head", "Big Game Player", "Irregular"];
export const FORMATIONS = {
  "4-2-3-1": ["BR", "PO", "ŚO-L", "ŚO-P", "LO", "DP-L", "DP-P", "PP", "ŚPO", "LP", "N"],
  "4-3-3": ["BR", "PO", "ŚO-L", "ŚO-P", "LO", "ŚP-P", "DP", "ŚP-L", "PP", "N", "LP"],
  "4-4-2": ["BR", "PO", "ŚO-L", "ŚO-P", "LO", "PP", "ŚP-P", "ŚP-L", "LP", "N-L", "N-P"],
  "3-5-2": ["BR", "ŚO-L", "ŚO", "ŚO-P", "PP", "ŚP-P", "DP", "ŚP-L", "LP", "N-L", "N-P"],
} as const;

export const FORMATION_COORDS: Record<keyof typeof FORMATIONS, Array<{ left: number; top: number }>> = {
  "4-2-3-1": [{ left: 50, top: 90 }, { left: 84, top: 73 }, { left: 62, top: 76 }, { left: 38, top: 76 }, { left: 16, top: 73 }, { left: 62, top: 57 }, { left: 38, top: 57 }, { left: 82, top: 34 }, { left: 50, top: 39 }, { left: 18, top: 34 }, { left: 50, top: 12 }],
  "4-3-3": [{ left: 50, top: 90 }, { left: 84, top: 73 }, { left: 62, top: 76 }, { left: 38, top: 76 }, { left: 16, top: 73 }, { left: 68, top: 51 }, { left: 50, top: 60 }, { left: 32, top: 51 }, { left: 82, top: 25 }, { left: 50, top: 12 }, { left: 18, top: 25 }],
  "4-4-2": [{ left: 50, top: 90 }, { left: 84, top: 73 }, { left: 62, top: 76 }, { left: 38, top: 76 }, { left: 16, top: 73 }, { left: 82, top: 46 }, { left: 62, top: 52 }, { left: 38, top: 52 }, { left: 18, top: 46 }, { left: 37, top: 15 }, { left: 63, top: 15 }],
  "3-5-2": [{ left: 50, top: 90 }, { left: 74, top: 73 }, { left: 50, top: 78 }, { left: 26, top: 73 }, { left: 86, top: 48 }, { left: 66, top: 51 }, { left: 50, top: 61 }, { left: 34, top: 51 }, { left: 14, top: 48 }, { left: 37, top: 15 }, { left: 63, top: 15 }],
};

export function nextLicense(current: License): License | undefined { return LICENSES[LICENSES.indexOf(current) + 1]; }

/*
 * Zachowane wyłącznie jako notatka migracyjna ze starszych zapisów Build 1.6.
 * Nie jest częścią aktywnej bazy ani bundla gry; aktywny katalog pochodzi z PCDB poniżej.
const regional: [string, string, string[]][] = [
  ["Dolnośląski ZPN", "Wrocław", ["Polonia Wrocław", "Błękitni Jerzmanowo", "Orzeł Pawłowice", "Sokół Smolec", "KS Brochów", "Odra Lubiąż", "Zorza Pęgów", "Piast Żerniki", "Wicher Domasław", "Burza Bystrzyca"]],
  ["Kujawsko-Pomorski ZPN", "Bydgoszcz", ["Gwiazda Bydgoszcz", "Wisła Fordon", "Zawisza II Bydgoszcz", "Spójnia Białe Błota", "Dąb Potulice", "Skra Paterek", "Orzeł Kcynia", "Victoria Kołaczkowo", "Gryf Sicienko", "Noteć Łabiszyn"]],
  ["Lubelski ZPN", "Lublin", ["Sygnał Lublin", "Vrotcovia Lublin", "Avenir Jabłonna", "LKS Wierzchowiska", "Perła Borzechów", "Unia Wilkołaz", "Iskra Krzemień", "Stok Zakrzówek", "Pogoń Trzydnik", "Tęcza Kraśnik"]],
  ["Lubuski ZPN", "Zielona Góra", ["Drzonkowianka Racula", "Zorza Ochla", "Tęcza Krosno Odrzańskie", "Błękitni Lubięcin", "Pogoń Wężyska", "Odra Nietków", "Piast Czerwieńsk", "Czarni Rudno", "Sparta Łężyca", "Start Płoty"]],
  ["Łódzki ZPN", "Łódź", ["Start Łódź", "Włókniarz Konstantynów", "Sokół Lutomiersk", "Victoria Rąbień", "Orzeł Piątkowisko", "LKS Rosanów", "Kolejarz Łódź", "Iskra Dobroń", "Kobra Leźnica", "Pogoń Rogów"]],
  ["Małopolski ZPN", "Kraków", ["Bieżanowianka Kraków", "Płomień Kościelec", "Nadwiślan Kraków", "Tramwaj Kraków", "Sportowiec Modlniczka", "Gajowianka Gaj", "Albertus Kraków", "Bibiczanka Bibice", "Polonia Kraków", "Wanda Kraków"]],
  ["Mazowiecki ZPN", "Warszawa", ["Gwardia Warszawa", "KTS Weszło II Warszawa", "Sarmata Warszawa", "Drukarz II Warszawa", "Legion Warszawa", "UKS Siekierki", "Perła Złotokłos", "Orzeł Baniocha", "Jedność Żabieniec", "Laura Chylice"]],
  ["Opolski ZPN", "Opole", ["LZS Grudzice", "Groszmal Opole", "Burza Lipki", "Victoria Dobrzyń", "LZS Sławice", "Gazownik Wawelno", "Tempo Opole", "LZS Popielów", "Unia Murów", "Polonia Karłowice"]],
  ["Podlaski ZPN", "Białystok", ["Włókniarz Białystok", "Piast Białystok", "Korona Dobrzyniewo", "Gryf Gródek", "Supraślanka Supraśl", "Iskra Narew", "Hetman Tykocin", "Jasion Jasionówka", "Sudovia Szudziałowo", "Orzeł Tykocin"]],
  ["Pomorski ZPN", "Gdańsk", ["Portowiec Gdańsk", "Morena Gdańsk", "Klif Chłapowo", "Sokół Ełganowo", "GTS Rokitnica", "Wisła Steblewo", "Orzeł Straszyn", "KS Mściszewice", "Zieloni Łąg", "Gryf Goręczyno"]],
  ["Śląski ZPN", "Rybnik", ["LKS Chwałęcice", "Inter Krostoszowice", "Płomień Ochojec", "LKS Baranowice", "Borowik Szczejkowice", "KP Kamień", "Jedność Jejkowice", "Wicher Wilchwy", "Polaris Żory", "Ruch Stanowice"]],
  ["Świętokrzyski ZPN", "Kielce", ["Polonia Białogon", "Orlęta Kielce", "Top Spin Promnik", "Nidzianka Bieliny", "GKS Górno", "Lechia Strawczyn", "Czarni Jaworze", "Zryw Skroniów", "Victoria Mniów", "Łysica II Bodzentyn"]],
  ["Warmińsko-Mazurski ZPN", "Olsztyn", ["Zamek Kurzętnik", "PFT Sampława", "LZS Frednowy", "Iskra Narzym", "Orzeł Ulnowo", "Zamek Szymbark", "Czarni Rudzienice", "Olimpia Kisielice", "Ossa Biskupiec", "Jordan Kazanice"]],
  ["Wielkopolski ZPN", "Poznań", ["Byki Obrowo", "Sokół Drawsko", "Śródmieście Wronki", "LKS Piotrowo", "AS Wronki", "Tarzani Wrzeszczyna", "Noteć Rosko", "Orzeł Gulcz", "Gryf Siedlisko", "Fortuna Wieleń"]],
  ["Zachodniopomorski ZPN", "Szczecin", ["Kasta Szczecin", "Okręt Szczecin", "Pionier Szczecin", "Znicz Niedźwiedź", "Rybak Trzebież", "Błękit Pniewo", "Wołczkowo-Bezrzecze", "Sztorm Szczecin", "Grot Gardno", "Wicher Reptowo"]],
];

const LEGACY_LEAGUE_PACKS: LeaguePack[] = [
  { id: "ekstraklasa", association: "PZPN — rozgrywki centralne", district: "Polska", competition: "Ekstraklasa", group: "liga ogólnopolska", tier: 1, teams: ["Legia Warszawa", "Lech Poznań", "Raków Częstochowa", "Jagiellonia Białystok", "Pogoń Szczecin", "Górnik Zabrze", "Widzew Łódź", "Cracovia", "Zagłębie Lubin", "Korona Kielce"] },
  { id: "pierwsza-liga", association: "PZPN — rozgrywki centralne", district: "Polska", competition: "I liga", group: "liga ogólnopolska", tier: 2, teams: ["Wisła Kraków", "Ruch Chorzów", "ŁKS Łódź", "Miedź Legnica", "Polonia Warszawa", "Stal Rzeszów", "GKS Tychy", "Odra Opole", "Puszcza Niepołomice", "Chrobry Głogów"] },
  { id: "druga-liga", association: "PZPN — rozgrywki centralne", district: "Polska", competition: "II liga", group: "liga ogólnopolska", tier: 3, teams: ["Zagłębie Sosnowiec", "KKS Kalisz", "Świt Szczecin", "Podbeskidzie Bielsko-Biała", "Chojniczanka Chojnice", "Resovia", "Hutnik Kraków", "Olimpia Grudziądz", "Rekord Bielsko-Biała", "ŁKS II Łódź"] },
  { id: "trzecia-liga-iv", association: "PZPN — rozgrywki centralne", district: "grupa IV", competition: "III liga", group: "grupa IV", tier: 4, teams: ["JKS Jarosław", "Sokół Kolbuszowa Dolna", "KSZO Ostrowiec Świętokrzyski", "Siarka Tarnobrzeg", "Star Starachowice", "Avia Świdnik", "Podlasie Biała Podlaska", "Wisłoka Dębica", "Chełmianka Chełm", "Korona II Kielce"], source: "90minut.pl, sezon 2026/27" },
  { id: "podkarpacka-iv", association: "Podkarpacki ZPN", district: "województwo", competition: "IV liga", group: "podkarpacka", tier: 5, teams: ["Karpaty Krosno", "Cosmos Nowotaniec", "Stal Łańcut", "Sokół Sieniawa", "Izolator Boguchwała", "Polonia Przemyśl", "Ekoball Stal Sanok", "Stal II Rzeszów", "Legion Pilzno", "Igloopol Dębica"], source: "90minut.pl, sezon 2026/27" },
  { id: "podkarpacka-okregowa-jaroslaw", association: "Podkarpacki ZPN", district: "Jarosław", competition: "Klasa okręgowa", group: "Jarosław", tier: regionalTier("Podkarpacki ZPN", "Klasa okręgowa"), teams: ["Czuwaj Przemyśl", "Start Lisie Jamy", "Płomień Morawsko", "Orzeł Przeworsk", "Wiraż Chłopice", "Sanoczanka Święte", "Orzeł Torki", "Promyk Urzejowice", "Huragan Gniewczyna", "Piast Tuczempy"], source: "Podkarpacki ZPN / 90minut.pl, sezon 2026/27" },
  { id: "podkarpacka-a-krosno-ii", association: "Podkarpacki ZPN", district: "Krosno", competition: "Klasa A", group: "Krosno II", tier: regionalTier("Podkarpacki ZPN", "Klasa A"), teams: ["Karpaty II Krosno", "Zamczysko Odrzykoń", "LKS Głowienka", "Orlew Suchodół", "Wisłok Krościenko Wyżne", "Jasiołka Świerzowa Polska", "Nafta Jedlicze", "LKS Lubatowa", "Tęcza Zręcin", "LKS Haczów"], source: "Podkarpacki ZPN / 90minut.pl, sezon 2026/27" },
  { id: "podkarpacka-a-jaroslaw", association: "Podkarpacki ZPN", district: "Jarosław", competition: "Klasa A", group: "Jarosław", tier: regionalTier("Podkarpacki ZPN", "Klasa A"), teams: ["LKS Skołoszów", "Santos Piwoda", "MKS Radymno", "Piast II Tuczempy", "Dąb Dobkowice", "Pogórze Rokietnica", "LKS Manasterz", "Błękitni Pełkinie", "Hetman Laszki", "Orzeł Czerwona Wola"], source: "Podkarpacki ZPN / 90minut.pl, sezon 2026/27" },
  { id: "podkarpacka-b-jaroslaw", association: "Podkarpacki ZPN", district: "Jarosław", competition: "Klasa B", group: "Jarosław", tier: regionalTier("Podkarpacki ZPN", "Klasa B"), teams: ["Łazowianka Łazy", "Wietlin", "Korona Tuchla", "San Gorzyce", "Iskra Cieszacin Wielki", "Tęcza Jankowice", "Orzeł Bystrowice", "LKS Mołodycz", "Dąb Cetula", "Zorza Zarzecze"], source: "Podkarpacki ZPN / 90minut.pl, sezon 2026/27" },
  ...regional.map(([association, district, teams], index) => ({ id: `regional-b-${index}`, association, district, competition: "Klasa B", group: district, tier: regionalTier(association, "Klasa B"), teams })),
];
*/

export const LEAGUE_PACKS: LeaguePack[] = VERIFIED_LEAGUE_PACKS
  .map((pack) => ({ ...pack, teams: [...pack.teams] })) as LeaguePack[];

export const FIRST_NAMES = ["Adam", "Adrian", "Aleksander", "Bartosz", "Błażej", "Dawid", "Dominik", "Emil", "Filip", "Grzegorz", "Hubert", "Igor", "Jakub", "Jan", "Kacper", "Kamil", "Karol", "Konrad", "Krystian", "Łukasz", "Maciej", "Marcel", "Marek", "Mateusz", "Michał", "Mikołaj", "Miłosz", "Norbert", "Oskar", "Patryk", "Paweł", "Piotr", "Przemysław", "Rafał", "Robert", "Sebastian", "Szymon", "Tomasz", "Wiktor", "Wojciech"];
export const LAST_NAMES = ["Adamski", "Bąk", "Bednarek", "Bielecki", "Błaszczyk", "Borowski", "Brzozowski", "Chmiel", "Cieślak", "Czarnecki", "Duda", "Dziedzic", "Gajda", "Głowacki", "Grabowski", "Janik", "Jankowski", "Kaczmarek", "Kamiński", "Kasprzak", "Kowal", "Krawczyk", "Król", "Kubiak", "Kurek", "Lis", "Maj", "Makowski", "Marciniak", "Mazur", "Michalak", "Nowak", "Olejniczak", "Olszewski", "Pawlak", "Piasecki", "Pietrzak", "Przybylski", "Rutkowski", "Sikora", "Sokołowski", "Stępień", "Szulc", "Tomaszewski", "Urban", "Walczak", "Wasilewski", "Włodarczyk", "Wrona", "Zając", "Zieliński"];
export const TIER_OVR: Record<number, number> = { 1: 76, 2: 69, 3: 63, 4: 58, 5: 54, 6: 50, 7: 46, 8: 42, 9: 38, 10: 34 };

export function randomInt(seed: number, min: number, max: number) { const r = rngNext(seed); return { value: Math.floor(r.value * (max - min + 1)) + min, seed: r.seed }; }
export { buildMatchStrength, buildSchedule, burnoutMatchPenalty, capReadiness, coachingExperienceEligibility, conditionFromFatigue, defaultMicrocycle, diagnoseMatchOutcome, dismissalProbability, effectiveOVR, environmentIncidentOccurs, evaluateMicrocycle, expectedOutcomeProbabilities, goalSatisfied, highestEligibleCoachingExperience, highestEligibleStartingLicense, injuryRiskFromFatigue, licenseCoversCompetition, licenseCoversTier, liveBreakdown, liveOVR, naturalRecoveryForGap, normalizeSlot, normalizeStartingLicense, offseasonBaseChange, offseasonBurnout, playerAvailable, POLICY_EFFECTS, positionPenalty, pressureDeltaForResult, readinessStrengthImpact, requiredLicenseForCompetition, requiredLicenseForTier, rngNext, seasonRoundDates, selectBestLineup, selectLineupForPlan, shouldRetirePlayer, simulateMatchPlan, sortedTable, startingLicenseEligibility, tacticalPlanImpact, trainingTacticSynergy, TEAM_PLANS, teamLiveStrength, TRAINING_PRESETS, trainingPresetSessions, updateTeamResult, weeklyBurnoutDelta, winterBreakDays };
