import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {mentalityProfile,mentalityForMatch,mentalityAdvice,mentalityScore} from '../lib/match-mentality.mjs';
import {simulateMatchPlan} from '../lib/game-rules.mjs';
import {accruePressing} from '../lib/pressing.mjs';
import {gameActions,migrateGame} from '../app/game-actions.ts';
import {createGame,skillSet} from '../app/game-engine.ts';
import {LEAGUE_PACKS} from '../app/game-data.ts';
import {encodeSave,decodeSave} from '../lib/save-codec.mjs';
import {simulateMentalities} from '../scripts/mentality-simulation.mjs';
function act(g,name,...args){let out=g;gameActions(g,next=>out=next,()=>{})[name](...args);return out;}
function start(){
 const pack=LEAGUE_PACKS.find(p=>p.competition==='Klasa B');
 let g=createGame({name:'Mentalność',age:35,region:'Dolnośląskie',playingExperience:'Amator',coachingExperience:'Debiutant',profile:'Mentor',license:'Grassroots C',...skillSet('Mentor','Amator','Debiutant')},pack,pack.teams[0],['analysis','tactics']);
 g=act(g,'applyTraining');g=act(g,'prepareMatch');return {...g,matchState:{...g.matchState,coachMoments:[]}};
}
function at(g,minute){return {...g,matchState:{...g.matchState,minute,lastInstructionMinute:undefined,pressingExposure:accruePressing(g.matchState.pressingExposure,g.tactic.pressing,minute)}};}
function expected(g){const m=g.matchState;return simulateMatchPlan(m.simulationSeed,m.homeStrength,m.awayStrength,undefined,undefined,mentalityForMatch(m,g.club.id,g.tactic.mentality));}
function near(a,b){assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);}

test('niezależny profil obu ataków: kierunek, wynik, płynny czas i wyjazd',()=>{
 for(const minute of [0,15,30,70,80,90])for(const balance of [-2,-1,0,1,2])for(const home of [true,false]){
  const n=mentalityProfile('Zrównoważona',minute,balance,home),o=mentalityProfile('Ofensywna',minute,balance,home),d=mentalityProfile('Defensywna',minute,balance,home);
  for(const side of ['homeAttack','awayAttack']){assert.equal(n[side],1);assert.ok(o[side]>1);assert.ok(d[side]<1);assert.ok(d[side]>=.45);assert.ok(o[side]<=1.65);}
  assert.deepEqual(mentalityProfile('Ofensywna',minute,balance,!home),{homeAttack:o.awayAttack,awayAttack:o.homeAttack,afterMinute:minute});
 }
 const late=mentalityProfile('Ofensywna',80,-1),early=mentalityProfile('Ofensywna',15,-1);
 assert.ok(late.homeAttack>early.homeAttack);assert.ok(late.awayAttack>early.awayAttack);
 assert.ok(mentalityProfile('Ofensywna',80,1).awayAttack>late.awayAttack);
 assert.ok(mentalityProfile('Defensywna',80,1).awayAttack<mentalityProfile('Defensywna',80,-1).awayAttack);
 near(mentalityProfile('Ofensywna',75,-1).homeAttack-mentalityProfile('Ofensywna',74,-1).homeAttack,mentalityProfile('Ofensywna',76,-1).homeAttack-mentalityProfile('Ofensywna',75,-1).homeAttack);
});

test('stare wywołania silnika zachowują dokładnie 1000 wyników sprzed GAME-09',()=>{
 const fixture=JSON.parse(readFileSync(new URL('./fixtures/match-pre-game09.json',import.meta.url)));const h=createHash('sha256');
 for(let i=1;i<=fixture.states;i++){
  const args=[i*2654435761>>>0,20+i%71,20+(i*7)%71,'A','B'];const result=simulateMatchPlan(...args);
  h.update(JSON.stringify(result)+'\n');assert.deepEqual(simulateMatchPlan(...args,{}),result);assert.deepEqual(simulateMatchPlan(...args,mentalityProfile('Zrównoważona',60,-1)),result);
 }
 assert.equal(h.digest('hex'),fixture.sha256);
});

