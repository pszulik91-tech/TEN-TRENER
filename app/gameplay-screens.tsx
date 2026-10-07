"use client";

import { pressingAdvice } from "../lib/pressing.mjs";

import type { Dispatch, SetStateAction } from "react";
import { Activity, ChevronRight, CircleAlert, ClipboardCheck, Gauge, Shield, Sparkles, Target, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  effectiveOVR, FORMATIONS, playerAvailable, selectLineupForPlan, TEAM_PLANS,
} from "./game-data";
import type { GameState, Screen } from "./game-data";
import { teamForId } from "./game-engine";
import { ClubArrival } from "./club-arrival";
import { needsClubArrival } from "./coach-onboarding";
import { DashboardV14, Match } from "./game-screens";

type Setter = Dispatch<SetStateAction<GameState>>;
type Go = (screen: Screen) => void;
type DashboardProps = { game: GameState; go: Go; resolveDecision: (eventId: string, choiceId: string) => void; prepareMatch: () => void; beginNextSeason: () => void; dismissMatchReport: () => void };
type MatchProps = { game: GameState; go: Go; advanceMatch: () => void; prepareMatch: () => void; changeLiveInstruction: (field: "mentality" | "pressing", value: string) => void; dismissMatchReport: () => void; resolveMatchMoment: (momentId: string, choiceId: string) => void };

function signed(value: number) { return `${value >= 0 ? "+" : ""}${Number.isInteger(value) ? value : value.toFixed(1)}`; }
function PostMatchReport({ game, compact = false }: { game: GameState; compact?: boolean }) {
  const match = game.matchState; const report = match?.postMatchReport;
  if (!match?.completed || !report) return null;
  const userHome = match.fixture.home === game.club.id; const gf = userHome ? match.homeGoals : match.awayGoals; const ga = userHome ? match.awayGoals : match.homeGoals; const opponent = teamForId(game, userHome ? match.fixture.away : match.fixture.home);
  return <section className={`post-match-report panel ${compact ? "compact" : ""}`}><header><div><small>RAPORT POMECZOWY • K{match.fixture.round}</small><h2>{game.club.name} {gf}:{ga} {opponent?.name}</h2><p>{report.verdict}</p></div><span className={gf > ga ? "win" : gf === ga ? "draw" : "loss"}>{gf > ga ? "W" : gf === ga ? "R" : "P"}</span></header><p className="report-summary">{report.summary}</p>{report.decisiveFactor && <div className="decisive-factor"><b>NAJWAŻNIEJSZY WNIOSEK</b><span>{report.decisiveFactor}</span></div>}{!compact && report.winChance !== undefined && <><div className="probability-strip"><span><b>{Math.round(report.winChance * 100)}%</b>wygrana</span><span><b>{Math.round((report.drawChance ?? 0) * 100)}%</b>remis</span><span><b>{Math.round((report.lossChance ?? 0) * 100)}%</b>porażka</span><span><b>{report.userXg?.toFixed(2)}–{report.opponentXg?.toFixed(2)}</b>xG</span></div><div className="strength-breakdown"><strong>SKĄD WZIĘŁA SIĘ SIŁA DRUŻYNY</strong>{report.strengthFactors?.map((factor) => <span key={factor.label}><small>{factor.label}</small><b>{factor.label === "Automatyczna XI" ? factor.value.toFixed(1) : signed(factor.value)}</b></span>)}</div></>}<div className="report-metrics"><span><b>{report.averageCondition}%</b>Kondycja XI</span><span><b>{signed(report.boardChange)}</b>Presja zarządu</span><span><b>{signed(report.burnoutChange)}</b>Wypalenie</span></div>{!compact && <div className="report-columns"><div><strong>CO ZADZIAŁAŁO</strong>{report.positives.map((item) => <p key={item}><ClipboardCheck />{item}</p>)}</div><div><strong>CO POPRAWIĆ</strong>{report.warnings.map((item) => <p key={item}><CircleAlert />{item}</p>)}</div></div>}<div className="analysis-result"><Target /><span><b>Analiza w trakcie meczu</b>{report.analysisOutcome}</span></div></section>;
}

export function DashboardV15(props: DashboardProps) {
  if (needsClubArrival(props.game)) return <ClubArrival game={props.game} go={props.go} resolveDecision={props.resolveDecision} />;
  const report = props.game.matchState?.completed && props.game.matchState.postMatchReport;
  if (!report || props.game.employmentStatus !== "employed") return <DashboardV14 {...props} />;
  return <><DashboardV14 {...props} />{!props.game.matchState?.reportSeen && <ReportWindow game={props.game} close={props.dismissMatchReport} />}</>;
}

export function MatchV15(props: MatchProps) {
  const complete = props.game.matchState?.completed && props.game.matchState.postMatchReport;
  return <>{complete && !props.game.matchState?.reportSeen && <ReportWindow game={props.game} close={props.dismissMatchReport} />}<Match {...props} /></>;
}

function ReportWindow({ game, close }: { game: GameState; close: () => void }) {
  return <div className="post-match-window-backdrop" role="dialog" aria-modal="true" aria-label="Raport pomeczowy"><div className="post-match-window"><PostMatchReport game={game} /><Button size="lg" className="w-full report-close" onClick={close}>Zamknij raport i wróć do gry <ChevronRight /></Button></div></div>;
}

