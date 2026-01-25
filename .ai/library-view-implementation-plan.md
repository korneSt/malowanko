# Plan implementacji widoku Biblioteka

## 1. Przegląd

Widok biblioteki (`/biblioteka`) umożliwia zalogowanym użytkownikom przeglądanie i zarządzanie ich osobistą kolekcją kolorowanek. Użytkownik może przeglądać zapisane kolorowanki w formie siatki z miniaturami, filtrować je po statusie ulubionych, sortować według daty dodania lub utworzenia, oraz wykonywać akcje na poszczególnych kolorowankach (podgląd, druk, oznaczanie jako ulubione, usuwanie).

Widok realizuje wymagania z historii użytkownika US-014 (przeglądanie biblioteki) oraz US-016 (usuwanie kolorowanki z biblioteki).

## 2. Routing widoku

**Ścieżka:** `/biblioteka`

**Plik:** `app/(main)/biblioteka/page.tsx`

**Dostęp:** Tylko dla zalogowanych użytkowników (wymagana autentykacja)

**Middleware:** Middleware powinien przekierować niezalogowanych użytkowników do `/auth`.

## 3. Struktura komponentów

```
BibliotekaPage (Server Component)
└── LibraryView (Client Component)
    ├── LibraryHeader
    │   ├── FavoritesFilter (Toggle)
    │   └── SortSelect (Select)
    ├── LibraryGrid
    │   └── ColoringCard[] (variant="library")
    ├── LibraryPagination
    ├── EmptyState (variant="library")
    └── ColoringPreviewModal
        ├── ColoringPreviewContent
        ├── PrintModal
        └── DeleteConfirmDialog
```

## 4. Szczegóły komponentów

### BibliotekaPage

**Opis komponentu:** Server Component będący głównym punktem wejścia dla widoku biblioteki. Odpowiedzialny za pobranie danych z serwera przy użyciu funkcji `getUserLibrary` oraz przekazanie ich do komponentu klienckiego.

**Główne elementy:**
- Import i wywołanie `getUserLibrary` z `src/lib/queries/library.ts`
- Przekazanie parametrów zapytania z URL search params (favoritesOnly, sortBy, page)
- Obsługa błędów i przekierowań dla niezalogowanych użytkowników
- Renderowanie `LibraryView` z danymi

**Obsługiwane zdarzenia:** Brak (Server Component)

**Obsługiwana walidacja:**
- Walidacja parametrów URL (favoritesOnly: boolean, sortBy: "added" | "created", page: number >= 1, limit: number 1-50)
- Sprawdzenie autentykacji użytkownika

**Typy:**
- Input: `LibraryQueryParams` z `app/types.ts`
- Output: `PaginatedResponse<LibraryColoringDTO>`

**Props:** Brak (komponent strony Next.js)

---

### LibraryView

**Opis komponentu:** Główny komponent kliencki widoku biblioteki. Zarządza stanem filtrowania, sortowania, paginacji oraz modali. Koordynuje interakcje użytkownika i wywołania akcji serwerowych.

**Główne elementy:**
- `LibraryHeader` - nagłówek z filtrami i sortowaniem
- `LibraryGrid` - siatka z kartami kolorowanek
- `LibraryPagination` - komponent paginacji
- `EmptyState` - komunikat przy braku wyników
- `ColoringPreviewModal` - modal podglądu kolorowanki

**Obsługiwane zdarzenia:**
- `onFavoritesToggle` - zmiana filtru ulubionych
- `onSortChange` - zmiana sortowania
- `onPageChange` - zmiana strony paginacji
- `onCardClick` - kliknięcie karty kolorowanki (otwiera modal)
- `onFavoriteToggle` - przełączenie statusu ulubionych w bibliotece
- `onDelete` - usunięcie kolorowanki z biblioteki
- `onPrint` - otwarcie modalu drukowania

**Obsługiwana walidacja:**
- Walidacja parametrów przed aktualizacją URL
- Sprawdzenie czy kolorowanka istnieje przed usunięciem
- Walidacja ID kolorowanki przed wywołaniem akcji

**Typy:**
- Props: `{ initialData: PaginatedResponse<LibraryColoringDTO>, initialParams: LibraryQueryParams }`
- State: `LibraryViewState` (zdefiniowany poniżej)

**Props:**
```typescript
interface LibraryViewProps {
  initialData: PaginatedResponse<LibraryColoringDTO>;
  initialParams: LibraryQueryParams;
}
```

---

### LibraryHeader

**Opis komponentu:** Nagłówek widoku biblioteki zawierający kontrolki filtrowania i sortowania. Wyświetla tytuł sekcji oraz przyciski/selecty do zarządzania widokiem.

**Główne elementy:**
- Tytuł "Moja biblioteka"
- `FavoritesFilter` - przełącznik "Tylko ulubione"
- `SortSelect` - select sortowania (Data dodania / Data utworzenia)

**Obsługiwane zdarzenia:**
- `onFavoritesToggle` - callback przy zmianie filtru ulubionych
- `onSortChange` - callback przy zmianie sortowania

**Obsługiwana walidacja:**
- Walidacja wartości sortBy (tylko "added" | "created")

**Typy:**
- Props: `{ favoritesOnly: boolean, sortBy: LibrarySortOrder, onFavoritesToggle: () => void, onSortChange: (sortBy: LibrarySortOrder) => void }`

