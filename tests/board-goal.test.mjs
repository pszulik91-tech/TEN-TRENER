import test from 'node:test';
import assert from 'node:assert/strict';
import { createBoardGoal, boardGoalFor, boardGoalProgress, boardGoalDismissalProbability, boardGoalResultText } from '../lib/board-goal.mjs';
import { dismissalProbability, sortedTable, rngNext } from '../lib/game-rules.mjs';
import { createGame, skillSet } from '../app/game-engine.ts';
import { gameActions, migrateGame } from '../app/game-actions.ts';
import { LEAGUE_PACKS } from '../app/game-data.ts';
import { encodeSave, decodeSave } from '../lib/save-codec.mjs';

const teams=Array.from({length:16},(_,i)=>({id:`team-${i}`,name:`Klub ${i+1}`,ovr:80-i,points:0,played:0,won:0,drawn:0,lost:0,gf:0,ga:0}));
function start(){const pack=LEAGUE_PACKS.find(p=>p.competition==='Klasa B'&&p.teams.length>=10);return createGame({name:'Cel zarządu',age:35,region:pack.association,playingExperience:'Amator',coachingExperience:'Debiutant',profile:'Mentor',license:'Grassroots C',...skillSet('Mentor','Amator','Debiutant')},pack,pack.teams[0],['analysis','tactics']);}
function act(g,name,...args){let out=g;gameActions(g,n=>out=n,()=>{})[name](...args);return out;}
function ranked(g,place){const order=[...g.teams.filter(t=>t.id!==g.club.id)];order.splice(place-1,0,g.teams.find(t=>t.id===g.club.id));return {...g,teams:order.map((t,i)=>({...t,points:(order.length-i)*3,played:(order.length-1)*2}))};}

test('silniejszy klub otrzymuje ambitniejszą misję, ambicja podnosi cel najwyżej o dwie pozycje',()=>{
 const weak=createBoardGoal(teams,'team-15','2026/27',20);const middle=createBoardGoal(teams,'team-7','2026/27',50);const strong=createBoardGoal(teams,'team-2','2026/27',100);
 assert.deepEqual([weak.maxPlace,middle.maxPlace,strong.maxPlace],[14,8,1]);
 assert.ok(strong.maxPlace<middle.maxPlace&&middle.maxPlace<weak.maxPlace);
 for(const team of teams) {
  const low=createBoardGoal(teams,team.id,'2026/27',20);
  for(const ambition of [0,50,60,70,80,90,100]) {
   const goal=createBoardGoal(teams,team.id,'2026/27',ambition);
   assert.ok(goal.maxPlace>=1&&goal.maxPlace<=teams.length);
   assert.ok(low.maxPlace-goal.maxPlace>=0&&low.maxPlace-goal.maxPlace<=2);
   assert.deepEqual(createBoardGoal([...teams].reverse(),team.id,'2026/27',ambition),goal);
  }
 }
 assert.equal(createBoardGoal(teams,'team-15','2026/27',100).maxPlace,12);
 assert.equal(createBoardGoal(teams,'team-7','2026/27',80).maxPlace,7);
 const equal=teams.map(t=>({...t,ovr:50}));assert.equal(createBoardGoal(equal,'team-0','2026/27',50).maxPlace,8);
});

test('postęp celu odpowiada prawdziwej tabeli, nie prognozie OVR',()=>{
 const base={teams,club:{id:'team-7'},season:'2026/27',president:{ambition:50}};
 assert.equal(boardGoalFor(base).maxPlace,8);
 const good={...base,teams:teams.map(t=>({...t,points:t.id==='team-7'?50:0}))};
 assert.deepEqual([boardGoalProgress(good).place,boardGoalProgress(good).status],[1,'Realizowany']);
 const bad={...base,teams:teams.map(t=>({...t,points:t.id==='team-7'?0:50}))};
 assert.equal(boardGoalProgress(bad).place,16);assert.equal(boardGoalProgress(bad).status,'Zagrożony');
 assert.equal(boardGoalProgress({...good,newSeasonPending:true}).status,'Spełniony');
 assert.equal(boardGoalProgress({...bad,pendingSeason:{year:2027}}).status,'Niewykonany');
 assert.deepEqual(boardGoalFor(good),boardGoalFor(bad));
});

