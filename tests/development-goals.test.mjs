import test from 'node:test';
import assert from 'node:assert/strict';
import { goalsForSeason, seasonMatchCount, emptySeasonEvidence, recordMatchEvidence, recordPeopleEvidence, refreshDevelopmentGoals, developmentGoalComplete, goalProgressText, goalProgressPercent } from '../lib/development-goals.mjs';
import { createGame, skillSet } from '../app/game-engine.ts';
import { gameActions } from '../app/game-actions.ts';
import { LEAGUE_PACKS, buildSchedule } from '../app/game-data.ts';
import { readCareer } from '../app/save-storage.ts';
import { encodeSave } from '../lib/save-codec.mjs';
import { overloadIssue } from '../lib/player-overload.mjs';
import { EVENT_POOL } from '../lib/career-events.mjs';
import { simulateDevelopmentSeason } from '../scripts/development-goals-simulation.mjs';
const positive={readiness:80,averageMorale:75,preMatchPressure:50,result:'win',analysisAttempted:true,analysisImproved:true};
const formations=['4-2-3-1','4-4-2','3-5-2'];
function start(ids=['people','youth'],matches=10) {
 const pack=LEAGUE_PACKS.find(p=>p.teams.length===matches/2+1 && p.competition==='Klasa B') ?? LEAGUE_PACKS.find(p=>p.teams.length===matches/2+1);
 return createGame({name:`Sezonowe cele ${matches}`,age:35,region:'Śląskie',playingExperience:'Amator',coachingExperience:'Debiutant',profile:'Mentor',license:'Grassroots C',...skillSet('Mentor','Amator','Debiutant')},pack,pack.teams[0],ids);
}
function act(g,name,...args){let next=g;gameActions(g,n=>next=n,()=>{},['people','youth'])[name](...args);return next;}
function positiveIssue(id) {const template=EVENT_POOL.find(e=>e.id==='captain-late');return {...structuredClone(template),id,resolved:false};}
function choice(e){return e.choices.find(c=>(c.effects.pressures?.dressing??0)<=0).id;}
function finish(g){g=act(g,'applyTraining');g=act(g,'prepareMatch');for(let i=0;i<30&&!g.matchState.completed;i++){
 const m=g.matchState;if(m.activeMomentId){const e=m.coachMoments.find(e=>e.id===m.activeMomentId);g=act(g,'resolveMatchMoment',e.id,e.choices[0].id);}else g=act(g,'advanceMatch');
 }assert.ok(g.matchState.completed);return g;}

test('targety używają rzeczywistych spotkań klubu, są deterministyczne i proporcjonalne także przy pauzach',()=>{
 const fixtures=buildSchedule(Array.from({length:11},(_,i)=>`t${i}`));
 assert.equal(seasonMatchCount(fixtures,'t0'),20);assert.equal(Math.max(...fixtures.map(f=>f.round)),22);
 for(const n of [10,22,34]){
  assert.deepEqual(goalsForSeason(n),goalsForSeason(n));
  for(const g of goalsForSeason(n)){assert.equal(g.seasonMatches,n);assert.ok(g.target>=5&&g.target<=n*.65,g.id);assert.match(g.description,new RegExp(String(g.id==='adaptability'?g.repeatsPerFormation:g.target)));}
 }
 for(const short of goalsForSeason(10))assert.ok(goalsForSeason(34).find(g=>g.id===short.id).target>short.target,short.id);
 assert.equal(start().developmentGoals.length,2);
});

test('żaden cel nie kończy się po czterech meczach, nawet z maksymalnym wczesnym progressem',()=>{
 for(const n of [10,22,34]){
  let e=emptySeasonEvidence();const goals=goalsForSeason(n);
  for(let round=1;round<=4;round++){
   for(let i=0;i<3;i++)e=recordPeopleEvidence(e,round,`${round}-${i}`,true);
   e=recordMatchEvidence(e,round,positive,formations[(round-1)%3],['a','b','c']);
   for(const g of refreshDevelopmentGoals(goals,e))assert.equal(developmentGoalComplete(g,e),false,`${n}: ${g.id} round ${round}`);
  }
 }
});

