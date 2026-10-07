import test from 'node:test';
import assert from 'node:assert/strict';
import { STORY_ARCS } from '../lib/story-catalog.mjs';
import { generateCareerIssues, recordStoryDecision, normalizeNarrative } from '../lib/career-stories.mjs';
import { gameActions, migrateGame } from '../app/game-actions.ts';
import { createGame, skillSet } from '../app/game-engine.ts';
import { LEAGUE_PACKS } from '../app/game-data.ts';
import { resolveIssueEffects } from '../lib/career-events.mjs';
import { encodeSave, decodeSave } from '../lib/save-codec.mjs';

const arc=STORY_ARCS.find(a=>a.id==='captain-voice');
const input={seed:4567,round:2,tier:9,result:'win',worldHumor:65,match:2,clubId:'club-a',maxEvents:1,context:{fatigue:10,burnout:8}};
function entry(clubId=input.clubId,arcId=arc.id) {
 const memory={...normalizeNarrative(undefined,clubId),lastStart:2,active:[{arcId,clubId,step:0,due:2,started:2}]};
 return generateCareerIssues({...input,clubId,memory});
}
function choose(batch,id,match=2) {
 const event=batch.events[0];const choice=event.choices.find(c=>c.id===id);assert.ok(choice);
 const recorded=recordStoryDecision(batch.memory,event,choice,match,input.clubId,batch.seed);
 const active=recorded.memory.active[0];
 return generateCareerIssues({...input,memory:recorded.memory,seed:recorded.seed,match:active.due});
}
function sorted(choices) {return [...choices].sort((a,b)=>a.id.localeCompare(b.id));}
function startGame() {
 const pack=LEAGUE_PACKS.find(p=>p.competition==='Klasa B');
 return createGame({name:'Test kapitana',age:35,region:'Dolnośląskie',playingExperience:'Amator',coachingExperience:'Debiutant',profile:'Mentor',license:'Grassroots C',...skillSet('Mentor','Amator','Debiutant')},pack,pack.teams[0],['analysis','tactics']);
}
function resolve(g,event,id) {let out=g;gameActions({...g,inbox:[event]},next=>out=next,()=>{}).resolveDecision(event.id,id);return out;}

test('część 1 bez zmian, pierwsze wybory tworzą inne odcinki i dostępne decyzje',()=>{
 const e=entry();assert.deepEqual(sorted(e.events[0].choices),sorted(arc.episodes[0].choices));
 const a=choose(e,'support');const b=choose(e,'standards');
 assert.notEqual(a.events[0].title,b.events[0].title);
 assert.notEqual(a.events[0].body,b.events[0].body);
 assert.notDeepEqual(a.events[0].choices.map(c=>c.id).sort(),b.events[0].choices.map(c=>c.id).sort());
 assert.notDeepEqual(a.events[0].choices.map(c=>c.effects),b.events[0].choices.map(c=>c.effects));
 for(const [batch,choice] of [[a,'support'],[b,'standards']]) assert.ok(batch.events[0].body.includes(arc.episodes[0].choices.find(c=>c.id===choice).label));
 assert.equal(choose(e,'delegate').memory.active[0].captainBranch.route,'consultation');
});

test('finał zachowuje gałąź pierwszej decyzji po nadpisaniu previousChoice',()=>{
 const a2=choose(entry(),'support');const b2=choose(entry(),'standards');
 const a3=choose(a2,'captain-pilot',a2.memory.active[0].due);
 const b3=choose(b2,'captain-repair',b2.memory.active[0].due);
 assert.equal(a3.memory.active[0].previousChoice,'Sprawdzam propozycję przez jeden mikrocykl');
 assert.equal(a3.memory.active[0].captainBranch.firstChoice,'Rozmawiam z nim bez świadków');
 assert.ok(a3.events[0].body.includes('Rozmawiam z nim bez świadków'));
 assert.ok(b3.events[0].body.includes('Wyjaśniam zasady przy drużynie'));
 assert.notEqual(a3.events[0].title,b3.events[0].title);
 assert.notDeepEqual(sorted(a3.events[0].choices),sorted(b3.events[0].choices));
 // The second choice does not create a larger tree or change the opening branch.
 const alternative=choose(a2,'captain-refine',a2.memory.active[0].due);
 assert.equal(alternative.events[0].title,a3.events[0].title);
 assert.deepEqual(sorted(alternative.events[0].choices),sorted(a3.events[0].choices));
});

