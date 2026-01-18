# Plan implementacji widoku Generator kolorowanek

## 1. Przegląd

Widok Generatora kolorowanek to główna funkcjonalność aplikacji Malowanko, umożliwiająca użytkownikom tworzenie spersonalizowanych kolorowanek dla dzieci. Widok składa się z formularza generowania (fixed na dole ekranu), obszaru wyświetlania wygenerowanych obrazków oraz wskaźnika dziennego limitu generowań.

Kluczowe funkcje:
- Wprowadzanie opisu (promptu) kolorowanki
- Wybór grupy wiekowej (0-3, 4-8, 9-12)
- Wybór stylu (prosty, klasyczny, szczegółowy, mandala)
- Wybór liczby obrazków do wygenerowania (1-5)
- Wyświetlanie wygenerowanych obrazków z możliwością selekcji
- Zapisywanie wybranych/wszystkich kolorowanek do biblioteki
- Drukowanie wybranych kolorowanek
- Ponowne generowanie z tymi samymi parametrami

## 2. Routing widoku

| Atrybut | Wartość |
|---------|---------|
| Ścieżka | `/generator` |
| Dostęp | Tylko zalogowani użytkownicy |
| Middleware | Redirect do `/auth?redirect=/generator` dla niezalogowanych |
| Layout | `MainLayout` z beżowym tłem i białą kartą |

## 3. Struktura komponentów

```
GeneratorPage (app/(main)/generator/page.tsx)
├── GenerationLimitBadge
│   └── (remaining, limit, resetsAt)
├── GeneratedGrid (conditional - po wygenerowaniu)
│   └── ColoringCard[] (variant="generated")
│       └── ColoringCheckbox
├── ActionButtons (conditional - po wygenerowaniu)
│   ├── SaveSelectedButton
│   ├── SaveAllButton
│   ├── PrintSelectedButton
│   └── RegenerateButton
├── LoadingSpinner (conditional - podczas generowania)
└── GeneratorForm (fixed bottom)
    ├── PromptTextarea
    ├── AgeGroupSelect
    ├── StyleSelect
    ├── CountSelect
    └── GenerateButton
```

## 4. Szczegóły komponentów

### 4.1 GeneratorPage

- **Opis**: Główny komponent strony, zarządza stanem widoku i koordynuje interakcje między komponentami potomnymi.
- **Główne elementy**: 
  - Container z flex column layout
  - GenerationLimitBadge na górze
  - Scrollowalny obszar na wygenerowane obrazki (z padding-bottom dla fixed form)
  - GeneratorForm fixed na dole
- **Obsługiwane interakcje**: 
  - Przekazywanie handlera submit do GeneratorForm
  - Obsługa selekcji obrazków
  - Obsługa akcji zapisywania/drukowania
- **Obsługiwana walidacja**: Brak (delegowana do GeneratorForm)
- **Typy**: `GeneratorPageState`, `GenerateColoringInput`, `ColoringDTO[]`
- **Propsy**: Brak (komponent strony)

### 4.2 GenerationLimitBadge

- **Opis**: Wyświetla pozostały dzienny limit generowań z informacją o czasie resetu. Zmienia wygląd w zależności od pozostałej liczby generowań.
- **Główne elementy**:
  - Badge/Chip z tekstem "Pozostało X generowań dzisiaj"
  - Opcjonalnie: progress bar
  - Tekst czasu resetu: "Reset o północy" lub "za X godzin"
- **Obsługiwane interakcje**: Brak (komponent prezentacyjny)
- **Obsługiwana walidacja**: Brak
- **Typy**: `GenerationLimitDTO`
- **Propsy**:
  ```typescript
  interface GenerationLimitBadgeProps {
    limit: GenerationLimitDTO;
  }
  ```