test('ludzie: kilka prawdziwych decyzji w jednej kolejce daje jeden krok; replay niczego nie dodaje',()=>{
 let g=start();g.inbox=[positiveIssue('a'),positiveIssue('b'),positiveIssue('c')];
 for(const e of g.inbox)g=act(g,'resolveDecision',e.id,choice(e));
 assert.deepEqual(g.seasonEvidence.peopleRounds,[1]);assert.equal(g.seasonEvidence.positiveDecisions.length,3);
 assert.equal(g.developmentGoals.find(d=>d.id==='people').progress,1);
 const same=act(g,'resolveDecision','a',choice(g.inbox[0]));assert.deepEqual(same,g);
 for(let r=2;r<=6;r++){g={...g,round:r,inbox:[positiveIssue(`r${r}`)]};g=act(g,'resolveDecision',`r${r}`,choice(g.inbox[0]));}
 assert.ok(developmentGoalComplete(g.developmentGoals[0],g.seasonEvidence));
 const archive={...positiveIssue('archive'),category:'Archiwum'};g={...g,round:7,inbox:[archive]};assert.deepEqual(act(g,'resolveDecision',archive.id,choice(archive)).seasonEvidence,g.seasonEvidence);
});

test('odpoczynek GAME-07 liczy ludzi; dyspozycja i potwierdzenie follow-upu nie liczą',()=>{
 for(const id of ['rest','available']){
  let g=start();g.players=g.players.map(p=>({...p,fatigue:50}));const e=overloadIssue({players:g.players,assignments:g.tactic.assignments,clubId:g.club.id,match:0});g.inbox=[e];
  g=act(g,'resolveDecision',e.id,id);assert.equal(g.developmentGoals[0].progress,id==='rest'?1:0);
  const ack={...e,id:'ack',playerCase:{clubId:g.club.id,kind:'overload-followup'},choices:[{id:'ack',label:'OK',feedback:'OK',effects:{}}]};
  g={...g,round:2,inbox:[ack]};assert.equal(act(g,'resolveDecision','ack','ack').developmentGoals[0].progress,id==='rest'?1:0);
 }
});

test('młodzi wymagają regularności ORAZ trzech nazwisk, UI i pasek pokazują oba warunki',()=>{
 const g=goalsForSeason(22).find(g=>g.id==='youth');let e=recordMatchEvidence(emptySeasonEvidence(),1,positive,formations[0],['a','b','c']);
 assert.equal(developmentProgressFor(g,e),1);assert.equal(developmentGoalComplete(g,e),false);assert.match(goalProgressText(g,e),/1\/9 kolejek z U21 • 3\/3/);
 e=emptySeasonEvidence();for(let r=1;r<=g.target;r++)e=recordMatchEvidence(e,r,positive,formations[0],['a']);
 assert.equal(developmentProgressFor(g,e),g.target);assert.equal(developmentGoalComplete(g,e),false);assert.ok(goalProgressPercent(g,e)<100);
 e=recordMatchEvidence(e,g.target+1,positive,formations[0],['b','c']);assert.equal(developmentGoalComplete(g,e),true);
 assert.equal(goalProgressPercent(g,e),100);
});
function developmentProgressFor(g,e){return refreshDevelopmentGoals([g],e)[0].progress;}

test('adaptacja wymaga powtarzalnego punktowania trzema formacjami; jeden mecz nie liczy dwóch ustawień',()=>{
 const g=goalsForSeason(34).find(g=>g.id==='adaptability');let e=emptySeasonEvidence();
 for(let r=1;r<=3;r++)e=recordMatchEvidence(e,r,positive,formations[r-1],[]);
 assert.equal(developmentProgressFor(g,e),3);assert.equal(developmentGoalComplete(g,e),false);
 const replay=recordMatchEvidence(e,1,positive,formations[1],[]);assert.deepEqual(replay.formationPointRounds,e.formationPointRounds);
 for(let r=4;r<=g.target;r++)e=recordMatchEvidence(e,r,positive,formations[(r-1)%3],[]);
 assert.equal(developmentGoalComplete(g,e),true);assert.match(goalProgressText(g,e),/3\/3 formacje z 4 punktowanymi meczami/);
 let one=emptySeasonEvidence();for(let r=1;r<=20;r++)one=recordMatchEvidence(one,r,positive,formations[0],[]);assert.equal(developmentGoalComplete(g,one),false);
});