**Props:**
```typescript
interface LibraryHeaderProps {
  favoritesOnly: boolean;
  sortBy: LibrarySortOrder;
  onFavoritesToggle: () => void;
  onSortChange: (sortBy: LibrarySortOrder) => void;
}
```

---

### FavoritesFilter

**Opis komponentu:** Przełącznik (Toggle/Switch) do filtrowania kolorowanek tylko po tych oznaczonych jako ulubione w bibliotece.

**Główne elementy:**
- Label "Tylko ulubione"
- Switch/Toggle component z ShadCN UI
- Opcjonalnie: licznik ulubionych w nawiasie

**Obsługiwane zdarzenia:**
- `onChange` - zmiana wartości przełącznika

**Obsługiwana walidacja:** Brak

**Typy:**
- Props: `{ checked: boolean, onChange: (checked: boolean) => void }`

**Props:**
```typescript
interface FavoritesFilterProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}
```

---

### SortSelect

**Opis komponentu:** Select do wyboru sposobu sortowania kolorowanek w bibliotece.

**Główne elementy:**
- Label "Sortuj według"
- Select component z ShadCN UI
- Opcje: "Data dodania" (added), "Data utworzenia" (created)

**Obsługiwane zdarzenia:**
- `onValueChange` - zmiana wartości selecta

**Obsługiwana walidacja:**
- Walidacja wartości (tylko "added" | "created")

**Typy:**
- Props: `{ value: LibrarySortOrder, onValueChange: (value: LibrarySortOrder) => void }`

**Props:**
```typescript
interface SortSelectProps {
  value: LibrarySortOrder;
  onValueChange: (value: LibrarySortOrder) => void;
}
```

---

### LibraryGrid

**Opis komponentu:** Responsywna siatka CSS Grid wyświetlająca karty kolorowanek. Automatycznie dostosowuje liczbę kolumn w zależności od szerokości ekranu.

**Główne elementy:**
- Container z CSS Grid
- `ColoringCard[]` z variant="library"
- Loading skeleton podczas ładowania

**Obsługiwane zdarzenia:**
- `onCardClick` - callback przy kliknięciu karty (przekazywany do ColoringCard)

**Obsługiwana walidacja:** Brak

**Typy:**
- Props: `{ colorings: LibraryColoringDTO[], onCardClick: (coloring: LibraryColoringDTO) => void, isLoading?: boolean }`

**Props:**
```typescript
interface LibraryGridProps {
  colorings: LibraryColoringDTO[];
  onCardClick: (coloring: LibraryColoringDTO) => void;
  isLoading?: boolean;
}
```

---

### LibraryPagination

**Opis komponentu:** Komponent paginacji wyświetlający kontrolki do nawigacji między stronami wyników.

**Główne elementy:**
- Przyciski "Poprzednia" / "Następna"
- Numeracja stron (opcjonalnie)
- Informacja o aktualnej stronie i łącznej liczbie stron
- Disabled state dla przycisków na pierwszej/ostatniej stronie

**Obsługiwane zdarzenia:**
- `onPageChange` - callback przy zmianie strony

**Obsługiwana walidacja:**
- Sprawdzenie czy page jest w zakresie 1..totalPages

**Typy:**
- Props: `{ currentPage: number, totalPages: number, onPageChange: (page: number) => void }`

**Props:**
```typescript
interface LibraryPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
```

---

### ColoringPreviewModal

**Opis komponentu:** Modal wyświetlający pełny podgląd kolorowanki z możliwością wykonania akcji (druk, ulubione, usuwanie). Bazuje na ShadCN Dialog lub Sheet (fullscreen na mobile).

**Główne elementy:**
- `ColoringPreviewContent` - zawartość modalu
- Duży obraz kolorowanki (pełna szerokość z zachowaniem proporcji)
- Sekcja metadanych (prompt, tagi, data utworzenia, data dodania, grupa wiekowa, styl)
- Przyciski akcji:
  - "Drukuj" → otwiera `PrintModal`
  - "Ulubione" (biblioteka) → toggle `isLibraryFavorite`
  - "Ulubione" (globalne) → toggle `isGlobalFavorite`
  - "Usuń" → otwiera `DeleteConfirmDialog`
- Przycisk zamknięcia (X)

**Obsługiwane zdarzenia:**
- `onClose` - zamknięcie modalu
- `onPrint` - otwarcie modalu drukowania
- `onToggleLibraryFavorite` - przełączenie ulubionych w bibliotece
- `onToggleGlobalFavorite` - przełączenie globalnych ulubionych
- `onDelete` - otwarcie dialogu potwierdzenia usunięcia

**Obsługiwana walidacja:**
- Sprawdzenie czy kolorowanka istnieje przed wykonaniem akcji
- Walidacja ID kolorowanki

**Typy:**
- Props: `{ coloring: LibraryColoringDTO, isOpen: boolean, onClose: () => void, onPrint: () => void, onToggleLibraryFavorite: () => void, onToggleGlobalFavorite: () => void, onDelete: () => void }`

**Props:**
```typescript
interface ColoringPreviewModalProps {
  coloring: LibraryColoringDTO;
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  onToggleLibraryFavorite: () => void;
  onToggleGlobalFavorite: () => void;
  onDelete: () => void;
}
```

---

### ColoringPreviewContent

**Opis komponentu:** Zawartość modalu podglądu kolorowanki. Wyświetla obraz i metadane w czytelnej formie.

