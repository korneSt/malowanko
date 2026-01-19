# Testy E2E - Malowanko

Testy end-to-end używają Playwright do testowania pełnych przepływów użytkownika.

## Uruchamianie testów

```bash
# Wszystkie testy E2E
pnpm test:e2e

# Z interfejsem użytkownika
pnpm test:e2e:ui

# W trybie headed (z widoczną przeglądarką)
pnpm test:e2e:headed

# W trybie debug
pnpm test:e2e:debug
```

## Struktura testów

Testy są organizowane zgodnie z przepływami użytkownika zdefiniowanymi w `plan-testow.md`:

- `auth/` - Testy autoryzacji (rejestracja, logowanie)
- `generator/` - Testy generatora kolorowanek
- `library/` - Testy biblioteki osobistej
- `gallery/` - Testy galerii publicznej
- `printing/` - Testy drukowania

## Konfiguracja

Konfiguracja Playwright znajduje się w `playwright.config.ts`.

Domyślnie testy uruchamiają lokalny serwer dev (`pnpm dev`) przed rozpoczęciem testów.

## Screenshots i video

Playwright automatycznie zapisuje:
- Screenshots przy błędach
- Video przy błędach (w trybie retry)

Pliki są zapisywane w `test-results/` i `playwright-report/`.
