import { pressingStrength } from "./pressing.mjs";
import { matchPhrase } from "./game-language.mjs";

const POSITION_GROUPS = {
  defence: ["PO", "ŚO", "LO", "DP"],
  midfield: ["DP", "ŚP", "PP", "ŚPO", "LP"],
  attack: ["PP", "ŚPO", "LP", "N"],
};

export const POLICY_EFFECTS = {
  BALANCED: {
    label: "Zrównoważona",
    short: "Stabilny kompromis bez premii i bez dodatkowego kosztu.",
    matchStrength: 0,
    fatigue: 0,
    morale: 0,
    burnout: 0,
  },
  HARDLINE: {
    label: "Twarda ręka",
    short: "+ chwilowa intensywność • − świeżość i cierpliwość szatni",
    matchStrength: 0.55,
    fatigue: 2,
    morale: -1,
    burnout: 0.5,
  },
  ROTATION: {
    label: "Rotacja",
    short: "+ świeżość i mniejsze ryzyko urazów • − rytm najmocniejszej XI",
    matchStrength: -0.45,
    fatigue: -1,
    morale: 0,
    burnout: -0.5,
  },
  MOTIVATIONAL: {
    label: "Motywacyjna",
    short: "+ morale i relacje • koszt energii, premia nie kumuluje się bez końca",
    matchStrength: 0.2,
    fatigue: 1,
    morale: 1,
    burnout: 0.5,
  },
};

export const TEAM_PLANS = {
  STRONGEST: {
    label: "Najsilniejsza XI", tag: "jakość", formation: "4-2-3-1", policy: "BALANCED",
    description: "Najwyższa bieżąca jakość przy zachowaniu naturalnych pozycji.",
    benefit: "najwyższy sufit na dziś", risk: "liderzy szybciej zbierają minuty i zmęczenie",
    tactic: { mentality: "Zrównoważona", tempo: "Normalne", pressing: "Średni", line: "Średnia", width: "Standardowa", buildUp: "Mieszane", passingRisk: "Umiarkowane" },
  },
  FORM: {
    label: "Gorąca forma", tag: "dyspozycja", formation: "4-3-3", policy: "MOTIVATIONAL",
    description: "Pierwszeństwo mają zawodnicy będący w rytmie i z wysokim morale.",
    benefit: "premia za aktualną dyspozycję", risk: "hierarchia może zmieniać się z tygodnia na tydzień",
    tactic: { mentality: "Ofensywna", tempo: "Wysokie", pressing: "Średni", line: "Średnia", width: "Szeroka", buildUp: "Mieszane", passingRisk: "Odważne" },
  },
  ROTATION: {
    label: "Rotacja", tag: "minuty", formation: "4-2-3-1", policy: "ROTATION",
    description: "Odpoczywają najbardziej eksploatowani, a szansę dostaje druga linia.",
    benefit: "mniej urazów i równiej rozłożone obciążenia", risk: "niższy chwilowy sufit",
    tactic: { mentality: "Zrównoważona", tempo: "Normalne", pressing: "Średni", line: "Średnia", width: "Standardowa", buildUp: "Mieszane", passingRisk: "Bezpieczne" },
  },
  YOUTH: {
    label: "Młodzi do gry", tag: "U21", formation: "4-3-3", policy: "MOTIVATIONAL",
    description: "Młodzież dostaje realną drogę do XI, ale bez łamania pozycji.",
    benefit: "rozwój i postęp celu młodzieżowego", risk: "mniej doświadczenia w trudnym meczu",
    tactic: { mentality: "Zrównoważona", tempo: "Normalne", pressing: "Wysoki", line: "Wysoka", width: "Szeroka", buildUp: "Krótkie", passingRisk: "Umiarkowane" },
  },
  FRESH: {
    label: "Świeże nogi", tag: "kondycja", formation: "4-4-2", policy: "ROTATION",
    description: "Silnik wybiera najlepiej zregenerowanych, nawet kosztem kilku punktów jakości.",
    benefit: "tempo w końcówce i mniejsze ryzyko urazu", risk: "część liderów zacznie na ławce",
    tactic: { mentality: "Zrównoważona", tempo: "Wysokie", pressing: "Średni", line: "Średnia", width: "Szeroka", buildUp: "Bezpośrednie", passingRisk: "Umiarkowane" },
  },
  EXPERIENCE: {
    label: "Doświadczenie", tag: "spokój", formation: "3-5-2", policy: "HARDLINE",
    description: "Ważniejsze są ogranie, odporność i utrzymanie struktury pod presją.",
    benefit: "mniej chaosu w meczu o stawkę", risk: "starsza XI gorzej znosi wysoki rytm",
    tactic: { mentality: "Zrównoważona", tempo: "Niskie", pressing: "Niski", line: "Niska", width: "Standardowa", buildUp: "Mieszane", passingRisk: "Bezpieczne" },
  },
  LOW_BLOCK: {
    label: "Zamknij tyły", tag: "obrona", formation: "4-2-3-1", policy: "BALANCED",
    description: "Kompaktowa struktura, niski blok i cierpliwe szukanie momentu.",
    benefit: "ograniczenie przestrzeni dla mocniejszego rywala", risk: "mniej ludzi blisko bramki przeciwnika",
    tactic: { mentality: "Defensywna", tempo: "Niskie", pressing: "Niski", line: "Niska", width: "Wąska", buildUp: "Bezpośrednie", passingRisk: "Bezpieczne" },
  },
  PRESS: {
    label: "Odbiór wysoko", tag: "pressing", formation: "4-3-3", policy: "HARDLINE",
    description: "Świeża i ruchliwa XI ma odzyskiwać piłkę blisko bramki rywala.",
    benefit: "więcej odbiorów i chwilowy sufit intensywności", risk: "wysoki koszt kondycji i przestrzeń za linią",
    tactic: { mentality: "Ofensywna", tempo: "Wysokie", pressing: "Wysoki", line: "Wysoka", width: "Standardowa", buildUp: "Krótkie", passingRisk: "Odważne" },
  },
  COUNTER: {
    label: "Kontratak", tag: "przejście", formation: "4-4-2", policy: "BALANCED",
    description: "Niższa linia, szybkie pierwsze podanie i dwóch graczy ataku.",
    benefit: "groźne przejścia po odbiorze", risk: "oddanie części kontroli nad piłką",
    tactic: { mentality: "Defensywna", tempo: "Wysokie", pressing: "Niski", line: "Niska", width: "Szeroka", buildUp: "Bezpośrednie", passingRisk: "Odważne" },
  },
  POSSESSION: {
    label: "Kontrola piłki", tag: "posiadanie", formation: "4-3-3", policy: "BALANCED",
    description: "Techniczna XI cierpliwie buduje akcje i ogranicza przypadek.",
    benefit: "kontrola rytmu i mniej strat przy dobrej gotowości", risk: "słabe boisko i brak świeżości szybko psują plan",
    tactic: { mentality: "Zrównoważona", tempo: "Niskie", pressing: "Średni", line: "Wysoka", width: "Szeroka", buildUp: "Krótkie", passingRisk: "Bezpieczne" },
  },
};