**Główne elementy:**
- Obraz kolorowanki (img z src=imageUrl, alt=prompt)
- Sekcja metadanych:
  - Prompt (pełny tekst)
  - Tagi jako badges
  - Data utworzenia (sformatowana)
  - Data dodania do biblioteki (sformatowana)
  - Grupa wiekowa
  - Styl
- Statusy ulubionych (ikony serca dla isLibraryFavorite i isGlobalFavorite)

**Obsługiwane zdarzenia:** Brak (prezentacyjny)

**Obsługiwana walidacja:** Brak

**Typy:**
- Props: `{ coloring: LibraryColoringDTO }`

**Props:**
```typescript
interface ColoringPreviewContentProps {
  coloring: LibraryColoringDTO;
}
```

---

### PrintModal

**Opis komponentu:** Modal konfiguracji drukowania z podglądem w proporcjach A4 i wyborem orientacji.

**Główne elementy:**
- Preview obrazu w proporcjach A4 (portrait: 210x297mm, landscape: 297x210mm)
- Toggle orientacji: Portrait / Landscape
- Przycisk "Drukuj" → `window.print()`
- Przycisk "Anuluj" / "Zamknij"

**Obsługiwane zdarzenia:**
- `onClose` - zamknięcie modalu
- `onPrint` - wywołanie window.print()
- `onOrientationChange` - zmiana orientacji

**Obsługiwana walidacja:**
- Walidacja orientacji (tylko "portrait" | "landscape")
- Sprawdzenie czy obraz załadował się poprawnie

**Typy:**
- Props: `{ coloring: LibraryColoringDTO, isOpen: boolean, onClose: () => void }`

**Props:**
```typescript
interface PrintModalProps {
  coloring: LibraryColoringDTO;
  isOpen: boolean;
  onClose: () => void;
}
```

---

### DeleteConfirmDialog

**Opis komponentu:** Dialog potwierdzenia usunięcia kolorowanki z biblioteki. Wyświetla miniaturę kolorowanki i prosi o potwierdzenie.

**Główne elementy:**
- Tytuł "Usuń kolorowankę z biblioteki?"
- Opis: "Ta kolorowanka zostanie usunięta z Twojej biblioteki, ale pozostanie w galerii publicznej."
- Miniatura kolorowanki (mały obraz)
- Prompt kolorowanki
- Przyciski: "Anuluj", "Usuń" (destructive)

**Obsługiwane zdarzenia:**
- `onConfirm` - potwierdzenie usunięcia
- `onCancel` - anulowanie

**Obsługiwana walidacja:**
- Sprawdzenie czy kolorowanka istnieje przed usunięciem

**Typy:**
- Props: `{ coloring: LibraryColoringDTO, isOpen: boolean, onConfirm: () => void, onCancel: () => void }`

**Props:**
```typescript
interface DeleteConfirmDialogProps {
  coloring: LibraryColoringDTO;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```

---

### ColoringCard (istniejący)

**Opis komponentu:** Komponent karty kolorowanki używany w siatce. Wspiera wariant "library" który wyświetla dodatkowe informacje specyficzne dla biblioteki.

**Główne elementy:**
- Miniatura obrazu
- Skrócony prompt (truncated)
- Tagi jako badges (max 3)
- Metadane (grupa wiekowa, styl)
- Data dodania (dla variant="library")

**Obsługiwane zdarzenia:**
- `onClick` - kliknięcie karty (otwiera modal podglądu)

**Obsługiwana walidacja:** Brak

**Typy:**
- Props: `{ coloring: LibraryColoringDTO, variant: "library", onClick: () => void }`

**Props:** (już zdefiniowane w komponencie)

---

### EmptyState (istniejący)

**Opis komponentu:** Komponent wyświetlający komunikat przy braku wyników. Wspiera wariant "library".

**Główne elementy:**
- Ikona
- Tytuł "Nie masz jeszcze żadnych kolorowanek"
- Opis z zachętą do stworzenia pierwszej kolorowanki
- Przycisk CTA "Przejdź do generatora"

**Obsługiwane zdarzenia:** Brak

**Obsługiwana walidacja:** Brak

**Typy:**
- Props: `{ variant: "library" }`

**Props:** (już zdefiniowane w komponencie)

## 5. Typy

### Typy z app/types.ts (istniejące)

#### LibraryColoringDTO

```typescript
interface LibraryColoringDTO extends ColoringDTO {
  /** ISO timestamp when the coloring was added to the library */
  addedAt: string;
  /** Whether this coloring is marked as favorite in the user's library */
  isLibraryFavorite: boolean;
  /** Whether this coloring is globally favorited by the user */
  isGlobalFavorite: boolean;
}
```

**Pola:**
- `id: string` - UUID kolorowanki
- `imageUrl: string` - URL obrazu w Supabase Storage
- `prompt: string` - Opis kolorowanki (max 500 znaków)
- `tags: string[]` - Automatycznie wygenerowane tagi
- `ageGroup: AgeGroup` - Grupa wiekowa ("0-3" | "4-8" | "9-12")
- `style: ColoringStyle` - Styl ("prosty" | "klasyczny" | "szczegolowy" | "mandala")
- `createdAt: string` - ISO timestamp utworzenia kolorowanki
- `favoritesCount: number` - Liczba globalnych ulubionych
- `addedAt: string` - ISO timestamp dodania do biblioteki
- `isLibraryFavorite: boolean` - Status ulubionych w bibliotece
- `isGlobalFavorite: boolean` - Status globalnych ulubionych

