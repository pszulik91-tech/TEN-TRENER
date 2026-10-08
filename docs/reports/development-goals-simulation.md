# GAME-08B — balans celów sezonowych

Kontrolowana symulacja zachowań: 10, 22 i 34 spotkania klubu. Istniejący generator spraw z pamięcią i historią; bez nowych wydarzeń. Wyniki: 20% porażek, brak wysokiego przygotowania / analizy / U21 w co czwartej kolejce i morale poniżej progu w co trzeciej. Presja >=45 w trzech z czterech kolejek jest założeniem tego scenariusza, a nie obietnicą dla każdego klubu. Cel presji wymaga rzeczywistych okazji do gry pod presją. To test naliczania i osiągalności celów, nie odrębny silnik meczu. Pełną karierę bada istniejący audit:release.

W tabeli: **wymóg → najwcześniejsze teoretyczne ukończenie po N spotkaniach klubu**. Pauzy mogą zwiększyć numer kolejki ligowej. Dla ludzi wymagane są różne kolejki decyzji. Dolna granica uwzględnia jedną nierozwiązaną sprawę przeniesioną sprzed pierwszego meczu nowego sezonu: 6 kroków może wtedy zakończyć się po piątym meczu. Bez sprawy przedsezonowej potrzeba o jeden mecz więcej. Minimum 6 zapobiega ukończeniu po czterech meczach także przy przeniesionej sprawie. Nie ma blokady czasowej.

| Cel | 10 meczów | 22 mecze | 34 mecze |
|---|---|---|---|
| Taktyka | 5 → 5 | 10 → 10 | 16 → 16 |
| Motywacja | 5 → 5 | 11 → 11 | 17 → 17 |
| Zarządzanie ludźmi | 6 różnych kolejek decyzji → 5 | 7 różnych kolejek decyzji → 6 | 10 różnych kolejek decyzji → 9 |
| Analiza | 5 → 5 | 8 → 8 | 12 → 12 |
| Odporność na presję | 5 → 5 | 6 → 6 | 9 → 9 |
| Adaptacyjność | 3 formacje × 2 punktowane mecze → 6 | 3 formacje × 2 punktowane mecze → 6 | 3 formacje × 4 punktowane mecze → 12 |
| Rozwój młodych | 5 kolejek + 3 różnych U21 → 5 | 9 kolejek + 3 różnych U21 → 9 | 14 kolejek + 3 różnych U21 → 14 |
| Reputacja / networking | 5 → 5 | 7 → 7 | 11 → 11 |

Przykład sezonu 22 spotkań, seed 42. Zawsze wybierane są tylko dwa cele; poniżej porównujemy trzy obszary osobno.

| Cel | Po 4 meczach | Po 11 meczach | Po 22 meczach |
|---|---|---|---|
| Zarządzanie ludźmi | 3/7 różnych kolejek | 7/7 różnych kolejek | 7/7 różnych kolejek |
| Rozwój młodych | 3/9 kolejek z U21 • 3/3 różnych zawodników | 9/9 kolejek z U21 • 3/3 różnych zawodników | 9/9 kolejek z U21 • 3/3 różnych zawodników |
| Adaptacyjność | 0/3 formacje z 2 punktowanymi meczami • 3/6 powtórzeń • 3-5-2: 1/2, 4-2-3-1: 1/2, 4-4-2: 1/2 | 3/3 formacje z 2 punktowanymi meczami • 6/6 powtórzeń • 4-4-2: 2/2, 4-2-3-1: 2/2, 3-5-2: 2/2 | 3/3 formacje z 2 punktowanymi meczami • 6/6 powtórzeń • 3-5-2: 2/2, 4-2-3-1: 2/2, 4-4-2: 2/2 |

## Dostępność spraw dla celu Ludzie

100 seedów dla każdego zestawu tier × długość terminarza. Każda sprawa jest rozpatrywana, wybierana jest dostępna pozytywna decyzja. Generator, pamięć i limity 2 nowych wydarzeń są zachowane. Sprawa przeciążeniowa nie jest wymuszana ani potrzebna do tych wyników.

| Tier | Mecze | Wymóg | Średnia kolejek z pozytywną decyzją | Sezony z ukończeniem |
|---|---|---|---|---|
| 1 | 10 | 6 | 7.33 | 95/100 |
| 1 | 22 | 7 | 17.69 | 100/100 |
| 1 | 34 | 10 | 28.26 | 100/100 |
| 5 | 10 | 6 | 7.56 | 96/100 |
| 5 | 22 | 7 | 17.91 | 100/100 |
| 5 | 34 | 10 | 28.53 | 100/100 |
| 9 | 10 | 6 | 8.05 | 100/100 |
| 9 | 22 | 7 | 18.77 | 100/100 |
| 9 | 34 | 10 | 29.72 | 100/100 |

## Migracja

Tylko aktywny sezon otrzymuje wymagania obliczone z fixtures. Znane kolejki taktyki, analizy i presji zostają. Dawne decyzje bez kolejek: jeden częściowy krok, jeżeli istnieją pozytywne decyzje w dowodach. Dawne nazwiska U21: nazwiska zostają, jedna udowodniona okazja występu. Dawne formacje z punktami: po jednym udowodnionym sukcesie, bez wymyślania numerów kolejek. Licznik morale zostaje jako znany agregat, ograniczony liczbą rozegranych spotkań. Wygrane można odtworzyć z wyników fixtures. Brak dowodów nie daje fikcyjnego ukończenia. Nowe save’y przechowują różne kolejki i powtórzenia.

seasonRecords i wcześniej przyznane nagrody pozostają bez zmian; rozliczony sezon z pendingSeason nie jest rozliczany ponownie. Nagrody nadal wynoszą +1 odpowiedniej umiejętności albo +2 reputacji; maksymalnie dwa wybrane cele na koniec sezonu.

Odtworzenie danych: `node scripts/development-goals-simulation.mjs`; raport maszynowy: `docs/reports/development-goals-simulation.json`.
