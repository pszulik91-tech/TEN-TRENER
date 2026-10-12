# Dostęp — decyzja właściciela

2026-10-12: świeża przeglądarka bez zalogowania do Netlify/GitHub zobaczyła „This site is private / Sign in with an invited Netlify account”. To sesja niezalogowana, nie osobny tryb incognito (API incognito niedostępne). Panel przed autoryzacją pokazał Log in. Nie opieramy wyniku na zalogowaniu właściciela. Po bezpiecznej autoryzacji panel Usage & billing potwierdził Free; Edit visibility oferuje Public/Private i nie oferuje Password.

Nic nie kupiono ani nie zmieniono ochrony. Natywne wspólne hasło wymaga Pro: https://docs.netlify.com/manage/security/secure-access-to-sites/password-protection/ . Koszt/rozliczenia sprawdza właściciel w aktualnej ofercie, bez wpisywania starej ceny.

## Preferowana opcja
Po zatwierdzeniu kosztu: osobny projekt Netlify tylko dla stabilnego Publisher Preview, bez zmiany team-default i dotychczasowej produkcji. Wgrać produkcyjny artefakt Vite sprawdzonego publisher SHA. Team Owner/Developer projektu ustawia Project configuration→General→Visitor access→Project visibility→Password, zakres Production and previews. Hasło ustala właściciel bez wklejania do git/czatu. Zachować noindex meta/robots/X-Robots-Tag. Tester otrzymuje link/hasło, nie konto Netlify/GitHub.

Odbiór: świeża niezalogowana sesja wpuszcza po haśle stronę i zasoby; bez hasła chroni całe zasoby; refresh działa. Po pokazie zmienić hasło lub Private i sprawdzić nową anonimową sesję. Ochrona hostingu nie usuwa pobranych plików ani nie zatrzymuje już wczytanej lokalnej gry. Nie trzymać dev/QA w tym samym projekcie: wcześniejsze deploye też mogą być dostępne z hasłem. Noindex nie jest kontrolą dostępu.

## Alternatywy
- Istniejący hosting właściciela z ochroną HTTP/server-side: może uniknąć Pro, ale wymaga wskazania hostingu i sprawdzenia ochrony całych zasobów. Nie dodano backendu.
- Public+noindex na Free: nie wymaga konta, ale zasoby/link są publiczne, bez kontrolowanego dostępu wyłącznie dla partnera; nie zastosowano.
- Private/Reviewer: nadal konto Netlify, nie rozwiązuje wymagania. Nikogo nie zaproszono i nie dodano miejsc.

Blokada dotyczy hostingu/planu. Nie dodawać kont graczy, Identity, klientowego „hasła” ani losowych trackerów. RC1/GO czeka na decyzję właściciela i test dostępu.