test('pozostałe pięć celów zachowuje warunki sportowe, nie liczy powtórzeń i nie przekracza targetu',()=>{
 const negative={readiness:71,averageMorale:67,preMatchPressure:44,result:'loss',analysisAttempted:true,analysisImproved:false};
 let e=recordMatchEvidence(emptySeasonEvidence(),1,negative,formations[0],[]);
 for(const id of ['tactics','motivation','analysis','pressure','reputation'])assert.equal(developmentProgressFor(goalsForSeason(10).find(g=>g.id===id),e),0,id);
 for(let r=2;r<=25;r++)e=recordMatchEvidence(e,r,positive,formations[(r-1)%3],[]);
 const duplicate=recordMatchEvidence(e,25,positive,formations[0],[]);assert.deepEqual(duplicate,e);
 for(const g of refreshDevelopmentGoals(goalsForSeason(10),e)){assert.ok(g.progress<=g.target);if(['tactics','motivation','analysis','pressure','reputation'].includes(g.id))assert.ok(developmentGoalComplete(g,e));}
 const draw=recordMatchEvidence(emptySeasonEvidence(),1,{...positive,result:'draw'},formations[0],[]);assert.equal(draw.pressureRounds.length,1);assert.equal(draw.reputationRounds.length,0);assert.equal(draw.analysisRounds.length,1);
});

test('prawdziwy koniec meczu i ocena zimowa zapisują nowe dowody i szczegóły; save/load je zachowuje',async()=>{
 let g=start();g.players=g.players.map(p=>({...p,age:20,morale:75}));g.pressures={...g.pressures,board:50};
 g.fixtures=g.fixtures.map(f=>f.round<5?{...f,played:true,homeGoals:0,awayGoals:0}:f);g.round=5;
 g.training.sessions=g.training.sessions.map((s,i)=>i===0?{...s,focus:'Analiza rywala'}:s);
 g=finish(g);assert.deepEqual(g.seasonEvidence.youthRounds,[5]);assert.ok(g.seasonEvidence.youthStarters.length>=3);
 assert.equal(g.developmentGoals.find(d=>d.id==='youth').progress,1);
 assert.equal(g.winterEvaluatedRound,5);assert.ok(g.developmentGoals.every(d=>d.winterProgress===d.progress));
 assert.match(g.inbox.find(e=>e.id.startsWith('winter-')).body,/kolejek z U21.*różnych zawodników/);
 const loaded=await readCareer(await encodeSave(g));assert.deepEqual(loaded.developmentGoals,g.developmentGoals);assert.deepEqual(loaded.seasonEvidence,g.seasonEvidence);
});

