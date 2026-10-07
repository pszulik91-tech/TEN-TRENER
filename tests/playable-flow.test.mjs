import '../scripts/ts-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
const { gameActions, migrateGame } = await import('../app/game-actions.ts');
const { createGame, skillSet, currentFixture } = await import('../app/game-engine.ts');
const { LEAGUE_PACKS, FORMATIONS, defaultMicrocycle } = await import('../app/game-data.ts');
import { contextualizeMatchMoment, generateMatchMoments } from '../lib/match-moments.mjs';
import { moveWorldTeams, parentCompetition, reservePromotionAllowed } from '../lib/league-movement.mjs';
import { sortedTable } from '../lib/game-rules.mjs';

function start(){const pack=LEAGUE_PACKS.find(p=>p.competition==='Klasa B');return createGame({name:'Test regresji',age:35,region:'Dolnośląskie',playingExperience:'Amator',coachingExperience:'Debiutant',profile:'Mentor',license:'Grassroots C',...skillSet('Mentor','Amator','Debiutant')},pack,pack.teams[0],['analysis','tactics']);}

function act(g,name,...args){let out=g;gameActions(g,next=>out=next,()=>{})[name](...args);return out;}
function finish(g){g=act(g,'applyTraining');g=act(g,'prepareMatch');for(let i=0;i<40&&!g.matchState.completed;i++){const m=g.matchState;if(m.activeMomentId){const e=m.coachMoments.find(e=>e.id===m.activeMomentId);g=act(g,'resolveMatchMoment',e.id,e.choices[0].id);}else g=act(g,'advanceMatch');}assert.equal(g.matchState.completed,true);return g;}

test('zapis w trakcie meczu zachowuje instrukcje i identyczny dalszy przebieg',()=>{
 let g=act(act(start(),'applyTraining'),'prepareMatch');g=act(g,'advanceMatch');g=act(g,'changeLiveInstruction','pressing','Niski');const loaded=migrateGame(JSON.parse(JSON.stringify(g)));
 assert.deepEqual(loaded.tactic,g.tactic);assert.equal(JSON.stringify(loaded.matchState),JSON.stringify(g.matchState));assert.equal(loaded.seed,g.seed);
 let a=g,b=loaded;for(let i=0;i<40&&!a.matchState.completed;i++){const m=a.matchState;if(m.activeMomentId){const e=m.coachMoments.find(e=>e.id===m.activeMomentId);a=act(a,'resolveMatchMoment',e.id,e.choices[2].id);b=act(b,'resolveMatchMoment',e.id,e.choices[2].id);}else{a=act(a,'advanceMatch');b=act(b,'advanceMatch');}}
 assert.deepEqual(a.fixtures,b.fixtures);assert.equal(a.seed,b.seed);
});
test('ponowne kliknięcie treningu, startu lub tej samej instrukcji nie losuje meczu',()=>{
 let g=act(start(),'applyTraining');assert.equal(act(g,'applyTraining'),g);g=act(g,'prepareMatch');assert.equal(act(g,'prepareMatch'),g);assert.equal(act(g,'changeLiveInstruction','pressing',g.tactic.pressing),g);
});
test('regeneracja nie zależy od otwarcia poprzedniego raportu',()=>{
 const after=finish(start());const a=act(after,'applyTraining');const b=act({...after,matchState:undefined},'applyTraining');assert.deepEqual(a.players,b.players);assert.ok(a.players.reduce((s,p)=>s+p.fatigue,0)<after.players.reduce((s,p)=>s+p.fatigue,0));
});
test('nieobecność z decyzji wyklucza rzeczywistych graczy z automatycznej XI',()=>{
 let g=start();const event={id:'absence-test',category:'Praca',title:'Dwie zmiany w pracy',body:'Dwie osoby nie dojadą.',resolved:false,choices:[{id:'yes',label:'Daję wolne',feedback:'Nie zagrają.',effects:{unavailable:{min:2,max:2,rounds:1,reason:'praca'}}}]};g={...g,inbox:[event]};g=act(g,'resolveDecision',event.id,'yes');const absent=g.players.filter(p=>p.absenceRounds);assert.equal(absent.length,2);const assigned=Object.values(g.tactic.assignments);assert.ok(absent.every(p=>!assigned.includes(p.id)));assert.equal(new Set(assigned).size,11);
});
test('cel Analiza jest osiągalny działaniem, niezależnie od wyniku losowego',()=>{
 let g=start();g.training.sessions[0].focus='Analiza rywala';g=finish(g);assert.equal(g.developmentGoals.find(g=>g.id==='analysis').progress,1);
});
test('komunikat o bronieniu prowadzenia nie pojawia się przy stracie bramek',()=>{
 const fake={id:'test',minute:30,title:'Prowadzenie trzeba dowieźć',body:'Prowadzisz',choices:[]};const m=contextualizeMatchMoment(fake,{balance:-2,minute:30,tier:9,hasYouth:false});assert.notEqual(m.title,fake.title);assert.equal(m.choices.length,3);
});
test('mapa awansów respektuje brak V ligi i nie tworzy fikcyjnej C-klasy',()=>{
 for(const p of LEAGUE_PACKS){const parent=parentCompetition(p,LEAGUE_PACKS);if(parent)assert.ok(parent.tier<p.tier);}
 const local=LEAGUE_PACKS.find(p=>p.association==='Podkarpacki ZPN'&&p.competition==='Klasa okręgowa');assert.equal(parentCompetition(local,LEAGUE_PACKS).competition,'IV liga');
});
test('ruchy świata zachowują grupy, liczbę drużyn i unikalne ID',()=>{
 const packs=LEAGUE_PACKS.filter(p=>p.association==='Podkarpacki ZPN').slice(0,15);const comps=packs.map(p=>({...p,teams:p.teams.map((name,i)=>({id:p.id+'-'+i,name,played:20,points:60-i,gf:40-i,ga:20+i}))}));const moved=moveWorldTeams(comps,packs,sortedTable);const ids=moved.competitions.flatMap(c=>c.teams.map(t=>t.id));assert.equal(new Set(ids).size,ids.length);for(const c of moved.competitions)assert.equal(c.teams.length,comps.find(p=>p.id===c.id).teams.length);assert.ok(moved.movements.length>0);
});
test('nie można zakończyć kariery przed 65 ani ominąć wyboru dwóch celów',()=>{
 const g=start();assert.equal(act(g,'retireCareer'),g);const noGoals={...g,developmentGoals:[]};assert.equal(act(noGoals,'applyTraining'),noGoals);assert.equal(act(noGoals,'prepareMatch'),noGoals);
});

