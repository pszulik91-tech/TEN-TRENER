export type Screen = "start" | "creator" | "club" | "goals" | "dashboard" | "squad" | "tactics" | "training" | "match" | "table" | "career";
export type Position = "BR" | "PO" | "ŚO" | "LO" | "DP" | "ŚP" | "PP" | "ŚPO" | "LP" | "N";
export type License = "Grassroots D" | "UEFA C" | "UEFA B" | "UEFA A" | "UEFA PRO";
export type CoachProfile = "Mentor" | "Generał" | "Taktyczny obsesyjny" | "Wynikowiec" | "Dyplomata" | "Trener od zapierdolu" | "Hazardzista" | "Spokojny pragmatyk";

export type LeaguePack = { id: string; association: string; district: string; competition: string; group: string; tier: number; teams: string[]; source?: string };
export type Player = { id: string; name: string; age: number; primary: Position; secondary: Position[]; baseOVR: number; form: number; morale: number; fatigue: number; relation: number; potential: number; personality: string; status: string };
export type Team = { id: string; name: string; ovr: number; played: number; won: number; drawn: number; lost: number; gf: number; ga: number; points: number };
export type Fixture = { round: number; home: string; away: string; played: boolean; homeGoals?: number; awayGoals?: number };
export type MatchEvent = { minute: number; text: string; kind: "goal" | "card" | "injury" | "chance" | "info"; side: "home" | "away" | "neutral" };
export type MatchState = { fixture: Fixture; minute: number; homeGoals: number; awayGoals: number; plannedEvents: MatchEvent[]; shotsHome: number; shotsAway: number; possessionHome: number; completed: boolean };
export type DevelopmentGoal = { id: string; label: string; description: string; progress: number; target: number };
export type Coach = { name: string; age: number; region: string; playingExperience: string; coachingExperience: string; profile: CoachProfile; license: License; reputation: number; skills: Record<string, number> };
export type Club = { id: string; name: string; association: string; district: string; competition: string; group: string; tier: number };
export type Tactic = { formation: keyof typeof FORMATIONS; mentality: string; tempo: string; pressing: string; line: string; width: string; buildUp: string; passingRisk: string; assignments: Record<string, string> };
export type GameState = {
  build: string; seed: number; coach: Coach; club: Club; season: string; date: string; round: number; teams: Team[]; fixtures: Fixture[]; players: Player[]; tactic: Tactic;
  training: { focus: string; intensity: string; recovery: boolean; readiness: number };
  squadPolicy: string; pressures: Record<string, number>; burnout: number; president: Record<string, number>; presidentName: string;
  developmentGoals: DevelopmentGoal[]; history: string[]; inbox: { id: string; title: string; body: string; resolved: boolean }[]; matchState?: MatchState; newSeasonPending?: boolean;
};

