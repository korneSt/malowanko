# Plan wdrożenia: Gallery Queries

## 1. Przegląd punktu końcowego

Funkcje zapytań do galerii publicznej umożliwiają pobieranie kolorowanek z filtrowaniem, wyszukiwaniem i paginacją. Implementacja obejmuje dwie funkcje:

1. **`getPublicGallery`** - Pobiera listę kolorowanek z filtrowaniem, wyszukiwaniem i paginacją
2. **`getColoringById`** - Pobiera pojedynczą kolorowankę po ID (dla widoku szczegółowego/druku)

Funkcje są zaprojektowane jako **queries** (nie server actions), przeznaczone do użycia w Server Components Next.js. Działają zarówno dla zalogowanych, jak i niezalogowanych użytkowników. Dla zalogowanych użytkowników dodatkowo zwracają informację o statusie ulubionych (`isFavorited`).

**Lokalizacja:** `src/lib/queries/gallery.ts`

---

## 2. Szczegóły żądania

### 2.1 `getPublicGallery`

**Sygnatura:**
```typescript
export async function getPublicGallery(
  params: GalleryQueryParams
): Promise<PaginatedResponse<GalleryColoringDTO>>
```

**Parametry (`GalleryQueryParams`):**

| Parametr | Typ | Wymagany | Domyślna wartość | Opis |
|----------|-----|----------|------------------|------|
| `page` | `number` | Nie | `1` | Numer strony (min: 1) |
| `limit` | `number` | Nie | `20` | Liczba elementów na stronę (min: 1, max: 50) |
| `search` | `string` | Nie | - | Zapytanie wyszukiwania (przeszukuje `prompt` i `tags`) |
| `ageGroups` | `AgeGroup[]` | Nie | - | Filtrowanie po grupach wiekowych (`'0-3'`, `'4-8'`, `'9-12'`) |
| `styles` | `ColoringStyle[]` | Nie | - | Filtrowanie po stylach (`'prosty'`, `'klasyczny'`, `'szczegolowy'`, `'mandala'`) |
| `sortBy` | `'newest' \| 'popular'` | Nie | `'newest'` | Sortowanie wyników |

**Przykład użycia:**
```typescript
const result = await getPublicGallery({
  page: 1,
  limit: 20,
  search: "kot",
  ageGroups: ["4-8"],
  styles: ["klasyczny"],
  sortBy: "popular"
});
```

### 2.2 `getColoringById`

**Sygnatura:**
```typescript
export async function getColoringById(
  id: string
): Promise<GalleryColoringDTO | null>
```

**Parametry:**

| Parametr | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `id` | `string` | Tak | UUID kolorowanki |

**Przykład użycia:**
```typescript
const coloring = await getColoringById("123e4567-e89b-12d3-a456-426614174000");
```

---

## 3. Wykorzystywane typy

### 3.1 Typy wejściowe

**`GalleryQueryParams`** (z `app/types.ts`):
```typescript
export interface GalleryQueryParams extends GalleryFilters, PaginationParams {}

export interface GalleryFilters {
  search?: string;
  ageGroups?: AgeGroup[];
  styles?: ColoringStyle[];
  sortBy: SortOrder;
}

export interface PaginationParams {
  page: number;
  limit: number;
}
```

**`AgeGroup`** (z `app/types.ts`):
```typescript
export type AgeGroup = "0-3" | "4-8" | "9-12";
```

**`ColoringStyle`** (z `app/types.ts`):
```typescript
export type ColoringStyle = "prosty" | "klasyczny" | "szczegolowy" | "mandala";
```

**`SortOrder`** (z `app/types.ts`):
```typescript
export type SortOrder = "newest" | "popular";
```

### 3.2 Typy wyjściowe

**`PaginatedResponse<GalleryColoringDTO>`** (z `app/types.ts`):
```typescript
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**`GalleryColoringDTO`** (z `app/types.ts`):
```typescript
export interface GalleryColoringDTO extends ColoringDTO {
  isFavorited?: boolean; // Tylko dla zalogowanych użytkowników
}

