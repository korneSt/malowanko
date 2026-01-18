# API Endpoint Implementation Plan: generateColorings

## 1. Przegląd punktu końcowego

Server action `generateColorings` odpowiada za generowanie nowych kolorowanek na podstawie opisu użytkownika. Jest to kluczowa funkcjonalność aplikacji Malowanko, która:

- Waliduje bezpieczeństwo wprowadzonego promptu przy użyciu GPT-4
- Generuje obrazki kolorowanek w stylu line art przy użyciu DALL-E 3
- Automatycznie generuje tagi w języku polskim przy użyciu GPT-4
- Zapisuje kolorowanki w bazie danych i Supabase Storage
- Zarządza dziennym limitem generowań (10/dzień)

**Lokalizacja pliku:** `src/lib/actions/colorings.ts`

---

## 2. Szczegóły żądania

### Sygnatura funkcji

```typescript
export async function generateColorings(
  input: GenerateColoringInput
): Promise<ActionResult<GenerateColoringResult>>;
```

### Parametry wejściowe

| Parametr   | Typ                     | Wymagany | Opis                                                  |
| ---------- | ----------------------- | -------- | ----------------------------------------------------- |
| `prompt`   | `string`                | ✅       | Opis kolorowanki (1-500 znaków)                       |
| `ageGroup` | `AgeGroup`              | ✅       | Grupa wiekowa: '0-3', '4-8', '9-12'                   |
| `style`    | `ColoringStyle`         | ✅       | Styl: 'prosty', 'klasyczny', 'szczegolowy', 'mandala' |
| `count`    | `1 \| 2 \| 3 \| 4 \| 5` | ✅       | Liczba wariantów do wygenerowania                     |

### Przykładowe żądanie

```json
{
  "prompt": "kot grający na gitarze",
  "ageGroup": "4-8",
  "style": "klasyczny",
  "count": 2
}
```

---

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

```typescript
// Z app/types.ts - istniejące typy
import type {
  GenerateColoringInput,
  GenerateColoringResult,
  ColoringDTO,
  ActionResult,
  ActionError,
  AgeGroup,
  ColoringStyle,
  ColoringInsert,
  ERROR_CODES,
} from "@/app/types";
```

### Nowe typy do utworzenia

```typescript
// src/lib/services/types.ts

/** Wynik walidacji bezpieczeństwa promptu */
export interface PromptSafetyResult {
  safe: boolean;
  reason?: string;
}

/** Wynik generowania obrazka */
export interface ImageGenerationResult {
  imageData: Buffer;
  revisedPrompt?: string;
}

/** Wynik generowania tagów */
export interface TagGenerationResult {
  tags: string[];
}
```

---

## 4. Szczegóły odpowiedzi

### Odpowiedź sukcesu

```json
{
  "success": true,
  "data": {
    "colorings": [
      {
        "id": "uuid-kolorowanki",
        "imageUrl": "https://storage.supabase.co/colorings/user-id/coloring-id.png",
        "prompt": "kot grający na gitarze",
        "tags": ["kot", "muzyka", "gitara", "zwierzęta"],
        "ageGroup": "4-8",
        "style": "klasyczny",
        "createdAt": "2026-01-03T12:00:00Z",
        "favoritesCount": 0
      }
    ],
    "remainingGenerations": 8
  }
}
```

### Odpowiedzi błędów

| Kod błędu              | Opis                         | Komunikat użytkownika                                                  |
| ---------------------- | ---------------------------- | ---------------------------------------------------------------------- |
| `UNAUTHORIZED`         | Użytkownik niezalogowany     | "Musisz być zalogowany, aby wykonać tę akcję."                         |
| `DAILY_LIMIT_EXCEEDED` | Przekroczony dzienny limit   | "Wykorzystałeś dzienny limit generowań. Wróć jutro!"                   |
| `INVALID_PROMPT`       | Pusty prompt lub >500 znaków | "Opis kolorowanki jest nieprawidłowy."                                 |
| `VALIDATION_ERROR`     | Błędne dane wejściowe        | "Wprowadzone dane są nieprawidłowe."                                   |
| `UNSAFE_CONTENT`       | Nieodpowiednia treść         | "Ups! Ten temat nie nadaje się do kolorowanki. Spróbuj czegoś innego." |
| `GENERATION_FAILED`    | Błąd API OpenAI              | "Nie udało się wygenerować kolorowanki. Spróbuj ponownie."             |
| `GENERATION_TIMEOUT`   | Przekroczony timeout 30s     | "Generowanie trwa zbyt długo. Spróbuj ponownie."                       |
| `INTERNAL_ERROR`       | Nieoczekiwany błąd serwera   | "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później."               |

