import test from 'node:test';
import assert from 'node:assert/strict';
import { pressingStrength, accruePressing, pressingFatigueCost, lineupCondition, pressingAdvice } from '../lib/pressing.mjs';
import { buildMatchStrength } from '../lib/game-rules.mjs';
import { gameActions, migrateGame } from '../app/game-actions.ts';
import { createGame, skillSet } from '../app/game-engine.ts';
import { LEAGUE_PACKS } from '../app/game-data.ts';
import { encodeSave, decodeSave } from '../lib/save-codec.mjs';

function act(g, name, ...args) { let out=g; gameActions(g,next=>out=next,()=>{})[name](...args); return out; }
function start(fatigue=10) {
 const pack=LEAGUE_PACKS.find(p=>p.competition==='Klasa B');
 let g=createGame({name:'Test pressingu',age:35,region:'Dolnośląskie',playingExperience:'Amator',coachingExperience:'Debiutant',profile:'Mentor',license:'Grassroots C',...skillSet('Mentor','Amator','Debiutant')},pack,pack.teams[0],['analysis','tactics']);
 g=act(g,'applyTraining');g={...g,players:g.players.map(p=>({...p,fatigue,injuryWeeks:0,absenceRounds:0}))};g=act(g,'prepareMatch');
 // Isolate pressing from independent coach-moment fatigue choices.
 return {...g,matchState:{...g.matchState,coachMoments:[]}};
}
function play(g, pressing, minutes=90) {
 g=act(g,'changeLiveInstruction','pressing',pressing);
 while(g.matchState.minute<minutes&&!g.matchState.completed) g=act(g,'advanceMatch');
 return g;
}
function finish(g) { while(!g.matchState.completed) g=act(g,'advanceMatch'); return g; }
function starterLoads(before,after) {return Object.values(before.tactic.assignments).map(id=>after.players.find(p=>p.id===id).fatigue-before.players.find(p=>p.id===id).fatigue);}

test('wysoki pressing daje większą korzyść świeżej XI: przygotowanie i zmiana live',()=>{
 for(const pressing of ['Wysoki','Bardzo wysoki']) {
  assert.ok(pressingStrength(pressing,90)>pressingStrength(pressing,50));
  const params={lineupOVR:50,readiness:70,coachTactics:45,averageCondition:90,tactic:{pressing}};
  const gain=c=>buildMatchStrength({...params,averageCondition:c}).total-buildMatchStrength({...params,averageCondition:c,tactic:{pressing:'Średni'}}).total;
  assert.ok(gain(90)>gain(50));
  const delta=f=>{const g=start(f);const n=act(g,'changeLiveInstruction','pressing',pressing);const side=g.matchState.fixture.home===g.club.id?'homeStrength':'awayStrength';return n.matchState[side]-g.matchState[side];};
  assert.ok(delta(10)>delta(50));
  assert.ok(delta(10)>0);
 }
 assert.equal(pressingStrength('Niski',30),0);assert.equal(pressingStrength('Średni',90),0);
});

test('koszt zależy od intensywności, czasu i nie znika po obniżeniu pressingu',()=>{
 const base=start();const low=finish(play(base,'Niski',15));
 const high=finish(play(base,'Wysoki'));const very=finish(play(base,'Bardzo wysoki'));
 const at15=play(base,'Wysoki',15);const short=finish(act(at15,'changeLiveInstruction','pressing','Niski'));
 const at75=play(base,'Wysoki',75);const switched=act(at75,'changeLiveInstruction','pressing','Niski');const long=finish(switched);
 assert.deepEqual(switched.matchState.pressingExposure,{high:75,veryHigh:0,minute:75});
 assert.deepEqual(long.matchState.pressingExposure,{high:75,veryHigh:0,minute:90});
 for(let i=0;i<11;i++) {
  assert.equal(starterLoads(base,high)[i]-starterLoads(base,low)[i],4);
  assert.equal(starterLoads(base,very)[i]-starterLoads(base,low)[i],8);
  assert.equal(starterLoads(base,short)[i]-starterLoads(base,low)[i],1);
  assert.equal(starterLoads(base,long)[i]-starterLoads(base,low)[i],3);
 }
 assert.equal(long.careerStats.matches,1);assert.ok(long.fixtures.some(f=>f.played));
});

test('ekspozycja zachowuje rzeczywisty czas zatrzymania przy sytuacji z ławki',()=>{
 const base=play(start(),'Wysoki',15);
 const choice={id:'neutral',label:'Spokojnie',preview:'',strength:0,fatigue:0,morale:0,pressure:0};
 const g={...base,matchState:{...base.matchState,coachMoments:[{id:'moment',minute:22,title:'Test',body:'Test',choices:[choice]}]}};
 const stopped=act(g,'advanceMatch');assert.equal(stopped.matchState.minute,22);
 assert.equal(stopped.matchState.pressingExposure.high,22);
 assert.equal(act(stopped,'advanceMatch'),stopped);
 const m=stopped.matchState.coachMoments[0];const resolved=act(stopped,'resolveMatchMoment',m.id,m.choices[0].id);
 assert.equal(resolved.matchState.pressingExposure.high,22);
 const next=act(resolved,'advanceMatch');assert.equal(next.matchState.pressingExposure.high,next.matchState.minute);
});

