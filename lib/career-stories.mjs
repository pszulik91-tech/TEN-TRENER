import { STORY_ARCS, storyCatalogStats, captainFollowup } from './story-catalog.mjs';
import { generateRoundIssues, EVENT_POOL } from './career-events.mjs';
import { rngNext } from './game-rules.mjs';

export function normalizeNarrative(memory,clubId){
 const m=memory??{};
 return {clubId,active:structuredClone(m.clubId===clubId?m.active??[]:[]).filter(a=>STORY_ARCS.some(s=>s.id===a.arcId)).slice(0,2),seen:{...m.seen},recent:[...(m.recent??[])].slice(-80),lastStart:m.lastStart??-5,completed:m.completed??0,decisions:[...(m.decisions??[])].slice(-120)};
}
function seen(memory,key,match){const previous=memory.seen[key];memory.seen[key]={count:(previous?.count??0)+1,last:match};memory.recent=[...memory.recent.filter(k=>k!==key),key].slice(-80);}
function shuffled(choices,seed){const output=structuredClone(choices);for(let i=output.length-1;i>0;i--){const r=rngNext(seed);seed=r.seed;const j=Math.floor(r.value*(i+1));[output[i],output[j]]=[output[j],output[i]];}return {choices:output,seed};}
function issueFor(active,memory,input){
 const arc=STORY_ARCS.find(a=>a.id===active.arcId);const episode=(arc.id==='captain-voice' ? captainFollowup(active.step,active.captainBranch) : undefined) ?? arc.episodes[active.step];
 const id=`story-${active.clubId}-${active.started}-${arc.id}-${active.step}`;
 const prior=active.previousChoice?`Wcześniej: „${active.previousChoice}”. ${active.previousFeedback} `:'';
 const tone=input.worldHumor<45?episode.body.replace(/ Kierownik drużyny.*$| W niższych ligach serwetka.*$/,''):episode.body;
 return {id,templateId:`story:${arc.id}:${active.step}`,category:arc.category,title:episode.title,body:prior+tone,story:{arcId:arc.id,step:active.step,clubId:input.clubId},choices:episode.choices,resolved:false};
}
// Clock is career matches, not round: continuations survive winter and season rollover.
export function generateCareerIssues(input){
 let seed=input.seed;const memory=normalizeNarrative(input.memory,input.clubId);const events=[];const budget=Math.min(2,Math.max(0,input.maxEvents??2));
 for(const active of memory.active){
  if(events.length>=budget)break;
  if(active.waitingEventId||active.due>input.match)continue;
  const e=issueFor(active,memory,input);const shuffledChoices=shuffled(e.choices,seed);seed=shuffledChoices.seed;e.choices=shuffledChoices.choices;active.waitingEventId=e.id;events.push(e);seen(memory,e.templateId,input.match);
 }
 if(events.length<budget && memory.active.length<2 && input.match>=2 && input.match-memory.lastStart>=5){
  const eligible=STORY_ARCS.filter(a=>input.tier>=a.from&&input.tier<=a.to&&!memory.active.some(s=>s.arcId===a.id)&&input.match-(memory.seen[`arc:${a.id}`]?.last??-200)>=96);
  if(eligible.length){const least=Math.min(...eligible.map(a=>memory.seen[`arc:${a.id}`]?.count??0));const pool=eligible.filter(a=>(memory.seen[`arc:${a.id}`]?.count??0)===least);const roll=rngNext(seed);seed=roll.seed;const arc=pool[Math.floor(roll.value*pool.length)];const active={arcId:arc.id,clubId:input.clubId,step:0,due:input.match,started:input.match};const e=issueFor(active,memory,input);const mix=shuffled(e.choices,seed);seed=mix.seed;e.choices=mix.choices;active.waitingEventId=e.id;memory.active.push(active);memory.lastStart=input.match;seen(memory,`arc:${arc.id}`,input.match);seen(memory,e.templateId,input.match);events.push(e);}
 }
 const batch=generateRoundIssues({...input,seed,maxEvents:budget-events.length,memory:memory.seen,blockedIds:memory.recent,context:input.context});seed=batch.seed;
 for(const event of batch.events){const mix=shuffled(event.choices,seed);seed=mix.seed;events.push({...event,id:`career-${input.match}-${event.id}`,choices:mix.choices});seen(memory,event.templateId,input.match);}
 return {seed,memory,events};
}
export function recordStoryDecision(memory,event,choice,match,clubId,seed){
 const next=normalizeNarrative(memory,clubId);if(!event.story)return {memory:next,seed};
 const active=next.active.find(a=>a.arcId===event.story.arcId && a.waitingEventId===event.id && a.step===event.story.step && a.clubId===event.story.clubId);
 if(!active)return {memory:next,seed};
 if(active.arcId==='captain-voice' && active.step===0){
  const route=choice.id==='standards'?'public-standards':['support','delegate'].includes(choice.id)?'consultation':undefined;
  if(route) active.captainBranch={route,firstChoice:choice.label};
 }
 next.decisions=[...next.decisions,{arcId:active.arcId,step:active.step,match,choice:choice.label,title:event.title,clubId}].slice(-120);
 if(active.step===2){next.active=next.active.filter(a=>a!==active);next.completed++;}
 else{const roll=rngNext(seed);seed=roll.seed;active.step++;active.due=match+2+Math.floor(roll.value*3);active.previousChoice=choice.label;active.previousFeedback=choice.feedback;active.waitingEventId=undefined;}
 return {memory:next,seed};
}
export function narrativeStats(){const stories=storyCatalogStats();return {standalone:EVENT_POOL.length,...stories,totalSituations:EVENT_POOL.length+stories.episodes,totalChoices:EVENT_POOL.reduce((n,e)=>n+e.choices.length,0)+stories.choices};}