export const SAVE_KEY = "ten-trener-save-v1";
export const BUILD = "TEN TRENER Build 1.0";
export const LICENSE_MIN_TIER: Record<License, number> = { "Grassroots D": 9, "UEFA C": 8, "UEFA B": 6, "UEFA A": 3, "UEFA PRO": 1 };
export const COACH_PROFILES: CoachProfile[] = ["Mentor", "Generał", "Taktyczny obsesyjny", "Wynikowiec", "Dyplomata", "Trener od zapierdolu", "Hazardzista", "Spokojny pragmatyk"];
export const PROFILE_NOTE: Record<CoachProfile, string> = {
  Mentor: "Rozwój i relacje. Trudniej narzucić dyscyplinę w kryzysie.", Generał: "Dyscyplina i reakcja na presję. Ryzyko konfliktów w szatni.",
  "Taktyczny obsesyjny": "Mocne przygotowanie meczowe. Wyższe obciążenie psychiczne.", Wynikowiec: "Duża mobilizacja na teraz. Słabsza cierpliwość do rozwoju.",
  Dyplomata: "Lepsze relacje z prezesem i mediami. Mniej ostrych reakcji.", "Trener od zapierdolu": "Wysoka intensywność i energia. Więcej zmęczenia oraz urazów.",
  Hazardzista: "Większy sufit odważnych decyzji. Duża zmienność konsekwencji.", "Spokojny pragmatyk": "Stabilność i odporność. Mniej gwałtownych skoków formy.",
};
export const DEVELOPMENT_GOALS: Omit<DevelopmentGoal, "progress">[] = [
  { id: "tactics", label: "Taktyka", description: "Osiągnij 72% przygotowania taktycznego w 8 meczach.", target: 8 },
  { id: "motivation", label: "Motywacja", description: "Utrzymuj średnie morale pierwszej XI powyżej 68.", target: 10 },
  { id: "people", label: "Zarządzanie ludźmi", description: "Rozwiąż 4 sytuacje bez utraty szatni.", target: 4 },
  { id: "analysis", label: "Analiza", description: "Dokonaj 6 trafnych korekt planu meczowego.", target: 6 },
  { id: "pressure", label: "Odporność na presję", description: "Przejdź 5 meczów wysokiej presji bez załamania.", target: 5 },
  { id: "adaptability", label: "Adaptacyjność", description: "Zdobądź punkty trzema różnymi ustawieniami.", target: 3 },
  { id: "youth", label: "Rozwój młodych", description: "Daj łączny rozwój trzem graczom U21.", target: 3 },
  { id: "reputation", label: "Reputacja / networking", description: "Zbuduj 6 pozytywnych zdarzeń w środowisku.", target: 6 },
];
export const POSITIONS: Position[] = ["BR", "PO", "ŚO", "LO", "DP", "ŚP", "PP", "ŚPO", "LP", "N"];
export const PERSONALITIES = ["Professional", "Emotional", "Ambitious", "Loyal", "Fragile", "Hot Head", "Big Game Player", "Irregular"];
export const FORMATIONS = {
  "4-2-3-1": ["BR", "PO", "ŚO-L", "ŚO-P", "LO", "DP-L", "DP-P", "PP", "ŚPO", "LP", "N"],
  "4-3-3": ["BR", "PO", "ŚO-L", "ŚO-P", "LO", "ŚP-P", "DP", "ŚP-L", "PP", "N", "LP"],
  "4-4-2": ["BR", "PO", "ŚO-L", "ŚO-P", "LO", "PP", "ŚP-P", "ŚP-L", "LP", "N-L", "N-P"],
  "3-5-2": ["BR", "ŚO-L", "ŚO", "ŚO-P", "PP", "ŚP-P", "DP", "ŚP-L", "LP", "N-L", "N-P"],
} as const;

