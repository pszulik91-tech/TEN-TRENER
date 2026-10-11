# Audyt techniczny danych i IP — 2026-10-11

Zakres: źródła aplikacji, katalogi, importer i zasoby repozytorium. Nie jest to clearance prawny ani potwierdzenie autorstwa; brak dokumentów umownych nie oznacza automatycznie naruszenia.

| Kategoria | Ustalenie | Ocena przed publiczną publikacją |
|---|---|---|
| Interfejs, schemat boiska, makieta UX-01 | Budowane z CSS/React, bez stockowych zdjęć; własny znak TT / TEN TRENER | Technicznie niskie ryzyko; potwierdzić autorstwo i prawa do kodu oraz sprawdzić znak TEN TRENER |
| Herby | Obecna UI używa wygenerowanych inicjałów, nie plików oficjalnych herbów | Brak znalezionych oficjalnych herbów; nazwy klubu nadal wymagają sprawdzenia |
| Kluby i ligi | Katalog zawiera rzeczywiste nazwy klubów i rozgrywek | Wymagające sprawdzenia: znaki towarowe, sposób prezentacji, brak sugerowania afiliacji |
| PZPN, WZPN/ZPN, UEFA i nazwy licencji | Tekstowe odniesienia do organizacji i stopni, nie znaleziono ich graficznych znaków w aktywnym buildzie | Wymagające sprawdzenia; model kursów jest uproszczeniem, nie oficjalnym produktem organizacji |
| Dane katalogu | app/league-catalog.mjs: PZPN/WZPN i 90minut.pl; importer: RegioWyniki/WZPN snapshot2026/27 | Potencjalnie problematyczne bez potwierdzonej podstawy wykorzystania i warunków źródeł; sprawdzić też ochronę baz danych |
| Zawodnicy i prezesi | app/game-engine.ts losuje FIRST_NAMES/LAST_NAMES, wiek i cechy; brak importu autentycznych kadr | Niskie ryzyko wizerunkowe względem prawdziwych rosterów; przypadkowe zbieżności nazwisk są możliwe |
| Zdjęcia, muzyka, audio, wideo, fonty binarne | Nie znaleziono takich plików w repo; public ma favicon.svg oraz generyczne window/globe/file.svg | Brak odnalezionych zewnętrznych materiałów tego rodzaju; autorstwo SVG nieudokumentowane, sprawdzić przed finalnym wydaniem |
| Biblioteki, ikony | React, Vite, Lucide i inne zależności package-lock | Wymagają zachowania warunków konkretnych licencji i notices; package-lock nie jest samodzielnym potwierdzeniem spełnienia obowiązków |
| Repozytorium | GitHub aktualnie publiczne | Chroniony preview nie ukrywa kodu ani katalogu już dostępnych w repo; nie traktować tego jako ochrony tajemnicy projektu |

## Minimalna opcja ograniczenia ryzyka
Bez zmian automatycznych danych. Najmniejszy kolejny wariant to neutralny katalog nazw klubów/lig i oznaczenie fikcyjnego świata w izolowanej wersji prezentacyjnej, z zachowaniem ID i mechanik. Sama zmiana napisów nie rozwiązuje niepewnej proweniencji bazy. Wymaga decyzji właściciela oraz testów integralności; nie wprowadzono maskowania ani usuwania treści w tym etapie.

## Źródła i dalsze kroki
- [Komisja Europejska: znaki towarowe](https://single-market-economy.ec.europa.eu/industry/strategy/intellectual-property/trade-mark-protection-eu_en) — znak może być słowem lub logo; inicjały zamiast herbu nie są pełnym clearance nazwy.
- [EUIPO: wyszukiwanie praw](https://www.euipo.europa.eu/en/search-ip) — sprawdzić TEN TRENER i używane marki; w tym audycie nie wykonano pełnego przeszukania rejestrów.
- [Dyrektywa96/9/WE o bazach danych](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=celex%3A31996L0009) — fakty i uprawnienia do wykorzystania istotnej części bazy to różne kwestie. Nie ustalono, czy konkretny katalog spełnia przesłanki ochrony.
- Zebrać pochodzenie/zgody do danych i SVG, warunki źródeł, notices zależności oraz potwierdzenie praw od autorów. Przed publiczną lub komercyjną publikacją przekazać do specjalistycznej weryfikacji.

Wnioski o ryzyku są oceną techniczną na podstawie zawartości repozytorium, nie orzeczeniem o legalności. Nie dodano afiliacji, nowych assetów ani danych biznesowych.