export const TRAINING_PRESETS = {
  BALANCED: { label: "Zrównoważony", description: "Regeneracja, przygotowanie i bodziec bez skrajnego obciążenia." },
  RECOVERY: { label: "Regeneracyjny", description: "Odbudowa kondycji kosztem części gotowości meczowej." },
  OPPONENT: { label: "Pod rywala", description: "Analiza, taktyka i stałe fragmenty pod najbliższy mecz." },
  INTENSE: { label: "Intensywny", description: "Więcej motoryki i pressingu; wysoki koszt fizyczny." },
  YOUTH: { label: "Rozwojowy", description: "Młodzi, technika i atmosfera z umiarkowanym obciążeniem." },
};

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeStartingLicense(value) {
  if (value === "Grassroots D" || value === "UEFA C") return "Grassroots C";
  return ["Grassroots C", "UEFA B", "UEFA A", "UEFA PRO"].includes(value) ? value : "Grassroots C";
}

const LICENSE_ORDER = ["Grassroots C", "UEFA B", "UEFA A", "UEFA PRO"];

const COACHING_EXPERIENCE_ORDER = ["Debiutant", "1–3 lata", "4–10 lat", "Ponad 10 lat"];
const EARLIEST_COACHING_AGE = {
  Brak: 21,
  Amator: 22,
  "Niższe ligi": 24,
  Zawodowiec: 30,
  Reprezentant: 32,
};

export function coachingExperienceEligibility(age, playingExperience, coachingExperience) {
  const safeAge = clamp(Math.round(Number(age) || 30), 30, 45);
  const earliest = EARLIEST_COACHING_AGE[playingExperience] ?? 23;
  const availableYears = Math.max(0, safeAge - earliest);
  const minimumYears = coachingExperience === "Ponad 10 lat" ? 11 : coachingExperience === "4–10 lat" ? 4 : coachingExperience === "1–3 lata" ? 1 : 0;
  const eligible = COACHING_EXPERIENCE_ORDER.includes(coachingExperience) && availableYears >= minimumYears;
  const reason = eligible
    ? `Życiorys mieści ${availableYears} ${availableYears === 1 ? "rok" : "lat"} możliwej praktyki trenerskiej.`
    : `Przy wieku ${safeAge} lat i ścieżce „${playingExperience}” możliwe jest najwyżej ${availableYears} lat praktyki trenerskiej.`;
  return { eligible, availableYears, reason };
}

export function highestEligibleCoachingExperience(age, playingExperience) {
  return [...COACHING_EXPERIENCE_ORDER].reverse().find((experience) => coachingExperienceEligibility(age, playingExperience, experience).eligible) ?? "Debiutant";
}

export function requiredLicenseForTier(tier) {
  if (tier <= 2) return "UEFA PRO";
  if (tier <= 5) return "UEFA A";
  if (tier <= 7) return "UEFA B";
  return "Grassroots C";
}

export function licenseCoversTier(license, tier) {
  return LICENSE_ORDER.indexOf(normalizeStartingLicense(license)) >= LICENSE_ORDER.indexOf(requiredLicenseForTier(tier));
}

export function requiredLicenseForCompetition(competition) {
  if (competition === "Ekstraklasa" || competition === "I liga") return "UEFA PRO";
  if (["II liga", "III liga", "IV liga"].includes(competition)) return "UEFA A";
  if (competition === "V liga" || competition === "Klasa okręgowa") return "UEFA B";
  return "Grassroots C";
}

export function licenseCoversCompetition(license, competition) {
  return LICENSE_ORDER.indexOf(normalizeStartingLicense(license)) >= LICENSE_ORDER.indexOf(requiredLicenseForCompetition(competition));
}

