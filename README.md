# TEN TRENER — Pre-Alpha

**v0.1.0** · Niezależna gra menedżersko-symulacyjna o karierze trenera w realiach polskiej piłki. Rozwijasz człowieka: jego kompetencje, relacje i reputację. Kierujesz drużyną przez plan gry i decyzje, bez ręcznego zarządzania każdym zawodnikiem.

To wydanie porządkuje dotychczasowy Build 2.5. Nowa numeracja dotyczy wydań webowych; nie oznacza rozpoczęcia projektu od zera. Kod, dane, historia Git i zgodność zapisów zostały zachowane.

## Status

- Działający lokalnie prototyp statyczny React + TypeScript + Vite, bez wymaganego backendu i kont graczy.
- Testy automatyczne i wielosezonowe: [raport](docs/reports/pre-alpha-0.1.0.md).
- Projekt Netlify `ten-trener` utworzony, dostęp ograniczony do zalogowanego zespołu.
- **Repozytorium GitHub, podłączenie Git i pierwszy deployment czekają na autoryzację. Nie ma jeszcze potwierdzonego działającego linku Netlify.**
- Projekt nie jest premierą publiczną ani kompletną symulacją przepisów PZPN.

## Uruchomienie

Wymagany Node.js 22.16 lub nowszy (wersja sprawdzona w bieżącym środowisku: 24.19). Wersja dla Netlify/CI jest w `.nvmrc`.

```sh
npm install
npm run dev
```

Otwórz adres wypisany przez Vite, domyślnie `http://127.0.0.1:5173`.

```sh
npm run build
npm run preview
```

Build produkcyjny: `dist/`. Podgląd: `http://127.0.0.1:4173`. Nie otwieraj `dist/index.html` przez `file://`; użyj serwera HTTP. Standardowe polecenia nie wymagają Bash, GNU timeout ani Cloudflare.

## Weryfikacja

```sh
npm test                 # build, TypeScript i regresje
npm run audit:release    # 20 ścieżek ligowych + grupa z pauzami + kariera 32-sezonowa
```

Audyt wywołuje te same akcje co gra i zapisuje wynik w `docs/reports/playable-career-audit.json`. Automatyczne scenariusze silnika nie zastępują testów interfejsu na telefonach.

## Struktura i jedno źródło prawdy

| Katalog | Rola |
| --- | --- |
| `src/` | Wejście statycznej aplikacji webowej |
| `app/` | Ekrany, stan aplikacji, akcje kariery, typy, katalog lig |
| `components/` | Wspólne komponenty UI |
| `lib/` | Reguły, zdarzenia, narracje, świat, zapis |
| `public/` | Publiczne zasoby i historyczne materiały testowe |
| `tests/` | Regresje i scenariusze funkcjonalne |
| `scripts/` | Audyty oraz import danych |
| `docs/` | Architektura, wydania, wdrożenie, raporty |

**Kanoniczny kod:** ten projekt i jego gałąź `main`. Moduły `app/` i `lib/` są wspólne dla wejścia webowego i zachowanego adaptera starszego hostingu. Nie ma osobnej implementacji gry dla Netlify. Nie kopiuj silnika do nowych prototypów. `vite.web.config.ts` obsługuje wydania Pre-Alpha; `vite.config.ts`, `worker/`, `build/` i `build:sites` pozostają jedynie adapterem historycznym. `db/` i przykłady D1 nie uczestniczą w rozgrywce.

Pełna mapa danych i ograniczeń: [audyt](docs/architecture-audit.md).

## Zapis gry

Autosave używa `localStorage` pod niezmienionym kluczem `ten-trener-save-v1`; większy stan jest kompresowany. Ustawienia pozwalają eksportować/importować plik. Zachowany jest odczyt wcześniejszego JSON.

**Zapis nie przenosi się automatycznie między domenami.** Przed przejściem ze starego adresu do Netlify pobierz kopię w starej grze, a następnie wczytaj ją w ustawieniach nowej. Tryb prywatny i czyszczenie danych przeglądarki mogą usunąć lokalny zapis.

## Wydania i wdrożenia

Wersję zmieniaj przez `npm version patch --no-git-tag-version` (poprawki) lub `minor` (nowe systemy), uzupełniając [CHANGELOG](CHANGELOG.md). Numer w UI pochodzi bezpośrednio z `package.json`.

GitHub Actions sprawdza build i regresje. `netlify.toml` określa identyczną bramkę dla produkcji i deploy previews. Docelowo `main` → produkcja, pull request → podgląd. Konfiguracja połączenia i dostępu: [deployment](docs/deployment.md).

Nie commituj tokenów, haseł, `.env`, stanu `.netlify`, zapisów testerów ani danych osobowych. Zgłoszenia i zapisy testerzy przekazują świadomie; aplikacja nie wysyła ich automatycznie.

## Zakres

Dostępne: kreator i osiem pytań profilu, cztery licencje, 16 województw, 407 grup i 5517 wpisów drużyn w katalogu, wielosezonowa kariera, trening, mecze z decyzjami, wydarzenia i ich następstwa, rozwój, rynek letni, uproszczone awanse/spadki i świat AI.

W produkcji: pełne oficjalne baraże, Puchar Polski, Europa, weryfikacja obsady lig i długoterminowego balansu. Liczba wpisów nie jest potwierdzeniem aktualności ani unikalności wszystkich rzeczywistych klubów. Gracze piłkarscy i część postaci są generowani.

Repozytorium zawiera kod projektu i zależności na ich własnych licencjach. Nie dodano licencji open-source ani zgody na redystrybucję nazwy/treści gry.