#### LibraryQueryParams

```typescript
interface LibraryQueryParams extends PaginationParams {
  favoritesOnly?: boolean;
  sortBy?: LibrarySortOrder;
}
```

**Pola:**
- `page: number` - Numer strony (min 1)
- `limit: number` - Liczba elementów na stronę (1-50, domyślnie 20)
- `favoritesOnly?: boolean` - Filtr tylko ulubionych (opcjonalny)
- `sortBy?: LibrarySortOrder` - Sposób sortowania ("added" | "created", opcjonalny)

#### LibrarySortOrder

```typescript
type LibrarySortOrder = "added" | "created";
```

**Wartości:**
- `"added"` - Sortowanie według daty dodania do biblioteki (domyślne)
- `"created"` - Sortowanie według daty utworzenia kolorowanki

#### PaginatedResponse<LibraryColoringDTO>

```typescript
interface PaginatedResponse<LibraryColoringDTO> {
  data: LibraryColoringDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Pola:**
- `data: LibraryColoringDTO[]` - Tablica kolorowanek
- `pagination.page: number` - Aktualna strona
- `pagination.limit: number` - Liczba elementów na stronę
- `pagination.total: number` - Łączna liczba kolorowanek
- `pagination.totalPages: number` - Łączna liczba stron

### Nowe typy ViewModel (opcjonalne)

#### LibraryViewState

```typescript
interface LibraryViewState {
  colorings: LibraryColoringDTO[];
  pagination: PaginationInfo;
  filters: {
    favoritesOnly: boolean;
    sortBy: LibrarySortOrder;
  };
  selectedColoring: LibraryColoringDTO | null;
  isPreviewModalOpen: boolean;
  isPrintModalOpen: boolean;
  isDeleteDialogOpen: boolean;
  isLoading: boolean;
  error: string | null;
}
```

**Pola:**
- `colorings: LibraryColoringDTO[]` - Aktualna lista kolorowanek
- `pagination: PaginationInfo` - Informacje o paginacji
- `filters.favoritesOnly: boolean` - Stan filtru ulubionych
- `filters.sortBy: LibrarySortOrder` - Aktualne sortowanie
- `selectedColoring: LibraryColoringDTO | null` - Wybrana kolorowanka w modalu
- `isPreviewModalOpen: boolean` - Stan modalu podglądu
- `isPrintModalOpen: boolean` - Stan modalu drukowania
- `isDeleteDialogOpen: boolean` - Stan dialogu usuwania
- `isLoading: boolean` - Stan ładowania
- `error: string | null` - Błąd (jeśli wystąpił)

#### PaginationInfo

```typescript
interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
}
```

**Pola:**
- `currentPage: number` - Aktualna strona (min 1)
- `totalPages: number` - Łączna liczba stron (min 1)
- `total: number` - Łączna liczba elementów
- `limit: number` - Liczba elementów na stronę

## 6. Zarządzanie stanem

Widok biblioteki wykorzystuje kombinację stanu lokalnego React oraz URL search params dla synchronizacji stanu z adresem URL (deep linking, możliwość udostępniania linków).

### Stan lokalny (useState)

**Komponent:** `LibraryView`

**Zmienne stanu:**
- `selectedColoring: LibraryColoringDTO | null` - Wybrana kolorowanka w modalu podglądu
- `isPreviewModalOpen: boolean` - Stan widoczności modalu podglądu
- `isPrintModalOpen: boolean` - Stan widoczności modalu drukowania
- `isDeleteDialogOpen: boolean` - Stan widoczności dialogu usuwania
- `isLoading: boolean` - Stan ładowania podczas wykonywania akcji
- `error: string | null` - Błąd do wyświetlenia użytkownikowi

### URL Search Params (useSearchParams)

**Komponent:** `LibraryView`

**Parametry URL:**
- `favoritesOnly` - boolean (true/false lub brak)
- `sortBy` - "added" | "created" (domyślnie "added")
- `page` - number (domyślnie 1)
- `limit` - number (domyślnie 20, opcjonalny)

**Synchronizacja:**
- Zmiany filtrów i sortowania aktualizują URL search params
- Zmiany URL search params (np. przez przycisk wstecz) aktualizują widok
- Użycie `useRouter` i `useSearchParams` z Next.js

### Custom Hook (opcjonalny): useLibraryView

**Plik:** `hooks/useLibraryView.ts` (jeśli potrzebny)

**Cel:** Centralizacja logiki zarządzania stanem widoku biblioteki, synchronizacji z URL, oraz wywołań akcji serwerowych.

**Zwracane wartości:**
- `colorings: LibraryColoringDTO[]` - Lista kolorowanek
- `pagination: PaginationInfo` - Informacje o paginacji
- `filters: { favoritesOnly: boolean, sortBy: LibrarySortOrder }` - Aktualne filtry
- `isLoading: boolean` - Stan ładowania
- `error: string | null` - Błąd
- `setFavoritesOnly: (value: boolean) => void` - Ustawienie filtru ulubionych
- `setSortBy: (value: LibrarySortOrder) => void` - Ustawienie sortowania
- `setPage: (page: number) => void` - Zmiana strony
- `refresh: () => Promise<void>` - Odświeżenie danych

**Użycie:**
```typescript
const {
  colorings,
  pagination,
  filters,
  isLoading,
  error,
  setFavoritesOnly,
  setSortBy,
  setPage,
  refresh,
} = useLibraryView(initialData, initialParams);
```

## 7. Integracja API

### Query: getUserLibrary

**Plik:** `src/lib/queries/library.ts` (do stworzenia)

**Funkcja:**
```typescript
export async function getUserLibrary(
  params: LibraryQueryParams
): Promise<PaginatedResponse<LibraryColoringDTO>>;
```

**Parametry:**
- `params.page: number` - Numer strony (min 1, domyślnie 1)
- `params.limit: number` - Liczba elementów na stronę (1-50, domyślnie 20)
- `params.favoritesOnly?: boolean` - Filtr tylko ulubionych (opcjonalny)
- `params.sortBy?: LibrarySortOrder` - Sortowanie ("added" | "created", domyślnie "added")

**Odpowiedź:**
```typescript
{
  data: LibraryColoringDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

**Użycie w komponencie:**
```typescript
// W BibliotekaPage (Server Component)
const data = await getUserLibrary({
  page: searchParams.page ? Number(searchParams.page) : 1,
  limit: searchParams.limit ? Number(searchParams.limit) : 20,
  favoritesOnly: searchParams.favoritesOnly === "true",
  sortBy: (searchParams.sortBy as LibrarySortOrder) || "added",
});
```

### Action: removeFromLibrary

**Plik:** `src/lib/actions/library.ts` (do stworzenia)

**Funkcja:**
```typescript
export async function removeFromLibrary(
  coloringId: string
): Promise<ActionResultVoid>;
```

**Parametry:**
- `coloringId: string` - UUID kolorowanki do usunięcia

**Odpowiedź sukcesu:**
```typescript
{ success: true }
```

**Kody błędów:**
- `UNAUTHORIZED` - Użytkownik nie jest zalogowany
- `NOT_FOUND` - Kolorowanka nie jest w bibliotece użytkownika
- `CANNOT_REMOVE_OWN` - Nie można usunąć własnej wygenerowanej kolorowanki z biblioteki

**Użycie w komponencie:**
```typescript
// W LibraryView (Client Component)
const result = await removeFromLibrary(coloring.id);
if (result.success) {
  toast.success("Usunięto kolorowankę z biblioteki");
  await refresh(); // Odświeżenie danych
} else {
  toast.error(result.error.message);
}
```

### Action: toggleLibraryFavorite

**Plik:** `src/lib/actions/library.ts` (do stworzenia)

**Funkcja:**
```typescript
export async function toggleLibraryFavorite(
  coloringId: string
): Promise<ActionResult<ToggleFavoriteResult>>;
```

**Parametry:**
- `coloringId: string` - UUID kolorowanki

**Odpowiedź sukcesu:**
```typescript
{
  success: true,
  data: {
    isFavorite: boolean;
  }
}
```

**Kody błędów:**
- `UNAUTHORIZED` - Użytkownik nie jest zalogowany
- `NOT_FOUND` - Kolorowanka nie jest w bibliotece użytkownika

**Użycie w komponencie:**
```typescript
// W LibraryView (Client Component)
const result = await toggleLibraryFavorite(coloring.id);
if (result.success) {
  // Optimistic update: aktualizacja lokalnego stanu
  setColorings(prev => prev.map(c => 
    c.id === coloring.id 
      ? { ...c, isLibraryFavorite: result.data.isFavorite }
      : c
  ));
  toast.success(result.data.isFavorite ? "Dodano do ulubionych" : "Usunięto z ulubionych");
} else {
  toast.error(result.error.message);
}
```

### Action: toggleGlobalFavorite

**Plik:** `src/lib/actions/favorites.ts` (do stworzenia)

**Funkcja:**
```typescript
export async function toggleGlobalFavorite(
  coloringId: string
): Promise<ActionResult<ToggleGlobalFavoriteResult>>;
```

**Parametry:**
- `coloringId: string` - UUID kolorowanki

**Odpowiedź sukcesu:**
```typescript
{
  success: true,
  data: {
    isFavorite: boolean;
    favoritesCount: number;
  }
}
```

**Kody błędów:**
- `UNAUTHORIZED` - Użytkownik nie jest zalogowany
- `NOT_FOUND` - Kolorowanka nie istnieje

**Użycie w komponencie:**
```typescript
// W LibraryView (Client Component)
const result = await toggleGlobalFavorite(coloring.id);
if (result.success) {
  // Optimistic update
  setColorings(prev => prev.map(c => 
    c.id === coloring.id 
      ? { ...c, isGlobalFavorite: result.data.isFavorite, favoritesCount: result.data.favoritesCount }
      : c
  ));
  toast.success(result.data.isFavorite ? "Dodano do ulubionych" : "Usunięto z ulubionych");
} else {
  toast.error(result.error.message);
}
```

## 8. Interakcje użytkownika

### Przeglądanie biblioteki

1. **Wejście na stronę `/biblioteka`**
   - Użytkownik jest przekierowany jeśli nie jest zalogowany
   - Server Component pobiera dane używając `getUserLibrary` z parametrami z URL
   - Dane są przekazane do `LibraryView` jako `initialData`

2. **Wyświetlanie siatki kolorowanek**
   - `LibraryGrid` renderuje `ColoringCard[]` z variant="library"
   - Każda karta wyświetla miniaturę, prompt, tagi, metadane
   - Karty są klikalne

### Filtrowanie i sortowanie

3. **Przełączenie filtru "Tylko ulubione"**
   - Użytkownik klika toggle w `FavoritesFilter`
   - `LibraryView` aktualizuje URL search params (`?favoritesOnly=true`)
   - Router odświeża stronę z nowymi parametrami
   - Server Component pobiera nowe dane
   - Siatka aktualizuje się z przefiltrowanymi wynikami

4. **Zmiana sortowania**
   - Użytkownik wybiera opcję w `SortSelect` ("Data dodania" / "Data utworzenia")
   - `LibraryView` aktualizuje URL search params (`?sortBy=created`)
   - Router odświeża stronę
   - Server Component pobiera nowe dane posortowane
   - Siatka aktualizuje się

### Paginacja

5. **Zmiana strony**
   - Użytkownik klika "Następna" / "Poprzednia" lub numer strony w `LibraryPagination`
   - `LibraryView` aktualizuje URL search params (`?page=2`)
   - Router odświeża stronę
   - Server Component pobiera nową stronę wyników
   - Siatka aktualizuje się

### Podgląd kolorowanki

6. **Otwarcie modalu podglądu**
   - Użytkownik klika kartę kolorowanki
   - `LibraryView` ustawia `selectedColoring` i `isPreviewModalOpen = true`
   - `ColoringPreviewModal` wyświetla się z pełnym obrazem i metadanymi

7. **Zamknięcie modalu**
   - Użytkownik klika przycisk "Zamknij" lub overlay
   - `LibraryView` ustawia `isPreviewModalOpen = false` i `selectedColoring = null`

### Akcje w modalu podglądu

8. **Oznaczenie jako ulubione w bibliotece**
   - Użytkownik klika przycisk "Ulubione" (biblioteka) w modalu
   - `LibraryView` wywołuje `toggleLibraryFavorite(coloring.id)`
   - Optimistic update: lokalny stan jest aktualizowany natychmiast
   - Toast wyświetla komunikat sukcesu/błędu
   - Jeśli filtr "Tylko ulubione" jest aktywny, kolorowanka może zniknąć/pojawić się w siatce

9. **Oznaczenie jako ulubione globalne**
   - Użytkownik klika przycisk "Ulubione" (globalne) w modalu
   - `LibraryView` wywołuje `toggleGlobalFavorite(coloring.id)`
   - Optimistic update: lokalny stan jest aktualizowany
   - Toast wyświetla komunikat
   - Licznik `favoritesCount` jest aktualizowany

10. **Drukowanie**
    - Użytkownik klika "Drukuj" w modalu podglądu
    - `LibraryView` ustawia `isPrintModalOpen = true`
    - `PrintModal` wyświetla się z podglądem w proporcjach A4
    - Użytkownik może zmienić orientację (portrait/landscape)
    - Użytkownik klika "Drukuj" → `window.print()` jest wywoływane
    - Modal zamyka się po drukowaniu

11. **Usuwanie kolorowanki**
    - Użytkownik klika "Usuń" w modalu podglądu
    - `LibraryView` ustawia `isDeleteDialogOpen = true`
    - `DeleteConfirmDialog` wyświetla się z miniaturą i prośbą o potwierdzenie
    - Użytkownik klika "Usuń" w dialogu
    - `LibraryView` wywołuje `removeFromLibrary(coloring.id)`
    - Po sukcesie: modal podglądu zamyka się, dane są odświeżane, toast wyświetla komunikat
    - Kolorowanka znika z siatki (lub pozostaje jeśli była własna wygenerowana)

## 9. Warunki i walidacja

### Walidacja parametrów URL

**Komponent:** `BibliotekaPage` (Server Component)

**Warunki:**
- `page` musi być liczbą >= 1 (domyślnie 1)
- `limit` musi być liczbą 1-50 (domyślnie 20)
- `favoritesOnly` musi być "true" | "false" | brak (konwersja do boolean)
- `sortBy` musi być "added" | "created" | brak (domyślnie "added")

**Walidacja:**
- Użycie funkcji walidacyjnej lub ręczna walidacja przed przekazaniem do `getUserLibrary`
- Nieprawidłowe wartości są zastępowane wartościami domyślnymi

### Walidacja przed akcjami

**Komponent:** `LibraryView` (Client Component)

**Warunki dla `removeFromLibrary`:**
- Użytkownik musi być zalogowany (sprawdzenie przez middleware/server action)
- Kolorowanka musi istnieć w bibliotece użytkownika
- Kolorowanka nie może być własną wygenerowaną (błąd `CANNOT_REMOVE_OWN`)

**Warunki dla `toggleLibraryFavorite`:**
- Użytkownik musi być zalogowany
- Kolorowanka musi istnieć w bibliotece użytkownika

**Warunki dla `toggleGlobalFavorite`:**
- Użytkownik musi być zalogowany
- Kolorowanka musi istnieć (w bazie danych)

**Walidacja:**
- Sprawdzenie przed wywołaniem akcji (opcjonalne, głównie dla UX)
- Główna walidacja odbywa się w server actions
- Błędy są wyświetlane użytkownikowi przez toast

### Walidacja stanu UI

**Komponenty:** Wszystkie modale i dialogi

**Warunki:**
- Modal podglądu nie może być otwarty bez `selectedColoring`
- Dialog usuwania nie może być otwarty bez `selectedColoring`
- Modal drukowania wymaga `selectedColoring` z poprawnym `imageUrl`

**Walidacja:**
- Warunkowe renderowanie: modale są renderowane tylko gdy `isOpen === true` i `selectedColoring !== null`
- Sprawdzenie `imageUrl` przed wyświetleniem obrazu (fallback do placeholder)

### Warunki wyświetlania

**Komponent:** `LibraryGrid`

**Warunki:**
- Jeśli `colorings.length === 0` → wyświetl `EmptyState` zamiast siatki
- Jeśli `isLoading === true` → wyświetl loading skeleton

**Komponent:** `LibraryPagination`

**Warunki:**
- Jeśli `totalPages <= 1` → ukryj paginację
- Przycisk "Poprzednia" jest disabled gdy `currentPage === 1`
- Przycisk "Następna" jest disabled gdy `currentPage === totalPages`

**Komponent:** `ColoringPreviewModal`

**Warunki:**
- Przycisk "Usuń" jest wyświetlany tylko dla kolorowanek w bibliotece (zawsze true w tym widoku)
- Przyciski ulubionych są wyświetlane zawsze (biblioteka i globalne)

## 10. Obsługa błędów

### Błędy pobierania danych

**Scenariusz:** `getUserLibrary` zwraca błąd lub rzuca wyjątek

**Obsługa:**
- W Server Component: wyświetlenie strony błędu Next.js (error.tsx) lub przekierowanie
- Komunikat: "Nie udało się pobrać biblioteki. Spróbuj ponownie."

**Scenariusz:** Użytkownik nie jest zalogowany

**Obsługa:**
- Middleware przekierowuje do `/auth`
- Server Component może również sprawdzić autentykację i przekierować

### Błędy akcji serwerowych

**Scenariusz:** `removeFromLibrary` zwraca błąd

**Kody błędów:**
- `UNAUTHORIZED` → Toast: "Musisz być zalogowany, aby usunąć kolorowankę"
- `NOT_FOUND` → Toast: "Kolorowanka nie została znaleziona w Twojej bibliotece"
- `CANNOT_REMOVE_OWN` → Toast: "Nie można usunąć własnej wygenerowanej kolorowanki z biblioteki"

**Obsługa:**
- Wyświetlenie toast z komunikatem błędu
- Modal/dialog pozostaje otwarty (użytkownik może spróbować ponownie)
- Stan UI nie jest aktualizowany (brak optimistic update przy błędzie)

**Scenariusz:** `toggleLibraryFavorite` zwraca błąd

**Kody błędów:**
- `UNAUTHORIZED` → Toast: "Musisz być zalogowany"
- `NOT_FOUND` → Toast: "Kolorowanka nie została znaleziona"

**Obsługa:**
- Wyświetlenie toast
- Cofnięcie optimistic update (przywrócenie poprzedniego stanu)

**Scenariusz:** `toggleGlobalFavorite` zwraca błąd

**Obsługa:** Analogicznie do `toggleLibraryFavorite`

### Błędy sieciowe

**Scenariusz:** Brak połączenia z internetem lub timeout

**Obsługa:**
- Wyświetlenie toast: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."
- Możliwość ponowienia akcji (przyciski pozostają aktywne)

### Błędy walidacji

**Scenariusz:** Nieprawidłowe parametry URL

**Obsługa:**
- Zastąpienie nieprawidłowych wartości wartościami domyślnymi
- Ciche naprawienie (bez komunikatu użytkownikowi, chyba że jest to krytyczne)

### Błędy renderowania

**Scenariusz:** Obraz kolorowanki nie ładuje się

**Obsługa:**
- Wyświetlenie placeholder obrazu lub ikony
- Alt text z promptem dla dostępności
- Opcjonalnie: retry mechanism

**Scenariusz:** Brak danych (pusta biblioteka)

**Obsługa:**
- Wyświetlenie `EmptyState` z variant="library"
- Komunikat zachęcający do stworzenia pierwszej kolorowanki

## 11. Kroki implementacji

### Krok 1: Utworzenie funkcji query getUserLibrary

1. Utwórz plik `src/lib/queries/library.ts`
2. Zaimplementuj funkcję `getUserLibrary` zgodnie z API planem
3. Użyj `createClient` z `app/db/server` do utworzenia klienta Supabase
4. Zaimplementuj zapytanie do widoku `user_library_view` z filtrowaniem i sortowaniem
5. Dodaj paginację używając `.range(from, to)`
6. Mapuj wyniki do `LibraryColoringDTO`
7. Zwróć `PaginatedResponse<LibraryColoringDTO>`
8. Dodaj obsługę błędów i logowanie

### Krok 2: Utworzenie server actions dla biblioteki

1. Utwórz plik `src/lib/actions/library.ts` z dyrektywą `"use server"`
2. Zaimplementuj `removeFromLibrary`:
   - Walidacja autentykacji użytkownika
   - Sprawdzenie czy kolorowanka jest w bibliotece
   - Sprawdzenie czy nie jest to własna wygenerowana kolorowanka
   - Usunięcie z tabeli `user_library`
   - Zwróć `ActionResultVoid`
3. Zaimplementuj `toggleLibraryFavorite`:
   - Walidacja autentykacji
   - Sprawdzenie czy kolorowanka jest w bibliotece
   - Przełączenie `is_favorite` w `user_library`
   - Zwróć `ActionResult<ToggleFavoriteResult>`
4. Dodaj obsługę błędów zgodnie z API planem

### Krok 3: Utworzenie komponentu LibraryHeader

1. Utwórz plik `components/library/LibraryHeader.tsx`
2. Dodaj tytuł "Moja biblioteka"
3. Zaimplementuj `FavoritesFilter` jako Switch/Toggle z ShadCN UI
4. Zaimplementuj `SortSelect` jako Select z opcjami "Data dodania" / "Data utworzenia"
5. Dodaj propsy i callbacki zgodnie z interfejsem
6. Dodaj style zgodnie z design system

### Krok 4: Utworzenie komponentu LibraryGrid

1. Utwórz plik `components/library/LibraryGrid.tsx`
2. Zaimplementuj responsywną siatkę CSS Grid (1 kolumna mobile, 2 tablet, 3-4 desktop)
3. Mapuj `colorings` do `ColoringCard` z variant="library"
4. Dodaj `onClick` handler przekazujący kolorowankę do rodzica
5. Dodaj loading skeleton dla stanu `isLoading`
6. Dodaj warunkowe renderowanie `EmptyState` gdy `colorings.length === 0`

### Krok 5: Utworzenie komponentu LibraryPagination

1. Utwórz plik `components/library/LibraryPagination.tsx`
2. Zaimplementuj przyciski "Poprzednia" / "Następna"
3. Dodaj wyświetlanie numeracji stron (opcjonalnie)
4. Dodaj informację o aktualnej stronie i łącznej liczbie
5. Zaimplementuj disabled state dla przycisków
6. Dodaj propsy i callbacki

### Krok 6: Utworzenie komponentu ColoringPreviewModal

1. Utwórz plik `components/colorings/ColoringPreviewModal.tsx`
2. Użyj ShadCN Dialog lub Sheet (fullscreen na mobile)
3. Zaimplementuj `ColoringPreviewContent` z obrazem i metadanymi
4. Dodaj przyciski akcji: Drukuj, Ulubione (2x), Usuń
5. Dodaj przycisk zamknięcia
6. Zaimplementuj propsy i callbacki zgodnie z interfejsem
7. Dodaj style i animacje

### Krok 7: Utworzenie komponentu PrintModal

1. Utwórz plik `components/colorings/PrintModal.tsx`
2. Użyj ShadCN Dialog
3. Dodaj preview obrazu w proporcjach A4 (portrait/landscape)
4. Zaimplementuj toggle orientacji
5. Dodaj przycisk "Drukuj" (window.print())
6. Dodaj style dla `@media print` ukrywające UI
7. Zaimplementuj propsy i callbacki

### Krok 8: Utworzenie komponentu DeleteConfirmDialog

1. Utwórz plik `components/colorings/DeleteConfirmDialog.tsx`
2. Użyj ShadCN AlertDialog
3. Dodaj miniaturę kolorowanki
4. Dodaj tytuł i opis potwierdzenia
5. Dodaj przyciski "Anuluj" i "Usuń" (destructive)
6. Zaimplementuj propsy i callbacki

### Krok 9: Utworzenie komponentu LibraryView

1. Utwórz plik `components/library/LibraryView.tsx` jako Client Component
2. Dodaj stan lokalny dla modali i wybranej kolorowanki
3. Zaimplementuj synchronizację z URL search params używając `useSearchParams` i `useRouter`
4. Dodaj handlery dla wszystkich akcji (filtry, sortowanie, paginacja, akcje w modalu)
5. Zaimplementuj wywołania server actions z obsługą błędów
6. Dodaj optimistic updates dla toggle favorite
7. Zintegruj wszystkie komponenty (Header, Grid, Pagination, Modals)
8. Dodaj toast notifications używając Sonner

### Krok 10: Utworzenie strony BibliotekaPage

1. Zaktualizuj plik `app/(main)/biblioteka/page.tsx`
2. Przekonwertuj na Server Component (usuń "use client" jeśli istnieje)
3. Pobierz `searchParams` z props
4. Znormalizuj i zwaliduj parametry URL
5. Wywołaj `getUserLibrary` z parametrami
6. Obsłuż błędy i przekierowania dla niezalogowanych
7. Renderuj `LibraryView` z `initialData` i `initialParams`
8. Dodaj metadata (title, description)

### Krok 11: Aktualizacja komponentu ColoringCard

1. Zaktualizuj `components/colorings/ColoringCard.tsx`
2. Dodaj wyświetlanie daty dodania dla variant="library"
3. Dodaj wizualne oznaczenie ulubionych w bibliotece (opcjonalnie)
4. Upewnij się, że komponent poprawnie obsługuje `LibraryColoringDTO`

### Krok 12: Testowanie i optymalizacja

1. Przetestuj wszystkie interakcje użytkownika
2. Przetestuj obsługę błędów
3. Przetestuj responsywność na różnych urządzeniach
4. Przetestuj dostępność (keyboard navigation, screen readers)
5. Zoptymalizuj ładowanie obrazów (lazy loading, placeholder)
6. Dodaj loading states dla lepszego UX
7. Przetestuj paginację z dużą liczbą kolorowanek
8. Przetestuj filtry i sortowanie

### Krok 13: Dokumentacja i cleanup

1. Dodaj komentarze JSDoc do wszystkich funkcji i komponentów
2. Upewnij się, że wszystkie typy są poprawnie zdefiniowane
3. Usuń nieużywany kod
4. Zaktualizuj README jeśli potrzeba
5. Dodaj przykłady użycia w komentarzach
