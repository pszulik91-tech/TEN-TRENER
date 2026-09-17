import { EXTENDED_EVENTS } from "./extended-events.mjs";
import { rngNext } from "./game-rules.mjs";
import { ADDITIONAL_EVENT_POOL } from "./career-event-catalog.mjs";

const CORE_EVENT_POOL = [
  {
    id: "work-shift", from: 7, to: 10, category: "Dostępność kadry", title: "Zmiana w pracy kontra zbiórka",
    body: "Dwóch zawodników może dotrzeć dopiero pod koniec odprawy. Jeden z nich zwykle zaczyna w pierwszej XI.",
    humorBody: "Dwóch zawodników kończy zmianę w pracy wtedy, gdy Ty kończysz odprawę. Google Maps twierdzi, że zdążą. Kierownik drużyny ma mniej optymistyczne źródła.",
    choices: [
      { id: "wait", label: "Czekamy i skracamy rozgrzewkę", feedback: "Szatnia doceniła elastyczność, ale przygotowanie meczowe ucierpiało.", effects: { teamMorale: 2, readiness: -3, pressures: { personal: 1 } } },
      { id: "bench", label: "Zaczynają na ławce", feedback: "Standard został obroniony. Spóźnieni wypadają z wyjściowego planu, reszta zna zasady.", effects: { teamMorale: -1, relation: -2, pressures: { board: -1, dressing: 2 }, unavailable: { min: 2, max: 2, rounds: 1, reason: "spóźnienie po pracy" } } },
      { id: "system", label: "Zmieniam plan pod dostępnych", feedback: "Plan uproszczono. Koszt spadł na Ciebie, a dwaj spóźnieni nie są liczeni do XI.", effects: { burnout: 1, readiness: 1, pressures: { dressing: -1 }, unavailable: { min: 2, max: 2, rounds: 1, reason: "obowiązki zawodowe" } } },
    ],
  },
  {
    id: "pitch", from: 6, to: 10, category: "Infrastruktura", title: "Boisko ma własny plan meczu",
    body: "Po opadach środek boiska jest grząski. Dotychczasowy sposób rozegrania będzie trudniejszy.",
    humorBody: "Po opadach środek boiska przypomina test opon terenowych. Piłka zatrzymała się sama podczas obchodu murawy.",
    choices: [
      { id: "direct", label: "Gramy prościej i omijamy środek", feedback: "Zespół dostał prosty plan, ale odda część kontroli nad meczem.", effects: { readiness: 2, teamMorale: -1 } },
      { id: "identity", label: "Nie zmieniamy swojej gry", feedback: "Bronisz tożsamości. Rośnie wiara, ale też ryzyko błędów technicznych.", effects: { teamMorale: 2, pressures: { personal: 2 } } },
      { id: "inspect", label: "Dodatkowy obchód i korekta stref", feedback: "Sztab przygotował korektę kosztem Twojego czasu i energii.", effects: { readiness: 1, burnout: 1 } },
    ],
  },
  {
    id: "captain-late", from: 1, to: 10, category: "Szatnia", title: "Kapitan znów się spóźnił",
    body: "Kapitan spóźnił się trzeci raz. Jest ważny sportowo i ma silną pozycję w zespole.",
    choices: [
      { id: "fine", label: "Taka sama kara jak dla każdego", feedback: "Zasady są czytelne. Kapitan przyjął karę chłodno.", effects: { relation: -3, teamMorale: -1, pressures: { board: -2, dressing: 2 } } },
      { id: "talk", label: "Najpierw rozmowa i poznanie przyczyny", feedback: "Poznałeś kontekst. Część zespołu może uznać, że lider ma taryfę ulgową.", effects: { relation: 2, pressures: { dressing: 1, personal: 1 } } },
      { id: "responsibility", label: "Dostaje zadanie wobec drużyny", feedback: "Kapitan zachował twarz i musi odbudować wiarygodność pracą.", effects: { relation: 1, teamMorale: 1, burnout: 1 } },
    ],
  },
  {
    id: "reserve-role", from: 1, to: 10, category: "Hierarchia", title: "Rezerwowy żąda konkretów",
    body: "Zawodnik rotacji uważa, że zasłużył na większą rolę. Rozmowę słyszy kilku kolegów.",
    choices: [
      { id: "promise", label: "Daję większą szansę całej rotacji", feedback: "Napięcie spadło, ale kolejny mecz zaczniemy z planem Rotacja.", effects: { teamPlan: "ROTATION", relation: 3, pressures: { dressing: -2, personal: 2 } } },
      { id: "merit", label: "Minuty trzeba wygrać na treningu", feedback: "Hierarchia została obroniona. Zawodnik oczekuje teraz uczciwej oceny.", effects: { relation: -2, teamMorale: 1, pressures: { dressing: 1 } } },
      { id: "plan", label: "Ustalam indywidualny plan wejścia", feedback: "Rozmowa trwała dłużej, ale zawodnik dostał mierzalną ścieżkę.", effects: { relation: 2, burnout: 1, readiness: 1 } },
    ],
  },
  {
    id: "training-legs", from: 1, to: 10, category: "Obciążenia", title: "Szatnia zgłasza ciężkie nogi",
    body: "Liderzy proszą o lżejszy akcent. Sztab widzi zmęczenie, ale przygotowanie taktyczne nie jest zakończone.",
    choices: [
      { id: "recover", label: "Skracam pracę i stawiam na regenerację", feedback: "Kondycja wzrosła, lecz część planu taktycznego wypadła z mikrocyklu.", effects: { teamFatigue: -5, readiness: -2, pressures: { dressing: -2 } } },
      { id: "normal", label: "Realizujemy plan bez zmian", feedback: "Plan wykonano, ale zawodnicy wiedzą, że ich sygnał nie zmienił decyzji.", effects: { readiness: 2, teamFatigue: 2, pressures: { dressing: 1 } } },
      { id: "leaders", label: "Liderzy regenerują, reszta trenuje", feedback: "Najważniejsi odpoczęli. Rezerwowi dostali bodziec i pytają o szansę.", effects: { teamFatigue: -2, teamMorale: 1, burnout: 1 } },
    ],
  },
  {
    id: "local-post", from: 5, to: 10, category: "Otoczenie", title: "Klubowy profil rozpalił komentarze",
    body: "Niefortunny wpis klubowego profilu wywołał spór kibiców o skład i zaangażowanie drużyny.",
    humorBody: "Administrator klubowego profilu opublikował skład z poprzedniego tygodnia i dopisał „pewne info”. Komentarze są już szybsze od klubowej komunikacji.",
    choices: [
      { id: "distance", label: "Nie komentuję internetu", feedback: "Temat nie dostał paliwa od trenera, ale kibice sami dopisali ciąg dalszy.", effects: { pressures: { fans: 2, media: -1 } } },
      { id: "clarify", label: "Krótko prostuję fakty", feedback: "Fakty są jasne. Każde kolejne zdanie będzie jednak oceniane jak deklaracja.", effects: { pressures: { fans: -2, media: 2 }, burnout: 1 } },
      { id: "humor", label: "Odpowiadam z dystansem", feedback: "Część kibiców kupiła ton, prezes nie jest pewien, czy to poważne.", effects: { pressures: { fans: -3, board: 2 }, teamMorale: 1 } },
    ],
  },
  {
    id: "transport", from: 3, to: 8, category: "Logistyka", title: "Wyjazd droższy niż planowano",
    body: "Klub musi wybrać między wcześniejszym wyjazdem a oszczędnością. Prezes oczekuje Twojej rekomendacji.",
    choices: [
      { id: "early", label: "Jedziemy wcześniej, płaci klub", feedback: "Zespół zyskał przygotowanie, a prezes zapisał wydatek po stronie sztabu.", effects: { readiness: 3, pressures: { board: 3 } } },
      { id: "cheap", label: "Oszczędzamy i akceptujemy ryzyko", feedback: "Budżet został ochroniony, ale regeneracja po podróży będzie gorsza.", effects: { teamFatigue: 3, pressures: { board: -2, dressing: 1 } } },
      { id: "sponsor", label: "Proszę sponsora o pokrycie różnicy", feedback: "Finanse są bezpieczne, lecz sponsor oczekuje widoczności i wyniku.", effects: { pressures: { board: -1, media: 2, personal: 1 } } },
    ],
  },
  {
    id: "sponsor", from: 4, to: 7, category: "Zarząd", title: "Sponsor chce nazwiska w składzie",
    body: "Sponsor sugeruje większą rolę lokalnego zawodnika. Sportowo jest blisko pierwszej XI, ale nie jest oczywistym wyborem.",
    choices: [
      { id: "sport", label: "Skład ustalam wyłącznie sportowo", feedback: "Autonomia została obroniona. Sponsor nie ukrywa rozczarowania.", effects: { pressures: { board: 3 }, teamMorale: 1 } },
      { id: "chance", label: "Dostanie szansę, jeśli wygra ją treningiem", feedback: "Nie złożyłeś obietnicy, ale stworzyłeś mierzalny warunek.", effects: { pressures: { board: -1, personal: 1 }, relation: 1 } },
      { id: "start", label: "Otwieram skład dla graczy rotacji", feedback: "Relacja ze sponsorem rośnie, za to szatnia obserwuje konsekwencję decyzji.", effects: { teamPlan: "ROTATION", pressures: { board: -3, dressing: 3 }, teamMorale: -1 } },
    ],
  },
  {
    id: "media-blame", from: 1, to: 5, results: ["loss"], category: "Media", title: "Kamery szukają winnego",
    body: "Po porażce media wskazują młodego obrońcę. Zarząd słucha, czy przejmiesz kontrolę nad przekazem.",
    choices: [
      { id: "defend", label: "Publicznie bronię zawodnika", feedback: "Szatnia to doceniła. Media podkręcą temat odpowiedzialności trenera.", effects: { pressures: { dressing: -3, media: 4, personal: 1 }, relation: 3 } },
      { id: "team", label: "Odpowiada cały zespół, ze mną włącznie", feedback: "Przekaz jest spójny, ale bierzesz część presji bezpośrednio na siebie.", effects: { pressures: { media: -1, dressing: -1, personal: 3 }, burnout: 1 } },
      { id: "standards", label: "Błąd musi mieć sportowe konsekwencje", feedback: "Zarząd widzi standardy. Młody zawodnik i część szatni czują chłód.", effects: { pressures: { board: -2, dressing: 4 }, relation: -3, teamMorale: -1 } },
    ],
  },
  {
    id: "agent", from: 1, to: 4, category: "Rynek", title: "Agent stawia warunek",
    body: "Agent podstawowego gracza chce deklaracji roli przed rozmową o nowym kontrakcie.",
    choices: [
      { id: "key", label: "Potwierdzam status kluczowego gracza", feedback: "Negocjacje są łatwiejsze, ale ograniczyłeś sobie swobodę rotacji.", effects: { relation: 3, pressures: { personal: 2, dressing: 1 } } },
      { id: "compete", label: "Nikt nie ma gwarancji składu", feedback: "Autonomia została zachowana. Agent rozgląda się za alternatywą, ale rynek widzi konsekwentnego trenera.", effects: { relation: -3, pressures: { board: 1 }, reputation: 1 } },
      { id: "minutes", label: "Ustalamy realistyczny przedział minut", feedback: "Powstał kompromis do pilnowania przez cały sezon.", effects: { relation: 1, burnout: 1, pressures: { dressing: -1 } } },
    ],
  },
  {
    id: "academy", from: 1, to: 9, category: "Rozwój", title: "Junior puka do pierwszej drużyny",
    body: "Sztab młodzieżowy rekomenduje 19-latka. Potrzebuje minut, ale w najbliższym meczu stawka jest wysoka.",
    choices: [
      { id: "start", label: "Dostaje miejsce w pierwszej XI", feedback: "Młodzież widzi ścieżkę. Wynikowy margines bezpieczeństwa jest mniejszy.", effects: { teamMorale: 1, readiness: -1, pressures: { board: 1 } } },
      { id: "bench", label: "Ławka i konkretny plan wejścia", feedback: "Rozwój jest kontrolowany, lecz zawodnik nadal czeka na realną próbę.", effects: { relation: 1, burnout: 1 } },
      { id: "wait", label: "Najpierw musi ustabilizować formę", feedback: "Chronisz wynik i hierarchię. Akademia oczekiwa kolejnej decyzji.", effects: { pressures: { dressing: -1 }, relation: -1 } },
    ],
  },
  {
    id: "president-target", from: 1, to: 10, category: "Prezes", title: "Prezes zmienia ton po wyniku",
    body: "Prezes chce podnieść cel sezonu. W zamian nie gwarantuje dodatkowego budżetu.",
    choices: [
      { id: "accept", label: "Przyjmuję wyższy cel", feedback: "Ambicja została potwierdzona. Od teraz każdy punkt będzie liczony wobec nowej deklaracji.", effects: { pressures: { board: -2, personal: 4 }, burnout: 1, reputation: 1 } },
      { id: "budget", label: "Cel tak, ale tylko z budżetem", feedback: "Postawiłeś warunek. Prezes szanuje konkret, lecz zapamięta negocjacje.", effects: { pressures: { board: 2, personal: 1 }, reputation: 1 } },
      { id: "refuse", label: "Trzymamy się wcześniejszych ustaleń", feedback: "Chronisz zespół przed presją. Relacja z ambitnym prezesem staje się chłodniejsza.", effects: { pressures: { board: 4, dressing: -1 } } },
    ],
  },
];