---

## 5. Przepływ danych

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              KLIENT                                          │
│  GenerateColoringInput { prompt, ageGroup, style, count }                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. WALIDACJA WEJŚCIA (Zod)                                                 │
│     - Sprawdź format danych                                                 │
│     - prompt: 1-500 znaków                                                  │
│     - ageGroup: enum validation                                             │
│     - style: enum validation                                                │
│     - count: 1-5                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  2. UWIERZYTELNIENIE                                                        │
│     - Pobierz sesję z Supabase Auth                                         │
│     - Sprawdź czy użytkownik jest zalogowany                                │
│     ❌ UNAUTHORIZED jeśli brak sesji                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. SPRAWDZENIE LIMITU DZIENNEGO                                            │
│     - Wywołaj check_and_update_daily_limit(user_id, count)                  │
│     - Atomowo sprawdź i rezerwuj limit                                      │
│     ❌ DAILY_LIMIT_EXCEEDED jeśli limit przekroczony                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  4. WALIDACJA BEZPIECZEŃSTWA PROMPTU (GPT-4)                                │
│     - Wyślij prompt do analizy                                              │
│     - Sprawdź czy treść jest odpowiednia dla dzieci                         │
│     ❌ UNSAFE_CONTENT jeśli treść nieodpowiednia                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  5. GENEROWANIE OBRAZKÓW (DALL-E 3) - równolegle dla count > 1              │
│     - Zbuduj system prompt z parametrami (ageGroup, style)                  │
│     - Wygeneruj count obrazków line art                                     │
│     - Timeout: 30 sekund                                                    │
│     ❌ GENERATION_FAILED lub GENERATION_TIMEOUT                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  6. GENEROWANIE TAGÓW (GPT-4) - można wykonać równolegle z obrazkami        │
│     - Wygeneruj 3-5 tagów w języku polskim                                  │
│     - Tagi opisują tematykę kolorowanki                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  7. UPLOAD OBRAZKÓW DO SUPABASE STORAGE                                     │
│     - Ścieżka: colorings/{user_id}/{coloring_id}.png                        │
│     - Uzyskaj publiczny URL                                                 │
│     ❌ GENERATION_FAILED przy błędzie uploadu                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  8. ZAPIS DO BAZY DANYCH                                                    │
│     - Wstaw rekordy do tabeli colorings                                     │
│     - Trigger automatycznie dodaje do user_library                          │
│     ❌ INTERNAL_ERROR przy błędzie bazy                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  9. POBIERZ POZOSTAŁY LIMIT                                                 │
│     - Wywołaj get_remaining_generations(user_id)                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  10. MAPOWANIE NA DTO I ZWROT                                               │
│      - Zamień rekordy DB na ColoringDTO[]                                   │
│      - Zwróć ActionResult<GenerateColoringResult>                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Względy bezpieczeństwa

### 6.1 Uwierzytelnienie

- **Wymagane**: Użytkownik musi być zalogowany przez Supabase Auth
- Sesja weryfikowana przy każdym wywołaniu server action
- Tokeny sesji przechowywane w HTTP-only cookies

### 6.2 Autoryzacja

- Użytkownik może generować tylko dla siebie (user_id z sesji)
- RLS policy na tabeli `colorings` wymusza `auth.uid() = user_id`
- Storage policy wymaga autentykacji do uploadu

### 6.3 Walidacja danych wejściowych

| Pole       | Walidacja                                             |
| ---------- | ----------------------------------------------------- |
| `prompt`   | Min 1, max 500 znaków, trimmed                        |
| `ageGroup` | Enum: '0-3', '4-8', '9-12'                            |
| `style`    | Enum: 'prosty', 'klasyczny', 'szczegolowy', 'mandala' |
| `count`    | Integer 1-5, nie większy niż pozostały limit          |

