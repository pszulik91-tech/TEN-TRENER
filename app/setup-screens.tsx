"use client";
import { ThemeButton } from "./theme-studio";

import { BadgeCheck, ChevronRight, Play, Save, Target } from "lucide-react";
import { useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { BUILD, coachingExperienceEligibility, DATABASE_STATS, DEVELOPMENT_GOALS, environmentForPack, highestEligibleCoachingExperience, highestEligibleStartingLicense, LICENSE_CHALLENGES, LICENSES, PROFILE_NOTE, PSYCH_QUESTIONS, resolveCoachProfile, startingLicenseEligibility } from "./game-data";
import type { CoachProfile, LeaguePack, License } from "./game-data";

export type CoachDraft = { name: string; age: number; region: string; playingExperience: string; coachingExperience: string; profile: CoachProfile; license: License; psychAnswers: Record<string, number> };
const COACH_REGIONS = ["Dolnośląskie", "Kujawsko-pomorskie", "Lubelskie", "Lubuskie", "Łódzkie", "Małopolskie", "Mazowieckie", "Opolskie", "Podkarpackie", "Podlaskie", "Pomorskie", "Śląskie", "Świętokrzyskie", "Warmińsko-mazurskie", "Wielkopolskie", "Zachodniopomorskie"];
type ClubPickerProps = {
  draft: CoachDraft; competitionOptions: { competition: string; available: boolean; required: string }[]; associations: string[]; districts: string[]; packs: LeaguePack[]; pack?: LeaguePack;
  selectedCompetition: string; selectedAssociation: string; selectedDistrict: string; selectedPackId: string; selectedClub: string;
  onCompetition: (value: string) => void; onAssociation: (value: string) => void; onDistrict: (value: string) => void; onPack: (value: string) => void;
  onClub: (value: string) => void; onBack: () => void; onNext: () => void;
};

export function StartScreen({ hasSave, onNew, onLoad }: { hasSave: boolean; onNew: () => void; onLoad: () => void }) {
  return <main className="start-screen min-h-dvh"><div className="stadium-grid" /><section className="start-panel"><div className="brand-mark"><span>TT</span></div><div><p className="eyebrow">POLSKA • SEZON 2026/27</p><h1>TEN<br /><em>TRENER</em></h1><p className="start-copy">Nie budujesz klubu. Budujesz własne nazwisko — od błotnistej B-klasy po europejskie wieczory.</p></div><div className="start-actions"><ThemeButton /><Button className="primary-cta" size="lg" onClick={onNew}><Play /> Nowa kariera</Button><Button className="secondary-cta" variant="outline" size="lg" disabled={!hasSave} onClick={onLoad}><Save /> Wczytaj zapis</Button></div><div className="build-row"><span className="live-dot" /> {BUILD} <span>•</span> zapis lokalny</div></section></main>;
}

export function Creator({ draft, setDraft, onNext, onBack }: { draft: CoachDraft; setDraft: Dispatch<SetStateAction<CoachDraft>>; onNext: () => void; onBack: () => void }) {
  const firstMissing = PSYCH_QUESTIONS.findIndex((question) => draft.psychAnswers[question.id] === undefined);
  const [questionIndex, setQuestionIndex] = useState(firstMissing < 0 ? PSYCH_QUESTIONS.length - 1 : firstMissing);
  const update = (key: keyof CoachDraft, value: CoachDraft[keyof CoachDraft]) => setDraft((current) => {
    const next = { ...current, [key]: value } as CoachDraft;
    if (["age", "playingExperience"].includes(key) && !coachingExperienceEligibility(next.age, next.playingExperience, next.coachingExperience).eligible) next.coachingExperience = highestEligibleCoachingExperience(next.age, next.playingExperience);
    if (["age", "playingExperience", "coachingExperience"].includes(key) && !startingLicenseEligibility(next.license, next.playingExperience, next.coachingExperience, next.age).eligible) next.license = highestEligibleStartingLicense(next.playingExperience, next.coachingExperience, next.age);
    return next;
  });
  const answerCount = PSYCH_QUESTIONS.filter((question) => draft.psychAnswers[question.id] !== undefined).length;
  const questionnaireDone = answerCount === PSYCH_QUESTIONS.length;
  const question = PSYCH_QUESTIONS[questionIndex];
  const chooseAnswer = (choiceIndex: number) => {
    setDraft((current) => {
      const psychAnswers = { ...current.psychAnswers, [question.id]: choiceIndex };
      return { ...current, psychAnswers, profile: resolveCoachProfile(psychAnswers) };
    });
    if (questionIndex < PSYCH_QUESTIONS.length - 1) setQuestionIndex(questionIndex + 1);
  };
  return <SetupShell step="1 / 3" title="Kim jesteś, trenerze?" subtitle="Twoja przeszłość otwiera drzwi. Licencja ustala poziom wejścia i cenę oczekiwań." onBack={onBack}>
    <div className="form-grid">
      <label className="field wide"><span>Imię i nazwisko</span><input value={draft.name} onChange={(e) => update("name", e.target.value)} /></label>
      <div className="field"><span>Wiek startowy</span><div className="age-stepper"><button aria-label="Zmniejsz wiek" disabled={draft.age <= 30} onClick={() => update("age", draft.age - 1)}>−</button><output aria-label="Wiek trenera">{draft.age}</output><button aria-label="Zwiększ wiek" disabled={draft.age >= 45} onClick={() => update("age", draft.age + 1)}>+</button></div><small>Zakres 30–45 lat. Przyciski nie otwierają klawiatury telefonu.</small></div>
      <label className="field"><span>Region</span><NativeSelect value={draft.region} onChange={(e) => update("region", e.target.value)} className="w-full">{COACH_REGIONS.map((region) => <NativeSelectOption key={region}>{region}</NativeSelectOption>)}</NativeSelect></label>
      <label className="field"><span>Doświadczenie zawodnicze</span><NativeSelect value={draft.playingExperience} onChange={(e) => update("playingExperience", e.target.value)} className="w-full"><NativeSelectOption>Brak</NativeSelectOption><NativeSelectOption>Amator</NativeSelectOption><NativeSelectOption>Niższe ligi</NativeSelectOption><NativeSelectOption>Zawodowiec</NativeSelectOption><NativeSelectOption>Reprezentant</NativeSelectOption></NativeSelect></label>
      <label className="field"><span>Doświadczenie trenerskie</span><NativeSelect value={draft.coachingExperience} onChange={(e) => update("coachingExperience", e.target.value)} className="w-full">{["Debiutant", "1–3 lata", "4–10 lat", "Ponad 10 lat"].map((experience) => { const eligibility = coachingExperienceEligibility(draft.age, draft.playingExperience, experience); const label = experience === "4–10 lat" && eligibility.eligible && eligibility.availableYears < 10 ? `4–${eligibility.availableYears} lat (maksimum dla życiorysu)` : experience; return <NativeSelectOption disabled={!eligibility.eligible} key={experience} value={experience}>{label}{!eligibility.eligible ? " — niemożliwe w tym życiorysie" : ""}</NativeSelectOption>; })}</NativeSelect><small>{coachingExperienceEligibility(draft.age, draft.playingExperience, draft.coachingExperience).reason}</small></label>
    </div>
    <div className="section-label">Licencja startowa • wybór poziomu wyzwania</div>
    <div className="license-choice-grid">{LICENSES.map((license) => { const challenge = LICENSE_CHALLENGES[license]; const eligibility = startingLicenseEligibility(license, draft.playingExperience, draft.coachingExperience, draft.age); return <button disabled={!eligibility.eligible} key={license} className={`license-choice ${draft.license === license ? "selected" : ""} ${!eligibility.eligible ? "locked" : ""}`} onClick={() => update("license", license)}><span>{license}</span><strong>{eligibility.eligible ? challenge.label : "Niedostępna dla tego życiorysu"}</strong><p>{eligibility.eligible ? challenge.description : eligibility.reason}</p><small>{eligibility.eligible ? `Presja wynikowa ×${challenge.pressureMultiplier.toFixed(2)} • reputacja +${challenge.reputationBonus}` : "Wiek, przeszłość zawodnicza i lata pracy muszą tworzyć możliwą historię."}</small></button>; })}</div>
    <p className="setup-note">Grassroots C jest podstawowym początkiem kariery. Wyższa licencja otwiera wyższe ligi, ale zwiększa oczekiwania, presję i koszt błędów od pierwszego dnia.</p>
    <div className="section-label">Ankieta profilu psychologicznego • {answerCount} / {PSYCH_QUESTIONS.length}</div>
    <section className="psych-test">
      <div className="psych-progress"><span style={{ width: `${(answerCount / PSYCH_QUESTIONS.length) * 100}%` }} /></div>
      <small>SYTUACJA {questionIndex + 1}</small><p>{question.context}</p><h2>{question.question}</h2>
      <div className="psych-answers">{question.choices.map((choice, index) => <button key={choice.label} className={draft.psychAnswers[question.id] === index ? "selected" : ""} onClick={() => chooseAnswer(index)}><b>{String.fromCharCode(65 + index)}</b><span>{choice.label}</span></button>)}</div>
      <div className="psych-navigation"><Button variant="ghost" disabled={questionIndex === 0} onClick={() => setQuestionIndex(questionIndex - 1)}>Poprzednia</Button><span>{questionIndex + 1} / {PSYCH_QUESTIONS.length}</span><Button variant="ghost" disabled={questionIndex === PSYCH_QUESTIONS.length - 1 || draft.psychAnswers[question.id] === undefined} onClick={() => setQuestionIndex(questionIndex + 1)}>Następna</Button></div>
      {questionnaireDone && <div className="profile-result"><BadgeCheck /><span><small>PROFIL PRZYDZIELONY Z ODPOWIEDZI</small><strong>{draft.profile}</strong><p>{PROFILE_NOTE[draft.profile]}</p></span></div>}
    </section>
    <div className="setup-footer"><Button variant="ghost" onClick={onBack}>Wstecz</Button><Button size="lg" disabled={draft.name.trim().length < 3 || draft.age < 30 || draft.age > 45 || !questionnaireDone} onClick={onNext}>Wybierz klub <ChevronRight /></Button></div>
  </SetupShell>;
}

export function ClubPicker(props: ClubPickerProps) {
  const { draft, competitionOptions, selectedCompetition, associations, districts, packs, pack, selectedAssociation, selectedDistrict, selectedPackId, selectedClub, onCompetition, onAssociation, onDistrict, onPack, onClub, onBack, onNext } = props;
  const environment = pack ? environmentForPack(pack) : undefined;
  return <SetupShell step="2 / 3" title="Pierwsza szatnia" subtitle={`Najpierw wybierz szczebel, potem organizatora i prawdziwą grupę. Licencja ${draft.license} blokuje niedostępne poziomy, ale ich nie ukrywa.`} onBack={onBack}><div className="league-path" aria-label="Ścieżka wyboru rozgrywek"><span>1. Szczebel</span><b>›</b><span>2. Organizator</span><b>›</b>{districts.length > 0 && <><span>3. Okręg</span><b>›</b></>}<span>{districts.length > 0 ? "4" : "3"}. Grupa</span><b>›</b><span>Klub</span></div><div className="cascade"><label className="field"><span>1. Szczebel rozgrywek</span><NativeSelect value={selectedCompetition} onChange={(e) => onCompetition(e.target.value)} className="w-full">{competitionOptions.map((option) => <NativeSelectOption disabled={!option.available} key={option.competition} value={option.competition}>{option.competition}{option.available ? "" : ` — wymaga ${option.required}`}</NativeSelectOption>)}</NativeSelect></label><label className="field"><span>2. Organizator</span><NativeSelect value={selectedAssociation} onChange={(e) => onAssociation(e.target.value)} className="w-full">{associations.map((association: string) => <NativeSelectOption key={association}>{association}</NativeSelectOption>)}</NativeSelect></label>{districts.length > 0 && <label className="field"><span>3. Okręg / podokręg</span><NativeSelect value={selectedDistrict} onChange={(e) => onDistrict(e.target.value)} className="w-full">{districts.map((district: string) => <NativeSelectOption key={district}>{district}</NativeSelectOption>)}</NativeSelect></label>}<label className="field"><span>{districts.length > 0 ? "4" : "3"}. Grupa rozgrywkowa</span><NativeSelect value={selectedPackId} onChange={(e) => onPack(e.target.value)} className="w-full">{packs.map((item: LeaguePack) => <NativeSelectOption key={item.id} value={item.id}>{item.group}</NativeSelectOption>)}</NativeSelect></label></div><p className="structure-note"><b>Katalog startowy 2026/27:</b> {DATABASE_STATS.groups} grup • {DATABASE_STATS.teams} drużyn w grupach • {DATABASE_STATS.associations} WZPN. Tutaj pasuje {packs.length} {packs.length === 1 ? "grupa" : "grup"}. „Poziom” jest liczony dla wybranej struktury wojewódzkiej, a nie narzucony jednakowo całej Polsce.</p>{pack && <><div className="league-strip"><div><span>Poziom</span><strong>{pack.tier}</strong></div><div><span>Organizator</span><strong>{pack.association}</strong></div><div><span>Grupa</span><strong>{pack.group}</strong></div><div><span>Drużyn</span><strong>{pack.teams.length}</strong></div></div>{environment && <section className="environment-preview"><div><small>CODZIENNOŚĆ TRENERA</small><h3>{environment.label} • {environment.status}</h3><p>{environment.work}</p></div><div className="environment-columns"><span><b>PLUSY</b>{environment.positives.map((item) => <small key={item}>+ {item}</small>)}</span><span><b>RYZYKA</b>{environment.risks.map((item) => <small key={item}>− {item}</small>)}</span></div><footer><span>{environment.trainingSessions} sesji treningowych / tydzień</span><span>limit gotowości {environment.readinessCap}%</span></footer></section>}<div className="section-label">Wybierz klub</div><div className="club-grid">{pack.teams.map((team: string, index: number) => <button key={team} className={`club-card ${selectedClub === team ? "selected" : ""}`} onClick={() => onClub(team)}><span className="club-crest">{team.split(" ").map((word) => word[0]).join("").slice(0, 3)}</span><span><strong>{team}</strong><small>{index % 4 === 0 ? "Cel: górna połowa" : index % 4 === 1 ? "Cel: spokojne utrzymanie" : index % 4 === 2 ? "Cel: walka o awans" : "Cel: rozwój zespołu"}</small></span>{selectedClub === team && <BadgeCheck />}</button>)}</div>{pack.source && <p className="source-note">Dane startowe: {pack.source}. Po rozpoczęciu gry powstaje niezależny snapshot kariery.</p>}</>}<div className="setup-footer"><Button variant="ghost" onClick={onBack}>Wstecz</Button><Button size="lg" disabled={!selectedClub} onClick={onNext}>Cele sezonu <ChevronRight /></Button></div></SetupShell>;
}

export function GoalPicker({ selected, setSelected, season, onBack, onConfirm }: { selected: string[]; setSelected: (items: string[]) => void; season: string; onBack: () => void; onConfirm: () => void }) {
  const toggle = (id: string) => setSelected(selected.includes(id) ? selected.filter((item) => item !== id) : selected.length < 2 ? [...selected, id] : [selected[1], id]);
  return <SetupShell step="3 / 3" title="Wybierz dokładnie 2 cele" subtitle={`Sezon ${season}. Cele będą oceniane zimą i po ostatniej kolejce — samo kliknięcie niczego nie zalicza.`} onBack={onBack}><div className="goal-counter"><Target /><strong>{selected.length} / 2</strong><span>wybrane obszary rozwoju</span></div><div className="goals-grid">{DEVELOPMENT_GOALS.map((goal, index) => <button key={goal.id} className={`goal-card ${selected.includes(goal.id) ? "selected" : ""}`} onClick={() => toggle(goal.id)}><span className="goal-number">{selected.includes(goal.id) ? "✓" : String(index + 1).padStart(2, "0")}</span><div><strong>{goal.label}</strong><p>{goal.description}</p></div></button>)}</div><div className="setup-footer"><Button variant="ghost" onClick={onBack}>Wstecz</Button><Button className="career-start" size="lg" disabled={selected.length !== 2} onClick={onConfirm}>Rozpocznij karierę <Play /></Button></div></SetupShell>;
}

function SetupShell({ step, title, subtitle, onBack, children }: { step: string; title: string; subtitle: string; onBack: () => void; children: ReactNode }) {
  return <main className="setup-screen"><header className="setup-header"><button className="mini-brand" onClick={onBack}>TT</button><div className="step-chip">KROK {step}</div></header><section className="setup-content"><p className="eyebrow">NOWA KARIERA</p><h1>{title}</h1><p className="setup-subtitle">{subtitle}</p>{children}</section></main>;
}
