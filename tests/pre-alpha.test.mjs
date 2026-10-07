import '../scripts/ts-loader.mjs';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, skillSet } from '../app/game-engine.ts';
import { gameActions } from '../app/game-actions.ts';
import { LEAGUE_PACKS, SAVE_KEY, LICENSE_COURSES } from '../app/game-data.ts';
import { BUILD, VERSION } from '../app/build-info.ts';
import { startLicenseCourse } from '../app/license-actions.ts';
import { storeCareer, readCareer, resumeScreen, activeCareer } from '../app/save-storage.ts';

const memory = new Map();
const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  setItem: (key,value) => memory.set(key,value), getItem: key => memory.get(key) ?? null,
}});
after(() => { if (original) Object.defineProperty(globalThis,'localStorage',original); else delete globalThis.localStorage; });
function start() {
 const pack = LEAGUE_PACKS.find(p => p.competition === 'Klasa B' && p.teams.length >= 12);
 return createGame({name:'Kariera wydania',age:35,region:'Śląskie',playingExperience:'Amator',coachingExperience:'Debiutant',profile:'Mentor',license:'Grassroots C',...skillSet('Mentor','Amator','Debiutant')},pack,pack.teams[0],['analysis','tactics']);
}
function act(g,name,...args){let next=g;gameActions(g,value=>next=value,()=>{})[name](...args);return next;}
function finish(g) {
 g=act(act(g,'applyTraining'),'prepareMatch');
 for(let n=0;n<40&&!g.matchState.completed;n++){
  const moment=g.matchState.coachMoments.find(m=>m.id===g.matchState.activeMomentId);
  g=moment?act(g,'resolveMatchMoment',moment.id,moment.choices[0].id):act(g,'advanceMatch');
 }
 assert.equal(g.matchState.completed,true);return g;
}

test('wydanie semantyczne nie zmienia klucza starych zapisów', async () => {
 const game=start();assert.match(VERSION,/^\d+\.\d+\.\d+$/);assert.match(BUILD,/Pre-Alpha/);assert.equal(SAVE_KEY,'ten-trener-save-v1');
 const loaded=await readCareer(JSON.stringify({...game,build:'TEN TRENER Build 2.5'}));
 assert.equal(loaded.build,BUILD);assert.equal(loaded.seed,game.seed);assert.deepEqual(loaded.world,JSON.parse(JSON.stringify(game.world)));
});
test('asynchroniczny zapis nie nadpisuje nowszej decyzji starszą', async () => {
 const game=start();const newer={...game,seed:game.seed+1,history:['Najnowsza decyzja',...game.history]};
 await Promise.all([storeCareer(game),storeCareer(newer)]);
 const loaded=await readCareer(memory.get(SAVE_KEY));assert.equal(loaded.seed,newer.seed);assert.equal(loaded.history[0],'Najnowsza decyzja');assert.equal(activeCareer(),newer);
});
test('błędny import nie narusza istniejącego zapisu', async () => {
 await storeCareer(start());const before=memory.get(SAVE_KEY);
 for(const input of ['{','{}','null','TTGZ1:broken']) await assert.rejects(()=>readCareer(input));
 assert.equal(memory.get(SAVE_KEY),before);
});
test('wznowienie prowadzi do meczu, celów lub letnich rozmów zależnie od zapisu', () => {
 const game=start();assert.equal(resumeScreen(game),'dashboard');
 const match=act(act(game,'applyTraining'),'prepareMatch');assert.equal(resumeScreen(match),'match');
 assert.equal(resumeScreen({...game,developmentGoals:[]}),'goals');
 assert.equal(resumeScreen({...game,pendingSeason:{year:2027,targetTier:9,place:1,outcome:'awans'}}),'jobs');
});
test('kurs wymaga pieniędzy lub zgody klubu i nie pobiera opłaty ponownie', () => {
 const game=start();const broke={...game,finances:{...game.finances,personalFunds:0}};
 assert.equal(startLicenseCourse(broke,'self').licenseCourse,undefined);
 const funded={...game,finances:{...game.finances,personalFunds:50000}};
 const enrolled=startLicenseCourse(funded,'self');assert.equal(enrolled.finances.personalFunds,50000-LICENSE_COURSES['UEFA B'].cost);assert.equal(startLicenseCourse(enrolled,'self'),enrolled);
 const refused=startLicenseCourse({...broke,coach:{...broke.coach,reputation:0},president:{...broke.president,ambition:0,footballKnowledge:0,financialCaution:100}},'club');assert.equal(refused.licenseCourse,undefined);
 const approved=startLicenseCourse({...broke,president:{...broke.president,ambition:100,footballKnowledge:100,financialCaution:0}},'club');assert.equal(approved.licenseCourse.funding,'club');assert.equal(approved.finances.personalFunds,0);
});
test('pełny kurs UEFA B kończy się po meczach; zapis zachowuje nową licencję', async () => {
 let game=start();game=startLicenseCourse({...game,finances:{...game.finances,personalFunds:50000}},'self');
 const duration=game.licenseCourse.weeksRemaining;
 for(let week=0;week<duration;week++) game=finish(game);
 assert.equal(game.coach.license,'UEFA B');assert.equal(game.licenseCourse,undefined);
 const loaded=await readCareer(JSON.stringify(game));assert.equal(loaded.coach.license,'UEFA B');assert.equal(loaded.careerStats.matches,duration);
});

import { updateTeamResult, rngNext } from '../lib/game-rules.mjs';
test('kontrolny spadek: ostatni klub Ekstraklasy trafia do I ligi z nowym terminarzem', async () => {
 // A controlled final table exercises a branch absent from the natural career sample.
 // This is not reported as an additional fully played season.
 const pack=LEAGUE_PACKS.find(p=>p.competition==='Ekstraklasa');
 let g=createGame({name:'Test spadku',age:42,region:'Wielkopolskie',playingExperience:'Reprezentant',coachingExperience:'Ponad 10 lat',profile:'Mentor',license:'UEFA PRO',...skillSet('Mentor','Reprezentant','Ponad 10 lat')},pack,pack.teams[0],['analysis','tactics']);
 let teams=g.teams;
 const fixtures=g.fixtures.map(f=>{const homeGoals=f.home===g.club.id?0:f.away===g.club.id?2:1;const awayGoals=f.home===g.club.id?2:0;teams=updateTeamResult(teams,f.home,f.away,homeGoals,awayGoals);return {...f,played:true,homeGoals,awayGoals};});
 let seed=1;while(rngNext(seed).value<.95)seed++;
 g={...g,teams,fixtures,seed,newSeasonPending:true,date:fixtures.at(-1).date,pressures:{...g.pressures,board:0},president:{...g.president,patience:100,unpredictability:0}};
 g=act(g,'beginNextSeason');assert.equal(g.pendingSeason.outcome,'spadek');assert.equal(g.careerStats.relegations,1);assert.equal(g.employmentStatus,'employed');
 const name=g.club.name;g=act(g,'stayAtClub');assert.equal(g.club.name,name);assert.equal(g.club.competition,'I liga');assert.equal(g.season,'2027/28');assert.ok(g.fixtures.every(f=>!f.played&&f.date>='2027-07-01'));assert.equal(g.teams.filter(t=>t.id===g.club.id).length,1);
 const loaded=await readCareer(JSON.stringify(g));assert.equal(loaded.club.competition,'I liga');assert.equal(resumeScreen(loaded),'goals');
});