import { encodeSave, decodeSave } from '../lib/save-codec.mjs';
test('skompresowany zapis obejmuje cały świat i przyszły sezon, odczytuje też stary JSON',async()=>{
 const game=start();game.nextWorld=structuredClone(game.world);
 const packed=await encodeSave(game);assert.ok(packed.length<JSON.stringify(game).length/2);
 assert.deepEqual(await decodeSave(packed),JSON.parse(JSON.stringify(game)));
 assert.deepEqual(await decodeSave(JSON.stringify(game)),JSON.parse(JSON.stringify(game)));
 await assert.rejects(()=>decodeSave('TTGZ1:broken'));
});
test('obietnica rotacji jest pamiętana i rozliczana po faktycznym planie meczu',()=>{
 let g=start();g.inbox=[{id:'promise-test',category:'Szatnia',title:'Czas rezerwowych',body:'Daj szansę rotacji.',resolved:false,choices:[{id:'yes',label:'Rotuję',feedback:'Obiecana rotacja.',effects:{teamPlan:'ROTATION'}}]}];
 g=act(g,'resolveDecision','promise-test','yes');assert.equal(g.teamPlan,'ROTATION');assert.equal(g.promises.length,1);
 g=finish(g);assert.equal(g.promises.length,0);assert.ok(g.inbox.some(e=>e.category==='Pamięć szatni' && e.body.includes('Morale +2')));
});

test('rezerwy nie awansują ponad pierwszy zespół ani do I ligi i Ekstraklasy',()=>{
 const reserve={name:'Orzeł II Wałcz'};const comps=[{tier:6,teams:[{name:'Orzeł Wałcz'}]}];
 assert.equal(reservePromotionAllowed(reserve,{tier:6},comps),false);
 assert.equal(reservePromotionAllowed(reserve,{tier:7},comps),true);
 assert.equal(reservePromotionAllowed(reserve,{tier:1},[]),false);
 assert.equal(reservePromotionAllowed({name:'Orzeł Wałcz'},{tier:1},[]),true);
});

test('potwierdzenie komunikatu nie jest osiągnięciem w zarządzaniu ludźmi',()=>{
 let g=start();g.developmentGoals=[{id:'people',label:'Ludzie',description:'',target:4,progress:0},g.developmentGoals[0]];
 g.inbox=[{id:'notice',category:'Pamięć szatni',title:'Informacja',body:'Bilans',resolved:false,choices:[{id:'ack',label:'Rozumiem',feedback:'Przeczytano',effects:{}}]}];
 g=act(g,'resolveDecision','notice','ack');assert.equal(g.developmentGoals.find(d=>d.id==='people').progress,0);
});

test('trening i decyzje pozameczowe nie zmieniają zamkniętej kadry w trakcie spotkania',()=>{
 let g=act(act(start(),'applyTraining'),'prepareMatch');
 g={...g,training:{...g.training,completedRound:null},inbox:[{id:'midmatch',category:'Praca',title:'Zmiana',body:'Praca',resolved:false,choices:[{id:'yes',label:'Wolne',feedback:'Nie zagra',effects:{unavailable:{min:2,max:2,rounds:1,reason:'praca'}}}]}]};
 assert.equal(act(g,'applyTraining'),g);assert.equal(act(g,'resolveDecision','midmatch','yes'),g);
});