**Warianty wizualne:**
- **Normalny** (remaining > 3): Neutralne tło
- **Ostrzeżenie** (remaining ≤ 3): Żółte/pomarańczowe tło
- **Wyczerpany** (remaining = 0): Czerwone tło + "Limit wyczerpany"

### 4.3 GeneratorForm

- **Opis**: Formularz do wprowadzania parametrów generowania. Na mobile jest fixed na dole ekranu (jak pole wiadomości w chatach), na desktop wewnątrz karty.
- **Główne elementy**:
  - Textarea: prompt (max 500 znaków z licznikiem)
  - Select: grupa wiekowa (0-3, 4-8, 9-12)
  - Select: styl (prosty, klasyczny, szczegółowy, mandala)
  - Select: liczba obrazków (1-5, max = remainingGenerations)
  - Button: "Generuj" (primary, disabled gdy walidacja nie przechodzi lub isLoading)
- **Obsługiwane interakcje**:
  - `onChange` dla wszystkich pól
  - `onSubmit` wywołuje server action `generateColorings`
  - Klawisz Enter wysyła formularz
- **Obsługiwana walidacja**:
  - `prompt`: min 1 znak, max 500 znaków (po trim)
  - `ageGroup`: wymagane, jedna z wartości: '0-3', '4-8', '9-12'
  - `style`: wymagane, jedna z wartości: 'prosty', 'klasyczny', 'szczegolowy', 'mandala'
  - `count`: 1-5, nie więcej niż `remainingGenerations`
  - Przycisk "Generuj" disabled gdy: walidacja nie przechodzi, `isLoading=true`, `remainingGenerations=0`
- **Typy**: `GenerateColoringInput`, `GeneratorFormState`, `GeneratorFormErrors`
- **Propsy**:
  ```typescript
  interface GeneratorFormProps {
    remainingGenerations: number;
    onSubmit: (input: GenerateColoringInput) => Promise<void>;
    isLoading: boolean;
    defaultValues?: Partial<GenerateColoringInput>;
  }
  ```

### 4.4 GeneratedGrid

- **Opis**: Responsywna siatka wyświetlająca wygenerowane kolorowanki z checkboxami do selekcji i animacją fade-in.
- **Główne elementy**:
  - CSS Grid responsywna siatka
  - ColoringCard[] z variant="generated"
  - Przyciski globalne "Zaznacz wszystkie" / "Odznacz wszystkie"
- **Obsługiwane interakcje**:
  - Kliknięcie checkbox toggleuje selekcję
  - "Zaznacz wszystkie" / "Odznacz wszystkie"
- **Obsługiwana walidacja**: Brak
- **Typy**: `ColoringDTO[]`, `Set<string>`
- **Propsy**:
  ```typescript
  interface GeneratedGridProps {
    colorings: ColoringDTO[];
    selectedIds: Set<string>;
    onSelectionChange: (ids: Set<string>) => void;
  }
  ```

**Breakpointy CSS Grid:**
- default (mobile): 1 kolumna
- sm (640px): 2 kolumny
- md (768px): 3 kolumny
- lg (1024px): 4 kolumny

### 4.5 ColoringCard (variant="generated")

- **Opis**: Karta pojedynczej wygenerowanej kolorowanki z checkboxem do selekcji.
- **Główne elementy**:
  - Obrazek kolorowanki (Next.js Image z lazy loading)
  - Checkbox w rogu (ColoringCheckbox)
  - Skrócony prompt (1-2 linie, truncated)
- **Obsługiwane interakcje**:
  - Kliknięcie karty toggleuje checkbox
  - Kliknięcie bezpośrednio checkbox toggleuje selekcję
- **Obsługiwana walidacja**: Brak
- **Typy**: `ColoringDTO`
- **Propsy**:
  ```typescript
  interface ColoringCardProps {
    coloring: ColoringDTO;
    isSelected: boolean;
    onSelect: (selected: boolean) => void;
  }
  ```

### 4.6 ColoringCheckbox

