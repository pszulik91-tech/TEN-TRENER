const MATCH_LANGUAGE = {
  homeGoal: [
    "{team} rozcina obronę i zamyka akcję z bliska!", "{team} trafia po cierpliwie rozegranej akcji!", "{team} wykorzystuje chaos w polu karnym — gol!",
    "{team} dopina akcję, której nie dało się już wybronić!", "{team} znajduje pół metra i piłka ląduje w siatce!", "{team} przyspiesza we właściwej chwili — bramka!",
    "{team} wygrywa drugi kontakt i natychmiast karze rywala!", "{team} trafia po dośrodkowaniu; ławka już jest pod linią!", "{team} zamienia przewagę na konkret — gol!",
    "{team} uderza bez przyjęcia i stadion wreszcie oddycha!", "{team} bierze bramkę z akcji, która zaczęła się całkiem niewinnie.", "{team} dopada do odbitej piłki. Tu nie było czasu na naradę!", "{team} wrzuca piłkę między bramkarza a obrońców — ktoś dostawia nogę!", "{team} trafia po rożnym, a tablica wyników nie protestuje.",
  ],
  awayGoal: [
    "{team} ucisza trybuny szybkim wykończeniem!", "{team} wychodzi spod pressingu i kończy akcję golem.", "{team} wykorzystuje wolną przestrzeń — zimny prysznic dla gospodarzy.",
    "{team} trafia po kontrze rozegranej na dwa tempa.", "{team} zabiera gospodarzom piłkę i dobre samopoczucie — gol!", "{team} wygrywa pojedynek w polu karnym i trafia.",
    "{team} karze za moment zawahania w obronie.", "{team} doczekał się swojej chwili i nie zmarnował jej.", "{team} wbija piłkę pod poprzeczkę — sektor gości ożywa!",
    "{team} trafia po akcji, która miała być tylko wybiciem spod pressingu.", "{team} zamyka dośrodkowanie na dalszym słupku.", "{team} ma jedną okazję i robi z niej pełnowymiarowy problem.", "{team} wykorzystuje błąd przy wyprowadzeniu i zabiera komplet spokoju.", "{team} trafia zza pola karnego — piłka nie pyta bramkarza o zgodę.",
  ],
  homeChance: [
    "{team} składa się do strzału, ale bramkarz zdążył z rękawicami.", "{team} wrzuca groźnie; piłka przechodzi tuż obok słupka.", "{team} odzyskuje wysoko, lecz ostatnie podanie jest o pół kroku za długie.",
    "{team} wygrywa drugą piłkę. Strzał blokuje obrońca.", "{team} zamyka rywala w polu karnym, ale bez pieczątki w siatce.", "{team} próbuje z dystansu — bramkarz paruje do boku.",
    "{team} rusza skrzydłem; dośrodkowanie sieje zamęt, nie gola.", "{team} znajduje miejsce między liniami. Uderzenie minimalnie niecelne.", "{team} ma sytuację, po której ławka już wstawała.",
    "{team} dochodzi do główki. Piłka odbija się od reklam, nie od siatki.", "{team} przyspiesza, ale w polu karnym zabrakło jednego spokojnego kontaktu.", "{team} sprawdza refleks bramkarza — ten dziś nie przyszedł tylko po premię.", "{team} uderza z pierwszej piłki; obrońca przyjmuje strzał na siebie.", "{team} rozgrywa wolny krótko i prawie zaskakuje wszystkich, łącznie z sobą.",
  ],
  awayChance: [
    "{team} wychodzi z kontrą, lecz strzał mija dalszy słupek.", "{team} znajduje lukę po boku. Bramkarz ratuje gospodarzy.", "{team} zbiera drugą piłkę i uderza ponad bramką.",
    "{team} podkręca tempo; obrona wybija w ostatniej chwili.", "{team} dochodzi do czystej pozycji, ale celownik został w autokarze.", "{team} przecina środek jednym podaniem. Strzał zablokowany.",
    "{team} próbuje lobu — pomysł lepszy od wykonania.", "{team} zmusza bramkarza do trudnej interwencji przy słupku.", "{team} naciska i na moment robi się naprawdę cicho.",
    "{team} posyła piłkę wzdłuż bramki. Nikt jej nie zamyka.", "{team} uderza po stałym fragmencie, minimalnie obok.", "{team} wyprowadza akcję z własnej połowy; finał zatrzymuje bramkarz.", "{team} przepycha akcję środkiem, ale strzał ląduje w rękach bramkarza.", "{team} pojawia się pod bramką po długim podaniu. Spalony ratuje gospodarzy.",
  ],
  card: [
    "Spóźnione wejście i sędzia sięga po żółtą kartkę.", "Sędzia kończy dyskusję żółtą kartką. Argumentów już nie przyjmuje.", "Za dużo impetu, za mało piłki — żółta kartka.",
    "Taktyczny faul, całkiem nietaktyczna mina ukaranego. Żółta kartka.", "Przerwana kontra i zasłużona żółta kartka.", "Wślizg był dłuższy niż cierpliwość arbitra. Kartka.",
    "Żółta kartka po starciu przy linii bocznej.", "Sędzia najpierw słucha, potem pokazuje kartkę. Kolejność bez znaczenia.", "Faul w środku pola; notes arbitra ma nowy wpis.",
    "Ostry pojedynek kończy się żółtą kartką.", "Kartka za zatrzymanie akcji rękami. Uścisk był serdeczny, ale nieprzepisowy.",
  ],
  quiet: [
    "Obie drużyny badają teren. Na razie więcej drugich piłek niż pierwszych pomysłów.", "Środek pola pracuje pełną parą, tablica wyników jeszcze odpoczywa.",
    "Dużo walki, mało miejsca. Trenerzy mają co notować, realizator niewiele do powtórek.", "Mecz układa się ostrożnie. Nikt nie chce pierwszy nadepnąć na grabie.",
    "Piłka krąży między liniami, ale pola karne pozostają zamknięte.", "Tempo jest ligowe, murawa trochę mniej. Na razie bez konkretów.",
    "Trwa przeciąganie liny w środku pola. Lina jeszcze cała.", "Obie strony pilnują porządku. Bramkarze oglądają mecz z najlepszych miejsc.",
  ],
};

