// Independent fictional catalogue; no import of the source league database.
const regions=['Dolnośląski','Kujawsko-pomorski','Lubelski','Lubuski','Łódzki','Małopolski','Mazowiecki','Opolski','Podkarpacki','Podlaski','Pomorski','Śląski','Świętokrzyski','Warmińsko-mazurski','Wielkopolski','Zachodniopomorski'];
const competitions=['Ekstraklasa','I liga','II liga','III liga','IV liga','V liga','Klasa okręgowa','Klasa A','Klasa B','Klasa C'];
export const VERIFIED_LEAGUE_PACKS=competitions.flatMap((competition,i)=>{
 const tier=i+1;return (tier<=3?['Krajowy']:regions).map((region,r)=>({
  id:`publisher-${tier}-${r}`,association:`Region ${region}`,district:'Okręg demonstracyjny',competition,group:`Grupa ${r+1}`,tier,
  teams:Array.from({length:tier<=3?18:12},(_,t)=>`Klub ${tier<=3?'Krajowy':region} ${String(tier).padStart(2,'0')}-${String(t+1).padStart(2,'0')}`),
  source:'Fikcyjny katalog demonstracyjny TEN TRENER',
 }));
});
export const LEAGUE_CATALOG_STATS=Object.freeze({associations:16,groups:VERIFIED_LEAGUE_PACKS.length,teams:VERIFIED_LEAGUE_PACKS.reduce((n,p)=>n+p.teams.length,0)});

const coachRegions=["Dolnośląskie","Kujawsko-pomorskie","Lubelskie","Lubuskie","Łódzkie","Małopolskie","Mazowieckie","Opolskie","Podkarpackie","Podlaskie","Pomorskie","Śląskie","Świętokrzyskie","Warmińsko-mazurskie","Wielkopolskie","Zachodniopomorskie"];
export function publisherAssociation(region){const index=coachRegions.indexOf(region);return index>=0?`Region ${regions[index]}`:undefined;}
