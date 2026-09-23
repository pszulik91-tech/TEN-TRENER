import test from 'node:test';
import assert from 'node:assert/strict';
import {generateCareerIssues,recordStoryDecision,normalizeNarrative,narrativeStats} from '../lib/career-stories.mjs';
import {STORY_ARCS} from '../lib/story-catalog.mjs';
import {EVENT_POOL,generateRoundIssues} from '../lib/career-events.mjs';
import {testerReport} from '../lib/tester-report.mjs';
const input={seed:4567,round:2,tier:9,result:'win',worldHumor:65,match:2,clubId:'club-a',maxEvents:2,context:{fatigue:10,burnout:8}};
test('211 różnych sytuacji, unikalne ID i konkretne koszty wyborów',()=>{
 const stats=narrativeStats();assert.equal(stats.totalSituations,211);assert.equal(stats.totalChoices,633);
 assert.equal(new Set(EVENT_POOL.map(e=>e.id)).size,EVENT_POOL.length);
 assert.equal(new Set([...EVENT_POOL,...STORY_ARCS.flatMap(a=>a.episodes)].map(e=>e.title)).size,211);
 for(const e of [...EVENT_POOL,...STORY_ARCS.flatMap(a=>a.episodes)]){assert.ok(e.choices.length>=2);assert.equal(new Set(e.choices.map(c=>c.label)).size,e.choices.length);for(const c of e.choices){assert.ok(c.feedback.length>10);assert.ok(Object.keys(c.effects).length>0);}}
});
test('ciąg dalszy czeka na wybór i zaplanowane 2–4 mecze',()=>{
 let batch=generateCareerIssues(input);const issue=batch.events.find(e=>e.story);assert.ok(issue);
 const stillWaiting=generateCareerIssues({...input,memory:batch.memory,match:10,seed:batch.seed});assert.ok(!stillWaiting.events.some(e=>e.story?.arcId===issue.story.arcId));
 const result=recordStoryDecision(batch.memory,issue,issue.choices[0],2,input.clubId,batch.seed);const active=result.memory.active.find(a=>a.arcId===issue.story.arcId);assert.ok(active.due>=4&&active.due<=6);
 const before=generateCareerIssues({...input,memory:result.memory,match:active.due-1,seed:result.seed});assert.ok(!before.events.some(e=>e.story?.arcId===active.arcId));
 const due=generateCareerIssues({...input,memory:result.memory,match:active.due,seed:result.seed});const follow=due.events.find(e=>e.story?.arcId===active.arcId);assert.equal(follow.story.step,1);assert.ok(follow.body.includes(issue.choices[0].label));
});
test('zapis/odczyt zachowuje wątek, treść odpowiedzi oraz losowanie',()=>{
 const b=generateCareerIssues(input);const e=b.events.find(e=>e.story);const choice=e.choices[1];const r=recordStoryDecision(b.memory,e,choice,2,input.clubId,b.seed);const a={...input,memory:r.memory,match:8,seed:r.seed};assert.deepEqual(generateCareerIssues(a),generateCareerIssues(JSON.parse(JSON.stringify(a))));
});
test('generowanie i wybór nie mutują poprzedniego save oraz nie zaliczają odpowiedzi dwukrotnie',()=>{
 const b=generateCareerIssues(input);const snapshot=JSON.stringify(b);const e=b.events.find(e=>e.story);const r=recordStoryDecision(b.memory,e,e.choices[0],2,input.clubId,b.seed);assert.equal(JSON.stringify(b),snapshot);const again=recordStoryDecision(r.memory,e,e.choices[0],2,input.clubId,r.seed);assert.deepEqual(again,r);
});
test('zmiana klubu zamyka stare wątki, lecz zachowuje historię tematów',()=>{
 const b=generateCareerIssues(input);const changed=normalizeNarrative(b.memory,'club-b');assert.equal(changed.active.length,0);assert.deepEqual(changed.seen,b.memory.seen);assert.ok(b.memory.active.length);
});
test('limit skrzynki nie generuje niewidocznych zdarzeń ani ukrytych skutków',()=>{
 const b=generateCareerIssues({...input,maxEvents:0});assert.equal(b.events.length,0);assert.equal(b.memory.active.length,0);assert.deepEqual(b.memory.seen,{});
});
test('warunki zdarzeń nie wymuszają kryzysu zmęczenia w świeżej kadrze',()=>{
 for(let seed=0;seed<600;seed++){const b=generateCareerIssues({...input,seed});assert.ok(!b.events.some(e=>['env-heavy-legs-new','env-family-week'].includes(e.templateId)));for(const e of b.events)if(e.story){const a=STORY_ARCS.find(a=>a.id===e.story.arcId);assert.ok(input.tier>=a.from&&input.tier<=a.to);}}
});
test('pakiet zgłoszenia nie zawiera nazwiska trenera, zawodników ani pełnego save',()=>{
 const g={build:'2.4',coach:{name:'SECRET COACH'},players:[{name:'SECRET PLAYER'}],club:{name:'Klub',tier:9,competition:'B'},careerStats:{seasons:1,matches:20},inbox:[],training:{readiness:70}};
 const report=testerReport(g,{category:'Zapis',description:'  Opis problemu  '},{width:390,height:844,touch:true});const raw=JSON.stringify(report);assert.ok(!raw.includes('SECRET'));assert.equal(report.description,'Opis problemu');assert.equal(report.device.width,390);
});

test('kryzys wyników nie pojawia się po wygranej ani w pierwszych kolejkach',()=>{
 const crisisIds=EVENT_POOL.filter(e=>["Lider nie chce być twarzą kryzysu","Liczby przeczą intuicji"].includes(e.title)).map(e=>e.id);
 const memory=Object.fromEntries(EVENT_POOL.map(e=>[e.id,{count:crisisIds.includes(e.id)?0:100,last:0}]));
 let found=0;
 for(let seed=1;seed<=500;seed++){
  for(const [result,round] of [["win",10],["loss",1]]){
   const batch=generateRoundIssues({...input,seed,result,round,memory});
   assert.ok(!batch.events.some(e=>crisisIds.includes(e.templateId)));
  }
  found+=generateRoundIssues({...input,tier:4,seed,result:"loss",round:5,memory}).events.filter(e=>crisisIds.includes(e.templateId)).length;
 }
 assert.ok(found>0);
});
