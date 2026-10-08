import test from 'node:test';
import assert from 'node:assert/strict';
import { conditionFromFatigue, conditionStatus, conditionAdvice, playingEnvironment, liveOVR, effectiveOVR, injuryRiskFromFatigue, naturalRecoveryForGap, playerAvailable, selectLineupForPlan, evaluateMicrocycle, defaultMicrocycle } from '../lib/game-rules.mjs';
import { pressingFatigueCost } from '../lib/pressing.mjs';
import { overloadIssue } from '../lib/player-overload.mjs';
import { createGame, skillSet } from '../app/game-engine.ts';
import { gameActions } from '../app/game-actions.ts';
import { LEAGUE_PACKS } from '../app/game-data.ts';
import { encodeSave } from '../lib/save-codec.mjs';
import { readCareer } from '../app/save-storage.ts';
const player=(condition,ovr=60,id='p')=>({id,name:'Piotr Testowy',primary:'N',secondary:[],age:27,baseOVR:ovr,form:50,morale:50,relation:50,fatigue:100-condition,injuryWeeks:0,absenceRounds:0});
function action(g,name,...args){let next=g;gameActions(g,value=>next=value,()=>{})[name](...args);return next;}
function start(tier){
 const pack=LEAGUE_PACKS.find(p=>p.tier===tier&&p.teams.length%2===0);
 const license=tier<=3?'UEFA PRO':tier<=6?'UEFA A':'Grassroots C';
 const g=createGame({name:`Balans kondycji ${tier}`,age:42,region:'Śląskie',playingExperience:'Zawodowiec',coachingExperience:'Ponad 10 lat',profile:'Mentor',license,...skillSet('Mentor','Zawodowiec','Ponad 10 lat')},pack,pack.teams[0],['analysis','tactics']);
 g.players=g.players.map(p=>({...p,fatigue:10}));g.inbox=[];return g;
}
function finish(g){for(let i=0;i<30&&!g.matchState.completed;i++){
 const m=g.matchState;if(m.activeMomentId){const e=m.coachMoments.find(e=>e.id===m.activeMomentId);g=action(g,'resolveMatchMoment',e.id,e.choices.find(c=>c.fatigue===0)?.id??e.choices[0].id);}else g=action(g,'advanceMatch');
 }assert.ok(g.matchState.completed);return g;}

test('jedna kondycja wyznacza sześć etykiet; OVR maleje nieliniowo i nie blokuje występu',()=>{
 for(const [c,label] of [[100,'Świeży'],[90,'Świeży'],[89,'Gotowy'],[80,'Gotowy'],[79,'Obciążony'],[70,'Obciążony'],[69,'Zmęczony'],[60,'Zmęczony'],[59,'Bardzo zmęczony'],[50,'Bardzo zmęczony'],[49,'Skrajnie zmęczony'],[0,'Skrajnie zmęczony']])assert.equal(conditionStatus(c),label);
 const ratings=[95,75,60,50].map(c=>effectiveOVR(player(c),'N'));for(let i=1;i<ratings.length;i++)assert.ok(ratings[i-1]>ratings[i]);
 assert.ok(liveOVR(player(60))-liveOVR(player(50))>liveOVR(player(95))-liveOVR(player(85)));
 assert.equal(liveOVR(player(95)),60);assert.equal(liveOVR(player(0)),27);
 for(const c of [50,55,59])assert.ok(playerAvailable(player(c)));
 const strong=player(55,65,'strong');const fresh=player(95,60,'fresh');
 assert.equal(selectLineupForPlan([strong,fresh],['N'],'STRONGEST').N,'fresh');
 assert.equal(selectLineupForPlan([strong],['N'],'STRONGEST').N,'strong');
});

test('ryzyko urazu stopniowo rośnie wcześniej; intensywność pozostaje istotna i ryzyko ma limit',()=>{
 for(const intensity of ['Niska','Normalna','Wysoka']){
  let previous=0;for(let fatigue=0;fatigue<=100;fatigue++){
   const risk=injuryRiskFromFatigue(fatigue,intensity);assert.ok(risk>=previous&&risk<=.18);previous=risk;
  }
 }
 assert.ok(injuryRiskFromFatigue(5)<.01);
 for(const c of [80,70,60,50])assert.ok(injuryRiskFromFatigue(100-c)>injuryRiskFromFatigue(100-c-10));
 assert.ok(injuryRiskFromFatigue(40,'Wysoka')>injuryRiskFromFatigue(40,'Normalna'));
});