const regional: [string, string, string[]][] = [
  ["Dolnośląski ZPN", "Wrocław", ["Polonia Wrocław", "Błękitni Jerzmanowo", "Orzeł Pawłowice", "Sokół Smolec", "KS Brochów", "Odra Lubiąż", "Zorza Pęgów", "Piast Żerniki", "Wicher Domasław", "Burza Bystrzyca"]],
  ["Kujawsko-Pomorski ZPN", "Bydgoszcz", ["Gwiazda Bydgoszcz", "Wisła Fordon", "Zawisza II Bydgoszcz", "Spójnia Białe Błota", "Dąb Potulice", "Skra Paterek", "Orzeł Kcynia", "Victoria Kołaczkowo", "Gryf Sicienko", "Noteć Łabiszyn"]],
  ["Lubelski ZPN", "Lublin", ["Sygnał Lublin", "Vrotcovia Lublin", "Avenir Jabłonna", "LKS Wierzchowiska", "Perła Borzechów", "Unia Wilkołaz", "Iskra Krzemień", "Stok Zakrzówek", "Pogoń Trzydnik", "Tęcza Kraśnik"]],
  ["Lubuski ZPN", "Zielona Góra", ["Drzonkowianka Racula", "Zorza Ochla", "Tęcza Krosno Odrzańskie", "Błękitni Lubięcin", "Pogoń Wężyska", "Odra Nietków", "Piast Czerwieńsk", "Czarni Rudno", "Sparta Łężyca", "Start Płoty"]],
  ["Łódzki ZPN", "Łódź", ["Start Łódź", "Włókniarz Konstantynów", "Sokół Lutomiersk", "Victoria Rąbień", "Orzeł Piątkowisko", "LKS Rosanów", "Kolejarz Łódź", "Iskra Dobroń", "Kobra Leźnica", "Pogoń Rogów"]],
  ["Małopolski ZPN", "Kraków", ["Bieżanowianka Kraków", "Płomień Kościelec", "Nadwiślan Kraków", "Tramwaj Kraków", "Sportowiec Modlniczka", "Gajowianka Gaj", "Albertus Kraków", "Bibiczanka Bibice", "Polonia Kraków", "Wanda Kraków"]],
  ["Mazowiecki ZPN", "Warszawa", ["Gwardia Warszawa", "KTS Weszło II Warszawa", "Sarmata Warszawa", "Drukarz II Warszawa", "Legion Warszawa", "UKS Siekierki", "Perła Złotokłos", "Orzeł Baniocha", "Jedność Żabieniec", "Laura Chylice"]],
  ["Opolski ZPN", "Opole", ["LZS Grudzice", "Groszmal Opole", "Burza Lipki", "Victoria Dobrzyń", "LZS Sławice", "Gazownik Wawelno", "Tempo Opole", "LZS Popielów", "Unia Murów", "Polonia Karłowice"]],
  ["Podlaski ZPN", "Białystok", ["Włókniarz Białystok", "Piast Białystok", "Korona Dobrzyniewo", "Gryf Gródek", "Supraślanka Supraśl", "Iskra Narew", "Hetman Tykocin", "Jasion Jasionówka", "Sudovia Szudziałowo", "Orzeł Tykocin"]],
  ["Pomorski ZPN", "Gdańsk", ["Portowiec Gdańsk", "Morena Gdańsk", "Klif Chłapowo", "Sokół Ełganowo", "GTS Rokitnica", "Wisła Steblewo", "Orzeł Straszyn", "KS Mściszewice", "Zieloni Łąg", "Gryf Goręczyno"]],
  ["Śląski ZPN", "Rybnik", ["LKS Chwałęcice", "Inter Krostoszowice", "Płomień Ochojec", "LKS Baranowice", "Borowik Szczejkowice", "KP Kamień", "Jedność Jejkowice", "Wicher Wilchwy", "Polaris Żory", "Ruch Stanowice"]],
  ["Świętokrzyski ZPN", "Kielce", ["Polonia Białogon", "Orlęta Kielce", "Top Spin Promnik", "Nidzianka Bieliny", "GKS Górno", "Lechia Strawczyn", "Czarni Jaworze", "Zryw Skroniów", "Victoria Mniów", "Łysica II Bodzentyn"]],
  ["Warmińsko-Mazurski ZPN", "Olsztyn", ["Zamek Kurzętnik", "PFT Sampława", "LZS Frednowy", "Iskra Narzym", "Orzeł Ulnowo", "Zamek Szymbark", "Czarni Rudzienice", "Olimpia Kisielice", "Ossa Biskupiec", "Jordan Kazanice"]],
  ["Wielkopolski ZPN", "Poznań", ["Byki Obrowo", "Sokół Drawsko", "Śródmieście Wronki", "LKS Piotrowo", "AS Wronki", "Tarzani Wrzeszczyna", "Noteć Rosko", "Orzeł Gulcz", "Gryf Siedlisko", "Fortuna Wieleń"]],
  ["Zachodniopomorski ZPN", "Szczecin", ["Kasta Szczecin", "Okręt Szczecin", "Pionier Szczecin", "Znicz Niedźwiedź", "Rybak Trzebież", "Błękit Pniewo", "Wołczkowo-Bezrzecze", "Sztorm Szczecin", "Grot Gardno", "Wicher Reptowo"]],
];

