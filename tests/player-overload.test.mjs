import test from 'node:test';
import assert from 'node:assert/strict';
import { overloadIssue, overloadFollowup, OVERLOAD_REASON } from '../lib/player-overload.mjs';
import { createGame, skillSet, generateJobOffers } from '../app/game-engine.ts';
import { gameActions, migrateGame } from '../app/game-actions.ts';
import { LEAGUE_PACKS, FORMATIONS, selectLineupForPlan, playerAvailable } from '../app/game-data.ts';
import { readCareer, resumeScreen } from '../app/save-storage.ts';
import { encodeSave } from '../lib/save-codec.mjs';
import { absenceLabel } from '../app/lineup-presentation.ts';

function start() {
  const pack=LEAGUE_PACKS.find(p=>p.competition==='Klasa B'&&p.teams.length>=10&&p.teams.length%2===0);
  const g=createGame({name:'Przeciążenie GAME-07',age:35,region:'Śląskie',playingExperience:'Amator',coachingExperience:'Debiutant',profile:'Mentor',license:'Grassroots C',...skillSet('Mentor','Amator','Debiutant')},pack,pack.teams[0],['analysis','tactics']);
  g.inbox=[];
  const id=g.tactic.assignments.BR;
  g.players=g.players.map(p=>p.id===id?{...p,baseOVR:90,potential:90,fatigue:55}:p);
  g.tactic.assignments=selectLineupForPlan(g.players,FORMATIONS[g.tactic.formation],g.teamPlan);
  return g;
}
function addIssue(g) {
  const e=overloadIssue({players:g.players,assignments:g.tactic.assignments,clubId:g.club.id,match:g.careerStats.matches});
  assert.ok(e);return {...g,inbox:[e]};
}
function act(g,name,...args){let next=g;gameActions(g,n=>next=n,()=>{})[name](...args);return next;}
function play(g){
  g=act(g,'applyTraining');g=act(g,'prepareMatch');assert.ok(g.matchState&&!g.matchState.completed);
  for(let step=0;step<30&&!g.matchState.completed;step++){
    const m=g.matchState;
    if(m.activeMomentId){const e=m.coachMoments.find(e=>e.id===m.activeMomentId);g=act(g,'resolveMatchMoment',e.id,e.choices[0].id);}else g=act(g,'advanceMatch');
  }
  assert.ok(g.matchState.completed);return g;
}
function issue(g){return g.inbox.find(e=>!e.resolved&&e.playerCase?.kind==='overload');}
function followup(g){return g.inbox.find(e=>e.playerCase?.kind==='overload-followup');}

test('wybiera zdrowego rzeczywistego zawodnika o wysokim fatigue, preferuje XI i stabilnie rozstrzyga remisy',()=>{
 const g=start();const input={players:g.players,assignments:g.tactic.assignments,clubId:g.club.id,match:1};
 const e=overloadIssue(input);const p=g.players.find(p=>p.id===e.targetPlayerId);
 assert.ok(p.fatigue>=40);assert.ok(playerAvailable(p));assert.equal(e.choices.length,2);
 assert.match(e.body,new RegExp(p.name));assert.match(e.body,/kondycja 45%/);
 assert.deepEqual(overloadIssue({...input,players:[...g.players].reverse()}),e);
 const candidates=g.players.slice(0,3).map(p=>({...p,fatigue:60,baseOVR:40}));
 const expected=[...candidates].sort((a,b)=>a.id<b.id?-1:1)[0];
 assert.equal(overloadIssue({...input,assignments:{},players:candidates}).targetPlayerId,expected.id);
 assert.equal(overloadIssue({...input,blocked:true}),undefined);
 assert.equal(overloadIssue({...input,players:g.players.map(p=>({...p,fatigue:20}))}),undefined);
 assert.equal(overloadIssue({...input,players:g.players.map(p=>({...p,injuryWeeks:1,fatigue:80}))}),undefined);
 assert.equal(overloadIssue({...input,players:g.players.map(p=>({...p,absenceRounds:1,fatigue:80}))}),undefined);
});

