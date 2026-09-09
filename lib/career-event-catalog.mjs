/*
 * Oryginalne sytuacje inspirowane realiami polskiej piłki: pracą zawodową
 * graczy, regulaminami, lokalną logistyką i presją futbolu zawodowego.
 * Katalog nie cytuje ani nie odtwarza cudzych wpisów lub memów.
 */
export const ADDITIONAL_EVENT_POOL = [
  {
    id: "eligibility-register", from: 4, to: 10, category: "Regulamin", title: "Protokół nie zgadza się z Extranetem", weight: 1.25,
    body: "Kierownik zauważył rozbieżność w uprawnieniu jednego z rezerwowych. Do meczu zostało niewiele czasu, a interpretacja przepisu nie jest oczywista.",
    humorBody: "Kierownik ma wydruk, telefon i trzy różne interpretacje tego samego przepisu. Extranet milczy z godnością urzędu.",
    choices: [
      { id: "remove", label: "Wykreślam zawodnika z protokołu", feedback: "Ryzyko walkowera zniknęło, ale ławka jest krótsza i zawodnik czuje się ukarany za cudzy błąd.", effects: { readiness: -2, relation: -2, pressures: { board: -1 } } },
      { id: "verify", label: "Dzwonimy do związku i czekamy", feedback: "Sprawa została potwierdzona formalnie. Odprawa i rozgrzewka straciły jednak cenny czas.", effects: { readiness: -2, burnout: 1, pressures: { board: -2 } } },
      { id: "risk", label: "Wpisujemy go i bierzemy ryzyko", feedback: "Zachowałeś pełną ławkę, lecz wynik może jeszcze trafić na biurko komisji.", effects: { readiness: 1, pressures: { board: 4, personal: 3 } } },
    ],
  },
  {
    id: "cup-eligibility", from: 3, to: 10, category: "Regulamin", title: "Trzy minuty mogą kosztować cały mecz", results: ["win"], weight: .8,
    body: "Po zwycięstwie rywal pyta o uprawnienie zawodnika, który wszedł pod koniec. Dokumenty są niepełne, a termin na wyjaśnienie krótki.",
    humorBody: "Wygraliście na boisku, ale tabela w arkuszu związku właśnie rozpoczęła dogrywkę. Rezerwowy grał krótko, przepis pracuje pełne 90 minut.",
    choices: [
      { id: "audit", label: "Natychmiast robimy audyt dokumentów", feedback: "Sztab odłożył analizę sportową i zabezpieczył sprawę formalnie. Koszt ponosisz czasem oraz energią.", effects: { burnout: 2, readiness: -1, pressures: { board: -2 } } },
      { id: "lawyer", label: "Oddaję sprawę klubowi i prawnikowi", feedback: "Możesz skupić się na zespole, ale zarząd oceni jakość pracy kierownika i Twojego nadzoru.", effects: { readiness: 1, pressures: { board: 2, personal: -1 } } },
      { id: "public", label: "Publicznie bronimy wyniku z boiska", feedback: "Kibice stoją za drużyną, za to komisja i media dostają głośny temat przed decyzją.", effects: { teamMorale: 2, pressures: { fans: -2, media: 3, board: 2 } } },
    ],
  },
  {
    id: "kit-laundry", from: 7, to: 10, category: "Sprzęt", title: "Stroje nie zdążyły wyschnąć",
    body: "Komplet meczowy wrócił z prania później niż planowano. Rezerwowy zestaw różni się krojem i część zawodników narzeka.",
    humorBody: "Koszulki są czyste, pachnące i mokre. Suszarka walczy dzielnie, lecz nie została zgłoszona do rozgrywek jako członek sztabu.",
    choices: [
      { id: "reserve", label: "Gramy w rezerwowym komplecie", feedback: "Problem rozwiązano szybko, choć drobny dyskomfort obniżył nastrój części drużyny.", effects: { readiness: 1, teamMorale: -1 } },
      { id: "dry", label: "Organizujemy ekspresowe suszenie", feedback: "Zawodnicy dostaną właściwy sprzęt, ale zamieszanie zabiera uwagę przedmeczową.", effects: { teamMorale: 1, readiness: -2, burnout: 1 } },
      { id: "own", label: "Każdy bierze odpowiedzialność za swój zestaw", feedback: "Wzmacniasz samodzielność, lecz kilku graczy odbiera to jako przerzucanie problemu klubu.", effects: { pressures: { board: -1, dressing: 2 }, relation: -1 } },
    ],
  },
  {
    id: "stadium-keys", from: 6, to: 10, category: "Infrastruktura", title: "Klucze do szatni jadą innym samochodem",
    body: "Gospodarz obiektu utknął w drodze. Zespół stoi przed zamkniętą szatnią, a czas odprawy ucieka.",
    humorBody: "Szatnia istnieje, klucz również. Problem polega na tym, że nie przebywają obecnie w tym samym miejscu.",
    choices: [
      { id: "outside", label: "Odprawa i rozgrzewka na zewnątrz", feedback: "Nie tracisz czasu, ale prywatność planu i komfort zawodników są ograniczone.", effects: { readiness: 1, teamMorale: -1, pressures: { media: 1 } } },
      { id: "wait", label: "Czekamy i zachowujemy normalny rytm", feedback: "Zespół zachował spokój, lecz skrócona rozgrzewka może odbić się na gotowości.", effects: { teamMorale: 1, readiness: -3 } },
      { id: "force", label: "Prezes ma znaleźć rozwiązanie natychmiast", feedback: "Drzwi otwarto szybciej, ale relacja ze stroną organizacyjną wyraźnie się ochłodziła.", effects: { readiness: 2, pressures: { board: 3 }, burnout: 1 } },
    ],
  },
  {
    id: "pitch-lines", from: 6, to: 10, category: "Infrastruktura", title: "Linie boiska znikają przed pierwszym gwizdkiem",
    body: "Po opadach oznaczenia są ledwo widoczne. Organizator pyta, czy drużyna pomoże poprawić boisko przed rozgrzewką.",
    humorBody: "Pole karne trzeba rozpoznać bardziej z tradycji niż z wapna. Gospodarz zapewnia, że jeszcze rano wszystko było wyraźne.",
    choices: [
      { id: "help", label: "Pomagamy i zaczynamy rozgrzewkę później", feedback: "Mecz jest lepiej zabezpieczony, lecz zawodnicy tracą część rutyny przedmeczowej.", effects: { pressures: { board: -2 }, readiness: -2, teamMorale: 1 } },
      { id: "organizer", label: "To odpowiedzialność organizatora", feedback: "Bronisz zakresu pracy zespołu. Lokalni działacze uznają jednak ton za mało partnerski.", effects: { readiness: 1, pressures: { fans: 2, board: 1 } } },
      { id: "adapt", label: "Gramy, ale upraszczamy stałe fragmenty", feedback: "Plan uwzględnia warunki, choć rezygnujesz z części przygotowanych schematów.", effects: { readiness: 1, teamMorale: -1, pressures: { personal: 1 } } },
    ],
  },
  {
    id: "wedding-absence", from: 7, to: 10, category: "Dostępność kadry", title: "Wesele wygrało z terminem kolejki", minRound: 3,
    body: "Trzech zawodników prosi o wcześniejsze zwolnienie z meczu z powodu rodzinnej uroczystości. Dwóch zwykle zaczyna w składzie.",
    humorBody: "W sobotę gra liga, w sobotę gra też orkiestra. Dwóch podstawowych graczy deklaruje pełną gotowość — do pierwszego tańca.",
    choices: [
      { id: "release", label: "Rodzina ma pierwszeństwo, przebudowuję XI", feedback: "Relacje rosną, ale plan sportowy trzeba ułożyć ponownie i bez dwóch ważnych graczy.", effects: { relation: 3, readiness: -3, burnout: 1 } },
      { id: "play", label: "Najpierw mecz, potem uroczystość", feedback: "Jakość składu została obroniona, lecz zawodnicy i część szatni czują brak elastyczności.", effects: { readiness: 2, relation: -3, pressures: { dressing: 2 } } },
      { id: "minutes", label: "Dzielimy minuty i organizujemy transport", feedback: "Kompromis kosztuje logistykę i zmianę planu, ale żadna strona nie czuje się zlekceważona.", effects: { readiness: -1, relation: 2, burnout: 2 } },
    ],
  },
  {
    id: "festival-clash", from: 7, to: 10, category: "Otoczenie", title: "Festyn dzieli parking i uwagę",
    body: "W dniu meczu obok stadionu odbywa się lokalny festyn. Klub może wykorzystać frekwencję albo odciąć zespół od zamieszania.",
    humorBody: "Po jednej stronie odprawa, po drugiej konkurs na najgłośniejszą kosiarkę. Gmina zapewnia, że programy wydarzeń prawie się nie nakładają.",
    choices: [
      { id: "community", label: "Wchodzimy w wydarzenie i gramy dla ludzi", feedback: "Klub zyskuje sympatię, ale piłkarze mają mniej ciszy i rutyny przed spotkaniem.", effects: { pressures: { fans: -3 }, readiness: -2, teamMorale: 1 } },
      { id: "closed", label: "Zamykamy strefę drużyny", feedback: "Przygotowanie jest spokojniejsze, lecz część lokalnej społeczności odbiera dystans chłodno.", effects: { readiness: 2, pressures: { fans: 2 } } },
      { id: "short", label: "Krótka obecność, potem pełne skupienie", feedback: "Utrzymałeś więź z otoczeniem kosztem dodatkowej organizacji po stronie sztabu.", effects: { pressures: { fans: -1 }, burnout: 1, readiness: 1 } },
    ],
  },
  {
    id: "floodlights", from: 3, to: 10, category: "Infrastruktura", title: "Oświetlenie nie wytrzyma całego treningu",
    body: "Administrator ostrzega przed awarią jednej sekcji lamp. Musisz skrócić zajęcia albo zmienić plan.",
    humorBody: "Jedna lampa świeci, druga negocjuje warunki kontraktu. Administrator daje im obu równe szanse na dokończenie treningu.",
    choices: [
      { id: "tactical", label: "Krótka jednostka taktyczna na boisku", feedback: "Najważniejsze zachowania przećwiczono, ale bodziec fizyczny będzie mniejszy.", effects: { readiness: 2, teamFatigue: -2, pressures: { personal: 1 } } },
      { id: "indoor", label: "Przenosimy część pracy pod dach", feedback: "Zespół zachował objętość, lecz warunki słabiej odpowiadają meczowi.", effects: { teamMorale: 1, readiness: -1, burnout: 1 } },
      { id: "full", label: "Realizujemy całość mimo ryzyka przerwy", feedback: "Ambicja została doceniona, a niepewność podniosła obciążenie i chaos zajęć.", effects: { readiness: 1, teamFatigue: 3, pressures: { dressing: 1 } } },
    ],
  },
  {
    id: "kit-clash", from: 4, to: 10, category: "Sprzęt", title: "Dwa komplety, jeden kolor",
    body: "Sędzia ocenił, że stroje drużyn są zbyt podobne. Rezerwowy komplet jest niepełny.",
    humorBody: "Obie drużyny przyjechały w barwach, które katalog nazywa innymi, a sędzia nazywa takimi samymi.",
    choices: [
      { id: "bibs", label: "Gramy w jednolitych znacznikach", feedback: "Mecz ruszy bez opóźnienia, lecz komfort i wizerunek zespołu ucierpią.", effects: { readiness: 1, teamMorale: -2, pressures: { media: 1 } } },
      { id: "borrow", label: "Pożyczamy komplet od lokalnego klubu", feedback: "Sprzęt jest czytelny, ale sponsor i działacze nie będą zachwyceni obcymi barwami.", effects: { teamMorale: 1, pressures: { board: 3 } } },
      { id: "delay", label: "Czekamy na dowiezienie właściwych strojów", feedback: "Klub zachowa identyfikację, lecz opóźnienie zaburzy koncentrację i relację z organizatorem.", effects: { readiness: -3, pressures: { board: 1 }, relation: 1 } },
    ],
  },
  {
    id: "volunteer-stewards", from: 5, to: 10, category: "Organizacja", title: "Derby potrzebują dodatkowych porządkowych",
    body: "Frekwencja zapowiada się większa niż zwykle, a klubowi brakuje ludzi do zabezpieczenia meczu.",
    humorBody: "Na derby przyjdą wszyscy, łącznie z ludźmi, którzy od lat twierdzą, że już nie chodzą. Lista porządkowych jest krótsza od listy komentarzy.",
    choices: [
      { id: "appeal", label: "Apelujemy do społeczności o pomoc", feedback: "Klub uruchomił lokalne wsparcie, ale publicznie pokazał organizacyjne ograniczenia.", effects: { pressures: { fans: -2, media: 2 }, teamMorale: 1 } },
      { id: "agency", label: "Zarząd płaci zewnętrznej ochronie", feedback: "Bezpieczeństwo rośnie, zaś prezes przypisuje dodatkowy koszt do Twoich oczekiwań.", effects: { pressures: { board: 3, fans: -1 }, readiness: 1 } },
      { id: "limit", label: "Ograniczamy liczbę wejściówek", feedback: "Ryzyko organizacyjne spadło, lecz kibice pozbawieni miejsc kierują frustrację w stronę klubu.", effects: { pressures: { fans: 4, board: -1 }, burnout: 1 } },
    ],
  },
  {
    id: "keeper-shift", from: 7, to: 10, category: "Dostępność kadry", title: "Rezerwowy bramkarz nie dostanie wolnego",
    body: "Drugi bramkarz ma zmianę w pracy, a podstawowy zgłasza lekki uraz. Decyzję trzeba podjąć przed ostatnim treningiem.",
    humorBody: "Pierwszy bramkarz ma problem z mięśniem, drugi z grafikiem. Trzeci istnieje na papierze i podobno kiedyś bronił na hali.",
    choices: [
      { id: "starter", label: "Ryzykuję podstawowym bramkarzem", feedback: "Jakość sportowa zostaje, ale uraz i sygnał wysłany sztabowi medycznemu zwiększają napięcie.", effects: { readiness: 2, pressures: { dressing: 2, personal: 2 } } },
      { id: "outfield", label: "Przygotowuję zawodnika z pola", feedback: "Zabezpieczyłeś pozycję awaryjnie, tracąc czas treningu i część jakości wyjściowej XI.", effects: { readiness: -3, teamMorale: 1, burnout: 1 } },
      { id: "negotiate", label: "Klub negocjuje zmianę grafiku w pracy", feedback: "Bramkarz może zdążyć, ale lokalny pracodawca oczekuje wzajemności od klubu.", effects: { readiness: 1, relation: 2, pressures: { board: 2 } } },
    ],
  },
  {
    id: "social-rumor", from: 5, to: 10, category: "Lokalne media", title: "Plotka transferowa żyje szybciej niż klub",
    body: "Lokalny profil ogłosił odejście podstawowego gracza. Zawodnik zaprzecza, ale szatnia pyta o jego przyszłość.",
    humorBody: "Transfer został potwierdzony przez komentarz kuzyna kolegi. Sam zawodnik dowiedział się o nim między rozgrzewką a rozciąganiem.",
    choices: [
      { id: "deny", label: "Klub stanowczo dementuje", feedback: "Szatnia dostała jasny komunikat, lecz każda późniejsza zmiana będzie wyglądała jak utrata kontroli.", effects: { pressures: { dressing: -2, media: 2 }, relation: 1 } },
      { id: "private", label: "Najpierw rozmowa z zawodnikiem", feedback: "Poznałeś jego sytuację, ale cisza publiczna zostawia miejsce na kolejne wersje historii.", effects: { relation: 3, pressures: { media: 2 }, burnout: 1 } },
      { id: "distance", label: "Nie komentujemy anonimowych informacji", feedback: "Klub nie wzmacnia plotki, za to część szatni odczytuje brak odpowiedzi jako niepewność.", effects: { pressures: { media: -1, dressing: 2 }, teamMorale: -1 } },
    ],
  },
  {
    id: "cold-showers", from: 6, to: 10, category: "Infrastruktura", title: "Ciepła woda skończyła sezon wcześniej",
    body: "Po treningu instalacja przestała grzać. Następna jednostka może odbyć się normalnie albo na obiekcie zastępczym.",
    humorBody: "Prysznice oferują wyłącznie wariant regeneracji kriogenicznej. Administrator zapewnia, że wzmacnia charakter i obniża rachunki.",
    choices: [
      { id: "stay", label: "Trenujemy tutaj i skracamy zajęcia", feedback: "Plan zachował lokalizację i rytm, ale objętość oraz komfort drużyny spadły.", effects: { readiness: -1, teamFatigue: -2, pressures: { dressing: 2 } } },
      { id: "move", label: "Przenosimy trening na obcy obiekt", feedback: "Warunki są lepsze, jednak dojazd i koszt obciążają zawodników oraz zarząd.", effects: { readiness: 2, teamFatigue: 1, pressures: { board: 2 } } },
      { id: "recover", label: "Zmieniam jednostkę na regeneracyjną", feedback: "Zespół odpoczął, lecz świadomie rezygnujesz z części przygotowania meczowego.", effects: { teamFatigue: -4, readiness: -2, teamMorale: 1 } },
    ],
  },
  {
    id: "double-booking", from: 4, to: 10, category: "Organizacja", title: "Stadion ma dwóch gospodarzy o tej samej godzinie",
    body: "Obiekt miejski został zarezerwowany równolegle dla meczu i innego wydarzenia. Klub czeka na Twoją rekomendację.",
    humorBody: "Według jednego kalendarza gracie ligę, według drugiego odbywa się turniej zakładowy. Oba dokumenty mają pieczątkę.",
    choices: [
      { id: "move", label: "Przenosimy mecz na boczne boisko", feedback: "Termin zostaje, lecz warunki i przewaga własnego obiektu będą słabsze.", effects: { readiness: -2, pressures: { fans: 2, board: -1 } } },
      { id: "time", label: "Walczymy o zmianę godziny", feedback: "Główna murawa jest do obrony, ale zawodnicy i kibice muszą zmienić plany.", effects: { pressures: { fans: 2, board: 1 }, relation: 1 } },
      { id: "municipality", label: "Niech urząd wskaże i sfinansuje rozwiązanie", feedback: "Chronisz budżet klubu, ryzykując spór z właścicielem obiektu i publiczną dyskusję.", effects: { pressures: { board: -2, media: 3 }, burnout: 1 } },
    ],
  },
  {
    id: "referee-delay", from: 5, to: 10, category: "Organizacja", title: "Sędzia utknął w drodze",
    body: "Obsada informuje o dużym opóźnieniu. Zawodnicy są po rozgrzewce i nie wiedzą, kiedy zacznie się mecz.",
    humorBody: "Sędzia stoi w korku, drużyny stoją na stadionie, a jedynie zegar realizuje plan bez zastrzeżeń.",
    choices: [
      { id: "warm", label: "Podtrzymujemy gotowość na murawie", feedback: "Zespół zachował rytm ruchowy, ale dodatkowy wysiłek zwiększył zmęczenie przed meczem.", effects: { readiness: 2, teamFatigue: 3 } },
      { id: "locker", label: "Wracamy do szatni i wyciszamy grupę", feedback: "Oszczędzasz nogi, ryzykując utratę temperatury i koncentracji.", effects: { teamFatigue: -1, readiness: -2, pressures: { personal: -1 } } },
      { id: "game", label: "Krótka gra wewnętrzna zamiast czekania", feedback: "Drużyna odzyskała energię mentalną, lecz sztab bierze na siebie ryzyko urazu.", effects: { teamMorale: 2, teamFatigue: 2, pressures: { personal: 2 } } },
    ],
  },
  {
    id: "match-balls", from: 6, to: 10, category: "Sprzęt", title: "Piłki meczowe mają różne życiorysy",
    body: "Część piłek jest wyraźnie zużyta, a nowych nie dowieziono. Można trenować na tym zestawie albo ograniczyć pracę z piłką.",
    humorBody: "Jedna piłka jest nowa, dwie pamiętają poprzedni zarząd, a czwarta reaguje na podanie własnym pomysłem.",
    choices: [
      { id: "use", label: "Trenujemy sprzętem, który mamy", feedback: "Zespół oswoił warunki, choć jakość techniczna i cierpliwość zawodników ucierpiały.", effects: { readiness: 1, teamMorale: -2 } },
      { id: "buy", label: "Żądam zakupu przed kolejną jednostką", feedback: "Standard pracy wzrośnie, a zarząd doliczy wydatek do listy potrzeb zgłaszanych przez trenera.", effects: { readiness: 2, pressures: { board: 3 } } },
      { id: "physical", label: "Robimy akcent bez piłki", feedback: "Grupa doceniła improwizację, lecz dostała zmęczenie zamiast potrzebnego przygotowania technicznego.", effects: { teamFatigue: 3, readiness: -2, teamMorale: 1, pressures: { dressing: 1 } } },
    ],
  },
  {
    id: "pitch-pedestrian", from: 8, to: 10, category: "Lokalny koloryt", title: "Spacer nie uznaje linii bocznej", weight: .45,
    body: "Podczas zajęć mieszkaniec skraca sobie drogę przez boisko. Reakcję trenera obserwują zawodnicy i kilka osób zza ogrodzenia.",
    humorBody: "Środkiem boiska maszeruje człowiek, który ma własny plan przejścia i wyraźnie nie przewiduje pressingu.",
    choices: [
      { id: "polite", label: "Spokojnie proszę o obejście murawy", feedback: "Sytuacja kończy się bez konfliktu, choć trening na chwilę traci tempo.", effects: { pressures: { fans: -1 }, readiness: -1, relation: 1 } },
      { id: "stop", label: "Przerywam zajęcia i pilnuję zasad", feedback: "Standard obiektu został obroniony. Lokalny obserwator głośno komentuje przesadną powagę.", effects: { pressures: { fans: 2 }, teamMorale: 1 } },
      { id: "use", label: "Wykorzystuję przerwę na korektę ustawienia", feedback: "Drużyna doceniła dystans, ale sztab nie może normalizować kolejnych zakłóceń.", effects: { teamMorale: 2, readiness: 1, pressures: { board: 1 } } },
    ],
  },
  {
    id: "chairman-talk", from: 4, to: 10, category: "Prezes", title: "Prezes przygotował własną odprawę",
    body: "Prezes chce wejść do szatni przed ważnym meczem. Nie zdradza treści przemówienia i oczekuje pięciu minut.",
    humorBody: "Prezes ma mowę, trzy anegdoty i przekonanie, że pięć minut jest pojęciem elastycznym. Taktyki podobno nie będzie dotykał.",
    choices: [
      { id: "allow", label: "Dostaje pięć minut przed odprawą", feedback: "Relacja z zarządem rośnie, ale drużyna otrzymała dodatkowy bodziec, którego nie kontrolujesz.", effects: { pressures: { board: -3, dressing: 2 }, readiness: -1 } },
      { id: "after", label: "Zapraszam go dopiero po mojej odprawie", feedback: "Zachowałeś kolejność i plan, ryzykując urażenie ego prezesa.", effects: { readiness: 2, pressures: { board: 3 } } },
      { id: "brief", label: "Ustalamy wcześniej wspólny komunikat", feedback: "Przekaz jest spójny, lecz przygotowanie rozmowy zabiera energię i czas trenera.", effects: { pressures: { board: -1, dressing: -1 }, burnout: 2 } },
    ],
  },
  {
    id: "lineup-leak", from: 1, to: 5, category: "Informacja", title: "Skład wyciekł przed odprawą",
    body: "Media opublikowały prawdopodobną XI przed przekazaniem decyzji zawodnikom. Kilku rezerwowych dowiedziało się z telefonu.",
    choices: [
      { id: "change", label: "Koryguję jeden element planu", feedback: "Rywal nie dostanie pełnej informacji, ale zespół widzi, że wyciek wpłynął na sportową decyzję.", effects: { readiness: -1, pressures: { dressing: 2, media: -1 } } },
      { id: "keep", label: "Nie zmieniam decyzji pod presją", feedback: "Plan pozostaje spójny. Rezerwowi oczekują jednak wyjaśnienia sposobu komunikacji.", effects: { readiness: 2, pressures: { dressing: 2 }, burnout: 1 } },
      { id: "investigate", label: "Najpierw rozmowa wewnątrz sztabu", feedback: "Chronisz długoterminowe zaufanie, kosztem skupienia i napięcia tuż przed meczem.", effects: { pressures: { board: -1, personal: 2 }, readiness: -2, relation: 1 } },
    ],
  },
  {
    id: "data-captain", from: 1, to: 5, category: "Analiza", title: "Dane mówią jedno, kapitan drugie",
    body: "Analitycy zalecają wysoki pressing, kapitan ostrzega, że zespół nie czuje się świeżo. Obie strony oczekują decyzji.",
    choices: [
      { id: "data", label: "Realizujemy plan analityczny", feedback: "Sztab widzi zaufanie do pracy, lecz zawodnicy biorą na siebie większe obciążenie.", effects: { readiness: 3, teamFatigue: 3, pressures: { dressing: 2 } } },
      { id: "captain", label: "Obniżamy pressing zgodnie z sygnałem szatni", feedback: "Zespół czuje się wysłuchany, ale część przygotowanego dopasowania traci zastosowanie.", effects: { relation: 2, teamFatigue: -2, readiness: -2 } },
      { id: "trigger", label: "Pressing tylko po ustalonych sygnałach", feedback: "Powstał kompromis wymagający dodatkowej pracy na odprawie i koncentracji w meczu.", effects: { readiness: 2, burnout: 1, pressures: { personal: 1 } } },
    ],
  },
  {
    id: "ultras-visit", from: 1, to: 4, category: "Kibice", title: "Trybuna chce rozmowy przed treningiem", minRound: 4,
    body: "Delegacja aktywnych kibiców prosi o spotkanie po słabszej serii. Zarząd nie narzuca odpowiedzi.",
    choices: [
      { id: "meet", label: "Rozmawiam osobiście i stawiam granice", feedback: "Napięcie kibiców spadło, ale trener przejmuje część odpowiedzialności komunikacyjnej zarządu.", effects: { pressures: { fans: -4, personal: 3, board: -1 }, burnout: 1 } },
      { id: "captains", label: "Spotkanie tylko z udziałem kapitanów", feedback: "Szatnia uczestniczy w odpowiedzialności, lecz część graczy nie chce być stroną publicznego sporu.", effects: { pressures: { fans: -2, dressing: 3 }, relation: 1 } },
      { id: "club", label: "To sprawa zarządu i rzecznika", feedback: "Chronisz pracę sportową, zaś kibice mogą odczytać brak obecności jako unikanie odpowiedzialności.", effects: { readiness: 1, pressures: { fans: 4, board: 1 } } },
    ],
  },
  {
    id: "hotel-noise", from: 1, to: 4, category: "Logistyka", title: "Hotel nie gwarantuje nocnego spokoju",
    body: "W obiekcie odbywa się duża impreza. Klub może zmienić hotel albo zaakceptować gorszą regenerację przed wyjazdem.",
    humorBody: "Recepcja zapewnia ciszę nocną od chwili, gdy ostatni gość przestanie śpiewać. Nikt nie zna przewidywanej minuty tego zdarzenia.",
    choices: [
      { id: "move", label: "Zmieniamy hotel mimo kosztu", feedback: "Regeneracja została ochroniona, a zarząd dopisuje nagły wydatek do oceny organizacji wyjazdu.", effects: { teamFatigue: -3, readiness: 2, pressures: { board: 3 } } },
      { id: "stay", label: "Zostajemy i pilnujemy własnego reżimu", feedback: "Budżet jest bezpieczny, lecz jakość snu i cierpliwość zawodników mogą ucierpieć.", effects: { teamFatigue: 3, pressures: { board: -2, dressing: 1 } } },
      { id: "compensate", label: "Późniejsza pobudka i krótsza odprawa", feedback: "Zespół odzyska część snu kosztem przygotowania szczegółów planu meczowego.", effects: { teamFatigue: -1, readiness: -2, teamMorale: 1 } },
    ],
  },
  {
    id: "star-social", from: 1, to: 5, category: "Media", title: "Lider skomentował taktykę na żywo",
    body: "W transmisji internetowej podstawowy zawodnik zasugerował, że zespół gra zbyt ostrożnie. Fragment krąży już w mediach.",
    choices: [
      { id: "private", label: "Rozmowa prywatna i jasna granica", feedback: "Zachowałeś szansę na odbudowę relacji, ale publiczna narracja pozostaje bez odpowiedzi.", effects: { relation: 1, pressures: { media: 2, dressing: -1 }, burnout: 1 } },
      { id: "fine", label: "Kara regulaminowa i komunikat klubu", feedback: "Standard komunikacji jest czytelny, lecz lider oraz jego stronnicy reagują chłodno.", effects: { pressures: { media: -2, dressing: 3, board: -1 }, relation: -3 } },
      { id: "football", label: "Publicznie odpowiadam argumentem sportowym", feedback: "Trener przejmuje przekaz i pokazuje plan, ale spór dostaje kolejną dobę zainteresowania.", effects: { reputation: 1, pressures: { media: 3, personal: 2 }, readiness: 1 } },
    ],
  },
  {
    id: "imposed-transfer", from: 1, to: 5, category: "Transfery", title: "Dyrektor przywozi zawodnika spoza listy",
    body: "Klub może podpisać gracza poleconego przez właściciela. Pozycja jest potrzebna, lecz profil nie pasuje do Twojego planu.",
    choices: [
      { id: "accept", label: "Akceptuję i szukam mu roli", feedback: "Kadra zyskała zawodnika, a Ty bierzesz odpowiedzialność za koszt dopasowania sportowego.", effects: { pressures: { board: -3, dressing: 2, personal: 2 }, readiness: -1 } },
      { id: "reject", label: "Blokuję transfer argumentami sportowymi", feedback: "Spójność kadry została obroniona, lecz właściciel zapamięta publicznie czytelny sprzeciw.", effects: { readiness: 2, pressures: { board: 4 }, reputation: 1 } },
      { id: "trial", label: "Zgoda tylko po okresie testowym", feedback: "Zyskałeś dane i czas, ale zawodnik oraz otoczenie oczekują szybkiej decyzji.", effects: { pressures: { board: 1, media: 1 }, burnout: 2, readiness: 1 } },
    ],
  },
  {
    id: "quote-context", from: 1, to: 6, category: "Media", title: "Nagłówek odciął połowę Twojego zdania",
    body: "Wypowiedź o cierpliwości została przedstawiona jako brak wiary w awans. Zarząd pyta, czy klub powinien reagować.",
    choices: [
      { id: "correct", label: "Publikujemy pełny kontekst", feedback: "Fakty zostały uporządkowane, lecz temat pozostanie w obiegu jeszcze dłużej.", effects: { pressures: { board: -2, media: 3 }, burnout: 1 } },
      { id: "ignore", label: "Nie karmimy jednodniowego nagłówka", feedback: "Sztab zachował skupienie, ale część kibiców przyjmuje skrót jako właściwą wersję.", effects: { readiness: 1, pressures: { media: -1, fans: 2 } } },
      { id: "conference", label: "Wyjaśniam na następnej konferencji", feedback: "Bierzesz odpowiedzialność za przekaz, ryzykując serię dodatkowych pytań i własne obciążenie.", effects: { reputation: 1, pressures: { personal: 2, media: 1 }, burnout: 1 } },
    ],
  },
  {
    id: "fixture-congestion", from: 1, to: 6, category: "Kalendarz", title: "Trzy mecze mieszczą się w ośmiu dniach", minRound: 5,
    body: "Przełożone spotkanie zagęściło terminarz. Sztab rekomenduje rotację, zarząd podkreśla wagę najbliższego meczu.",
    choices: [
      { id: "rotate", label: "Rotuję od pierwszego spotkania", feedback: "Świeżość długoterminowa rośnie, ale najbliższa XI ma niższy sufit jakości.", effects: { teamFatigue: -4, readiness: -2, pressures: { board: 2 } } },
      { id: "strong", label: "Najmocniejszy skład, potem ocena", feedback: "Chronisz szansę na pierwszy wynik, zwiększając ryzyko zmęczenia i trudnych zmian później.", effects: { readiness: 3, teamFatigue: 4, pressures: { personal: 2 } } },
      { id: "split", label: "Dzielę minuty według pozycji i obciążeń", feedback: "Plan jest bardziej złożony, ale rozkłada ryzyko bez całkowitego odpuszczenia spotkania.", effects: { teamFatigue: -2, burnout: 2, readiness: 1 } },
    ],
  },
  {
    id: "physio-absence", from: 1, to: 10, category: "Sztab", title: "Fizjoterapeuta wypada z mikrocyklu",
    body: "Osoba odpowiadająca za regenerację jest niedostępna. Możesz ograniczyć obciążenia, zatrudnić zastępstwo albo zaufać planowi.",
    choices: [
      { id: "reduce", label: "Obniżamy intensywność całej grupie", feedback: "Ryzyko przeciążenia spadło, lecz przygotowanie meczowe będzie mniej agresywne.", effects: { teamFatigue: -3, readiness: -2, pressures: { dressing: -1 } } },
      { id: "replacement", label: "Klub sprowadza zastępstwo", feedback: "Proces pozostaje profesjonalny, a dodatkowy koszt i nowe zaufanie obciążają zarząd.", effects: { readiness: 2, pressures: { board: 2 }, burnout: 1 } },
      { id: "continue", label: "Realizujemy plan i monitorujemy objawy", feedback: "Zachowałeś bodziec, ale odpowiedzialność za reakcję organizmów spada mocniej na trenera.", effects: { readiness: 2, teamFatigue: 2, pressures: { personal: 2 } } },
    ],
  },
  {
    id: "bonus-dispute", from: 1, to: 7, category: "Kontrakt", title: "Premia znaczy coś innego dla każdej strony", minRound: 6,
    body: "Po dobrej serii drużyna pyta o premię obiecaną przed sezonem. Zarząd twierdzi, że warunek nie został jeszcze spełniony.",
    choices: [
      { id: "players", label: "Staję po stronie szatni", feedback: "Zawodnicy widzą lojalność, a zarząd traktuje Twoje stanowisko jako wejście w finanse klubu.", effects: { teamMorale: 3, pressures: { dressing: -2, board: 4 }, relation: 2 } },
      { id: "board", label: "Obowiązuje literalny zapis kontraktu", feedback: "Prezes docenia dyscyplinę umów, lecz zespół czuje, że trener nie reprezentuje jego interesu.", effects: { pressures: { board: -3, dressing: 4 }, teamMorale: -2 } },
      { id: "milestone", label: "Negocjuję premię częściową za kolejny próg", feedback: "Powstał kompromis, który wymaga dalszych wyników i osobistego kredytu u obu stron.", effects: { pressures: { board: 1, dressing: -1, personal: 2 }, burnout: 2 } },
    ],
  },
  {
    id: "academy-parent", from: 1, to: 8, category: "Akademia", title: "Otoczenie talentu chce szybszej ścieżki",
    body: "Rodzina i agent młodego zawodnika pytają o debiut. Sztab uważa, że potencjał jest duży, lecz gotowość nierówna.",
    choices: [
      { id: "minutes", label: "Ustalam konkretne minuty i warunki", feedback: "Młody zna ścieżkę, a Ty tworzysz zobowiązanie zależne od kalendarza i formy.", effects: { relation: 2, pressures: { personal: 2, dressing: 1 }, burnout: 1 } },
      { id: "protect", label: "Chronię zawodnika przed publiczną presją", feedback: "Rozwój pozostaje spokojniejszy, lecz otoczenie może szukać klubu oferującego szybszy debiut.", effects: { pressures: { media: -1, board: 2 }, relation: -1, readiness: 1 } },
      { id: "training", label: "Dostaje tydzień z pierwszym zespołem bez obietnic", feedback: "Zyskasz porównanie na treningu kosztem minut i uwagi dla obecnej kadry.", effects: { readiness: -1, burnout: 1, relation: 2 } },
    ],
  },
  {
    id: "derby-allocation", from: 1, to: 8, category: "Kibice", title: "Derbowe bilety dzielą klub",
    body: "Pula wejściówek dla gości jest mniejsza niż zainteresowanie. Kibice chcą wsparcia trenera w rozmowie z zarządem.",
    choices: [
      { id: "support", label: "Publicznie proszę o większą pulę", feedback: "Kibice czują wsparcie, a zarząd musi tłumaczyć koszty i ryzyko organizacyjne.", effects: { pressures: { fans: -3, board: 3, media: 1 }, reputation: 1 } },
      { id: "neutral", label: "Skupiam się wyłącznie na meczu", feedback: "Sztab zachowuje koncentrację, lecz trybuna może uznać neutralność za brak zrozumienia derbów.", effects: { readiness: 2, pressures: { fans: 3 } } },
      { id: "private", label: "Rozmawiam z zarządem bez kamer", feedback: "Unikasz publicznego konfliktu, ale efekt będzie niewidoczny do chwili decyzji klubu.", effects: { pressures: { board: 1, fans: 1 }, burnout: 1, relation: 1 } },
    ],
  },
  {
    id: "equipment-role", from: 1, to: 10, category: "Sztab", title: "Magazynier zna drużynę lepiej niż raport",
    body: "Wieloletni pracownik klubu ostrzega, że jeden z liderów traci wpływ na szatnię. Analitycznie nic jeszcze tego nie potwierdza.",
    humorBody: "Człowiek od sprzętu nie ma wykresu, ale wie, kto ostatnio pierwszy wychodzi z szatni. Raport ma kolory, on ma pamięć.",
    choices: [
      { id: "listen", label: "Sprawdzam sygnał w rozmowach indywidualnych", feedback: "Możesz wcześnie wykryć problem, poświęcając czas i ryzykując rozsianie podejrzeń.", effects: { burnout: 2, pressures: { dressing: 1 }, relation: 1 } },
      { id: "data", label: "Czekam na zachowania, nie pogłoski", feedback: "Chronisz zespół przed plotką, ale ewentualny konflikt może rozwinąć się bez reakcji.", effects: { readiness: 1, pressures: { dressing: 2, personal: -1 } } },
      { id: "captain", label: "Pytam kapitana o temperaturę szatni", feedback: "Zyskujesz szybki obraz, oddając liderowi część kontroli nad interpretacją sytuacji.", effects: { relation: 2, pressures: { dressing: -1, personal: 2 } } },
    ],
  },
];