export interface ColoringDTO {
  id: string;
  imageUrl: string;
  prompt: string;
  tags: string[];
  ageGroup: AgeGroup;
  style: ColoringStyle;
  createdAt: string;
  favoritesCount: number;
}
```

### 3.3 Typy bazy danych

**`ColoringRow`** (z `app/db/database.types.ts`):
- Reprezentuje wiersz z tabeli `colorings`
- Zawiera pola w formacie snake_case: `id`, `user_id`, `image_url`, `prompt`, `tags`, `age_group`, `style`, `created_at`, `favorites_count`

**`FavoritesRow`** (z `app/db/database.types.ts`):
- Reprezentuje wiersz z tabeli `favorites`
- Zawiera: `user_id`, `coloring_id`, `created_at`

---

## 4. Szczegóły odpowiedzi

### 4.1 `getPublicGallery` - Sukces

**Status:** `200 OK` (implicit - funkcja zwraca dane)

**Struktura odpowiedzi:**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "imageUrl": "https://[supabase-url]/storage/v1/object/public/colorings/...",
      "prompt": "kot grający na gitarze",
      "tags": ["kot", "muzyka", "gitara"],
      "ageGroup": "4-8",
      "style": "klasyczny",
      "createdAt": "2026-01-03T12:00:00Z",
      "favoritesCount": 42,
      "isFavorited": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Uwagi:**
- `isFavorited` jest obecne tylko dla zalogowanych użytkowników
- Dla niezalogowanych użytkowników `isFavorited` jest `undefined`
- `total` reprezentuje całkowitą liczbę kolorowanek spełniających kryteria filtrowania
- `totalPages` jest obliczane jako `Math.ceil(total / limit)`

### 4.2 `getColoringById` - Sukces

**Status:** `200 OK` (implicit)

**Struktura odpowiedzi:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "imageUrl": "https://[supabase-url]/storage/v1/object/public/colorings/...",
  "prompt": "kot grający na gitarze",
  "tags": ["kot", "muzyka", "gitara"],
  "ageGroup": "4-8",
  "style": "klasyczny",
  "createdAt": "2026-01-03T12:00:00Z",
  "favoritesCount": 42,
  "isFavorited": true
}
```

**Uwagi:**
- Zwraca `null` jeśli kolorowanka nie istnieje
- `isFavorited` jest obecne tylko dla zalogowanych użytkowników

---

## 5. Przepływ danych

### 5.1 `getPublicGallery` - Przepływ

```
1. Walidacja parametrów wejściowych
   ↓
2. Normalizacja parametrów (ustawienie wartości domyślnych)
   ↓
3. Utworzenie klienta Supabase (createClient)
   ↓
4. Sprawdzenie autentykacji użytkownika (opcjonalne)
   ↓
5. Budowa zapytania Supabase:
   - Bazowe zapytanie: .from('colorings').select('*')
   - Filtrowanie po ageGroups (jeśli podane)
   - Filtrowanie po styles (jeśli podane)
   - Wyszukiwanie w prompt i tags (jeśli search podane)
   - Sortowanie (created_at DESC lub favorites_count DESC)
   ↓
6. Wykonanie zapytania z paginacją:
   - .range((page - 1) * limit, page * limit - 1)
   ↓
7. Pobranie całkowitej liczby wyników (count)
   ↓
8. Dla zalogowanych użytkowników:
   - Pobranie listy ID ulubionych kolorowanek użytkownika
   - Mapowanie isFavorited dla każdej kolorowanki
   ↓
9. Mapowanie wyników z bazy (snake_case) do DTO (camelCase)
   ↓
10. Zwrócenie PaginatedResponse<GalleryColoringDTO>
```

### 5.2 `getColoringById` - Przepływ

```
1. Walidacja parametru id (UUID format)
   ↓
2. Utworzenie klienta Supabase (createClient)
   ↓
3. Sprawdzenie autentykacji użytkownika (opcjonalne)
   ↓
4. Pobranie kolorowanki z bazy:
   - .from('colorings').select('*').eq('id', id).single()
   ↓
5. Sprawdzenie czy kolorowanka istnieje (jeśli null, zwróć null)
   ↓
6. Dla zalogowanych użytkowników:
   - Sprawdzenie czy kolorowanka jest w ulubionych
   - Ustawienie isFavorited
   ↓
7. Mapowanie wyniku z bazy (snake_case) do DTO (camelCase)
   ↓
8. Zwrócenie GalleryColoringDTO | null
```

### 5.3 Interakcje z bazą danych