### 6.4 Content Moderation

- GPT-4 analizuje prompt przed generowaniem
- Blokuje treści nieodpowiednie dla dzieci:
  - Przemoc
  - Treści dla dorosłych
  - Straszne/przerażające tematy
  - Treści polityczne/religijne (kontrowersyjne)

### 6.5 Rate Limiting

- Dzienny limit: 10 generowań na użytkownika
- Limit resetowany o północy (baza danych sprawdza datę)
- Atomowa operacja check-and-update zapobiega race conditions

### 6.6 Ochrona przed atakami

| Zagrożenie       | Mitygacja                                     |
| ---------------- | --------------------------------------------- |
| SQL Injection    | Parameterized queries (Supabase client)       |
| XSS              | React escaping, brak raw HTML                 |
| CSRF             | Server Actions z tokenami Next.js             |
| Prompt Injection | Content moderation, ograniczony system prompt |
| DoS              | Dzienny limit, timeout 30s                    |

---

## 7. Obsługa błędów

### 7.1 Strategia obsługi błędów

```typescript
// Wczesne zwracanie błędów (early returns)
if (!session) {
  return { success: false, error: { code: "UNAUTHORIZED", message: "..." } };
}

if (!limitOk) {
  return {
    success: false,
    error: { code: "DAILY_LIMIT_EXCEEDED", message: "..." },
  };
}

// Blok try-catch dla operacji zewnętrznych
try {
  const result = await generateImage(prompt);
} catch (error) {
  logger.error("Image generation failed", { error, userId, prompt });
  return {
    success: false,
    error: { code: "GENERATION_FAILED", message: "..." },
  };
}
```

### 7.2 Scenariusze błędów

| Scenariusz            | Kod błędu              | Akcja                                    |
| --------------------- | ---------------------- | ---------------------------------------- |
| Brak sesji            | `UNAUTHORIZED`         | Zwróć błąd, redirect do logowania        |
| Limit wyczerpany      | `DAILY_LIMIT_EXCEEDED` | Zwróć błąd z info o resecie              |
| Pusty/za długi prompt | `INVALID_PROMPT`       | Zwróć błąd walidacji                     |
| Nieprawidłowe dane    | `VALIDATION_ERROR`     | Zwróć szczegóły błędu Zod                |
| Nieodpowiednia treść  | `UNSAFE_CONTENT`       | Zwróć błąd, nie loguj promptu            |
| Błąd OpenAI API       | `GENERATION_FAILED`    | Zaloguj błąd, zwróć generyczny komunikat |
| Timeout 30s           | `GENERATION_TIMEOUT`   | Przerwij operację, zwróć błąd            |
| Błąd uploadu Storage  | `GENERATION_FAILED`    | Rollback DB, zwróć błąd                  |
| Błąd zapisu DB        | `INTERNAL_ERROR`       | Usuń obrazki ze Storage, zwróć błąd      |

### 7.3 Logowanie błędów

```typescript
// src/lib/utils/logger.ts
export const logger = {
  error: (message: string, context: Record<string, unknown>) => {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        ...context,
        timestamp: new Date().toISOString(),
      })
    );
  },
  warn: (message: string, context: Record<string, unknown>) => {
    console.warn(
      JSON.stringify({
        level: "warn",
        message,
        ...context,
        timestamp: new Date().toISOString(),
      })
    );
  },
  info: (message: string, context: Record<string, unknown>) => {
    console.info(
      JSON.stringify({
        level: "info",
        message,
        ...context,
        timestamp: new Date().toISOString(),
      })
    );
  },
};
```

---

## 8. Rozważania dotyczące wydajności

### 8.1 Wąskie gardła

| Operacja             | Czas           | Mitygacja                           |
| -------------------- | -------------- | ----------------------------------- |
| DALL-E 3 generowanie | 10-25s/obrazek | Równoległe generowanie, timeout 30s |
| GPT-4 moderation     | 1-3s           | Wykonaj przed generowaniem obrazków |
| GPT-4 tagi           | 1-2s           | Równolegle z generowaniem obrazków  |
| Storage upload       | 0.5-2s/obrazek | Równoległy upload                   |
| DB insert            | <100ms         | Batch insert                        |

