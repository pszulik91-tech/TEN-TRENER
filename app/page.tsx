"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEVELOPMENT_GOALS, FORMATIONS, GameState, LEAGUE_PACKS, LICENSE_MIN_TIER,
  License, CoachProfile, MatchEvent, SAVE_KEY, Screen, Team, Fixture,
  buildSchedule, liveOVR, randomInt, rngNext, sortedTable, updateTeamResult,
} from "./game-data";
import type { Coach, LeaguePack } from "./game-data";
import { createGame, currentFixture, skillSet, teamForId } from "./game-engine";
import { ClubPicker, Creator, GoalPicker, StartScreen } from "./setup-screens";
import type { CoachDraft } from "./setup-screens";
import { Career, Dashboard, GameShell, Match, Squad, TableScreen, Tactics, Training } from "./game-screens";

export default function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [game, setGame] = useState<GameState | null>(null);
  const [hasSave, setHasSave] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
  const [draft, setDraft] = useState<CoachDraft>({ name: "Piotr Szulik", age: 35, region: "Śląskie", playingExperience: "Amator", coachingExperience: "4–10 lat", profile: "Mentor" as CoachProfile, license: "Grassroots D" as License });
  const [selectedAssociation, setSelectedAssociation] = useState("Podkarpacki ZPN");
  const [selectedDistrict, setSelectedDistrict] = useState("Jarosław");
  const [selectedPackId, setSelectedPackId] = useState("podkarpacka-b-jaroslaw");
  const [selectedClub, setSelectedClub] = useState("Łazowianka Łazy");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setHasSave(Boolean(localStorage.getItem(SAVE_KEY))));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => { if (game) localStorage.setItem(SAVE_KEY, JSON.stringify(game)); }, [game]);

  const eligiblePacks = useMemo(() => LEAGUE_PACKS.filter((pack) => pack.tier >= LICENSE_MIN_TIER[draft.license]), [draft.license]);
  const associations = useMemo(() => [...new Set(eligiblePacks.map((pack) => pack.association))].sort((a, b) => a.localeCompare(b, "pl")), [eligiblePacks]);
  const districts = useMemo(() => [...new Set(eligiblePacks.filter((pack) => pack.association === selectedAssociation).map((pack) => pack.district))], [eligiblePacks, selectedAssociation]);
  const packs = useMemo(() => eligiblePacks.filter((pack) => pack.association === selectedAssociation && pack.district === selectedDistrict), [eligiblePacks, selectedAssociation, selectedDistrict]);
  const selectedPack = eligiblePacks.find((pack) => pack.id === selectedPackId) ?? packs[0];
  const go = (next: Screen) => { setScreen(next); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const loadGame = () => {
    try { const raw = localStorage.getItem(SAVE_KEY); if (!raw) return; const parsed = JSON.parse(raw) as GameState; if (!parsed.coach || !parsed.club || !Array.isArray(parsed.fixtures)) throw new Error("invalid save"); setGame(parsed); go(parsed.matchState && !parsed.matchState.completed ? "match" : "dashboard"); }
    catch { localStorage.removeItem(SAVE_KEY); setHasSave(false); }
  };

  const startClubStep = () => {
    const available = LEAGUE_PACKS.filter((pack) => pack.tier >= LICENSE_MIN_TIER[draft.license]); const first = available.find((pack) => pack.association === selectedAssociation) ?? available[0];
    setSelectedAssociation(first.association); setSelectedDistrict(first.district); setSelectedPackId(first.id); setSelectedClub(first.teams[0]); go("club");
  };
  const chooseAssociation = (value: string) => { const first = eligiblePacks.find((pack) => pack.association === value) as LeaguePack; setSelectedAssociation(value); setSelectedDistrict(first.district); setSelectedPackId(first.id); setSelectedClub(first.teams[0]); };
  const chooseDistrict = (value: string) => { const first = eligiblePacks.find((pack) => pack.association === selectedAssociation && pack.district === value) as LeaguePack; setSelectedDistrict(value); setSelectedPackId(first.id); setSelectedClub(first.teams[0]); };
  const choosePack = (value: string) => { const pack = eligiblePacks.find((item) => item.id === value) as LeaguePack; setSelectedPackId(value); setSelectedClub(pack.teams[0]); };

  const finalizeCareer = () => {
    if (!selectedPack || selectedGoals.length !== 2) return;
    const derived = skillSet(draft.profile, draft.playingExperience, draft.coachingExperience); const coach: Coach = { ...draft, ...derived };
    setGame(createGame(coach, selectedPack, selectedClub, selectedGoals)); go("dashboard");
  };
  const saveNow = () => { if (!game) return; localStorage.setItem(SAVE_KEY, JSON.stringify(game)); setHasSave(true); setSavedPulse(true); window.setTimeout(() => setSavedPulse(false), 1400); };

  const applyTraining = () => {
    if (!game) return;
    const readiness = game.training.intensity === "Wysoka" ? 10 : game.training.intensity === "Niska" ? -3 : 4; const load = game.training.intensity === "Wysoka" ? 10 : game.training.intensity === "Niska" ? 2 : 5;
    setGame({ ...game, training: { ...game.training, readiness: Math.min(95, game.training.readiness + readiness) }, players: game.players.map((player) => ({ ...player, fatigue: Math.max(0, Math.min(100, player.fatigue + load - (game.training.recovery ? 5 : 0))), morale: Math.min(100, player.morale + (game.training.focus === "Atmosfera" ? 4 : 0)) })), burnout: Math.min(100, game.burnout + (game.training.intensity === "Wysoka" ? 3 : 1)), developmentGoals: game.developmentGoals.map((goal) => goal.id === "tactics" && game.training.focus === "Taktyka" ? { ...goal, progress: Math.min(goal.target, goal.progress + 1) } : goal), history: [`${game.date} — Zrealizowano mikrocykl: ${game.training.focus}, intensywność ${game.training.intensity.toLowerCase()}.`, ...game.history].slice(0, 40) });
    go("dashboard");
  };

  const prepareMatch = () => {
    if (!game) return; const fixture = currentFixture(game); if (!fixture) return;
    const homeTeam = teamForId(game, fixture.home) as Team; const awayTeam = teamForId(game, fixture.away) as Team; const userHome = fixture.home === game.club.id; const slots = FORMATIONS[game.tactic.formation];
    const squadRating = slots.reduce((sum, slot) => { const player = game.players.find((item) => item.id === game.tactic.assignments[slot]); return sum + (player ? liveOVR(player, slot) : 1); }, 0) / 11;
    const tactical = (game.coach.skills.tactics - 40) / 16 + (game.training.readiness - 60) / 12; const homeStrength = userHome ? squadRating + tactical + 2.2 : homeTeam.ovr; const awayStrength = userHome ? awayTeam.ovr : squadRating + tactical;
    let seed = game.seed; const events: MatchEvent[] = []; let homeGoals = 0; let awayGoals = 0; let shotsHome = 3; let shotsAway = 3;
    for (let minute = 3; minute <= 90; minute += 3) {
      const roll = rngNext(seed); seed = roll.seed; const homeChance = 0.046 * Math.max(0.55, homeStrength / Math.max(1, awayStrength)); const awayChance = 0.042 * Math.max(0.55, awayStrength / Math.max(1, homeStrength));
      if (roll.value < homeChance) { const finish = rngNext(seed); seed = finish.seed; shotsHome += 1; if (finish.value < 0.31) { homeGoals += 1; events.push({ minute, text: `Gol dla ${homeTeam.name}! Akcja po odzyskaniu kończy się strzałem z pola karnego.`, kind: "goal", side: "home" }); } else events.push({ minute, text: `${homeTeam.name} tworzy groźną sytuację, ale bramkarz odbija piłkę.`, kind: "chance", side: "home" }); }
      else if (roll.value < homeChance + awayChance) { const finish = rngNext(seed); seed = finish.seed; shotsAway += 1; if (finish.value < 0.3) { awayGoals += 1; events.push({ minute, text: `Gol dla ${awayTeam.name}. Szybkie wejście w wolną przestrzeń i skuteczne wykończenie.`, kind: "goal", side: "away" }); } else events.push({ minute, text: `${awayTeam.name} dochodzi do strzału — piłka mija słupek.`, kind: "chance", side: "away" }); }
      else if (roll.value > 0.965) events.push({ minute, text: "Żółta kartka po spóźnionym wejściu w środku pola.", kind: "card", side: roll.value > 0.983 ? "away" : "home" });
    }
    if (!events.length) events.push({ minute: 12, text: "Obie drużyny ostrożnie badają się w środku pola.", kind: "info", side: "neutral" }); events.sort((a, b) => a.minute - b.minute);
    const possessionHome = Math.max(35, Math.min(65, Math.round(50 + (homeStrength - awayStrength) * 0.7)));
    setGame({ ...game, seed, matchState: { fixture, minute: 0, homeGoals, awayGoals, plannedEvents: events, shotsHome, shotsAway, possessionHome, completed: false } }); go("match");
  };

  const changeLiveInstruction = (field: "mentality" | "pressing", value: string) => { if (game) setGame({ ...game, tactic: { ...game.tactic, [field]: value }, pressures: { ...game.pressures, personal: Math.min(100, game.pressures.personal + (value === "Ofensywna" || value === "Bardzo wysoki" ? 2 : 0)) } }); };

  const advanceMatch = () => {
    if (!game?.matchState || game.matchState.completed) return; const minute = Math.min(90, game.matchState.minute + 15); if (minute < 90) { setGame({ ...game, matchState: { ...game.matchState, minute } }); return; }
    const match = game.matchState; let teams = updateTeamResult(game.teams, match.fixture.home, match.fixture.away, match.homeGoals, match.awayGoals); let seed = game.seed; const fixtures: Fixture[] = game.fixtures.map((fixture) => ({ ...fixture }));
    const roundFixtures = game.fixtures.filter((fixture) => fixture.round === game.round && !(fixture.home === match.fixture.home && fixture.away === match.fixture.away));
    for (const fixture of roundFixtures) { const home = teams.find((team) => team.id === fixture.home) as Team; const away = teams.find((team) => team.id === fixture.away) as Team; const r1 = randomInt(seed, 0, 3); seed = r1.seed; const r2 = randomInt(seed, 0, 3); seed = r2.seed; const swing = Math.max(-1, Math.min(1, Math.round((home.ovr - away.ovr) / 8))); const hg = Math.max(0, r1.value + swing + (r1.value === 0 ? 1 : 0)); const ag = Math.max(0, r2.value - swing); teams = updateTeamResult(teams, fixture.home, fixture.away, hg, ag); const target = fixtures.find((item) => item.round === fixture.round && item.home === fixture.home && item.away === fixture.away) as Fixture; Object.assign(target, { played: true, homeGoals: hg, awayGoals: ag }); }
    const userTarget = fixtures.find((item) => item.round === match.fixture.round && item.home === match.fixture.home && item.away === match.fixture.away) as Fixture; Object.assign(userTarget, { played: true, homeGoals: match.homeGoals, awayGoals: match.awayGoals });
    const userHome = match.fixture.home === game.club.id; const gf = userHome ? match.homeGoals : match.awayGoals; const ga = userHome ? match.awayGoals : match.homeGoals; const result = gf > ga ? "win" : gf === ga ? "draw" : "loss"; const pressureDelta = result === "win" ? -7 : result === "draw" ? -1 : 8; const newRound = game.round + 1; const endSeason = newRound > Math.max(...game.fixtures.map((fixture) => fixture.round)); const nextDate = new Date(game.date); nextDate.setDate(nextDate.getDate() + 7);
    const inbox = [...game.inbox]; if (game.round % 3 === 0 || result === "loss") inbox.unshift({ id: `decision-${game.round}`, title: result === "loss" ? "Pytanie lokalnego portalu" : "Niezadowolony zawodnik", body: result === "loss" ? "Dziennikarz pyta, czy odpowiedzialność za porażkę ponosi młody środkowy obrońca." : "Rezerwowy napastnik chce wiedzieć, dlaczego nie dostał dziś minut.", resolved: false });
    const progress = game.developmentGoals.map((goal) => { let add = 0; if (goal.id === "pressure" && Math.max(...Object.values(game.pressures)) > 40 && result !== "loss") add = 1; if (goal.id === "adaptability" && result !== "loss") add = 1; if (goal.id === "reputation" && result === "win") add = 1; if (goal.id === "motivation" && game.players.slice(0, 11).reduce((sum, player) => sum + player.morale, 0) / 11 > 68) add = 1; return { ...goal, progress: Math.min(goal.target, goal.progress + add) }; });
    const score = `${teamForId(game, match.fixture.home)?.name} ${match.homeGoals}:${match.awayGoals} ${teamForId(game, match.fixture.away)?.name}`;
    const nextPressures = Object.fromEntries(Object.entries(game.pressures).map(([key, value]) => [key, Math.max(0, Math.min(100, value + pressureDelta + (key === "dressing" && result === "loss" ? 3 : 0)))]));
    setGame({ ...game, seed, teams, fixtures, round: newRound, date: nextDate.toISOString().slice(0, 10), matchState: { ...match, minute: 90, completed: true }, pressures: nextPressures, burnout: Math.max(0, Math.min(100, game.burnout + (result === "loss" ? 3 : -1))), players: game.players.map((player) => ({ ...player, fatigue: Math.min(100, player.fatigue + 7), morale: Math.max(0, Math.min(100, player.morale + (result === "win" ? 4 : result === "loss" ? -4 : 1))), form: Math.max(0, Math.min(100, player.form + (result === "win" ? 3 : result === "loss" ? -2 : 1))) })), developmentGoals: progress, history: [`${game.date} — ${score}.`, ...game.history].slice(0, 40), inbox, newSeasonPending: endSeason });
  };

  const resolveDecision = (choice: "defend" | "discipline" | "private") => {
    if (!game) return; const event = game.inbox.find((item) => !item.resolved); if (!event) return; const pressures = { ...game.pressures }; let players = [...game.players]; let note = "";
    if (choice === "defend") { pressures.media += 5; pressures.dressing -= 5; players = players.map((player) => ({ ...player, relation: Math.min(100, player.relation + 3) })); note = "Publicznie obroniono zawodnika. Szatnia to doceniła, media podkręciły temat."; }
    if (choice === "discipline") { pressures.board -= 3; pressures.dressing += 6; players = players.map((player, index) => index === 0 ? { ...player, relation: player.relation - 8, morale: player.morale - 6 } : player); note = "Postawiono na dyscyplinę. Zarząd zadowolony, część szatni chłodniejsza."; }
    if (choice === "private") { pressures.media -= 1; pressures.dressing -= 1; pressures.personal += 2; note = "Temat zamknięto wewnątrz klubu. Bez szybkiej nagrody, bez medialnego pożaru."; }
    setGame({ ...game, pressures: Object.fromEntries(Object.entries(pressures).map(([key, value]) => [key, Math.max(0, Math.min(100, value))])), players, inbox: game.inbox.map((item) => item.id === event.id ? { ...item, resolved: true } : item), history: [`${game.date} — ${note}`, ...game.history].slice(0, 40), developmentGoals: game.developmentGoals.map((goal) => goal.id === "people" ? { ...goal, progress: Math.min(goal.target, goal.progress + 1) } : goal) });
  };

  const beginNextSeason = () => {
    if (!game) return; const table = sortedTable(game.teams); const place = table.findIndex((team) => team.id === game.club.id) + 1; const newTier = place === 1 ? Math.max(1, game.club.tier - 1) : place >= table.length - 1 ? Math.min(10, game.club.tier + 1) : game.club.tier; const nextYear = Number(game.season.slice(0, 4)) + 1; const resetTeams = game.teams.map((team) => ({ ...team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 }));
    setGame({ ...game, club: { ...game.club, tier: newTier, competition: newTier === game.club.tier ? game.club.competition : place === 1 ? `szczebel ${newTier} — awans` : `szczebel ${newTier} — spadek` }, season: `${nextYear}/${String(nextYear + 1).slice(-2)}`, date: `${nextYear}-07-13`, round: 1, teams: resetTeams, fixtures: buildSchedule(resetTeams.map((team) => team.id)), matchState: undefined, newSeasonPending: false, developmentGoals: [], history: [`Koniec sezonu: ${place}. miejsce. ${newTier < game.club.tier ? "Awans!" : newTier > game.club.tier ? "Spadek." : "Utrzymanie."}`, ...game.history] }); setSelectedGoals([]); go("goals");
  };
  const confirmNewSeasonGoals = () => { if (!game || selectedGoals.length !== 2) return; setGame({ ...game, developmentGoals: DEVELOPMENT_GOALS.filter((goal) => selectedGoals.includes(goal.id)).map((goal) => ({ ...goal, progress: 0 })) }); go("dashboard"); };

  if (screen === "start") return <StartScreen hasSave={hasSave} onNew={() => go("creator")} onLoad={loadGame} />;
  if (screen === "creator") return <Creator draft={draft} setDraft={setDraft} onNext={startClubStep} onBack={() => go("start")} />;
  if (screen === "club") return <ClubPicker draft={draft} associations={associations} districts={districts} packs={packs} pack={selectedPack} selectedAssociation={selectedAssociation} selectedDistrict={selectedDistrict} selectedPackId={selectedPackId} selectedClub={selectedClub} onAssociation={chooseAssociation} onDistrict={chooseDistrict} onPack={choosePack} onClub={setSelectedClub} onBack={() => go("creator")} onNext={() => go("goals")} />;
  if (screen === "goals") return <GoalPicker selected={selectedGoals} setSelected={setSelectedGoals} season={game?.season ?? "2026/27"} onBack={() => go(game ? "dashboard" : "club")} onConfirm={game ? confirmNewSeasonGoals : finalizeCareer} />;
  if (!game) return <StartScreen hasSave={hasSave} onNew={() => go("creator")} onLoad={loadGame} />;
  return <GameShell game={game} screen={screen} go={go} menuOpen={menuOpen} setMenuOpen={setMenuOpen} saveNow={saveNow} savedPulse={savedPulse}>{screen === "dashboard" && <Dashboard game={game} go={go} resolveDecision={resolveDecision} prepareMatch={prepareMatch} beginNextSeason={beginNextSeason} />}{screen === "squad" && <Squad game={game} setGame={setGame} />}{screen === "tactics" && <Tactics game={game} setGame={setGame} />}{screen === "training" && <Training game={game} setGame={setGame} applyTraining={applyTraining} />}{screen === "match" && <Match game={game} go={go} advanceMatch={advanceMatch} prepareMatch={prepareMatch} changeLiveInstruction={changeLiveInstruction} />}{screen === "table" && <TableScreen game={game} />}{screen === "career" && <Career game={game} />}</GameShell>;
}