**Tabele używane:**
- `colorings` - główna tabela z kolorowankami
- `favorites` - tabela z ulubionymi (tylko dla zalogowanych użytkowników)

**Indeksy wykorzystywane:**
- `idx_colorings_created_at` - dla sortowania "newest"
- `idx_colorings_favorites_count` - dla sortowania "popular"
- `idx_colorings_age_group` - dla filtrowania po grupie wiekowej
- `idx_colorings_tags` (GIN) - dla wyszukiwania w tagach
- `idx_colorings_prompt_search` (GIN) - dla wyszukiwania w promptach
- `idx_favorites_user_id` - dla sprawdzania ulubionych

**RLS Policies:**
- `colorings`: "Anyone can view colorings" - pozwala na odczyt wszystkim (anon, authenticated)
- `favorites`: "Users can view own favorites" - pozwala na odczyt tylko własnych ulubionych

---

## 6. Względy bezpieczeństwa

### 6.1 Autentykacja

- **Nie jest wymagana** - funkcje działają dla wszystkich użytkowników (publiczne)
- Dla zalogowanych użytkowników dodatkowo zwracana jest informacja o ulubionych
- Sprawdzenie autentykacji: `supabase.auth.getUser()` (opcjonalne)

### 6.2 Autoryzacja

- **RLS (Row Level Security)** chroni dane na poziomie bazy danych
- Polityka `"Anyone can view colorings"` pozwala na odczyt wszystkich kolorowanek
- Polityka `"Users can view own favorites"` chroni dane ulubionych użytkowników
- `user_id` nie jest eksponowany w odpowiedziach (ukryty w DTO)

### 6.3 Walidacja danych wejściowych

**Wymagana walidacja:**

1. **`page`**: 
   - Musi być liczbą całkowitą ≥ 1
   - Domyślna wartość: 1

2. **`limit`**:
   - Musi być liczbą całkowitą ≥ 1 i ≤ 50
   - Domyślna wartość: 20

3. **`search`**:
   - Maksymalna długość: 200 znaków (ochrona przed zbyt długimi zapytaniami)
   - Sanityzacja: trim, usunięcie niebezpiecznych znaków

4. **`ageGroups`**:
   - Musi być tablicą wartości z typu `AgeGroup`
   - Każda wartość musi być jedną z: `'0-3'`, `'4-8'`, `'9-12'`
   - Maksymalna długość tablicy: 3 (wszystkie możliwe wartości)

5. **`styles`**:
   - Musi być tablicą wartości z typu `ColoringStyle`
   - Każda wartość musi być jedną z: `'prosty'`, `'klasyczny'`, `'szczegolowy'`, `'mandala'`
   - Maksymalna długość tablicy: 4 (wszystkie możliwe wartości)

6. **`sortBy`**:
   - Musi być jedną z wartości: `'newest'` lub `'popular'`
   - Domyślna wartość: `'newest'`