export const LEAGUE_PACKS: LeaguePack[] = [
  { id: "ekstraklasa", association: "PZPN — rozgrywki centralne", district: "Polska", competition: "Ekstraklasa", group: "liga ogólnopolska", tier: 1, teams: ["Legia Warszawa", "Lech Poznań", "Raków Częstochowa", "Jagiellonia Białystok", "Pogoń Szczecin", "Górnik Zabrze", "Widzew Łódź", "Cracovia", "Zagłębie Lubin", "Korona Kielce"] },
  { id: "pierwsza-liga", association: "PZPN — rozgrywki centralne", district: "Polska", competition: "I liga", group: "liga ogólnopolska", tier: 2, teams: ["Wisła Kraków", "Ruch Chorzów", "ŁKS Łódź", "Miedź Legnica", "Polonia Warszawa", "Stal Rzeszów", "GKS Tychy", "Odra Opole", "Puszcza Niepołomice", "Chrobry Głogów"] },
  { id: "druga-liga", association: "PZPN — rozgrywki centralne", district: "Polska", competition: "II liga", group: "liga ogólnopolska", tier: 3, teams: ["Zagłębie Sosnowiec", "KKS Kalisz", "Świt Szczecin", "Podbeskidzie Bielsko-Biała", "Chojniczanka Chojnice", "Resovia", "Hutnik Kraków", "Olimpia Grudziądz", "Rekord Bielsko-Biała", "ŁKS II Łódź"] },
  { id: "trzecia-liga-iv", association: "PZPN — rozgrywki centralne", district: "grupa IV", competition: "III liga", group: "grupa IV", tier: 4, teams: ["JKS Jarosław", "Sokół Kolbuszowa Dolna", "KSZO Ostrowiec Świętokrzyski", "Siarka Tarnobrzeg", "Star Starachowice", "Avia Świdnik", "Podlasie Biała Podlaska", "Wisłoka Dębica", "Chełmianka Chełm", "Korona II Kielce"], source: "90minut.pl, sezon 2026/27" },
  { id: "podkarpacka-iv", association: "Podkarpacki ZPN", district: "województwo", competition: "IV liga", group: "podkarpacka", tier: 5, teams: ["Karpaty Krosno", "Cosmos Nowotaniec", "Stal Łańcut", "Sokół Sieniawa", "Izolator Boguchwała", "Polonia Przemyśl", "Ekoball Stal Sanok", "Stal II Rzeszów", "Legion Pilzno", "Igloopol Dębica"], source: "90minut.pl, sezon 2026/27" },
  { id: "podkarpacka-okregowa-jaroslaw", association: "Podkarpacki ZPN", district: "Jarosław", competition: "Klasa okręgowa", group: "Jarosław", tier: 7, teams: ["Czuwaj Przemyśl", "Start Lisie Jamy", "Płomień Morawsko", "Orzeł Przeworsk", "Wiraż Chłopice", "Sanoczanka Święte", "Orzeł Torki", "Promyk Urzejowice", "Huragan Gniewczyna", "Piast Tuczempy"], source: "90minut.pl, sezon 2026/27" },
  { id: "podkarpacka-a-krosno-ii", association: "Podkarpacki ZPN", district: "Krosno", competition: "Klasa A", group: "Krosno II", tier: 8, teams: ["Karpaty II Krosno", "Zamczysko Odrzykoń", "LKS Głowienka", "Orlew Suchodół", "Wisłok Krościenko Wyżne", "Jasiołka Świerzowa Polska", "Nafta Jedlicze", "LKS Lubatowa", "Tęcza Zręcin", "LKS Haczów"], source: "90minut.pl, sezon 2026/27" },
  { id: "podkarpacka-a-jaroslaw", association: "Podkarpacki ZPN", district: "Jarosław", competition: "Klasa A", group: "Jarosław", tier: 8, teams: ["LKS Skołoszów", "Santos Piwoda", "MKS Radymno", "Piast II Tuczempy", "Dąb Dobkowice", "Pogórze Rokietnica", "LKS Manasterz", "Błękitni Pełkinie", "Hetman Laszki", "Orzeł Czerwona Wola"], source: "90minut.pl, sezon 2026/27" },
  { id: "podkarpacka-b-jaroslaw", association: "Podkarpacki ZPN", district: "Jarosław", competition: "Klasa B", group: "Jarosław", tier: 9, teams: ["Łazowianka Łazy", "Wietlin", "Korona Tuchla", "San Gorzyce", "Iskra Cieszacin Wielki", "Tęcza Jankowice", "Orzeł Bystrowice", "LKS Mołodycz", "Dąb Cetula", "Zorza Zarzecze"], source: "90minut.pl, sezon 2026/27" },
  ...regional.map(([association, district, teams], index) => ({ id: `regional-b-${index}`, association, district, competition: "Klasa B", group: district, tier: 9, teams })),
];