### 8.2 Strategie optymalizacji

1. **Równoległe wykonywanie**:

   ```typescript
   // Generuj obrazki równolegle
   const imagePromises = Array.from({ length: count }, () =>
     generateImage(prompt, ageGroup, style)
   );

   // Generuj tagi równolegle z obrazkami
   const [images, tags] = await Promise.all([
     Promise.all(imagePromises),
     generateTags(prompt),
   ]);
   ```

2. **Timeout z AbortController**:

   ```typescript
   const controller = new AbortController();
   const timeout = setTimeout(() => controller.abort(), 30000);

   try {
     const result = await openai.images.generate(
       {
         // ...
       },
       { signal: controller.signal }
     );
   } finally {
     clearTimeout(timeout);
   }
   ```

3. **Optymistyczna walidacja limitu**:
   - Sprawdź limit przed generowaniem
   - Zarezerwuj count w jednej transakcji

### 8.3 Limity zasobów

| Zasób               | Limit                 | Monitorowanie               |
| ------------------- | --------------------- | --------------------------- |
| OpenAI API calls    | Według planu OpenAI   | Logowanie kosztów           |
| Supabase Storage    | Według planu Supabase | Rozmiar bucketa             |
| Supabase DB         | Według planu Supabase | Liczba rekordów             |
| Vercel Edge timeout | 30s (default)         | Ustawienie w next.config.ts |

---

## 9. Etapy wdrożenia

### Faza 1: Przygotowanie struktury (1-2h)

#### 1.1 Utwórz strukturę katalogów

```
src/
├── lib/
│   ├── actions/
│   │   └── colorings.ts
│   ├── services/
│   │   ├── openai.ts
│   │   ├── content-moderation.ts
│   │   ├── image-generator.ts
│   │   ├── tag-generator.ts
│   │   └── generation-limit.ts
│   ├── validations/
│   │   └── coloring.ts
│   └── utils/
│       ├── logger.ts
│       └── error-helpers.ts
```

#### 1.2 Zainstaluj wymagane zależności

```bash
pnpm add openai zod
```

#### 1.3 Dodaj zmienne środowiskowe

```env
# .env.local
OPENAI_API_KEY=sk-...
```

---

### Faza 2: Implementacja serwisów (3-4h)

#### 2.1 OpenAI Client (`src/lib/services/openai.ts`)

```typescript
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

#### 2.2 Content Moderation (`src/lib/services/content-moderation.ts`)

Implementacja:

- Funkcja `validatePromptSafety(prompt: string): Promise<PromptSafetyResult>`
- System prompt dla GPT-4 wyjaśniający kontekst (kolorowanki dla dzieci)
- Parsowanie odpowiedzi JSON
- Obsługa błędów API

#### 2.3 Image Generator (`src/lib/services/image-generator.ts`)

Implementacja:

- Funkcja `generateColoringImage(prompt, ageGroup, style): Promise<ImageGenerationResult>`
- Budowanie system promptu z parametrami stylu
- Wywołanie DALL-E 3 z odpowiednimi parametrami:
  - `model: "dall-e-3"`
  - `size: "1024x1024"`
  - `quality: "standard"`
  - `style: "natural"` (dla line art)
- Pobieranie obrazka jako Buffer
- Obsługa timeout (AbortController)

#### 2.4 Tag Generator (`src/lib/services/tag-generator.ts`)

Implementacja:

- Funkcja `generateTags(prompt: string): Promise<string[]>`
- System prompt dla generowania 3-5 tagów po polsku
- Parsowanie odpowiedzi JSON
- Fallback do pustej tablicy przy błędzie

#### 2.5 Generation Limit (`src/lib/services/generation-limit.ts`)

Implementacja:

- Funkcja `checkAndReserveLimit(userId, count): Promise<{ allowed: boolean }>`
- Funkcja `getRemainingGenerations(userId): Promise<number>`
- Użycie funkcji bazodanowych `check_and_update_daily_limit` i `get_remaining_generations`

---

### Faza 3: Walidacja (1h)

#### 3.1 Zod Schemas (`src/lib/validations/coloring.ts`)

```typescript
import { z } from "zod";

