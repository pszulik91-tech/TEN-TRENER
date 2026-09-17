// Calls production actions: identical to clicks in app/page.tsx.
import './ts-loader.mjs';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { gameActions, migrateGame } from '../app/game-actions.ts';
import { createGame, skillSet, currentFixture } from '../app/game-engine.ts';
import { LEAGUE_PACKS, trainingPresetSessions, FORMATIONS, TEAM_PLANS, DEVELOPMENT_GOALS, startingLicenseEligibility } from '../app/game-data.ts';
import { EVENT_POOL } from '../lib/career-events.mjs';
import { languageBankStats } from '../lib/game-language.mjs';
import { matchMomentStats } from '../lib/match-moments.mjs';

const checks={matches:0,seasons:0,saves:0,moments:0,decisions:0,worldMatches:0};
function make(pack,variant=0){
  const profile=['Mentor','Generał','Spokojny pragmatyk','Hazardzista'][variant%4];
  const experience=pack.tier<=2?'Ponad 10 lat':'4–10 lat'; const age=pack.tier<=2?42:35; const license=pack.tier<=2?'UEFA PRO':pack.tier<=5?'UEFA A':pack.tier<=7?'UEFA B':'Grassroots C'; assert.ok(startingLicenseEligibility(license,'Zawodowiec',experience,age).eligible);
  return createGame({name:`Tester ${pack.id} ${variant}`,age,region:'Śląskie',playingExperience:'Zawodowiec',coachingExperience:experience,profile,license,...skillSet(profile,'Zawodowiec',experience)},pack,pack.teams[variant%pack.teams.length],['analysis','tactics']);
}
function harness(initial){let game=initial;let screen='dashboard'; return {get game(){return game;},set game(g){game=g;},get screen(){return screen;},act(name,...args){const actions=gameActions(game,g=>{game=g;},s=>{screen=s;},['analysis','tactics']);assert.equal(typeof actions[name],'function');actions[name](...args);return game;}};}
function assertFinite(game){
 for(const p of game.players)for(const k of ['baseOVR','fatigue','morale','form','potential'])assert.ok(Number.isFinite(p[k])&&p[k]>=0&&p[k]<=100,`${k} ${p[k]}`);
 for(const t of game.teams){assert.equal(t.played,t.won+t.drawn+t.lost);assert.equal(t.points,t.won*3+t.drawn);}
 assert.equal(new Set(game.players.map(p=>p.id)).size,game.players.length);
}
function playOne(h,variant=0){
 let g=h.game; for(const issue of g.inbox.filter(e=>!e.resolved)){h.act('resolveDecision',issue.id,issue.choices[variant%issue.choices.length].id);checks.decisions++;}
 const plan=['STRONGEST','ROTATION','YOUTH','COUNTER'][variant%4];g=h.game;h.game={...g,teamPlan:TEAM_PLANS[plan]?plan:'STRONGEST',training:{...g.training,sessions:trainingPresetSessions(g.environment.trainingSessions,variant%3===0?'RECOVERY':'BALANCED')}};
 // Every tested career pursues Analysis with an actual pre-match session.
 g=h.game;h.game={...g,training:{...g.training,sessions:g.training.sessions.map((s,i)=>i===0?{...s,focus:'Analiza rywala',intensity:'Niska'}:s)}};
 const before=h.game.players.map(p=>p.baseOVR);h.act('applyTraining');const applied=JSON.stringify(h.game);h.act('applyTraining');assert.equal(JSON.stringify(h.game),applied,'microcycle replay');
 h.act('prepareMatch');assert.ok(h.game.matchState&&!h.game.matchState.completed,'match starts');const prepared=JSON.stringify(h.game);h.act('prepareMatch');assert.equal(JSON.stringify(h.game),prepared,'match reroll');
 let steps=0;while(!h.game.matchState.completed){assert.ok(++steps<35,'match deadlock');const m=h.game.matchState;if(m.activeMomentId){const e=m.coachMoments.find(e=>e.id===m.activeMomentId);h.act('resolveMatchMoment',e.id,e.choices[variant%e.choices.length].id);checks.moments++;}else h.act('advanceMatch');}
 checks.matches++;checks.worldMatches+=h.game.worldActivity.matchesPlayed;
 assert.deepEqual(h.game.players.map(p=>p.baseOVR),before,'Base OVR changes mid-season');
 const m=h.game.matchState;assert.ok(m.shotsHome>=m.homeGoals&&m.shotsAway>=m.awayGoals,'goals exceed shots');
 assert.equal(m.plannedEvents.filter(e=>e.kind==='goal'&&e.side==='home').length,m.homeGoals);
 assert.equal(m.plannedEvents.filter(e=>e.kind==='goal'&&e.side==='away').length,m.awayGoals);
 const saved=JSON.stringify(h.game);const restored=migrateGame(JSON.parse(saved));assert.equal(restored.seed,h.game.seed);assert.deepEqual(restored.fixtures,h.game.fixtures);checks.saves++;
 h.act('dismissMatchReport');assert.equal(h.game.matchState.reportSeen,true);h.game=migrateGame(JSON.parse(JSON.stringify(h.game)));assert.equal(h.game.matchState.reportSeen,true);
 // This navigation used to delete the only date used for recovery.
 h.game={...h.game,matchState:undefined};assertFinite(h.game);
}
function playSeason(h,variant=0){let matches=0;const first=h.game.careerStats.matches;while(!h.game.newSeasonPending){assert.ok(++matches<=50,'season never finishes');playOne(h,variant+matches%2);}
 const g=h.game;assert.ok(g.fixtures.every(f=>f.played),'AI bye or final round left unplayed');assert.equal(g.teams.find(t=>t.id===g.club.id).played,(g.teams.length-1)*2);assert.equal(g.teams.reduce((n,t)=>n+t.gf,0),g.teams.reduce((n,t)=>n+t.ga,0));assert.ok(g.fixtures.at(-1).date.slice(5,7)>='05','season ended before spring');
 checks.seasons++;return{club:g.club.name,tier:g.club.tier,matches:g.careerStats.matches-first,condition:Math.round(g.players.reduce((n,p)=>n+100-p.fatigue,0)/g.players.length),burnout:g.burnout,goals:g.developmentGoals.map(d=>({id:d.id,progress:d.progress,target:d.target})),saveKB:Math.round(JSON.stringify(g).length/1024)};
}
function nextSeason(h){h.act('beginNextSeason');assert.ok(h.game.pendingSeason);if(h.game.employmentStatus==='employed')h.act('stayAtClub');else{assert.ok(h.game.jobOffers.length,'unemployment deadlock');h.act('acceptJob',h.game.jobOffers[0].id);}assert.equal(h.screen,'goals');const before=JSON.stringify(h.game);h.act('applyTraining');assert.equal(JSON.stringify(h.game),before,'goals bypass');h.act('confirmNewSeasonGoals');assert.equal(h.game.developmentGoals.length,2);}

