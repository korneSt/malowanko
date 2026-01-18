# Plan wdrożenia usługi OpenRouter (MVP)

## 1. Opis usługi

Usługa `OpenRouterService` zapewnia zunifikowany interfejs do komunikacji z API OpenRouter dla wszystkich operacji AI w aplikacji Malowanko:

1. **Walidacja bezpieczeństwa promptu** (FR-009, FR-010) - sprawdzanie czy prompt jest odpowiedni dla dzieci
2. **Generowanie tagów** (FR-012) - automatyczne tworzenie 3-5 tagów w języku polskim
3. **Generowanie obrazków** (FR-011) - tworzenie kolorowanek line art przez Gemini

**Lokalizacja pliku:** `src/lib/services/openrouter.ts`

---

## 2. Konfiguracja

```typescript
// src/lib/services/openrouter.ts

const OPENROUTER_CONFIG = {
  baseUrl: "https://openrouter.ai/api/v1",
  models: {
    text: "openai/gpt-4o-mini", // Tani model dla tekstu (moderacja, tagi)
    image: "google/gemini-2.0-flash-exp:free", // Gemini do generowania obrazków
  },
  timeout: {
    text: 15000, // 15s dla operacji tekstowych
    image: 60000, // 60s dla generowania obrazków
  },
} as const;
```

### Wymagane zmienne środowiskowe

```env
# .env.local
OPENROUTER_API_KEY=sk-or-v1-...
```

---

## 3. Publiczne metody

### 3.1 `chatCompletion` - operacje tekstowe

Dla walidacji bezpieczeństwa i generowania tagów.

```typescript
export interface ChatCompletionOptions {
  systemMessage: string;
  userMessage: string;
  responseSchema: ResponseSchema;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatCompletionResult<T> {
  content: T;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

export async function chatCompletion<T>(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult<T>>;
```

### 3.2 `generateImage` - generowanie obrazków

Dla tworzenia kolorowanek przez Gemini.

```typescript
export interface GenerateImageOptions {
  /** Prompt opisujący obrazek do wygenerowania */
  prompt: string;
  /** Opcjonalnie: model (domyślnie Gemini) */
  model?: string;
}

export interface GenerateImageResult {
  /** Base64 encoded image data */
  imageBase64: string;
  /** MIME type obrazka (np. "image/png") */
  mimeType: string;
}

/**
 * Generuje obrazek przez Gemini via OpenRouter.
 *
 * @param options - Opcje generowania
 * @returns Base64 encoded image
 * @throws OpenRouterError - Gdy generowanie się nie powiedzie
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResult>;
```

---

## 4. Przykłady użycia

### 4.1 Walidacja bezpieczeństwa (FR-009, FR-010)

```typescript
const safetySchema: ResponseSchema = {
  name: "safety_check",
  schema: {
    type: "object",
    properties: {
      safe: { type: "boolean" },
      reason: { type: "string" },
    },
    required: ["safe"],
    additionalProperties: false,
  },
};

const result = await chatCompletion<{ safe: boolean; reason?: string }>({
  systemMessage: MODERATION_PROMPT,
  userMessage: userPrompt,
  responseSchema: safetySchema,
  temperature: 0,
});
```

### 4.2 Generowanie tagów (FR-012)

```typescript
const tagsSchema: ResponseSchema = {
  name: "tags",
  schema: {
    type: "object",
    properties: {
      tags: { type: "array", items: { type: "string" } },
    },
    required: ["tags"],
    additionalProperties: false,
  },
};

const result = await chatCompletion<{ tags: string[] }>({
  systemMessage: TAG_PROMPT,
  userMessage: prompt,
  responseSchema: tagsSchema,
  temperature: 0.3,
});
```

### 4.3 Generowanie obrazka kolorowanki (FR-011)

```typescript
const imagePrompt = `Create a black and white line art coloring page for children.
Subject: ${userPrompt}
Style: ${STYLE_DESCRIPTIONS[style]}
Age group: ${ageGroup}