const REPORT_LANGUAGE = {
  win: ["Wynik dowieziony, szatnia dostała paliwo na kolejny tydzień.", "Trzy punkty trafiają do tabeli, a argumenty do trenera.", "Zespół zrobił swoje — morale XI idzie w górę.", "Plan znalazł potwierdzenie na tablicy wyników."],
  preparationGood: ["Gotowość {value}% pozwoliła drużynie grać według planu.", "Mikrocykl dał {value}% gotowości — robota tygodnia była widoczna.", "Przy {value}% gotowości zespół miał z czego realizować założenia.", "Tydzień treningowy przygotował {value}% paliwa do planu meczowego."],
  shotsGood: ["Przewaga w strzałach {for}–{against} nie była dekoracją.", "Zespół częściej kończył akcje: {for}–{against} w strzałach.", "Bilans prób {for}–{against} pokazuje, kto częściej pytał bramkarza o zdanie.", "Strzały {for}–{against}: plan regularnie doprowadzał piłkę pod bramkę."],
  analysisGood: ["Korekta po 30. minucie poprawiła wynik od chwili zmiany — cel „Analiza” rośnie.", "Reakcja z ławki zmieniła bilans meczu i została zaliczona do celu „Analiza”.", "Zmiana instrukcji nie była dla kamery: od jej wprowadzenia wynik się poprawił.", "Trener przeczytał mecz w biegu; korekta przełożyła się na lepszy bilans."],
  conditionBad: ["XI kończy z kondycją {value}%. Następny tydzień prosi o regenerację albo rotację.", "Kondycja XI: {value}%. Kolejny taki wysiłek wystawi rachunek.", "Po meczu zostało {value}% kondycji — świeżość właśnie stała się tematem odprawy.", "XI zeszła do {value}% kondycji. Ławka rezerwowych powinna przestać być meblem."],
  preparationBad: ["Gotowość {value}% skróciła planowi oddech.", "Przygotowanie zatrzymało się na {value}% i część założeń została na tablicy.", "{value}% gotowości to za mało, by oczekiwać pełnej realizacji planu.", "Mikrocykl dał tylko {value}% gotowości; drużyna częściej reagowała niż narzucała."],
  burnout: ["Wypalenie {value}% utrudniło spokojne przygotowanie decyzji.", "Przy wypaleniu {value}% trener płaci jakością koncentracji.", "Wskaźnik wypalenia {value}% zaczął ciążyć na przygotowaniu.", "{value}% wypalenia to już nie nastrój — to koszt w pracy sztabu."],
  shotsBad: ["Rywal oddał więcej strzałów: {against}–{for}. Wynik nie powinien zasłaniać ostrzeżenia.", "Bilans strzałów {for}–{against} mówi, że rywal częściej dochodził do głosu.", "Próby {for}–{against}: za dużo meczu odbywało się pod dyktando rywala.", "Rywal wygrał liczbę strzałów {against}–{for}; przed kolejnym spotkaniem jest materiał do pracy."],
  neutralPositive: ["Mecz zostawił dane do ustawienia następnego mikrocyklu.", "Sztab ma po tym spotkaniu konkretny materiał, nie tylko wrażenia.", "Nawet bez wyraźnej przewagi raport podpowiada, co mierzyć w kolejnym tygodniu.", "Spotkanie dopisało użyteczny rozdział do notatnika sztabu."],
  neutralWarning: ["Raport nie wykrył alarmu kondycyjnego ani pozycyjnego.", "Bez czerwonych lampek, ale następny mikrocykl nadal wymaga decyzji.", "Brak ostrego alarmu — można poprawiać szczegóły zamiast gasić pożar.", "Parametry po meczu mieszczą się w bezpiecznym zakresie."],
};

function hashKey(value) {
  let hash = 2166136261;
  for (const char of String(value)) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

export function phrase(key, bank, values = {}) {
  const items = MATCH_LANGUAGE[bank] ?? REPORT_LANGUAGE[bank] ?? [];
  const template = items.length ? items[hashKey(key) % items.length] : "";
  return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ""));
}

export function matchPhrase(kind, side, key, team) {
  if (kind === "goal") return phrase(key, side === "home" ? "homeGoal" : "awayGoal", { team });
  if (kind === "chance") return phrase(key, side === "home" ? "homeChance" : "awayChance", { team });
  if (kind === "card") return phrase(key, "card");
  return phrase(key, "quiet");
}

export function languageBankStats() {
  return { match: Object.values(MATCH_LANGUAGE).reduce((sum, items) => sum + items.length, 0), report: Object.values(REPORT_LANGUAGE).reduce((sum, items) => sum + items.length, 0) };
}
