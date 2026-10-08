# TEN TRENER — WORK_STATE

Checkpoint: 2026-10-08. Repozytorium: pszulik91-tech/TEN-TRENER. Branch: main.
Aktualny zakres: GAME-08A — realistyczna kondycja, wydajność i regeneracja zawodnika; DONE. Kod i testy opublikowane. STOP po GAME-08A.

## HEAD
- HEAD kodu/testów po GAME-08A: `1ecf03bf19bb012449b55214a7e46a094bfc7c26` (main).
- HEAD kodu/testów po GAME-07: `944f5bf83155e10b974072d86c7f91ec02681a30` (main).
- HEAD kodu/testów po GAME-06: `1c39f3fe43d0c5ab5ebe5c00b682845c6575d8a9` (main).
- HEAD kodu/testów po GAME-05: `178ff7b9a97caf243af63b028dcc602c920ce3de` (main).
- HEAD kodu/testów po GAME-04: `d586fc668ef12c971681c67f80842b776ade2670` (main).
- HEAD kodu/testów po GAME-03: `6e2b877cfec0c417d6c58073038f863e093d08d3` (main).
- HEAD kodu/testów po GAME-02: `5c9484b80e35e23965da078e24ce0ad97961caa4` (main).
- HEAD kodu/testów po GAME-01: `79297723f8a33a7d2662bf79621573dd79b0d484` (main).
- HEAD kodu/testów po DEV-01: `5b0b09c4e0f343183cc9f33cf71f854628c19b60` (main).
- HEAD testu po DEV-06: `8025a9b91a9220d64a83b9d2fe53ee58f7eb9887` (main).
- HEAD testu po DEV-05: `0562365414de37881fa06930bd927597c4fe37a4` (main).
- HEAD testu po DEV-04: `b17ad9764c7a1d9602634d23da260e2e61bc48bb` (main).
- HEAD testu po DEV-03: `0074e44f136be15f8920ee2ca7350cde0cf88b8c` (main).
- HEAD kodu/testu po DEV-02: `ad7959f43b44517b695731cb2e711404158f72a2`.
- HEAD przed sesją NEXT-02: ce761669cbcb732f1ed6e74426520b9672b97cd4 (wskazany przez użytkownika).
- HEAD zweryfikowany przed checkpointem: `40164e8b361133eec1f8aa46cb987ad50b97e4b2`.
- Commit checkpointu sprawdzony po zapisie: `729e13dfcec892713be445069a93023b1964ddac`.
- Aktualny commit dokumentacyjny: commit ostatniej aktualizacji tego pliku; dokładny SHA: `git log -1 --format=%H -- docs/WORK_STATE.md`. SHA własnego commita nie można wpisać do jego treści bez utworzenia kolejnego commita.

## CI / Node / build
- Node: `24.21.0`, potwierdzony w .nvmrc.
- Najnowszy Verify Pre-Alpha dla zweryfikowanego HEAD: SUCCESS, run #9, ID 37612829295.
- Wynik: https://github.com/pszulik91-tech/TEN-TRENER/actions/runs/37612829295
- build-and-test: SUCCESS; npm ci, npm test i npm run test:http: SUCCESS.
- careers / npm run audit:release: SUCCESS.
- Status builda: job build-and-test zielony. Osobny build produkcyjny nie był uruchamiany ani potwierdzany w tej sesji.
- CI commita checkpointu `729e13dfcec892713be445069a93023b1964ddac`: IN_PROGRESS podczas jedynego sprawdzenia, run ID 37658627109.
- Wynik: https://github.com/pszulik91-tech/TEN-TRENER/actions/runs/37658627109
- Nie odświeżano ponownie. Ta aktualizacja dokumentacyjna tworzy kolejny commit; jego CI nie było sprawdzane.

## NEXT-03 — smoke test: DONE (2026-10-07)

- Produkcja: https://ten-trener.netlify.app/ ; test w Cloud Browser jako autoryzowany właściciel.
- Ochrona Netlify przekierowała chwilowo do Team protection, po czym istniejąca sesja automatycznie dopuściła do gry. SSO/prywatność bez zmian; HUD wskazuje Private.
- Strona otwiera się; menu TEN TRENER — Pre-Alpha v0.1.0 renderuje się bez białego ekranu, widocznego 404/500 ani komunikatu krytycznego.
- NOWA KARIERA otwiera etap 1/4 kreatora. Wpisano testowy pseudonim Test Smoke; przycisk O doświadczeniu przechodzi do etapu 2/4. Wstecz wraca do etapu 1.
- USTAWIENIA otwierają prawidłowo wyrenderowany panel; Zamknij ustawienia wraca do menu.
- Odświeżenie w kreatorze na faktycznej trasie / ładuje ponownie menu bez 404. Sprawdzone ekrany nie zmieniają URL; nie wymyślano dodatkowych tras. Niedokończony kreator po reloadzie wraca do menu; trwałość szkicu nie była objęta testem.
- Brak widocznego krytycznego błędu JavaScript lub ładowania zasobów. Odczyt konsoli error/warn (limit 200) nie wykazał wpisów aplikacji; wpisy Error sending browser metadata to extension pochodziły z chrome-extension://, nie z gry.
- Renderowanie panelu ustawień zweryfikowano również wizualnie zrzutem ekranu.
- Nie ukończono ani nie zapisano kariery, nie testowano meczu/sezonu i nie wykonywano pełnego testu gry.
- Zmieniono tylko docs/WORK_STATE.md; commit dokumentacyjny [skip ci]. Bez poprawek kodu, deploya i zmian ustawień Netlify.
- STOP: NEXT-03 zakończony.

## Netlify — DEPLOY-01: DONE (2026-10-07)

- Podłączono istniejący projekt ten-trener (167eaa74-4806-4eb2-8747-996de31ea60d) do GitHub pszulik91-tech/TEN-TRENER w Cloud Browser.
- Użytkownik autoryzował GitHub/Netlify i wybrał repozytorium.
- Production branch: main; kreator i log potwierdzają refs/heads/main.
- Pierwszy production deploy: 6ac684ec4255cb14504ff850.
- Panel: https://app.netlify.com/projects/ten-trener/deploys/6ac684ec4255cb14504ff850
- Wynik: SUCCESS / Published deploy / Your deploy completed successfully.
- Build i deploy: 57 s; Initializing, Building, Deploying, Cleanup i Post-processing: Complete.
- Wdrożony SHA: e0af8f2045f3d85623aee5d18b7a40846436840d (link commita w panelu).
- Produkcyjny URL wskazany przez panel: https://ten-trener.netlify.app/
- Permalink: https://6ac684ec4255cb14504ff850--ten-trener.netlify.app/
- Node: v24.21.0 z .nvmrc, npm v11.19.0 — potwierdzone w logu.
- Config file: /opt/build/repo/netlify.toml; context: production.
- Build command from netlify.toml: npm run build && npm run test:regression; Vite build zakończony sukcesem, job Building: Complete.
- Publish directory: dist; zgodny z kreatorem i Deploy file browser.
- Nie dodawano ręcznych override’ów command/publish, zmiennych środowiskowych ani zmian kodu.
- Netlify wykryło Next.js i Vite; log potwierdza Skipping Next.js plugin due to NETLIFY_NEXT_PLUGIN_SKIP environment variable. Nie wymagało to poprawki.
- SSO i prywatność nie były zmieniane. Nie otwierano gry i nie wykonywano smoke testu/NEXT-03.
- Ten zapis dokumentacyjny tworzy późniejszy commit niż wdrożony SHA; nie należy utożsamiać HEAD dokumentacji z SHA pierwszego deploya. Commit oznaczono [skip ci], aby aktualizacja checkpointu nie uruchamiała kolejnego builda.
- STOP: DEPLOY-01 zakończony; nie uruchamiać kolejnego deploya ani NEXT-03.

## Netlify — NEXT-02: DONE (odczyt panelu, 2026-10-07)

- Cloud Browser: po zalogowaniu użytkownika odczytano Project overview, Deploys i Developer settings.
- Projekt: ten-trener, ID 167eaa74-4806-4eb2-8747-996de31ea60d (potwierdzony przez badge w panelu).
- Podłączone repozytorium Git: BRAK. Developer settings → Repository: „Current repository: Not linked”. Repozytorium pszulik91-tech/TEN-TRENER nie jest połączone z tym projektem.
- Production branch: BRAK brancha dla integracji Git; integracja nie istnieje.
- Ostatni production deploy: BRAK. Overview i Deploys wyświetlają „Project has not yet been deployed”; brak wpisów wdrożeń.
- Commit/SHA wdrożenia: NIE DOTYCZY — brak wdrożenia.
- Wynik ostatniego production builda: NIE DOTYCZY — brak wdrożenia/production builda widocznego w panelu.
- Adres przypisany projektowi: ten-trener.netlify.app (link Go to site w Overview). Nie potwierdzono działania gry pod adresem; NEXT-03 nie wykonano.
- Overview: „Private project”; „Make public” nieaktywne, „Available after your first successful deploy”. SSO/dostęp nie były zmieniane.
- Build command i publish directory w panelu: niewidoczne jako skonfigurowane ustawienia budowania z Git; przy Not linked panel nie pokazuje sekcji build settings/production branch.
- Konfiguracja repozytorium z poprzedniego odczytu: netlify.toml command = npm run build && npm run test:regression; publish = dist. Jest spójna z Vite, ale nie ma podstaw twierdzić, że projekt Netlify ją obecnie wykorzystuje bez podłączonego repozytorium.
- Override’y względem netlify.toml: nie potwierdzono żadnych; brak integracji Git i builda uniemożliwia porównanie efektywnej konfiguracji. Nie zakładać, że override’y istnieją ani że konfiguracja została zastosowana.
- Potwierdzony blocker wdrożenia: niepodłączone repozytorium; brak pierwszego skutecznego deploya.
- KOREKTA wcześniejszych zapisów: API „current” i adresy wersji nie stanowiły wiarygodnego potwierdzenia publikacji. Zalogowany panel tego samego projektu wskazuje BRAK WDROŻENIA; wcześniejsze stwierdzenie o opublikowanym deployu wycofano.
- Dowody UI: https://app.netlify.com/projects/ten-trener/overview ; https://app.netlify.com/projects/ten-trener/deploys ; https://app.netlify.com/projects/ten-trener/configuration/developer-settings
- NEXT-02 DONE oznacza zakończenie odczytu i rozpoznanie przyczyny. Samo wdrożenie pozostaje BLOCKED.
- Nie podłączano repozytorium, nie uruchamiano deploya, nie zmieniano SSO ani innych ustawień; NEXT-03 niewykonane.