export function startingLicenseEligibility(license, playingExperience, coachingExperience, age = 45) {
  const biography = coachingExperienceEligibility(age, playingExperience, coachingExperience);
  if (!biography.eligible) return { eligible: false, reason: biography.reason };
  const coaching = ["Debiutant", "1–3 lata", "4–10 lat", "Ponad 10 lat"].indexOf(coachingExperience);
  const playing = ["Brak", "Amator", "Niższe ligi", "Zawodowiec", "Reprezentant"].indexOf(playingExperience);
  if (license === "Grassroots C") return { eligible: true, reason: "Podstawowa licencja startowa." };
  if (license === "UEFA B") {
    const eligible = coaching >= 1 || playing >= 2;
    return { eligible, reason: eligible ? "Udokumentowana praktyka pozwala rozpocząć z UEFA B." : "Wymagane: co najmniej 1–3 lata trenowania albo gra w niższych ligach." };
  }
  if (license === "UEFA A") {
    const eligible = coaching >= 2 || (coaching >= 1 && playing >= 3);
    return { eligible, reason: eligible ? "Doświadczenie uzasadnia przebytą ścieżkę do UEFA A." : "Wymagane: co najmniej 4 lata trenowania albo 1–3 lata i zawodowa kariera." };
  }
  if (license === "UEFA PRO") {
    const eligible = coaching >= 3 || (coaching >= 2 && playing >= 4);
    return { eligible, reason: eligible ? "Historia kariery uzasadnia najwyższą licencję." : "Wymagane: ponad 10 lat trenowania albo 4–10 lat i doświadczenie reprezentacyjne." };
  }
  return { eligible: false, reason: "Nieznany poziom licencji." };
}

export function highestEligibleStartingLicense(playingExperience, coachingExperience, age = 45) {
  return [...LICENSE_ORDER].reverse().find((license) => startingLicenseEligibility(license, playingExperience, coachingExperience, age).eligible) ?? "Grassroots C";
}

export function readinessStrengthImpact(readiness) {
  return Number(clamp((readiness - 70) * 0.08, -1.6, 1.8).toFixed(2));
}

export function tacticalPlanImpact(tactic = {}, averageCondition = 80, readiness = 70) {
  let value = 0;
  value += pressingStrength(tactic.pressing, averageCondition);
  if (tactic.tempo === "Wysokie") value += averageCondition >= 74 ? 0.18 : -0.28;
  if (tactic.line === "Wysoka" && tactic.pressing === "Niski") value -= 0.35;
  if (tactic.buildUp === "Bezpośrednie" && tactic.tempo === "Wysokie") value += 0.12;
  if (tactic.buildUp === "Krótkie" && tactic.passingRisk === "Odważne" && readiness < 68) value -= 0.22;
  if (tactic.mentality === "Ofensywna" && averageCondition < 68) value -= 0.25;
  return Number(clamp(value, -1.1, 0.7).toFixed(2));
}

export function trainingTacticSynergy(sessions = [], tactic = {}, teamPlan = "STRONGEST") {
  const focus = sessions.reduce((counts, session) => ({ ...counts, [session.focus]: (counts[session.focus] ?? 0) + 1 }), {});
  let shortTerm = 0;
  const reasons = [];
  if (["Wysoki", "Bardzo wysoki"].includes(tactic.pressing)) {
    if (focus.Pressing || focus.Motoryka) { shortTerm += 0.35; reasons.push("pressing podparty mikrocyklem"); }
    else { shortTerm -= 0.3; reasons.push("wysoki pressing bez bodźca motorycznego"); }
  }
  if (tactic.buildUp === "Krótkie") {
    if (focus.Taktyka || focus["Analiza rywala"]) { shortTerm += 0.25; reasons.push("rozegranie przećwiczone"); }
    else shortTerm -= 0.18;
  }
  if (tactic.buildUp === "Bezpośrednie" && (focus.Finalizacja || focus["Stałe fragmenty"])) shortTerm += 0.22;
  if (teamPlan === "LOW_BLOCK" && focus["Analiza rywala"]) shortTerm += 0.28;
  if (teamPlan === "YOUTH" && focus["Rozwój młodych"]) shortTerm += 0.2;
  if (focus.Regeneracja && ["Wysoki", "Bardzo wysoki"].includes(tactic.pressing)) shortTerm += 0.12;
  const overload = sessions.filter((session) => session.intensity === "Wysoka" && session.focus !== "Regeneracja").length;
  if (overload >= Math.max(2, Math.ceil(sessions.length / 2))) { shortTerm -= 0.25; reasons.push("mikrocykl przeciążony"); }
  return {
    shortTerm: Number(clamp(shortTerm, -0.8, 0.9).toFixed(2)),
    youthLegacy: (focus["Rozwój młodych"] ?? 0),
    analysisLegacy: (focus["Analiza rywala"] ?? 0),
    overloadLegacy: overload,
    reasons,
  };
}

export function buildMatchStrength({ lineupOVR, readiness, coachTactics, averageCondition, tactic, policyStrength = 0, burnout = 0, incidentPenalty = 0, trainingSynergy = 0 }) {
  const factors = {
    lineup: Number(lineupOVR.toFixed(2)),
    preparation: readinessStrengthImpact(readiness),
    coach: Number(clamp((coachTactics - 45) / 18, -1.5, 2.5).toFixed(2)),
    plan: tacticalPlanImpact(tactic, averageCondition, readiness),
    training: Number(trainingSynergy.toFixed(2)),
    policy: Number(policyStrength.toFixed(2)),
    burnout: -burnoutMatchPenalty(burnout),
    incident: -Number(incidentPenalty.toFixed(2)),
  };
  return { factors, total: Number(Object.values(factors).reduce((sum, value) => sum + value, 0).toFixed(2)) };
}

export function teamLiveStrength(team) {
  const form = team.form ?? 50;
  const morale = team.morale ?? 55;
  const fatigue = team.fatigue ?? 18;
  return Number((team.ovr + (form - 50) * 0.035 + (morale - 50) * 0.025 - Math.max(0, fatigue - 30) * 0.025).toFixed(2));
}

export function pressureDeltaForResult(result, multiplier) {
  const safeMultiplier = clamp(Number.isFinite(multiplier) ? multiplier : 1, 1, 2);
  if (result === "win") return -Math.max(3, Math.round(7 / safeMultiplier));
  if (result === "draw") return Math.round((safeMultiplier - 1) * 8) - 1;
  return Math.round(8 * safeMultiplier);
}