export function SquadV15({ game, setGame, go }: { game: GameState; setGame: Setter; go: Go }) {
  return <TeamPlanScreen game={game} setGame={setGame} go={go} />;
}

export function TacticsV15({ game, setGame }: { game: GameState; setGame: Setter }) {
  return <TeamPlanScreen game={game} setGame={setGame} />;
}

function TeamPlanScreen({ game, setGame, go }: { game: GameState; setGame: Setter; go?: Go }) {
  const planId = TEAM_PLANS[game.teamPlan] ? game.teamPlan : "STRONGEST"; const plan = TEAM_PLANS[planId]; const slots = FORMATIONS[game.tactic.formation]; const starterIds = new Set(Object.values(game.tactic.assignments)); const starters = game.players.filter((player) => starterIds.has(player.id)); const available = game.players.filter(playerAvailable); const missing = game.players.filter((player) => !playerAvailable(player));
  const averageCondition = starters.length ? Math.round(starters.reduce((sum, player) => sum + 100 - player.fatigue, 0) / starters.length) : 0; const averageMorale = starters.length ? Math.round(starters.reduce((sum, player) => sum + player.morale, 0) / starters.length) : 0; const quality = slots.length ? Math.round(slots.reduce((sum, slot) => { const player = game.players.find((item) => item.id === game.tactic.assignments[slot]); return sum + (player ? effectiveOVR(player, slot) : 0); }, 0) / slots.length) : 0; const youth = starters.filter((player) => player.age <= 21).length;
  const absenceReasons = [...new Set(missing.map((player) => player.absenceReason ?? ((player.injuryWeeks ?? 0) > 0 ? "uraz" : "nieobecność")))];
  const matchActive = Boolean(game.matchState && !game.matchState.completed);
  const choosePlan = (nextId: string) => { if (matchActive) return; const next = TEAM_PLANS[nextId]; const formation = next.formation as keyof typeof FORMATIONS; const assignments = selectLineupForPlan(game.players, FORMATIONS[formation], nextId); setGame({ ...game, teamPlan: nextId, squadPolicy: next.policy, tactic: { ...game.tactic, ...next.tactic, formation, assignments } }); };
  return <div className="page-stack"><section className="page-heading team-heading"><div><p className="eyebrow">PLAN DRUŻYNY</p><h1>Wybierasz pomysł, sztab układa ludzi</h1><p>Nie ustawiasz nazwisk ani pozycji. Silnik bierze pod uwagę dostępność, naturalne role, formę, wiek i kondycję.</p></div><div className="lineup-score"><span>Siła XI</span><strong>{quality}</strong><small>{available.length} dostępnych</small></div></section><section className="squad-overview team-overview"><article><Activity /><span><small>KONDYCJA XI</small><b>{averageCondition}%</b></span></article><article><Gauge /><span><small>MORALE XI</small><b>{averageMorale}</b></span></article><article className={missing.length ? "warn" : ""}><CircleAlert /><span><small>NIEDOSTĘPNI</small><b>{missing.length}</b></span></article><article><Users /><span><small>MŁODZI W XI</small><b>{youth}</b></span></article></section>{missing.length > 0 && <section className="panel availability-note"><CircleAlert /><div><strong>Sztab automatycznie zastąpi {missing.length === 1 ? "nieobecnego" : "nieobecnych"}.</strong><p>Powody: {absenceReasons.join(", ")}. Niedostępny zawodnik nie dostaje sztucznego −OVR — po prostu nie trafia do XI.</p></div></section>}<section className="team-plan-layout"><div className="team-plan-grid">{Object.entries(TEAM_PLANS).map(([id, item]) => <button key={id} disabled={matchActive} className={`team-plan-card ${id === planId ? "active" : ""}`} onClick={() => choosePlan(id)}><span>{item.tag}</span><strong>{item.label}</strong><p>{item.description}</p><small>+ {item.benefit}</small><small>− {item.risk}</small></button>)}</div><aside className="panel selected-team-plan"><div className="plan-stamp"><Sparkles /><span>WYBRANY PLAN</span></div><h2>{plan.label}</h2><p>{plan.description}</p><div className="team-instructions"><span><small>FORMACJA</small><b>{game.tactic.formation}</b></span><span><small>MENTALNOŚĆ</small><b>{game.tactic.mentality}</b></span><span><small>TEMPO</small><b>{game.tactic.tempo}</b></span><span><small>PRESSING</small><b>{game.tactic.pressing}</b></span><span><small>ROZEGRANIE</small><b>{game.tactic.buildUp}</b></span><span><small>RYZYKO PODAŃ</small><b>{game.tactic.passingRisk}</b></span></div><p>{pressingAdvice(game.tactic.pressing, averageCondition)}</p><div className="auto-lineup-note"><Shield /><span><b>XI dopasowana automatycznie</b>Po zmianie kondycji, kontuzji lub absencji silnik przeliczy ją ponownie przed meczem.</span></div>{matchActive && <p>Mecz trwa. Korekty wprowadzisz przy ławce trenerskiej.</p>}{go && <Button size="lg" className="w-full" onClick={() => go(matchActive ? "match" : "training")}>{matchActive ? "Wróć do meczu" : "Ustaw mikrocykl"} <ChevronRight /></Button>}</aside></section></div>;
}