## DONE
- Potwierdzono oczekiwany HEAD main.
- Potwierdzono SUCCESS najnowszego Verify Pre-Alpha dla tego HEAD.
- Potwierdzono Node 24.21.0 oraz zielone testy HTTP i audit:release.
- Zapisano checkpoint wyłącznie w docs/WORK_STATE.md.

## BROKEN/BLOCKED
- Brak potwierdzonego blokera CI na zweryfikowanym HEAD.
- Użytkownik przed sesją potwierdził SUCCESS najnowszego Verify Pre-Alpha dla ce761669cbcb732f1ed6e74426520b9672b97cd4; nie odczytywano CI ponownie (zakres tylko NEXT-02).
- Dawny blocker Not linked usunięty w DEPLOY-01. Pierwszy production deploy zakończył się SUCCESS. Smoke test NEXT-03 PASS jako właściciel; ustawienia SSO/prywatności bez zmian.

## NEXT
- NEXT-01: Odczytać wynik Verify Pre-Alpha dla commita checkpointu, jeśli przy jednorazowym sprawdzeniu jeszcze trwał.
- NEXT-02 [DONE]: Odczytano panel Netlify; brak połączenia Git i brak wdrożenia. Ewentualna naprawa wymaga osobnego polecenia.
- NEXT-03 [DONE]: Smoke test produkcji jako właściciel: menu, kreator etap 1→2→1, ustawienia, odświeżenie / i konsola — PASS.

STOP: NEXT-03 DONE. Nie rozpoczynać nowych funkcji ani zmian SSO/konfiguracji.

## DEV-02 — pełne rozpoczęcie kariery: DONE (2026-10-07)

- Commit testu na main: `ad7959f43b44517b695731cb2e711404158f72a2`. Zmiany opublikowane przez autoryzowane połączenie GitHub; terminal nie miał poświadczeń push. Drzewo commita odpowiada lokalnie przetestowanym plikom.
- Zweryfikowano istniejącą implementację oraz w Cloud Browser: NOWA KARIERA → etap 1 (tożsamość) → etap 2 (doświadczenie/licencja) → etap 3 (osiem odpowiedzi) → etap 4 (wizytówka) → wybór LKS Górki Śląskie → dwa cele → „Pierwszy dzień w klubie / Witamy w LKS Górki Śląskie”. PASS.
- Błąd gry: nie stwierdzono; kod aplikacji bez zmian. Nakładka narzędzi Netlify zasłaniała przycisk wyboru klubu; zwinięcie nakładki wystarczyło. Bez zmian SSO, prywatności lub konfiguracji Netlify.
- Dodano jeden test integracyjny `tests/career-creation.test.mjs`, uruchamiany istniejącym `test:regression`. Przechodzi rzeczywiste komponenty App przez przyciski i wszystkie etapy, wybiera klub i cele, sprawdza blokadę startu przy 0/1 celu oraz ekran powitalny i dane utworzonej kariery (trener, licencja, klub, dwa cele, kolejka 1, brak rozegranych meczów). Nie podmienia logiki gry; zastępuje tylko usługi przeglądarki.
- Pliki zmienione: `tests/career-creation.test.mjs`, `package.json`, `package-lock.json` (testowa zależność react-test-renderer 19.2.6), następnie `docs/WORK_STATE.md`.
- Testy na Node 24.21.0: nowy scenariusz PASS; `npm test` PASS — typecheck, produkcyjny build Vite i 107/107 testów regresji. Ostrzeżenie o dużym bundlu oraz deprecjacji testowego renderera nie przerywa testów.
- GitHub Actions Verify Pre-Alpha dla DEV-02: SUCCESS — aktualizacja przekazana przez użytkownika przed DEV-03. Run: https://github.com/pszulik91-tech/TEN-TRENER/actions/runs/37664569191. W sesji DEV-02 obserwowano jeszcze IN_PROGRESS.
- Netlify: ostatni potwierdzony produkcyjny deploy pozostaje opisany w DEPLOY-01; w DEV-02 nie sprawdzano nowego deploya ani nie zmieniano ustawień. Nie uruchamiano deploya ręcznie.
- BROKEN/BLOCKED dla DEV-02: brak. Pełne rozpoczęcie kariery działa; poprawka aplikacji nie była potrzebna.
- DEV-01 i DEV-03 nie wykonano. Następne zadanie wymaga osobnego polecenia użytkownika.
- Aktualizacja dokumentacyjna: osobny commit `[skip ci]`; jego SHA można odczytać przez `git log -1 --format=%H -- docs/WORK_STATE.md`.
- STOP: DEV-02 DONE.

## DEV-03 — zapis i kontynuacja kariery: DONE (2026-10-07)

- Commit testu na main: `0074e44f136be15f8920ee2ca7350cde0cf88b8c`. Commit i publikację wykonano przez autoryzowane połączenie GitHub.
- Sprawdzono istniejącą implementację: App automatycznie zapisuje utworzoną karierę przez storeCareer/encodeSave do localStorage; po starcie wykrywa SAVE_KEY i udostępnia KONTYNUUJ; loadGame/readCareer odczytuje zapis i otwiera właściwy ekran.
- Wynik scenariusza: PASS. Nie stwierdzono błędu, nie zmieniono systemu zapisu ani kodu aplikacji.
- Rozszerzono istniejący test integracyjny `tests/career-creation.test.mjs` o zapis → ponowne uruchomienie App → KONTYNUUJ. Nie dodano zależności.
- Test tworzy karierę przez rzeczywiste komponenty, czeka na rzeczywisty asynchroniczny automatyczny zapis, sprawdza zawartość SAVE_KEY i odkodowane dane, usuwa instancję App i uruchamia nową z zachowaną pamięcią localStorage. To test integracyjny z pamięcią localStorage zastąpioną mapą; nie wykonano osobnego odświeżenia w Cloud Browser.
- Po ponownym uruchomieniu renderuje się menu, a KONTYNUUJ jest aktywne. Kliknięcie otwiera ekran powitalny tej samej kariery. Stan odczytano z faktycznie renderowanego GameShell, nie z bufora activeCareer.
- Potwierdzono zgodność trenera, klubu, sezonu, kolejki, daty, seed, statystyk kariery, celów, treningu, terminarza i zawodników. Nie rozegrano meczu ani sezonu w nowym scenariuszu.
- Zmienione pliki: `tests/career-creation.test.mjs`, następnie `docs/WORK_STATE.md`.
- Testy: rozszerzony scenariusz PASS; `npm test` PASS na Node 24.21.0 — typecheck, produkcyjny build Vite, 107/107 testów regresji. Istniejący zestaw regresji obejmuje również testy silnika; nie wykonywano dodatkowego pełnego przebiegu meczu/sezonu.
- CI DEV-02 (`ad7959f43b44517b695731cb2e711404158f72a2`): SUCCESS według aktualizacji użytkownika.
- CI DEV-03: SUCCESS — aktualizacja użytkownika przed DEV-04 dla commita `0074e44f136be15f8920ee2ca7350cde0cf88b8c`. Run: https://github.com/pszulik91-tech/TEN-TRENER/actions/runs/37665517098. W sesji DEV-03 obserwowano jeszcze IN_PROGRESS.
- Netlify/SSO/prywatność i konfiguracja deployu: bez zmian; nie odczytywano nowego deploya i nie uruchamiano go ręcznie.
- BROKEN/BLOCKED dla DEV-03: brak.
- DEV-01 niewykonane. Kolejne zadanie wymaga osobnego polecenia użytkownika.
- Dokumentacja: osobny commit `[skip ci]`; SHA ostatniej aktualizacji: `git log -1 --format=%H -- docs/WORK_STATE.md`.
- STOP: DEV-03 DONE.

## DEV-04 — pierwszy mecz kariery: DONE (2026-10-07)

- Commit testu na main: `b17ad9764c7a1d9602634d23da260e2e61bc48bb`; commit i publikacja przez autoryzowane połączenie GitHub.
- Sprawdzono istniejące prepareMatch/advanceMatch/resolveMatchMoment, UI meczu oraz zapis/odczyt. Scenariusz działa; błędu gry nie stwierdzono. Bez poprawek silnika i kodu aplikacji.
- Rozszerzono jeden test integracyjny `tests/career-creation.test.mjs`: utworzenie i zapis kariery → ponowny start i KONTYNUUJ → Ułóż pierwszy mikrocykl → Zrealizuj cały mikrocykl → Mecz → Rozpocznij mecz → Następne 15 minut / reakcje trenera → raport po 90 minutach → zamknięcie raportu i pulpit → Zapisz → ponowny start i KONTYNUUJ.
- Test korzysta z rzeczywistych komponentów i silnika; usługi przeglądarki zastąpiono w pamięci testu. Nie wykonano osobnego testu meczu w Cloud Browser.
- Potwierdzono dostępny pierwszy termin, start meczu od minuty 0, ukończenie w ograniczonej liczbie kroków UI, nieujemny całkowity wynik, zgodność wyniku w terminarzu, played=true, wzrost careerStats.matches z 0 do 1, played=1 w tabeli klubu i przejście do kolejnej kolejki.
- Potwierdzono raport pomeczowy, jego zamknięcie, zapis wyniku i raportu oraz po KONTYNUUJ zgodność trenera, klubu, terminarza, statystyk, kolejki i daty.
- Istniejący readCareer/migrateGame wiąże raport z kanonicznym rozegranym terminem (uzupełnia matchState.fixture o played=true i bramki). Test uwzględnia tę normalizację; wynik nie ginie.
- Pliki zmienione: `tests/career-creation.test.mjs`, następnie `docs/WORK_STATE.md`. Bez nowych zależności.
- Testy na Node 24.21.0: `npm test` PASS — typecheck, build Vite, 107/107 regresji, w tym rozszerzony scenariusz pierwszego meczu.
- CI DEV-03: SUCCESS według aktualizacji użytkownika.
- CI DEV-04: SUCCESS — aktualizacja użytkownika przed DEV-05 dla `b17ad9764c7a1d9602634d23da260e2e61bc48bb`. Run: https://github.com/pszulik91-tech/TEN-TRENER/actions/runs/37666155203. W sesji DEV-04 obserwowano jeszcze IN_PROGRESS.
- Netlify, SSO, prywatność, infrastruktura i konfiguracja deployu: bez zmian; nowego deploya nie sprawdzano ani nie uruchamiano ręcznie.
- BROKEN/BLOCKED dla DEV-04: brak. DEV-01 niewykonane; nowy scenariusz kończy się po pierwszym meczu, bez testu całego sezonu.
- Dokumentacja: osobny commit `[skip ci]`; jego SHA: `git log -1 --format=%H -- docs/WORK_STATE.md`.
- STOP: DEV-04 DONE. Kolejne zadanie wymaga osobnego polecenia użytkownika.

## DEV-05 — przejście do drugiego meczu: DONE (2026-10-07)

