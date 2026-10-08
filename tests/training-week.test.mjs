import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnoseTrainingWeek, trainingWeekOptions, projectTraining, trainingMetrics, trainingRecovery, chosenTrainingLabel } from '../app/training-week.ts';
import { gameActions } from '../app/game-actions.ts';
import { createGame, skillSet, currentFixture } from '../app/game-engine.ts';
import { LEAGUE_PACKS, FORMATIONS, TEAM_PLANS, TRAINING_PRESETS, evaluateMicrocycle, trainingPresetSessions, trainingTacticSynergy, capReadiness, selectLineupForPlan, naturalRecoveryForGap } from '../app/game-data.ts';
import { readCareer } from '../app/save-storage.ts';
import { encodeSave } from '../lib/save-codec.mjs';
function start(tier=5,condition=85,readiness=80,opponentOVR=50){
 const pack=LEAGUE_PACKS.find(p=>p.tier===tier&&p.teams.length%2===0);
 const g=createGame({name:`Tydzień ${tier}`,age:42,region:'Śląskie',playingExperience:'Zawodowiec',coachingExperience:'Ponad 10 lat',profile:'Mentor',license:'UEFA PRO',...skillSet('Mentor','Zawodowiec','Ponad 10 lat')},pack,pack.teams[0],['analysis','tactics']);
 g.inbox=[];g.players=g.players.map(p=>({...p,baseOVR:52,potential:70,fatigue:100-condition,form:50,morale:50,relation:50}));
 g.training={...g.training,readiness};g.tactic.assignments=selectLineupForPlan(g.players,FORMATIONS[g.tactic.formation],g.teamPlan);
 const fixture=currentFixture(g);g.fixtures=g.fixtures.map(f=>({...f,date:f.round===1?'2026-07-20':f.date}));
 const id=fixture.home===g.club.id?fixture.away:fixture.home;g.teams=g.teams.map(t=>t.id===id?{...t,ovr:opponentOVR}:t);
 return g;
}
function act(g,name,...args){let next=g;gameActions(g,value=>next=value,()=>{})[name](...args);return next;}
function setPlan(g,id){const p=TEAM_PLANS[id];return {...g,teamPlan:id,squadPolicy:p.policy,tactic:{...g.tactic,...p.tactic,formation:p.formation,assignments:selectLineupForPlan(g.players,FORMATIONS[p.formation],id)}};}