export const ageGroupSchema = z.enum(["0-3", "4-8", "9-12"]);
export const styleSchema = z.enum([
  "prosty",
  "klasyczny",
  "szczegolowy",
  "mandala",
]);

export const generateColoringSchema = z.object({
  prompt: z
    .string()
    .min(1, "Opis jest wymagany")
    .max(500, "Opis może mieć maksymalnie 500 znaków")
    .transform((val) => val.trim()),
  ageGroup: ageGroupSchema,
  style: styleSchema,
  count: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
});

export type GenerateColoringSchemaInput = z.input<
  typeof generateColoringSchema
>;
export type GenerateColoringSchemaOutput = z.output<
  typeof generateColoringSchema
>;
```

---

### Faza 4: Implementacja Server Action (2-3h)

#### 4.1 Główny plik (`src/lib/actions/colorings.ts`)

```typescript
"use server";

import { createClient } from "@/app/db/server";
import type {
  ActionResult,
  GenerateColoringInput,
  GenerateColoringResult,
  ColoringDTO,
} from "@/app/types";
import { ERROR_CODES } from "@/app/types";
import { generateColoringSchema } from "@/lib/validations/coloring";
import { validatePromptSafety } from "@/lib/services/content-moderation";
import { generateColoringImage } from "@/lib/services/image-generator";
import { generateTags } from "@/lib/services/tag-generator";
import {
  checkAndReserveLimit,
  getRemainingGenerations,
} from "@/lib/services/generation-limit";
import { logger } from "@/lib/utils/logger";
import { createActionError } from "@/lib/utils/error-helpers";

export async function generateColorings(
  input: GenerateColoringInput
): Promise<ActionResult<GenerateColoringResult>> {
  // 1. Walidacja wejścia
  const parseResult = generateColoringSchema.safeParse(input);
  if (!parseResult.success) {
    return createActionError(
      ERROR_CODES.VALIDATION_ERROR,
      "Wprowadzone dane są nieprawidłowe."
    );
  }
  const { prompt, ageGroup, style, count } = parseResult.data;

  // 2. Uwierzytelnienie
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return createActionError(
      ERROR_CODES.UNAUTHORIZED,
      "Musisz być zalogowany, aby wykonać tę akcję."
    );
  }

  // 3. Sprawdzenie limitu
  const limitResult = await checkAndReserveLimit(user.id, count);
  if (!limitResult.allowed) {
    return createActionError(
      ERROR_CODES.DAILY_LIMIT_EXCEEDED,
      "Wykorzystałeś dzienny limit generowań. Wróć jutro!"
    );
  }

  // 4. Walidacja bezpieczeństwa promptu
  const safetyResult = await validatePromptSafety(prompt);
  if (!safetyResult.safe) {
    return createActionError(
      ERROR_CODES.UNSAFE_CONTENT,
      "Ups! Ten temat nie nadaje się do kolorowanki. Spróbuj czegoś innego."
    );
  }

  try {
    // 5 & 6. Generowanie obrazków i tagów równolegle
    const [images, tags] = await Promise.all([
      Promise.all(
        Array.from({ length: count }, () =>
          generateColoringImage(prompt, ageGroup, style)
        )
      ),
      generateTags(prompt),
    ]);

    // 7 & 8. Upload i zapis do bazy
    const colorings: ColoringDTO[] = [];
    for (const image of images) {
      const coloringId = crypto.randomUUID();
      const storagePath = `${user.id}/${coloringId}.png`;

      // Upload do Storage
      const { error: uploadError } = await supabase.storage
        .from("colorings")
        .upload(storagePath, image.imageData, {
          contentType: "image/png",
          cacheControl: "31536000",
        });

      if (uploadError) {
        logger.error("Storage upload failed", {
          userId: user.id,
          coloringId,
          error: uploadError,
        });
        throw new Error("Upload failed");
      }

      // Pobierz publiczny URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("colorings").getPublicUrl(storagePath);

      // Wstaw do bazy
      const { data: coloring, error: dbError } = await supabase
        .from("colorings")
        .insert({
          id: coloringId,
          user_id: user.id,
          image_url: publicUrl,
          prompt,
          tags,
          age_group: ageGroup,
          style,
        })
        .select()
        .single();

      if (dbError) {
        // Rollback: usuń obrazek ze storage
        await supabase.storage.from("colorings").remove([storagePath]);
        logger.error("Database insert failed", {
          userId: user.id,
          coloringId,
          error: dbError,
        });
        throw new Error("Database insert failed");
      }

      colorings.push({
        id: coloring.id,
        imageUrl: coloring.image_url,
        prompt: coloring.prompt,
        tags: coloring.tags,
        ageGroup: coloring.age_group as AgeGroup,
        style: coloring.style as ColoringStyle,
        createdAt: coloring.created_at,
        favoritesCount: coloring.favorites_count,
      });
    }

    // 9. Pobierz pozostały limit
    const remainingGenerations = await getRemainingGenerations(user.id);

    // 10. Zwróć wynik
    return {
      success: true,
      data: {
        colorings,
        remainingGenerations,
      },
    };
  } catch (error) {
    logger.error("Generation failed", { userId: user.id, prompt, error });

    if (error instanceof Error && error.name === "AbortError") {
      return createActionError(
        ERROR_CODES.GENERATION_TIMEOUT,
        "Generowanie trwa zbyt długo. Spróbuj ponownie."
      );
    }

    return createActionError(
      ERROR_CODES.GENERATION_FAILED,
      "Nie udało się wygenerować kolorowanki. Spróbuj ponownie."
    );
  }
}
```

---

### Faza 5: Pomocnicze utilities (30min)

#### 5.1 Error Helpers (`src/lib/utils/error-helpers.ts`)

```typescript
import type { ActionResult, ErrorCode } from "@/app/types";

