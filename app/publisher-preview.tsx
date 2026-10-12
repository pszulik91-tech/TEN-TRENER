import {useEffect,useState} from 'react';
import {createPublisherTelemetry} from '../lib/publisher-telemetry.mjs';
import {BUILD} from './build-info';
let tracker:ReturnType<typeof createPublisherTelemetry>|undefined;
function metrics(){if(typeof window==='undefined')return undefined;try{return tracker??=createPublisherTelemetry(window.localStorage,()=>performance.now(),BUILD);}catch{return undefined;}}
export function publisherEvent(event:string){metrics()?.record(event);}
export function observePublisherState(game:Parameters<ReturnType<typeof createPublisherTelemetry>['observe']>[0]){metrics()?.observe(game);}
export function PublisherMetrics(){
 const [enabled,setEnabled]=useState(()=>metrics()?.enabled()??false);const [message,setMessage]=useState('');
 useEffect(()=>{metrics()?.start();const end=()=>metrics()?.record('session_duration');window.addEventListener('pagehide',end);return()=>window.removeEventListener('pagehide',end);},[]);
 const download=()=>{const m=metrics();if(!m)return;const url=URL.createObjectURL(new Blob([JSON.stringify(m.export(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='ten-trener-publisher-metrics.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return <section className="publisher-metrics"><h3>Dobrowolny pomiar sesji testowej</h3><p>Wyłącznie na tym urządzeniu: kroki rozgrywki i czas sesji. Bez nazwisk, danych kariery, identyfikatorów, fingerprintingu i wysyłania do serwera. Domyślnie wyłączony. Po sesji pobierz raport i dołącz go do odpowiedzi osobie, od której otrzymałeś link. Plik nie zawiera zapisu kariery. Nie podawaj danych osobowych w nazwie trenera.</p><label><input type="checkbox" checked={enabled} onChange={e=>{if(metrics()?.consent(e.target.checked)){setEnabled(e.target.checked);setMessage('');}else setMessage('Przeglądarka nie pozwala zapisać preferencji. Gra działa dalej.');}} /> Włącz lokalny pomiar testu</label><div><button onClick={download} disabled={!enabled}>Eksportuj anonimowy raport</button><button onClick={()=>{metrics()?.clear();setMessage('Raport wyczyszczony. Przy włączonym pomiarze zaczyna się nowa sesja.');}}>Wyczyść raport</button></div>{message&&<p role="status">{message}</p>}</section>;
}
