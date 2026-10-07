# Wydanie webowe i wdrożenie

## Stan na 2026-10-07

- Kanoniczny katalog roboczy: projekt TEN TRENER; historia od Build 1.0 została zachowana.
- Prywatne repozytorium `pszulik91-tech/TEN-TRENER`, gałąź `main`, zawiera pełny kod i historię od Build 1.0. Import zakończono commitem `1fd8e2d`.
- Naprawa CI: `e804988` ujednolicił Node, `86650e0` zaktualizował akcje. [Verify Pre-Alpha #4](https://github.com/pszulik91-tech/TEN-TRENER/actions/runs/37581257764) zakończył się sukcesem: czysta instalacja, build, regresje, HTTP i artefakt `dist`.
- Projekt Netlify **ten-trener** utworzony w zespole `p-szulik91`.
- Identyfikator projektu: `167eaa74-4806-4eb2-8747-996de31ea60d` (nie jest sekretem).
- Panel: https://app.netlify.com/projects/ten-trener
- Przydzielony adres: `ten-trener.netlify.app`. **Nie potwierdzono jeszcze działającej gry pod tym adresem: nie ma pierwszego deploymentu.**
- API potwierdziło wymaganie logowania do zespołu dla wszystkich wdrożeń. Dostęp nie jest jeszcze przetestowany na opublikowanym buildzie.
- Panel Netlify jest dostępny po zalogowaniu. Repozytorium nadal nie jest połączone: oczekuje potwierdzenia autoryzacji aplikacji Netlify w GitHub (tożsamość, odczyt adresów e-mail i działanie w imieniu konta). Automatyczna kontrola uprawnień zatrzymała ten krok; nie przyznano dostępu.

## Konfiguracja gotowa w kodzie

Node **24.21.0 LTS** jest przypięty wyłącznie w głównym `.nvmrc`; GitHub Actions (`node-version-file`) i Netlify odczytują ten sam plik. `package.json` i lockfile deklarują linię `>=24.21.0 <25`. Przy aktualizacji Node zmieniaj te deklaracje razem. Nie ustawiaj sprzecznego `NODE_VERSION` w panelu Netlify.

`netlify.toml`: build + TypeScript + regresje, katalog `dist`, obsługa SPA, noindex, nagłówki, cache zasobów z hashem. `NETLIFY_NEXT_PLUGIN_SKIP=true` wyłącza adapter Next.js: zależność pozostała dla starego hostingu, a wdrażamy statyczny build Vite. Produkcja i PR previews korzystają z tej samej bramki. `.github/workflows/verify.yml` sprawdza push/PR i pozwala ręcznie uruchomić pełny audyt karier.

Akcje: checkout 7.0.1, setup-node 7.0.0, upload-artifact 7.0.1. CI ma tylko `contents: read`, a checkout nie zachowuje poświadczeń. Runner jest przypięty do `ubuntu-24.04`, aby zmiana `ubuntu-latest` na Ubuntu 26 nie zmieniła środowiska bez kontroli. Standardowa ścieżka nie instaluje pakietów apt, nie wymaga Pythona ani systemowego OpenSSL; Vite/Rolldown używają natywnych zależności z lockfile. Przed przejściem na Ubuntu 26 wykonaj tam czystą instalację, build, regresje i test HTTP.

Pierwotny brak `.nvmrc` wynikał z przerwanego importu całego drzewa źródeł. Po imporcie Node 22.16 ujawnił `ERR_INVALID_RETURN_PROPERTY_VALUE` w hookach ładowania modułów podczas testów komponentów. Node 24.21 przechodzi wszystkie 106 testów bez zmian kodu gry.

**Zielony GitHub Actions nie oznacza udanego deploymentu Netlify.** Status hostingu należy potwierdzić osobno dla konkretnego commita.

## Dokończenie po autoryzacji

1. Potwierdzić autoryzację istniejącej aplikacji Netlify w GitHub. Nie tworzyć nowego repozytorium i nie powtarzać importu historii.
2. W istniejącym projekcie Netlify połączyć to repozytorium. Nie tworzyć kolejnego projektu. Production branch: `main`; PR previews włączone. Ustawienia buildu pochodzą z pliku.
3. Wykonać podgląd, sprawdzić grę i ochronę dostępu. Następnie produkcję. Zweryfikować konkretny commit i status success.
4. Utworzyć kontrolny pull request i potwierdzić, że Netlify zwraca osobny Deploy Preview URL. Dopiero wtedy uznać preview za sprawdzone.

Autoryzację wykonuje właściciel w bezpiecznym logowaniu; nie należy przekazywać tokenów lub haseł w rozmowie ani w repozytorium. Bieżący brak autoryzacji nie uzasadnia publicznego obejścia ograniczeń.

## Tester / Publisher Preview

Na tym etapie pozostaje jeden kod i jeden build. Docelowe kanały to chroniona produkcja testerska oraz izolowane podglądy PR. Dla wydawcy można przypiąć stabilny tag/wdrożenie tego samego kodu. Nie twórz osobnego silnika ani fałszywego hasła sprawdzanego w JavaScript.

Ochrona obecnie wymaga członkostwa zespołu Netlify. Nie jest gotowym systemem zaproszeń dowolnych testerów. Przed szerszą dystrybucją należy wybrać wspierane zabezpieczenie dla odbiorców spoza zespołu, potwierdzić jego koszt i przetestować niezalogowany dostęp. `noindex` ogranicza indeksowanie, **nie jest kontrolą dostępu**.

## Przeniesienie zapisów i cofnięcie wersji

Przed migracją pobrać JSON w ustawieniach starego hostingu, w nowej grze użyć USTAWIENIA → Wczytaj kopię z pliku. Podglądy PR mają osobne domeny i osobne localStorage. Nie używać w nich jedynej kopii kariery.

Rollback hostingu przywraca kod, nie cofa zapisu w przeglądarce. Przed wersją zmieniającą format zapisu wykonać test migracji i kopię. Zachować klucz `ten-trener-save-v1`, chyba że istnieje jawna migracja.

## Dokumentacja referencyjna

- Netlify Deploy Previews: https://docs.netlify.com/deploy/deploy-types/deploy-previews/ — PR wymaga połączonego repozytorium i odpowiedniej gałęzi bazowej.
- Netlify Project visibility: https://docs.netlify.com/manage/security/secure-access-to-sites/project-visibility/ — ochrona strony jest niezależna od tagu noindex.