export function createActionError<T>(
  code: ErrorCode,
  message: string
): ActionResult<T> {
  return {
    success: false,
    error: { code, message },
  };
}
```

#### 5.2 Logger (`src/lib/utils/logger.ts`)

```typescript
type LogLevel = "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, context: LogContext = {}) {
  const entry = {
    level,
    message,
    ...context,
    timestamp: new Date().toISOString(),
  };

  const method =
    level === "error"
      ? console.error
      : level === "warn"
      ? console.warn
      : console.info;
  method(JSON.stringify(entry));
}

export const logger = {
  info: (message: string, context?: LogContext) =>
    log("info", message, context),
  warn: (message: string, context?: LogContext) =>
    log("warn", message, context),
  error: (message: string, context?: LogContext) =>
    log("error", message, context),
};
```

---

### Faza 6: Testy manualne i weryfikacja (1-2h)

#### 6.1 Scenariusze testowe

| Test                         | Oczekiwany wynik           |
| ---------------------------- | -------------------------- |
| Wywołanie bez zalogowania    | UNAUTHORIZED               |
| Pusty prompt                 | VALIDATION_ERROR           |
| Prompt > 500 znaków          | VALIDATION_ERROR           |
| Nieprawidłowa grupa wiekowa  | VALIDATION_ERROR           |
| Nieprawidłowy styl           | VALIDATION_ERROR           |
| count = 0 lub > 5            | VALIDATION_ERROR           |
| count > pozostałego limitu   | DAILY_LIMIT_EXCEEDED       |
| Nieodpowiednia treść promptu | UNSAFE_CONTENT             |
| Poprawne dane                | success: true, kolorowanki |
| Sprawdź trigger user_library | Automatyczne dodanie       |
| Sprawdź aktualizację limitu  | Zmniejszony remaining      |

#### 6.2 Weryfikacja

- [ ] Obrazki zapisane w Storage pod ścieżką `colorings/{user_id}/{id}.png`
- [ ] Rekordy w tabeli `colorings` mają poprawne dane
- [ ] Rekordy w tabeli `user_library` utworzone przez trigger
- [ ] Limit dzienny zaktualizowany w `profiles`
- [ ] Publiczny URL obrazka działa

---

## 10. Prompty dla OpenAI

### 10.1 Content Moderation Prompt

```
You are a content moderator for a children's coloring book application called "Malowanko".
Your task is to analyze user prompts and determine if they are appropriate for children aged 0-12.

REJECT prompts that contain or suggest:
- Violence, weapons, or fighting
- Adult or sexual content
- Scary, horror, or disturbing themes
- Death, illness, or suffering
- Controversial political or religious content
- Drugs, alcohol, or smoking
- Bullying or discrimination