- **Opis**: Stylizowany checkbox do selekcji kolorownek.
- **Główne elementy**:
  - Checkbox input (lub ShadCN Checkbox)
  - Wizualne oznaczenie zaznaczenia
- **Obsługiwane interakcje**:
  - `onChange` toggleuje stan
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak specjalnych
- **Propsy**:
  ```typescript
  interface ColoringCheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
  }
  ```

### 4.7 ActionButtons

- **Opis**: Grupa przycisków akcji dla wygenerowanych kolorowanek.
- **Główne elementy**:
  - "Zapisz wybrane (X)" - aktywny gdy selectedCount > 0
  - "Zapisz wszystkie" - zawsze aktywny gdy są obrazki
  - "Drukuj wybrane" - aktywny gdy selectedCount > 0
  - "Generuj ponownie" - zawsze aktywny
- **Obsługiwane interakcje**:
  - `onSaveSelected` - zapisuje wybrane do biblioteki
  - `onSaveAll` - zapisuje wszystkie do biblioteki
  - `onPrintSelected` - otwiera modal drukowania
  - `onRegenerate` - wywołuje ponowne generowanie z tymi samymi parametrami
- **Obsługiwana walidacja**: 
  - "Zapisz wybrane" i "Drukuj wybrane" disabled gdy `selectedCount = 0`
- **Typy**: Brak specjalnych
- **Propsy**:
  ```typescript
  interface ActionButtonsProps {
    selectedCount: number;
    totalCount: number;
    onSaveSelected: () => Promise<void>;
    onSaveAll: () => Promise<void>;
    onPrintSelected: () => void;
    onRegenerate: () => void;
    isLoading: boolean;
  }
  ```

### 4.8 LoadingSpinner

- **Opis**: Wskaźnik ładowania wyświetlany podczas generowania kolorowanek.
- **Główne elementy**:
  - Animowany spinner (CSS lub SVG)
  - Tekst "Generowanie kolorowanek..." 
  - Opcjonalnie: informacja o przewidywanym czasie (<30s)
- **Obsługiwane interakcje**: Brak
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**:
  ```typescript
  interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
  }
  ```

## 5. Typy

### 5.1 Istniejące typy (z `app/types.ts`)

```typescript
// Grupy wiekowe
type AgeGroup = "0-3" | "4-8" | "9-12";

// Style kolorowanek
type ColoringStyle = "prosty" | "klasyczny" | "szczegolowy" | "mandala";

// DTO kolorowanki
interface ColoringDTO {
  id: string;
  imageUrl: string;
  prompt: string;
  tags: string[];
  ageGroup: AgeGroup;
  style: ColoringStyle;
  createdAt: string;
  favoritesCount: number;
}

// Input dla generowania
interface GenerateColoringInput {
  prompt: string;
  ageGroup: AgeGroup;
  style: ColoringStyle;
  count: 1 | 2 | 3 | 4 | 5;
}

// Wynik generowania
interface GenerateColoringResult {
  colorings: ColoringDTO[];
  remainingGenerations: number;
}

// Wynik akcji serwera
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: ActionError };

// Błąd akcji
interface ActionError {
  code: string;
  message: string;
}

// Limit generowań
interface GenerationLimitDTO {
  used: number;
  remaining: number;
  limit: number;
  resetsAt: string;
}
```

### 5.2 Nowe typy ViewModel (do utworzenia)

