import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {VERIFIED_LEAGUE_PACKS as packs, LEAGUE_CATALOG_STATS as stats} from '../lib/publisher-catalog.mjs';
import {publisherLabel} from '../lib/publisher-labels.mjs';
import {licenseCoversCompetition} from '../lib/game-rules.mjs';
test('publisher uses independently generated fictional clubs at every existing tier',async()=>{
 assert.equal(new Set(packs.map(p=>p.id)).size,packs.length);assert.deepEqual([...new Set(packs.map(p=>p.tier))],[1,2,3,4,5,6,7,8,9,10]);
 assert.equal(stats.teams,packs.reduce((n,p)=>n+p.teams.length,0));assert.equal(new Set(packs.flatMap(p=>p.teams)).size,stats.teams);
 for(const pack of packs){assert.match(pack.source,/Fikcyjny/);assert.equal(pack.teams.length%2,0);for(const name of pack.teams)assert.match(name,/^Klub /);}
 const source=await readFile(new URL('../lib/publisher-catalog.mjs',import.meta.url),'utf8');assert.doesNotMatch(source,/\bimport\b.*from|90minut|RegioWyniki|generated-regional/);
 assert.equal(licenseCoversCompetition('Grassroots C','Klasa B'),true);assert.equal(licenseCoversCompetition('Grassroots C','I liga'),false);
});
test('neutral labels keep the internal licence and locality rules untouched',()=>{
 assert.equal(publisherLabel('UEFA B • Śląski ZPN • Ekstraklasa'),'Licencja B • Śląski związek regionalny • Liga krajowa');
 assert.equal(publisherLabel('Kondycja 58% • Bardzo zmęczony'),'Kondycja 58% • Bardzo zmęczony');
});
test('publisher build excludes imported catalogue and historical public assets',async()=>{
 const config=await readFile(new URL('../vite.web.config.ts',import.meta.url),'utf8');assert.match(config,/publisher-catalog/);assert.match(config,/publicDir: "publisher-public"/);
 const assets=await readdir(new URL('../dist/assets/',import.meta.url));const js=(await Promise.all(assets.filter(p=>p.endsWith('.js')).map(p=>readFile(new URL('../dist/assets/'+p,import.meta.url),'utf8')))).join('');
 assert.doesNotMatch(js,/Lech Poznań|Legia Warszawa|RegioWyniki|90minut\.pl|snapshot 2026\/27/);assert.match(js,/Fikcyjny katalog demonstracyjny/);assert.match(js,/ten-trener-publisher-fictional-v1/);
 const exported=await readdir(new URL('../dist/',import.meta.url));assert(!exported.includes('qa'));assert(!exported.includes('beta-report.html'));
});