test('stary aktywny save people4/4 youth3/3 zachowuje fakty, nie wymyśla kolejek ani ukończenia',async()=>{
 let g=start();g.developmentGoals=g.developmentGoals.map(d=>({...d,rulesVersion:undefined,target:d.id==='people'?4:3,progress:d.id==='people'?4:3,winterProgress:d.id==='people'?4:3}));
 g.seasonEvidence={formationsWithPoints:formations,youthStarters:['a','b','c'],analysisRounds:[1,2],tacticalRounds:[1,2,3],pressureRounds:[2],positiveDecisions:['a','b','c','d']};
 const historical={season:'2025/26',club:g.club.name,tier:9,place:3,matches:10,wins:6,draws:2,losses:2,outcome:'utrzymanie',goalsCompleted:2};g.seasonRecords=[historical];g.coach.skills.people+=1;g.careerStats.goalsCompleted=2;
 const loaded=await readCareer(await encodeSave(g));assert.equal(loaded.developmentGoals[0].target,6);assert.equal(loaded.developmentGoals[0].progress,1);assert.equal(loaded.developmentGoals[1].progress,1);
 assert.deepEqual(loaded.seasonEvidence.peopleRounds,[]);assert.deepEqual(loaded.seasonEvidence.youthRounds,[]);assert.deepEqual(loaded.seasonEvidence.youthStarters,['a','b','c']);assert.deepEqual(loaded.seasonEvidence.tacticalRounds,[1,2,3]);
 for(const d of loaded.developmentGoals)assert.equal(developmentGoalComplete(d,loaded.seasonEvidence),false);
 assert.deepEqual(loaded.seasonRecords,[historical]);assert.deepEqual(loaded.coach.skills,g.coach.skills);assert.equal(loaded.careerStats.goalsCompleted,2);
 assert.deepEqual((await readCareer(await encodeSave(loaded))).seasonEvidence,loaded.seasonEvidence);
 const noEvidence={...g,seasonEvidence:undefined};assert.equal((await readCareer(await encodeSave(noEvidence))).developmentGoals[0].progress,0);
});

test('migracja adaptacji daje tylko udowodnione pojedyncze sukcesy; stare wygrane wynikają z fixtures',async()=>{
 const g=start(['adaptability','reputation']);g.developmentGoals[0].target=3;g.developmentGoals[0].progress=3;
 g.seasonEvidence={formationsWithPoints:formations,youthStarters:[],analysisRounds:[],tacticalRounds:[],pressureRounds:[],positiveDecisions:[]};
 const fixture=g.fixtures.find(f=>f.home===g.club.id||f.away===g.club.id);fixture.played=true;fixture.homeGoals=fixture.home===g.club.id?1:0;fixture.awayGoals=fixture.away===g.club.id?1:0;
 const loaded=await readCareer(await encodeSave(g));assert.equal(loaded.developmentGoals[0].progress,3);assert.equal(loaded.developmentGoals[0].target,6);assert.deepEqual(loaded.seasonEvidence.formationPointRounds,{});
 assert.equal(developmentGoalComplete(loaded.developmentGoals[0],loaded.seasonEvidence),false);assert.equal(loaded.developmentGoals[1].progress,1);
});

test('nagrody końca sezonu wymagają dowodów obu warunków, zostają +1/+2 i resetują się w nowym sezonie',()=>{
 let g=start(['youth','reputation']);const goals=g.developmentGoals;let e=emptySeasonEvidence();
 for(let r=1;r<=goals[0].target;r++)e=recordMatchEvidence(e,r,positive,formations[0],['a']);
 g={...g,seasonEvidence:e,developmentGoals:refreshDevelopmentGoals(goals,e),newSeasonPending:true};
 const skills={...g.coach.skills};const rep=g.coach.reputation;let settled=act(g,'beginNextSeason');
 assert.equal(settled.seasonRecords.at(-1).goalsCompleted,1);assert.equal(settled.coach.skills.youth,skills.youth);const noAwards=act({...g,seasonEvidence:emptySeasonEvidence(),developmentGoals:g.developmentGoals.map(d=>({...d,progress:d.target}))},'beginNextSeason');
 assert.equal(noAwards.seasonRecords.at(-1).goalsCompleted,0);assert.equal(settled.coach.reputation,noAwards.coach.reputation+2);
 // Both completed, without changing the award amounts.
 e=recordMatchEvidence(e,6,positive,formations[1],['b','c']);const both=act({...g,seasonEvidence:e,developmentGoals:refreshDevelopmentGoals(goals,e)},'beginNextSeason');
 assert.equal(both.seasonRecords.at(-1).goalsCompleted,2);assert.equal(both.coach.skills.youth,skills.youth+1);
 settled={...settled,employmentStatus:'employed'};const next=act(settled,'stayAtClub');assert.deepEqual(next.seasonEvidence,emptySeasonEvidence());assert.equal(next.developmentGoals.length,0);
 const selected=act(next,'confirmNewSeasonGoals');assert.equal(selected.developmentGoals.length,2);assert.ok(selected.developmentGoals.every(d=>d.progress===0&&d.seasonMatches===seasonMatchCount(selected.fixtures,selected.club.id)));
});