```typescript
// Stan strony generatora
interface GeneratorPageState {
  // Wygenerowane kolorowanki
  colorings: ColoringDTO[];
  // ID zaznaczonych kolorowanek
  selectedIds: Set<string>;
  // Czy trwa generowanie
  isGenerating: boolean;
  // Czy trwa zapisywanie
  isSaving: boolean;
  // Informacja o limicie
  generationLimit: GenerationLimitDTO | null;
  // Błąd do wyświetlenia (toast)
  error: string | null;
  // Ostatnie użyte parametry (dla "generuj ponownie")
  lastParams: GenerateColoringInput | null;
}

// Stan formularza generatora
interface GeneratorFormState {
  prompt: string;
  ageGroup: AgeGroup | '';
  style: ColoringStyle | '';
  count: 1 | 2 | 3 | 4 | 5;
}

// Błędy walidacji formularza
interface GeneratorFormErrors {
  prompt?: string;
  ageGroup?: string;
  style?: string;
  count?: string;
}

// Opcje dla selectów
interface AgeGroupOption {
  value: AgeGroup;
  label: string;
  description: string;
}

interface StyleOption {
  value: ColoringStyle;
  label: string;
  description: string;
}

// Stałe opcji (do wyeksportowania)
const AGE_GROUP_OPTIONS: AgeGroupOption[] = [
  { value: '0-3', label: '0-3 lata', description: 'Najprostsze kształty' },
  { value: '4-8', label: '4-8 lat', description: 'Średnia szczegółowość' },
  { value: '9-12', label: '9-12 lat', description: 'Szczegółowe rysunki' },
];

const STYLE_OPTIONS: StyleOption[] = [
  { value: 'prosty', label: 'Prosty', description: 'Dla najmłodszych (3-5 lat)' },
  { value: 'klasyczny', label: 'Klasyczny', description: 'Średnia szczegółowość' },
  { value: 'szczegolowy', label: 'Szczegółowy', description: 'Dla starszych dzieci (9-12 lat)' },
  { value: 'mandala', label: 'Mandala', description: 'Geometryczne wzory' },
];
```

## 6. Zarządzanie stanem

### 6.1 Custom Hook: `useGenerator`

Hook zarządzający całą logiką generatora kolorowanek.

```typescript
// components/generator/hooks/useGenerator.ts

interface UseGeneratorReturn {
  // Stan
  colorings: ColoringDTO[];
  selectedIds: Set<string>;
  isGenerating: boolean;
  isSaving: boolean;
  generationLimit: GenerationLimitDTO | null;
  lastParams: GenerateColoringInput | null;
  
  // Akcje
  generate: (input: GenerateColoringInput) => Promise<void>;
  regenerate: () => Promise<void>;
  selectColoring: (id: string, selected: boolean) => void;
  selectAll: () => void;
  deselectAll: () => void;
  saveSelected: () => Promise<void>;
  saveAll: () => Promise<void>;
  
  // Pomocnicze
  hasColorings: boolean;
  selectedCount: number;
  canGenerate: boolean;
}

export function useGenerator(): UseGeneratorReturn {
  // Stan lokalny
  const [colorings, setColorings] = useState<ColoringDTO[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generationLimit, setGenerationLimit] = useState<GenerationLimitDTO | null>(null);
  const [lastParams, setLastParams] = useState<GenerateColoringInput | null>(null);
  
  // Fetch limit on mount
  useEffect(() => {
    fetchGenerationLimit();
  }, []);
  
  // ... implementacja akcji
}
```

### 6.2 Przepływ stanu

1. **Inicjalizacja**: 
   - Hook pobiera `generationLimit` z serwera przy montowaniu
   
2. **Generowanie**:
   - Ustawienie `isGenerating = true`
   - Wywołanie `generateColorings` server action
   - Aktualizacja `colorings`, `generationLimit`, `lastParams`
   - Ustawienie `isGenerating = false`

3. **Selekcja**:
   - Toggle pojedynczego ID w `selectedIds`
   - Zaznacz/odznacz wszystkie

4. **Zapisywanie**:
   - Kolorowanki są automatycznie zapisywane do biblioteki przez trigger bazodanowy
   - Wyświetlenie toast sukcesu

5. **Regeneracja**:
   - Wywołanie `generate` z zapisanymi `lastParams`

## 7. Integracja API

### 7.1 Server Actions

