# Changelog

Wydania webowe stosują SemVer. Poprzednie numery Build 1.x–2.5 są historycznymi iteracjami, zachowanymi w Git.

## [0.1.1-publisher.2] — 2026-10-12 — RC readiness candidate / NO-GO

- Independent fictional catalogue/neutral displayed labels, source database and rules preserved.
- Isolated publisher saves/drafts and foreign-catalogue import guard.
- Regional entry/honest fictional copy corrected; geometric favicon; historical public assets excluded; dependency/CSS notices.
- Six CSS viewports,actual agent path6:04,save/continue,telemetry verified;213testsPASS.
- Temporary QA harness excluded from final artifact.
- RC1 withheld:Free/SSO requires owner hosting decision; no purchase,main merge or PUBLISHER-02.
- Final checkpoint recovered via GitHub after local environment disconnection; new local QA image/log files could not be recovered for publication.

## [0.1.1-publisher.1] — 2026-10-11 — Publisher Preview / Pre-Alpha

- Oddzielna gałąź prezentacyjna; produkcyjny main pozostaje na obecnym wydaniu.
- Publisher Info, kierunek współpracy, krótka ścieżka pierwszej sesji oraz numer wersji.
- Poprawione informacje o celu przed rozpoczęciem rozgrywek, bez zmiany mechanik.
- Dobrowolna lokalna telemetria z eksportem; brak zewnętrznych trackerów i kont.
- Materiały źródłowe do pitchu, audyt IP i plan screenshotów w docs/publisher/.
- Korekta nieaktualnego README: produkcja jest dostępna online, repo publiczne, SSO chroni podglądy.
- Stan weryfikacji i ograniczenia dostępu: docs/publisher/TEST_REPORT.md oraz DEPLOYMENT.md.

## [0.1.0] — 2026-10-06 — Pre-Alpha

### Added
- Statyczne wejście React/Vite i standardowe polecenia dev/build/preview.
- Menu NOWA KARIERA / KONTYNUUJ / USTAWIENIA, sekcja O PROJEKCIE i wspólny numer wersji.
- Ostrzeżenie przed zastąpieniem kariery; ekran odzyskiwania po błędzie renderowania.
- Netlify configuration, weryfikacja GitHub Actions, README, mapa danych i raport testów.
- Testy zapisu, importu, menu startowego i pełnego kursu licencji.

### Changed
- Standardowy build działa bez adaptera Cloudflare; silnik i ekrany gry pozostały wspólne.
- Akcja rozpoczęcia kursu jest współdzielona przez ekran kariery i testy.
- Wyniki nowych audytów mają znacznik czasu i oddzielny katalog od historycznych raportów.

### Fixed
- Polecenia webowe nie zależą od linuksowych skryptów starego hostingu.
- Test wdrożenia sprawdza statyczny artefakt i obecność jego zasobów.
- Nie można zapisać się na kurs po zakończeniu kariery.
- Odczyt plików ratunkowych `.txt` jest dostępny z ustawień.

### Known Issues
- GitHub oraz pierwszy deployment Netlify wymagają dokończenia autoryzacji; build nie jest jeszcze dostępny online w Netlify.
- Nie przeprowadzono przeglądarkowych testów tej wersji na telefonach i desktopie: przeglądarka testowa blokuje lokalny adres.
- Awanse/spadki są uproszczone; brak oficjalnych baraży, Pucharu Polski i Europy.
- Obsada lig 2026/27 wymaga weryfikacji. Oferty pracy są finalizowane latem.
- Kursy używają tygodni meczowych, a nie dokładnego kalendarza kursów PZPN.
- Jeden aktywny zapis na przeglądarkę; domeny nie współdzielą zapisu.
- Główny bundle JS przekracza 500 kB przed kompresją. Optymalizacja jest zadaniem po pomiarach urządzeń testerów.