const results=[];
for(const competition of ['Klasa C','Klasa B','Klasa A','Klasa okręgowa','V liga','IV liga','III liga','II liga','I liga','Ekstraklasa']){
 const pack=LEAGUE_PACKS.find(p=>p.competition===competition);if(!pack)continue;
 for(let variant=0;variant<2;variant++){const h=harness(make(pack,variant));const result=playSeason(h,variant);nextSeason(h);playOne(h,variant);results.push({competition,variant,...result,nextTier:h.game.club.tier});console.log(JSON.stringify(results.at(-1)));}
}
// Specifically exercise real odd-sized groups and the initial/last-round bye.
const odd=LEAGUE_PACKS.find(p=>p.teams.length%2===1);if(odd){const h=harness(make(odd));results.push({competition:'odd-sized '+odd.id,...playSeason(h)});}
const longPack=LEAGUE_PACKS.find(p=>p.competition==='Klasa B');const h=harness(make(longPack,3));const long=[];
for(let year=0;year<32;year++){long.push(playSeason(h,year%4));nextSeason(h);if(year%5===4)console.log(`Career checkpoint ${year+1} seasons, age ${h.game.coach.age}`);}
assert.equal(h.game.coach.age,67);h.act('retireCareer');assert.equal(h.game.careerEnded,true,'voluntary retirement after 65');
const report={build:h.game.build,checks,content:{careerScenarios:EVENT_POOL.length,careerChoices:EVENT_POOL.reduce((n,e)=>n+e.choices.length,0),...languageBankStats(),matchMoments:matchMomentStats()},tiers:results,fullCareer:long,limitations:['Beta movement uses data-driven regional parent leagues and simplified promotion places; no official playoffs.','This verifies functional invariants, not that any style is universally balanced or entertaining.']};
writeFileSync('playable-career-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify({checks,content:report.content}));