7. **`id`** (dla `getColoringById`):
   - Musi być poprawnym UUID (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
   - Walidacja regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`

### 6.4 Ochrona przed SQL Injection

- Wszystkie zapytania używają **Supabase Client**, który automatycznie chroni przed SQL injection
- Parametry są przekazywane przez metody Supabase (`.eq()`, `.in()`, `.ilike()`, etc.)
- Nie używamy surowych zapytań SQL

### 6.5 Ochrona przed nadmiernym obciążeniem

- **Limit paginacji**: maksymalnie 50 elementów na stronę
- **Rate limiting**: obsługiwany przez Supabase (jeśli skonfigurowany)
- **Timeout**: domyślny timeout Supabase (30 sekund)

### 6.6 Prywatność danych

- `user_id` nie jest eksponowany w odpowiedziach DTO
- Tylko publiczne dane kolorowanek są zwracane
- Informacja o ulubionych jest zwracana tylko dla zalogowanego użytkownika (jego własne ulubione)

---

## 7. Obsługa błędów

### 7.1 Potencjalne błędy i ich obsługa

#### 7.1.1 Błędy walidacji

**Scenariusz:** Nieprawidłowe parametry wejściowe

**Obsługa:**
- Funkcje powinny rzucać `Error` z odpowiednim komunikatem
- Alternatywnie: zwracać `null` lub pustą odpowiedź z komunikatem błędu
- **Rekomendacja:** Rzucać błędy, które będą obsłużone przez Server Component

**Przykład:**
```typescript
if (page < 1) {
  throw new Error("Page must be greater than 0");
}
if (limit < 1 || limit > 50) {
  throw new Error("Limit must be between 1 and 50");
}
```

#### 7.1.2 Błędy bazy danych

**Scenariusz:** Błąd połączenia z Supabase, timeout, błąd zapytania

**Obsługa:**
- Logowanie błędu przez `logger.error()`
- Rzucanie błędu z odpowiednim komunikatem
- **Kod błędu:** `INTERNAL_ERROR`

**Przykład:**
```typescript
const { data, error } = await supabase
  .from('colorings')
  .select('*');

if (error) {
  logger.error("Database query failed", { error: error.message });
  throw new Error("Nie udało się pobrać kolorowanek z galerii.");
}
```

#### 7.1.3 Kolorowanka nie znaleziona

**Scenariusz:** `getColoringById` - kolorowanka o podanym ID nie istnieje

**Obsługa:**
- Zwrócenie `null` (zgodnie z sygnaturą funkcji)
- **Nie jest to błąd** - to normalny przypadek użycia

#### 7.1.4 Błąd autentykacji (opcjonalny)

**Scenariusz:** Błąd podczas sprawdzania autentykacji użytkownika

**Obsługa:**
- Funkcja powinna działać dalej bez informacji o ulubionych
- Logowanie ostrzeżenia (nie błędu)
- Zwrócenie wyników bez `isFavorited`

**Przykład:**
```typescript
let userId: string | null = null;
try {
  const { data: { user } } = await supabase.auth.getUser();
  userId = user?.id ?? null;
} catch (error) {
  logger.warn("Auth check failed, continuing without favorites", { error });
  // Kontynuuj bez userId - funkcja działa dla niezalogowanych
}
```

### 7.2 Strategia obsługi błędów

**Zasady:**
1. **Walidacja na początku** - sprawdzenie wszystkich parametrów przed wykonaniem zapytania
2. **Early returns** - zwrócenie `null` lub rzucenie błędu jak najwcześniej
3. **Logowanie błędów** - wszystkie błędy są logowane przez `logger.error()`
4. **Graceful degradation** - funkcje powinny działać nawet jeśli część funkcjonalności nie działa (np. ulubione)

### 7.3 Komunikaty błędów

Wszystkie komunikaty błędów powinny być w języku polskim i przyjazne dla użytkownika:

- `"Strona musi być większa od 0"`
- `"Limit musi być między 1 a 50"`
- `"Nieprawidłowy format ID kolorowanki"`
- `"Nie udało się pobrać kolorowanek z galerii"`
- `"Nie udało się pobrać kolorowanki"`

---

## 8. Rozważania dotyczące wydajności

### 8.1 Optymalizacja zapytań

#### 8.1.1 Wykorzystanie indeksów

- **Sortowanie "newest"**: wykorzystuje `idx_colorings_created_at`
- **Sortowanie "popular"**: wykorzystuje `idx_colorings_favorites_count`
- **Filtrowanie po ageGroup**: wykorzystuje `idx_colorings_age_group`
- **Wyszukiwanie w tagach**: wykorzystuje `idx_colorings_tags` (GIN index)
- **Wyszukiwanie w promptach**: wykorzystuje `idx_colorings_prompt_search` (GIN index z full-text search)

#### 8.1.2 Composite Index

- `idx_colorings_age_group_created_at` - optymalizuje typowe zapytania z filtrowaniem i sortowaniem

#### 8.1.3 Limitowanie wyników

- Paginacja ogranicza liczbę zwracanych rekordów
- Maksymalny limit: 50 elementów na stronę

### 8.2 Optymalizacja zapytań o ulubione

**Problem:** Dla zalogowanych użytkowników trzeba sprawdzić, które kolorowanki są ulubione.

**Rozwiązanie:**
1. Pobranie wszystkich ulubionych użytkownika w jednym zapytaniu
2. Utworzenie `Set<string>` z ID ulubionych kolorowanek
3. Mapowanie `isFavorited` podczas transformacji DTO

**Przykład:**
```typescript
// Pobierz wszystkie ulubione użytkownika
const { data: favorites } = await supabase
  .from('favorites')
  .select('coloring_id')
  .eq('user_id', userId);

const favoriteIds = new Set(favorites?.map(f => f.coloring_id) ?? []);

// Podczas mapowania:
isFavorited: favoriteIds.has(coloring.id)
```

### 8.3 Cache'owanie

**Możliwości:**
- **Next.js Cache**: Server Components automatycznie cache'ują wyniki
- **Supabase Cache**: Supabase może cache'ować zapytania (jeśli skonfigurowane)
- **Revalidation**: Rozważyć `revalidate` dla dynamicznych danych

**Rekomendacja:**
- Użycie `unstable_cache` z Next.js dla często używanych zapytań
- Cache time: 60 sekund dla galerii (dane zmieniają się często)
- Cache time: 300 sekund dla pojedynczych kolorowanek (rzadziej się zmieniają)

### 8.4 Wąskie gardła

1. **Full-text search**: Wyszukiwanie w promptach może być wolne dla dużych zbiorów danych
   - **Rozwiązanie**: Wykorzystanie GIN index z `to_tsvector('polish', prompt)`

2. **Pobieranie ulubionych**: Dla użytkowników z wieloma ulubionymi
   - **Rozwiązanie**: Pobranie tylko ID (nie pełnych rekordów)

3. **Count query**: Liczenie całkowitej liczby wyników może być wolne
   - **Rozwiązanie**: Użycie `.count()` zamiast `.select('*')` dla count

### 8.5 Monitoring wydajności

- Logowanie czasu wykonania zapytań
- Monitoring przez Supabase Dashboard
- Alerty przy zapytaniach trwających > 2 sekundy

---

## 9. Etapy wdrożenia

### Krok 1: Utworzenie struktury pliku i importów

**Plik:** `src/lib/queries/gallery.ts`

```typescript
/**
 * Gallery Query Functions
 *
 * Functions for querying the public gallery of colorings.
 * Designed to be used in Server Components.
 *
 * @module queries/gallery
 */

import { createClient } from "@/app/db/server";
import type {
  GalleryQueryParams,
  GalleryColoringDTO,
  PaginatedResponse,
  AgeGroup,
  ColoringStyle,
} from "@/app/types";
import { logger } from "@/src/lib/utils/logger";
```

**Zadania:**
- Utworzenie pliku `src/lib/queries/gallery.ts`
- Dodanie importów niezbędnych typów i funkcji
- Dodanie dokumentacji JSDoc

### Krok 2: Implementacja funkcji pomocniczych

**Funkcje pomocnicze:**

1. **`normalizeGalleryParams`** - normalizacja i walidacja parametrów
2. **`mapColoringToDTO`** - mapowanie z bazy danych do DTO
3. **`buildGalleryQuery`** - budowa zapytania Supabase

**Zadania:**
- Implementacja walidacji parametrów
- Implementacja funkcji mapujących
- Implementacja funkcji budujących zapytania

### Krok 3: Implementacja `getPublicGallery`

**Zadania:**
1. Walidacja i normalizacja parametrów wejściowych
2. Utworzenie klienta Supabase
3. Sprawdzenie autentykacji użytkownika (opcjonalne)
4. Budowa zapytania z filtrowaniem, wyszukiwaniem i sortowaniem
5. Wykonanie zapytania z paginacją
6. Pobranie całkowitej liczby wyników
7. Pobranie ulubionych dla zalogowanych użytkowników
8. Mapowanie wyników do DTO
9. Zwrócenie `PaginatedResponse<GalleryColoringDTO>`

**Szczegóły implementacji:**
- Użycie `.range()` dla paginacji
- Użycie `.count()` dla całkowitej liczby wyników
- Obsługa wyszukiwania w promptach (full-text search) i tagach (array contains)
- Obsługa filtrowania po `ageGroups` i `styles`
- Obsługa sortowania po `created_at` lub `favorites_count`

### Krok 4: Implementacja `getColoringById`

**Zadania:**
1. Walidacja parametru `id` (UUID format)
2. Utworzenie klienta Supabase
3. Sprawdzenie autentykacji użytkownika (opcjonalne)
4. Pobranie kolorowanki z bazy danych
5. Sprawdzenie czy kolorowanka istnieje (zwróć `null` jeśli nie)
6. Sprawdzenie czy kolorowanka jest ulubiona (dla zalogowanych)
7. Mapowanie wyniku do DTO
8. Zwrócenie `GalleryColoringDTO | null`

**Szczegóły implementacji:**
- Użycie `.single()` dla pojedynczego rekordu
- Obsługa przypadku gdy kolorowanka nie istnieje

### Krok 5: Implementacja walidacji parametrów

**Utworzenie schematu Zod:**

**Plik:** `src/lib/validations/gallery.ts`

```typescript
import { z } from "zod";

export const galleryQueryParamsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(20),
  search: z.string().max(200).trim().optional(),
  ageGroups: z.array(z.enum(["0-3", "4-8", "9-12"])).max(3).optional(),
  styles: z.array(z.enum(["prosty", "klasyczny", "szczegolowy", "mandala"])).max(4).optional(),
  sortBy: z.enum(["newest", "popular"]).default("newest"),
});

