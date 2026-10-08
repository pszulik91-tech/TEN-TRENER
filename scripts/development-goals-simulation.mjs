import { pathToFileURL } from 'node:url';
import { goalsForSeason, emptySeasonEvidence, recordMatchEvidence, recordPeopleEvidence, refreshDevelopmentGoals, developmentGoalComplete, goalProgressText } from '../lib/development-goals.mjs';
import { generateCareerIssues, recordStoryDecision } from '../lib/career-stories.mjs';
import { resolveIssueEffects } from '../lib/career-events.mjs';

// Controlled season of real qualifying behaviours, with 20% losses and deliberate
// missed preparation/analysis/youth weeks. Uses the existing event generator.
export function simulateDevelopmentSeason(matches, initialSeed=42, tier=9) {
 let seed=initialSeed, memory, evidence=emptySeasonEvidence();const goals=goalsForSeason(matches), snapshots={}, completions={};
 let issueWeeks=0, positiveWeeks=0;let recentIssues=[];
 for(let round=1;round<=matches;round++){
  const result=round%5===4?'loss':round%5===3?'draw':'win';
  const priorResult=(round-1)%5===4?'loss':(round-1)%5===3?'draw':'win';
  const batch=round===1?{seed,memory,events:[]}:generateCareerIssues({memory,clubId:'simulation',match:round-1,seed,round:round-1,tier,result:priorResult,worldHumor:35,context:{fatigue:18,burnout:20},recentTitles:recentIssues.map(e=>e.title),recentCategories:recentIssues.map(e=>e.category),maxEvents:2});seed=batch.seed;memory=batch.memory;
  if(batch.events.length)issueWeeks++;recentIssues=[...batch.events,...recentIssues].slice(0,60);
  const before=evidence.peopleRounds.length;
  for(const event of batch.events){
   const choice=event.choices.find(c=>(c.effects.pressures?.dressing??0)<=0)??event.choices[0];
   const resolved=resolveIssueEffects(seed,choice.effects);seed=resolved.seed;
   evidence=recordPeopleEvidence(evidence,round,event.id,event.choices.length>1 && !['Kontrakt','Archiwum','Ewaluacja','Pamięć szatni'].includes(event.category) && (resolved.effects.pressures?.dressing??0)<=0);
   const story=recordStoryDecision(memory,event,choice,round,'simulation',seed);memory=story.memory;seed=story.seed;
  }
  if(evidence.peopleRounds.length>before)positiveWeeks++;
  evidence=recordMatchEvidence(evidence,round,{readiness:round%4?80:65,averageMorale:round%3?72:65,preMatchPressure:round%4?50:35,result,analysisAttempted:round%4!==0,analysisImproved:round%4!==0},['4-2-3-1','4-4-2','3-5-2'][(round-1)%3],round%4?['a','b','c'].slice(0,(round%3)+1):[]);
  for(const goal of goals)if(!completions[goal.id]&&developmentGoalComplete(goal,evidence))completions[goal.id]=round;
  if([4,Math.ceil(matches/2),matches].includes(round))snapshots[String(round)]=refreshDevelopmentGoals(goals,evidence).map(g=>({id:g.id,progress:goalProgressText(g,evidence),completed:developmentGoalComplete(g,evidence)}));
 }
 return {matches,tier,issueWeeks,positiveWeeks,behaviour:'20% porażek; pominięte przygotowanie/analiza/U21 w co czwartej kolejce; morale poniżej progu w co trzeciej',goals:refreshDevelopmentGoals(goals,evidence).map(g=>({id:g.id,label:g.label,target:g.target,requirement:g.description,earliest:g.id==='people'?g.target-1:g.target,earliestNote:g.id==='people'?'Dolna granica z jedną sprawą przeniesioną sprzed pierwszego meczu; bez niej potrzeba jeszcze jednego spotkania.':'Liczba rozegranych spotkań klubu; pauzy mogą opóźnić numer kolejki ligowej.',completedAt:completions[g.id]??null,completed:developmentGoalComplete(g,evidence)})),snapshots};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
 const seasons=[10,22,34].map(n=>simulateDevelopmentSeason(n));
 const cadence=[1,5,9].map(tier=>({tier,...Object.fromEntries([10,22,34].map(n=>{const successes=Array.from({length:100},(_,i)=>simulateDevelopmentSeason(n,i+1,tier));return [n,{min:Math.min(...successes.map(s=>s.positiveWeeks)),mean:successes.reduce((sum,s)=>sum+s.positiveWeeks,0)/100,max:Math.max(...successes.map(s=>s.positiveWeeks)),peopleTarget:goalsForSeason(n).find(g=>g.id==='people').target,completedSeasons:successes.filter(s=>s.goals.find(g=>g.id==='people').completed).length}];}))}));
 console.log(JSON.stringify({seasons,cadence},null,2));
}