test('zapis i odczyt zachowują ekspozycję i deterministyczny dalszy mecz',async()=>{
 const g=play(start(),'Bardzo wysoki',60);const loaded=migrateGame(await decodeSave(await encodeSave(g)));
 assert.deepEqual(loaded.matchState.pressingExposure,g.matchState.pressingExposure);
 const a=finish(act(g,'changeLiveInstruction','pressing','Niski'));const b=finish(act(loaded,'changeLiveInstruction','pressing','Niski'));
 assert.deepEqual(a.players,b.players);assert.deepEqual(a.fixtures,b.fixtures);assert.equal(a.seed,b.seed);
 assert.deepEqual(a.matchState.pressingExposure,{high:0,veryHigh:60,minute:90});
 assert.deepEqual(finish(structuredClone(g)),finish(structuredClone(g)));
});

test('starszy zapis bez ekspozycji działa i inicjuje licznik przy pierwszej akcji',()=>{
 const g=play(start(),'Wysoki',60);delete g.matchState.pressingExposure;
 const loaded=migrateGame(JSON.parse(JSON.stringify(g)));
 const low=act(loaded,'changeLiveInstruction','pressing','Niski');
 assert.deepEqual(low.matchState.pressingExposure,{high:60,veryHigh:0,minute:60});
 assert.equal(pressingFatigueCost(finish(low).matchState.pressingExposure),3);
 const freshOld=start();delete freshOld.matchState.pressingExposure;assert.equal(finish(freshOld).matchState.completed,true);
});

test('porady pokazują kondycję i zachowany koszt bez współczynników',()=>{
 const g=start();const condition=lineupCondition(g.players,g.tactic.assignments);
 assert.equal(condition,90);
 assert.match(pressingAdvice('Wysoki',condition),/korzysta ze świeżej XI/);
 assert.match(pressingAdvice('Wysoki',50),/osłabia pressing/);
 const e=accruePressing(undefined,'Bardzo wysoki',90);
 assert.equal(pressingFatigueCost(e),8);
 assert.match(pressingAdvice('Niski',condition,e),/Zebrany koszt: wysoki/);
 assert.deepEqual(accruePressing(e,'Niski',90),e);
});

 test('zmiana pressingu zachowuje inne instrukcje i nie dopisuje siły przy powrocie',()=>{
 const base=start();const side=base.matchState.fixture.home===base.club.id?'homeStrength':'awayStrength';
 let g=play(base,'Wysoki',15);
 const past=g.matchState.plannedEvents.filter(e=>e.minute<=15);
 g=act(g,'changeLiveInstruction','pressing',base.tactic.pressing);
 assert.ok(Math.abs(g.matchState[side]-base.matchState[side])<1e-9);
 assert.deepEqual({...g.tactic,pressing:base.tactic.pressing},base.tactic);
 assert.deepEqual(g.matchState.plannedEvents.filter(e=>e.minute<=15),past);
 const next=act({...base,matchState:{...base.matchState,lastInstructionMinute:undefined}},'changeLiveInstruction','mentality','Ofensywna');
 assert.ok(Math.abs(next.matchState[side]-base.matchState[side])<1e-9);
 });

test('aktywny ekran meczu i wyboru planu pokazują poradę pressingu',async()=>{
 const {createServer}=await import('vite');
 const React=await import('react');const {renderToStaticMarkup}=await import('react-dom/server');
 const root=new URL('../',import.meta.url).pathname;
 const vite=await createServer({appType:'custom',configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true,hmr:false}});
 try {
  const {MatchV15,SquadV15}=await vite.ssrLoadModule('/app/gameplay-screens.tsx');
  const game=play(start(),'Wysoki',75);const noop=()=>{};
  const html=renderToStaticMarkup(React.createElement(MatchV15,{game,go:noop,advanceMatch:noop,prepareMatch:noop,changeLiveInstruction:noop,dismissMatchReport:noop,resolveMatchMoment:noop}));
  assert.match(html,/Kondycja XI 90%/);assert.match(html,/Zebrany koszt: podwyższony/);assert.match(html,/nie usuwa wcześniejszego obciążenia/);
  const squad=renderToStaticMarkup(React.createElement(SquadV15,{game:start(),setGame:noop,go:noop}));
  assert.match(squad,/Koszt fizyczny:/);
 } finally {await vite.close();}
});