export function capReadiness(current, gain, cap) {
  return clamp(current + gain, 0, cap);
}

const MICROCycle_TEMPLATES = [
  { day: "D+1", focus: "Regeneracja", intensity: "Niska" },
  { day: "D+2", focus: "Rozwój młodych", intensity: "Niska" },
  { day: "D−5", focus: "Analiza rywala", intensity: "Normalna" },
  { day: "D−4", focus: "Motoryka", intensity: "Normalna" },
  { day: "D−3", focus: "Finalizacja", intensity: "Normalna" },
  { day: "D−1", focus: "Taktyka", intensity: "Niska" },
];

export function defaultMicrocycle(sessionCount = 2) {
  const count = clamp(Math.round(sessionCount), 2, 6);
  const indices = count === 2 ? [4, 5] : count === 3 ? [0, 4, 5] : count === 4 ? [0, 3, 4, 5] : count === 5 ? [0, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5];
  return indices.map((index, slot) => ({ id: `session-${slot + 1}`, ...MICROCycle_TEMPLATES[index] }));
}

export function trainingPresetSessions(sessionCount = 2, presetId = "BALANCED") {
  const base = defaultMicrocycle(sessionCount);
  const sequences = {
    RECOVERY: [
      { focus: "Regeneracja", intensity: "Niska" }, { focus: "Taktyka", intensity: "Niska" },
      { focus: "Regeneracja", intensity: "Niska" }, { focus: "Atmosfera", intensity: "Niska" },
      { focus: "Analiza rywala", intensity: "Niska" }, { focus: "Stałe fragmenty", intensity: "Niska" },
    ],
    OPPONENT: [
      { focus: "Analiza rywala", intensity: "Normalna" }, { focus: "Taktyka", intensity: "Normalna" },
      { focus: "Stałe fragmenty", intensity: "Normalna" }, { focus: "Regeneracja", intensity: "Niska" },
      { focus: "Finalizacja", intensity: "Normalna" }, { focus: "Taktyka", intensity: "Niska" },
    ],
    INTENSE: [
      { focus: "Motoryka", intensity: "Wysoka" }, { focus: "Pressing", intensity: "Wysoka" },
      { focus: "Regeneracja", intensity: "Niska" }, { focus: "Finalizacja", intensity: "Wysoka" },
      { focus: "Taktyka", intensity: "Normalna" }, { focus: "Stałe fragmenty", intensity: "Normalna" },
    ],
    YOUTH: [
      { focus: "Rozwój młodych", intensity: "Normalna" }, { focus: "Atmosfera", intensity: "Niska" },
      { focus: "Regeneracja", intensity: "Niska" }, { focus: "Taktyka", intensity: "Normalna" },
      { focus: "Rozwój młodych", intensity: "Normalna" }, { focus: "Finalizacja", intensity: "Niska" },
    ],
  };
  if (presetId === "BALANCED" || !sequences[presetId]) return base;
  const sequence = sequences[presetId];
  return base.map((session, index) => ({ ...session, ...sequence[index] }));
}

export function naturalRecoveryForGap(daysBetweenMatches = 7, tier = 9) {
  const restDays = clamp(Math.round(daysBetweenMatches) - 1, 1, 13);
  const rate = tier <= 3 ? 2.5 : tier <= 6 ? 2 : 1.6;
  return Math.round(restDays * rate);
}

const TRAINING_FOCUS_EFFECTS = {
  "Regeneracja": { readiness: 0.3, fatigue: -5, morale: 0.4, form: 0 },
  "Analiza rywala": { readiness: 1.5, fatigue: 0.8, morale: 0, form: 0 },
  "Motoryka": { readiness: 0.8, fatigue: 3.5, morale: -0.2, form: 0.2 },
  "Taktyka": { readiness: 1.5, fatigue: 1, morale: 0, form: 0 },
  "Finalizacja": { readiness: 0.8, fatigue: 1.7, morale: 0.2, form: 0.7 },
  "Pressing": { readiness: 1, fatigue: 2.4, morale: 0, form: 0.6 },
  "Atmosfera": { readiness: 0.4, fatigue: 0.2, morale: 1.5, form: 0 },
  "Rozwój młodych": { readiness: 0.5, fatigue: 0.8, morale: 0.2, form: 0.7 },
  "Stałe fragmenty": { readiness: 1.2, fatigue: 0.8, morale: 0, form: 0.2 },
};

const INTENSITY_MULTIPLIER = { Niska: 0.65, Normalna: 1, Wysoka: 1.35 };

export function evaluateMicrocycle(sessions = []) {
  let readinessGain = 0; let fatigueDelta = 0; let moraleDelta = 0; let formDelta = 0; let youthFormDelta = 0; let load = 0;
  for (const session of sessions) {
    const effect = TRAINING_FOCUS_EFFECTS[session.focus] ?? TRAINING_FOCUS_EFFECTS.Taktyka;
    const intensity = session.focus === "Regeneracja" && session.intensity === "Wysoka" ? "Normalna" : session.intensity;
    const multiplier = INTENSITY_MULTIPLIER[intensity] ?? 1;
    readinessGain += effect.readiness * multiplier;
    fatigueDelta += effect.fatigue * multiplier;
    moraleDelta += effect.morale * multiplier;
    if (session.focus === "Rozwój młodych") youthFormDelta += effect.form * multiplier;
    else formDelta += effect.form * multiplier;
    load += intensity === "Wysoka" ? 3 : intensity === "Niska" ? 1 : 2;
  }
  const averageLoad = sessions.length ? load / sessions.length : 2;
  const risk = averageLoad >= 2.55 || fatigueDelta >= 10 ? "wysokie" : averageLoad >= 2.15 || fatigueDelta >= 6 ? "podwyższone" : fatigueDelta <= 1 ? "niskie" : "umiarkowane";
  return {
    readinessGain: Math.round(readinessGain),
    fatigueDelta: Math.round(fatigueDelta),
    moraleDelta: Math.round(moraleDelta),
    formDelta: Math.round(formDelta),
    youthFormDelta: Math.round(youthFormDelta),
    averageIntensity: averageLoad >= 2.45 ? "Wysoka" : averageLoad <= 1.45 ? "Niska" : "Normalna",
    hasRecovery: sessions.some((session) => session.focus === "Regeneracja"),
    risk,
  };
}