test('sam silnik zachowuje wszystkie zdarzenia do minuty korekty',()=>{
 for(let seed=1;seed<=250;seed++)for(const minute of [15,60,70,80]){
  const base=simulateMatchPlan(seed,52,52);for(const mentality of ['Ofensywna','Defensywna']){
   const sim=simulateMatchPlan(seed,52,52,undefined,undefined,mentalityProfile(mentality,minute,-1));
   assert.deepEqual(sim.events.filter(e=>e.minute<=minute),base.events.filter(e=>e.minute<=minute));
   assert.equal(sim.seed,base.seed);assert.equal(sim.possessionHome,base.possessionHome);
  }
 }
});

test('mentalność widzi wyłącznie rzeczywisty wynik, nigdy końcowe liczniki lub przyszłe gole',()=>{
 const m={fixture:{home:'club',away:'other'},minute:70,homeGoals:50,awayGoals:90,plannedEvents:[{minute:25,kind:'goal',side:'away'},{minute:80,kind:'goal',side:'home'},{minute:90,kind:'goal',side:'away'}]};
 assert.deepEqual(mentalityScore(m,'club'),{userHome:true,own:0,opponent:1,balance:-1});
 const profile=mentalityForMatch(m,'club','Ofensywna');
 assert.deepEqual(mentalityForMatch({...m,homeGoals:0,awayGoals:0,plannedEvents:m.plannedEvents.slice(0,1)},'club','Ofensywna'),profile);
 assert.match(mentalityAdvice(m,'club','Ofensywna'),/70' • przegrywamy 0:1/);
 assert.match(mentalityAdvice({...m,minute:80,plannedEvents:[{minute:20,kind:'goal',side:'home'}]},'club','Defensywna'),/prowadzimy 1:0.*kosztem własnych okazji/);
});

test('live: bez kumulowania siły, powrót do neutralnej, zachowana przeszłość i koszt pressingu',()=>{
 const base=at(start(),60);let g=base;
 for(const [minute,value] of [[60,'Ofensywna'],[63,'Defensywna'],[66,'Ofensywna'],[69,'Zrównoważona']]){
  g=at(g,minute);const past=g.matchState.plannedEvents.filter(e=>e.minute<=minute),exposure=g.matchState.pressingExposure,pressure=g.pressures.personal;
  const old=g;g=act(g,'changeLiveInstruction','mentality',value);
  assert.equal(g.matchState.homeStrength,base.matchState.homeStrength);assert.equal(g.matchState.awayStrength,base.matchState.awayStrength);
  assert.deepEqual(g.matchState.plannedEvents.filter(e=>e.minute<=minute),past);assert.deepEqual(g.matchState.pressingExposure,exposure);
  near(g.matchState.homeXg,expected(g).homeXg);near(g.matchState.awayXg,expected(g).awayXg);
  assert.equal(act(g,'changeLiveInstruction','mentality',value==='Ofensywna'?'Defensywna':'Ofensywna'),g);
  assert.deepEqual(act(old,'changeLiveInstruction','mentality',value),g);
  if(value==='Ofensywna')assert.equal(g.pressures.personal,Math.min(100,pressure+2));
 }
 const neutral=simulateMatchPlan(g.matchState.simulationSeed,g.matchState.homeStrength,g.matchState.awayStrength);
 near(g.matchState.homeXg,neutral.homeXg);near(g.matchState.awayXg,neutral.awayXg);
 assert.deepEqual(g.matchState.plannedEvents.filter(e=>e.minute>69).map(({text,...e})=>e),neutral.events.filter(e=>e.minute>69).map(({text,...e})=>e));
});

test('zmiana pressingu zachowuje aktualny profil mentalności; koszt fizyczny pozostaje domeną GAME-02',()=>{
 for(const mentality of ['Defensywna','Ofensywna']){
  let g=act(at(start(),60),'changeLiveInstruction','mentality',mentality);g=at(g,63);
  const n=act(g,'changeLiveInstruction','pressing','Bardzo wysoki');
  assert.equal(n.tactic.mentality,mentality);near(n.matchState.homeXg,expected(n).homeXg);near(n.matchState.awayXg,expected(n).awayXg);
  assert.deepEqual(n.matchState.pressingExposure,g.matchState.pressingExposure);
  assert.deepEqual(n.players,g.players);
 }
});

test('coachMoment stosuje profil bieżącej mentalności, zachowuje przeszłość i własny efekt',()=>{
 for(const mentality of ['Defensywna','Ofensywna']){
  let g=act(at(start(),60),'changeLiveInstruction','mentality',mentality);g=at(g,70);
  const choice={id:'choice',label:'Decyzja',preview:'',strength:.3,fatigue:1,morale:1,pressure:1};const moment={id:'moment',minute:70,title:'Test',body:'Test',choices:[choice]};
  g={...g,matchState:{...g.matchState,activeMomentId:'moment',coachMoments:[moment]}};
  const n=act(g,'resolveMatchMoment','moment','choice');
  assert.equal(n.tactic.mentality,mentality);assert.ok(n.matchState.coachImpact!==0);assert.equal(n.matchState.coachFatigue,1);
  near(n.matchState.homeXg,expected(n).homeXg);near(n.matchState.awayXg,expected(n).awayXg);
  assert.deepEqual(n.matchState.plannedEvents.filter(e=>e.minute<70),g.matchState.plannedEvents.filter(e=>e.minute<70));assert.deepEqual(n.matchState.pressingExposure,g.matchState.pressingExposure);
 }
});

test('save/load w trakcie meczu zachowuje profil i deterministyczną kolejną decyzję; stare zapisy działają',async()=>{
 let g=act(at(start(),60),'changeLiveInstruction','mentality','Ofensywna');g=at(g,75);
 const loaded=migrateGame(await decodeSave(await encodeSave(g)));
 assert.equal(JSON.stringify(loaded.matchState),JSON.stringify(g.matchState));assert.equal(loaded.tactic.mentality,'Ofensywna');
 const a=act(g,'changeLiveInstruction','mentality','Defensywna'),b=act(loaded,'changeLiveInstruction','mentality','Defensywna');
 assert.deepEqual(JSON.parse(JSON.stringify(a.matchState)),JSON.parse(JSON.stringify(b.matchState)));assert.deepEqual(a.matchState.plannedEvents,b.matchState.plannedEvents);assert.deepEqual(a.players,b.players);
 assert.equal(act(at(migrateGame(JSON.parse(JSON.stringify(start()))),15),'changeLiveInstruction','mentality','Defensywna').tactic.mentality,'Defensywna');
});

test('54 000 kontrolowanych symulacji potwierdza obustronny kompromis i ochronę/odrabianie wyniku',()=>{
 const rows=simulateMentalities();
 for(const minute of [30,70,80]){
  const [d,n,o]=rows.filter(r=>r.minute===minute);
  assert.ok(d.goalsFor<n.goalsFor&&n.goalsFor<o.goalsFor);assert.ok(d.goalsAgainst<n.goalsAgainst&&n.goalsAgainst<o.goalsAgainst);
  assert.ok(d.conceded<n.conceded&&n.conceded<o.conceded);
  for(const r of [d,n,o])near(r.win+r.draw+r.loss,100);
  if(minute===70){assert.ok(o.recovered>n.recovered);assert.ok(n.recovered>d.recovered);assert.ok(o.zeroTwo>n.zeroTwo);}
  if(minute===80){assert.ok(d.win>n.win);assert.ok(n.win>o.win);}
 }
});

test('aktywny UI pokazuje faktyczny wynik i kompromis bez zalecania najlepszej mentalności',async()=>{
 const {createServer}=await import('vite');const React=await import('react');const {renderToStaticMarkup}=await import('react-dom/server');const root=new URL('../',import.meta.url).pathname;
 const vite=await createServer({appType:'custom',configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true,hmr:false}});
 try{
  const {MatchV15}=await vite.ssrLoadModule('/app/gameplay-screens.tsx');const noop=()=>{};
  for(const mentality of ['Defensywna','Zrównoważona','Ofensywna']){
   let g=at(start(),70);g={...g,tactic:{...g.tactic,mentality},matchState:{...g.matchState,plannedEvents:[{minute:20,kind:'goal',side:g.matchState.fixture.home===g.club.id?'away':'home',text:'Gol'}]}};
   const html=renderToStaticMarkup(React.createElement(MatchV15,{game:g,go:noop,advanceMatch:noop,prepareMatch:noop,changeLiveInstruction:noop,dismissMatchReport:noop,resolveMatchMoment:noop}));
   assert.match(html,/przegrywamy 0:1/);assert.doesNotMatch(html,/NAJLEPSZ|homeAttack|awayAttack|xG.*1\.4/);
   assert.match(html,mentality==='Ofensywna'?/więcej okazji dla niego/:mentality==='Defensywna'?/kosztem własnych okazji/:/Neutralny balans ryzyka i ataku/);
  }
 }finally{await vite.close();}
});