- Commit testu na main: `0562365414de37881fa06930bd927597c4fe37a4`; commit i publikacja przez autoryzowane połączenie GitHub.
- Sprawdzono istniejące przesuwanie terminarza po meczu, reset completedRound, applyTraining, currentFixture oraz usuwanie zakończonego matchState przy wejściu do następnego meczu. Scenariusz działa; błędu aplikacji nie stwierdzono.
- Rozszerzono istniejący `tests/career-creation.test.mjs` o minimalną kontynuację po odczycie zapisu pierwszego meczu: Trening → Zrealizuj cały mikrocykl → Mecz → Rozpocznij mecz → kroki po 15 minut/reakcje → raport → pulpit → Zapisz → ponowny start App → KONTYNUUJ.
- Ten sam ograniczony fragment obsługi meczu wykorzystano dla obu spotkań. Bez zmian kalendarza, mikrocyklu, silnika lub systemu zapisu i bez nowych zależności.
- Potwierdzono dostęp do nowego mikrocyklu (completedRound=null, potem numer właściwej kolejki), właściwy kolejny termin, start drugiego meczu od minuty 0 oraz zakończenie po 90 minutach.
- Potwierdzono careerStats.matches 1→2 i played=2 w tabeli klubu. Kolejka i data przed drugim oraz po drugim meczu zgadzają się z najbliższym niegranym terminem własnego klubu; data rośnie. Test uwzględnia terminarz, nie zakłada braku pauz.
- Potwierdzono dwa rozegrane spotkania własnego klubu, niezmieniony pierwszy wynik oraz zgodność bramek drugiego meczu z terminarzem. Oba wyniki, cały terminarz, statystyki, kolejka i data pozostają poprawne po zapisie i KONTYNUUJ.
- Test integracyjny korzysta z prawdziwych komponentów App i silnika; tylko usługi przeglądarki są zastąpione w pamięci. Nie wykonano dodatkowego testu w Cloud Browser.
- Zmienione pliki: `tests/career-creation.test.mjs`, następnie `docs/WORK_STATE.md`.
- Testy na Node 24.21.0: rozszerzony scenariusz PASS; `npm test` PASS — typecheck, build Vite i 107/107 testów regresji.
- CI DEV-04: SUCCESS według aktualizacji użytkownika.
- CI DEV-05: SUCCESS dla `0562365414de37881fa06930bd927597c4fe37a4` — aktualizacja użytkownika przed DEV-06. https://github.com/pszulik91-tech/TEN-TRENER/actions/runs/37666659481.
- Netlify, SSO, infrastruktura, CI i konfiguracja deployu: bez zmian; nowego deploya nie sprawdzano ani nie uruchamiano ręcznie.
- BROKEN/BLOCKED dla DEV-05: brak. DEV-01 niewykonane; nowy scenariusz kończy się po dwóch meczach, bez testu całego sezonu.
- Dokumentacja: osobny commit `[skip ci]`; SHA: `git log -1 --format=%H -- docs/WORK_STATE.md`.
- STOP: DEV-05 DONE. Następne zadanie wymaga osobnego polecenia użytkownika.

## DEV-06 — zakończenie pierwszego sezonu: DONE (2026-10-07)

- Commit testu na main: `8025a9b91a9220d64a83b9d2fe53ee58f7eb9887`; commit i push przez autoryzowane połączenie GitHub.
- Najpierw sprawdzono istniejące pokrycie i uruchomiono niezmieniony audit:release: PASS, 53 sezony i 1480 meczów. audit:release, audit:playable i audit:tiers uruchamiają ten sam playable-career-audit z rzeczywistymi akcjami aplikacji (wszystkie 10 poziomów ligowych, grupa z pauzami, kariera 32-letnia). audit:careers jest odrębną uproszczoną symulacją; nie zastępuje weryfikacji tych akcji.
- Nie stwierdzono błędu aplikacji. Wykorzystano istniejący audyt; nie dodano drugiego dużego scenariusza ani nowych mechanik.
- Minimalne zabezpieczenia: po każdym meczu wcześniejsze wyniki pozostają niezmienione; liczba meczów kariery i każdej drużyny odpowiada terminarzowi; po ostatniej kolejce wszystkie spotkania są rozegrane, nie ma następnego własnego terminu, round wskazuje kolejkę po końcowej. Dotychczasowe kontrole tabeli i sum bramek pozostają aktywne.
- Istniejącą próbkę grupy nieparzystej zastąpiono grupą startową DEV-02 (Klasa B, Śląski ZPN, Rybnik I, LKS Górki Śląskie): pełny pierwszy sezon 24 meczów, z obsługą pauz. Jest to odtwarzalna nowa kariera testowa, nie odczyt prywatnego zapisu z produkcji.
- Przed ostatnim meczem (23 rozegrane) i po ostatnim (24) sprawdzono rzeczywisty skompresowany encodeSave → readCareer: zgodność trenera, klubu, terminarza/wyników, tabeli, statystyk, kolejki, daty i newSeasonPending. resumeScreen wskazuje dashboard; rozliczenie wykonano na stanie ponownie odczytanym po finale.
- Dokładnie po ostatnim meczu: wynik trafia do terminarza/tabeli, careerStats.matches rośnie, pozostałe mecze AI są domykane, newSeasonPending=true, kolejka przesuwa się za ostatnią, a data pozostaje datą ostatniego własnego meczu. Pojawia się raport pomeczowy; po jego zamknięciu pulpit pokazuje KONIEC SEZONU i Rozlicz sezon. Następny sezon nie uruchamia się automatycznie.
- Odczyt implementacji i test rzeczywistych akcji potwierdzają istniejącą ścieżkę: Rozlicz sezon → archiwizacja seasonRecords i wzrost careerStats.seasons → pendingSeason / ekran letnich ofert jobs. Jeśli trener pozostaje zatrudniony, może zostać w klubie; w przeciwnym razie wybiera ofertę. Następnie powstaje nowy terminarz bez rozegranych spotkań, sezon przesuwa się o rok, kolejka wraca do 1 i pojawia się ekran wyboru dwóch celów. Ich potwierdzenie odblokowuje dalszą grę. Sprawdzono również resumeScreen=jobs dla stanu oczekującego na wybór klubu oraz blokadę treningu przed celami.
- Etykiety KONIEC SEZONU i Rozlicz sezon sprawdzono przez renderowanie rzeczywistego DashboardV15 w SSR. Audyt używa rzeczywistych akcji gry; nie jest pełnym testem kliknięć przeglądarki ani smoke testem produkcji.
- Testy na Node 24.21.0: npm test PASS (typecheck, produkcyjny build Vite, 107/107 regresji); rozszerzony npm run audit:release PASS (53 sezony, 1476 meczów, 1478 odczytów zapisu, 53 rozliczenia sezonu). Różnica liczników względem bazowego audytu wynika z zastąpienia istniejącej próbki grupą Rybnik I oraz sprawdzenia jej rozliczenia.
- Zmienione pliki: scripts/playable-career-audit.mjs i docs/WORK_STATE.md. Generowany raport audytu przywrócono; kod aplikacji i zależności bez zmian.
- CI DEV-05: SUCCESS według aktualizacji użytkownika. CI DEV-06: SUCCESS dla `8025a9b91a9220d64a83b9d2fe53ee58f7eb9887` według aktualizacji użytkownika przed DEV-01; https://github.com/pszulik91-tech/TEN-TRENER/actions/runs/37668783104.
- Netlify/SSO/prywatność/infrastruktura/konfiguracja CI i deployu: bez zmian; stanu nowych wdrożeń nie odczytywano i nie uruchamiano deploya ręcznie.
- BROKEN/BLOCKED dla DEV-06: brak; CI SUCCESS potwierdzony przez użytkownika przed DEV-01.
- Dokumentacja: osobny commit [skip ci]; dokładny SHA: git log -1 --format=%H -- docs/WORK_STATE.md.
- NEXT: brak autoryzowanych kolejnych prac. DEV-01 niewykonane.
- STOP: DEV-06 DONE.

## DEV-01 — zapamiętywanie niedokończonego kreatora: DONE (2026-10-07)

- Commit kodu/testów na main: `5b0b09c4e0f343183cc9f33cf71f854628c19b60`; commit i push przez autoryzowane połączenie GitHub.
- Stan przed zmianą: dane trenera i wybór klubu/celów znajdowały się tylko w stanie App, a etap wywiadu i numer pytania w lokalnym stanie Creator. Restart App je usuwał; ukończona kariera miała już poprawny zapis localStorage.
- Rozwiązanie: etap i pytanie są kontrolowane przez App. Istniejący moduł app/save-storage.ts przechowuje mały wersjonowany szkic JSON pod CREATOR_DRAFT_KEY = SAVE_KEY + ':creator'. Szkic zawiera dane trenera, odpowiedzi, etap/pytanie, ekran creator/club/goals, wybór rozgrywek/klubu i celów. Nie powstał nowy system zapisu kariery ani nowy etap kreatora; format i klucz normalnego zapisu kariery pozostają bez zmian.
- Po restarcie menu udostępnia WZNÓW KREATOR, który przywraca dane i ekran. Odrzuć szkic i zacznij od nowa usuwa dotychczasowy szkic i otwiera czysty etap 1 (od tej chwili zapisuje się nowy, pusty szkic). NOWA KARIERA także zaczyna od początku; ostrzeżenie dotyczące istniejącego zapisu kariery pozostaje aktywne.
- Szkic jest usuwany dopiero po pomyślnym zapisie utworzonej kariery. Niedokończony kreator nie nadpisuje SAVE_KEY. Wczytanie starszej ukończonej kariery przez KONTYNUUJ nie usuwa równoległego szkicu.
- Odczyt szkicu waliduje wersję, strukturę, etap/pytanie, dane trenera, odpowiedzi, cele i spójność wybranego klubu dla ekranów club/goals. Uszkodzony szkic nie blokuje startu aplikacji. Błędy zapisu są przechwytywane; błąd localStorage nie blokuje samego rozpoczęcia kreatora.
- Rozszerzono istniejący mały test integracyjny tests/career-creation.test.mjs: wpisanie pseudonimu i zmiana wieku → etap 2 → restart/wznowienie → etap 3/pytanie 2 → restart/wznowienie → zgodność całego CoachDraft i numeru pytania → menu → odrzucenie i czysty etap 1. Sprawdzono też restart na wizytówce (etap 4), po wyborze klubu i po jednym celu, ukończenie kariery, brak szkicu, aktywne KONTYNUUJ i zachowanie tej samej kariery. Istniejące dwa mecze i zapis wyników nadal przechodzą. Dodatkowo szkic drugiej kariery nie zmienia istniejącego zapisu i nie przeszkadza w KONTYNUUJ.
- tests/onboarding.test.mjs dostosowano do kontrolowanych props stage/questionIndex; dotychczasowe asercje renderowania pozostają. Test integracyjny używa rzeczywistych komponentów i akcji, z pamięciową mapą localStorage zamiast przeglądarki. Osobnego smoke testu produkcji nie wykonywano.
- Pliki zmienione: app/page.tsx, app/coach-interview.tsx, app/setup-screens.tsx, app/save-storage.ts, tests/career-creation.test.mjs, tests/onboarding.test.mjs, następnie docs/WORK_STATE.md. Bez nowych zależności.
- Testy na Node 24.21.0: npm test PASS — typecheck, produkcyjny build Vite i 107/107 regresji; git diff --check PASS. Nie powtarzano pełnego audytu sezonów, ponieważ silnik meczu/sezonów nie był zmieniany.
- CI DEV-06: SUCCESS według aktualizacji użytkownika. CI DEV-01: IN_PROGRESS podczas jedynego odczytu; https://github.com/pszulik91-tech/TEN-TRENER/actions/runs/37670482332. Nie czekano ani nie odświeżano ponownie.
- Netlify, SSO, prywatność, infrastruktura, workflow CI i konfiguracja deployu: bez zmian; nowego deploya nie sprawdzano ani nie uruchamiano ręcznie.
- BROKEN/BLOCKED dla DEV-01: brak potwierdzonego blokera; wynik trwającego CI jeszcze niepotwierdzony.
- Dokumentacja: osobny commit [skip ci]; SHA: git log -1 --format=%H -- docs/WORK_STATE.md.
- NEXT: brak autoryzowanych kolejnych prac.
- STOP: DEV-01 DONE.