export function environmentIncidentOccurs(roll, risk) {
  return clamp(roll, 0, 0.999999) < clamp(risk, 0, 1);
}

export function weeklyBurnoutDelta({ result, intensity, recovery, policyBurnout, pressure, profile }) {
  const resultLoad = result === "loss" ? 2 : result === "win" ? -1 : 0;
  const trainingLoad = intensity === "Wysoka" ? 2 : intensity === "Niska" ? -1 : 0;
  const recoveryRelief = recovery ? -1 : 0;
  const pressureLoad = pressure >= 75 ? 2 : pressure >= 55 ? 1 : 0;
  const profileLoad = profile === "Trener od zapierdolu" || profile === "Taktyczny obsesyjny" ? 1 : profile === "Spokojny pragmatyk" ? -1 : 0;
  return clamp(Math.round((resultLoad + trainingLoad + recoveryRelief + policyBurnout + pressureLoad + profileLoad - 1) * .5), -3, 3);
}

export function burnoutMatchPenalty(burnout) {
  return burnout <= 35 ? 0 : Number(clamp((burnout - 35) / 12, 0, 5).toFixed(2));
}

export function conditionFromFatigue(fatigue) {
  return Math.round(clamp(100 - fatigue, 0, 100));
}

// Smooth interpolation keeps adjacent condition values free of artificial cliffs.
function conditionCurve(condition, anchors) {
  const value = clamp(condition, 0, 100);
  for (let i = 1; i < anchors.length; i++) {
    const [low, lowValue] = anchors[i - 1]; const [high, highValue] = anchors[i];
    if (value <= high) return lowValue + (highValue - lowValue) * (value - low) / (high - low);
  }
  return anchors.at(-1)[1];
}

export function conditionStatus(condition) {
  const value = clamp(Math.round(condition), 0, 100);
  return value >= 90 ? "Świeży" : value >= 80 ? "Gotowy" : value >= 70 ? "Obciążony" : value >= 60 ? "Zmęczony" : value >= 50 ? "Bardzo zmęczony" : "Skrajnie zmęczony";
}

export function playingEnvironment(tier = 9) {
  return tier <= 3 ? { label: "Profesjonalne", matchFatigue: 10, comfortableCondition: 82 }
    : tier <= 6 ? { label: "Półprofesjonalne", matchFatigue: 12, comfortableCondition: 78 }
    : { label: "Amatorskie", matchFatigue: 14, comfortableCondition: 74 };
}

export function conditionAdvice(condition, tier = 9) {
  if (condition < 60) return "Duży spadek możliwości i zwiększone ryzyko urazu. Rozważ odpoczynek lub zastępstwo.";
  if (condition < playingEnvironment(tier).comfortableCondition) return "Poniżej komfortowej gotowości do XI w tym środowisku. Występ pozostaje możliwy.";
  return "Komfortowo gotowy do XI w tym środowisku.";
}

export function injuryRiskFromFatigue(fatigue, intensity = "Normalna") {
  const risk = conditionCurve(conditionFromFatigue(fatigue), [[0,.16],[30,.12],[50,.07],[60,.04],[70,.022],[80,.012],[90,.005],[100,.003]]);
  const loadBonus = intensity === "Wysoka" ? .015 : intensity === "Niska" ? -.002 : 0;
  return Number(clamp(risk + loadBonus, .002, .18).toFixed(4));
}

export function goalSatisfied(goalId, context) {
  if (goalId === "tactics") return context.readiness >= 72;
  if (goalId === "motivation") return context.averageMorale >= 68;
  if (goalId === "people") return Boolean(context.positiveDecision);
  if (goalId === "analysis") return Boolean(context.analysisAttempted && context.analysisImproved);
  if (goalId === "pressure") return context.preMatchPressure >= 45 && context.result !== "loss";
  if (goalId === "adaptability") return Boolean(context.newPointFormation);
  if (goalId === "youth") return Boolean(context.newYouthStarter);
  if (goalId === "reputation") return context.result === "win";
  return false;
}

export function resolveProfileScores(profiles, questions, answers) {
  const scores = Object.fromEntries(profiles.map((profile) => [profile, 0]));
  for (const question of questions) {
    const choice = question.choices[answers[question.id]];
    if (!choice) continue;
    for (const [profile, points] of Object.entries(choice.scores)) if (profile in scores) scores[profile] += points ?? 0;
  }
  return profiles.reduce((best, profile) => scores[profile] > scores[best] ? profile : best, profiles[0]);
}

export function rngNext(seed) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: (seed + 0x6d2b79f5) >>> 0 };
}

export function normalizeSlot(slot) {
  if (slot.startsWith("ŚO")) return "ŚO";
  if (slot.startsWith("ŚP")) return "ŚP";
  if (slot.startsWith("DP")) return "DP";
  if (slot.startsWith("N")) return "N";
  return slot;
}

