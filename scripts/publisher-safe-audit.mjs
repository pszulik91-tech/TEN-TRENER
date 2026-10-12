import assert from 'node:assert/strict';
import {LEAGUE_PACKS,SAVE_KEY} from '../app/game-data.ts';
import {createGame,skillSet} from '../app/game-engine.ts';
import {gameActions} from '../app/game-actions.ts';
import {readCareer} from '../app/save-storage.ts';
assert.equal(SAVE_KEY,'ten-trener-publisher-fictional-v1');
function act(g,name,...args){let next=g;gameActions(g,value=>next=value,()=>{})[name](...args);return next;}
for(const tier of [2,5,9]){
 const pack=LEAGUE_PACKS.find(p=>p.tier===tier);const coach={name:'Test fikcyjnego świata',age:35,region:'Śląskie',playingExperience:'Zawodowiec',coachingExperience:'4–10 lat',profile:'Mentor',license:'UEFA PRO',...skillSet('Mentor','Zawodowiec','4–10 lat')};
 let g=createGame(coach,pack,pack.teams[0],['analysis','tactics']);assert(g.world.competitions.every(p=>p.teams.every(t=>t.name.startsWith('Klub '))));
 g=act(act(g,'applyTraining'),'prepareMatch');
 for(let i=0;i<20&&!g.matchState.completed;i++){const m=g.matchState.coachMoments?.find(m=>m.id===g.matchState.activeMomentId&&!m.resolvedChoiceId);g=m?act(g,'resolveMatchMoment',m.id,m.choices[0].id):act(g,'advanceMatch');}
 assert.equal(g.matchState.completed,true);assert.equal(g.careerStats.matches,1);assert.equal(g.round,2);let loaded=await readCareer(JSON.stringify(g));assert.equal(loaded.club.name,g.club.name);assert.equal(loaded.players[0].fatigue,g.players[0].fatigue);
 await assert.rejects(()=>readCareer(JSON.stringify({...g,club:{...g.club,name:'Foreign source club'}})),/fikcyjnego katalogu/);
 console.log(JSON.stringify({tier,club:g.club.name,matches:g.careerStats.matches,save:'PASS',world:'fictional'}));
}