## GAME-01 — wiarygodny raport najbliższego rywala: DONE (2026-10-07)

- Commit kodu/testów na main: `79297723f8a33a7d2662bf79621573dd79b0d484`; publikacja przez autoryzowane połączenie GitHub (terminal push bez poświadczeń). Drzewo odpowiada lokalnie przetestowanym plikom.
- Przeczytano aktualny WORK_STATE. Verify Pre-Alpha DEV-01 dla 5b0b09c4e0f343183cc9f33cf71f854628c19b60: SUCCESS według aktualizacji użytkownika. Zastępuje wcześniejszy zapis IN_PROGRESS; brak blokera DEV-01. CI GAME-01 nie sprawdzano.
- Audyt opponentDossier: ostatnie wyniki i OVR pochodziły z Team; zmęczenie wybierało pulę zaleceń. Konkretne zalecenie, mocne/słabe strony i komentarze wybierał hash sezon/kolejka/ID. Pewność i pozorne źródła obserwacji zależały od poziomu ligi, częściowo od hasha.
- Obecny Team: id/nazwa, ovr, played/won/drawn/lost, gf/ga/points, opcjonalne form/morale/fatigue/lastFive. Terminarz zawiera wyniki. teamLiveStrength wykorzystuje OVR/formę/morale/zmęczenie. Nie ma atrybutów dośrodkowań, sektorów, niskiego bloku ani odporności na pressing.
- Mała czysta funkcja app/opponent-report.ts zastępuje dotychczasowy generator; istniejący panel Rywal pokazuje cztery fakty: OVR obu drużyn; punkty/mecze/bramki; ostatnie pięć rezultatów od najnowszego; zmęczenie. Brak danych jest jawny. Usunięto hash, pozorne cechy taktyczne, fikcyjne źródła, komentarze obserwacyjne i deklaracje pewności.
- Jedno zalecenie: przy OVR rywala > nasz OVR + 2 plan Najsilniejsza XI; w pozostałych przypadkach zrównoważona mentalność jako punkt wyjścia. Uzasadnienie podaje dokładne OVR i regułę. To propozycja sztabu, nie prognoza wyniku.
- npm test PASS: typecheck, produkcyjny build Vite, 111/111 regresji; git diff --check PASS. Dostępny Node 24.19.0; wymagany przez repo >=24.21.0 <25. Istniejące ostrzeżenia bundla/renderera/portu HMR nie przerwały testów. Nie potwierdzano ponownie CI.
- Cztery małe testy: dokładne fakty, reakcja na rzeczywiste dane i granicę OVR, zgodność uzasadnienia, deterministyczność/brak mutacji, niezależność od ID/sezonu/kolejki/ligi, brakujące dane bez wymyślonych wartości.
- Przykłady z createGame/currentFixture dla nowych karier: Ruch Bolesław — LKS Bojanów (OVR 32/36), Jagiellonia II Białystok — Ząbkovia Ząbki (58/54), Lech Poznań — Raków Częstochowa (72/75). Każdy przed sezonem: 0 pkt, 0 meczów, bramki 0:0, brak ostatnich wyników, zmęczenie 14/100.
- Zmieniono app/game-screens.tsx, app/opponent-report.ts, tests/opponent-report.test.mjs; następnie docs/WORK_STATE.md w osobnym commicie [skip ci]. Bez nowych zależności/atrybutów drużyn i zmian silnika.
- GAME-02/GAME-03 niewykonane; CI, Netlify, SSO bez zmian. Nie uruchamiano ręcznego deploya ani smoke testu produkcji.
- BROKEN/BLOCKED: brak. NEXT: brak autoryzowanych kolejnych prac.
- STOP: GAME-01 DONE.

## GAME-02 — pressing jako świadomy kompromis: DONE (2026-10-07)

- Commit kodu/testów na main: `5c9484b80e35e23965da078e24ce0ad97961caa4`; commit i publikacja przez autoryzowane połączenie GitHub. Drzewo odpowiada przetestowanym plikom.
- Przeczytano aktualny WORK_STATE. Verify Pre-Alpha GAME-01 dla 79297723f8a33a7d2662bf79621573dd79b0d484: SUCCESS według aktualizacji użytkownika. Zastępuje wcześniejszy brak potwierdzenia. CI GAME-02 nie sprawdzano.

### Audyt stanu przed GAME-02

- Przy prepareMatch: tacticalPlanImpact dodawał 0 dla Niski/Średni; Wysoki/Bardzo wysoki jednakowo +0.3 przy averageCondition >= 76, inaczej -0.4. Cały plan jest ograniczony do [-1.1, 0.7]; wysoka linia z niskim pressingiem ma istniejącą karę -0.35. Synergia mikrocyklu dla obu wysokich intensywności: +0.35 za Pressing/Motorykę, inaczej -0.3, regeneracja +0.12. Pozostałe składniki planu i treningu także mogą wpływać na ograniczenie końcowej sumy.
- Zmiana live używała odrębnych stałych instructionImpact: Niski -0.1, Średni 0, Wysoki +0.45, Bardzo wysoki +0.65. Dodawała różnicę nowych/starych wartości do siły, bez uwzględnienia kondycji.
- prepareMatch wylicza całe 90 minut przez simulateMatchPlan. changeLiveInstruction i resolveMatchMoment przeliczają plan tym samym ziarnem oraz nową siłą, zachowując zdarzenia do aktualnej minuty i wymieniając wyłącznie przyszłość. advanceMatch przesuwa czas do kolejnych 15 minut lub do sytuacji z ławki; sam nie przelicza zdarzeń.
- fatigue zawodników zmieniało się dopiero po meczu: dla XI baza 8 + koszt polityki + 2 za dowolny wysoki pressing + 1 za wysokie tempo + koszt wyborów z ławki; rezerwa -2. Istniejące limity fatigue [0,100] i test ryzyka urazu. Pressing był odczytywany wyłącznie z końcowej instrukcji. Brak historii/czasu; przełączenie na niski kasowało dodatkowe 2.

### Minimalna zmiana

- lib/pressing.mjs: funkcja wpływu pressingu na podstawie istniejącej kondycji XI (100-fatigue). Wysoki i Bardzo wysoki zmieniają skuteczność płynnie wokół kondycji 76; zakres samego wkładu wynosi odpowiednio [-0.45,+0.45] i [-0.65,+0.65]. Niski/Średni mają zerowy wkład intensywnego pressingu. Brak nowej staminy lub atrybutów zawodników.
- tacticalPlanImpact używa tej funkcji na starcie. Zmiana pressingu live liczy różnicę istniejącego planu i jego synergii treningowej, zamiast odrębnego stałego bonusu. Czynniki plan/trening w raporcie zachowują odpowiednie wartości. Mentalność, tempo, linia, inne instrukcje i ich reguły pozostają bez zmian.
- Jedno opcjonalne pressingExposure w MatchState: high, veryHigh, minute. Inicjalizacja przy starcie; akumulacja podczas faktycznego przesunięcia czasu, również do momentu zatrzymania przy ławce i do 90. minuty. Zmiana instrukcji rozlicza czas starej instrukcji, nie usuwa ekspozycji. Wielokrotna akcja w tej samej minucie nie dopisuje czasu.
- Po meczu dawne +2 zastępuje koszt proporcjonalny do ekspozycji: pełne 90 minut Wysoki +4 fatigue, Bardzo wysoki +8; mieszane odcinki sumowane, zaokrąglenie dopiero dla końcowego kosztu. Obciążenie trafia do istniejącej fatigue wyjściowej XI oraz istniejącej oceny ryzyka urazu. Pozostałe koszty meczu bez zmian.
- Brak pressingExposure w starszym zapisie nie blokuje odczytu. Nie da się odzyskać nieistniejącej historii: fallback przypisuje dotychczas rozegrane minuty do zapisanej bieżącej instrukcji. Od pierwszej akcji kolejne odcinki są zapamiętywane dokładnie. Ukończone stare mecze nie są ponownie rozliczane.
- UI: poradę dodano na używanym ekranie wyboru planu i przy selektorze pressingu w meczu. Kondycja XI, opis wpływu kondycji, poziom kosztu oraz zebrane obciążenie; bez wzorów i ukrytych współczynników. Odpoczynek po meczu nadal działa przez istniejące mechanizmy.

### Weryfikacja i zakres

