import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {generateCareerIssues,recordStoryDecision,narrativeStats} from '../lib/career-stories.mjs';
const runs=[];let totalEvents=0,totalCompleted=0;
for(let tier=1;tier<=10;tier++)for(let scenario=0;scenario<6;scenario++){
 let memory,seed=8419+scenario*193+tier,issues=[],lastTitles=[],repeats=0,events=0,continuations=0;const seen=new Set();
 for(let match=1;match<=1000;match++){
  const b=generateCareerIssues({seed,memory,match,round:1+(match-1)%30,tier,result:['win','draw','loss'][match%3],worldHumor:30+scenario*12,clubId:'club-'+Math.floor((match-1)/300),maxEvents:Math.max(0,3-issues.length),recentTitles:lastTitles.slice(-36).reverse(),context:{fatigue:match%50,burnout:match%45}});seed=b.seed;memory=b.memory;assert.ok(b.events.length<=2);issues.push(...b.events);
  for(const event of b.events){events++;seen.add(event.templateId);continuations+=event.story?.step>0?1:0;if(lastTitles.slice(-8).includes(event.title))repeats++;lastTitles.push(event.title);lastTitles=lastTitles.slice(-80);}
  for(const e of issues){const r=recordStoryDecision(memory,e,e.choices[(match+scenario)%e.choices.length],match,memory.clubId,seed);memory=r.memory;seed=r.seed;}issues=[];
  if(match%30===0){const saved=JSON.stringify(memory);memory=JSON.parse(saved);assert.equal(JSON.stringify(memory),saved);}
 }
 assert.equal(repeats,0);assert.ok(continuations>150);assert.ok(memory.recent.length<=80&&memory.decisions.length<=120);totalEvents+=events;totalCompleted+=memory.completed;runs.push({tier,scenario,uniqueSituations:seen.size,events,continuations,completed:memory.completed,repeatWithin8:repeats});
}
const report={build:'2.4',generatorRuns:60,matchesPerRun:1000,totalGeneratorRounds:60000,totalEvents,totalCompleted,catalog:narrativeStats(),runs,meaning:'Generator and memory audit, not 60 full simulated football careers; no claim of proving entertainment value.'};writeFileSync('narrative-audit-2.4.json',JSON.stringify(report,null,2));console.log(JSON.stringify({rounds:60000,totalEvents,totalCompleted,uniqueMinimum:Math.min(...runs.map(r=>r.uniqueSituations)),uniqueMaximum:Math.max(...runs.map(r=>r.uniqueSituations)),repeatWithin8:0,catalog:report.catalog}));