test('odpoczynek dotyczy tylko wskazanej osoby, bez losowych relacji; automat dobiera zastępstwo i UI zna powód',()=>{
 const g=addIssue(start());const e=issue(g);const before=g.players.find(p=>p.id===e.targetPlayerId);
 const next=act(g,'resolveDecision',e.id,'rest');const p=next.players.find(p=>p.id===before.id);
 assert.equal(next.seed,g.seed);assert.equal(p.fatigue,47);assert.equal(p.relation,57);assert.equal(p.absenceRounds,1);assert.equal(p.absenceReason,OVERLOAD_REASON);
 assert.equal(playerAvailable(p),false);assert.match(absenceLabel(p),/Regeneracja po przeciążeniu/);
 assert.deepEqual(next.players.filter(p=>p.id!==before.id),g.players.filter(p=>p.id!==before.id));
 assert.ok(!Object.values(next.tactic.assignments).includes(p.id));assert.notEqual(next.tactic.assignments.BR,g.tactic.assignments.BR);
 assert.deepEqual(next.tactic.assignments,selectLineupForPlan(next.players,FORMATIONS[next.tactic.formation],next.teamPlan));
 assert.deepEqual(act(next,'resolveDecision',e.id,'rest'),next);
});

test('po jednej absencji wraca dostępność; follow-up dotyczy tej samej osoby i nie powtarza się',()=>{
 const g=addIssue(start());const e=issue(g);const decided=act(g,'resolveDecision',e.id,'rest');
 const done=play(decided);const p=done.players.find(p=>p.id===e.targetPlayerId);const f=followup(done);
 assert.ok(playerAvailable(p));assert.equal(p.absenceRounds,0);assert.equal(p.absenceReason,undefined);
 assert.equal(f.targetPlayerId,p.id);assert.match(f.body,/Opuścił spotkanie zgodnie/);assert.match(f.body,new RegExp(`kondycja ${100-p.fatigue}%`));assert.match(f.body,/ponownie dostępny/);
 assert.equal(done.playerOverload,undefined);assert.equal(issue(done),undefined);
 assert.equal(done.inbox.filter(e=>!e.resolved).length<=3,true);
 const ack=act(done,'resolveDecision',f.id,'ack');assert.deepEqual(ack.players,done.players);assert.equal(ack.seed,done.seed);
 const second=play(ack);assert.equal(second.inbox.filter(e=>e.id===f.id).length,1);
});

test('dyspozycja nie tworzy kontuzji ani nie zmienia cudzych relacji; follow-up potwierdza faktyczną XI',()=>{
 const g=addIssue(start());const e=issue(g);const next=act(g,'resolveDecision',e.id,'available');const p=next.players.find(p=>p.id===e.targetPlayerId);
 assert.equal(p.fatigue,55);assert.equal(p.relation,53);assert.equal(p.injuryWeeks,0);assert.ok(playerAvailable(p));assert.equal(next.seed,g.seed);
 for(const other of g.players.filter(p=>p.id!==e.targetPlayerId))assert.deepEqual(next.players.find(p=>p.id===other.id),other);
 const prepared=act(act(next,'applyTraining'),'prepareMatch');const played=Object.values(prepared.tactic.assignments).includes(p.id);
 const done=play(prepared);const after=done.players.find(p=>p.id===e.targetPlayerId);const f=followup(done);
 assert.equal(f.targetPlayerId,p.id);assert.match(f.body,played?/znalazł się w XI/:/XI go nie wybrała/);
 assert.match(f.body,new RegExp(`kondycja ${100-after.fatigue}%`));
 assert.match(f.body,after.injuryWeeks?new RegExp(`Uraz: ${after.injuryWeeks} tyg`):/dostępny/);
});