export const coloringIdSchema = z.string().uuid();
```

**Zadania:**
- Utworzenie pliku `src/lib/validations/gallery.ts`
- Implementacja schematów walidacji
- Eksport schematów

### Krok 6: Implementacja obsługi błędów

**Zadania:**
1. Dodanie try-catch bloków w funkcjach
2. Logowanie błędów przez `logger.error()`
3. Rzucanie odpowiednich błędów z komunikatami w języku polskim
4. Obsługa przypadków brzegowych (null, undefined, puste wyniki)

### Krok 7: Testowanie

**Scenariusze testowe:**

1. **`getPublicGallery`:**
   - Pobranie pierwszej strony bez filtrów
   - Pobranie z filtrowaniem po ageGroups
   - Pobranie z filtrowaniem po styles
   - Pobranie z wyszukiwaniem
   - Pobranie z sortowaniem "popular"
   - Pobranie dla zalogowanego użytkownika (sprawdzenie `isFavorited`)
   - Pobranie dla niezalogowanego użytkownika
   - Pobranie z nieprawidłowymi parametrami (walidacja)
   - Pobranie z paginacją (sprawdzenie `totalPages`)

2. **`getColoringById`:**
   - Pobranie istniejącej kolorowanki
   - Pobranie nieistniejącej kolorowanki (zwróć `null`)
   - Pobranie dla zalogowanego użytkownika (sprawdzenie `isFavorited`)
   - Pobranie dla niezalogowanego użytkownika
   - Pobranie z nieprawidłowym ID (walidacja UUID)

**Zadania:**
- Utworzenie testów jednostkowych (opcjonalne)
- Testowanie ręczne w przeglądarce
- Testowanie z różnymi parametrami
- Testowanie dla zalogowanych i niezalogowanych użytkowników

### Krok 8: Optymalizacja wydajności

**Zadania:**
1. Sprawdzenie wykorzystania indeksów (Supabase Dashboard)
2. Optymalizacja zapytań o ulubione (jeden zapytanie zamiast wielu)
3. Rozważenie cache'owania (Next.js `unstable_cache`)
4. Monitoring czasu wykonania zapytań

### Krok 9: Dokumentacja i code review

**Zadania:**
1. Dodanie komentarzy JSDoc do wszystkich funkcji
2. Dodanie przykładów użycia w dokumentacji
3. Code review zgodności z zasadami projektu
4. Sprawdzenie zgodności z API planem

### Krok 10: Integracja z komponentami

**Zadania:**
1. Użycie funkcji w Server Components (np. `app/(main)/galeria/page.tsx`)
2. Obsługa błędów w komponentach
3. Wyświetlanie wyników z paginacją
4. Testowanie w środowisku deweloperskim

---

## 10. Przykładowa implementacja

### 10.1 `getPublicGallery` - Szkielet

```typescript
export async function getPublicGallery(
  params: GalleryQueryParams
): Promise<PaginatedResponse<GalleryColoringDTO>> {
  // 1. Walidacja i normalizacja parametrów
  const validatedParams = galleryQueryParamsSchema.parse(params);
  const { page, limit, search, ageGroups, styles, sortBy } = validatedParams;

  // 2. Utworzenie klienta Supabase
  const supabase = await createClient();

  // 3. Sprawdzenie autentykacji (opcjonalne)
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  // 4. Budowa zapytania
  let query = supabase.from('colorings').select('*', { count: 'exact' });

  // Filtrowanie
  if (ageGroups && ageGroups.length > 0) {
    query = query.in('age_group', ageGroups);
  }
  if (styles && styles.length > 0) {
    query = query.in('style', styles);
  }

  // Wyszukiwanie
  if (search) {
    // Full-text search w promptach
    query = query.or(`prompt.ilike.%${search}%,tags.cs.{${search}}`);
  }

  // Sortowanie
  if (sortBy === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else {
    query = query.order('favorites_count', { ascending: false });
  }

  // 5. Paginacja
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  // 6. Wykonanie zapytania
  const { data: colorings, error, count } = await query;

  if (error) {
    logger.error("Failed to fetch gallery", { error: error.message });
    throw new Error("Nie udało się pobrać kolorowanek z galerii.");
  }

  // 7. Pobranie ulubionych (dla zalogowanych)
  const favoriteIds = new Set<string>();
  if (userId) {
    const { data: favorites } = await supabase
      .from('favorites')
      .select('coloring_id')
      .eq('user_id', userId);

    if (favorites) {
      favorites.forEach(f => favoriteIds.add(f.coloring_id));
    }
  }

  // 8. Mapowanie do DTO
  const data: GalleryColoringDTO[] = (colorings ?? []).map(coloring => ({
    id: coloring.id,
    imageUrl: coloring.image_url,
    prompt: coloring.prompt,
    tags: coloring.tags,
    ageGroup: coloring.age_group as AgeGroup,
    style: coloring.style as ColoringStyle,
    createdAt: coloring.created_at,
    favoritesCount: coloring.favorites_count,
    isFavorited: userId ? favoriteIds.has(coloring.id) : undefined,
  }));

  // 9. Zwrócenie wyniku
  return {
    data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  };
}
```

### 10.2 `getColoringById` - Szkielet

```typescript
export async function getColoringById(
  id: string
): Promise<GalleryColoringDTO | null> {
  // 1. Walidacja ID
  if (!coloringIdSchema.safeParse(id).success) {
    throw new Error("Nieprawidłowy format ID kolorowanki.");
  }

  // 2. Utworzenie klienta Supabase
  const supabase = await createClient();

  // 3. Sprawdzenie autentykacji (opcjonalne)
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  // 4. Pobranie kolorowanki
  const { data: coloring, error } = await supabase
    .from('colorings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    logger.error("Failed to fetch coloring", { id, error: error.message });
    throw new Error("Nie udało się pobrać kolorowanki.");
  }

  if (!coloring) {
    return null;
  }

  // 5. Sprawdzenie ulubionych (dla zalogowanych)
  let isFavorited: boolean | undefined = undefined;
  if (userId) {
    const { data: favorite } = await supabase
      .from('favorites')
      .select('coloring_id')
      .eq('user_id', userId)
      .eq('coloring_id', id)
      .single();

    isFavorited = favorite !== null;
  }

  // 6. Mapowanie do DTO
  return {
    id: coloring.id,
    imageUrl: coloring.image_url,
    prompt: coloring.prompt,
    tags: coloring.tags,
    ageGroup: coloring.age_group as AgeGroup,
    style: coloring.style as ColoringStyle,
    createdAt: coloring.created_at,
    favoritesCount: coloring.favorites_count,
    isFavorited,
  };
}
```

---

## 11. Uwagi końcowe

### 11.1 Zgodność z API planem

- Funkcje zwracają dokładnie te same typy co w specyfikacji
- Parametry są zgodne z `GalleryQueryParams`
- Odpowiedzi są zgodne z `PaginatedResponse<GalleryColoringDTO>` i `GalleryColoringDTO | null`

### 11.2 Zgodność z zasadami projektu

- Użycie Zod do walidacji
- Użycie Supabase Client do zapytań
- Obsługa błędów na początku funkcji (early returns)
- Logowanie błędów przez `logger`
- Komunikaty błędów w języku polskim
- Dokumentacja JSDoc

### 11.3 Następne kroki po wdrożeniu

1. Integracja z komponentami UI (galeria, szczegóły kolorowanki)
2. Dodanie testów jednostkowych (opcjonalne)
3. Monitoring wydajności w produkcji
4. Optymalizacja na podstawie metryk

---

**Data utworzenia:** 2026-01-04  
**Wersja:** 1.0  
**Autor:** AI Assistant
