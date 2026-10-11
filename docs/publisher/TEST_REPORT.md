# Weryfikacja Publisher Preview

Data: 2026-10-11. Build0.1.1-publisher.1. Bazowy main:a8277ff73176c00314a5f8d6433340f6a117d5b3, produkcyjny kod:2a7ef0871e859ce6405fd5e7a2bbac17a85301ce.

## Automatyczne testy lokalne
- npm test: PASS,208/208; TypeScript i produkcyjny artefakt Vite PASS.
- npm run test:http: PASS; dev i production preview HTTP200 oraz lokalne zasoby.
- npm run audit:release: PASS;1432 mecze,53 sezony,1434 zapisy,5050 momentów,2114 decyzji,3752678 meczów świata,14 zmian klubu,53 rozliczenia.
- git diff --check: PASS.
- Nowe testy: wyłączona telemetria nie zapisuje danych, zgodna obserwacja realnych kroków, brak fikcyjnych zdarzeń przy wczytaniu, reset nowej kariery, powrót, czas, allowlist, limity logu, uszkodzone storage, brak sieci; copy i Publisher Info. Regresja prezentacji celu przed pierwszym meczem i po jego rozegraniu.
- Lokalny Node24.19.0; przypięty CI/Netlify24.21.0. Istniejące ostrzeżenia chunku/HMR/react-test-renderer nie zatrzymały testów.

## Ręczny audyt działającej produkcji
Przez cloud browser: czysty start, cztery etapy kreatora, pojedyncze pytania, wiek-stepper; Publisher Test,35lat,Mentor,GrassrootsC; GórnikII Radlin / RybnikI; cele Taktyka i Analiza. Powitanie, Dashboard, Drużyna/XI, Pod rywala, raport rywala, mecz z dwiema reakcjami i defensywną mentalnością. Wynik2:1, kondycja98%→84%, Analiza1krok, kariera/reputacja/licencje. Bez pustego ekranu lub utknięcia.

Znaleziona myląca zapowiedź celu w selektorze oraz status zagrożenia przed pierwszym meczem poprawione tylko w UI. Produkcja nie została zastąpiona.

## Oddzielny Publisher Preview
Kod końcowy: `6fbd4fd309885a67255c9898c356ec96b1c89264`. Verify Pre-Alpha SUCCESS, run #37 /38175536928. Netlify deploy6acbfc31cfef520008c4d9c0 READY, ten sam SHA. URL: https://deploy-preview-1--ten-trener.netlify.app/ . Ochrona non_production SSO działa; po autoryzacji rzeczywisty build został przejrzany.

Ręcznie: nowa kariera Publisher Preview, cztery etapy, osiem pojedynczych pytań, klub Górnik II Radlin, dwa cele; przeładowanie i WZNÓW KREATOR zachowały etap/część wyborów. Trening Pod rywala: kondycja86→98%, gotowość62→65%. Raport rywala39 vs42 OVR, poprawna informacja o braku rozegranych meczów. Debiut3:0 po zmianach pressingu i mentalności oraz dwóch reakcjach. Zapis w45.minucie, zamknięcie karty, ponowne otwarcie i KONTYNUUJ zachowały wynik1:0, Defensywną i Wysoki pressing. Raport: kondycja81%, Analiza1/9. Kariera, licencje, reputacja, rynek pracy otwierają się; brak ofert na początku jest poprawnym stanem.

Następny tydzień: decyzja Zbyt długa odprawa → gotowość+2, wypalenie+2. Trening83→90%,66→69%; drugi mecz1:1, kondycja75%, kolejny krok Analizy. Poprawiona nakładka raportu ma position:fixed, z-index80, top0/bottom936 w oknie1363×936; treść przewijana, przycisk zamknięcia dostępny. Końcowy reload nowego buildu i kontynuacja zachowały kolejkę3, klub i cel zarządu. Brak krytycznej blokady w tych ścieżkach.

Dodatkowe trzy automatyczne sesje silnika: tier9 MichałowiankaII Michałowice, tier6 Wisła Czarny Dunajec, tier2 Pogoń Grodzisk Mazowiecki: pierwszy tydzień/mecz, zapis przed/w trakcie/po meczu, odczyt i trening drugiego tygodnia PASS. Nie zastępują testów wizualnych.

HTTP smoke końcowego buildu PASS(dev200/2zasoby, production preview200/3zasoby). Bezpośrednie wejście /kariera i refresh na Netlify renderują SPA Start zamiast404; zakładka Kariera jest stanem wewnętrznym, nie deep-linkiem. W1363×936 brak poziomego overflow (scrollWidth=clientWidth); przejrzane Start, kreator, Dashboard, Drużyna, Trening, rywal, mecz, raport, Kariera, Publisher Info. Dziesięć rzeczywistych screenshotów w screenshots/.

Eksport lokalnej telemetrii sprawdzony: tylko allowlist zdarzeń, elapsedSeconds i durationSeconds, nazwa buildu; bez nazwiska, identyfikatora, URL lub dat. Widoczne rozpoczęcie kariery, zakończenie kreatora, trening, mecz, pierwszy tydzień i powrót. Reload szkicu ujawnił brak club_entered w wcześniejszym kandydacie: finalny commit naprawia jawne zgłoszenie wejścia do klubu i ma regresję deduplikacji. Brak wysyłki sieciowej.

## Ograniczenia weryfikacji
Browser udostępniał jeden rozmiar okna, bez API zmiany viewportu. Drugi rozmiar laptopa i render mobilny NIE zostały wizualnie zweryfikowane. Istniejące regresje mobilnego CSS/HTML przeszły; to nie test urządzenia. Nie zmierzono sesji15–20min z niezależnym nowym użytkownikiem. Konsola miała komunikaty rozszerzenia Chrome; nie stwierdzono aplikacyjnego crashu. Przed dystrybucją do partnera sprawdzić jego dostęp SSO, dodatkowe rozmiary i IP.
