import { simulateMatchPlan, rngNext } from '../lib/game-rules.mjs';
import { mentalityProfile } from '../lib/match-mentality.mjs';

export function simulateMentalities(samples = 6000) {
 const rows=[];
 for(const [minute,own,opponent] of [[30,0,0],[70,0,1],[80,1,0]]) {
  for(const mentality of ['Defensywna','Zrównoważona','Ofensywna']) {
   let seed=202609, gf=0,ga=0,win=0,draw=0,loss=0,recovered=0,conceded=0,zeroTwo=0;
   const profile=mentalityProfile(mentality,minute,own-opponent,true);
   for(let i=0;i<samples;i++) {
    seed=rngNext(seed).seed;
    const sim=simulateMatchPlan(seed,52,52,'Nasz klub','Rywal',profile);
    const goals=side=>sim.events.filter(e=>e.minute>minute&&e.kind==='goal'&&e.side===side).length;
    const h=goals('home'), a=goals('away');gf+=h;ga+=a;
    if(own+h>opponent+a)win++;else if(own+h===opponent+a)draw++;else loss++;
    if(own+h>=opponent+a)recovered++;if(a>0)conceded++;if(own+h===0&&opponent+a===2)zeroTwo++;
   }
   rows.push({minute,score:`${own}:${opponent}`,mentality,samples,ownAttack:profile.homeAttack,opponentAttack:profile.awayAttack,goalsFor:gf/samples,goalsAgainst:ga/samples,win:100*win/samples,draw:100*draw/samples,loss:100*loss/samples,recovered:100*recovered/samples,conceded:100*conceded/samples,zeroTwo:100*zeroTwo/samples});
  }
 }
 return rows;
}
if(process.argv[1]?.endsWith('/mentality-simulation.mjs'))console.log(JSON.stringify(simulateMentalities(),null,2));