export function positionPenalty(player, slot) {
  const target = normalizeSlot(slot);
  if (player.primary === target) return 0;
  if (player.secondary.includes(target)) return 0.04;
  if (player.primary === "BR" || target === "BR") return 0.45;
  if (POSITION_GROUPS.defence.includes(player.primary) && POSITION_GROUPS.defence.includes(target)) return 0.09;
  if (POSITION_GROUPS.midfield.includes(player.primary) && POSITION_GROUPS.midfield.includes(target)) return 0.07;
  if (POSITION_GROUPS.attack.includes(player.primary) && POSITION_GROUPS.attack.includes(target)) return 0.08;
  return 0.2;
}

export function liveBreakdown(player) {
  const form = (player.form - 50) * 0.0015;
  const morale = (player.morale - 50) * 0.0012;
  const relation = (player.relation - 50) * 0.0004;
  const fatigue = -conditionCurve(conditionFromFatigue(player.fatigue), [[0,.55],[30,.40],[50,.25],[60,.14],[70,.065],[80,.02],[90,0],[100,0]]);
  return { form, morale, relation, fatigue, total: clamp(form + morale + relation + fatigue, -0.6, 0.14) };
}

export function liveOVR(player) {
  return Math.max(1, Math.round(player.baseOVR * (1 + liveBreakdown(player).total)));
}

export function effectiveOVR(player, slot) {
  if ((player.injuryWeeks ?? 0) > 0 || (player.absenceRounds ?? 0) > 0) return 1;
  return Math.max(1, Math.round(liveOVR(player) * (1 - positionPenalty(player, slot))));
}

export function playerAvailable(player) {
  return (player.injuryWeeks ?? 0) <= 0 && (player.absenceRounds ?? 0) <= 0;
}

function lineupPlanScore(player, slot, planId) {
  const live = liveOVR(player);
  const condition = conditionFromFatigue(player.fatigue ?? 0);
  const form = player.form ?? 50;
  const morale = player.morale ?? 50;
  const age = player.age ?? 26;
  let score = live;
  if (planId === "FORM") score += (form - 50) * .16 + (morale - 50) * .05;
  if (planId === "ROTATION") score += condition * .055 - Math.max(0, 78 - condition) * .13;
  if (planId === "YOUTH") score += age <= 21 ? 7.5 + (22 - age) * .3 : age <= 23 ? 2 : 0;
  if (planId === "FRESH" || planId === "PRESS") score += condition * .075 - Math.max(0, 74 - condition) * .18;
  if (planId === "EXPERIENCE") score += age >= 29 ? Math.min(5, (age - 27) * .55) : -Math.max(0, 25 - age) * .35;
  if (planId === "LOW_BLOCK" && POSITION_GROUPS.defence.includes(normalizeSlot(slot))) score += 2;
  if (planId === "COUNTER" && POSITION_GROUPS.attack.includes(normalizeSlot(slot))) score += condition * .035;
  if (planId === "POSSESSION" && POSITION_GROUPS.midfield.includes(normalizeSlot(slot))) score += (form + morale - 100) * .06;
  return score * (1 - positionPenalty(player, slot));
}

// Describes applied selection criteria, not a claim about a single decisive cause.
export function lineupSelectionReason(player, slot, planId) {
  const penalty = positionPenalty(player, slot);
  const criteria = ["bieżąca dyspozycja (jakość, forma, morale, relacja i zmęczenie)"];
  const condition = conditionFromFatigue(player.fatigue ?? 0);
  if (planId === "FORM") criteria.push("dodatkowe znaczenie formy i morale");
  if (["ROTATION", "FRESH", "PRESS"].includes(planId)) criteria.push(`priorytet kondycji (${condition}%)`);
  if (planId === "YOUTH" && (player.age ?? 26) <= 23) criteria.push((player.age ?? 26) <= 21 ? "premia za wiek U21" : "premia za wiek do 23 lat");
  if (planId === "EXPERIENCE" && (player.age ?? 26) >= 29) criteria.push("premia za doświadczenie wynikające z wieku");
  if (planId === "EXPERIENCE" && (player.age ?? 26) < 25) criteria.push("wiek poniżej 25 lat obniża priorytet w tym planie");
  if (planId === "LOW_BLOCK" && POSITION_GROUPS.defence.includes(normalizeSlot(slot))) criteria.push("priorytet obsady obrony");
  if (planId === "COUNTER" && POSITION_GROUPS.attack.includes(normalizeSlot(slot))) criteria.push(`kondycja w ataku (${condition}%)`);
  if (planId === "POSSESSION" && POSITION_GROUPS.midfield.includes(normalizeSlot(slot))) criteria.push("dodatkowe znaczenie formy i morale w środku pola");
  const position = penalty === 0 ? "Naturalna pozycja ma pierwszeństwo." : "Obsada poza naturalną pozycją obniża ocenę; sztab najpierw szuka najmniejszego niedopasowania.";
  return `${position} Kryteria: ${criteria.join("; ")}. Wybór łączy te elementy i zależy też od obsady pozostałych pozycji.`;
}

export function selectLineupForPlan(players, slots, planId = "STRONGEST") {
  const assignments = {};
  const used = new Set();
  const orderedSlots = [...slots].sort((a, b) => {
    const exactA = players.filter((p) => playerAvailable(p) && positionPenalty(p, a) === 0).length;
    const exactB = players.filter((p) => playerAvailable(p) && positionPenalty(p, b) === 0).length;
    return exactA - exactB;
  });
  for (const slot of orderedSlots) {
    const player = players
      .filter((candidate) => !used.has(candidate.id) && playerAvailable(candidate))
      .sort((a, b) => positionPenalty(a, slot) - positionPenalty(b, slot) || lineupPlanScore(b, slot, planId) - lineupPlanScore(a, slot, planId))[0];
    if (player) {
      assignments[slot] = player.id;
      used.add(player.id);
    }
  }
  return assignments;
}