test('dostępny gracz może pozostać poza XI; komunikat nie wymyśla występu ani urazu',()=>{
 let g=addIssue(start());const e=issue(g);g=act(g,'resolveDecision',e.id,'available');
 g={...g,players:g.players.map(p=>p.id===e.targetPlayerId?{...p,baseOVR:20}:p)};
 const done=play(g);const f=followup(done);assert.match(f.body,/automatyczna XI go nie wybrała/);
 assert.equal(done.players.find(p=>p.id===e.targetPlayerId).injuryWeeks,0);
});

test('follow-up z urazem opisuje rzeczywisty stan; pełny inbox opóźnia wiadomość, zachowując wynik właściwego meczu',()=>{
 const g=addIssue(start());const e=issue(g);const decided=act(g,'resolveDecision',e.id,'available');const p=decided.players.find(p=>p.id===e.targetPlayerId);
 const context={clubId:g.club.id,players:[{...p,injuryWeeks:2,fatigue:70}],starters:new Set([p.id]),match:1,capacity:0};
 const delayed=overloadFollowup(decided.playerOverload,context);assert.equal(delayed.event,undefined);assert.match(delayed.pending.outcome,/Uraz: 2 tyg/);
 const delivered=overloadFollowup(delayed.pending,{...context,match:2,capacity:1,players:[{...p,injuryWeeks:1,fatigue:30}]});
 assert.match(delivered.event.body,/kondycja 30%/);assert.match(delivered.event.body,/Uraz: 2 tyg/);assert.equal(delivered.pending,undefined);
});

test('generowanie po meczu używa aktualnej kadry; nie dubluje nierozwiązanej sprawy ani nie omija limitu inboxu',()=>{
 let g=start();g.players=g.players.map(p=>({...p,fatigue:70}));
 const done=play(g);const e=issue(done);assert.ok(e);assert.ok(done.inbox.filter(e=>!e.resolved).length<=2);const p=done.players.find(p=>p.id===e.targetPlayerId);
 assert.ok(playerAvailable(p));assert.match(e.body,new RegExp(`zmęczenie ${p.fatigue}/100`));
 const twice=play(done);assert.equal(twice.inbox.filter(e=>!e.resolved&&e.playerCase?.kind==='overload').length,1);
 assert.ok(twice.inbox.filter(e=>!e.resolved).length<=3);
 const full={...g,inbox:Array.from({length:3},(_,i)=>({id:`existing-${i}`,title:'Inna sprawa',body:'',resolved:false,category:'Test',choices:[{id:'ack',label:'OK',feedback:'',effects:{}}]}))};
 const result=play(full);assert.equal(issue(result),undefined);assert.equal(result.inbox.filter(e=>!e.resolved).length,3);
});

test('zapis i KONTYNUUJ między decyzją a meczem zachowują absencję, osobę i powrót sprawy; stary zapis działa',async()=>{
 for(const choice of ['rest','available']){
  const g=addIssue(start());const e=issue(g);const decided=act(g,'resolveDecision',e.id,choice);
  const loaded=await readCareer(await encodeSave(decided));assert.deepEqual(loaded.playerOverload,decided.playerOverload);assert.equal(resumeScreen(loaded),'dashboard');
  assert.deepEqual(loaded.players,decided.players);assert.deepEqual(followup(play(loaded)),followup(play(decided)));
 }
 const legacy=start();delete legacy.playerOverload;assert.equal((await readCareer(await encodeSave(legacy))).playerOverload,undefined);
 const open=addIssue(start());assert.deepEqual(issue(await readCareer(await encodeSave(open))),issue(open));
});

