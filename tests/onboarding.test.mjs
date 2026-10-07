import '../scripts/ts-loader.mjs';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { COACH_REGIONS, initialCoachDraft, interviewProgress, updateCoachDraft, entrySummary, arrivalBriefing, needsClubArrival } from '../app/coach-onboarding.ts';
import { LEAGUE_PACKS, PSYCH_QUESTIONS, resolveCoachProfile, startingLicenseEligibility } from '../app/game-data.ts';
import { createGame, skillSet } from '../app/game-engine.ts';
import { gameActions, migrateGame } from '../app/game-actions.ts';
import { encodeSave, decodeSave } from '../lib/save-codec.mjs';

const answers = Object.fromEntries(PSYCH_QUESTIONS.map(q => [q.id, 0]));
const readyDraft = () => ({ ...initialCoachDraft(), name: 'Nowy Trener', psychAnswers: answers, profile: resolveCoachProfile(answers) });
const root = new URL('../', import.meta.url).pathname;
const vite = await createServer({ appType:'custom', configFile:false, root, resolve:{alias:{'@':root}}, server:{middlewareMode:true,hmr:{port:0}} });
after(() => vite.close());
function act(g, name, ...args) { let out=g; gameActions(g, next => out=next, () => {})[name](...args); return out; }

test('kreator wymaga poprawnego imienia, wieku, regionu, licencji i ośmiu odpowiedzi', () => {
  assert.equal(COACH_REGIONS.length, 16);
  assert.equal(new Set(COACH_REGIONS).size, 16);
  assert.equal(interviewProgress(initialCoachDraft()).complete, false);
  assert.equal(interviewProgress(readyDraft()).complete, true);
  for (const patch of [{name:'  '},{age:29},{age:46},{age:NaN},{age:35.5},{region:'Inny region'},{license:'UEFA PRO'}, {psychAnswers:{...answers,mistake:99}}, {psychAnswers:{...answers,mistake:undefined}}]) assert.equal(interviewProgress({...readyDraft(),...patch}).complete,false,JSON.stringify(patch));
});

test('zmiana wieku lub kariery koryguje licencję i doświadczenie bez kasowania ankiety', () => {
  const original = {...readyDraft(),age:45,playingExperience:'Reprezentant',coachingExperience:'Ponad 10 lat',license:'UEFA PRO'};
  const young=updateCoachDraft(original,'age',30);
  assert.equal(startingLicenseEligibility(young.license,young.playingExperience,young.coachingExperience,young.age).eligible,true);
  const amateur=updateCoachDraft(young,'playingExperience','Amator');
  const debut=updateCoachDraft(amateur,'coachingExperience','Debiutant');
  assert.equal(debut.license,'Grassroots C');assert.deepEqual(debut.psychAnswers,answers);assert.equal(original.license,'UEFA PRO');
});

test('wizytówka pokazuje dostępne szczeble zgodnie z regułami, a nie wiekiem lub reputacją', () => {
  const d=readyDraft();assert.equal(entrySummary(d).highest,'Klasa A');
  assert.ok(!entrySummary(d).competitions.includes('Ekstraklasa'));
  assert.equal(entrySummary({...d,license:'UEFA B'}).highest,'V liga');
  assert.equal(entrySummary({...d,license:'UEFA A'}).highest,'II liga');
  assert.equal(entrySummary({...d,license:'UEFA PRO'}).highest,'Ekstraklasa');
});

test('pierwszy ekran ma tylko tożsamość i wizytówkę, a ukończony wywiad pozwala wrócić z wyboru klubu', async () => {
  const {Creator}=await vite.ssrLoadModule('/app/coach-interview.tsx');
  const render=draft=>renderToStaticMarkup(React.createElement(Creator,{draft,stage:interviewProgress(draft).complete?3:0,setStage(){},questionIndex:0,setQuestionIndex(){},setDraft(){},onBack(){},onNext(){}}));
  const start=render(initialCoachDraft());
  assert.match(start,/Jak mamy pana przedstawić/);assert.match(start,/O doświadczeniu/);
  assert.equal((start.match(/<option\b/g)||[]).length,16);
  assert.doesNotMatch(start,/Derby, 0:1|Jako zawodnik/);
  assert.match(start,/<button[^>]*disabled[^>]*>O doświadczeniu/);
  const end=render(readyDraft());assert.match(end,/Trener gotowy/);assert.match(end,/Wybierz pierwszy klub/);
  assert.match(end,/aria-current="step"/);assert.match(end,/Wróć do odpowiedzi/);
});

