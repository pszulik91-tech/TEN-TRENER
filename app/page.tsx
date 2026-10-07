"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BUILD, DEVELOPMENT_GOALS, effectiveOVR, FORMATIONS, GameState, LEAGUE_PACKS,
  License, CoachProfile, POLICY_EFFECTS, SAVE_KEY, Screen, Team, Fixture, LICENSE_CHALLENGES, TIER_OVR,
  buildMatchStrength, buildSchedule, capReadiness, defaultMicrocycle, diagnoseMatchOutcome, dismissalProbability, environmentForPack, evaluateMicrocycle, goalSatisfied, highestEligibleCoachingExperience, highestEligibleStartingLicense, injuryRiskFromFatigue, licenseCoversCompetition, licenseCoversTier, naturalRecoveryForGap, normalizeStartingLicense, offseasonBurnout, positionPenalty, pressureDeltaForResult, requiredLicenseForCompetition, requiredLicenseForTier, rngNext, selectLineupForPlan, simulateMatchPlan, sortedTable, startingLicenseEligibility, trainingTacticSynergy, TEAM_PLANS, teamLiveStrength, updateTeamResult, weeklyBurnoutDelta,
} from "./game-data";
import type { Coach, LeaguePack } from "./game-data";
import { buildLeagueForSeason, createGame, currentFixture, environmentIncident, evolveSquad, generateJobOffers, makePlayers, makePresident, skillSet, teamForId } from "./game-engine";
import { describeResolvedEffects, generateRoundIssues, legacyIssue, resolveIssueEffects } from "../lib/career-events.mjs";
import { phrase } from "../lib/game-language.mjs";
import { ClubPicker, Creator, GoalPicker, StartScreen } from "./setup-screens";
import type { CoachDraft } from "./setup-screens";
import { initialCoachDraft, interviewProgress } from "./coach-onboarding";
import { CareerV14 as Career, GameShell, Jobs, TableScreenV14 as TableScreen, Training } from "./game-screens";
import { DashboardV15 as Dashboard, MatchV15 as Match, SquadV15 as Squad, TacticsV15 as Tactics } from "./gameplay-screens";
import { createWorldSnapshot, evolveWorldSnapshot, simulateWorldToDate } from "../lib/world-engine.mjs";
import { generateMatchMoments, resolveMatchMoment as resolveMomentEffect } from "../lib/match-moments.mjs";

import { gameActions } from "./game-actions";
import { storeCareer, readCareer, resumeScreen, storeCreatorDraft, readCreatorDraft, clearCreatorDraft, CreatorDraftSave } from "./save-storage";