const EVENT_POOL = [...CORE_EVENT_POOL, ...ADDITIONAL_EVENT_POOL, ...EXTENDED_EVENTS];

function eligibleTemplates(tier, result, round) {
  return EVENT_POOL.filter((event) => tier >= event.from && tier <= event.to
    && (!event.results || event.results.includes(result))
    && (!event.minRound || round >= event.minRound)
    && (!event.maxRound || round <= event.maxRound));
}

function weightedTemplate(candidates, value) {
  const total = candidates.reduce((sum, event) => sum + (event.weight ?? 1), 0);
  let cursor = value * total;
  for (const event of candidates) {
    cursor -= event.weight ?? 1;
    if (cursor <= 0) return event;
  }
  return candidates.at(-1);
}

export function generateRoundIssues({ seed, round, tier, result, worldHumor, recentTitles = [], recentCategories = [], maxEvents = 2 }) {
  let nextSeed = seed >>> 0;
  let roll = rngNext(nextSeed); nextSeed = roll.seed;
  const noneChance = result === "loss" ? .12 : tier >= 8 ? .22 : .3;
  const twoChance = result === "loss" ? .16 : tier >= 8 ? .13 : .09;
  const count = Math.min(Math.max(0, maxEvents), roll.value < noneChance ? 0 : roll.value >= 1 - twoChance ? 2 : 1);
  const blocked = new Set(recentTitles.slice(0, 36));
  const recentCategoryBlock = new Set(recentCategories.slice(0, 2));
  const events = [];
  for (let index = 0; index < count; index += 1) {
    const eligible = eligibleTemplates(tier, result, round).filter((event) => !blocked.has(event.title));
    let candidates = eligible.filter((event) => !recentCategoryBlock.has(event.category) && !events.some((item) => item.category === event.category));
    if (!candidates.length) candidates = eligible.filter((event) => !events.some((item) => item.title === event.title));
    if (!candidates.length) candidates = eligibleTemplates(tier, result, round).filter((event) => !events.some((item) => item.title === event.title));
    roll = rngNext(nextSeed); nextSeed = roll.seed;
    const template = weightedTemplate(candidates, roll.value);
    if (!template) break;
    blocked.add(template.title);
    recentCategoryBlock.add(template.category);
    events.push({
      id: `issue-${round}-${template.id}-${index}`,
      category: template.category,
      title: template.title,
      body: worldHumor >= 58 && template.humorBody ? template.humorBody : template.body,
      choices: template.choices,
      resolved: false,
    });
  }
  return { seed: nextSeed, events };
}