test('ograniczony wpływ celu zachowuje działanie wszystkich starych czynników zwolnienia',()=>{
 const input={place:8,teamCount:16,boardPressure:50,patience:50,unpredictability:26};
 assert.equal(dismissalProbability(input),.28);
 assert.ok(Math.abs(boardGoalDismissalProbability(input,true)-.22)<1e-10);
 assert.ok(Math.abs(boardGoalDismissalProbability(input,false)-.34)<1e-10);
 for(const met of [false,true]) for(const change of [{place:16},{boardPressure:80},{patience:20},{unpredictability:80}]) assert.ok(boardGoalDismissalProbability({...input,...change},met)>boardGoalDismissalProbability(input,met));
 for(const place of [1,8,16]) for(const boardPressure of [0,50,100]) for(const patience of [0,50,100]) for(const unpredictability of [0,50,100]) {
  const state={place,teamCount:16,boardPressure,patience,unpredictability};const base=dismissalProbability(state);const good=boardGoalDismissalProbability(state,true);const bad=boardGoalDismissalProbability(state,false);
  assert.ok(good<=base&&base<=bad&&good<bad);
  assert.ok(base-good<=.060000001&&bad-base<=.060000001);
  assert.ok(good>=.02&&bad<=.86);
 }
});

test('cel powstaje na starcie, zapis go zachowuje, migracja ignoruje bieżący dorobek i reputację',async()=>{
 const g=start();assert.deepEqual(g.boardGoal,createBoardGoal(g.teams,g.club.id,g.season,g.president.ambition));
 const loaded=migrateGame(await decodeSave(await encodeSave(g)));assert.deepEqual(loaded.boardGoal,g.boardGoal);assert.deepEqual(loaded.developmentGoals,g.developmentGoals);
 const legacy=structuredClone(g);delete legacy.boardGoal;
 const first=migrateGame(legacy);const other=migrateGame({...legacy,seed:123,coach:{...legacy.coach,reputation:99},round:12,teams:legacy.teams.map(t=>({...t,points:t.id===g.club.id?100:0,played:20,gf:100,ga:0,form:90,fatigue:80}))});
 assert.deepEqual(first.boardGoal,other.boardGoal);assert.deepEqual(first.boardGoal,g.boardGoal);assert.equal(legacy.boardGoal,undefined);
 const settledLegacy={...legacy,newSeasonPending:false,pendingSeason:{year:2027,targetTier:legacy.club.tier,place:5,outcome:'utrzymanie'}};
 const settled=migrateGame(settledLegacy);assert.deepEqual(settled.boardGoal,g.boardGoal);assert.deepEqual(settled.seasonRecords,legacy.seasonRecords);assert.deepEqual(act(settled,'beginNextSeason'),settled);
 assert.deepEqual(migrateGame(first).boardGoal,first.boardGoal);
 const fixed={...loaded,teams:loaded.teams.map(t=>({...t,ovr:1}))};assert.deepEqual(boardGoalFor(fixed),loaded.boardGoal);
 assert.notDeepEqual(boardGoalFor({...g,boardGoal:{...g.boardGoal,clubId:'stary-klub'}}),{...g.boardGoal,clubId:'stary-klub'});
});

test('Rozlicz sezon stosuje wynik celu w zatrudnieniu i zapisuje go osobno od celów trenera',async()=>{
 let g=ranked(start(),Math.ceil(start().teams.length/2));g={...g,newSeasonPending:true,pressures:{...g.pressures,board:50},president:{...g.president,patience:50,unpredictability:26}};
 const place=sortedTable(g.teams).findIndex(t=>t.id===g.club.id)+1;
 const input={place,teamCount:g.teams.length,boardPressure:50,patience:50,unpredictability:26};
 let seed=0;while(!(rngNext(seed).value>boardGoalDismissalProbability(input,true)&&rngNext(seed).value<boardGoalDismissalProbability(input,false)))seed++;
 const success={...g,seed,boardGoal:{...g.boardGoal,maxPlace:place}};const failure={...success,boardGoal:{...success.boardGoal,maxPlace:place-1}};
 const a=act(success,'beginNextSeason');const b=act(failure,'beginNextSeason');
 assert.equal(a.employmentStatus,'employed');assert.equal(b.employmentStatus,'unemployed');
 assert.deepEqual(a.seasonRecords.at(-1).boardGoal,{maxPlace:place,fulfilled:true});assert.deepEqual(b.seasonRecords.at(-1).boardGoal,{maxPlace:place-1,fulfilled:false});
 assert.ok(a.history.some(s=>s.includes(boardGoalResultText(place,place,true))));assert.ok(b.history.some(s=>s.includes('CEL ZARZĄDU: NIEWYKONANY')));
 assert.equal(a.careerStats.goalsCompleted,0);assert.deepEqual(a.coach.skills,g.coach.skills);
 assert.deepEqual(act(success,'beginNextSeason'),a);
 const loaded=migrateGame(await decodeSave(await encodeSave(b)));assert.deepEqual(loaded.boardGoal,b.boardGoal);assert.deepEqual(loaded.seasonRecords,b.seasonRecords);
 assert.deepEqual(act(a,'beginNextSeason'),a);
});