- npm test PASS: typecheck, produkcyjny build Vite, 119/119 testów regresji; git diff --check PASS. Lokalny Node 24.19.0; repo wymaga >=24.21.0 <25. Istniejące ostrzeżenia bundla/renderera/HMR nie przerwały testów.
- Osiem testów pressingu: świeża vs zmęczona XI na starcie i live; większy koszt Bardzo wysoki; 75 vs 15 minut; zachowanie obciążenia po przełączeniu; rzeczywisty czas przy ławce; deterministyczność; kompresowany zapis/odczyt i stare zapisy; brak zmiany innych instrukcji/dopisania siły oraz zachowanie przeszłych zdarzeń; renderowanie używanych ekranów.
- npm run audit:release PASS: 53 sezony, 1572 mecze, 1574 odczyty zapisu, 53 rozliczenia sezonów. Audyt używa istniejących akcji gry. Kod sezonów/audytu nie zmieniony; wygenerowany raport audytu przywrócono. Przebieg kariery zmienia się wskutek nowych wyników/kondycji, więc liczniki meczów nie muszą odpowiadać poprzedniej wersji.
- Przykłady mechaniki: kondycja 90% + Wysoki ma dodatni wkład pressingu; kondycja 50% + Wysoki ma ujemny wkład. W obu przypadkach 75 minut Wysoki zostawia +3 fatigue za pressing, również po końcowych 15 minutach Niski. 90 minut Bardzo wysoki zostawia +8 fatigue (Wysoki +4), niezależnie od pozostałego zwykłego obciążenia.
- Zmienione pliki: app/game-actions.ts, app/game-data.ts, app/game-screens.tsx, app/gameplay-screens.tsx, lib/game-rules.mjs, lib/pressing.mjs, tests/pressing.test.mjs; następnie docs/WORK_STATE.md w osobnym commicie [skip ci]. Bez nowych zależności.
- Bez przebudowy generatora meczu. Raport rywala, sezony, kreator, CI, Netlify i SSO bez zmian. GAME-03 niewykonane; bez ręcznego deploya i testu produkcji.
- BROKEN/BLOCKED: brak. NEXT: brak autoryzowanych kolejnych prac.
- STOP: GAME-02 DONE.

## GAME-03 — jedna sprawa klubowa z odroczoną konsekwencją: DONE (2026-10-07)

- Commit kodu/testów na main: `6e2b877cfec0c417d6c58073038f863e093d08d3`; commit i publikacja przez autoryzowane połączenie GitHub. Drzewo odpowiada lokalnie przetestowanym plikom.
- Przeczytano aktualny WORK_STATE. Verify Pre-Alpha GAME-02 dla 5c9484b80e35e23965da078e24ce0ad97961caa4: SUCCESS według aktualizacji użytkownika. Zastępuje wcześniejszy brak potwierdzenia. CI GAME-03 nie sprawdzano.

### Audyt dotychczasowej architektury

- STORY_ARCS w lib/story-catalog.mjs: 24 trzyczęściowe wątki z zakresem lig, kategorią, odcinkami, wyborami i istniejącymi efektami. Bazowy katalog tworzy IDs support/standards/delegate; wybory są następnie deterministycznie tasowane.
- narrative.active zawiera arcId, clubId, step, due, started, waitingEventId oraz previousChoice/previousFeedback. normalizeNarrative klonuje aktywne historie aktualnego klubu, zachowuje znane arcId i ogranicza je do dwóch. Zmiana klubu zamyka aktywne sprawy. Pamięć seen/recent ogranicza powtórzenia; decisions przechowuje do 120 wpisów.
- issueFor wybierał zawsze arc.episodes[active.step]. previousChoice/previousFeedback były wyłącznie prefiksem tekstu. Generowanie nie czytało wcześniejszej decyzji przy wyborze definicji odcinka ani efektów, więc wszystkie odpowiedzi prowadziły do tego samego następnego zestawu decyzji.
- recordStoryDecision dopisuje wybór do dziennika. Po pierwszych dwóch częściach zwiększa step, wyznacza due za 2–4 mecze kariery i nadpisuje previousChoice/previousFeedback; po trzeciej usuwa historię i zwiększa completed. waitingEventId blokuje dalszy odcinek przed odpowiedzią; ponowne rozliczenie jest ignorowane. Zegar to liczba meczów kariery, nie kolejka.
- resolveDecision już stosuje efekty przez resolveIssueEffects oraz zapisuje narrative. Skala efektów jest losowana deterministycznie; wartości katalogowe nie zawsze są dokładnymi zmianami wskaźników. Ten mechanizm pozostaje bez zmian.

### Mała zmiana wyłącznie captain-voice

- Wybrano preferowany wątek Kapitan: naturalny związek prywatnej konsultacji albo publicznego wyjaśnienia zasad z późniejszą rolą kapitana. Część 1 i jej efekty pozostały bez zmian.
- Po wyborze w części 1 tylko captain-voice zapisuje opcjonalny captainBranch={route,firstChoice} w aktywnej historii. Stabilne ID support/delegate prowadzą do consultation, standards do public-standards; kolejność po tasowaniu nie ma znaczenia.
- Dwie gałęzie części 2 i 3, po dwie decyzje w odcinku. Konsultacje: Kapitan przynosi wspólny plan → Kapitan partnerem konsultacji. Publiczne zasady: Kapitan oczekuje wyjaśnienia granic → Autorytet po publicznym sporze.
- Gałąź zmienia definicję odcinka, dostępne ID/etykiety decyzji i efekty. Finały mają inne zakończenia: współpraca/ograniczona konsultacja albo porozumienie po sporze/podporządkowanie roli kapitana. Brak drzewa 3×3×3; wybór części 2 nie zmienia pierwszej gałęzi, ale jego efekty i feedback są zapamiętywane.
- Każdy wariant zawiera przyczynę: To następstwo Twojej pierwszej decyzji oraz dokładną etykietę pierwszej odpowiedzi. captainBranch nie jest nadpisywany przez previousChoice części 2, więc finał nadal zna pierwszą decyzję.
- Użyto wyłącznie istniejących efektów: teamMorale, relation, pressures.dressing, readiness, burnout. Bez nowej waluty, reputacji, ekranów lub silnika narracyjnego. Inne STORY_ARCS oraz ich definicje odcinków/wyborów bez zmian.
- Stare aktywne historie bez captainBranch i nieznana gałąź korzystają z oryginalnych odcinków 2/3. Nie rekonstruuje się gałęzi z tekstu. Stare oczekujące zdarzenia zachowują swoje zapisane wybory; odczyt ich nie przepisuje. Pierwszy wybór ze starego, jeszcze nierozwiązanego odcinka 1 może już zapisać nową gałąź.

### Testy i przykłady

- npm test PASS: typecheck, produkcyjny build Vite, 125/125 regresji; git diff --check PASS. Lokalny Node 24.19.0; repo deklaruje >=24.21.0 <25. Istniejące ostrzeżenia bundla/renderera/HMR nie przerywają testów.
- Sześć małych testów: niezmieniona część 1 i różne warianty części 2; pamięć pierwszego wyboru w finale; inne dostępne decyzje i efekty; zastosowanie efektów przez rzeczywiste gameActions.resolveDecision i jednorazowe zamknięcie; kompresowany encodeSave/decodeSave/migrateGame między odcinkami; stare/nieznane gałęzie; deterministyczność/brak mutacji. Test porównuje również oba późniejsze odcinki wszystkich pozostałych wątków z ich oryginalnymi definicjami.
- Przykład A: Rozmawiam z nim bez świadków → Kapitan przynosi wspólny plan / Sprawdzam propozycję przez jeden mikrocykl → Kapitan partnerem konsultacji / Utrzymuję krótkie konsultacje przed odprawą. Współpraca poprawia morale i relacje, wymaga uwagi trenera.
- Przykład B: Wyjaśniam zasady przy drużynie → Kapitan oczekuje wyjaśnienia granic / Potwierdzam jedną odprawę i egzekwuję ustalone zasady → Autorytet po publicznym sporze / Zostawiam odprawę sobie, kapitanowi przekazywanie uwag. Gotowość rośnie kosztem relacji i napięcia szatni.
- Pliki: lib/story-catalog.mjs, lib/career-stories.mjs, lib/career-stories.d.mts, tests/captain-story.test.mjs; następnie docs/WORK_STATE.md w osobnym commicie [skip ci]. Bez zależności.
- Nie powtarzano pełnego audytu sezonów: silnik meczu i sezonów bez zmian; pełna regresja nadal obejmuje istniejące mecze i zapis kariery.
- Pressing, raport rywala, silnik meczu, sezony, kreator, CI, Netlify i SSO bez zmian. Bez ręcznego deploya i testu produkcji.
- BROKEN/BLOCKED: brak. NEXT: brak autoryzowanych kolejnych prac.
- STOP: GAME-03 DONE.


## GAME-04 — Poznaj swoją drużynę: DONE (2026-10-07)

- Commit kodu/testów na main: `d586fc668ef12c971681c67f80842b776ade2670`; commit i push przez autoryzowane połączenie GitHub, drzewo z lokalnie przetestowanych plików.
- Przeczytano aktualny WORK_STATE. Verify Pre-Alpha GAME-03 dla 6e2b877cfec0c417d6c58073038f863e093d08d3: SUCCESS według aktualizacji użytkownika przed PRODUCT-02. CI GAME-04 nie sprawdzano.
- Audyt: selectLineupForPlan wyklucza injuryWeeks/absenceRounds, zaczyna od slotów z najmniejszą liczbą naturalnych kandydatów; najpierw minimalizuje positionPenalty, dopiero potem porównuje lineupPlanScore. Wynik zależy też od wcześniej obsadzonych pozycji. lineupPlanScore opiera się na liveOVR i istniejących priorytetach planu: forma/morale, kondycja, wiek, grupy pozycji. effectiveOVR to dyspozycja pomniejszona o niedopasowanie pozycji. Te funkcje i algorytm bez zmian; nie znaleziono błędu wymagającego poprawki.
- Zmieniono używany TeamPlanScreen (SquadV15 i TacticsV15). XI prezentuje dokładnie game.tactic.assignments w kolejności slotów formacji: pełne nazwisko, slot, naturalna pozycja, wiek, effectiveOVR, kondycja, forma i morale. Puste sloty są oznaczone. Lista poza XI obejmuje całą pozostałą kadrę, bez limitu lub nowego systemu ławki. Kontuzje i absencje pokazują rzeczywisty powód i czas; jednoczesne uraz/absencja nie ukrywają się wzajemnie.
- Ponownie użyto istniejącego układu player-card/roster-cards, z jedną kolumną na telefonie. Zachowano wybór planu, Siłę XI, kondycję, morale, młodych oraz poradę pressingu. Bez kontrolek ręcznego składu.
- Zmiana planu pokazuje wejścia/wyjścia i poprzednią/nową Siłę XI oraz kondycję (z różnicą). Porównanie jest wyłącznie useState ekranu, względem bezpośrednio poprzedniego planu; nie trafia do kariery ani zapisu. Przy braku zmian nazwisk komunikat wskazuje możliwe zmiany pozycji/instrukcji.
- Mała czysta lineupSelectionReason obok selektora opisuje rzeczywiście stosowane kryteria dla pozycji, danych i planu. Nie przypisuje wyboru jednej arbitralnej przyczynie, nie wymyśla szybkości/techniki, nie pokazuje wag lub wyniku score; uczciwie informuje o łączeniu kryteriów i obsadzie innych pozycji. Wyjaśnienia pojawiają się przy zawodnikach wchodzących do XI.
- npm test PASS: typecheck, produkcyjny build Vite, 130/130 regresji; git diff --check PASS. Lokalny Node 24.19.0, deklarowane >=24.21.0 <25. Istniejące ostrzeżenia bundla/renderera nie przerwały weryfikacji.
- Pięć nowych testów obejmuje: dokładne assignments i wykluczenie niedostępnych; konkretne zmiany nazwisk oraz wejścia/wyjścia; Siłę i kondycję z rzeczywistych graczy; uczciwe kryteria; deterministyczność; niezmienione wyniki selektora dla wszystkich 10 planów i 3 poziomów zmęczenia względem utrwalonej próbki sprzed GAME-04; renderowanie używanego ekranu i kliknięcie Rotacji. Próbkę pozyskano z kodu main 4638c3a, nie z nowej implementacji. Test nie wymaga historii git w CI.
- Przykład kontrolowanej kadry testowej: Najsilniejsza XI z Markiem Kowalskim i Piotrem Nowakiem na DP (kondycja obu 40%) → Rotacja: wchodzą Jan Wójcik i Adam Zieliński (DP, kondycja obu 100%); wypadają Kowalski i Nowak. Naturalne pozycje, bieżąca dyspozycja i dodatkowy priorytet kondycji decydują łącznie. Siła XI 59 → 59 (zaokrąglona), średnia kondycja 89% → 100% (+11 p.p.).
- Pliki: app/gameplay-screens.tsx, app/globals.css, app/lineup-presentation.ts, lib/game-rules.mjs, lib/game-rules.d.mts, tests/lineup-presentation.test.mjs, tests/fixtures/lineup-before-game04.json; następnie docs/WORK_STATE.md w osobnym commicie [skip ci]. Bez nowych zależności, danych zawodników lub mechanik meczowych.
- GAME-05 i GAME-06 niewykonane. Pressing, raport rywala, historie, transfery, sezony, kreator, silnik meczu, CI, Netlify i SSO bez zmian. Bez ręcznego deploya i testu produkcji; UI sprawdzono testem komponentu.
- BROKEN/BLOCKED: brak. NEXT: brak autoryzowanych kolejnych prac.
- STOP: GAME-04 DONE.


