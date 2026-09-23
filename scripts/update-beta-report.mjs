import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
const career=JSON.parse(readFileSync('playable-career-audit.json','utf8'));
const narrative=JSON.parse(readFileSync('narrative-audit-2.4.json','utf8'));
let html=readFileSync('public/beta-report.html','utf8');
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const grouped=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
html=html.replace(/<b>\d+ sezony<\/b>/,`<b>${career.checks.seasons} sezony</b>`)
 .replace(/<b>\d+ meczów<\/b>/,`<b>${career.checks.matches} meczów</b>`)
 .replace(/<b>[\d ]+<\/b>spotkania świata w teście/,`<b>${grouped(career.checks.worldMatches)}</b>spotkania świata w teście`)
 .replace(/Testy produkcyjnej pętli gry rozpatrzyły \d+ sprawy pozameczowe i \d+ reakcji z ławki/,`Testy produkcyjnej pętli gry rozpatrzyły ${career.checks.decisions} sprawy pozameczowe i ${career.checks.moments} reakcji z ławki`)
 .replace(/\d[\d ]* wydarzeń i \d+ domkniętych historii/,`${grouped(narrative.totalEvents)} wydarzeń i ${narrative.totalCompleted} domkniętych historii`);
const start=html.indexOf('<tbody>',html.indexOf('Różne ligi'));
const end=html.indexOf('</tbody>',start);
if(start<0||end<0)throw new Error('Missing tier table in report');
html=html.slice(0,start)+'<tbody>'+career.tiers.filter(t=>t.variant!==undefined).map(t=>`<tr><td>${escape(t.competition)}</td><td>${t.variant+1}</td><td>${t.matches}</td><td>${t.condition}%</td><td>${t.burnout}%</td></tr>`).join('')+html.slice(end);
const highest=Math.min(...career.fullCareer.map(s=>s.tier));
const levels={1:'Ekstraklasa',2:'I liga',3:'II liga',4:'III liga',5:'IV liga',6:'liga na poziomie 6',7:'liga na poziomie 7',8:'liga na poziomie 8',9:'liga na poziomie 9',10:'liga na poziomie 10'};
html=html.replace(/Najwyższym osiągniętym szczeblem była [^.]+\./,`Najwyższym osiągniętym szczeblem była ${levels[highest]}.`);
writeFileSync('public/beta-report.html',html);
copyFileSync('playable-career-audit.json','public/qa/playable-career-audit.json');
copyFileSync('narrative-audit-2.4.json','public/qa/narrative-audit-2.4.json');
console.log(JSON.stringify({checks:career.checks,highestTier:highest,narrativeEvents:narrative.totalEvents}));
