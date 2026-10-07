# TEN TRENER — STATUS PROFESJONALIZACJI

> Aktualizacja CI z 2026-10-07: źródła i pełna historia są już w prywatnym `pszulik91-tech/TEN-TRENER`. Node 24.21.0 LTS zastępuje konfigurację 22.16.0 opisaną w historycznej części raportu. [Verify Pre-Alpha #4](https://github.com/pszulik91-tech/TEN-TRENER/actions/runs/37581257764) jest zielony: czysta instalacja, build, 106 regresji i test HTTP. Deployment Netlify nadal czeka na potwierdzenie autoryzacji GitHub. Aktualny stan: [wdrożenie](../deployment.md).

Data: 2026-10-06. Wersja **Pre-Alpha v0.1.0**, oparta na Build 2.5. **Etap nie jest jeszcze zakończony: brak autoryzowanego GitHub i pierwszego deploymentu Netlify.**

## Build

Działa `npm install`, `npm run dev`, `npm run build` oraz `npm run preview`. Instalacja na istniejącym checkout zakończyła się poprawnie; nie wykonano niezależnego `npm ci` na pustej maszynie. Node w środowisku testowym: 24.19.0. Skonfigurowana wersja CI/Netlify: 22.16.0 (wymaga weryfikacji w pierwszym CI).

React/Vite/TypeScript pozostają technologią gry. Dodano statyczne wejście i konfigurację hostingu bez przepisywania silnika. Zachowano historię wcześniejszych 17 wersji i klucz zapisu.

## GitHub

Konto: `pszulik91-tech`. Połączenie zwraca pustą listę dostępnych repozytoriów i nie udostępnia tworzenia repozytoriów. Przeglądarka GitHub wymaga logowania. Repozytorium docelowe TEN-TRENER nie zostało jeszcze utworzone ani zapełnione.

## Netlify

Utworzono projekt `ten-trener`, ID `167eaa74-4806-4eb2-8747-996de31ea60d`, z wymaganym logowaniem do zespołu dla wszystkich wdrożeń. Panel: https://app.netlify.com/projects/ten-trener

Przydzielono subdomenę `ten-trener.netlify.app`, ale **nie ma jeszcze wdrożonej gry ani potwierdzonego linku testowego**. CLI wskazuje `Not logged in`. Konfiguracja produkcji i deploy previews jest przygotowana; rzeczywiste połączenie Git i podgląd PR pozostają do wykonania po autoryzacji.

## Co działa

- Kreator trenera, 16 województw, profil, wybór dostępnej licencji i klubu.
- Plan drużyny, wielosesyjny mikrocykl, regeneracja, mecze i interwencje trenera.
- Wydarzenia, konsekwencje, nieobecności i pamięć szatni.
- Rozwój, reputacja, kursy, letnia zmiana klubu i wielosezonowa kariera.
- Świat AI, tabele, kalendarz i uproszczone ruchy ligowe.
- Lokalny zapis, kompresja, odczyt JSON i przenoszenie kariery plikiem.
- Menu startowe, ustawienia, O PROJEKCIE i spójny numer wersji.

## Co poprawiono

- Standardowy build nie wymaga starej infrastruktury Sites/Cloudflare ani skryptów Bash.
- README zastąpiło opis startera; dodano CHANGELOG, audyt, procedurę wdrożenia i weryfikację CI.
- Nowa kariera ostrzega przed zastąpieniem zapisu.
- Ekran błędu renderowania umożliwia restart i pobranie zapisu ratunkowego.
- Początek kursu korzysta z jednej akcji współdzielonej przez ekran i test; zakończona kariera nie może uruchomić kursu.
- Weryfikacja buildu obejmuje rzeczywisty statyczny artefakt Netlify i jego zasoby.

## Testy wykonane na tym wydaniu

**106/106 automatycznych testów zaliczonych**, obejmujących reguły, onboarding, UI renderowane po stronie testu, stan gry i zapis. Dodatkowo **2 testy HTTP**: serwer dev (strona + 2 zasoby) i preview (strona + 3 zasoby) odpowiedziały 200.

**22 scenariusze kariery**: dwa warianty na każdym z 10 poziomów rozgrywek, grupa o nieparzystej liczbie zespołów oraz jedna kariera 32-sezonowa do wieku 67 lat. Łącznie:

| Pomiar | Wynik |
| --- | ---: |
| Pełne sezony | 53 |
| Mecze drużyny gracza | 1480 |
| Przypadki serializacji/odczytu stanu w audycie | 1480 |
| Rozwiązane decyzje meczowe | 4992 |
| Decyzje poza meczem | 1934 |
| Symulowane mecze AI | 3764649 |
| Rozliczenia sezonu | 52 |
| Awanse w naturalnym przebiegu | 14 |
| Spadki w naturalnym przebiegu | 0 |
| Zmiany klubu po utracie pracy | 4 |
| Ukończenia kursów w wielosezonowym audycie | 2 |

Dodatkowy test kontrolny w zestawie 106 ustawia końcową tabelę ze spadającym klubem: rozliczenie spadku z Ekstraklasy → pozostanie trenera → I liga → nowy terminarz → zapis/odczyt. To **test warunku granicznego**, nie dodatkowy sezon rozegrany naturalnie. Osobny test przechodzi cały kurs UEFA B przez 20 meczów; sprawdza koszt i zapis nowej licencji.

Nowe testy obejmują również wyścig asynchronicznych zapisów, błędny import bez utraty bieżącej kariery, menu bez zapisu i wybór właściwego ekranu po wznowieniu. Audyt 1480 zapisów sprawdza serializację i migrację; osobne testy sprawdzają kodek i interfejs storage. Nie są to 1480 pomiarów rzeczywistego localStorage w przeglądarce.

### Próbka porównawcza lig

| Liga | Warianty | Mecze sezonów | Końcowa kondycja całej kadry | Wypalenie trenera |
| --- | ---: | ---: | ---: | ---: |
| Klasa C | 2 | 28 | 93–98% | 0–0% |
| Klasa B | 2 | 44 | 94–97% | 0–0% |
| Klasa A | 2 | 52 | 93–95% | 0–6% |
| Klasa okręgowa | 2 | 60 | 89–94% | 5–8% |
| V liga | 2 | 60 | 77–94% | 4–7% |
| IV liga | 2 | 68 | 78–91% | 0–30% |
| III liga | 2 | 68 | 58–80% | 1–22% |
| II liga | 2 | 68 | 68–86% | 0–51% |
| I liga | 2 | 68 | 67–81% | 0–14% |
| Ekstraklasa | 2 | 68 | 70–86% | 8–41% |

Różne warianty używają różnych decyzji i planów. To porównanie konkretnych przebiegów, nie dowód przewagi jednego stylu. W naturalnej próbce wystąpiło 14 awansów i zero spadków — balans trudności wymaga oceny testerów. Najwyższy poziom w karierze zaczętej w B klasie to IV liga; **nie potwierdzono dojścia z B klasy do Ekstraklasy ani czasu potrzebnego na tę drogę**.

Surowe wyniki i czas wykonania: `playable-career-audit.json` w tym katalogu. Stare raporty 2.3/2.4 nie są przedstawiane jako nowe testy.

### Czego nie zweryfikowano

Przeglądarka testowa zwróciła `ERR_BLOCKED_BY_CLIENT` dla lokalnego adresu. Nie przeprowadzono rzeczywistych sesji klikania nowej wersji, kontroli konsoli w trakcie takich sesji ani wizualnego testu na Android/iOS/desktop. Sprawdzono serwowanie HTTP i renderowanie komponentów w testach. Nie sprawdzono jeszcze GitHub Actions, Netlify build, autodeploy ani ochrony wdrożonej strony.

## Krytyczne błędy

W wykonanych testach nie pozostały błędy krytyczne. Nie oznacza to potwierdzenia ich braku we wszystkich urządzeniach i nieprzetestowanym wdrożeniu. **Blokery wydania**: autoryzacja GitHub/Netlify i brak testu przeglądarkowego nowego buildu.

## Known Issues

- Uproszczone awanse/spadki, brak oficjalnych baraży, Pucharu Polski i Europy.
- Dane startowe lig wymagają weryfikacji; 5517 wpisów nie oznacza 5517 zweryfikowanych unikalnych klubów.
- Zmiana pracy latem; kursy postępują według kolejek.
- Lokalny zapis jest związany z domeną i przeglądarką. Migracja hostingu wymaga pliku.
- Pakiet JS jest większy niż 500 kB bez kompresji; potrzebny pomiar na telefonach.
- Humor, tempo i monotonia wymagają testów z ludźmi, mimo kontroli powtórzeń w generatorze.

## Stan projektu

Ocena robocza, nie pomiar automatyczny: **75% do zamkniętych testów**, **55% do prezentacji wydawcy**, **40% do publikacji demo**. Warunkiem wysyłki jest pierwszy chroniony build online oraz przejście testów ręcznych na telefonie i komputerze. Nie deklarujemy daty premiery przed usunięciem tych blokad.

## Następny rekomendowany etap

1. Dokończyć bezpieczne logowanie i utworzyć prywatne TEN-TRENER z aktualnym kodem oraz historią.
2. Połączyć istniejący projekt Netlify z GitHub i potwierdzić pierwszy build, autodeploy oraz podgląd PR.
3. Przejść ręcznie nową karierę, mecz i zapis/wczytanie na telefonie oraz desktopie; naprawić blokery.
4. Ustalić dostęp spoza zespołu, wysłać chroniony build małej grupie testerów i zbierać zgłoszenia z numerem wersji.
5. Po feedbacku poprawić czytelność/tempo/balans i wydać v0.1.1; duże systemy pozostawić poza tym etapem.