## GAME-05 — jeden mierzalny cel sportowy zarządu: DONE (2026-10-08)

- Commit kodu/testów na main: `178ff7b9a97caf243af63b028dcc602c920ce3de`. Publikacja przez autoryzowany konektor GitHub. Potwierdzono origin/main i identyczność pełnego drzewa z lokalnym d5ea057d6aff22f6a1f4c0ce586fb8afd21b1c5f: b23dba226c757aba61090e86c8513bb277a904bd; git diff --exit-code PASS. Te same 10 zmienionych plików i identyczna treść. Lokalny commit i zdalny różnią się metadanymi, nie zawartością.
- Odzyskano częściową implementację poprzedniej sesji: cztery zmienione pliki aplikacji, nowy moduł/panel/testy i raport audytu. Nie istniał commit GAME-05 ani push; origin/main wskazywał f61ed44, WORK_STATE kończył się na GAME-04. Kontynuowano istniejące zmiany.
- Verify Pre-Alpha GAME-04 d586fc668ef12c971681c67f80842b776ade2670: SUCCESS według aktualizacji użytkownika. CI GAME-05 nie sprawdzano.
- Dokładnie jeden boardGoal na klub/sezon: maxPlace wyliczone z relatywnego OVR drużyn i istniejącej ambicji prezesa. Remisy OVR używają środkowej prognozy miejsca; bazowy cel najwyżej ceil(85% liczby klubów), ambicja powyżej 60 zaostrza wymaganie maksymalnie o dwa miejsca. Bez losowania, nowych danych i zależności od reputacji, punktów, morale czy formy. Cel pozostaje stały przez sezon.
- Panel pokazuje dokładną granicę miejsca, aktualną pozycję z sortedTable i stan Realizowany/Zagrożony, na końcu Spełniony/Niewykonany. Widoczny na pierwszym dniu w klubie, Dashboard, Kariera i letnim rozliczeniu. Ekran powitalny nie pokazuje już ogólnego, potencjalnie sprzecznego oczekiwania.
- beginNextSeason zachowuje dotychczasową ocenę wyników, presji, cierpliwości i nieprzewidywalności prezesa; wynik celu dodaje -6/+6 p.p. do dismissalProbability, z istniejącymi granicami 2–86%. Bez gwarancji zatrudnienia albo automatycznego zwolnienia. Wynik i granica celu trafiają osobno do rekordu sezonu i historii. developmentGoals, ich progres, nagrody i statystyka goalsCompleted bez zmian.
- Start następnego sezonu (pozostanie/awans/spadek/nowy klub) ustala nowy cel z nowej ligi i prezesa. Migracja starego zapisu uzupełnia brakujący/nieprawidłowy cel raz z istniejących OVR; nie rekonstruuje nieznanej siły z początku sezonu. Poprawny zapisany cel jest zachowany. Dawne rozliczone sezony i rekordy nie są ponownie oceniane.
- npm test PASS: typecheck, produkcyjny build, 137/137 regresji; git diff --check PASS. Siedem testów celu obejmuje deterministyczność, siłę/ambicję, prawdziwą tabelę, wpływ na rzeczywiste zatrudnienie, zapis/odczyt/migrację, następny sezon i zmianę klubu oraz używane ekrany DashboardV15/CareerV14/Jobs i pierwszy dzień. Lokalny Node 24.19.0, repo deklaruje >=24.21.0 <25; istniejące ostrzeżenia bundla/renderera/HMR nie przerwały testów.
- npm run audit:release PASS: 1564 mecze, 53 sezony, 1566 kontroli zapisów, 5350 momentów, 2126 decyzji, 53 rozliczenia sezonów; długa kariera 32 sezony i dobrowolna emerytura po 65 r.ż. Raport docs/reports/playable-career-audit.json odświeżony.
- Przykłady kontrolowanej ligi 16 klubów, OVR 80..65: słaby OVR65/ambicja20 → 14. miejsce lub wyżej; średni OVR73/ambicja50 → 8. lub wyżej; mocny OVR78/ambicja100 → 1. miejsce. To przykłady modelu, nie oficjalnych miejsc awansu/spadku.
- Wpływ zatrudnienia: miejsce8/16, presja50, cierpliwość50, nieprzewidywalność26: bazowe ryzyko 28%, wykonanie 22%, niewykonanie 34%. Test przy tym samym losowaniu pomiędzy progami potwierdza pozostanie po wykonaniu i zwolnienie po niewykonaniu.
- Pliki: app/club-arrival.tsx, app/game-actions.ts, app/game-data.ts, app/game-engine.ts, app/game-screens.tsx, app/board-goal-panel.tsx, lib/board-goal.mjs, lib/board-goal.d.mts, tests/board-goal.test.mjs, docs/reports/playable-career-audit.json; następnie ten checkpoint w osobnym commicie [skip ci].
- GAME-06 niewykonane. Bez zmian innych mechanik, konfiguracji CI/Netlify/SSO i bez ręcznego deploya.
- STOP po GAME-05.


## GAME-06 — oferta pracy z konkretnym powodem: DONE (2026-10-08)

- Commit kodu/testów na main: `1c39f3fe43d0c5ab5ebe5c00b682845c6575d8a9`. Publikacja przez autoryzowany konektor GitHub. Potwierdzono origin/main, identyczność z lokalnie przetestowanym commitem 392162df1a5395c2df38c63d40c6e8e977d6df1d i pełne drzewo de2c18ad671b7226a991a2715786e0a95dd8ef7f; git diff --exit-code PASS.
- Verify Pre-Alpha GAME-05 dla 178ff7b9a97caf243af63b028dcc602c920ce3de: SUCCESS według aktualizacji użytkownika przed GAME-06. CI GAME-06 nie sprawdzano.

### Stan przed zmianą

- generateJobOffers filtrował LEAGUE_PACKS przez istniejącą licencję, próg reputacji i premię +6 za ten sam ZPN co obecny klub; potem losował maksymalnie trzy ligi i dowolny klub w każdej. Latem korzystał z nazw nextWorld, poza nim z katalogu pack.teams, bez sprawdzenia game.world i bez oceny danych klubu. expectation zależało tylko od poziomu ligi. Fit zależał od reputacji, poziomu i lokalności.
- Aktywna liga jest symulowana osobno w game.teams; game.world.competitions zawiera pozostałe rozgrywki. rolloverCareerWorld tworzy nextWorld z przesunięciami ligowymi, nowym OVR i wyzerowaną tabelą. managerChanges jest licznikiem rozgrywek, bez identyfikacji stanowiska/klubu.
- Zimowa ewaluacja zapisywała OBSERWACJA, akceptacja wymagała pendingSeason i odrzucała obserwacje. Rozliczenie sezonu tworzyło letnie OFERTA. Te warunki i rollover pozostają bez zmian. UI sugerował Wakat musi mieć przyczynę, OBSERWACJA / WAKAT i brak potwierdzonego wakatu bez źródła takich informacji.

### Zmiana ograniczona do rynku pracy

- Nowy lib/job-market wybiera wyłącznie istniejące zespoły: latem z nextWorld; w sezonie z game.world plus game.teams dla ligi obecnego klubu, która zastępuje ewentualny nieaktualny duplikat tej ligi w świecie. Brak fallbacku do samych nazw katalogu. Pack służy do istniejących filtrów i prawidłowego przejścia do sezonu; własny klub wykluczony.
- assessClubProject wylicza orientacyjną pozycję OVR z liczby silniejszych i środka grupy równych OVR. Rzeczywiste miejsce pochodzi z sortedTable. Po co najmniej 3 meczach różnica minimum 2 miejsc poniżej pozycji OVR daje projekt poprawy rezultatów. Dolne 30% według OVR daje trudną stabilizację; pozostałe kluby otrzymują projekt wykorzystania silnej kadry albo rozwoju środka stawki. To sportowe uzasadnienia zainteresowania, nie potwierdzone wakaty lub zwolnienia.
- Prosta ocena potrzeby: poniżej potencjału 80+min(20,2×różnica miejsc), słaba kadra 60+20×pozycjaOVR/liczba klubów, środek stawki 45, silna kadra 35. Ranking kandydatów: potrzeba+fit/2; remis rozstrzygają stabilne packId i clubId. Maksymalnie 3 unikalne kluby w całym rynku, również z tej samej ligi, jeśli ich projekty są najwyżej ocenione. Brak losowania; generator nie zużywa seed.
- Istniejące filtry licencji i reputacji, premia +6 za ten sam ZPN i dotychczasowy fit 1–99% zachowane. Dlaczego ty wskazuje spełnioną licencję, faktyczną reputację i premię ZPN tylko tam, gdzie rzeczywiście działa. Region wpisany w profil trenera nie jest traktowany jako dodatkowy bonus.
- Nowe opcjonalne pola: clubId, reason, situation, coachReason, sporting (OVR/rank, liczba klubów, miejsce jeśli klub ma mecze, mecze/punkty/bramki, rok sezonu i data). Zapisuje się stan z chwili zainteresowania. Przy zerowej liczbie meczów brak pozycji/wyników do oceny; lato nie rekonstruuje poprzedniego sezonu.
- Zimowy wywołujący przekazuje już zaktualizowane teams i worldUpdate.world oraz datę zakończonego meczu. Obserwacja bez możliwości przejścia; formalna oferta nadal akceptowana tylko latem. UI pokazuje klub/rozgrywki, projekt, Powód zainteresowania, Sytuację sportową ze stanem na dzień i sezon, Dlaczego ty, fit oraz istniejące sesje/status/ryzyko. Licznik managerChanges opisano jako zbiorczy, niewskazujący klubów.
- Stare oferty bez nowych pól pozostają zapisane i akceptowalne zgodnie z dotychczasowymi zasadami. UI uczciwie informuje o braku zapisanego powodu, sytuacji i uzasadnienia; migracja nie wymyśla historycznych danych ani nie regeneruje tych pól.

