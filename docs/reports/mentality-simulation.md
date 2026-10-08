# GAME-09 — kontrolowana symulacja mentalności

Po 6000 tych samych seedów dla każdej mentalności i sytuacji, 54 000 przebiegów. Siły obu klubów:52; nasz klub jako gospodarz (zachowana dotychczasowa przewaga gospodarza). Każda decyzja jest utrzymywana do końca; brak dodatkowych zmian pressingu i decyzji z ławki. Liczone wyłącznie gole po minucie decyzji; wynik początkowy jest stały dla wszystkich seedów i wariantów. Reprodukcja: `node scripts/mentality-simulation.mjs`.

## Kalibracja

Mentalność nie zmienia zapisanej strength. Neutralna: oba ataki bez korekty. Wpływ rośnie liniowo z rzeczywistą minutą, bez skoku po 75'. Ofensywna: od +10% własnego zagrożenia i +8% rywala na początku do +40%/+40% w 90'; przy przegrywaniu własne zagrożenie zyskuje dodatkowo do12 p.p., a przy prowadzeniu zagrożenie rywala rośnie dodatkowo do12 p.p. Defensywna: własne zagrożenie od−12% do−42%, rywala od−8% do−38%; przy prowadzeniu dodatkowa redukcja zagrożenia rywala do8 p.p. Wynik wpływa na zakres, nie liczbę goli przewagi.

To korekta istniejącego prawdopodobieństwa wykorzystania sytuacji, bez zmiany częstości losowania strzałów, RNG, kartek, posiadania lub kosztu fizycznego. Silnik ogranicza opcjonalne mnożniki ataku do0,45–1,65. Profil przy ponownej symulacji wynika z obecnej mentalności, obecnej minuty i wyłącznie rozegranych goli. Jest utrzymywany do kolejnej korekty lub decyzji z ławki; wtedy obliczany ponownie. Już rozegrane zdarzenia są zawsze zachowane.

## Wyniki

| Minuta i wynik | Mentalność | Zagrożenie nasze / rywala vs neutralna | Śr. nasze gole dalej | Śr. gole rywala dalej | W / R / P (%) | Strata ≥1 gola dalej (%) |
|---|---|---|---:|---:|---|---:|
| 30' • 0:0 | Defensywna | -22.0% / -18.0% | 0.742 | 0.655 | 31.40 / 42.13 / 26.47 | 47.65 |
| 30' • 0:0 | Zrównoważona | +0.0% / +0.0% | 0.927 | 0.762 | 34.77 / 39.10 / 26.13 | 52.75 |
| 30' • 0:0 | Ofensywna | +20.0% / +18.7% | 1.115 | 0.924 | 38.97 / 32.60 / 28.43 | 59.90 |
| 70' • 0:1 | Defensywna | -35.3% / -31.3% | 0.236 | 0.196 | 1.98 / 14.60 / 83.42 | 18.13 |
| 70' • 0:1 | Zrównoważona | +0.0% / +0.0% | 0.328 | 0.253 | 3.63 / 16.95 / 79.42 | 23.22 |
| 70' • 0:1 | Ofensywna | +42.7% / +32.9% | 0.473 | 0.351 | 6.12 / 21.40 / 72.48 | 30.78 |
| 80' • 1:0 | Defensywna | -38.7% / -41.8% | 0.128 | 0.085 | 93.02 / 6.57 / 0.42 | 8.07 |
| 80' • 1:0 | Zrównoważona | +0.0% / +0.0% | 0.185 | 0.143 | 88.77 / 10.87 / 0.37 | 13.80 |
| 80' • 1:0 | Ofensywna | +36.7% / +47.1% | 0.261 | 0.217 | 84.28 / 14.87 / 0.85 | 20.43 |

Przy70' i0:1 szansa uniknięcia porażki: Defensywna16,58%, neutralna20,58%, Ofensywna27,52%. Ryzyko przynajmniej kolejnego gola rywala:18,13% /23,22% /30,78%. Dokładny końcowy wynik0:2 wystąpił przy70' w 12.33% / 13.80% / 15.62% (Defensywna / neutralna / Ofensywna). Przy80' i1:0 Defensywna utrzymuje wygraną93,02% vs88,77% neutralna i84,28% Ofensywna, jednocześnie zmniejsza własną średnią liczbę goli.

Wyniki są kontrolą kierunku i kompromisu, nie obietnicą tych prawdopodobieństw w każdej karierze. Siła XI, przygotowanie, przewaga gospodarza, pressing, momenty z ławki oraz pozostały czas nadal wpływają na konkretny mecz.