export const FIRST_NAMES = ["Adam", "Adrian", "Aleksander", "Bartosz", "Błażej", "Dawid", "Dominik", "Emil", "Filip", "Grzegorz", "Hubert", "Igor", "Jakub", "Jan", "Kacper", "Kamil", "Karol", "Konrad", "Krystian", "Łukasz", "Maciej", "Marcel", "Marek", "Mateusz", "Michał", "Mikołaj", "Miłosz", "Norbert", "Oskar", "Patryk", "Paweł", "Piotr", "Przemysław", "Rafał", "Robert", "Sebastian", "Szymon", "Tomasz", "Wiktor", "Wojciech"];
export const LAST_NAMES = ["Adamski", "Bąk", "Bednarek", "Bielecki", "Błaszczyk", "Borowski", "Brzozowski", "Chmiel", "Cieślak", "Czarnecki", "Duda", "Dziedzic", "Gajda", "Głowacki", "Grabowski", "Janik", "Jankowski", "Kaczmarek", "Kamiński", "Kasprzak", "Kowal", "Krawczyk", "Król", "Kubiak", "Kurek", "Lis", "Maj", "Makowski", "Marciniak", "Mazur", "Michalak", "Nowak", "Olejniczak", "Olszewski", "Pawlak", "Piasecki", "Pietrzak", "Przybylski", "Rutkowski", "Sikora", "Sokołowski", "Stępień", "Szulc", "Tomaszewski", "Urban", "Walczak", "Wasilewski", "Włodarczyk", "Wrona", "Zając", "Zieliński"];
export const TIER_OVR: Record<number, number> = { 1: 76, 2: 69, 3: 63, 4: 58, 5: 54, 6: 50, 7: 46, 8: 42, 9: 38, 10: 34 };

export function rngNext(seed: number) { let t = (seed + 0x6d2b79f5) | 0; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: (seed + 0x6d2b79f5) >>> 0 }; }
export function randomInt(seed: number, min: number, max: number) { const r = rngNext(seed); return { value: Math.floor(r.value * (max - min + 1)) + min, seed: r.seed }; }
export function normalizeSlot(slot: string): Position { if (slot.startsWith("ŚO")) return "ŚO"; if (slot.startsWith("ŚP")) return "ŚP"; if (slot.startsWith("DP")) return "DP"; if (slot.startsWith("N")) return "N"; return slot as Position; }
export function positionPenalty(player: Pick<Player, "primary" | "secondary">, slot: string) { const target = normalizeSlot(slot); if (player.primary === target) return 0; if (player.secondary.includes(target)) return 0.04; if (player.primary === "BR" || target === "BR") return 0.45; const defenders: Position[] = ["PO", "ŚO", "LO", "DP"]; const midfield: Position[] = ["DP", "ŚP", "PP", "ŚPO", "LP"]; const attack: Position[] = ["PP", "ŚPO", "LP", "N"]; if (defenders.includes(player.primary) && defenders.includes(target)) return 0.09; if (midfield.includes(player.primary) && midfield.includes(target)) return 0.07; if (attack.includes(player.primary) && attack.includes(target)) return 0.08; return 0.2; }
export function liveOVR(player: Player, slot?: string) { const liveModifier = Math.max(-0.2, Math.min(0.14, (player.form - 50) / 450 + (player.morale - 50) / 500 - player.fatigue / 520)); return Math.max(1, Math.round(player.baseOVR * (1 + liveModifier - (slot ? positionPenalty(player, slot) : 0)))); }
export function buildSchedule(teamIds: string[]) { const teams = [...teamIds]; if (teams.length % 2) teams.push("bye"); const rounds: Fixture[] = []; const rotation = [...teams]; for (let round = 1; round < teams.length; round++) { for (let i = 0; i < teams.length / 2; i++) { const home = rotation[i]; const away = rotation[rotation.length - 1 - i]; if (home !== "bye" && away !== "bye") rounds.push({ round, home: round % 2 ? home : away, away: round % 2 ? away : home, played: false }); } rotation.splice(1, 0, rotation.pop() as string); } const offset = teams.length - 1; return [...rounds, ...rounds.map((f) => ({ ...f, round: f.round + offset, home: f.away, away: f.home }))]; }
export function sortedTable(teams: Team[]) { return [...teams].sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.name.localeCompare(b.name, "pl")); }
export function updateTeamResult(teams: Team[], home: string, away: string, hg: number, ag: number) { return teams.map((team) => { if (team.id !== home && team.id !== away) return team; const isHome = team.id === home; const gf = isHome ? hg : ag; const ga = isHome ? ag : hg; return { ...team, played: team.played + 1, won: team.won + (gf > ga ? 1 : 0), drawn: team.drawn + (gf === ga ? 1 : 0), lost: team.lost + (gf < ga ? 1 : 0), gf: team.gf + gf, ga: team.ga + ga, points: team.points + (gf > ga ? 3 : gf === ga ? 1 : 0) }; }); }
