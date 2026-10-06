# Wydanie webowe i wdrożenie

## Stan na 2026-10-06

- Kanoniczny katalog roboczy: projekt TEN TRENER; historia od Build 1.0 została zachowana.
- Konto GitHub zweryfikowane przez połączenie: `pszulik91-tech`. Lista dostępnych repozytoriów była pusta. Połączenie nie oferuje tworzenia repozytorium, a przeglądarka GitHub pokazuje logowanie. Nie utworzono repozytorium i nie wykonano push.
- Projekt Netlify **ten-trener** utworzony w zespole `p-szulik91`.
- Identyfikator projektu: `167eaa74-4806-4eb2-8747-996de31ea60d` (nie jest sekretem).
- Panel: https://app.netlify.com/projects/ten-trener
- Przydzielony adres: `ten-trener.netlify.app`. **Nie potwierdzono jeszcze działającej gry pod tym adresem: nie ma pierwszego deploymentu.**
- API potwierdziło wymaganie logowania do zespołu dla wszystkich wdrożeń. Dostęp nie jest jeszcze przetestowany na opublikowanym buildzie.
- CLI Netlify zostało uruchomione: stan `Not logged in`. Połączenie aplikacji umożliwia konfigurację projektu, ale nie oferuje wysyłania plików ani połączenia Git.

## Konfiguracja gotowa w kodzie

`netlify.toml`: Node 22.16, build + TypeScript + regresje, katalog `dist`, obsługa SPA, noindex, nagłówki, cache zasobów z hashem. Produkcja i PR previews korzystają z tej samej bramki. `.github/workflows/verify.yml` sprawdza push/PR i pozwala ręcznie uruchomić pełny audyt karier.

**Samo zapisanie workflow nie oznacza działającego CI ani automatycznego deploymentu.** Są aktywne dopiero po podłączeniu GitHub/Netlify.

## Dokończenie po autoryzacji

1. Utworzyć prywatne `pszulik91-tech/TEN-TRENER` lub użyć istniejącego, jeżeli pojawi się po poszerzeniu dostępu. Zachować pełną historię Git, ustawić `main` i wypchnąć wersję.
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
