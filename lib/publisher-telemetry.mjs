export const TELEMETRY_KEY = 'ten-trener-publisher-metrics-v1';
export const CONSENT_KEY = 'ten-trener-publisher-metrics-consent-v1';
const EVENTS = new Set(['session_start','return_to_game','new_career','creator_completed','club_entered','career_resumed','training_completed','match_started','match_completed','first_week_completed','session_duration']);
// Local, opt-in, allowlisted data only. No identifiers, timestamps, URLs or game payloads.
export function createPublisherTelemetry(storage, clock, build) {
 let started, session, previous, pendingCareer=false, clubReported=false;
 const empty=()=>({version:1,build,sessions:[]});
 const read=()=>{
  try{
   const raw=JSON.parse(storage.getItem(TELEMETRY_KEY)||'null');
   if(raw?.version!==1||!Array.isArray(raw.sessions))return empty();
   return {version:1,build,sessions:raw.sessions.slice(-20).map(s=>({
    events:(Array.isArray(s?.events)?s.events:[]).filter(e=>EVENTS.has(e?.event)&&Number.isFinite(e.elapsedSeconds)&&e.elapsedSeconds>=0).slice(0,200).map(e=>({event:e.event,elapsedSeconds:e.elapsedSeconds})),
    ...(Number.isFinite(s?.durationSeconds)&&s.durationSeconds>=0?{durationSeconds:s.durationSeconds}:{}),
   }))};
  }catch{return empty();}
 };
 const enabled=()=>{try{return storage.getItem(CONSENT_KEY)==='yes';}catch{return false;}};
 const persist=report=>{try{storage.setItem(TELEMETRY_KEY,JSON.stringify(report));return true;}catch{return false;}};
 const start=()=>{
  if(!enabled()||session)return;
  const report=read();started=clock();session={events:[]};
  const returning=report.sessions.length>0;report.sessions=report.sessions.slice(-19);report.sessions.push(session);persist(report);
  record('session_start');if(returning)record('return_to_game');
 };
 const record=event=>{
  if(!EVENTS.has(event)||!enabled())return;
  if(!session){start();if(!session)return;}
  if(event==='new_career'){pendingCareer=true;clubReported=false;previous=undefined;}
  if(event==='club_entered'){clubReported=true;pendingCareer=false;previous=undefined;}
  const elapsedSeconds=Math.max(0,Math.round((clock()-started)/1000));
  if(event==='session_duration')session.durationSeconds=elapsedSeconds;
  else if(session.events.length<200)session.events.push({event,elapsedSeconds});
  const report=read();report.build=build;report.sessions[report.sessions.length-1]=session;persist(report);
 };
 const observe=game=>{
  if(!enabled()||!game)return;
  start();
  const now={round:game.round,trained:game.training.completedRound,match:game.matchState?.fixture.round,complete:Boolean(game.matchState?.completed),matches:game.careerStats.matches};
  if(!previous){if(!clubReported)record(pendingCareer?'club_entered':'career_resumed');pendingCareer=false;clubReported=false;}
  else {
   if(now.trained===now.round&&previous.trained!==now.trained)record('training_completed');
   if(now.match!==previous.match&&now.match!==undefined&&!now.complete)record('match_started');
   if(now.complete&&(!previous.complete||now.match!==previous.match)){record('match_completed');if(now.matches===1)record('first_week_completed');}
  }
  previous=now;
 };
 const consent=value=>{
  try{storage.setItem(CONSENT_KEY,value?'yes':'no');}catch{return false;}
  if(value)start();else{session=undefined;started=undefined;previous=undefined;pendingCareer=false;clubReported=false;}return true;
 };
 const clear=()=>{try{storage.removeItem(TELEMETRY_KEY);}catch{}session=undefined;previous=undefined;pendingCareer=false;clubReported=false;if(enabled())start();};
 return {enabled,start,record,observe,consent,clear,export:()=>{record('session_duration');return read();}};
}