ACCEPT prompts about:
- Animals, nature, plants
- Vehicles, buildings, objects
- Fantasy (friendly dragons, unicorns, fairies)
- Sports, hobbies, activities
- Food, clothing, toys
- Seasons, holidays, celebrations
- Professions, characters
- Simple abstract patterns

Respond with JSON:
{
  "safe": boolean,
  "reason": "Brief explanation if unsafe"
}
```

### 10.2 Image Generation Prompt Template

```
Create a black and white line art coloring page for children.

Subject: {prompt}
Target age group: {ageGroup}
Style: {styleDescription}

Requirements:
- Pure black outlines on white background
- No shading, gradients, or filled areas
- Clear, well-defined lines suitable for coloring
- Age-appropriate complexity
- Friendly, appealing design
- Centered composition with good use of space

Style specifications:
- prosty: Very simple shapes, thick lines, minimal details (for ages 0-3)
- klasyczny: Classic coloring book style, medium detail (for ages 4-8)
- szczegolowy: Detailed illustration with many elements (for ages 9-12)
- mandala: Circular, symmetrical pattern with repeating elements
```

### 10.3 Tag Generation Prompt

```
Generate 3-5 descriptive tags in Polish for a coloring page based on this description:
"{prompt}"

Requirements:
- Tags should be single words or short phrases in Polish
- Tags should describe the main subjects, themes, and categories
- Use lowercase
- Return as JSON array

Example output: ["zwierzęta", "kot", "muzyka", "zabawa"]
```

---

## 11. Diagram sekwencji

```
┌─────┐          ┌──────────────┐     ┌─────────┐     ┌──────────┐     ┌─────────┐
│Client│          │generateColorings│   │Supabase │     │ OpenAI   │     │ Storage │
└──┬──┘          └──────┬───────┘     └────┬────┘     └────┬─────┘     └────┬────┘
   │                    │                   │               │               │
   │ input              │                   │               │               │
   │───────────────────>│                   │               │               │
   │                    │                   │               │               │
   │                    │ getUser()         │               │               │
   │                    │──────────────────>│               │               │
   │                    │<──────────────────│               │               │
   │                    │                   │               │               │
   │                    │ checkLimit()      │               │               │
   │                    │──────────────────>│               │               │
   │                    │<──────────────────│               │               │
   │                    │                   │               │               │
   │                    │ validateSafety()  │               │               │
   │                    │───────────────────────────────────>               │
   │                    │<───────────────────────────────────               │
   │                    │                   │               │               │
   │                    │        ┌──────────┴───────────────┤               │
   │                    │        │ generateImages() + generateTags()        │
   │                    │        │ (parallel)               │               │
   │                    │<───────┴──────────────────────────┤               │
   │                    │                   │               │               │
   │                    │                   │               │ upload()      │
   │                    │───────────────────────────────────────────────────>
   │                    │<───────────────────────────────────────────────────
   │                    │                   │               │               │
   │                    │ insert()          │               │               │
   │                    │──────────────────>│               │               │
   │                    │<──────────────────│               │               │
   │                    │                   │               │               │
   │                    │ getRemaining()    │               │               │
   │                    │──────────────────>│               │               │
   │                    │<──────────────────│               │               │
   │                    │                   │               │               │
   │ ActionResult       │                   │               │               │
   │<───────────────────│                   │               │               │
   │                    │                   │               │               │
```

---

## 12. Checklist przed wdrożeniem

- [ ] Zainstalowane zależności: `openai`, `zod`
- [ ] Skonfigurowana zmienna `OPENAI_API_KEY`
- [ ] Utworzona struktura katalogów `src/lib/...`
- [ ] Utworzony bucket `colorings` w Supabase Storage
- [ ] Skonfigurowane Storage policies (public read, authenticated upload)
- [ ] Zweryfikowane funkcje bazodanowe (`check_and_update_daily_limit`, `get_remaining_generations`)
- [ ] Zweryfikowany trigger `add_coloring_to_library`
- [ ] Testy manualne wszystkich scenariuszy
- [ ] Sprawdzone limity OpenAI API
- [ ] Sprawdzone timeout Vercel (30s)
