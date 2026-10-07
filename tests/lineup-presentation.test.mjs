import test from 'node:test';
import assert from 'node:assert/strict';
import { lineupView, lineupChange, absenceLabel } from '../app/lineup-presentation.ts';
import { FORMATIONS } from '../app/game-data.ts';
import { effectiveOVR, selectLineupForPlan, normalizeSlot, lineupSelectionReason, TEAM_PLANS } from '../lib/game-rules.mjs';

function fixture(plan='STRONGEST') {
 const players=FORMATIONS['4-2-3-1'].map((slot,i)=>({id:`p${i}`,name:`Zawodnik ${i}`,age:30,primary:normalizeSlot(slot),secondary:[],baseOVR:60,form:50,morale:50,fatigue:0,relation:50,potential:65,personality:'',status:''}));
 players[5]={...players[5],name:'Marek Kowalski',fatigue:60};
 players[6]={...players[6],name:'Piotr Nowak',fatigue:60};
 players.push({...players[5],id:'fresh1',name:'Jan Wójcik',baseOVR:53,fatigue:0,age:20},{...players[6],id:'fresh2',name:'Adam Zieliński',baseOVR:53,fatigue:0,age:20}, {...players[0],id:'injured',name:'Kontuzjowany',baseOVR:99,injuryWeeks:2}, {...players[0],id:'absent',name:'Nieobecny',baseOVR:99,absenceRounds:1,absenceReason:'Zmiana w pracy'});
 const formation=TEAM_PLANS[plan].formation;
 return {players,teamPlan:plan,tactic:{...TEAM_PLANS[plan].tactic,formation,assignments:selectLineupForPlan(players,FORMATIONS[formation],plan)}};
}
function switchPlan(g,plan) {const formation=TEAM_PLANS[plan].formation;return {...g,teamPlan:plan,tactic:{...g.tactic,...TEAM_PLANS[plan].tactic,formation,assignments:selectLineupForPlan(g.players,FORMATIONS[formation],plan)}};}

test('prezentacja odczytuje dokładne assignments selektora i prawdziwe absencje',()=>{
 const g=fixture();const view=lineupView(g);
 assert.deepEqual(Object.fromEntries(view.entries.map(e=>[e.slot,e.player.id])),g.tactic.assignments);
 assert.equal(view.entries.length,11);assert.equal(view.outside.length,4);
 assert.ok(view.entries.every(e=>!['injured','absent'].includes(e.player.id)));
 assert.equal(absenceLabel(g.players.find(p=>p.id==='injured')),'Kontuzja: 2 tyg.');
 assert.equal(absenceLabel(g.players.find(p=>p.id==='absent')),'Zmiana w pracy: 1 kolejek');
});

test('zmiana nazwisk, wejścia/wyjścia i parametry wynikają z rzeczywistych zawodników',()=>{
 const a=fixture();const b=switchPlan(a,'ROTATION');const diff=lineupChange(a,b);
 assert.deepEqual(diff.entering.map(e=>e.player.name),['Jan Wójcik','Adam Zieliński']);
 assert.deepEqual(diff.leaving.map(p=>p.name),['Marek Kowalski','Piotr Nowak']);
 for(const [g,key] of [[a,'Before'],[b,'After']]) {
  const slots=FORMATIONS[g.tactic.formation];const selected=slots.map(slot=>g.players.find(p=>p.id===g.tactic.assignments[slot]));
  assert.equal(diff[`quality${key}`],Math.round(selected.reduce((sum,p,i)=>sum+effectiveOVR(p,slots[i]),0)/11));
  assert.equal(diff[`condition${key}`],Math.round(selected.reduce((sum,p)=>sum+100-p.fatigue,0)/11));
 }
 assert.deepEqual([diff.qualityBefore,diff.qualityAfter,diff.conditionBefore,diff.conditionAfter],[59,59,89,100]);
 assert.deepEqual(lineupChange(a,b),diff);
});

test('powód wymienia zastosowane reguły, nie wymyśla premii wieku ani zdolności',()=>{
 const a=fixture();const diff=lineupChange(a,switchPlan(a,'ROTATION'));
 for(const e of diff.entering) {assert.match(e.reason,/Naturalna pozycja.*priorytet kondycji \(100%\).*obsady pozostałych pozycji/);assert.doesNotMatch(e.reason,/premia za wiek|szybkość|technika/);}
 const young=a.players.find(p=>p.id==='fresh1');
 assert.match(lineupSelectionReason(young,'DP','YOUTH'),/premia za wiek U21/);
 assert.doesNotMatch(lineupSelectionReason({...young,age:30},'DP','YOUTH'),/premia za wiek/);
 assert.match(lineupSelectionReason(young,'N','EXPERIENCE'),/poza naturalną.*poniżej 25 lat obniża/);
 assert.doesNotMatch(lineupSelectionReason(young,'N','EXPERIENCE'),/premia za doświadczenie/);
});

test('selektor zachowuje wyniki sprzed GAME-04 dla wszystkich planów i kondycji',async()=>{
 const {readFile}=await import('node:fs/promises');
 // Captured from main 4638c3a before GAME-04, not from the modified implementation.
 const golden=JSON.parse(await readFile(new URL('./fixtures/lineup-before-game04.json',import.meta.url),'utf8'));
 for(const plan of Object.keys(TEAM_PLANS)) for(const fatigue of [0,40,90]) {
  const players=fixture().players.map(p=>({...p,fatigue:p.id.startsWith('fresh')?0:fatigue}));
  assert.deepEqual(selectLineupForPlan(players,FORMATIONS[TEAM_PLANS[plan].formation],plan),golden[`${plan}:${fatigue}`]);
 }
});

test('używany ekran renderuje nazwiska i porównanie po rzeczywistym kliknięciu planu',async()=>{
 const {createServer}=await import('vite');const React=await import('react');const {default:TestRenderer,act}=await import('react-test-renderer');
 globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const root=new URL('../',import.meta.url).pathname;const vite=await createServer({appType:'custom',configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true,hmr:false}});
 let renderer;
 try {
  const {SquadV15}=await vite.ssrLoadModule('/app/gameplay-screens.tsx');let game=fixture();
  function Wrapper(){const [g,setG]=React.useState(game);game=g;return React.createElement(SquadV15,{game:g,setGame:setG,go:()=>{}});}
  await act(async()=>{renderer=TestRenderer.create(React.createElement(Wrapper));});
  const cards=()=>renderer.root.findAll(n=>n.type==='article'&&n.props['data-player-id']);
  assert.deepEqual(Object.fromEntries(cards().map(n=>[n.props['data-slot'],n.props['data-player-id']])),game.tactic.assignments);
  const button=renderer.root.findAllByType('button').find(n=>n.findAllByType('strong').some(s=>s.children.join('')==='Rotacja'));
  await act(async()=>button.props.onClick());
  assert.equal(game.teamPlan,'ROTATION');
  assert.deepEqual(Object.fromEntries(cards().map(n=>[n.props['data-slot'],n.props['data-player-id']])),game.tactic.assignments);
  const json=JSON.stringify(renderer.toJSON());assert.match(json,/Marek Kowalski/);assert.match(json,/Jan Wójcik/);assert.match(json,/Wchodzą/);assert.match(json,/Wypadają/);assert.match(json,/priorytet kondycji/);assert.match(json,/Zmiana w pracy/);
  assert.equal(game.lineupChange,undefined);
 } finally {if(renderer)await act(async()=>renderer.unmount());await vite.close();delete globalThis.IS_REACT_ACT_ENVIRONMENT;}
});