| Akcja | Plik | Opis |
|-------|------|------|
| `generateColorings` | `src/lib/actions/colorings.ts` | Główna akcja generowania |

### 7.2 Wywołanie generateColorings

**Request (GenerateColoringInput):**
```typescript
{
  prompt: string;       // 1-500 znaków
  ageGroup: AgeGroup;   // '0-3' | '4-8' | '9-12'
  style: ColoringStyle; // 'prosty' | 'klasyczny' | 'szczegolowy' | 'mandala'
  count: 1 | 2 | 3 | 4 | 5;
}
```

**Response (ActionResult<GenerateColoringResult>):**

Sukces:
```typescript
{
  success: true,
  data: {
    colorings: ColoringDTO[],
    remainingGenerations: number
  }
}
```

Błąd:
```typescript
{
  success: false,
  error: {
    code: string,   // np. 'DAILY_LIMIT_EXCEEDED'
    message: string // np. 'Wykorzystałeś dzienny limit generowań. Wróć jutro!'
  }
}
```

### 7.3 Pobieranie limitu generowań

Należy utworzyć funkcję do pobierania aktualnego limitu:

```typescript
// src/lib/queries/generation-limit.ts

export async function getGenerationLimit(): Promise<GenerationLimitDTO | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const remaining = await getRemainingGenerations(user.id);
  const resetsAt = getNextResetTime();
  
  return {
    used: DAILY_LIMIT - remaining,
    remaining,
    limit: DAILY_LIMIT,
    resetsAt,
  };
}
```

## 8. Interakcje użytkownika

| Interakcja | Komponent | Rezultat |
|------------|-----------|----------|
| Wpisanie tekstu w prompt | GeneratorForm | Aktualizacja stanu, walidacja długości |
| Wybór grupy wiekowej | GeneratorForm | Aktualizacja stanu |
| Wybór stylu | GeneratorForm | Aktualizacja stanu |
| Wybór liczby obrazków | GeneratorForm | Aktualizacja stanu, walidacja vs limit |
| Kliknięcie "Generuj" | GeneratorForm | Wywołanie generateColorings, loader |
| Kliknięcie Enter w textarea | GeneratorForm | Wysłanie formularza (submit) |
| Kliknięcie na kartę kolorowanki | ColoringCard | Toggle selekcji |
| Kliknięcie checkbox | ColoringCheckbox | Toggle selekcji |
| Kliknięcie "Zaznacz wszystkie" | GeneratedGrid | Zaznaczenie wszystkich |
| Kliknięcie "Odznacz wszystkie" | GeneratedGrid | Odznaczenie wszystkich |
| Kliknięcie "Zapisz wybrane" | ActionButtons | Toast sukcesu |
| Kliknięcie "Zapisz wszystkie" | ActionButtons | Toast sukcesu |
| Kliknięcie "Drukuj wybrane" | ActionButtons | Otwarcie modalu drukowania |
| Kliknięcie "Generuj ponownie" | ActionButtons | Ponowne generowanie z lastParams |

## 9. Warunki i walidacja

### 9.1 Walidacja formularza (client-side)

| Pole | Warunek | Komunikat błędu | Wpływ na UI |
|------|---------|-----------------|-------------|
| prompt | Pusty po trim | "Opis kolorowanki jest wymagany" | Czerwony border, tekst pod polem |
| prompt | > 500 znaków | "Opis może mieć maksymalnie 500 znaków" | Czerwony licznik, disabled submit |
| ageGroup | Niewybrane | "Wybierz grupę wiekową" | Czerwony border po próbie submit |
| style | Niewybrane | "Wybierz styl kolorowanki" | Czerwony border po próbie submit |
| count | > remainingGenerations | Opcje powyżej limitu disabled | Opcje select nieaktywne |

### 9.2 Walidacja server-side (Zod)

