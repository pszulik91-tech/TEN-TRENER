# Audyt źródeł TEN TRENER — 2026-10-06

## Wybrana wersja

Punktem wyjścia jest `dddb734` (Build 2.5). Repozytorium zawiera 17 commitów od Build 1.0. Najnowsza wersja ma kreator wywiadu, drużynę jako całość, 407 grup, żywy świat, raporty, decyzje meczowe i zapis. Nie znaleziono równoległej gałęzi do scalenia ani usuniętych plików w dostępnej historii Git. To nie dowodzi braku innych wersji poza dostępnym projektem.

Historia potwierdza etapy: kalendarz/kariera 1.4, mikrocykl 1.6, katalog 1.8, zdarzenia 1.9, uproszczenie drużyny i świat 2.0, archiwum 2.1, decyzje 2.2, regresje 2.3–2.4, wywiad 2.5. Ręczne ustawianie zawodników zostało świadomie zastąpione planami drużyny zgodnie z decyzją autora, a nie utracone przypadkowo. Starsze komponenty pozostają w dużych modułach; nie usuwano ich przy migracji hostingu.

## Architektura

React 19, TypeScript 5.9, Vite 8, Tailwind 4 i wspólne komponenty UI. Stan jest przekazywany między ekranami React; nawigacja jest wewnętrzna, bez osobnych URL ekranów. Akcje w `app/game-actions.ts` są źródłem prawdy dla gry i audytów. Reguły czyste i generator deterministyczny znajdują się w `lib/`. Brak wymaganej usługi backendowej.

Przed zmianą uruchamianie opierało się na Vinext oraz adapterze Cloudflare/Sites. Gra nie korzysta z server actions ani bazy D1. Dodano tylko statyczne wejście `src/main.tsx` i konfigurację Vite; nie przepisano rozgrywki. Adapter Sites zachowano jako historyczną opcję, nie jako drugi silnik.

## Mapa danych

| Obszar | Źródło / stan | Faktyczny zakres |
| --- | --- | --- |
| Kluby, ligi | `app/league-catalog.mjs`, `app/regional-catalog.generated.mjs`, `app/game-data.ts` | 407 grup, 5517 wpisów drużyn, 16 WZPN. Snapshot, nie aktualizowany serwis wyników. |
| Trener | `app/coach-onboarding.ts`, `app/game-engine.ts`, `GameState.coach` | Profil, biografia, wiek, licencja, umiejętności, reputacja. Postacie AI generowane/zbiorcze. |
| Zawodnicy | `app/game-engine.ts`, `GameState.players` | Generowana kadra pod automatyczne plany, brak pełnej bazy rzeczywistych piłkarzy. |
| Zdarzenia i problemy | `lib/career-events.mjs`, `environment-events.mjs` | 139 samodzielnych sytuacji z wyborem i skutkami; warunki poziomu, stanu i nieobecności. |
| Wątki i dialogi | `lib/story-catalog.mjs`, `career-stories.mjs`, `game-language.mjs` | 24 wątki / 72 epizody; razem 211 sytuacji / 633 wybory. 189 opisów meczowych i 60 wariantów raportu. |
| Decyzje meczowe | `lib/match-moments.mjs` | 36 scenariuszy / 108 opcji; 2–5 reakcji w meczu. |
| Licencje | `app/game-data.ts`, `lib/game-rules.mjs`, `app/license-actions.ts` | Cztery licencje, kryteria startu, finansowanie i postęp kursów. Uproszczenie wymagań rzeczywistych. |
| Kariera i reputacja | `app/game-actions.ts`, `careerStats`, `seasonRecords` | Cele, sezony, wiek, wyniki, rozwój, emerytura od 65 lat. |
| Wyniki i tabela | `game-actions.ts`, `game-rules.mjs`, `fixtures`, `teams` | Mecze ligi gracza, tabela, terminarz, analiza i deterministyczny zapis losowania. |
| Świat i awanse | `lib/world-engine.mjs`, `league-movement.mjs` | Symulacja pozostałych lig, forma, zmiany AI, ruchy ligowe; uproszczone miejsca i rozstrzygnięcia PPM. |
| Finanse | `GameState.finances`, `game-actions.ts`, `license-actions.ts` | Pensja i środki trenera, koszty kursów, zgoda prezesa. Brak pełnych finansów klubu. |
| Krajowe puchary i Europa | Brak aktywnego silnika | Niezaimplementowane, nie deklarujemy ich jako działających. |
| Zapis | `app/save-storage.ts`, `lib/save-codec.mjs` | localStorage, kompresja, import/export JSON, migracja starszych zapisów. |

## Co jest uproszczone lub pozostałością prototypu

- Rynek pracy: zainteresowanie zimą, formalne oferty i zmiana klubu latem.
- Kursy postępują po rozegranej kolejce, nie według rzeczywistych terminów kursów.
- Awans/spadek nie odtwarza wszystkich regulaminów, baraży ani decyzji administracyjnych.
- Ruchy transferowe i zarządzanie trenerami AI są agregatami, nie pełnymi kontraktami wszystkich osób.
- Pliki D1/Drizzle i przykłady hostingu nie są backendem gry. Nie zostały uruchomione przy migracji.
- `public/qa`, `beta-report.html` i starsze pliki audit to historyczne raporty. Wynik aktualnego wydania jest w `docs/reports/`.
- Sam wzrost liczby wydarzeń nie dowodzi braku nudy; automaty nie oceniają humoru, tempa ani chęci ponownej gry.

## Regresje i ograniczenia sprawdzenia historii

Nie stwierdzono usunięcia grywalnego systemu w dostępnej historii. Nieprzywrócone stare ekrany są nadal w Git. Przeniesienie między domenami wymaga eksportu/importu zapisu; nie jest to utrata danych przez nową wersję. Nie zmieniono klucza zapisu ani nie dodano automatycznego kasowania.