Requirements:
- Pure black outlines on white background
- No shading, gradients, or filled areas  
- Clear lines suitable for coloring
- Child-friendly design`;

const result = await generateImage({ prompt: imagePrompt });

// result.imageBase64 zawiera obrazek w base64
// result.mimeType to "image/png" lub "image/jpeg"
```

---

## 5. Implementacja

### 5.1 Typy i klasa błędu

```typescript
export class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterError";
  }
}

interface SchemaProperty {
  type: "string" | "boolean" | "array";
  description?: string;
  items?: { type: "string" };
}

export interface ResponseSchema {
  name: string;
  schema: {
    type: "object";
    properties: Record<string, SchemaProperty>;
    required: string[];
    additionalProperties: false;
  };
}
```

### 5.2 Funkcje pomocnicze

```typescript
function getHeaders(): HeadersInit {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new OpenRouterError("OPENROUTER_API_KEY nie jest skonfigurowany");
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "Malowanko",
  };
}
```

### 5.3 Implementacja `chatCompletion`

```typescript
export async function chatCompletion<T>(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    OPENROUTER_CONFIG.timeout.text
  );

  try {
    const response = await fetch(
      `${OPENROUTER_CONFIG.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          model: options.model || OPENROUTER_CONFIG.models.text,
          messages: [
            { role: "system", content: options.systemMessage },
            { role: "user", content: options.userMessage },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: options.responseSchema.name,
              strict: true,
              schema: options.responseSchema.schema,
            },
          },
          temperature: options.temperature ?? 0,
          max_tokens: options.maxTokens ?? 200,
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new OpenRouterError(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content) as T;

    return {
      content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new OpenRouterError("Timeout");
    }
    throw error instanceof OpenRouterError
      ? error
      : new OpenRouterError("Nieoczekiwany błąd");
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### 5.4 Implementacja `generateImage`

```typescript
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    OPENROUTER_CONFIG.timeout.image
  );

  try {
    const response = await fetch(
      `${OPENROUTER_CONFIG.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          model: options.model || OPENROUTER_CONFIG.models.image,
          messages: [
            {
              role: "user",
              content: options.prompt,
            },
          ],
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new OpenRouterError(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const message = data.choices[0]?.message;

    // Gemini zwraca obrazki w content jako array z częściami
    // Szukamy części z typem "image"
    if (message?.content && Array.isArray(message.content)) {
      const imagePart = message.content.find(
        (part: { type: string }) => part.type === "image"
      );
      if (imagePart?.image_url?.url) {
        // Format: data:image/png;base64,xxxxx
        const dataUrl = imagePart.image_url.url;
        const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          return {
            mimeType: matches[1],
            imageBase64: matches[2],
          };
        }
      }
    }

    // Fallback: sprawdź czy odpowiedź to URL
    if (message?.content && typeof message.content === "string") {
      // Model zwrócił tekst zamiast obrazka
      throw new OpenRouterError("Model nie wygenerował obrazka");
    }

    throw new OpenRouterError("Nieoczekiwany format odpowiedzi");
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new OpenRouterError("Timeout generowania obrazka");
    }
    throw error instanceof OpenRouterError
      ? error
      : new OpenRouterError("Błąd generowania obrazka");
  } finally {
    clearTimeout(timeoutId);
  }
}
```

---

## 6. Refaktoryzacja image-generator.ts

Zaktualizowany plik `src/lib/services/image-generator.ts`:

```typescript
/**
 * Image Generator Service
 *
 * Generates coloring page images using Gemini via OpenRouter.
 */

import type { AgeGroup, ColoringStyle } from "@/app/types";
import type { ImageGenerationResult } from "./types";
import { generateImage, OpenRouterError } from "./openrouter";
import { logger } from "@/src/lib/utils/logger";

const STYLE_DESCRIPTIONS: Record<ColoringStyle, string> = {
  prosty:
    "Very simple shapes with thick bold lines, minimal details, large areas to color. For toddlers aged 0-3.",
  klasyczny:
    "Classic coloring book style with medium detail and clear outlines. For children aged 4-8.",
  szczegolowy:
    "Detailed illustration with many elements and finer lines. For older children aged 9-12.",
  mandala: "Circular symmetrical pattern with repeating geometric elements.",
};

