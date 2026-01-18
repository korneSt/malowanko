# Architektura UI dla Malowanko

## 1. Przegląd struktury UI

### 1.1 Koncepcja wizualna

Aplikacja Malowanko wykorzystuje wesoły, kolorowy styl UI odpowiedni dla aplikacji do generowania kolorowanek dla dzieci. Główne założenia wizualne:

- **Layout "karta na tle"**: Header z nawigacją na głównym beżowym tle (#FAF7F2), treść podstrony wyświetlana jako duża biała karta (#FFFFFF) wycentrowana na stronie z zaokrąglonymi rogami i subtelnym cieniem
- **Kolorystyka**: Jasne beżowe tła z kolorowymi akcentami (koralowy #FF6B6B, turkusowy #4ECDC4, żółty #FFE66D)
- **Responsywność**: Mobile-first z breakpointami dla tablet (sm: 640px), desktop (md: 768px, lg: 1024px)
- **CSS Variables**: Przygotowane pod przyszły dark mode

### 1.2 Architektura techniczna

- **Framework**: Next.js 16 z App Router
- **Komponenty UI**: ShadCN/UI z Tailwind CSS
- **Stan globalny**: Context API dla limitu generowań
- **Routing**: URL search params dla filtrów galerii (deep linking)
- **Notyfikacje**: Sonner (toast notifications)
- **Formularze**: Lokalne React state bez optimistic updates

### 1.3 Struktura katalogów komponentów

```
components/
├── layout/
│   ├── Header.tsx              # Nawigacja desktop
│   ├── BottomNav.tsx           # Nawigacja mobile
│   ├── MainLayout.tsx          # Layout z kartą na tle
│   └── ProfileDropdown.tsx     # Menu użytkownika
├── generator/
│   ├── GeneratorForm.tsx       # Formularz generowania
│   ├── GenerationLimitBadge.tsx # Wskaźnik limitu
│   ├── GeneratedGrid.tsx       # Siatka wygenerowanych obrazków
│   └── ColoringCheckbox.tsx    # Checkbox selekcji
├── gallery/
│   ├── GalleryGrid.tsx         # Siatka galerii
│   ├── SearchBar.tsx           # Pole wyszukiwania
│   ├── FilterDrawer.tsx        # Panel filtrów
│   └── GalleryPagination.tsx   # Paginacja
├── library/
│   ├── LibraryGrid.tsx         # Siatka biblioteki
│   ├── FavoritesFilter.tsx     # Przełącznik ulubionych
│   └── LibraryPagination.tsx   # Paginacja
├── colorings/
│   ├── ColoringCard.tsx        # Karta kolorowanki
│   ├── ColoringPreviewModal.tsx # Modal podglądu
│   └── PrintModal.tsx          # Modal wydruku
├── auth/
│   ├── MagicLinkForm.tsx       # Formularz magic link
│   └── AuthMessage.tsx         # Komunikaty auth
└── shared/
    ├── EmptyState.tsx          # Stan pusty
    ├── LoadingSpinner.tsx      # Loader
    ├── ConfirmDialog.tsx       # Dialog potwierdzenia
    └── ErrorBoundary.tsx       # Obsługa błędów
```

---

## 2. Lista widoków

### 2.1 Galeria publiczna

| Atrybut     | Wartość                                                  |
| ----------- | -------------------------------------------------------- |
| **Ścieżka** | `/galeria` (alias: `/`)                                  |
| **Dostęp**  | Publiczny                                                |
| **Cel**     | Przeglądanie publicznych kolorowanek innych użytkowników |

#### Kluczowe informacje do wyświetlenia

- Siatka kolorowanek (miniatura, skrócony prompt, tagi jako badges, licznik polubień)
- Pole wyszukiwania (sticky header)
- Aktywne filtry jako badges
- Paginacja (klasyczna, nie infinite scroll)
- Liczba wyników wyszukiwania

#### Kluczowe komponenty widoku

- `SearchBar` - pole wyszukiwania z przyciskiem filtrów
- `FilterDrawer` - wysuwany panel z filtrami (Sheet z ShadCN)
  - Checkboxy grup wiekowych: 0-3, 4-8, 9-12
  - Checkboxy stylów: prosty, klasyczny, szczegółowy, mandala
  - Select sortowania: najnowsze / najpopularniejsze
- `GalleryGrid` - responsywna siatka CSS Grid
- `ColoringCard` - karta kolorowanki z hover efektami
- `GalleryPagination` - klasyczna paginacja
- `EmptyState` - komunikat przy braku wyników

#### UX, dostępność i bezpieczeństwo

- **UX**: URL aktualizuje się z parametrami filtrów (`?search=kot&ageGroups=4-8&sortBy=newest`) dla deep linking i udostępniania
- **Dostępność**:
  - Alt texts dla wszystkich obrazków (prompt jako alt)
  - Focus visible na kartach i przyciskach
  - Skip link do głównej treści
  - Aria-labels na interaktywnych elementach
- **Bezpieczeństwo**:
  - Publiczny dostęp bez autoryzacji
  - Akcja "Dodaj do ulubionych" wymaga logowania (redirect do /auth)

---

### 2.2 Generator kolorowanek

| Atrybut     | Wartość                                                 |
| ----------- | ------------------------------------------------------- |
| **Ścieżka** | `/generator`                                            |
| **Dostęp**  | Tylko zalogowani użytkownicy                            |
| **Cel**     | Tworzenie nowych kolorowanek przez wprowadzenie promptu |

#### Kluczowe informacje do wyświetlenia

- Limit generowań (X/10 pozostało dzisiaj) - nad formularzem
- Formularz generowania (fixed na dole ekranu)
- Wygenerowane obrazki w centrum ekranu
- Status generowania (loader)

#### Kluczowe komponenty widoku

- `GenerationLimitBadge` - wskaźnik pozostałych generowań z czasem resetu
- `GeneratorForm` - formularz fixed na dole:
  - Textarea na prompt (max 500 znaków)
  - Dropdown grupy wiekowej (0-3, 4-8, 9-12)
  - Dropdown stylu (prosty, klasyczny, szczegółowy, mandala)
  - Dropdown liczby obrazków (1-5, ograniczona przez limit)
  - Przycisk "Generuj" (kolorowy, wyraźny)
- `GeneratedGrid` - siatka wygenerowanych obrazków z fade-in animacją
- `ColoringCheckbox` - checkbox do selekcji obrazków
- `ActionButtons` - przyciski akcji:
  - "Zapisz wybrane" / "Zapisz wszystkie"
  - "Drukuj wybrane"
  - "Generuj ponownie" (te same parametry)
- `LoadingSpinner` - prosty loader podczas generowania

#### UX, dostępność i bezpieczeństwo

- **UX**:
  - Formularz fixed na dole (jak pole wiadomości w chatach)
  - Obrazki fade-in po wygenerowaniu
  - Checkboxy do multi-selekcji
  - "Generuj ponownie" zachowuje parametry
  - Toast sukcesu po zapisaniu
- **Dostępność**:
  - Labels dla wszystkich pól formularza
  - Komunikaty błędów powiązane z polami (aria-describedby)
  - Focus management po wygenerowaniu
  - Klawisz Enter wysyła formularz
- **Bezpieczeństwo**:
  - Middleware redirect dla niezalogowanych → /auth
  - Walidacja promptu po stronie serwera (content moderation)
  - Limit generowań sprawdzany atomowo w bazie danych
  - Komunikat błędu przy nieodpowiedniej treści: "Ups! Ten temat nie nadaje się do kolorowanki"

---

### 2.3 Biblioteka użytkownika

| Atrybut     | Wartość                                          |
| ----------- | ------------------------------------------------ |
| **Ścieżka** | `/biblioteka`                                    |
| **Dostęp**  | Tylko zalogowani użytkownicy                     |
| **Cel**     | Zarządzanie zapisanymi kolorowankami użytkownika |

#### Kluczowe informacje do wyświetlenia

- Siatka zapisanych kolorowanek
- Licznik kolorowanek (X/100)
- Ostrzeżenie przy 80% pojemności (80+ kolorowanek)
- Przełącznik "Tylko ulubione"
- Paginacja

#### Kluczowe komponenty widoku

- `LibraryHeader` - nagłówek z licznikiem i ostrzeżeniem pojemności
- `FavoritesFilter` - przełącznik/toggle "Pokaż tylko ulubione"
- `LibrarySortSelect` - sortowanie: "Data dodania" / "Data utworzenia"
- `LibraryGrid` - siatka z kartami kolorowanek
- `ColoringCard` - karta z ikoną serca (wypełnione dla ulubionych)
- `LibraryPagination` - klasyczna paginacja
- `EmptyState` - "Nie masz jeszcze żadnych kolorowanek" + link do generatora
- `ExportZipButton` - przycisk eksportu wszystkich jako ZIP

#### UX, dostępność i bezpieczeństwo

- **UX**:
  - Ostrzeżenie wizualne przy 80% pojemności (żółty banner)
  - Dialog potwierdzenia przed usunięciem kolorowanki
  - Toast po każdej akcji (zapisano, usunięto, dodano do ulubionych)
  - Eksport ZIP przed czyszczeniem biblioteki
- **Dostępność**:
  - Aria-live region dla zmian w kolekcji
  - Focus trap w dialogu potwierdzenia
  - Czytelne etykiety przycisków akcji
- **Bezpieczeństwo**:
  - RLS - użytkownik widzi tylko swoje kolorowanki
  - Middleware redirect dla niezalogowanych → /auth
  - Walidacja własności przed usunięciem

---

### 2.4 Autoryzacja (Magic Link)

| Atrybut     | Wartość                                  |
| ----------- | ---------------------------------------- |
| **Ścieżka** | `/auth`                                  |
| **Dostęp**  | Publiczny                                |
| **Cel**     | Logowanie i rejestracja przez magic link |

#### Kluczowe informacje do wyświetlenia

- Formularz z polem email
- Komunikat o wysłaniu linku
- Informacja o sposobie działania magic link

#### Kluczowe komponenty widoku

- `MagicLinkForm` - formularz z polem email i przyciskiem "Wyślij link"
- `AuthMessage` - komunikaty:
  - Sukces: "Sprawdź swoją skrzynkę email!"
  - Błąd: walidacja email, rate limiting
- `AuthDescription` - krótki opis procesu logowania

#### UX, dostępność i bezpieczeństwo

- **UX**:
  - Prosty, jednostronicowy flow (login = rejestracja)
  - Wyraźny komunikat po wysłaniu linku
  - Możliwość ponownego wysłania po 60 sekundach
- **Dostępność**:
  - Autofocus na polu email
  - Aria-live dla komunikatów
  - Label powiązany z polem
- **Bezpieczeństwo**:
  - Rate limiting: max 3 żądania / 15 minut na email
  - Walidacja formatu email (Zod)
  - CSRF protection (Next.js built-in)

---

### 2.5 Callback autoryzacji

| Atrybut     | Wartość                               |
| ----------- | ------------------------------------- |
| **Ścieżka** | `/auth/callback`                      |
| **Dostęp**  | Publiczny                             |
| **Cel**     | Obsługa magic link i utworzenie sesji |

#### Kluczowe informacje do wyświetlenia

- Spinner ładowania
- Komunikat "Logowanie..."
- Automatyczny redirect po sukcesie

#### Kluczowe komponenty widoku

- `LoadingSpinner` - wizualna informacja o procesie
- `AuthMessage` - "Trwa logowanie, proszę czekać..."

#### UX, dostępność i bezpieczeństwo

- **UX**: Automatyczny redirect do `/generator` po sukcesie
- **Dostępność**: Aria-live dla statusu
- **Bezpieczeństwo**:
  - Walidacja tokena przez Supabase
  - Redirect do `/auth/error` przy nieprawidłowym/wygasłym tokenie

---

### 2.6 Błąd autoryzacji

| Atrybut     | Wartość                                           |
| ----------- | ------------------------------------------------- |
| **Ścieżka** | `/auth/error`                                     |
| **Dostęp**  | Publiczny                                         |
| **Cel**     | Obsługa błędów magic link (wygasły/nieprawidłowy) |

#### Kluczowe informacje do wyświetlenia

- Komunikat o błędzie
- Przycisk ponownego wysłania linku
- Link powrotu do strony głównej

#### Kluczowe komponenty widoku

- `ErrorMessage` - przyjazny komunikat o wygaśnięciu linku
- `ResendLinkForm` - formularz ponownego wysłania (pole email + przycisk)
- `BackToHomeLink` - link do galerii

#### UX, dostępność i bezpieczeństwo

- **UX**: Jasny komunikat o przyczynie błędu z możliwością naprawy
- **Dostępność**: Focus na formularzu ponownego wysłania
- **Bezpieczeństwo**: Bez ujawniania szczegółów technicznych błędu

---

## 3. Mapa podróży użytkownika

### 3.1 Flow główny: Generowanie kolorowanki (US1)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   /galeria  │────>│    /auth    │────>│/auth/callback│
│  (publiczna)│     │ (magic link)│     │  (redirect)  │
└─────────────┘     └─────────────┘     └──────┬───────┘
       │                                        │
       │ [Niezalogowany klika                   │ [Sukces logowania]
       │  "Zaloguj się"]                        ▼
       │                                ┌─────────────┐
       │                                │ /generator  │
       │                                │(formularz)  │
       │                                └──────┬──────┘
       │                                       │
       │                          [Wypełnia prompt, wybiera opcje]
       │                                       ▼
       │                                ┌─────────────┐
       │                                │   Loader    │
       │                                │ (generuje)  │
       │                                └──────┬──────┘
       │                                       │
       │                          [Obrazki się pojawiają]
       │                                       ▼
       │                                ┌─────────────┐
       │                                │  Selekcja   │
       │                                │ (checkboxy) │
       │                                └──────┬──────┘
       │                                       │
       │                    ┌──────────────────┼──────────────────┐
       │                    ▼                  ▼                  ▼
       │             ┌──────────┐       ┌──────────┐       ┌──────────┐
       │             │  Zapisz  │       │  Drukuj  │       │ Generuj  │
       │             │  (toast) │       │  (modal) │       │ ponownie │
       │             └────┬─────┘       └──────────┘       └──────────┘
       │                  │
       │                  ▼
       │           ┌─────────────┐
       └──────────>│ /biblioteka │
                   │(zapisane)   │
                   └─────────────┘
```

#### Kroki szczegółowe:

1. **Wejście do aplikacji**: Użytkownik trafia na `/galeria` (strona domyślna)
2. **Logowanie** (jeśli potrzebne): Klika "Zaloguj się" → `/auth`
3. **Magic link**: Wprowadza email, otrzymuje link, klika → `/auth/callback` → redirect do `/generator`
4. **Generowanie**:
   - Wpisuje prompt (np. "kot grający na gitarze")
   - Wybiera grupę wiekową z dropdown (0-3, 4-8, 9-12)
   - Wybiera styl z dropdown (prosty, klasyczny, szczegółowy, mandala)
   - Wybiera liczbę obrazków z dropdown (1-5)
   - Klika "Generuj"
5. **Oczekiwanie**: Prosty loader (<30 sekund)
6. **Wyniki**: Obrazki fade-in w centrum ekranu
7. **Selekcja**: Zaznacza wybrane obrazki checkboxami
8. **Akcje**:
   - "Zapisz wybrane" → toast "Zapisano X kolorowanek"
   - "Zapisz wszystkie" → toast "Zapisano X kolorowanek"
   - "Drukuj" → otwiera modal wydruku
   - "Generuj ponownie" → nowe generowanie z tymi samymi parametrami

---

### 3.2 Flow galerii: Przeglądanie i ulubione (US3)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   /galeria  │────>│   Filtry    │────>│   Wyniki    │
│  (siatka)   │     │  (drawer)   │     │(aktualizacja)│
└──────┬──────┘     └─────────────┘     └──────┬──────┘
       │                                        │
       │ [Klika kartę]                          │
       ▼                                        │
┌─────────────┐                                 │
│   Modal     │<────────────────────────────────┘
│  podglądu   │
└──────┬──────┘
       │
       ├─── [Drukuj] ───────> Modal wydruku
       │
       ├─── [Pobierz PDF] ──> Download PDF
       │
       └─── [Ulubione] ─────> Toast (lub redirect do /auth)
```

#### Kroki szczegółowe:

1. **Przeglądanie**: Użytkownik widzi siatkę kolorowanek na `/galeria`
2. **Wyszukiwanie**: Wpisuje frazę w pole search (np. "zwierzęta")
3. **Filtrowanie**: Klika przycisk filtrów → otwiera się FilterDrawer
   - Zaznacza grupy wiekowe (checkboxy)
   - Zaznacza style (checkboxy)
   - Wybiera sortowanie (select)
   - URL aktualizuje się: `?search=zwierzęta&ageGroups=4-8,9-12&sortBy=popular`
4. **Podgląd**: Klika na kartę → otwiera się ColoringPreviewModal
5. **Akcje w modalu**:
   - "Drukuj" → PrintModal
   - "Pobierz PDF" → API call `/api/colorings/[id]/pdf`
   - "Dodaj do ulubionych" →
     - Zalogowany: toggle ulubione + toast
     - Niezalogowany: redirect do `/auth`

---

### 3.3 Flow biblioteki: Zarządzanie kolekcją (US4)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ /biblioteka │────>│   Filtr     │────>│   Wyniki    │
│  (siatka)   │     │(ulubione)   │     │(filtrowane) │
└──────┬──────┘     └─────────────┘     └──────┬──────┘
       │                                        │
       │ [Klika kartę]                          │
       ▼                                        │
┌─────────────┐                                 │
│   Modal     │<────────────────────────────────┘
│  podglądu   │
└──────┬──────┘
       │
       ├─── [Drukuj] ────────> Modal wydruku
       │
       ├─── [Pobierz PDF] ───> Download PDF
       │
       ├─── [Ulubione] ──────> Toggle + toast
       │
       └─── [Usuń] ──────────> ConfirmDialog ──> Toast
```

#### Kroki szczegółowe:

1. **Wejście**: Użytkownik otwiera `/biblioteka`
2. **Przeglądanie**: Widzi siatkę swoich kolorowanek z paginacją
3. **Filtrowanie**: Toggle "Tylko ulubione" filtruje wyniki
4. **Sortowanie**: Select "Data dodania" / "Data utworzenia"
5. **Podgląd**: Klika na kartę → ColoringPreviewModal
6. **Akcje w modalu**:
   - "Drukuj" → PrintModal
   - "Pobierz PDF" → API call
   - "Ulubione" → toggle + toast
   - "Usuń" → ConfirmDialog → usunięcie + toast "Usunięto kolorowankę"
7. **Eksport**: Przycisk "Pobierz wszystkie (ZIP)" → API call

---

### 3.4 Flow drukowania (US2)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Modal     │────>│  PrintModal │────>│   Wydruk    │
│  podglądu   │     │(orientacja) │     │ lub PDF     │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                           ├─── [Portrait/Landscape toggle]
                           │
                           ├─── [Drukuj] ──────> window.print()
                           │
                           └─── [Pobierz PDF] ─> GET /api/colorings/[id]/pdf
```

#### Kroki szczegółowe:

1. **Otwarcie**: Z modalu podglądu klika "Drukuj"
2. **Konfiguracja**: PrintModal pokazuje:
   - Preview kolorowanki w proporcjach A4
   - Toggle orientacji: portrait (domyślna) / landscape
3. **Akcje**:
   - "Drukuj" → `window.print()` z CSS @media print
   - "Pobierz PDF" → `GET /api/colorings/[id]/pdf?orientation=portrait`

---

## 4. Układ i struktura nawigacji

### 4.1 Layout główny (MainLayout)

```
┌─────────────────────────────────────────────────────────┐
│  HEADER (na beżowym tle)                                │
│  [Logo: Malowanko]          [Nav items]     [Profile]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│  ░░┌─────────────────────────────────────────────┐░░░░ │
│  ░░│                                             │░░░░ │
│  ░░│     TREŚĆ STRONY (biała karta)              │░░░░ │
│  ░░│     max-width: 1200px                       │░░░░ │
│  ░░│     padding: 24px                           │░░░░ │
│  ░░│     border-radius: 16px                     │░░░░ │
│  ░░│     shadow: subtle                          │░░░░ │
│  ░░│                                             │░░░░ │
│  ░░└─────────────────────────────────────────────┘░░░░ │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│                 (beżowe tło #FAF7F2)                    │
└─────────────────────────────────────────────────────────┘
│  BOTTOM NAV (mobile only, fixed)                        │
│  [Generator] [Biblioteka] [Galeria] [Profil]           │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Nawigacja desktop (Header)

#### Użytkownik niezalogowany:

```
[Logo: Malowanko]                    [Galeria] [Zaloguj się] [Zarejestruj się]
```

- **Galeria**: Link do `/galeria`
- **Zaloguj się**: Link do `/auth` z param `?mode=login`
- **Zarejestruj się**: Link do `/auth` z param `?mode=register` (wizualnie ten sam formularz)

#### Użytkownik zalogowany:

```
[Logo: Malowanko]           [Generator] [Moja biblioteka] [Galeria] [👤 ▼]
```

- **Generator**: Link do `/generator`
- **Moja biblioteka**: Link do `/biblioteka`
- **Galeria**: Link do `/galeria`
- **Ikona profilu**: Dropdown z opcjami:
  - Email użytkownika (disabled)
  - Separator
  - "Wyloguj się" → signOut action

### 4.3 Nawigacja mobile (BottomNav)

Fixed bottom bar widoczny tylko dla zalogowanych użytkowników:

```
┌─────────────────────────────────────────────────────────┐
│   [🎨]         [📚]         [🖼️]         [👤]          │
│ Generator   Biblioteka    Galeria      Profil          │
└─────────────────────────────────────────────────────────┘
```

- Ikony kolorowe (odpowiadające palecie akcentów)
- Aktywna ikona wyróżniona (np. podkreślenie lub wypełniona)
- Touch-friendly (min. 44x44px touch target)

Dla niezalogowanych: uproszczona wersja w headerze (hamburger menu z linkami Galeria, Zaloguj się).

### 4.4 Routing i dostęp

| Ścieżka          | Dostęp           | Redirect niezalogowanych     |
| ---------------- | ---------------- | ---------------------------- |
| `/`              | Publiczny        | - (alias do /galeria)        |
| `/galeria`       | Publiczny        | -                            |
| `/generator`     | Tylko zalogowani | `/auth?redirect=/generator`  |
| `/biblioteka`    | Tylko zalogowani | `/auth?redirect=/biblioteka` |
| `/auth`          | Publiczny        | -                            |
| `/auth/callback` | Publiczny        | -                            |
| `/auth/error`    | Publiczny        | -                            |

### 4.5 Middleware autoryzacji

```typescript
// middleware.ts - uproszczona logika
const protectedRoutes = ["/generator", "/biblioteka"];

if (protectedRoutes.includes(pathname) && !session) {
  return redirect(`/auth?redirect=${pathname}`);
}
```

---

## 5. Kluczowe komponenty

### 5.1 Komponenty layoutu

#### `Header`

- **Cel**: Główna nawigacja desktop
- **Props**: `user?: User`
- **Warianty**: Zalogowany / Niezalogowany
- **Elementy**: Logo (link do /), linki nawigacji, ProfileDropdown lub przyciski auth

#### `BottomNav`

- **Cel**: Nawigacja mobile dla zalogowanych
- **Props**: `activeRoute: string`
- **Elementy**: 4 ikony nawigacji z etykietami
- **Zachowanie**: Fixed bottom, 64px wysokości, z-index nad treścią

#### `MainLayout`

- **Cel**: Wrapper z beżowym tłem i białą kartą
- **Props**: `children: ReactNode`, `maxWidth?: 'sm' | 'md' | 'lg' | 'xl'`
- **Style**:
  - Tło: `bg-background` (#FAF7F2)
  - Karta: `bg-card rounded-2xl shadow-sm p-6 mx-auto`

#### `ProfileDropdown`

- **Cel**: Menu użytkownika z opcją wylogowania
- **Props**: `user: User`
- **Elementy**: Avatar/ikona, email (disabled), separator, "Wyloguj się"
- **Bazuje na**: ShadCN DropdownMenu

### 5.2 Komponenty kolorowanek

#### `ColoringCard`

- **Cel**: Karta kolorowanki w siatce
- **Props**:
  ```typescript
  interface ColoringCardProps {
    coloring: ColoringDTO | GalleryColoringDTO | LibraryColoringDTO;
    variant: "gallery" | "library" | "generated";
    onSelect?: (selected: boolean) => void;
    isSelected?: boolean;
  }
  ```
- **Elementy**:
  - Miniatura (Next.js Image z lazy loading)
  - Prompt (1-2 linijki, truncated)
  - 2-3 tagi jako badges
  - Ikona serca z licznikiem (galeria)
  - Checkbox (wariant 'generated')
- **Interakcje**:
  - Hover: subtelne powiększenie, overlay z przyciskami akcji
  - Click: otwiera ColoringPreviewModal

#### `ColoringPreviewModal`

- **Cel**: Pełnoekranowy podgląd kolorowanki
- **Props**:
  ```typescript
  interface ColoringPreviewModalProps {
    coloring: ColoringDTO;
    variant: "gallery" | "library";
    isOpen: boolean;
    onClose: () => void;
  }
  ```
- **Elementy**:
  - Duży obraz (pełna szerokość/wysokość z zachowaniem proporcji)
  - Metadane: prompt, tagi, data utworzenia, grupa wiekowa, styl
  - Przyciski akcji:
    - "Drukuj" → otwiera PrintModal
    - "Pobierz PDF" → download
    - "Ulubione" → toggle (ikona serca)
    - "Usuń" (tylko w bibliotece) → ConfirmDialog
  - Przycisk zamknięcia (X lub "Zamknij")
- **Bazuje na**: ShadCN Sheet (fullscreen na mobile) lub Dialog

#### `PrintModal`

- **Cel**: Konfiguracja i wydruk kolorowanki
- **Props**:
  ```typescript
  interface PrintModalProps {
    coloring: ColoringDTO;
    isOpen: boolean;
    onClose: () => void;
  }
  ```
- **Elementy**:
  - Preview w proporcjach A4 (210x297mm lub 297x210mm)
  - Toggle orientacji: portrait (domyślna) / landscape
  - Przycisk "Drukuj" → `window.print()`
  - Przycisk "Pobierz PDF" → API call
- **Style drukowania**: `@media print` ukrywające UI, pokazujące tylko obraz

### 5.3 Komponenty generatora

#### `GeneratorForm`

- **Cel**: Formularz do wprowadzania parametrów generowania
- **Props**:
  ```typescript
  interface GeneratorFormProps {
    remainingGenerations: number;
    onSubmit: (input: GenerateColoringInput) => Promise<void>;
    isLoading: boolean;
  }
  ```
- **Elementy**:
  - Textarea: prompt (max 500 znaków, placeholder z przykładem)
  - Dropdown: grupa wiekowa (0-3, 4-8, 9-12)
  - Dropdown: styl (prosty, klasyczny, szczegółowy, mandala)
  - Dropdown: liczba obrazków (1-5, max = remainingGenerations)
  - Przycisk "Generuj" (disabled gdy isLoading lub limit=0)
- **Layout**: Fixed bottom na mobile, wewnątrz karty na desktop
- **Walidacja**: Client-side (Zod) przed wysłaniem

#### `GenerationLimitBadge`

- **Cel**: Wyświetlanie pozostałego limitu generowań
- **Props**: `limit: GenerationLimitDTO`
- **Elementy**:
  - Tekst: "Pozostało X generowań dzisiaj"
  - Progress bar (opcjonalnie)
  - Czas resetu: "Reset o północy" lub "za X godzin"
- **Warianty**:
  - Normalny: tekst + liczba
  - Ostrzeżenie (≤3): żółte tło
  - Wyczerpany (0): czerwone tło + "Limit wyczerpany"

#### `GeneratedGrid`

- **Cel**: Siatka wygenerowanych obrazków z selekcją
- **Props**:
  ```typescript
  interface GeneratedGridProps {
    colorings: ColoringDTO[];
    selectedIds: Set<string>;
    onSelectionChange: (ids: Set<string>) => void;
  }
  ```
- **Elementy**:
  - Responsywna siatka z ColoringCard (variant='generated')
  - Przyciski globalne:
    - "Zaznacz wszystkie" / "Odznacz wszystkie"
    - "Zapisz wybrane (X)"
    - "Zapisz wszystkie"
    - "Drukuj wybrane"
    - "Generuj ponownie"
- **Animacja**: Fade-in obrazków po wygenerowaniu

### 5.4 Komponenty galerii

#### `SearchBar`

- **Cel**: Pole wyszukiwania z przyciskiem filtrów
- **Props**:
  ```typescript
  interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onFilterClick: () => void;
    activeFiltersCount: number;
  }
  ```
- **Elementy**:
  - Input z ikoną lupy (debounced, 300ms)
  - Przycisk filtrów z badge liczby aktywnych filtrów
- **Layout**: Sticky top (poniżej header)

#### `FilterDrawer`

- **Cel**: Panel boczny z opcjami filtrowania
- **Props**:
  ```typescript
  interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    filters: GalleryFilters;
    onFiltersChange: (filters: GalleryFilters) => void;
  }
  ```
- **Elementy**:
  - Checkboxy grup wiekowych (0-3, 4-8, 9-12)
  - Checkboxy stylów (prosty, klasyczny, szczegółowy, mandala)
  - Select sortowania (najnowsze, najpopularniejsze)
  - Przycisk "Zastosuj" / "Wyczyść filtry"
- **Bazuje na**: ShadCN Sheet (z prawej strony)

#### `GalleryGrid` / `LibraryGrid`

- **Cel**: Responsywna siatka kolorowanek
- **Props**:
  ```typescript
  interface GridProps<T extends ColoringDTO> {
    colorings: T[];
    variant: "gallery" | "library";
    onColoringClick: (coloring: T) => void;
  }
  ```
- **Breakpointy CSS Grid**:
  - Mobile (default): 1 kolumna
  - sm (640px): 2 kolumny
  - md (768px): 3 kolumny
  - lg (1024px): 4 kolumny
  - xl (1280px): 4-5 kolumn

### 5.5 Komponenty współdzielone

#### `EmptyState`

- **Cel**: Komunikat przy braku danych
- **Props**:
  ```typescript
  interface EmptyStateProps {
    variant: "library" | "search" | "limit";
    onAction?: () => void;
  }
  ```
- **Warianty**:
  - `library`: "Nie masz jeszcze żadnych kolorowanek" + przycisk "Przejdź do generatora"
  - `search`: "Brak wyników dla..." + sugerowane tagi + link do generatora
  - `limit`: "Limit wyczerpany. Reset za X godz." + link do galerii

#### `LoadingSpinner`

- **Cel**: Wskaźnik ładowania
- **Props**: `size?: 'sm' | 'md' | 'lg'`, `text?: string`
- **Elementy**: Animowany spinner + opcjonalny tekst

#### `ConfirmDialog`

- **Cel**: Dialog potwierdzenia destrukcyjnych akcji
- **Props**:
  ```typescript
  interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
  }
  ```
- **Bazuje na**: ShadCN AlertDialog
- **Użycie**: Usuwanie kolorowanek

#### `Pagination`

- **Cel**: Klasyczna paginacja z numerami stron
- **Props**:
  ```typescript
  interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  }
  ```
- **Elementy**: Poprzednia, numery stron (z elipsą), następna
- **Bazuje na**: ShadCN Pagination lub custom

### 5.6 Komponenty autoryzacji

#### `MagicLinkForm`

- **Cel**: Formularz wysyłania magic link
- **Props**:
  ```typescript
  interface MagicLinkFormProps {
    onSuccess: () => void;
    redirectTo?: string;
  }
  ```
- **Elementy**:
  - Input email z walidacją
  - Przycisk "Wyślij link magiczny"
  - Komunikat sukcesu po wysłaniu
- **Stan**: email, isLoading, isSent, error, countdown (60s)

#### `AuthMessage`

- **Cel**: Komunikaty związane z autoryzacją
- **Props**: `variant: 'success' | 'error' | 'info'`, `message: string`
- **Style**: Kolorowe tło odpowiadające wariantowi

### 5.7 Integracja z Toast (Sonner)

Konfiguracja globalna w `app/layout.tsx`:

```tsx
import { Toaster } from "sonner";

