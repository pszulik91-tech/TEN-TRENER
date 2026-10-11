# Znane ograniczenia Publisher Preview

Nie stwierdzono krytycznej blokady w dwóch rozegranych meczach Publisher Preview, kreatorze, zapisie i kontynuacji. Finalna weryfikacja oddzielnego podglądu i CI: TEST_REPORT.md / DEPLOYMENT.md.

- Pre-Alpha: uproszczone awanse i spadki, brak baraży, pucharów i Europy; katalog nie stanowi oficjalnej symulacji regulaminów PZPN.
- Prawdziwe nazwy klubów, lig, organizacji i import katalogu wymagają weryfikacji praw/proweniencji przed publicznym wykorzystaniem. Nie deklarujemy posiadania licencji (IP_AUDIT.md).
- Zawodnicy i prezesi są generowani. W kadrze mogą powtarzać się imiona i nazwiska; zbieżność nie identyfikuje prawdziwej osoby.
- Pojedyncze scenki z ławki mogą mieć ogólną narrację niedopasowaną idealnie do minuty (np. tekst o końcowych minutach przy 30'). To ograniczenie narracji, nie dowód modelowania rzeczywistego stylu rywala.
- Reputacja, licencje, cele sezonowe i rynek pracy nie osiągają pełnego cyklu w 15 minut. W pierwszej sesji pokazujemy ich stan i zasady, nie wymuszamy awansu lub oferty.
- Jeden aktywny zapis na domenę i przeglądarkę; usunięcie danych lub zmiana domeny wymaga własnej kopii pliku. Brak synchronizacji chmurowej.
- Bundle jest duży; lokalny build ostrzega o chunku ponad 500 kB. Nie zmierzono jakości na wolnym komputerze lub sieci komórkowej.
- Lokalna telemetria jest dobrowolna; bez zgody/eksportu brak danych u autora. To narzędzie testu, nie globalny dashboard analityczny.
- Podglądy Netlify mają ochronę zespołową SSO; zewnętrzny partner wymaga zweryfikowanego sposobu dostępu przed wysłaniem linku. Nie wyłączamy ochrony dla wygody testów.

## Backlog poza PUBLISHER-01
Badanie pierwszej sesji z niezależnym testerem; kalibracja długich karier; narracja odnosząca się do czasu i danych; optymalizacja bundla po pomiarze; decyzja o neutralnym katalogu lub licencjach; docelowy pakiet PC. Brak automatycznie zatwierdzonych implementacji.

- Nie zamknięto wizualnego QA drugiego rozmiaru laptopa i mobile: aktualne środowisko nie umożliwia zmiany viewportu. Plan15–20min wymaga jeszcze testu z niezależnym użytkownikiem.