test('zmiana klubu i nowy sezon czyszczą sprawy starej kadry; migracja usuwa nieistniejące odniesienia',()=>{
 let g=addIssue(start());const e=issue(g);g=act(g,'resolveDecision',e.id,'rest');
 const pendingSeason={year:2027,targetTier:g.club.tier,place:5,outcome:'utrzymanie'};
 const base={...g,pendingSeason,nextWorld:undefined};
 const stayed=act(base,'stayAtClub');assert.equal(stayed.playerOverload,undefined);assert.ok(!stayed.inbox.some(e=>e.playerCase));
 const offer={...generateJobOffers(g,g.seed).offers[0],stage:'oferta'};assert.ok(offer);
 const changed=act({...base,jobOffers:[offer]},'acceptJob',offer.id);assert.notEqual(changed.club.name,g.club.name);assert.equal(changed.playerOverload,undefined);assert.ok(!changed.inbox.some(e=>e.playerCase));
 const missing=migrateGame({...g,players:g.players.filter(p=>p.id!==e.targetPlayerId)});assert.equal(missing.playerOverload,undefined);assert.ok(!missing.inbox.some(item=>item.targetPlayerId===e.targetPlayerId));
});


test('zgłoszenie staje się nieaktualne po późniejszym urazie; zamknięcie nie leczy ani nie nakłada nowej absencji',()=>{
 let g=addIssue(start());const e=issue(g);g={...g,players:g.players.map(p=>p.id===e.targetPlayerId?{...p,injuryWeeks:2}:p)};
 const closed=act(g,'resolveDecision',e.id,'rest');assert.deepEqual(closed.players,g.players);assert.equal(closed.playerOverload,undefined);assert.equal(issue(closed),undefined);
});

test('rzeczywisty App: zapis decyzji → KONTYNUUJ zachowuje sprawę; ekran XI pokazuje osobę i absencję',async t=>{
 const React=await import('react');const {act:reactAct,create}=await import('react-test-renderer');const {createServer}=await import('vite');
 const initial=addIssue(start());const e=issue(initial);const saved=act(initial,'resolveDecision',e.id,'rest');
 const raw=await encodeSave(saved);const restores=[];
 for(const [key,value] of Object.entries({IS_REACT_ACT_ENVIRONMENT:true,localStorage:{getItem:k=>k.endsWith(':creator')?null:raw,setItem(){},removeItem(){}},window:{requestAnimationFrame:f=>{f();return 1;},cancelAnimationFrame(){},addEventListener(){},removeEventListener(){},scrollTo(){},setTimeout(){}}})){
  const previous=Object.getOwnPropertyDescriptor(globalThis,key);Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});restores.push(()=>previous?Object.defineProperty(globalThis,key,previous):delete globalThis[key]);
 }
 const root=new URL('../',import.meta.url).pathname;const vite=await createServer({appType:'custom',configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true,hmr:{port:0}}});let view;
 t.after(async()=>{try{if(view)await reactAct(()=>view.unmount());}finally{await vite.close();restores.reverse().forEach(f=>f());}});
 const {default:App}=await vite.ssrLoadModule('/app/page.tsx');const {GameShell}=await vite.ssrLoadModule('/app/game-screens.tsx');
 await reactAct(()=>{view=create(React.createElement(App));});
 const text=n=>typeof n==='string'?n:n.children.map(text).join('');
 const button=view.root.findAllByType('button').find(b=>text(b).trim()==='KONTYNUUJ');assert.ok(button);assert.ok(!button.props.disabled);
 await reactAct(async()=>{await button.props.onClick();});
 const resumed=view.root.findByType(GameShell).props.game;assert.deepEqual(resumed.playerOverload,saved.playerOverload);assert.equal(resumed.players.find(p=>p.id===e.targetPlayerId).absenceRounds,1);
 const {SquadV15}=await vite.ssrLoadModule('/app/gameplay-screens.tsx');const {renderToStaticMarkup}=await import('react-dom/server');
 const html=renderToStaticMarkup(React.createElement(SquadV15,{game:resumed,setGame(){},go(){}}));
 assert.ok(html.includes(resumed.players.find(p=>p.id===e.targetPlayerId).name));assert.ok(html.includes(OVERLOAD_REASON));
});