<Toaster position="top-right" richColors closeButton duration={4000} />;
```

**Użycie w komponentach**:

```tsx
import { toast } from "sonner";

// Sukces
toast.success("Zapisano kolorowankę do biblioteki");

// Błąd
toast.error("Nie udało się wygenerować kolorowanki");

// Info
toast.info("Sprawdź swoją skrzynkę email");
```

**Mapowanie błędów API**:

```typescript
// src/lib/utils/error-messages.ts
export const errorMessages: Record<string, string> = {
  UNAUTHORIZED: "Musisz być zalogowany, aby wykonać tę akcję.",
  FORBIDDEN: "Nie masz uprawnień do wykonania tej akcji.",
  NOT_FOUND: "Nie znaleziono żądanego zasobu.",
  UNSAFE_CONTENT:
    "Ups! Ten temat nie nadaje się do kolorowanki. Spróbuj czegoś innego.",
  DAILY_LIMIT_EXCEEDED: "Wykorzystałeś dzienny limit generowań. Wróć jutro!",
  GENERATION_FAILED: "Nie udało się wygenerować kolorowanki. Spróbuj ponownie.",
  GENERATION_TIMEOUT: "Generowanie trwa zbyt długo. Spróbuj ponownie.",
  // ...
};
```

---

## 6. Obsługa błędów i stany brzegowe

### 6.1 Stany błędów

| Scenariusz           | Komponent     | Zachowanie                                   |
| -------------------- | ------------- | -------------------------------------------- |
| Błąd sieci           | Global        | Toast error + retry button                   |
| Nieprawidłowy prompt | GeneratorForm | Toast z komunikatem UNSAFE_CONTENT           |
| Limit wyczerpany     | GeneratorForm | Disabled form + EmptyState (variant='limit') |
| Wygasły magic link   | /auth/error   | ErrorMessage + ResendLinkForm                |
| 404 kolorowanki      | Modal         | Toast error + zamknięcie modalu              |
| Błąd generowania     | Generator     | Toast error + "Spróbuj ponownie"             |
| Błąd PDF             | PrintModal    | Toast error                                  |

### 6.2 Stany ładowania

| Scenariusz        | Komponent      | Zachowanie                     |
| ----------------- | -------------- | ------------------------------ |
| Ładowanie galerii | GalleryGrid    | Skeleton cards (8 elementów)   |
| Generowanie       | GeneratorForm  | LoadingSpinner + disabled form |
| Zapisywanie       | ActionButtons  | Button loading state           |
| Logowanie         | /auth/callback | Fullscreen LoadingSpinner      |

### 6.3 Stany puste

| Scenariusz       | Komponent     | Komunikat                              | CTA                               |
| ---------------- | ------------- | -------------------------------------- | --------------------------------- |
| Pusta biblioteka | LibraryGrid   | "Nie masz jeszcze żadnych kolorowanek" | "Przejdź do generatora"           |
| Brak wyników     | GalleryGrid   | "Brak wyników dla '{search}'"          | Sugerowane tagi + "Stwórz własną" |
| Limit = 0        | GeneratorForm | "Limit wyczerpany. Reset za X godz."   | "Przeglądaj galerię"              |

### 6.4 Walidacja formularzy

- **Prompt**: min 1 znak, max 500 znaków
- **Email**: format email (Zod email())
- **Liczba obrazków**: 1-5, nie więcej niż pozostały limit

Komunikaty walidacji wyświetlane inline pod polami (nie toast).

---

## 7. Podsumowanie wymagań i mapowanie do UI

### 7.1 Mapowanie User Stories do komponentów

| User Story                   | Główne komponenty                                  | Widok       |
| ---------------------------- | -------------------------------------------------- | ----------- |
| US1: Generowanie kolorowanki | GeneratorForm, GeneratedGrid, GenerationLimitBadge | /generator  |
| US2: Drukowanie kolorowanki  | PrintModal, ColoringPreviewModal                   | Modalne     |
| US3: Przeglądanie galerii    | GalleryGrid, SearchBar, FilterDrawer               | /galeria    |
| US4: Zarządzanie biblioteką  | LibraryGrid, FavoritesFilter, ConfirmDialog        | /biblioteka |

### 7.2 Mapowanie wymagań PRD do elementów UI

| Wymaganie PRD          | Element UI                                         |
| ---------------------- | -------------------------------------------------- |
| Magic link autoryzacja | MagicLinkForm, /auth/\* pages                      |
| 4 style kolorowanek    | Dropdown w GeneratorForm                           |
| 3 grupy wiekowe        | Dropdown w GeneratorForm, checkboxy w FilterDrawer |
| Limit 10/dzień         | GenerationLimitBadge, EmptyState (variant='limit') |
| Limit 100 w bibliotece | LibraryHeader z ostrzeżeniem                       |
| Automatyczne tagowanie | Tagi jako badges w ColoringCard                    |
| Wyszukiwanie + filtry  | SearchBar, FilterDrawer, URL params                |
| Eksport PDF A4         | PrintModal, API /api/colorings/[id]/pdf            |
| Eksport ZIP            | ExportZipButton w bibliotece                       |
| Prywatne polubienia    | Ikona serca w ColoringCard (biblioteka)            |
| Globalne polubienia    | Ikona serca z licznikiem (galeria)                 |

### 7.3 Potencjalne punkty bólu i rozwiązania

| Problem użytkownika           | Rozwiązanie UI                                       |
| ----------------------------- | ---------------------------------------------------- |
| Nie wie ile generowań zostało | GenerationLimitBadge widoczny nad formularzem        |
| Prompt odrzucony              | Przyjazny komunikat "Ups!" z sugestią alternatywy    |
| Zbyt długie oczekiwanie       | Prosty loader (< 30s guarantee), timeout error       |
| Zagubiony w filtrach          | Aktywne filtry jako badges, "Wyczyść filtry"         |
| Przypadkowe usunięcie         | ConfirmDialog przed usunięciem                       |
| Biblioteka pełna              | Ostrzeżenie przy 80%, eksport ZIP przed czyszczeniem |
| Magic link wygasł             | Strona /auth/error z opcją ponownego wysłania        |
| Nie znalazł inspiracji        | EmptyState z sugerowanymi tagami, link do galerii    |