### Weryfikacja

- npm test PASS: typecheck, build Vite i 146/146 testów; git diff --check PASS. Dziewięć nowych testów obejmuje rzeczywiste pochodzenie kandydatów i brak katalogowego fallbacku, zgodność opisów ze stanem, zmianę priorytetu po zmianie rezultatów, game.teams zamiast starego duplikatu, niezależność od managerChanges, filtry/fit/licencję/ZPN, stabilny tie-break i brak mutacji, zimową produkcyjną ewaluację po meczu i blokadę akceptacji, nextWorld i skuteczną letnią akceptację, zapis/odczyt starych oraz nowych ofert i renderowanie Jobs bez fikcyjnego wakatu. Zaktualizowano wcześniejszy test wymagający starego napisu OBSERWACJA / WAKAT.
- Końcowy npm run audit:release PASS: 1288 meczów, 53 sezony, 1290 kontroli zapisu, 4377 momentów, 1710 decyzji, 3769060 meczów świata, 13 awansów, 1 spadek, 13 zmian klubu, 53 rozliczenia sezonów. Długa kariera 32 sezony i dobrowolna emerytura po 65 r.ż.; zapis pod koniec sezonu, ekran końca i następny sezon PASS. Raport docs/reports/playable-career-audit.json odświeżony końcowym przebiegiem.
- Lokalny Node 24.19.0; repo deklaruje >=24.21.0 <25. Istniejące ostrzeżenia bundla/renderera/HMR nie przerwały weryfikacji. Nie wykonywano testu produkcji ani ręcznego deploya.

### Trzy karty z odrębnej symulowanej kariery testowej

- Harpagan Gliwice, Klasa C / Zabrze, OBSERWACJA na 2026-11-21: 15. miejsce, 14 pkt/15 meczów, bramki 19:30, OVR37 i orientacyjna 4. kadra ligi 16 klubów → wyniki poniżej potencjału, projekt poprawy rezultatów → Grassroots C, reputacja8/100 spełnia warunki, fit58%, brak bonusu tego samego ZPN.
- LKS Bojanów, Klasa C / Racibórz I, stan początkowy 2026-07-13: brak rozegranych meczów, OVR30 i 8. kadra ligi 8 klubów → trudny projekt stabilizacji → Grassroots C, reputacja8/100, fit58%, bez bonusu ZPN. Nie przypisano nieistniejących wyników.
- LKS Bojanów, Klasa C / Racibórz I, FORMALNA OFERTA po rolloverze, 2027-07-01: sezon2027/28, tabela wyzerowana, OVR29 i 8. kadra ligi 8 klubów → stabilizacja w nowym sezonie, bez twierdzeń o poprzednich wynikach → Grassroots C, reputacja10/100, fit60%, bez bonusu ZPN. Przykłady pochodzą z faktycznych danych wygenerowanego świata, nie realnych wyników tych klubów.

- Pliki: app/game-actions.ts, app/game-data.ts, app/game-engine.ts, app/game-screens.tsx, lib/job-market.mjs, lib/job-market.d.mts, tests/job-market.test.mjs, tests/build-22.test.mjs, docs/reports/playable-career-audit.json; następnie docs/WORK_STATE.md w osobnym commicie [skip ci]. Bez nowych zależności.
- GAME-05, system licencji, pensje, negocjacje, transfery, silnik meczu, pressing, XI, cele zarządu i rolloverCareerWorld bez zmian. Bez systemu stanowisk trenerów i bez zmian CI/Netlify/SSO.
- BROKEN/BLOCKED: brak. NEXT: brak autoryzowanych kolejnych prac.
- STOP po GAME-06.


## GAME-07 — jedna sprawa konkretnego zawodnika: DONE (2026-10-08)

- Commit kodu/testów na main: `944f5bf83155e10b974072d86c7f91ec02681a30`. Publikacja przez autoryzowany konektor GitHub. Zdalne drzewo `5300b6cb5e5868cf5cedb0ba20219bd099d5098e` odpowiada lokalnie przetestowanemu commitowi `292f8ff36dee7adff2602a6e791a1a39a8e1d830`; git diff --exit-code PASS. Commity różnią się metadanymi, nie zawartością.
- Verify Pre-Alpha GAME-06 dla `1c39f3fe43d0c5ab5ebe5c00b682845c6575d8a9`: SUCCESS według aktualizacji użytkownika przed PRODUCT-03. CI GAME-07 nie sprawdzano.

### Stan przed zmianą

- Player zawiera fatigue 0–100, formę, morale, relację, injuryWeeks, absenceRounds i absenceReason. playerAvailable wyklucza urazy i absencje; selectLineupForPlan automatycznie dobiera zastępstwo. Koniec meczu odlicza absencję i stosuje istniejące ryzyko urazu u zawodników z XI.
- generateCareerIssues tworzy do dwóch wydarzeń w budżecie trzech nierozwiązanych spraw. Ogólny resolveDecision stosuje relation do trzech losowych graczy i efekty zespołowe do kadry. Ta ścieżka pozostaje dla dotychczasowych wydarzeń.
- Save serializuje GameState, readCareer korzysta z migrateGame; nowy sezon regeneruje kadrę i czyści większość inboxu. Brak indywidualnej sprawy wskazującej zawodnika i rozliczającej jego najbliższy występ.

### Zmiana ograniczona do jednej sprawy przeciążenia

- Nowy moduł player-overload tworzy jeden typ zdarzenia, tylko dla rzeczywistego dostępnego gracza z fatigue >=40 (kondycja <=60%). Preferuje XI, następnie wyższe fatigue, Base OVR i stabilne playerId. Pokazuje nazwisko, pozycję i rzeczywisty stan po meczu; ocena ryzyka nie jest diagnozą medyczną.
- Dokładnie dwa wybory: odpoczynek daje wyłącznie wskazanemu graczowi fatigue -8, relation +2, absenceRounds=1 i powód Regeneracja po przeciążeniu; dyspozycja daje mu tylko relation -2, nie gwarantuje XI ani urazu. Decyzja nie używa losowej grupy relacji, nie zmienia innych zawodników i nie zużywa seed. Automatyczna selekcja korzysta z dotychczasowego playerAvailable i selectLineupForPlan bez ich zmian.
- Nowe opcjonalne targetPlayerId/playerCase w CareerIssue i playerOverload w GameState przechowują klub, osobę, wybór i termin rozliczenia według liczby meczów kariery. Po następnym meczu jedna wiadomość podaje faktyczne uczestnictwo w XI, kondycję, uraz i dostępność po odliczeniu absencji. Potwierdzenie wiadomości nie nakłada ponownie skutków.
- Generowanie odbywa się na aktualnej kadrze po meczu, po istniejących aktualizacjach zawodników. Zachowane maksimum dwóch nowych spraw oraz dostępny budżet trzech nierozwiązanych. Jedno miejsce może być zarezerwowane dla indywidualnej sprawy; sama rezerwacja nie generuje zdarzenia poniżej progu 40. Nie ma duplikatu przy otwartej sprawie lub oczekującym follow-upie; cooldown wynosi cztery mecze i korzysta z istniejącej pamięci narracji.
- Przy pełnym inboxie wynik najbliższego meczu zostaje zapisany i czeka na miejsce; późniejsza wiadomość nie zastępuje go stanem z następnego spotkania. Nowy indywidualny wpis nie przekracza limitu. Nie zmieniono dotychczasowych obietnic planu.
- Stan przetrwa save/readCareer/KONTYNUUJ. Stary zapis nie wymaga nowych pól. Migracja usuwa odniesienia do innego klubu lub brakującej osoby. Start nowego sezonu i zmiana klubu czyszczą indywidualną sprawę; absencje resetuje istniejąca logika kadry. Zgłoszenie, które przed decyzją utraci aktualność przez inną niedostępność gracza, można zamknąć bez dodatkowych skutków.

### Weryfikacja

- npm test PASS: typecheck, build Vite, 157/157 regresji; git diff --check PASS. Jedenaście nowych testów obejmuje deterministyczny wybór i wykluczenia, dwa warianty decyzji, izolację skutków, zastępstwo i powód w GAME-04, jedną absencję, prawdziwy follow-up także bez występu i z urazem, limit inboxu/duplikaty, odroczony wynik przy pełnym inboxie, save/load, stary save, zmianę klubu i nowy sezon oraz nieaktualne zgłoszenie. Test rzeczywistego App klika KONTYNUUJ z zapisem decyzji i sprawdza sprawę, osobę i powód absencji w renderowanym ekranie XI.
- npm run audit:release PASS: 1372 mecze, 53 sezony, 1374 kontrole zapisów, 4703 momenty, 1864 decyzje, 3765864 mecze świata, 13 awansów, 2 spadki, 16 zmian klubu i 53 rozliczenia sezonów. Długa kariera 32 sezony, dobrowolna emerytura po 65 r.ż., wszystkie szczeble i odczyt zapisów pod koniec sezonu PASS. Raport docs/reports/playable-career-audit.json odświeżony.
- Lokalny Node 24.19.0; repo deklaruje >=24.21.0 <25. Istniejące ostrzeżenia testowego renderera/HMR/bundla nie przerwały testów. Nie wykonano testu produkcji ani ręcznego deploya.

### Pełny przykład obu decyzji z identycznego kontrolowanego stanu testowego