```typescript
const generateColoringSchema = z.object({
  prompt: z.string()
    .min(1, "Opis kolorowanki jest wymagany")
    .max(500, "Opis może mieć maksymalnie 500 znaków")
    .transform(val => val.trim())
    .refine(val => val.length > 0, { message: "Opis kolorowanki nie może być pusty" }),
  ageGroup: z.enum(["0-3", "4-8", "9-12"]),
  style: z.enum(["prosty", "klasyczny", "szczegolowy", "mandala"]),
  count: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
});
```

### 9.3 Warunki biznesowe

| Warunek | Sprawdzane przez | Akcja |
|---------|------------------|-------|
| Użytkownik zalogowany | Middleware | Redirect do /auth |
| Limit dzienny | Server action | Błąd DAILY_LIMIT_EXCEEDED |
| Bezpieczna treść promptu | Server action (GPT-4) | Błąd UNSAFE_CONTENT |
| Timeout generowania (30s) | Server action | Błąd GENERATION_TIMEOUT |

## 10. Obsługa błędów

### 10.1 Mapowanie błędów API na komunikaty

| Kod błędu | Komunikat | Akcja UI |
|-----------|-----------|----------|
| `UNAUTHORIZED` | "Musisz być zalogowany, aby wykonać tę akcję." | Redirect do /auth |
| `DAILY_LIMIT_EXCEEDED` | "Wykorzystałeś dzienny limit generowań. Wróć jutro!" | Toast error, disabled form |
| `VALIDATION_ERROR` | "Wprowadzone dane są nieprawidłowe." | Toast error, highlight fields |
| `UNSAFE_CONTENT` | "Ups! Ten temat nie nadaje się do kolorowanki. Spróbuj czegoś innego." | Toast warning, clear prompt |
| `GENERATION_FAILED` | "Nie udało się wygenerować kolorowanki. Spróbuj ponownie." | Toast error + retry button |
| `GENERATION_TIMEOUT` | "Generowanie trwa zbyt długo. Spróbuj ponownie." | Toast error + retry button |
| `INTERNAL_ERROR` | "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później." | Toast error |

### 10.2 Obsługa stanów błędów

```typescript
// W useGenerator hook
const handleGenerate = async (input: GenerateColoringInput) => {
  setIsGenerating(true);
  
  try {
    const result = await generateColorings(input);
    
    if (!result.success) {
      // Mapowanie kodu błędu na toast
      toast.error(result.error.message);
      
      // Specjalna obsługa dla UNAUTHORIZED
      if (result.error.code === 'UNAUTHORIZED') {
        router.push('/auth?redirect=/generator');
      }
      
      return;
    }
    
    // Sukces
    setColorings(result.data.colorings);
    setGenerationLimit(prev => prev ? {
      ...prev,
      remaining: result.data.remainingGenerations,
      used: prev.limit - result.data.remainingGenerations,
    } : null);
    setLastParams(input);
    
    toast.success(`Wygenerowano ${result.data.colorings.length} kolorowankę/kolorowanki!`);
    
  } catch (error) {
    // Nieoczekiwany błąd (np. network error)
    toast.error('Wystąpił błąd połączenia. Sprawdź internet i spróbuj ponownie.');
  } finally {
    setIsGenerating(false);
  }
};
```

### 10.3 Stany pustych danych

| Stan | Komunikat | CTA |
|------|-----------|-----|
| Limit wyczerpany | "Wykorzystałeś dzienny limit generowań. Wróć jutro!" | "Przeglądaj galerię" |
| Przed pierwszym generowaniem | Zachęcające placeholdery w formularzu | - |

## 11. Kroki implementacji

### Faza 1: Przygotowanie (1h)

1. **Utworzenie struktury katalogów**
   ```
   components/generator/
   ├── GeneratorForm.tsx
   ├── GenerationLimitBadge.tsx
   ├── GeneratedGrid.tsx
   ├── ColoringCard.tsx
   ├── ColoringCheckbox.tsx
   ├── ActionButtons.tsx
   ├── hooks/
   │   └── useGenerator.ts
   ├── types.ts
   └── constants.ts
   ```