const COMPETITION_ORDER = ["Ekstraklasa", "I liga", "II liga", "III liga", "IV liga", "V liga", "Klasa okręgowa", "Klasa A", "Klasa B", "Klasa C"];
const REGION_ASSOCIATION: Record<string, string> = {
  Dolnośląskie: "Dolnośląski ZPN", "Kujawsko-pomorskie": "Kujawsko-Pomorski ZPN", Lubelskie: "Lubelski ZPN", Lubuskie: "Lubuski ZPN",
  Łódzkie: "Łódzki ZPN", Małopolskie: "Małopolski ZPN", Mazowieckie: "Mazowiecki ZPN", Opolskie: "Opolski ZPN",
  Podkarpackie: "Podkarpacki ZPN", Podlaskie: "Podlaski ZPN", Pomorskie: "Pomorski ZPN", Śląskie: "Śląski ZPN",
  Świętokrzyskie: "Świętokrzyski ZPN", "Warmińsko-mazurskie": "Warmińsko-Mazurski ZPN", Wielkopolskie: "Wielkopolski ZPN", Zachodniopomorskie: "Zachodniopomorski ZPN",
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [game, setGame] = useState<GameState | null>(null);
  const [hasSave, setHasSave] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedPulse, setSavedPulse] = useState(false);
  const [draft, setDraft] = useState<CoachDraft>(initialCoachDraft);
  const [selectedAssociation, setSelectedAssociation] = useState("Podkarpacki ZPN");
  const [selectedCompetition, setSelectedCompetition] = useState("Klasa B");
  const [selectedDistrict, setSelectedDistrict] = useState("Jarosław");
  const [selectedPackId, setSelectedPackId] = useState("podkarpacka-b-jaroslaw");
  const [selectedClub, setSelectedClub] = useState("Łazowianka Łazy");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [clubStepVisited, setClubStepVisited] = useState(false);
  const [creatorStage, setCreatorStage] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const creatingCareer = useRef(false);
  const [pendingDraft, setPendingDraft] = useState<CreatorDraftSave | null>(null);
  useEffect(() => { setPendingDraft(readCreatorDraft()); }, []);
  useEffect(() => {
    if (game || !['creator', 'club', 'goals'].includes(screen)) return;
    const snapshot: CreatorDraftSave = { version: 1, draft, screen: screen as CreatorDraftSave['screen'], stage: creatorStage, questionIndex, selectedCompetition, selectedAssociation, selectedDistrict, selectedPackId, selectedClub, selectedGoals, clubStepVisited };
    try { storeCreatorDraft(snapshot); setPendingDraft(snapshot); setSaveError(''); }
    catch { setSaveError('Nie można zapisać szkicu kreatora na tym urządzeniu.'); }
  }, [game, screen, draft, creatorStage, questionIndex, selectedCompetition, selectedAssociation, selectedDistrict, selectedPackId, selectedClub, selectedGoals, clubStepVisited]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHasSave((() => { try { return Boolean(localStorage.getItem(SAVE_KEY)); } catch { return false; } })()));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => { if (game) { let active = true; storeCareer(game).then(() => { if(active) { setHasSave(true); if (creatingCareer.current) { clearCreatorDraft(); setPendingDraft(null); creatingCareer.current = false; } setSaveError(""); } }).catch(() => { if(active) setSaveError("Przeglądarka nie przyjęła zapisu. Otwórz Wygląd i zapis i pobierz aktualną karierę."); }); return () => { active = false; }; } }, [game]);
  useEffect(() => { const restore = async () => { try { const raw = localStorage.getItem(SAVE_KEY); if(raw) { const loaded = await readCareer(raw); setGame(loaded); setScreen(resumeScreen(loaded)); } } catch { setSaveError("Nie można wczytać kariery."); } }; window.addEventListener("restore-career",restore);return()=>window.removeEventListener("restore-career",restore); }, []);

  const competitionOptions = useMemo(() => COMPETITION_ORDER.filter((competition) => LEAGUE_PACKS.some((pack) => pack.competition === competition)).map((competition) => ({ competition, available: licenseCoversCompetition(draft.license, competition), required: requiredLicenseForCompetition(competition) })), [draft.license]);
  const eligiblePacks = useMemo(() => LEAGUE_PACKS.filter((pack) => licenseCoversCompetition(draft.license, pack.competition)), [draft.license]);
  const competitionPacks = useMemo(() => eligiblePacks.filter((pack) => pack.competition === selectedCompetition), [eligiblePacks, selectedCompetition]);
  const associations = useMemo(() => [...new Set(competitionPacks.map((pack) => pack.association))].sort((a, b) => a.localeCompare(b, "pl")), [competitionPacks]);
  const associationPacks = useMemo(() => competitionPacks.filter((pack) => pack.association === selectedAssociation), [competitionPacks, selectedAssociation]);
  const districts = useMemo(() => selectedAssociation === "PZPN — rozgrywki centralne" ? [] : [...new Set(associationPacks.map((pack) => pack.district).filter((district) => !["Polska", "województwo"].includes(district)))].sort((a, b) => a.localeCompare(b, "pl")), [associationPacks, selectedAssociation]);
  const packs = useMemo(() => associationPacks.filter((pack) => !districts.length || pack.district === selectedDistrict), [associationPacks, districts, selectedDistrict]);
  const selectedPack = eligiblePacks.find((pack) => pack.id === selectedPackId) ?? packs[0];
  const go = (next: Screen) => { const destination = game && game.developmentGoals.length !== 2 && !game.pendingSeason && !["start","creator","club"].includes(next) ? "goals" : next === "tactics" ? "squad" : next; if (destination === "match" && game?.matchState?.completed && game.matchState.fixture.round < game.round) setGame({ ...game, matchState: undefined }); setScreen(destination); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const loadGame = async () => {
    try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return; const parsed = await readCareer(raw); if (!parsed.coach || !parsed.club || !Array.isArray(parsed.fixtures)) throw new Error("invalid save"); setGame(parsed); setScreen(resumeScreen(parsed)); }
    catch { setSaveError("Nie można odczytać kariery. Zapis zachowano; możesz pobrać go w ustawieniach."); window.alert("Nie można odczytać kariery. Zapis nie został usunięty. Otwórz Wygląd i zapis."); }
  };

  const startNewCareer = () => { try { clearCreatorDraft(); } catch { setSaveError("Nie można usunąć szkicu kreatora."); } setPendingDraft(null); setCreatorStage(0); setQuestionIndex(0); setGame(null); setDraft(initialCoachDraft()); setSelectedGoals([]); setClubStepVisited(false); go("creator"); };
  const resumeCreator = () => {
    if (!pendingDraft) return;
    const s = pendingDraft;
    setGame(null); setDraft(s.draft); setCreatorStage(s.stage); setQuestionIndex(s.questionIndex);
    setSelectedCompetition(s.selectedCompetition); setSelectedAssociation(s.selectedAssociation); setSelectedDistrict(s.selectedDistrict);
    setSelectedPackId(s.selectedPackId); setSelectedClub(s.selectedClub); setSelectedGoals(s.selectedGoals); setClubStepVisited(s.clubStepVisited); go(s.screen);
  };
  const startClubStep = () => {
    if (!interviewProgress(draft).complete) return;
    if (clubStepVisited && eligiblePacks.some(pack => pack.id === selectedPackId && pack.teams.includes(selectedClub))) { go("club"); return; }
    setClubStepVisited(true);
    const available = LEAGUE_PACKS.filter((pack) => licenseCoversCompetition(draft.license, pack.competition));
    const bestTier = Math.min(...available.map((pack) => pack.tier)); const preferredAssociation = REGION_ASSOCIATION[draft.region];
    const defaultCompetition = draft.license === "Grassroots C" ? "Klasa B" : undefined;
    const local = available.filter(pack => pack.association === preferredAssociation);
    const first = (bestTier <= 3 ? available.find(pack => pack.tier === bestTier) : undefined) ?? local.find(pack => pack.competition === defaultCompetition && pack.district === "Rybnik") ?? local.find(pack => pack.competition === defaultCompetition) ?? local.sort((a,b) => a.tier-b.tier)[0] ?? available.find(pack => pack.tier === bestTier) ?? available[0];
    setSelectedCompetition(first.competition); setSelectedAssociation(first.association); setSelectedDistrict(first.district); setSelectedPackId(first.id); setSelectedClub(first.teams[0]); go("club");
  };
  const chooseCompetition = (value: string) => { const available = eligiblePacks.filter((pack) => pack.competition === value); const preferredAssociation = REGION_ASSOCIATION[draft.region]; const first = available.find((pack) => pack.association === preferredAssociation) ?? available[0]; setSelectedCompetition(value); setSelectedAssociation(first.association); setSelectedDistrict(first.district); setSelectedPackId(first.id); setSelectedClub(first.teams[0]); };
  const chooseAssociation = (value: string) => { const first = eligiblePacks.find((pack) => pack.competition === selectedCompetition && pack.association === value) as LeaguePack; setSelectedAssociation(value); setSelectedDistrict(first.district); setSelectedPackId(first.id); setSelectedClub(first.teams[0]); };
  const chooseDistrict = (value: string) => { const first = eligiblePacks.find((pack) => pack.competition === selectedCompetition && pack.association === selectedAssociation && pack.district === value) as LeaguePack; setSelectedDistrict(value); setSelectedPackId(first.id); setSelectedClub(first.teams[0]); };
  const choosePack = (value: string) => { const pack = eligiblePacks.find((item) => item.id === value) as LeaguePack; setSelectedPackId(value); setSelectedClub(pack.teams[0]); };

  const finalizeCareer = () => {
    if (!selectedPack || selectedGoals.length !== 2 || !interviewProgress(draft).complete || !selectedPack.teams.includes(selectedClub) || !licenseCoversCompetition(draft.license, selectedPack.competition)) return;
    const credibleExperience = highestEligibleCoachingExperience(draft.age, draft.playingExperience);
    const coachingExperience = startingLicenseEligibility("Grassroots C", draft.playingExperience, draft.coachingExperience, draft.age).eligible ? draft.coachingExperience : credibleExperience;
    const startingLicense = startingLicenseEligibility(draft.license, draft.playingExperience, coachingExperience, draft.age).eligible ? draft.license : highestEligibleStartingLicense(draft.playingExperience, coachingExperience, draft.age) as License;
    const derived = skillSet(draft.profile, draft.playingExperience, coachingExperience); const coach: Coach = { name: draft.name.trim(), age: draft.age, region: draft.region, playingExperience: draft.playingExperience, coachingExperience, profile: draft.profile, license: startingLicense, ...derived };
    creatingCareer.current = true;
    setGame(createGame(coach, selectedPack, selectedClub, selectedGoals)); go("dashboard");
  };
  const saveNow = async () => { if (!game) return; try { await storeCareer(game); } catch { setSaveError("Brak miejsca na zapis. Pobierz kopię kariery."); return; } setHasSave(true); setSavedPulse(true); window.setTimeout(() => setSavedPulse(false), 1400); };

  const { applyTraining, prepareMatch, changeLiveInstruction, resolveMatchMoment, advanceMatch, resolveDecision, beginNextSeason, acceptJob, stayAtClub, dismissMatchReport, retireCareer, confirmNewSeasonGoals } = gameActions(game, setGame, go, selectedGoals, setSelectedGoals);

  if (screen === "start") return <>{saveError && <div role="alert">{saveError}</div>}<StartScreen hasSave={hasSave} onNew={startNewCareer} onLoad={loadGame} hasDraft={Boolean(pendingDraft)} onResumeDraft={resumeCreator} /></>;
  if (screen === "creator") return <>{saveError && <div role="alert">{saveError}</div>}<Creator stage={creatorStage} setStage={setCreatorStage} questionIndex={questionIndex} setQuestionIndex={setQuestionIndex} draft={draft} setDraft={setDraft} onNext={startClubStep} onBack={() => go("start")} /></>;
  if (screen === "club") return <ClubPicker draft={draft} competitionOptions={competitionOptions} selectedCompetition={selectedCompetition} associations={associations} districts={districts} packs={packs} pack={selectedPack} selectedAssociation={selectedAssociation} selectedDistrict={selectedDistrict} selectedPackId={selectedPackId} selectedClub={selectedClub} onCompetition={chooseCompetition} onAssociation={chooseAssociation} onDistrict={chooseDistrict} onPack={choosePack} onClub={setSelectedClub} onBack={() => go("creator")} onNext={() => go("goals")} />;
  if (screen === "goals") return <GoalPicker selected={selectedGoals} setSelected={setSelectedGoals} season={game?.season ?? "2026/27"} onBack={() => go(game ? "dashboard" : "club")} onConfirm={game ? confirmNewSeasonGoals : finalizeCareer} />;
  if (!game) return <StartScreen hasSave={hasSave} onNew={startNewCareer} onLoad={loadGame} hasDraft={Boolean(pendingDraft)} onResumeDraft={resumeCreator} />;
  return <GameShell game={game} screen={screen} go={go} menuOpen={menuOpen} setMenuOpen={setMenuOpen} saveNow={saveNow} savedPulse={savedPulse}>{saveError && <div role="alert" className="save-error">{saveError}</div>}{screen === "dashboard" && <Dashboard game={game} go={go} resolveDecision={resolveDecision} prepareMatch={prepareMatch} beginNextSeason={beginNextSeason} dismissMatchReport={dismissMatchReport} />}{screen === "squad" && <Squad game={game} setGame={value => setGame(previous => previous ? typeof value === "function" ? value(previous) : value : previous)} go={go} />}{screen === "tactics" && <Tactics game={game} setGame={value => setGame(previous => previous ? typeof value === "function" ? value(previous) : value : previous)} />}{screen === "training" && <Training game={game} setGame={value => setGame(previous => previous ? typeof value === "function" ? value(previous) : value : previous)} applyTraining={applyTraining} />}{screen === "match" && <Match game={game} go={go} advanceMatch={advanceMatch} prepareMatch={prepareMatch} changeLiveInstruction={changeLiveInstruction} dismissMatchReport={dismissMatchReport} resolveMatchMoment={resolveMatchMoment} />}{screen === "table" && <TableScreen game={game} />}{screen === "jobs" && <Jobs game={game} acceptJob={acceptJob} stayAtClub={stayAtClub} />}{screen === "career" && <Career game={game} setGame={value => setGame(previous => previous ? typeof value === "function" ? value(previous) : value : previous)} retireCareer={retireCareer} />}</GameShell>;
}

