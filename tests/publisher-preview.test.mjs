import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createPublisherTelemetry, TELEMETRY_KEY, CONSENT_KEY } from '../lib/publisher-telemetry.mjs';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};};
const state=(extra={})=>({round:1,training:{completedRound:null},careerStats:{matches:0},...extra});
const events=t=>t.export().sessions.flatMap(s=>s.events.map(e=>e.event));
test('telemetria jest domyślnie wyłączona, nie ingeruje w stan ani zapis kariery',()=>{
 const storage=memory(),t=createPublisherTelemetry(storage,()=>0,'test'),g=state(),before=structuredClone(g);
 t.start();t.record('new_career');t.observe(g);assert.deepEqual(g,before);assert.equal(storage.getItem(TELEMETRY_KEY),null);assert.deepEqual(t.export().sessions,[]);
});
test('zgoda zapisuje wyłącznie dozwolone kroki i względny czas, bez danych gracza',()=>{
 let time=0;const storage=memory(),t=createPublisherTelemetry(storage,()=>time,'preview');t.consent(true);t.record('new_career');t.record('creator_completed');
 const g=state({coach:{name:'PRIVATE',region:'PRIVATE'},seed:42});t.observe(g);t.observe(g);
 t.observe(state({training:{completedRound:1}}));t.observe(state({training:{completedRound:1},matchState:{fixture:{round:1},completed:false}}));
 time=125000;t.observe(state({round:2,training:{completedRound:1},careerStats:{matches:1},matchState:{fixture:{round:1},completed:true}}));
 t.record('PRIVATE');const report=t.export();assert.equal(report.sessions[0].durationSeconds,125);
 assert.deepEqual(events(t),['session_start','new_career','creator_completed','club_entered','training_completed','match_started','match_completed','first_week_completed']);
 assert.doesNotMatch(JSON.stringify(report),/PRIVATE|seed|coach|region|timestamp|sessionId|playerId/);
 t.consent(false);const before=storage.getItem(TELEMETRY_KEY);t.record('new_career');assert.equal(storage.getItem(TELEMETRY_KEY),before);assert.equal(storage.getItem(CONSENT_KEY),'no');
});
test('wczytanie raportu meczu nie tworzy fikcyjnego ukończenia tygodnia; nowa kariera resetuje obserwację',()=>{
 const storage=memory(),t=createPublisherTelemetry(storage,()=>0,'test');t.consent(true);t.observe(state({matchState:{fixture:{round:1},completed:true},careerStats:{matches:1}}));
 assert.deepEqual(events(t),['session_start','career_resumed']);t.record('new_career');t.observe(state());assert.equal(events(t).at(-1),'club_entered');
 const returned=createPublisherTelemetry(storage,()=>0,'test');returned.start();assert.deepEqual(events(returned).slice(-2),['session_start','return_to_game']);
});
test('log jest ograniczony, odfiltrowuje dodatkowe pola, obsługuje uszkodzenie i brak storage',()=>{
 const storage=memory();storage.setItem(TELEMETRY_KEY,JSON.stringify({version:1,name:'SECRET',sessions:[{name:'SECRET',events:[{event:'training_completed',elapsedSeconds:1,name:'SECRET'},{event:'SECRET',elapsedSeconds:2}]}]}));
 const t=createPublisherTelemetry(storage,()=>0,'test');assert.doesNotMatch(JSON.stringify(t.export()),/SECRET/);t.consent(true);for(let n=0;n<250;n++)t.record('training_completed');assert.equal(t.export().sessions.at(-1).events.length,200);
 t.clear();assert.deepEqual(events(t),['session_start']);storage.setItem(TELEMETRY_KEY,'{');assert.doesNotThrow(()=>t.export());
 const blocked=createPublisherTelemetry({getItem(){throw Error();},setItem(){throw Error();},removeItem(){throw Error();}},()=>0,'test');assert.equal(blocked.consent(true),false);assert.doesNotThrow(()=>{blocked.observe(state());blocked.clear();blocked.export();});
});
test('Publisher Preview zachowuje prawdziwy onboarding i nie dodaje trackera sieciowego',async()=>{
 const about=await readFile(new URL('../app/about-project.tsx',import.meta.url),'utf8');assert.match(about,/PUBLISHER INFO/);assert.match(about,/Czego szukamy/);assert.match(about,/nie finalnym produktem/);
 const setup=await readFile(new URL('../app/setup-screens.tsx',import.meta.url),'utf8');assert.match(setup,/15–20 minut/);assert.match(setup,/Cel zarządu poznasz po rozpoczęciu kariery/);assert.doesNotMatch(setup,/index % 4/);
 const telemetry=await readFile(new URL('../lib/publisher-telemetry.mjs',import.meta.url),'utf8');assert.doesNotMatch(telemetry,/fetch\(|sendBeacon|XMLHttpRequest/);
 const metrics=await readFile(new URL('../app/publisher-preview.tsx',import.meta.url),'utf8');assert.match(metrics,/Domyślnie wyłączony/);assert.match(metrics,/Eksportuj anonimowy raport/);
 const board=await readFile(new URL('../app/board-goal-panel.tsx',import.meta.url),'utf8');assert.match(board,/Przed pierwszym meczem/);
});
