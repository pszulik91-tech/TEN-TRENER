# Wdrożenie Publisher Preview

Wersja0.1.1-publisher.1; branch publisher/preview-0.1.1; oddzielny draft PR do main, bez scalania. Produkcja ten-trener.netlify.app ma pozostać na obecnym kodzie. Publikacja nastąpi przez istniejącą integrację GitHub/Netlify, z produkcyjnym buildem Vite i regresjami, bez devservera.

Zweryfikowany bieżący produkcyjny deploy:6ac74f8bcdcf0b000854b3df, ready, HTTPS, kod2a7ef0871e859ce6405fd5e7a2bbac17a85301ce. netlify.toml ma SPA fallback200→index.html, nagłówki noindex/nosniff i niemutowalny cache zasobów. Nie ma Functions, kluczy lub backendu wymaganych przez grę. Brak znalezionych literalnych sekretów w aktywnym źródle; to nie pełny audyt bezpieczeństwa infrastruktury.

Podglądy są chronione SSO zespołu(non_production); produkcja nie wymaga SSO. Repo jest publiczne. Link prywatnego podglądu nie zapewnia wydawcy dostępu bez jego sprawdzenia. Zalecenie: właściciel uzgadnia tymczasowy dostęp konkretnego odbiorcy albo osobny projekt z hasłem, jeśli plan to umożliwia; nie wyłączać istniejącej ochrony i nie udostępniać konta właściciela.

Po powodzeniu CI i deploya dopisać dokładny SHA oraz potwierdzony URL. Preferować przypięty permalink konkretnego deploya do prezentacji; aktualizowany URL PR może zmienić build. Retencja deployów Netlify wymaga sprawdzenia przed późniejszym pitchem; gałąź pozwala odtworzyć wersję.