export function welcomeIssue(clubName, coachFirstName, expectation, environmentStatus, environmentWork) {
  return {
    id: "welcome", category: "Kontrakt", title: `Witamy w ${clubName}`,
    body: `${coachFirstName || "Trenerze"}, zarząd oczekuje ${expectation}. To ${environmentStatus}: ${environmentWork.toLowerCase()}`,
    choices: [{ id: "ack", label: "Przyjmuję odpowiedzialność", feedback: "Pierwszy cel został zapisany. Od następnej kolejki zarząd ocenia działania i wyniki.", effects: { pressures: { personal: 1 } } }],
    resolved: false,
  };
}

export function legacyIssue(item) {
  if (item.choices?.length) return item;
  return {
    ...item, category: "Archiwum",
    choices: [{ id: "close", label: "Zamknij sprawę", feedback: "Sprawa ze starszej wersji gry została zamknięta bez dodatkowych skutków.", effects: {} }],
  };
}

function jitterValue(value, initialSeed) {
  if (!value) return { value: 0, seed: initialSeed };
  const roll = rngNext(initialSeed);
  const direction = roll.value < .24 ? -1 : roll.value > .76 ? 1 : 0;
  const magnitude = Math.abs(value) <= 1
    ? (direction < 0 ? 0 : direction > 0 ? 2 : 1)
    : Math.max(1, Math.abs(value) + direction);
  return { value: Math.sign(value) * magnitude, seed: roll.seed };
}

