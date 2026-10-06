# Changelog

Wydania webowe stosują SemVer. Poprzednie numery Build 1.x–2.5 są historycznymi iteracjami, zachowanymi w Git.

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