2. **Utworzenie plików typów i stałych**
   - `components/generator/types.ts` - typy ViewModel
   - `components/generator/constants.ts` - AGE_GROUP_OPTIONS, STYLE_OPTIONS

3. **Instalacja brakujących komponentów ShadCN**
   ```bash
   npx shadcn@latest add checkbox
   npx shadcn@latest add progress
   npx shadcn@latest add sonner
   ```

### Faza 2: Komponenty prezentacyjne (2-3h)

4. **Implementacja GenerationLimitBadge**
   - Warianty wizualne (normalny, ostrzeżenie, wyczerpany)
   - Progress bar opcjonalnie
   - Czas resetu

5. **Implementacja ColoringCheckbox**
   - Bazuje na ShadCN Checkbox
   - Styling dla stanu checked/unchecked

6. **Implementacja ColoringCard (variant="generated")**
   - Next.js Image z lazy loading
   - Checkbox overlay
   - Animacja fade-in (CSS animation)

7. **Implementacja GeneratedGrid**
   - CSS Grid responsywny
   - "Zaznacz/Odznacz wszystkie"
   - Mapowanie ColoringCard[]

8. **Implementacja ActionButtons**
   - Grupa przycisków z warunkowym disabled
   - Loading states

9. **Implementacja LoadingSpinner**
   - Prosty spinner z tekstem
   - Centrowany w obszarze głównym

### Faza 3: Formularz i logika (2-3h)

10. **Implementacja GeneratorForm**
    - Textarea z licznikiem znaków
    - Selecty dla ageGroup, style, count
    - Walidacja client-side
    - Layout fixed bottom dla mobile
    - Obsługa Enter

11. **Implementacja useGenerator hook**
    - Stan strony
    - Integracja z generateColorings
    - Obsługa selekcji
    - Obsługa zapisywania (toast sukcesu)
    - Obsługa błędów

12. **Utworzenie query dla limitu**
    - `src/lib/queries/generation-limit.ts`
    - Funkcja `getGenerationLimit()`

### Faza 4: Integracja strony (1-2h)

13. **Aktualizacja GeneratorPage**
    - Integracja z useGenerator hook
    - Layout z MainLayout
    - Warunkowe renderowanie komponentów
    - Toaster dla notyfikacji

14. **Konfiguracja Sonner (toast)**
    - Dodanie `<Toaster />` w layout.tsx (jeśli nie ma)
    - Import toast w komponentach

### Faza 5: UX i dostępność (1h)

15. **Implementacja animacji**
    - Fade-in dla wygenerowanych obrazków (CSS @keyframes)
    - Transition dla przycisków

16. **Dostępność (a11y)**
    - Labels dla wszystkich pól (aria-label, aria-describedby)
    - Focus management po wygenerowaniu
    - Skip links
    - Aria-live dla zmian stanu

17. **Responsywność**
    - Testowanie mobile/tablet/desktop
    - Fixed form na mobile
    - Poprawne breakpointy Grid

### Faza 6: Testowanie i poprawki (1h)

18. **Testy manualne scenariuszy**
    - Generowanie pojedyncze/wielokrotne
    - Walidacja formularza
    - Obsługa błędów (limit, unsafe content)
    - Selekcja i zapisywanie
    - Regeneracja

19. **Poprawki i polish**
    - Edge cases
    - Loading states
    - Error handling
    - Mobile UX

---

## Podsumowanie czasowe

| Faza | Czas |
|------|------|
| Przygotowanie | 1h |
| Komponenty prezentacyjne | 2-3h |
| Formularz i logika | 2-3h |
| Integracja strony | 1-2h |
| UX i dostępność | 1h |
| Testowanie i poprawki | 1h |
| **Razem** | **8-11h** |

