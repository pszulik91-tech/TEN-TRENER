"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ThemeButton } from "./theme-studio";
import { coachingExperienceEligibility, LICENSES, PROFILE_NOTE, PSYCH_QUESTIONS, resolveCoachProfile, startingLicenseEligibility } from "./game-data";
import { COACH_REGIONS, entrySummary, INTERVIEW_STEPS, interviewProgress, updateCoachDraft } from "./coach-onboarding";
import type { CoachDraft } from "./coach-onboarding";

const PLAYING = [
  ["Brak", "Zaczynam przy ławce", "Piłkę znam z trybun i własnej nauki."],
  ["Amator", "Po pracy na boisko", "Znam szatnię amatorskiej drużyny."],
  ["Niższe ligi", "Kilka szatni w życiorysie", "Mam za sobą regularną grę ligową."],
  ["Zawodowiec", "Piłka była moją pracą", "Znam zawodowy trening i presję wyniku."],
  ["Reprezentant", "Grałem z orłem na piersi", "Nazwisko otwiera drzwi, ale podnosi oczekiwania."],
];
const EXPERIENCE = ["Debiutant", "1–3 lata", "4–10 lat", "Ponad 10 lat"];

export function Creator({ draft, setDraft, stage, setStage, questionIndex, setQuestionIndex, onNext, onBack }: { stage: number; setStage: (stage: number) => void; questionIndex: number; setQuestionIndex: (index: number) => void; draft: CoachDraft; setDraft: Dispatch<SetStateAction<CoachDraft>>; onNext: () => void; onBack: () => void }) {
  const progress = interviewProgress(draft);
  const [adjustment, setAdjustment] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const summary = entrySummary(draft);
  const question = PSYCH_QUESTIONS[questionIndex];
  const localVoice = ["Grassroots C", "UEFA B"].includes(draft.license);
  const voice = localVoice ? "Redaktor lokalnego sportu" : "Dziennikarz sportowy";
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [stage, questionIndex]);

  const update = (key: keyof CoachDraft, value: CoachDraft[keyof CoachDraft]) => {
    const next = updateCoachDraft(draft, key, value);
    const changes = [];
    if (key !== "coachingExperience" && next.coachingExperience !== draft.coachingExperience) changes.push(`Praktyka trenerska: ${next.coachingExperience}.`);
    if (key !== "license" && next.license !== draft.license) changes.push(`Licencja: ${next.license}.`);
    setAdjustment(changes.length ? `Po zmianie życiorysu skorygowano wybory. ${changes.join(" ")} Sprawdź je przed przejściem dalej.` : "");
    setDraft(next);
  };
  const canEnter = (step: number) => step === 0 || (progress.identity && (step === 1 || (progress.biography && (step === 2 || progress.complete))));
  const chooseAnswer = (index: number) => {
    const psychAnswers = { ...draft.psychAnswers, [question.id]: index };
    setDraft({ ...draft, psychAnswers, profile: resolveCoachProfile(psychAnswers) });
    if (questionIndex < PSYCH_QUESTIONS.length - 1) setQuestionIndex(questionIndex + 1);
    else setStage(3);
  };
  const back = () => {
    if (stage === 0) onBack();
    else if (stage === 2 && questionIndex > 0) setQuestionIndex(questionIndex - 1);
    else { if (stage === 3) setQuestionIndex(PSYCH_QUESTIONS.length - 1); setStage(stage - 1); }
  };
  const titles = ["Jak mamy pana przedstawić?", "Co wpisujemy do życiorysu?", question.question, "Trener gotowy. Czas znaleźć szatnię."];
  return <main className="interview-screen">
    <header className="interview-masthead"><button onClick={onBack} aria-label="Wróć do menu głównego">TEN TRENER <span>ROZMOWA PRZED DEBIUTEM</span></button><ThemeButton /></header>
    <div className="interview-layout">
      <div className="interview-main">
        <nav className="interview-chapters" aria-label="Etapy tworzenia trenera">{INTERVIEW_STEPS.map((label, index) => <button key={label} disabled={!canEnter(index)} aria-current={stage === index ? "step" : undefined} onClick={() => setStage(index)}><b>{String(index + 1).padStart(2, "0")}</b><span>{label}</span></button>)}</nav>
        <section className="interview-conversation" aria-labelledby="interview-question">
          <div className="interview-byline"><span>{stage === 3 ? "AUTORYZACJA WYWIADU" : voice}</span><b>{stage === 2 ? `PYTANIE ${questionIndex + 1} / ${PSYCH_QUESTIONS.length}` : `ETAP ${stage + 1} / 4`}</b></div>
          {stage === 2 && <p className="interview-context">{question.context}</p>}
          <h1 id="interview-question" ref={heading} tabIndex={-1}>{titles[stage]}</h1>
          {stage === 0 && <>
            <p className="interview-lead">Zaczniemy od nazwiska. Na wyniki przyjdzie czas — choć ktoś na trybunie już ma swoją jedenastkę.</p>
            <div className="interview-fields">
              <label className="field wide"><span>Imię i nazwisko lub pseudonim</span><input autoComplete="off" placeholder="Jak się nazywasz, trenerze?" maxLength={60} value={draft.name} onChange={e => update("name", e.target.value)} aria-describedby="coach-name-hint" /><small id="coach-name-hint">Minimum 3 znaki. Tak podpiszemy twoją karierę.</small></label>
              <div className="field"><span id="coach-age-label">Wiek w dniu debiutu</span><div className="age-stepper" role="group" aria-labelledby="coach-age-label"><button aria-label="Zmniejsz wiek" disabled={draft.age <= 30} onClick={() => update("age", draft.age - 1)}>−</button><output aria-label="Wiek trenera">{draft.age}</output><button aria-label="Zwiększ wiek" disabled={draft.age >= 45} onClick={() => update("age", draft.age + 1)}>+</button></div><small>30–45 lat. Wiek ogranicza możliwy staż pracy.</small></div>
              <label className="field"><span>Skąd pochodzisz?</span><NativeSelect value={draft.region} onChange={e => update("region", e.target.value)}>{COACH_REGIONS.map(region => <NativeSelectOption key={region}>{region}</NativeSelectOption>)}</NativeSelect><small>Przy wyborze klubu zaczniemy od twojego regionu.</small></label>
            </div>
          </>}
          {stage === 1 && <>
            <p className="interview-lead">Zanim zapytamy o taktykę: jak wyglądała twoja droga z boiska na ławkę?</p>
            <fieldset className="interview-options"><legend>Jako zawodnik…</legend>{PLAYING.map(([value, label, description]) => <button key={value} aria-pressed={draft.playingExperience === value} onClick={() => update("playingExperience", value)}><strong>{label}</strong><span>{description}</span><small>{value}</small></button>)}</fieldset>
            <fieldset className="interview-tenure"><legend>A przy ławce trenerskiej?</legend>{EXPERIENCE.map(experience => { const eligibility = coachingExperienceEligibility(draft.age, draft.playingExperience, experience); const label = experience === "4–10 lat" && eligibility.eligible && eligibility.availableYears < 10 ? `4–${eligibility.availableYears} lat` : experience; return <button key={experience} disabled={!eligibility.eligible} aria-pressed={draft.coachingExperience === experience} title={eligibility.reason} onClick={() => update("coachingExperience", experience)}>{label}{!eligibility.eligible && <small>Za mało lat w życiorysie</small>}</button>; })}</fieldset>
            <p className="interview-hint">{coachingExperienceEligibility(draft.age, draft.playingExperience, draft.coachingExperience).reason}</p>
            <fieldset className="interview-licenses"><legend>Z jaką licencją zaczynasz?</legend>{LICENSES.filter(license => startingLicenseEligibility(license, draft.playingExperience, draft.coachingExperience, draft.age).eligible).map(license => { const option = entrySummary({ ...draft, license }); return <button key={license} aria-pressed={draft.license === license} onClick={() => update("license", license)}><strong>{license}</strong><span>{option.pressure}</span><small>Dostęp do: {option.highest} i niżej</small></button>; })}</fieldset>
            {LICENSES.some(license => !startingLicenseEligibility(license, draft.playingExperience, draft.coachingExperience, draft.age).eligible) && <details className="interview-locked"><summary>Dlaczego pozostałe licencje są niedostępne?</summary>{LICENSES.filter(license => !startingLicenseEligibility(license, draft.playingExperience, draft.coachingExperience, draft.age).eligible).map(license => <p key={license}><b>{license}</b> — {startingLicenseEligibility(license, draft.playingExperience, draft.coachingExperience, draft.age).reason}</p>)}</details>}
            <div className="interview-consequence"><b>{summary.challenge.label}</b><p>{summary.challenge.description}</p><small>Oczekiwanie zarządu: {summary.challenge.expectation}.</small></div>
          </>}
          {stage === 2 && <>
            <div className="interview-progress" role="progressbar" aria-label="Odpowiedzi o pracy trenera" aria-valuemin={0} aria-valuemax={PSYCH_QUESTIONS.length} aria-valuenow={progress.answers}><span style={{ width: `${progress.answers / PSYCH_QUESTIONS.length * 100}%` }} /></div>
            <div className="interview-answers">{question.choices.map((choice, index) => <button key={choice.label} aria-pressed={draft.psychAnswers[question.id] === index} onClick={() => chooseAnswer(index)}><b>{String.fromCharCode(65 + index)}</b><span>{choice.label}</span></button>)}</div>
            <p className="interview-hint">Odpowiedź prowadzi do kolejnej sytuacji. Możesz się cofnąć i ją zmienić. Każdy profil ma mocne strony i koszty.</p>
          </>}
          {stage === 3 && <>
            <p className="interview-lead">Tak przedstawimy cię w klubie. Możesz jeszcze poprawić odpowiedzi.</p>
            <div className="interview-profile"><span>TWÓJ SPOSÓB PROWADZENIA ZESPOŁU</span><h2>{draft.profile}</h2><p>{PROFILE_NOTE[draft.profile]}</p><button onClick={() => { setQuestionIndex(0); setStage(2); }}>Wróć do odpowiedzi</button></div>
            <dl className="interview-review"><div><dt>Trener</dt><dd>{draft.name.trim()}, {draft.age} lat</dd></div><div><dt>Region</dt><dd>{draft.region}</dd></div><div><dt>Grałeś jako</dt><dd>{draft.playingExperience}</dd></div><div><dt>Praktyka trenerska</dt><dd>{draft.coachingExperience}</dd></div><div><dt>Licencja</dt><dd>{draft.license}</dd></div><div><dt>Wejście do gry</dt><dd>{summary.pressure}</dd></div></dl>
            <p className="interview-hint">Teraz wybierzesz prawdziwy klub i dokładnie dwa cele na sezon. Kariera zapisze się po jej rozpoczęciu.</p>
          </>}
          {adjustment && <p className="interview-adjustment" role="status">{adjustment}</p>}
        </section>
        <footer className="interview-actions"><Button variant="outline" onClick={back}>{stage === 0 ? "Menu" : "Wstecz"}</Button>{stage === 0 && <Button disabled={!progress.identity} onClick={() => setStage(1)}>O doświadczeniu</Button>}{stage === 1 && <Button disabled={!progress.identity || !progress.biography} onClick={() => setStage(2)}>Porozmawiajmy o szatni</Button>}{stage === 2 && <span>Wybierz odpowiedź powyżej</span>}{stage === 3 && <Button disabled={!progress.complete} onClick={onNext}>Wybierz pierwszy klub</Button>}</footer>
      </div>
      <aside className="coach-pass" aria-label="Wizytówka trenera"><header><span>TECZKA TRENERSKA</span><b>2026/27</b></header><div className="coach-pass-body"><small>KANDYDAT NA TRENERA</small><h2>{draft.name.trim() || "Twoje nazwisko"}</h2><p>{draft.age} lat · {draft.region}</p><span className="coach-pass-mobile">{draft.license} · dostęp do: {summary.highest} i niżej</span><dl><div><dt>Licencja</dt><dd>{draft.license}</dd></div><div><dt>Doświadczenie</dt><dd>{draft.coachingExperience}</dd></div><div><dt>Profil</dt><dd>{progress.answers === PSYCH_QUESTIONS.length ? draft.profile : `${progress.answers} / ${PSYCH_QUESTIONS.length} odpowiedzi`}</dd></div></dl><div className="coach-pass-entry"><small>NAJWYŻSZY DOSTĘPNY SZCZEBEL</small><strong>{summary.highest}</strong><span>{summary.pressure}</span></div><details><summary>Dostępne rozgrywki i oczekiwania</summary><p>{summary.competitions.join(" · ")}</p><p>{summary.challenge.description}</p></details></div><footer>Odpowiedzi tworzą twój profil. Wyniki napiszą resztę.</footer></aside>
    </div>
  </main>;
}