test('profesjonalizacja różnicuje mecz, regenerację i komunikat gotowości; pressing zachowuje własny koszt',()=>{
 assert.ok(playingEnvironment(2).matchFatigue<playingEnvironment(5).matchFatigue);assert.ok(playingEnvironment(5).matchFatigue<playingEnvironment(9).matchFatigue);
 assert.ok(naturalRecoveryForGap(7,2)>naturalRecoveryForGap(7,5));assert.ok(naturalRecoveryForGap(7,5)>naturalRecoveryForGap(7,9));
 assert.deepEqual([2,5,9].map(t=>playingEnvironment(t).comfortableCondition),[82,78,74]);
 assert.match(conditionAdvice(80,2),/Poniżej/);assert.match(conditionAdvice(80,5),/Komfortowo/);assert.match(conditionAdvice(75,9),/Komfortowo/);
 const high=pressingFatigueCost({high:90,veryHigh:0});const veryHigh=pressingFatigueCost({high:0,veryHigh:90});assert.ok(high>0&&veryHigh>high);
 for(const t of [2,5,9])assert.ok(playingEnvironment(t).matchFatigue+high>playingEnvironment(t).matchFatigue);
 assert.ok(evaluateMicrocycle([{focus:'Regeneracja',intensity:'Niska'}]).fatigueDelta<0);
});

test('GAME-07 dotyczy niepokojącej kondycji, a nowe komunikaty nie eksponują drugiego parametru',()=>{
 const input={clubId:'club',match:1,assignments:{N:'p'}};
 for(const c of [95,85,75,65,60])assert.equal(overloadIssue({...input,players:[player(c)]}),undefined);
 const issue=overloadIssue({...input,players:[player(58)]});assert.equal(issue.targetPlayerId,'p');assert.match(issue.body,/Kondycja 58% • bardzo zmęczony/);assert.doesNotMatch(issue.body,/zmęczenie \d+|fatigue/);
});

test('kilka rzeczywistych tygodni tier 2/5/9 zachowuje zróżnicowanie kadry i zapis nie zmienia kondycji',async()=>{
 const summaries=[];
 for(const tier of [2,5,9]){
  let g=start(tier);const pre=[];const post=[];
  for(let week=0;week<8;week++){
   for(const e of g.inbox.filter(e=>!e.resolved))g=action(g,'resolveDecision',e.id,e.choices[0].id);
   g=action(g,'applyTraining');pre.push(g.players.reduce((sum,p)=>sum+conditionFromFatigue(p.fatigue),0)/g.players.length);
   g=action(g,'prepareMatch');g=finish(g);post.push(g.players.reduce((sum,p)=>sum+conditionFromFatigue(p.fatigue),0)/g.players.length);
   assert.ok(g.players.some(p=>conditionFromFatigue(p.fatigue)<100));assert.ok(g.players.some(p=>conditionFromFatigue(p.fatigue)>50));
   const loaded=await readCareer(await encodeSave(g));assert.deepEqual(loaded.players,JSON.parse(JSON.stringify(g.players)));g=loaded;
  }
  const mean=post.reduce((a,b)=>a+b)/post.length;assert.ok(mean>55&&mean<98,`${tier}: ${mean}`);
  summaries.push({tier,pre:pre.map(Math.round),post:post.map(Math.round)});
 }
 console.log('GAME-08A tygodnie:',JSON.stringify(summaries));
});

test('rzeczywisty koniec identycznego meczu stosuje niższy bazowy koszt profesjonalisty',()=>{
 let prepared=action(action(start(2),'applyTraining'),'prepareMatch');
 // Skip coach moments only in this controlled fixture to isolate the environment cost.
 prepared={...prepared,matchState:{...prepared.matchState,coachMoments:[],coachFatigue:0,minute:75}};
 const ids=new Set(Object.values(prepared.tactic.assignments));const deltas=[];
 for(const tier of [2,5,9]){
  const g={...structuredClone(prepared),club:{...prepared.club,tier}};const done=action(g,'advanceMatch');
  const starter=g.players.find(p=>ids.has(p.id));deltas.push(done.players.find(p=>p.id===starter.id).fatigue-starter.fatigue);
 }
 assert.ok(deltas[0]<deltas[1]&&deltas[1]<deltas[2]);
});