export function resolveIssueEffects(initialSeed, source = {}) {
  let seed = initialSeed >>> 0;
  const effects = {};
  for (const key of ["burnout", "teamMorale", "teamFatigue", "relation", "readiness", "reputation"]) {
    if (source[key] === undefined) continue;
    const rolled = jitterValue(source[key], seed); seed = rolled.seed; effects[key] = rolled.value;
  }
  if (source.teamPlan) effects.teamPlan = source.teamPlan;
  if (source.pressures) {
    effects.pressures = {};
    for (const [key, value] of Object.entries(source.pressures)) {
      const rolled = jitterValue(value, seed); seed = rolled.seed; effects.pressures[key] = rolled.value;
    }
  }
  if (source.unavailable) {
    const roll = rngNext(seed); seed = roll.seed;
    const minimum = Math.max(0, Math.round(source.unavailable.min ?? 0));
    const maximum = Math.max(minimum, Math.round(source.unavailable.max ?? minimum));
    effects.unavailable = { count: minimum + Math.floor(roll.value * (maximum - minimum + 1)), rounds: Math.max(1, Math.round(source.unavailable.rounds ?? 1)), reason: source.unavailable.reason ?? "nieobecność" };
  }
  return { seed, effects };
}

const EFFECT_LABELS = { burnout: "wypalenie", teamMorale: "morale", teamFatigue: "zmęczenie", relation: "relacje", readiness: "gotowość", reputation: "reputacja" };
const PRESSURE_LABELS = { board: "presja zarządu", fans: "presja kibiców", media: "presja mediów", dressing: "presja szatni", personal: "stres osobisty" };