test('kolejny sezon i zmiana klubu generują nowy cel z nowej ligi i prezesa',()=>{
 const g=start();
 for(const [outcome,tier] of [['awans',g.club.tier-1],['utrzymanie',g.club.tier],['spadek',g.club.tier+1]]) {
  const base={...g,pendingSeason:{year:2027,targetTier:tier,place:5,outcome},boardGoal:{...g.boardGoal,label:'STARY CEL',maxPlace:1}};
  const next=act(base,'stayAtClub');assert.equal(next.season,'2027/28');
  assert.deepEqual(next.boardGoal,createBoardGoal(next.teams,next.club.id,next.season,next.president.ambition));
  assert.notEqual(next.boardGoal.label,'STARY CEL');assert.equal(next.boardGoal.season,next.season);assert.equal(next.developmentGoals.length,0);
  assert.equal(next.club.tier,tier);
 }
 const pack=LEAGUE_PACKS.find(p=>p.competition==='Klasa A');
 const base={...g,employmentStatus:'unemployed',pendingSeason:{year:2027,targetTier:g.club.tier,place:5,outcome:'utrzymanie'},jobOffers:[{id:'new-club',clubName:pack.teams[0],packId:pack.id,tier:pack.tier,competition:pack.competition,stage:'oferta'}]};
 const next=act(base,'acceptJob','new-club');assert.equal(next.club.name,pack.teams[0]);
 assert.deepEqual(next.boardGoal,createBoardGoal(next.teams,next.club.id,next.season,next.president.ambition));assert.notDeepEqual(next.boardGoal,g.boardGoal);
});

test('Dashboard, Kariera i rozliczenie pokazują dokładną granicę oraz oddzielne cele',async()=>{
 const {createServer}=await import('vite');const React=await import('react');const {renderToStaticMarkup}=await import('react-dom/server');
 const root=new URL('../',import.meta.url).pathname;const vite=await createServer({appType:'custom',configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true,hmr:false}});
 try {
  const {CareerV14:Career,Jobs}=await vite.ssrLoadModule('/app/game-screens.tsx');const {DashboardV15:Dashboard}=await vite.ssrLoadModule('/app/gameplay-screens.tsx');const g=start();const noop=()=>{};
  const arrival=renderToStaticMarkup(React.createElement(Dashboard,{game:g,go:noop,resolveDecision:noop,prepareMatch:noop,beginNextSeason:noop,dismissMatchReport:noop}));
  assert.match(arrival,/Cel sportowy zarządu/);assert.match(arrival,new RegExp(`${g.boardGoal.maxPlace}\\. miejscu lub wyżej`));assert.match(arrival,/Twoje dwa cele rozwojowe/);
  const entered=act(g,'resolveDecision','welcome','ack');
  const dashboard=renderToStaticMarkup(React.createElement(Dashboard,{game:entered,go:noop,resolveDecision:noop,prepareMatch:noop,beginNextSeason:noop,dismissMatchReport:noop}));
  assert.match(dashboard,/Cel sportowy zarządu/);assert.match(dashboard,new RegExp(`${g.boardGoal.maxPlace}\\. miejscu lub wyżej`));assert.match(dashboard,/Aktualna pozycja/);assert.match(dashboard,/Cele rozwojowe/);
  const career=renderToStaticMarkup(React.createElement(Career,{game:g,setGame:noop,retireCareer:noop}));assert.match(career,/Cel sportowy zarządu/);
  const final=act({...g,newSeasonPending:true},'beginNextSeason');const html=renderToStaticMarkup(React.createElement(Jobs,{game:final,acceptJob:noop,stayAtClub:noop}));
  assert.match(html,/CEL ZARZĄDU: (WYKONANY|NIEWYKONANY)/);assert.match(html,/Pozycja końcowa/);assert.match(html,/Wymagane:/);
 } finally {await vite.close();}
});
