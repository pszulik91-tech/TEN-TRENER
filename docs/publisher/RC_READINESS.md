# PUBLISHER-01.1 — RESULT

2026-10-12. Build0.1.1-publisher.2, Pre-Alpha, branch publisher/preview-0.1.1. Kod/artefakt: 949003c66c7f7417cb28848bcdd3beff8ae9c2d2. Verify Pre-Alpha SUCCESS #43 /38198500193. Netlify READY: 6acc4ee02ffa6200080bf763, dokładnie ten SHA. URL: https://deploy-preview-1--ten-trener.netlify.app/

## NO-GO — gotowość95%
Jedyny bloker przekazania linku: osoba niezalogowana widzi „This site is private / Sign in with an invited Netlify account”. Panel potwierdził Free; edytor ma Public/Private, nie ma Password. Wymagana decyzja właściciela o hostingu/Pro, bez zakupu i bez wyłączenia ochrony. ACCESS_DECISION.md opisuje rozwiązanie. Nie oznaczono RC1, nie utworzono release/tagu, nie scalono main ani nie zastąpiono produkcji.

## Responsive/display QA
Chromium: rzeczywista produkcyjna aplikacja w ramce same-origin srcdoc. Dokładny viewport CSS wewnątrz; dla screenshotów dużych rozmiarów skalowano wyłącznie zewnętrzną ramkę, bez zmiany innerWidth/innerHeight/media queries aplikacji. Nie wstrzykiwano stanu, zdarzeń ani wyników. X-Frame-Options/SSO bez zmian. Tymczasowy ekran QA usunięto z finalnego artefaktu; regresja potwierdza jego brak. To nie testy fizycznego telefonu, systemów iOS/Android czy różnych DPI/GPU.

|Viewport|Wynik|
|---|---|
|1920×1080|PASS|
|1366×768|PASS|
|1440×900|PASS|
|1280×720|PASS|
|390×844|PASS — mobile sanity|
|412×915|PASS — mobile sanity|

90 zachowanych pomiarów,15 stanów×6rozmiarów: Start; kreator(wprowadzenie/doświadczenie/pojedyncze pytanie); powitanie; selektor klubu; Dashboard; Drużyna; Trening; raport rywala; mecz; decyzja; raport; Kariera; Publisher Info. Czwarty etap kreatora przeszedł także natywną sesję, bez osobnej matrycy wszystkich rozmiarów. Brak poziomego overflow. Dialogi mieszczą się w wysokości, zawartość przewijana. Przejściowa animacja bocznego menu przy resize została odczekana; nie była trwałym błędem. Odrzucono pomiar przed zakończeniem nawigacji do Drużyny i wykonano poprawny. Nie przebudowywano UI.

## Rzeczywisty pomiar świeżej sesji
Osobny origin deploya, brak zapisu/szkicu, KONTYNUUJ nieaktywne. Sekundy mierzone zegarem podczas faktycznych działań UI; obejmują ładowanie oraz czas operatora/narzędzi. To techniczny walkthrough agenta, NIE niezależny test człowieka ani pomiar15–20min sesji ludzkiej.

|Etap|Czas|
|---|---|
|Start widoczny/sprawdzony|0:51|
|Rozpoczęcie kariery|2:43|
|Pierwsza istotna decyzja sportowa: Pod rywala|3:03|
|Początek meczu|3:18|
|Koniec meczu|4:08|
|Kariera, rynek, konsekwencje i Dashboard|6:04|

Bez dodawania pauz, skracania mechanik, wymuszania zdarzeń/goli lub sztucznej symulacji. Osiem pojedynczych pytań; Klub Śląski09-01/Klasa B; dwa cele. Trening86→98%, gotowość62→65. Mecz0:0, trzy reakcje, pressing Wysoki→Niski, Ofensywna. Raport: kondycja81%, Analiza1/8, presja zarządu−1. Sprawa Dwie grupy przy obiedzie: wspólne zadanie→morale+1, stres osobisty+2. Kariera pokazuje20tygodni kursu i letni rynek. Zapis→zamknięcie karty→ponowne otwarcie→KONTYNUUJ zachowały kolejkę2, klub, cele i decyzję.

Ocena ekspercka po odblokowaniu: marka/Pre-Alpha/core loop/CTA czytelne w pierwszej minucie. Rola trenera widoczna przez automatyczną XI, mikrocykl, ławkę, presję i licencje; różnica wobec zarządzania całym klubem jest zapisana w Publisher Info. Anonimowy first launch NIE przeszedł hostingu. Nie przypisujemy niezależnemu testerowi zrozumienia gry; EXTERNAL_TEST.md ma8 pytań do realnego testu15–20min.

## Telemetria
Domyślnie checkbox wyłączony, eksport nieaktywny. Sprawdzono świadomy opt-in, eksport JSON i powrót. Klucze: version/build/sessions; event/elapsedSeconds oraz durationSeconds sesji. Rzeczywiste kroki: new_career,creator_completed,club_entered,training_completed,match_started,match_completed,first_week_completed,return_to_game,career_resumed. Brak nazwiska, payloadu kariery, IP, fingerprintu, czasu absolutnego i identyfikatora osoby. Brak automatycznej wysyłki/trackera. Hosting może mieć własne logi żądań, odrębne od lokalnego mechanizmu gry. Tester dobrowolnie dołącza plik JSON do odpowiedzi organizatorowi; nie wymyślono adresu ani nie wysłano wiadomości. Eksportu testera nie dodano do git.

## Weryfikacja automatyczna
213/213 PASS, TypeScript/produkcyjny Vite build/HTTP smoke PASS. audit:release PASS:1432mecze,53sezony,1434zapisy,14zmian klubu,53rozliczenia. Osobne prawdziwe publisher-mode scenariusze silnika tier2/5/9: fikcyjny świat, tydzień/mecz, save/load i odmowa importu obcego katalogu PASS. Standardowy silnik/klucz zapisów zachowane poza publisher mode. Finalny dist nie zawiera historycznych publicznych QA/danych ani tymczasowego harnessu.

## IP i ograniczenia
Niezależny autorski fikcyjny katalog115grup/1398klubów zastępuje import przy buildzie, bez maskowania skopiowanych list. Baza źródłowa zachowana. Neutralizacja widocznych nazw organizacji/licencji nie zmienia kluczy/reguł. Proceduralne herby, nowy geometryczny favicon, fonty systemowe, brak fotografii/muzyki. Notices bibliotek/CSS w artefakcie. Nie jest to clearance prawny: znak TEN TRENER/autorstwo, dokładna proweniencja historycznego vendor CSS i komercyjna dystrybucja/notices nadal do sprawdzenia. Bundle>500kB, długa Drużyna na telefonie, precyzja narracji, lokalny zapis i niewykonany test niezależnego człowieka pozostają ograniczeniami prototypu.

## Utrwalenie wyników
Po testach środowisko plikowe/przeglądarkowe rozłączyło się przy końcowym checkpointcie. Kod, CI i deploy pozostały dostępne. Dokumentację odtworzono z obserwowanych wyników i publikowano atomowo przez autoryzowany GitHub connector. Nowych screenshotów/surowego logu90pomiarów nie udało się odczytać do publikacji po rozłączeniu; były wykonane i zapisane lokalnie. Nie deklarujemy ich obecności w repo. Historyczne screenshoty PUBLISHER-01 pozostają oznaczone jako poprzedni wariant danych.

STOP po PUBLISHER-01.1; bez PUBLISHER-02.
