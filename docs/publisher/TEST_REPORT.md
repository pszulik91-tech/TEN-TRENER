# Weryfikacja Publisher Preview

Data: 2026-10-11. Build0.1.1-publisher.1. Bazowy main:a8277ff73176c00314a5f8d6433340f6a117d5b3, produkcyjny kod:2a7ef0871e859ce6405fd5e7a2bbac17a85301ce.

## Automatyczne testy lokalne
- npm test: PASS,206/206; TypeScript i produkcyjny artefakt Vite PASS.
- npm run test:http: PASS; dev i production preview HTTP200 oraz lokalne zasoby.
- npm run audit:release: PASS;1432 mecze,53 sezony,1434 zapisy,5050 momentów,2114 decyzji,3752678 meczów świata,14 zmian klubu,53 rozliczenia.
- git diff --check: PASS.
- Nowe testy: wyłączona telemetria nie zapisuje danych, zgodna obserwacja realnych kroków, brak fikcyjnych zdarzeń przy wczytaniu, reset nowej kariery, powrót, czas, allowlist, limity logu, uszkodzone storage, brak sieci; copy i Publisher Info. Regresja prezentacji celu przed pierwszym meczem i po jego rozegraniu.
- Lokalny Node24.19.0; przypięty CI/Netlify24.21.0. Istniejące ostrzeżenia chunku/HMR/react-test-renderer nie zatrzymały testów.

## Ręczny audyt działającej produkcji
Przez cloud browser: czysty start, cztery etapy kreatora, pojedyncze pytania, wiek-stepper; Publisher Test,35lat,Mentor,GrassrootsC; GórnikII Radlin / RybnikI; cele Taktyka i Analiza. Powitanie, Dashboard, Drużyna/XI, Pod rywala, raport rywala, mecz z dwiema reakcjami i defensywną mentalnością. Wynik2:1, kondycja98%→84%, Analiza1krok, kariera/reputacja/licencje. Bez pustego ekranu lub utknięcia.

Znaleziona myląca zapowiedź celu w selektorze oraz status zagrożenia przed pierwszym meczem poprawione tylko w UI. Produkcja nie została zastąpiona.

## Oddzielny Publisher Preview
Weryfikacja wdrożenia, sesji, screenshotów oraz rozmiarów okna będzie dopisana po opublikowaniu chronionego podglądu. Nie traktować testów produkcji jako testów zmienionego buildu. Plan15–20min nie jest pomiarem z niezależnym użytkownikiem.