const AGE_ADJUSTMENTS: Record<AgeGroup, string> = {
  "0-3": "Use very large, simple shapes. Maximum 3-4 main elements.",
  "4-8": "Use clear shapes with moderate complexity. Include 5-8 elements.",
  "9-12": "Can include intricate details. Allow for 10+ elements.",
};

function buildImagePrompt(
  userPrompt: string,
  ageGroup: AgeGroup,
  style: ColoringStyle
): string {
  return `Create a black and white line art coloring page for children.

Subject: ${userPrompt}
Target age: ${ageGroup} years old
Style: ${STYLE_DESCRIPTIONS[style]}

Requirements:
- Pure black outlines on white background
- No shading, gradients, or filled areas
- Clear, well-defined lines suitable for coloring
- Complexity: ${AGE_ADJUSTMENTS[ageGroup]}
- Friendly, child-appropriate design
- Centered composition
- No text or letters`;
}

/**
 * Generates a coloring page image using Gemini via OpenRouter.
 */
export async function generateColoringImage(
  prompt: string,
  ageGroup: AgeGroup,
  style: ColoringStyle
): Promise<ImageGenerationResult> {
  const fullPrompt = buildImagePrompt(prompt, ageGroup, style);

  logger.info("Generating coloring image", {
    prompt,
    ageGroup,
    style,
  });

  try {
    const result = await generateImage({ prompt: fullPrompt });

    // Konwertuj base64 na Buffer
    const imageData = Buffer.from(result.imageBase64, "base64");

    logger.info("Image generated successfully", {
      imageSize: imageData.length,
    });

    return {
      imageData,
      revisedPrompt: fullPrompt,
    };
  } catch (error) {
    logger.error("Image generation failed", { prompt, error });

    if (error instanceof OpenRouterError) {
      throw new Error(error.message);
    }
    throw new Error("Nie udało się wygenerować obrazka");
  }
}
```

---

## 7. Aktualizacja pozostałych serwisów

### 7.1 content-moderation.ts

```typescript
import { chatCompletion, type ResponseSchema } from "./openrouter";
import type { PromptSafetyResult } from "./types";
import { logger } from "@/src/lib/utils/logger";

const BLOCKED_KEYWORDS = [
  "przemoc",
  "violence",
  "krew",
  "blood",
  "śmierć",
  "death",
  "broń",
  "weapon",
  "nóż",
  "knife",
  "pistolet",
  "gun",
  "horror",
  "zombie",
  "demon",
  "diabeł",
  "devil",
  "narkotyki",
  "drugs",
  "alkohol",
  "seks",
  "sex",
  "nago",
];

const MODERATION_SYSTEM_PROMPT = `Jesteś moderatorem treści dla aplikacji kolorowanek dla dzieci 0-12 lat.
Oceń czy prompt jest BEZPIECZNY.

ODRZUĆ: przemoc, treści dla dorosłych, horror, narkotyki, dyskryminację.
AKCEPTUJ: zwierzęta, pojazdy, fantasy, sport, jedzenie, święta.`;

const safetySchema: ResponseSchema = {
  name: "safety_check",
  schema: {
    type: "object",
    properties: {
      safe: { type: "boolean" },
      reason: { type: "string" },
    },
    required: ["safe"],
    additionalProperties: false,
  },
};

export async function validatePromptSafety(
  prompt: string
): Promise<PromptSafetyResult> {
  // Szybki filtr słów kluczowych
  const lowerPrompt = prompt.toLowerCase();
  for (const keyword of BLOCKED_KEYWORDS) {
    if (lowerPrompt.includes(keyword)) {
      return { safe: false, reason: "Niedozwolone słowo" };
    }
  }

  try {
    const result = await chatCompletion<{ safe: boolean; reason?: string }>({
      systemMessage: MODERATION_SYSTEM_PROMPT,
      userMessage: prompt,
      responseSchema: safetySchema,
      temperature: 0,
      maxTokens: 100,
    });
    return result.content;
  } catch (error) {
    logger.error("Content moderation failed", { error });
    return { safe: true }; // Fail open
  }
}
```

### 7.2 tag-generator.ts

```typescript
import { chatCompletion, type ResponseSchema } from "./openrouter";
import { logger } from "@/src/lib/utils/logger";