- Piast Bolków, Jakub Bednarek (BR, playerId p-0-12-2), fatigue55/kondycja45%, relacja55, zdrowy i dostępny. W teście ustawiono wysokie OVR bramkarza, aby jednoznacznie pokazać zastępstwo; to kontrolowany świat gry, nie dane realnego zawodnika.
- A: odpoczynek → fatigue47/kondycja53%, relacja57, absencja1 → automat wybiera Wiktora Gajdę, również przy przygotowaniu meczu → Bednarek nie gra; po treningu i meczu fatigue27/kondycja73%, uraz0, absencja0. Follow-up: Jakub Bednarek (BR): Opuścił spotkanie zgodnie z decyzją o odpoczynku. Po tym meczu kondycja 73%, zmęczenie 27/100. Jest ponownie dostępny.
- B z tego samego stanu: dyspozycja → fatigue55/kondycja45%, relacja53, absencja0 → automat wybiera Bednarka; po treningu i meczu fatigue47/kondycja53%, uraz0. Follow-up: Jakub Bednarek (BR): Pozostał do dyspozycji i znalazł się w XI. Po tym meczu kondycja 53%, zmęczenie 47/100. Jest ponownie dostępny. Brak urazu dotyczy tej próby, nie jest gwarancją decyzji B.

- Pliki kodu/testów: app/game-actions.ts, app/game-data.ts, lib/career-events.d.mts, lib/player-overload.mjs, lib/player-overload.d.mts, tests/player-overload.test.mjs, docs/reports/playable-career-audit.json. Następnie docs/WORK_STATE.md w osobnym commicie [skip ci]. Bez nowych zależności.
- GAME-08/09 niewykonane. Bez ręcznej XI, pełnego systemu rozmów, zmian silnika meczu, pressingu, mentalności, rynku pracy, celów zarządu, licencji, treningu, CI, Netlify i SSO.
- BROKEN/BLOCKED: brak. NEXT: brak autoryzowanych kolejnych prac.
- STOP po GAME-07.


## GAME-08A — realistyczna kondycja, wydajność i regeneracja: DONE (2026-10-08)

- Commit kodu/testów na main: `1ecf03bf19bb012449b55214a7e46a094bfc7c26`. Publikacja przez autoryzowany konektor GitHub. Drzewo `36f9ff8097912b72666b6b6c212b25d27294e3eb` odpowiada lokalnie przetestowanemu commitowi `82c658a357ede98341eac7905617edd04b1bab82`; git diff --exit-code PASS. Różne metadane commita, identyczna zawartość.
- Verify Pre-Alpha GAME-07 dla `944f5bf83155e10b974072d86c7f91ec02681a30`: SUCCESS według aktualizacji użytkownika przed GAME-08A. CI GAME-08A nie sprawdzano.

### Stan przed zmianą i ustalona łagodność

- conditionFromFatigue już przeliczał fatigue na kondycję 0–100. liveBreakdown miał liniową karę dopiero od fatigue15: przy kondycji60% neutralny zawodnik tracił około 4,5% OVR. Całkowita kara miała ograniczenie -20%; forma, morale i relacja mogły dodatkowo zamaskować zmęczenie. effectiveOVR doliczał dotychczasową karę pozycyjną.
- injuryRiskFromFatigue utrzymywał prawie stałe ryzyko do fatigue55, czyli kondycji45%. Wzrost istotnego ryzyka zaczynał się zbyt późno. Intensywność treningu już miała dodatkowy wpływ.
- Starter miał stałe bazowe +8 fatigue na każdym tierze, plus koszt polityki, czasu stosowania pressingu, tempa i decyzji z ławki. Rezerwowi odzyskiwali dwa punkty. Trening miał różne obciążenia zależne od akcentów/intensywności; naturalRecoveryForGap różnicował regenerację na 2/1,8/1,55 punktu za dzień odpoczynku.
- selectLineupForPlan korzystał z liveOVR oraz własnych dotychczasowych preferencji planów. playerAvailable zależał wyłącznie od urazów i absencji. GAME-07 uruchamiał się od fatigue40/kondycji60%, a wiadomości eksponowały oba parametry.

### Kalibracja ograniczona do kondycji

- Wewnętrzne fatigue i save bez zmian schematu. Dla gracza: jedna kondycja i wspólna conditionStatus: 90–100 Świeży, 80–89 Gotowy, 70–79 Obciążony, 60–69 Zmęczony, 50–59 Bardzo zmęczony, poniżej50 Skrajnie zmęczony. Używane ekrany XI/poza XI pokazują status i ostrzeżenie o obniżeniu możliwości oraz ryzyku przy kondycji poniżej60%; starszy ekran kadry korzysta z tej samej funkcji. Bez nowych wzorów i procentowego ryzyka w UI.
- Kara kondycji w liveBreakdown jest ciągłą krzywą z rosnącym kosztem w gorszych zakresach. Formę, morale, relację i kary pozycyjne zachowano. Ograniczenie całkowitego modyfikatora wynosi -60% do +14%. selectLineupForPlan i playerAvailable nie zmienione: świeższy zmiennik może wygrać przez istniejącą ocenę, lecz samotny zawodnik z kondycją55% nadal może zostać wybrany.
- Ryzyko urazu rośnie płynnie od lekkiego obciążenia; normalna intensywność daje bardzo niskie ryzyko przy świeżości, lekko podwyższone przy80%, wyraźnie podwyższone przy60% i wysokie przy50%. Wysoka intensywność zwiększa ryzyko, niska ogranicza; brak gwarantowanego urazu, zachowany rozsądny limit. Dotychczasowy moment losowania i czas urazu bez zmian.
- playingEnvironment wyznacza środowisko z istniejącego tier: 1–3 profesjonalne, 4–6 półprofesjonalne, 7–10 amatorskie. Bazowy koszt meczu: 10/12/14 punktów kondycji. Próg komunikatu komfortowej gotowości: 82/78/74%; jest ostrzeżeniem, nie zakazem selekcji. Naturalna regeneracja: 2,5/2/1,6 punktu za dzień odpoczynku; dotychczasowy limit dni i sposób naliczania zachowane.
- Koszty GAME-02 nadal są dodatkami do bazowego obciążenia. Cały mecz wysokiego pressingu kosztuje dodatkowo4 punkty, bardzo wysokiego8. Tempo, polityka i decyzje z ławki nadal dokładają swój istniejący koszt. Regeneracja jako akcent treningu i pozostałe efekty mikrocyklu nie zmienione; podgląd treningu opisuje wpływ jako zmianę kondycji.
- GAME-07 korzysta z widocznej kondycji <=59%, czyli kategorii Bardzo zmęczony lub Skrajnie zmęczony. Przy60/65/75% sprawa nie powstaje. Nowe wiadomości pokazują np. Kondycja58% • bardzo zmęczony, a odpoczynek opisany jest jako +8 p.p. kondycji. Indywidualne skutki, absencja, follow-up i limity spraw pozostają. Rezerwacja miejsca w inboxie uwzględnia nowy próg i bazowy koszt środowiska.

### Weryfikacja

- npm test PASS: typecheck, produkcyjny build Vite, 163/163 regresji; git diff --check PASS. Sześć nowych testów obejmuje statusy/granice, nieliniowe OVR, monotoniczne ryzyko/intensywność/limit, środowiska i pressing, wybór świeższego gracza bez zakazu występu, nowy próg GAME-07, osiem rzeczywistych tygodni każdego tier2/5/9 z save/load oraz faktyczne końcowe naliczenie różnych kosztów identycznego meczu. Istniejący test używanego ekranu sprawdza statusy i ostrzeżenie również poza XI.
- Zaktualizowano stare oczekiwania testów odpowiadające zmienionemu balansowi. Historyczny snapshot selektora sprzed GAME-04 nadal sprawdzany dla świeżej kadry we wszystkich planach; zmęczeni mają celowo nowe oceny. Testy rotacji i zmian nazwisk używają stanu, w którym plan nadal może zmienić skład po mocniejszej karze kondycji.
- Osiem tygodni produkcyjnych akcji: średnia kondycja kadry przed/po meczu dla tier2 wynosi96/92%; tier5 przed90–97%, po85–93%; tier9 przed87–98%, po79–92%. W każdym tygodniu część kadry ma mniej niż100%, część więcej niż50%; średnia po meczu jest między55 a98%. Save/readCareer zachowuje wszystkie serializowane dane zawodników, bez przeskalowania fatigue.
- npm run audit:release PASS: 1264 mecze, 53 sezony, 1266 kontroli zapisów, 4274 momenty, 1826 decyzji, 3766661 meczów świata, 7 awansów, 4 spadki, 12 zmian klubu i 53 rozliczenia sezonów. Długa kariera32 sezony, dobrowolna emerytura po65 r.ż., wszystkie szczeble oraz odczyt końca sezonu i następny sezon PASS. Raport docs/reports/playable-career-audit.json odświeżony.
- Lokalny Node24.19.0; repo wymaga >=24.21.0 <25. Istniejące ostrzeżenia bundla/HMR/testowego renderera nie przerwały testów. Bez testu produkcji i ręcznego deploya.

### Przykłady kontrolowane

- Base OVR60, naturalna pozycja N, forma/morale/relacja50, zdrowy i dostępny, normalna intensywność: kondycja95% → Świeży → efektywnyOVR60 → bardzo niskie ryzyko; 80% → Gotowy →59 → lekko podwyższone; 70% → Obciążony →56 → podwyższone; 60% → Zmęczony →52 → wyraźnie podwyższone; 50% → Bardzo zmęczony →45 → wysokie. To przykłady modelu gry, nie medyczne prognozy.
- Standardowy mecz bez dodatkowych kosztów pressingu, tempa i decyzji; kondycja początkowa90%, odstęp7 dni, domyślny mikrocykl środowiska: tier2 (6 sesji) 90 →80 →91%; tier5 (4 sesje) 90 →78 →87%; tier9 (2 sesje) 90 →76 →84%. Ostatnia wartość uwzględnia naturalną regenerację i koszt treningu, bez bonusów innych wydarzeń.

- Pliki: app/game-actions.ts, app/game-data.ts, app/game-screens.tsx, app/gameplay-screens.tsx, lib/game-rules.mjs, lib/game-rules.d.mts, lib/player-overload.mjs, lib/player-overload.d.mts, tests/condition-balance.test.mjs, tests/game-rules.test.mjs, tests/lineup-presentation.test.mjs, tests/player-overload.test.mjs, docs/reports/playable-career-audit.json; następnie osobny checkpoint docs/WORK_STATE.md [skip ci]. Bez nowych zależności lub atrybutów zawodnika.
- GAME-08B niewykonane. Bez zmian celów rozwojowych, mentalności meczowej, transferów, rynku pracy, licencji, celów zarządu, CI, Netlify i SSO. Bez przebudowy silnika meczu.
- BROKEN/BLOCKED: brak. NEXT: brak autoryzowanych kolejnych prac.
- STOP po GAME-08A.