test('realna akcja gry stosuje efekty wariantów oraz zamyka finał tylko raz',()=>{
 const base=startGame();base.burnout=10;base.training.readiness=50;
 const first=entry(base.club.id);let g=resolve({...base,narrative:first.memory},first.events[0],'support');
 const active=g.narrative.active[0];const second=generateCareerIssues({...input,clubId:g.club.id,memory:g.narrative,seed:g.seed,match:active.due});
 const before={...g,narrative:second.memory,careerStats:{...g.careerStats,matches:active.due}};
 const pilotEffects=resolveIssueEffects(before.seed,second.events[0].choices.find(c=>c.id==='captain-pilot').effects).effects;
 const after=resolve(before,second.events[0],'captain-pilot');
 assert.equal(after.training.readiness,before.training.readiness+pilotEffects.readiness);assert.equal(after.burnout,before.burnout+pilotEffects.burnout);
 after.players.forEach((p,i)=>assert.equal(p.morale,before.players[i].morale+pilotEffects.teamMorale));
 const finalActive=after.narrative.active[0];const final=generateCareerIssues({...input,clubId:after.club.id,memory:after.narrative,seed:after.seed,match:finalActive.due});
 const closing={...after,narrative:final.memory,careerStats:{...after.careerStats,matches:finalActive.due}};
 const finalEffects=resolveIssueEffects(closing.seed,final.events[0].choices.find(c=>c.id==='captain-consult-rhythm').effects).effects;
 const done=resolve(closing,final.events[0],'captain-consult-rhythm');
 assert.equal(done.narrative.active.length,0);assert.equal(done.narrative.completed,1);
 assert.equal(done.players.reduce((n,p)=>n+p.relation,0)-closing.players.reduce((n,p)=>n+p.relation,0),3*finalEffects.relation);
 assert.equal(done.players[0].morale,closing.players[0].morale+finalEffects.teamMorale);
 let twice=done;gameActions(done,next=>twice=next,()=>{}).resolveDecision(final.events[0].id,'captain-consult-rhythm');assert.equal(twice,done);
 const other=entry(base.club.id);const b=resolve({...base,narrative:other.memory},other.events[0],'standards');const ba=b.narrative.active[0];
 const episode=generateCareerIssues({...input,clubId:b.club.id,memory:b.narrative,seed:b.seed,match:ba.due});
 const enforceEffects=resolveIssueEffects(b.seed,episode.events[0].choices.find(c=>c.id==='captain-enforce').effects).effects;
 const enforced=resolve({...b,narrative:episode.memory},episode.events[0],'captain-enforce');
 assert.equal(enforced.pressures.dressing,b.pressures.dressing+enforceEffects.pressures.dressing);assert.equal(enforced.training.readiness,b.training.readiness+enforceEffects.readiness);
 assert.equal(enforced.players.reduce((n,p)=>n+p.relation,0)-b.players.reduce((n,p)=>n+p.relation,0),3*enforceEffects.relation);
});

test('kompresowany zapis między odcinkami zachowuje gałąź i deterministyczny finał',async()=>{
 for(const opening of ['support','standards']) {
  const second=choose(entry(),opening);const g=startGame();g.club.id=input.clubId;g.narrative=second.memory;
  const loaded=migrateGame(await decodeSave(await encodeSave(g)));
  assert.deepEqual(loaded.narrative,g.narrative);
  const params={...input,memory:second.memory,seed:second.seed,match:second.memory.active[0].due};
  // waitingEventId must be retained: loading does not emit a duplicate episode.
  assert.deepEqual(generateCareerIssues(params),generateCareerIssues({...params,memory:loaded.narrative}));
  const event=second.events[0];const decision=recordStoryDecision(second.memory,event,event.choices[0],params.match,input.clubId,second.seed);
  const saved=await decodeSave(await encodeSave({...g,narrative:decision.memory}));
  const due=decision.memory.active[0].due;
  const final=generateCareerIssues({...input,memory:decision.memory,seed:decision.seed,match:due});
  assert.deepEqual(final,generateCareerIssues({...input,memory:migrateGame(saved).narrative,seed:decision.seed,match:due}));
 }
});

test('stary save bez gałęzi i nieznana gałąź używają pierwotnych odcinków',()=>{
 for(const step of [1,2]) {
  for(const captainBranch of [undefined,{route:'unknown',firstChoice:'Stary wybór'}]) {
   const memory={...normalizeNarrative(undefined,input.clubId),lastStart:2,active:[{arcId:arc.id,clubId:input.clubId,step,due:2,started:2,previousChoice:'Stary wybór',captainBranch}]};
   const g=startGame();g.club.id=input.clubId;g.narrative=JSON.parse(JSON.stringify(memory));
   const loaded=migrateGame(JSON.parse(JSON.stringify(g)));
   const batch=generateCareerIssues({...input,memory:loaded.narrative});
   assert.equal(batch.events[0].title,arc.episodes[step].title);
   assert.deepEqual(sorted(batch.events[0].choices),sorted(arc.episodes[step].choices));
   const done=recordStoryDecision(batch.memory,batch.events[0],batch.events[0].choices[0],2,input.clubId,batch.seed);
   if(step===1) assert.equal(generateCareerIssues({...input,memory:done.memory,seed:done.seed,match:done.memory.active[0].due}).events[0].title,arc.episodes[2].title);
   else assert.equal(done.memory.completed,1);
  }
 }
});

test('gałęzie są deterministyczne i nie zmieniają innych wątków',()=>{
 const base=entry();const snapshot=structuredClone(base);
 assert.deepEqual(choose(base,'support'),choose(base,'support'));assert.deepEqual(base,snapshot);
 for(const other of STORY_ARCS.filter(a=>a.id!==arc.id)) for(const step of [1,2]) {
  const memory={...normalizeNarrative(undefined,input.clubId),lastStart:2,active:[{arcId:other.id,clubId:input.clubId,step,due:2,started:2,captainBranch:{route:'consultation',firstChoice:'Nie dotyczy'}}]};
  const batch=generateCareerIssues({...input,memory});
  assert.equal(batch.events[0].title,other.episodes[step].title);assert.equal(batch.events[0].body,other.episodes[step].body);
  assert.deepEqual(sorted(batch.events[0].choices),sorted(other.episodes[step].choices));
 }
});
