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

## PUBLISHER-01.1 — applied solutions

|Element|Needed for concept?|Publisher solution|Remaining check|
|---|---|---|---|
|Actual club names/imported database|No; sporting model yes|Independent authored fictional115groups/1398clubs, build alias excludes imported lists. Original source retained.|Source still public/main; no rights granted to it.|
|Official crests|No; identity yes|Procedural CSS/SVG with fictional initials.|Original code authorship.|
|League/federation brands|Levels/locality yes; brands no|Fictional regions/groups,neutral visible national/federation labels; generic division categories and technical keys preserved.|No affiliation/licensing claim.|
|Licences|Progression yes|Basic/B/A/professional labels; costs/time/eligibility unchanged.|Final real-world naming/production decision.|
|People|Individual identity yes|Existing generated names/traits, no imported authentic rosters.|Coincidental names possible.|
|External graphics/photos|No|Publisher publicDir excludes historical SVG/QA; new geometric TT favicon,existing CSS pitch/crests; no photos.|TEN TRENER mark/code/template authorship before commercial release.|
|Fonts/music/video|No|System fonts,no binaries/audio/video/remote fonts found.|Device fonts not distributed.|
|Libraries/CSS|Yes for UI|Installed browser dependency closure and CSS notices distributed; OSS_INVENTORY.md.|Historical vendored CSS lacks provenance header; recheck exact commercial distribution/transitive notices.|

Info explicitly states fictional data/provisional labels/not official federation product. Internal rule/schema keys may still contain original abbreviations; display does not claim licence. Separate namespace prevents accidental loading of source saves; ordinary foreign catalogue imports rejected, source saves not deleted. Technical risk reduction, not legal clearance. Historical publisher screenshots show earlier source-catalogue variant and are not part of safe build. New safe screenshots were captured locally but not recovered for Git publication after environment disconnection.

## BRAND-01 — logo supplied by owner (2026-10-12)
Official current-stage logo: branding/ten-trener-logo-master.png. Asset prepared for TEN TRENER and supplied by project owner; byte-identical original preserved. Technical WebP/icon derivatives only. No registered trademark or independently verified exclusivity claimed. Remaining commercial clearance of mark/artwork follows the existing audit. Details:BRAND_01.md.