const TAG_PROMPT = `Wygeneruj 3-5 tagów po polsku dla kolorowanki. Tagi to pojedyncze słowa, małe litery.`;

const tagsSchema: ResponseSchema = {
  name: "tags",
  schema: {
    type: "object",
    properties: {
      tags: { type: "array", items: { type: "string" } },
    },
    required: ["tags"],
    additionalProperties: false,
  },
};

const DEFAULT_TAGS = ["kolorowanka", "dla dzieci"];

export async function generateTags(prompt: string): Promise<string[]> {
  try {
    const result = await chatCompletion<{ tags: string[] }>({
      systemMessage: TAG_PROMPT,
      userMessage: prompt,
      responseSchema: tagsSchema,
      temperature: 0.3,
      maxTokens: 100,
    });
    return result.content.tags.slice(0, 5);
  } catch (error) {
    logger.error("Tag generation failed", { error });
    return DEFAULT_TAGS;
  }
}
```

---

## 8. Usunięcie zależności od OpenAI SDK

### 8.1 Usuń plik openai.ts

```bash
rm src/lib/services/openai.ts
```

### 8.2 Usuń pakiet openai z dependencies

```bash
pnpm remove openai
```

---

## 9. Obsługa błędów

Jedna prosta klasa błędu z fallbackami w serwisach:

| Serwis             | Błąd            | Fallback                        |
| ------------------ | --------------- | ------------------------------- |
| content-moderation | OpenRouterError | `{ safe: true }` - fail open    |
| tag-generator      | OpenRouterError | `["kolorowanka", "dla dzieci"]` |
| image-generator    | OpenRouterError | Throw - brak fallbacku          |

---

## 10. Plan wdrożenia

### Faza 1: Przygotowanie (10 min)

1. Dodaj zmienną środowiskową `OPENROUTER_API_KEY`
2. Usuń pakiet `openai`: `pnpm remove openai`

### Faza 2: Implementacja openrouter.ts (45 min)

Utwórz plik z obiema metodami: `chatCompletion` i `generateImage`.

### Faza 3: Aktualizacja serwisów (30 min)

1. Zaktualizuj `content-moderation.ts`
2. Zaktualizuj `tag-generator.ts`
3. Zaktualizuj `image-generator.ts`
4. Usuń `openai.ts`

### Faza 4: Testy (15 min)

| Test                    | Oczekiwany wynik                    |
| ----------------------- | ----------------------------------- |
| Moderacja - "kot"       | `{ safe: true }`                    |
| Moderacja - "zombie"    | `{ safe: false }`                   |
| Tagi - "kot na drzewie" | `["kot", "drzewo", "natura", ...]`  |
| Obrazek - "kot"         | Buffer z PNG/JPEG                   |
| Brak API key            | OpenRouterError, fallbacki działają |

---

## 11. Checklist

- [ ] Skonfigurowany `OPENROUTER_API_KEY`
- [ ] Utworzony `src/lib/services/openrouter.ts`
- [ ] Zaktualizowany `content-moderation.ts`
- [ ] Zaktualizowany `tag-generator.ts`
- [ ] Zaktualizowany `image-generator.ts`
- [ ] Usunięty `openai.ts`
- [ ] Usunięty pakiet `openai`
- [ ] Przetestowane wszystkie operacje

---

## 12. Zgodność z PRD

| Wymaganie PRD                        | Implementacja                                   |
| ------------------------------------ | ----------------------------------------------- |
| FR-009: Walidacja promptu przez AI   | `validatePromptSafety()` via OpenRouter         |
| FR-010: Przyjazny komunikat          | Serwis zwraca `{ safe: false, reason }`         |
| FR-011: Generowanie obrazka line art | `generateColoringImage()` via Gemini/OpenRouter |
| FR-012: Automatyczne 3-5 tagów       | `generateTags()` via OpenRouter                 |
| FR-015: Czas < 30s                   | 15s timeout tekst, 60s timeout obrazki          |