test('jedna diagnoza z rzeczywistych danych: kondycja > gotowość > rywal; te same dane dają ten sam wynik',()=>{
 const examples=[[start(5,64,50,80),'condition'],[start(5,90,50,80),'readiness'],[start(5,90,80,65),'opponent']];
 for(const [g,kind] of examples){const before=JSON.stringify(g);const d=diagnoseTrainingWeek(g);assert.equal(d.kind,kind);assert.deepEqual(diagnoseTrainingWeek(structuredClone(g)),d);assert.equal(JSON.stringify(g),before);assert.doesNotMatch(d.evidence,/słabe sektory|styl gry|pressing rywala|skrzydła rywala/);}
 assert.match(examples[0][0]&&diagnoseTrainingWeek(examples[0][0]).evidence,/Kondycja XI 64%/);
 const g=examples[2][0],d=diagnoseTrainingWeek(g);assert.match(d.evidence,/65 OVR/);assert.match(d.evidence,new RegExp(String(trainingMetrics(g.players,g.tactic,g.training.readiness).ovr)));
 const f=currentFixture(g),id=f.home===g.club.id?f.away:f.home;assert.match(d.evidence,new RegExp(g.teams.find(t=>t.id===id).name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 const changed={...g,teams:g.teams.map(t=>t.id===id?{...t,ovr:40}:t)};assert.equal(diagnoseTrainingWeek(changed).kind,'none');
});

test('diagnoza korzysta z progów środowiska GAME-08A i faktycznej synergii planu',()=>{
 assert.equal(diagnoseTrainingWeek(start(2,75,80,40)).kind,'condition');assert.equal(diagnoseTrainingWeek(start(9,75,80,40)).kind,'none');
 const g=setPlan(start(5,90,80,40),'PRESS');assert.equal(diagnoseTrainingWeek(g).kind,'plan');assert.match(diagnoseTrainingWeek(g).evidence,/Odbiór wysoko/);
 const noMatch={...g,fixtures:g.fixtures.map(f=>({...f,played:true}))};assert.equal(diagnoseTrainingWeek(noMatch).kind,'none');
});

test('dokładnie dwa istniejące presety; prognozy i synergia wynikają z istniejących funkcji, kompromisy są różne',()=>{
 for(const tier of [2,5,9])for(const g of [start(tier,64,80,50),start(tier,90,50,50),start(tier,85,80,65),setPlan(start(tier,90,80,40),'YOUTH'),start(tier,90,80,40)]){
  const options=trainingWeekOptions(g);assert.equal(options.length,2);assert.notEqual(options[0].id,options[1].id);
  for(const p of options){assert.ok(TRAINING_PRESETS[p.id]);const sessions=trainingPresetSessions(g.environment.trainingSessions,p.id);assert.deepEqual(p.effect,evaluateMicrocycle(sessions));
   assert.equal(p.after.readiness,capReadiness(g.training.readiness,p.effect.readinessGain,g.environment.readinessCap));
   assert.deepEqual(p.synergy,trainingTacticSynergy(sessions,p.tactic,g.teamPlan));
   assert.deepEqual(p.after,trainingMetrics(p.players,p.tactic,p.after.readiness));
  }
  assert.notDeepEqual([options[0].after,options[0].effect,options[0].synergy],[options[1].after,options[1].effect,options[1].synergy]);
 }
 const [a,b]=trainingWeekOptions(start(5,64,80,50));assert.ok(a.after.condition>b.after.condition);assert.ok(a.after.readiness<b.after.readiness);
 const [c,d]=trainingWeekOptions(start(5,85,50,50));assert.ok(c.after.readiness>d.after.readiness);assert.ok(c.after.condition<d.after.condition);
});

test('projekcja zachowuje dawną mechanikę treningu, regenerację, urazy i dobór XI, także przy limitach',()=>{
 for(const tier of [2,5,9])for(const id of Object.keys(TRAINING_PRESETS)){
  let g=start(tier,65,80,50);g.players=g.players.map((p,i)=>({...p,fatigue:i%2?5:60,morale:i%3?99:20,form:i%4?99:20,injuryWeeks:i===0?2:0,absenceRounds:i===3?1:0}));
  const sessions=trainingPresetSessions(g.environment.trainingSessions,id),e=evaluateMicrocycle(sessions),recovery=naturalRecoveryForGap(7,tier);
  assert.equal(trainingRecovery(g),recovery);
  const players=g.players.map(p=>{const recovered=Math.max(0,p.fatigue-recovery-((p.injuryWeeks??0)>0?3:0));return p.injuryWeeks>0?{...p,fatigue:recovered}:{...p,fatigue:Math.max(0,Math.min(100,recovered+e.fatigueDelta)),morale:Math.max(0,Math.min(100,p.morale+e.moraleDelta)),form:Math.max(0,Math.min(100,p.form+e.formDelta+(p.age<=21?e.youthFormDelta:0)))};});
  const predicted=projectTraining(g,sessions);assert.deepEqual(predicted.players,players);
  assert.deepEqual(predicted.tactic.assignments,selectLineupForPlan(players,FORMATIONS[g.tactic.formation],g.teamPlan));
 }
});

test('wykonanie presetu i własnego mikrocyklu zapisuje faktyczny efekt, bez zaliczania celów; save/load działa',async()=>{
 for(const custom of [false,true]){
  let g=start(5,64,60,60);g.training={...g.training,preset:custom?'CUSTOM':'OPPONENT',sessions:trainingPresetSessions(g.environment.trainingSessions,'OPPONENT')};
  if(custom)g.training.sessions[0]={...g.training.sessions[0],focus:'Atmosfera'};
  const projected=projectTraining(g),beforeGoals=structuredClone(g.developmentGoals),beforeEvidence=structuredClone(g.seasonEvidence);
  const actual=act(g,'applyTraining');assert.deepEqual(actual.players,projected.players);assert.deepEqual(actual.tactic,projected.tactic);assert.deepEqual(actual.training.weekSummary.before,projected.before);assert.deepEqual(actual.training.weekSummary.after,trainingMetrics(actual.players,actual.tactic,actual.training.readiness));
  assert.equal(actual.training.weekSummary.chosen,custom?'Własny mikrocykl':'Pod rywala');assert.equal(actual.training.weekSummary.diagnosis.kind,'condition');
  assert.deepEqual(actual.developmentGoals,beforeGoals);assert.deepEqual(actual.seasonEvidence,beforeEvidence);
  assert.deepEqual(act(actual,'applyTraining'),actual);
  const loaded=await readCareer(await encodeSave(actual));assert.deepEqual(loaded.training.weekSummary,actual.training.weekSummary);assert.deepEqual(loaded.players,actual.players);
 }
 const legacy=start();delete legacy.training.weekSummary;assert.equal((await readCareer(await encodeSave(legacy))).training.weekSummary,undefined);
});

test('stary preset z edytowanymi sesjami ma uczciwą nazwę; prawdziwy preset i własny cykl są rozróżniane',()=>{
 const g=start();assert.equal(chosenTrainingLabel(g),'Zrównoważony');g.training.sessions[0]={...g.training.sessions[0],focus:'Atmosfera'};assert.equal(chosenTrainingLabel(g),'Własny mikrocykl');g.training.preset='CUSTOM';assert.equal(chosenTrainingLabel(g),'Własny mikrocykl');
});

test('wybór rekomendacji nie zalicza Analizy; działa dopiero mecz z faktyczną reakcją po 30. minucie',()=>{
 function play(react){let g=start(5,85,60,70);const option=trainingWeekOptions(g).find(p=>p.id==='OPPONENT');g={...g,training:{...g.training,preset:option.id,sessions:trainingPresetSessions(g.environment.trainingSessions,option.id)}};
  assert.equal(g.seasonEvidence.analysisRounds.length,0);g=act(g,'applyTraining');assert.equal(g.seasonEvidence.analysisRounds.length,0);g=act(g,'prepareMatch');
  let reacted=false;for(let step=0;step<35&&!g.matchState.completed;step++){
   const m=g.matchState;if(react&&m.minute>=30&&!m.activeMomentId&&!reacted){g=act(g,'changeLiveInstruction','pressing',g.tactic.pressing==='Niski'?'Średni':'Niski');reacted=true;continue;}
   if(m.activeMomentId){const issue=m.coachMoments.find(e=>e.id===m.activeMomentId);g=act(g,'resolveMatchMoment',issue.id,issue.choices[0].id);}else g=act(g,'advanceMatch');
  }assert.ok(g.matchState.completed);return g;
 }
 const without=play(false); // Existing match moments can themselves register a real analysis reaction.
 assert.equal(without.seasonEvidence.analysisRounds.length,without.matchState.analysisAttempted?1:0);
 const withReaction=play(true);assert.equal(withReaction.seasonEvidence.analysisRounds.length,1);assert.equal(withReaction.developmentGoals.find(g=>g.id==='analysis').progress,1);assert.equal(withReaction.training.weekSummary,undefined);
});

test('UI pokazuje diagnozę i dwa warianty, pozostawia pięć presetów/edycję, rzeczywisty wynik na pulpicie',async()=>{
 const {createServer}=await import('vite');const React=await import('react');const {default:TestRenderer,act:reactAct}=await import('react-test-renderer');
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;const root=new URL('../',import.meta.url).pathname;
 const vite=await createServer({appType:'custom',configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true,hmr:false}});let renderer;
 try{
  const {Training,Dashboard}=await vite.ssrLoadModule('/app/game-screens.tsx');let game=start(5,64,60,60),screen='training';
  function Wrapper(){const [g,setG]=React.useState(game);game=g;const actions=gameActions(g,setG,s=>screen=s);return screen==='training'?React.createElement(Training,{game:g,setGame:setG,applyTraining:actions.applyTraining}):React.createElement(Dashboard,{game:g,go(){},resolveDecision:actions.resolveDecision,prepareMatch:actions.prepareMatch,beginNextSeason:actions.beginNextSeason});}
  await reactAct(async()=>renderer=TestRenderer.create(React.createElement(Wrapper)));
  assert.equal(renderer.root.findAll(n=>n.type==='article'&&n.props['data-training-option']).length,2);
  const presets=()=>renderer.root.findAll(n=>n.type==='button'&&String(n.props.className).includes('training-preset'));
  assert.equal(presets().length,5);
  for(const id of Object.keys(TRAINING_PRESETS)){
   const button=presets().find(b=>b.findAllByType('strong').some(n=>n.children.join('')===TRAINING_PRESETS[id].label));await reactAct(async()=>button.props.onClick());
   assert.equal(game.training.preset,id);assert.deepEqual(game.training.sessions,trainingPresetSessions(game.environment.trainingSessions,id));assert.equal(game.seasonEvidence.analysisRounds.length,0);
  }
  const normal=renderer.root.findAllByType('button').find(b=>b.children.join('')==='Normalna');await reactAct(async()=>normal.props.onClick());assert.equal(game.training.preset,'CUSTOM');
  const json=JSON.stringify(renderer.toJSON());assert.match(json,/PRIORYTET TYGODNIA/);assert.match(json,/Własny mikrocykl/);assert.doesNotMatch(json,/NAJLEPSZY/);
  const apply=renderer.root.findAllByType('button').find(b=>b.children.includes('Zrealizuj cały mikrocykl'));await reactAct(async()=>apply.props.onClick());
  assert.equal(screen,'dashboard');const result=JSON.stringify(renderer.toJSON());assert.match(result,/Problem tygodnia:/);assert.match(result,/Rzeczywisty efekt:/);assert.match(result,/Własny mikrocykl/);
 }finally{if(renderer)await reactAct(async()=>renderer.unmount());await vite.close();delete globalThis.IS_REACT_ACT_ENVIRONMENT;}
});