for(const competition of ['Klasa B','IV liga','Ekstraklasa']) test(`powitanie → trening → debiut → zapis działa na szczeblu ${competition}`,async()=>{
  const draft={...readyDraft(),age:45,playingExperience:'Reprezentant',coachingExperience:'Ponad 10 lat',license:competition==='Klasa B'?'Grassroots C':competition==='IV liga'?'UEFA A':'UEFA PRO'};
  const pack=LEAGUE_PACKS.find(p=>p.competition===competition);
  let g=createGame({...draft,...skillSet(draft.profile,draft.playingExperience,draft.coachingExperience)},pack,pack.teams[0],['analysis','tactics']);
  assert.equal(needsClubArrival(g),true);
  const scene=arrivalBriefing(g).scene;
  assert.match(scene,competition==='Klasa B'?/Świetlica/:competition==='IV liga'?/Gabinet/:/Sala prasowa/);
  const {ClubArrival}=await vite.ssrLoadModule('/app/club-arrival.tsx');
  const html=renderToStaticMarkup(React.createElement(ClubArrival,{game:g,resolveDecision(){},go(){}}));
  assert.match(html,/Ułóż pierwszy mikrocykl/);assert.match(html,/Twoje dwa cele/);
  const personal=g.pressures.personal;
  g=act(g,'resolveDecision','welcome','ack');assert.ok(g.pressures.personal>=personal && g.pressures.personal<=personal+2);assert.ok(g.lastDecisionOutcome.changes.length>0);assert.equal(needsClubArrival(g),false);
  assert.equal(act(g,'resolveDecision','welcome','ack'),g);
  g=migrateGame(await decodeSave(await encodeSave(g)));assert.equal(needsClubArrival(g),false);
  g=act(g,'applyTraining');assert.equal(g.training.completedRound,1);assert.equal(act(g,'applyTraining'),g);
  g=act(g,'prepareMatch');
  for(let i=0;i<40&&!g.matchState.completed;i++){
    if(g.matchState.activeMomentId){const m=g.matchState.coachMoments.find(m=>m.id===g.matchState.activeMomentId);g=act(g,'resolveMatchMoment',m.id,m.choices[0].id);}else g=act(g,'advanceMatch');
  }
  assert.equal(g.matchState.completed,true);assert.equal(g.careerStats.matches,1);assert.equal(needsClubArrival(g),false);
  g=act(g,'dismissMatchReport');assert.equal(g.matchState.reportSeen,true);
  const loaded=migrateGame(await decodeSave(await encodeSave(g)));assert.equal(needsClubArrival(loaded),false);assert.equal(loaded.matchState.reportSeen,true);assert.equal(loaded.seed,g.seed);
});

test('ekran startowy przedstawia komplet menu i bezpieczny stan bez zapisu', async () => {
 const {StartScreen}=await vite.ssrLoadModule('/app/setup-screens.tsx');
 const html=renderToStaticMarkup(React.createElement(StartScreen,{hasSave:false,onNew(){},onLoad(){}}));
 for(const label of ['NOWA KARIERA','KONTYNUUJ','USTAWIENIA','O PROJEKCIE','Pre-Alpha']) assert.ok(html.includes(label));
 assert.match(html,/<button[^>]*\sdisabled=""[^>]*>[\s\S]*?KONTYNUUJ/);
 const saved=renderToStaticMarkup(React.createElement(StartScreen,{hasSave:true,onNew(){},onLoad(){}}));
 assert.doesNotMatch(saved,/<button[^>]*\sdisabled=""/);
});