export function selectBestLineup(players, slots) {
  return selectLineupForPlan(players, slots, "STRONGEST");
}

function isoAtUtc(value) {
  return new Date(`${value}T12:00:00Z`);
}

function plusDays(value, days) {
  const date = isoAtUtc(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function roundDates(count, start, end) {
  if (count <= 1) return [start];
  const spanWeeks = Math.round((isoAtUtc(end).getTime() - isoAtUtc(start).getTime()) / 604800000);
  return Array.from({ length: count }, (_, index) => plusDays(start, Math.round(index * spanWeeks / (count - 1)) * 7));
}

export function seasonRoundDates(roundCount, startYear = 2026, tier = 9) {
  const firstLegRounds = Math.ceil(roundCount / 2);
  const secondLegRounds = roundCount - firstLegRounds;
  const professional = tier <= 4;
  const autumnStart = tier <= 2 ? `${startYear}-07-18` : tier <= 4 ? `${startYear}-08-01` : `${startYear}-08-08`;
  const autumnEnd = professional ? `${startYear}-12-05` : `${startYear}-11-21`;
  const springStart = tier <= 2 ? `${startYear + 1}-02-20` : tier <= 4 ? `${startYear + 1}-02-27` : `${startYear + 1}-03-06`;
  const springEnd = professional ? `${startYear + 1}-05-29` : `${startYear + 1}-06-12`;
  return [...roundDates(firstLegRounds, autumnStart, autumnEnd), ...roundDates(secondLegRounds, springStart, springEnd)];
}

export function buildSchedule(teamIds, startYear = 2026, tier = 9) {
  const teams = [...teamIds];
  if (teams.length % 2) teams.push("bye");
  const firstLeg = [];
  const rotation = [...teams];
  for (let round = 1; round < teams.length; round += 1) {
    for (let index = 0; index < teams.length / 2; index += 1) {
      const home = rotation[index];
      const away = rotation[rotation.length - 1 - index];
      if (home !== "bye" && away !== "bye") firstLeg.push({ round, home: round % 2 ? home : away, away: round % 2 ? away : home, played: false });
    }
    rotation.splice(1, 0, rotation.pop());
  }
  const offset = teams.length - 1;
  const fixtures = [...firstLeg, ...firstLeg.map((fixture) => ({ ...fixture, round: fixture.round + offset, home: fixture.away, away: fixture.home }))];
  const dates = seasonRoundDates(offset * 2, startYear, tier);
  return fixtures.map((fixture) => ({ ...fixture, date: dates[fixture.round - 1] }));
}

export function winterBreakDays(fixtures) {
  const rounds = Math.max(0, ...fixtures.map((fixture) => fixture.round));
  const firstSpringRound = Math.ceil(rounds / 2) + 1;
  const autumn = fixtures.find((fixture) => fixture.round === firstSpringRound - 1)?.date;
  const spring = fixtures.find((fixture) => fixture.round === firstSpringRound)?.date;
  if (!autumn || !spring) return 0;
  return Math.round((isoAtUtc(spring).getTime() - isoAtUtc(autumn).getTime()) / 86400000);
}

export function offseasonBaseChange(player, roll) {
  if (player.age <= 20 && player.baseOVR < player.potential) return roll < 0.18 ? 2 : 1;
  if (player.age <= 24 && player.baseOVR < player.potential) return roll < 0.58 ? 1 : 0;
  if (player.age <= 29) return roll < 0.12 && player.baseOVR < player.potential ? 1 : 0;
  if (player.age <= 32) return roll < 0.35 ? -1 : 0;
  if (player.age <= 35) return roll < 0.72 ? -1 : 0;
  return roll < 0.45 ? -2 : -1;
}

export function shouldRetirePlayer(age, roll) {
  if (age < 36) return false;
  if (age === 36) return roll < 0.08;
  if (age === 37) return roll < 0.25;
  if (age === 38) return roll < 0.58;
  return true;
}

export function offseasonBurnout(burnout) {
  return Math.max(0, Math.round(burnout * 0.55 - 8));
}

export function dismissalProbability({ place, teamCount, boardPressure, patience, unpredictability }) {
  const positionLoad = place >= teamCount - 1 ? 0.34 : place > Math.ceil(teamCount * 0.7) ? 0.16 : place <= Math.ceil(teamCount * 0.4) ? -0.12 : 0;
  return clamp(0.04 + positionLoad + boardPressure / 250 + (50 - patience) / 220 + unpredictability / 650, 0.02, 0.86);
}

export function updateTeamResult(teams, home, away, homeGoals, awayGoals) {
  return teams.map((team) => {
    if (team.id !== home && team.id !== away) return team;
    const isHome = team.id === home;
    const goalsFor = isHome ? homeGoals : awayGoals;
    const goalsAgainst = isHome ? awayGoals : homeGoals;
    const result = goalsFor > goalsAgainst ? "W" : goalsFor === goalsAgainst ? "R" : "P";
    const formDelta = result === "W" ? 4 : result === "P" ? -3 : 1;
    const moraleDelta = result === "W" ? 3 : result === "P" ? -2 : 0;
    return {
      ...team,
      played: team.played + 1,
      won: team.won + (goalsFor > goalsAgainst ? 1 : 0),
      drawn: team.drawn + (goalsFor === goalsAgainst ? 1 : 0),
      lost: team.lost + (goalsFor < goalsAgainst ? 1 : 0),
      gf: team.gf + goalsFor,
      ga: team.ga + goalsAgainst,
      points: team.points + (goalsFor > goalsAgainst ? 3 : goalsFor === goalsAgainst ? 1 : 0),
      form: clamp((team.form ?? 50) * 0.82 + (50 + formDelta) * 0.18, 25, 75),
      morale: clamp((team.morale ?? 55) + moraleDelta, 20, 85),
      fatigue: clamp((team.fatigue ?? 18) + 2, 0, 75),
      lastFive: [result, ...(team.lastFive ?? [])].slice(0, 5),
    };
  });
}

export function sortedTable(teams) {
  return [...teams].sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.name.localeCompare(b.name, "pl"));
}

export function simulateMatchPlan(seed, homeStrength, awayStrength, homeName = "Gospodarze", awayName = "Goście") {
  const startSeed = seed >>> 0;
  const difference = clamp(homeStrength - awayStrength, -24, 24);
  const homeXg = clamp(1.32 + 0.045 * difference + 0.2, 0.28, 3.25);
  const awayXg = clamp(1.2 - 0.045 * difference, 0.24, 3.05);
  const expected = expectedOutcomeProbabilities(homeXg, awayXg);
  const events = [];
  let homeGoals = 0;
  let awayGoals = 0;
  let shotsHome = 0;
  let shotsAway = 0;
  let nextSeed = seed >>> 0;

  for (let minute = 3; minute <= 90; minute += 3) {
    let roll = rngNext(nextSeed); nextSeed = roll.seed;
    const homeShotRate = clamp(0.22 + difference * 0.0015, 0.17, 0.27);
    if (roll.value < homeShotRate) {
      shotsHome += 1;
      const finish = rngNext(nextSeed); nextSeed = finish.seed;
      if (finish.value < homeXg / (30 * homeShotRate)) {
        homeGoals += 1;
        events.push({ minute, text: matchPhrase("goal", "home", `${startSeed}-${minute}-hg`, homeName), kind: "goal", side: "home" });
      } else events.push({ minute, text: matchPhrase("chance", "home", `${startSeed}-${minute}-hc`, homeName), kind: "chance", side: "home" });
    }

    roll = rngNext(nextSeed); nextSeed = roll.seed;
    const awayShotRate = clamp(0.205 - difference * 0.0012, 0.16, 0.255);
    if (roll.value < awayShotRate) {
      shotsAway += 1;
      const finish = rngNext(nextSeed); nextSeed = finish.seed;
      if (finish.value < awayXg / (30 * awayShotRate)) {
        awayGoals += 1;
        events.push({ minute: Math.min(90, minute + 1), text: matchPhrase("goal", "away", `${startSeed}-${minute}-ag`, awayName), kind: "goal", side: "away" });
      } else events.push({ minute: Math.min(90, minute + 1), text: matchPhrase("chance", "away", `${startSeed}-${minute}-ac`, awayName), kind: "chance", side: "away" });
    }

    roll = rngNext(nextSeed); nextSeed = roll.seed;
    if (roll.value > 0.977) events.push({ minute: Math.min(90, minute + 2), text: matchPhrase("card", "neutral", `${startSeed}-${minute}-card`), kind: "card", side: roll.value > 0.988 ? "away" : "home" });
    if (minute % 15 === 0) {
      roll = rngNext(nextSeed); nextSeed = roll.seed;
      if (roll.value < 0.64) events.push({ minute, text: matchPhrase("info", "neutral", `${startSeed}-${minute}-flow`), kind: "info", side: "neutral" });
    }
  }

  if (!events.length) events.push({ minute: 12, text: matchPhrase("info", "neutral", `${startSeed}-quiet`), kind: "info", side: "neutral" });
  events.sort((a, b) => a.minute - b.minute);
  return {
    seed: nextSeed,
    events,
    homeGoals,
    awayGoals,
    shotsHome,
    shotsAway,
    possessionHome: Math.round(clamp(51.5 + difference * 0.55, 35, 65)),
    homeXg,
    awayXg,
    expected,
  };
}

function poisson(lambda, goals) {
  let factorial = 1;
  for (let value = 2; value <= goals; value += 1) factorial *= value;
  return Math.exp(-lambda) * Math.pow(lambda, goals) / factorial;
}

export function expectedOutcomeProbabilities(homeXg, awayXg) {
  let home = 0; let draw = 0; let away = 0;
  for (let hg = 0; hg <= 9; hg += 1) for (let ag = 0; ag <= 9; ag += 1) {
    const probability = poisson(homeXg, hg) * poisson(awayXg, ag);
    if (hg > ag) home += probability;
    else if (hg === ag) draw += probability;
    else away += probability;
  }
  const total = home + draw + away;
  return { home: home / total, draw: draw / total, away: away / total };
}

export function diagnoseMatchOutcome({ result, readiness, expectedWin, expectedLoss, userGoals, opponentGoals, userXg, opponentXg, userShots, opponentShots }) {
  if (result === "loss" && opponentGoals - opponentXg >= 1.35) return "Rywal był ponadprzeciętnie skuteczny względem jakości swoich sytuacji.";
  if (result === "loss" && userXg - userGoals >= 0.9) return "Największym problemem była nieskuteczność względem wypracowanych sytuacji.";
  if (opponentShots >= userShots + 3) return "Rywal częściej dochodził do strzału; problemem była kontrola i tworzenie sytuacji.";
  if (readiness < 55) return "Niska gotowość wyraźnie ograniczyła wykonanie planu meczowego.";
  if (result === "loss" && expectedWin > expectedLoss) return "To statystyczna niespodzianka: przewaga przedmeczowa nie gwarantowała wyniku.";
  if (result === "win" && expectedLoss > expectedWin) return "Zespół wygrał mimo roli słabszego dzięki realizacji sytuacji i przebiegowi meczu.";
  if (result === "draw") return "Remis odpowiada meczowi, w którym żadna strona nie zbudowała rozstrzygającej przewagi.";
  return result === "win" ? "Przewaga jakości została przełożona na wynik." : "Rywal wykorzystał swoją przedmeczową przewagę.";
}
