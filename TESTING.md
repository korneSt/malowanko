# Przewodnik Testowania - Malowanko

Ten dokument opisuje jak uruchamiać i pisać testy w projekcie Malowanko.

## 📋 Przegląd

Projekt używa dwóch głównych narzędzi testowych:

1. **Vitest + React Testing Library** - Testy jednostkowe i integracyjne
2. **Playwright** - Testy end-to-end (E2E)

## 🚀 Szybki Start

### Instalacja przeglądarek Playwright

Przed pierwszym uruchomieniem testów E2E, zainstaluj przeglądarki:

```bash
pnpm exec playwright install --with-deps chromium
```

Lub wszystkie przeglądarki:

```bash
pnpm exec playwright install --with-deps
```

### Uruchamianie testów

```bash
# Testy jednostkowe (watch mode)
pnpm test

# Testy jednostkowe (jednorazowo)
pnpm test:run

# Testy jednostkowe z pokryciem kodu
pnpm test:coverage

# Testy jednostkowe z UI
pnpm test:ui

# Testy E2E
pnpm test:e2e

# Testy E2E z UI
pnpm test:e2e:ui

# Wszystkie testy
pnpm test:all
```

## 📝 Testy Jednostkowe

### Struktura

Testy jednostkowe znajdują się obok plików źródłowych z rozszerzeniem `.test.ts` lub `.test.tsx`.

Przykład struktury:
```
components/
├── Button.tsx
└── Button.test.tsx
```

### Przykład testu

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/utils/test-utils';
import { Button } from './ui/button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
});
```

### Custom Render

Używaj `render` z `tests/utils/test-utils.tsx` zamiast domyślnego, aby mieć dostęp do globalnych providerów:

```typescript
import { render } from '@/tests/utils/test-utils';
```

### Mockowanie

#### Next.js Navigation

Next.js navigation jest automatycznie zmockowany w `tests/setup.ts`. Jeśli potrzebujesz dostosować mock:

```typescript
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    // ...
  }),
}));
```

#### API Calls (MSW)

MSW jest skonfigurowany do mockowania żądań API. Dodaj handlery w `tests/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/example', () => {
    return HttpResponse.json({ data: 'mock data' });
  }),
];
```

## 🎭 Testy E2E

### Struktura

Testy E2E znajdują się w folderze `e2e/`:

```
e2e/
├── auth/
│   ├── signup.spec.ts
│   └── login.spec.ts
├── generator/
│   └── generate-coloring.spec.ts
└── gallery/
    └── browse.spec.ts
```

### Przykład testu E2E

```typescript
import { test, expect } from '@playwright/test';

test('user can generate coloring', async ({ page }) => {
  await page.goto('/generator');
  
  await page.fill('input[name="prompt"]', 'kot grający na gitarze');
  await page.selectOption('select[name="ageGroup"]', '4-8');
  await page.click('button:has-text("Generuj")');
  
  await expect(page.locator('img')).toBeVisible({ timeout: 30000 });
});
```

### Konfiguracja

Konfiguracja Playwright znajduje się w `playwright.config.ts`. Domyślnie:

- Testy uruchamiają lokalny serwer dev przed testami
- Screenshots i video są zapisywane przy błędach
- Testy są uruchamiane w Chromium, Firefox i WebKit

## 📊 Pokrycie Kodu

Uruchom testy z pokryciem:

```bash
pnpm test:coverage
```

Raport HTML będzie dostępny w `coverage/index.html`.

Cel: **≥ 80% pokrycia kodu** (zgodnie z plan-testow.md)

## 🔧 Konfiguracja

### Vitest

Konfiguracja: `vitest.config.mts`

- Environment: `happy-dom` (dla testów React - lepsza kompatybilność z ESM)
- Setup file: `tests/setup.tsx`
- Coverage provider: `v8`

### Playwright

Konfiguracja: `playwright.config.ts`

- Base URL: `http://localhost:3000` (lub `PLAYWRIGHT_TEST_BASE_URL`)
- Retries: 2 na CI, 0 lokalnie
- Browsers: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari

## 📚 Zasoby

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)

## 🎯 Zgodność z Planem Testów

Konfiguracja jest zgodna z wymaganiami z `.ai/plan-testow.md`:

✅ Vitest dla testów jednostkowych  
✅ React Testing Library dla komponentów  
✅ Playwright dla testów E2E  
✅ MSW dla mockowania API  
✅ Konfiguracja coverage  
✅ Setup dla Next.js  

## 🐛 Rozwiązywanie Problemów

### Testy nie znajdują modułów

Upewnij się, że ścieżki aliasów w `vitest.config.ts` są zgodne z `tsconfig.json`.

### Playwright nie może połączyć się z serwerem

Sprawdź czy:
1. Serwer dev działa na `localhost:3000`
2. Zmienna `PLAYWRIGHT_TEST_BASE_URL` jest ustawiona poprawnie
3. Port 3000 nie jest zajęty przez inny proces

### MSW nie mockuje żądań

Upewnij się, że:
1. Server jest uruchomiony w `tests/setup.ts`
2. Handlery są poprawnie zdefiniowane w `tests/mocks/handlers.ts`
3. URL w handlerach pasuje do rzeczywistych żądań