function approximate(value) {
  return value > 0 ? "możliwy wzrost" : "możliwy spadek";
}

export function previewIssueEffects(effects = {}) {
  const labels = [];
  if (effects.teamPlan) labels.push("Plan zespołu: Rotacja");
  for (const [key, label] of Object.entries(EFFECT_LABELS)) if (effects[key]) labels.push(`${label}: ${approximate(effects[key])}`);
  if (effects.unavailable) labels.push(`niedostępni: ${effects.unavailable.min === effects.unavailable.max ? effects.unavailable.min : `${effects.unavailable.min}–${effects.unavailable.max}`} poza XI`);
  for (const [key, value] of Object.entries(effects.pressures ?? {})) if (value) labels.push(`${PRESSURE_LABELS[key] ?? key}: ${approximate(value)}`);
  return labels.slice(0, 4);
}

export function describeResolvedEffects(effects = {}) {
  const labels = [];
  if (effects.teamPlan) labels.push("Plan zespołu: Rotacja");
  for (const [key, label] of Object.entries(EFFECT_LABELS)) if (effects[key]) labels.push(`${label} ${effects[key] > 0 ? "+" : ""}${effects[key]}`);
  for (const [key, value] of Object.entries(effects.pressures ?? {})) if (value) labels.push(`${PRESSURE_LABELS[key] ?? key} ${value > 0 ? "+" : ""}${value}`);
  if (effects.unavailable?.count) labels.push(`${effects.unavailable.count} poza kadrą meczową (${effects.unavailable.reason})`);
  return labels;
}

export { EVENT_POOL };