test('symulacja krótkiego, średniego i długiego sezonu: świadoma nieidealna gra pozwala osiągnąć cele',()=>{
 for(const n of [10,22,34]){
  const report=simulateDevelopmentSeason(n,42);assert.ok(report.snapshots['4'].every(g=>!g.completed));
  for(const g of report.goals){assert.ok(g.earliest>4);assert.ok(g.completed,`${n}: ${g.id}`);assert.ok(g.target<n*.65);}
 }
});


test('UI wyboru pokazuje dokładny wymóg sezonu, Dashboard pokazuje oba warunki',async()=>{
 const {createServer}=await import('vite');const React=await import('react');const {renderToStaticMarkup}=await import('react-dom/server');
 const root=new URL('../',import.meta.url).pathname;const vite=await createServer({appType:'custom',configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true,hmr:false}});
 try{
  const {GoalPicker}=await vite.ssrLoadModule('/app/setup-screens.tsx');
  const picker=renderToStaticMarkup(React.createElement(GoalPicker,{selected:['people','youth'],setSelected(){},season:'2026/27',seasonMatches:22,onBack(){},onConfirm(){}}));
  assert.match(picker,/22 spotkań ligowych klubu/);assert.match(picker,/w 7 różnych kolejkach/);assert.match(picker,/w 9 różnych kolejkach/);assert.match(picker,/co najmniej 2 razy każdą z 3/);
  const {Dashboard}=await vite.ssrLoadModule('/app/game-screens.tsx');let g=start(['adaptability','youth'],22);
  g.seasonEvidence=recordMatchEvidence(g.seasonEvidence,1,positive,formations[0],['a','b']);g.developmentGoals=refreshDevelopmentGoals(g.developmentGoals,g.seasonEvidence);
  const html=renderToStaticMarkup(React.createElement(Dashboard,{game:g,go(){},resolveDecision(){},prepareMatch(){},beginNextSeason(){}}));
  assert.match(html,/1\/9 kolejek z U21 • 2\/3 różnych zawodników/);assert.match(html,/0\/3 formacje z 2 punktowanymi meczami/);
 }finally{await vite.close();}
});

test('migracja zachowuje licznik morale i zimowy snapshot, a rozliczone sezony nie są ponownie przeliczane',async()=>{
 let g=start(['motivation','tactics'],22);g.fixtures=g.fixtures.map(f=>f.round<=8?{...f,played:true,homeGoals:0,awayGoals:0}:f);
 g.developmentGoals=g.developmentGoals.map(d=>({...d,progress:6,winterProgress:4}));
 g.seasonEvidence={formationsWithPoints:[],youthStarters:[],analysisRounds:[],tacticalRounds:[1,2,3,4,5,6],pressureRounds:[],positiveDecisions:[]};
 const loaded=await readCareer(await encodeSave(g));assert.equal(loaded.developmentGoals.find(d=>d.id==='motivation').progress,6);assert.equal(loaded.seasonEvidence.legacyCounts.motivation,6);
 assert.ok(loaded.developmentGoals.every(d=>d.winterProgress===4));
 const settled={...g,pendingSeason:{year:2027,targetTier:9,place:3,outcome:'utrzymanie'}};
 assert.deepEqual((await readCareer(await encodeSave(settled))).developmentGoals,settled.developmentGoals);
});


test('sprawa przeniesiona przed pierwszym meczem plus cztery kolejki nie kończą celu Ludzie',()=>{
 for(const n of [10,22,34]){
  const goal=goalsForSeason(n).find(g=>g.id==='people');let e=recordPeopleEvidence(emptySeasonEvidence(),1,'carried',true);
  for(let match=1;match<=4;match++)e=recordPeopleEvidence(e,match+1,`after-${match}`,true);
  assert.equal(developmentProgressFor(goal,e),5);assert.equal(developmentGoalComplete(goal,e),false);
 }
});
