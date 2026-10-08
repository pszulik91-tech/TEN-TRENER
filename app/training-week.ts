import type { GameState, Player, Tactic, TrainingSession } from './game-data';
import { capReadiness, conditionFromFatigue, conditionStatus, effectiveOVR, evaluateMicrocycle, FORMATIONS, naturalRecoveryForGap, playingEnvironment, selectLineupForPlan, TEAM_PLANS, TRAINING_PRESETS, trainingPresetSessions, trainingTacticSynergy } from './game-data';
import { currentFixture, teamForId } from './game-engine';

export type TrainingMetrics = { condition:number; readiness:number; morale:number; form:number; ovr:number };
export type WeekDiagnosis = { kind:'condition'|'readiness'|'opponent'|'plan'|'none'; title:string; evidence:string };
export type TrainingWeekSummary = { round:number; diagnosis:WeekDiagnosis; chosen:string; before:TrainingMetrics; after:TrainingMetrics };
const mean = (players:Player[], value:(p:Player)=>number) => players.length ? Math.round(players.reduce((sum,p)=>sum+value(p),0)/players.length) : 0;
export function trainingMetrics(players:Player[], tactic:Tactic, readiness:number):TrainingMetrics {
 const selected=new Set(Object.values(tactic.assignments));const xi=players.filter(p=>selected.has(p.id));
 const slots=FORMATIONS[tactic.formation];
 return {condition:mean(xi,p=>conditionFromFatigue(p.fatigue)),readiness,morale:mean(xi,p=>p.morale),form:mean(xi,p=>p.form),
  ovr:slots.length?Number((slots.reduce((sum,slot)=>{const p=players.find(p=>p.id===tactic.assignments[slot]);return sum+(p?effectiveOVR(p,slot):1);},0)/slots.length).toFixed(1)):0};
}
export function trainingRecovery(game:GameState) {
 const fixture=currentFixture(game);
 const previousDate=[...game.fixtures].filter(f=>f.played&&(f.home===game.club.id||f.away===game.club.id)).sort((a,b)=>b.date.localeCompare(a.date))[0]?.date??`${game.season.slice(0,4)}-07-13`;
 const from=new Date(`${previousDate}T12:00:00Z`).getTime(),to=new Date(`${fixture?.date??game.date}T12:00:00Z`).getTime();
 const gap=fixture&&Number.isFinite(from)&&Number.isFinite(to)?Math.max(0,Math.round((to-from)/86400000)):7;
 return naturalRecoveryForGap(gap,game.club.tier);
}
// This is the existing applyTraining calculation, shared with its preview.
// No effects, regeneration rates, risk curves or selection rules are changed.
export function projectTraining(game:GameState, sessions:TrainingSession[]=game.training.sessions) {
 const effect=evaluateMicrocycle(sessions), recovery=trainingRecovery(game);
 const players=game.players.map(player=>{
  const recovered=Math.max(0,player.fatigue-recovery-((player.injuryWeeks??0)>0?3:0));
  if((player.injuryWeeks??0)>0)return {...player,fatigue:recovered};
  return {...player,fatigue:Math.max(0,Math.min(100,recovered+effect.fatigueDelta)),morale:Math.max(0,Math.min(100,player.morale+effect.moraleDelta)),form:Math.max(0,Math.min(100,player.form+effect.formDelta+(player.age<=21?effect.youthFormDelta:0)))};
 });
 const plan=TEAM_PLANS[game.teamPlan]??TEAM_PLANS.STRONGEST,formation=plan.formation as keyof typeof FORMATIONS;
 const tactic={...game.tactic,...plan.tactic,formation,assignments:selectLineupForPlan(players,FORMATIONS[formation],TEAM_PLANS[game.teamPlan]?game.teamPlan:'STRONGEST')} as Tactic;
 const readiness=capReadiness(game.training.readiness,effect.readinessGain,game.environment.readinessCap);
 return {players,tactic,policy:plan.policy,effect,recovery,synergy:trainingTacticSynergy(sessions,tactic,game.teamPlan),
  before:trainingMetrics(game.players,game.tactic,game.training.readiness),after:trainingMetrics(players,tactic,readiness)};
}
function presetProjections(game:GameState){return Object.keys(TRAINING_PRESETS).map(id=>({id,...projectTraining(game,trainingPresetSessions(game.environment.trainingSessions,id))}));}
function preparedPreset(game:GameState){return presetProjections(game).sort((a,b)=>b.synergy.shortTerm-a.synergy.shortTerm||b.effect.readinessGain-a.effect.readinessGain||a.effect.fatigueDelta-b.effect.fatigueDelta||(a.id<b.id?-1:a.id>b.id?1:0))[0];}
export function diagnoseTrainingWeek(game:GameState):WeekDiagnosis {
 const fixture=currentFixture(game),current=trainingMetrics(game.players,game.tactic,game.training.readiness),environment=playingEnvironment(game.club.tier);
 if(!fixture)return {kind:'none',title:'Brak pilnego problemu',evidence:'Nie ma kolejnego ligowego spotkania w aktualnym terminarzu.'};
 const natural=projectTraining(game,[]).after;
 const selected=new Set(Object.values(game.tactic.assignments));
 const tired=game.players.filter(p=>selected.has(p.id)&&conditionFromFatigue(p.fatigue)<environment.comfortableCondition-6).length;
 if(current.condition<environment.comfortableCondition-6||tired>=3||natural.condition<environment.comfortableCondition)
  return {kind:'condition',title:'Kondycja',evidence:`Kondycja XI ${current.condition}% • ${conditionStatus(current.condition)}. ${tired} zawodników XI wyraźnie poniżej komfortowej gotowości. Po samej regeneracji prognoza XI: ${natural.condition}%; komfort w środowisku ${environment.label.toLowerCase()}: ${environment.comfortableCondition}%.`};
 if(current.readiness<72)return {kind:'readiness',title:'Gotowość',evidence:`Gotowość ${current.readiness}% — poniżej 72% przygotowania taktycznego. Kondycja XI ${current.condition}% • ${conditionStatus(current.condition)}.`};
 const opponent=teamForId(game,fixture.home===game.club.id?fixture.away:fixture.home);
 if(opponent&&opponent.ovr-current.ovr>=4)return {kind:'opponent',title:'Silniejszy rywal',evidence:`Nasza XI ${current.ovr} OVR, ${opponent.name} ${opponent.ovr} OVR. Potrzebujemy przygotowania do spotkania z mocniejszym zespołem.`};
 const presets=presetProjections(game),maximum=Math.max(...presets.map(p=>p.synergy.shortTerm)),minimum=Math.min(...presets.map(p=>p.synergy.shortTerm));
 if(maximum>0&&maximum-minimum>=.1){
  const prepared=preparedPreset(game),focuses=[...new Set(trainingPresetSessions(game.environment.trainingSessions,prepared.id).map(s=>s.focus))];
  return {kind:'plan',title:'Plan wymagający przygotowania',evidence:`Plan „${TEAM_PLANS[game.teamPlan]?.label??TEAM_PLANS.STRONGEST.label}”: mikrocykl „${TRAINING_PRESETS[prepared.id].label}” ma rzeczywistą dodatnią synergię z jego instrukcjami. Akcenty tego wariantu: ${focuses.join(', ')}.`};
 }
 return {kind:'none',title:'Brak pilnego problemu',evidence:`Kondycja XI ${current.condition}% • ${conditionStatus(current.condition)}, gotowość ${current.readiness}%. ${opponent?`Rywal ${opponent.name}: ${opponent.ovr} OVR; nasza XI: ${current.ovr} OVR.`:'Brak danych OVR najbliższego rywala.'}`};
}
export function trainingWeekOptions(game:GameState, diagnosis=diagnoseTrainingWeek(game)) {
 let ids:string[];
 if(diagnosis.kind==='condition')ids=['RECOVERY','BALANCED'];
 else if(diagnosis.kind==='readiness'||diagnosis.kind==='opponent')ids=['OPPONENT','RECOVERY'];
 else if(diagnosis.kind==='plan'){const prepared=preparedPreset(game).id;ids=[prepared,game.teamPlan==='YOUTH'&&prepared!=='YOUTH'?'YOUTH':prepared==='RECOVERY'?'BALANCED':'RECOVERY'];}
 else ids=['BALANCED','YOUTH'];
 return ids.map(id=>({id,label:TRAINING_PRESETS[id].label,description:TRAINING_PRESETS[id].description,...projectTraining(game,trainingPresetSessions(game.environment.trainingSessions,id))}));
}
export function chosenTrainingLabel(game:GameState) {
 const id=game.training.preset;
 if(!id||!TRAINING_PRESETS[id])return 'Własny mikrocykl';
 const preset=trainingPresetSessions(game.environment.trainingSessions,id);
 return preset.length===game.training.sessions.length&&preset.every((s,i)=>s.focus===game.training.sessions[i].focus&&s.intensity===game.training.sessions[i].intensity)?TRAINING_PRESETS[id].label:'Własny mikrocykl';
}
