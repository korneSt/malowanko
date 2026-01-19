# Testy - Malowanko

Ten folder zawiera konfigurację i narzędzia pomocnicze dla testów.

## Struktura

```
tests/
├── setup.ts              # Globalne ustawienia dla testów jednostkowych
├── mocks/
│   ├── handlers.ts      # MSW handlers do mockowania API
│   └── server.ts        # MSW server setup
├── utils/
│   └── test-utils.tsx    # Custom render function z providerami
└── __mocks__/
    └── next/
        └── navigation.ts # Mock dla Next.js navigation
```

## Użycie

### Testy jednostkowe

Testy jednostkowe znajdują się obok plików źródłowych z rozszerzeniem `.test.ts` lub `.test.tsx`.

Przykład:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/utils/test-utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Testy E2E

Testy E2E znajdują się w folderze `e2e/` z rozszerzeniem `.spec.ts`.

## MSW (Mock Service Worker)

MSW jest używany do mockowania żądań API w testach. Handlery są zdefiniowane w `tests/mocks/handlers.ts`.

Aby dodać nowy mock:
1. Dodaj handler do `tests/mocks/handlers.ts`
2. Server automatycznie użyje go w testach

## Custom Test Utils

Używaj `render` z `tests/utils/test-utils.tsx` zamiast domyślnego `render` z React Testing Library, aby mieć dostęp do globalnych providerów.
