# Plan implementacji szkieletu aplikacji Malowanko

## 1. Przegląd

Ten dokument opisuje plan implementacji podstawowego szkieletu aplikacji Malowanko - aplikacji webowej do generowania spersonalizowanych kolorowanek dla dzieci. Szkielet obejmuje:

- **Globalne style CSS** - kolorystyka, typografia, zmienne CSS zgodne z designem aplikacji
- **Główny layout aplikacji** - struktura "karta na tle" z beżowym tłem i białą kartą treści
- **Nawigacja desktop (Header)** - górna nawigacja z logo, linkami i menu użytkownika
- **Nawigacja mobile (BottomNav)** - dolny pasek nawigacji dla urządzeń mobilnych
- **Middleware autoryzacji** - ochrona ścieżek wymagających logowania

Celem jest przygotowanie fundamentu, na którym będą budowane wszystkie widoki aplikacji (generator, biblioteka, galeria, autoryzacja).

---

## 2. Routing widoku

Szkielet nie definiuje konkretnego widoku, ale przygotowuje strukturę routingu:

| Ścieżka          | Dostęp           | Redirect niezalogowanych     |
| ---------------- | ---------------- | ---------------------------- |
| `/`              | Publiczny        | - (alias do `/galeria`)      |
| `/galeria`       | Publiczny        | -                            |
| `/generator`     | Tylko zalogowani | `/auth?redirect=/generator`  |
| `/biblioteka`    | Tylko zalogowani | `/auth?redirect=/biblioteka` |
| `/auth`          | Publiczny        | -                            |
| `/auth/callback` | Publiczny        | -                            |
| `/auth/error`    | Publiczny        | -                            |

---

## 3. Struktura komponentów

```
app/
├── layout.tsx              # Root layout (lang="pl", metadata, fonty, Toaster)
├── globals.css             # Globalne style CSS
└── (main)/                 # Route group z głównym layoutem
    ├── layout.tsx          # MainLayout wrapper
    ├── page.tsx            # Redirect do /galeria
    ├── galeria/
    │   └── page.tsx
    ├── generator/
    │   └── page.tsx
    └── biblioteka/
        └── page.tsx

components/
├── layout/
│   ├── Header.tsx          # Nawigacja desktop
│   ├── BottomNav.tsx       # Nawigacja mobile (fixed bottom)
│   ├── MainLayout.tsx      # Wrapper z kartą na tle
│   ├── ProfileDropdown.tsx # Menu użytkownika
│   ├── Logo.tsx            # Logo aplikacji
│   └── NavLink.tsx         # Stylizowany link nawigacji
└── shared/
    └── LoadingSpinner.tsx  # Wskaźnik ładowania (do wykorzystania później)
```

### Hierarchia komponentów

```
RootLayout (app/layout.tsx)
└── Toaster (sonner)
└── MainLayout
    ├── Header
    │   ├── Logo
    │   ├── NavLink (Desktop - widoczne md+)
    │   └── ProfileDropdown / AuthButtons
    ├── <main> (biała karta z treścią)
    │   └── {children}
    └── BottomNav (Mobile - widoczne poniżej md)
        └── NavLink[]
```

---

## 4. Szczegóły komponentów

### 4.1 RootLayout (`app/layout.tsx`)

- **Opis:** Główny layout aplikacji ustawiający język (`pl`), fonty, metadata i provider dla toast notifications
- **Główne elementy:**
  - `<html lang="pl">` - ustawienie języka polskiego
  - Font: Nunito (lub Quicksand) dla przyjaznego, dziecięcego charakteru
  - Geist Mono dla kodu (jeśli potrzebne)
  - `<Toaster>` z biblioteki Sonner dla powiadomień
- **Obsługiwane interakcje:** Brak (statyczny wrapper)
- **Walidacja:** Brak
- **Typy:** `{ children: React.ReactNode }`
- **Propsy:** `children`

### 4.2 MainLayout (`components/layout/MainLayout.tsx`)

- **Opis:** Wrapper implementujący strukturę "karta na tle" - beżowe tło z białą kartą treści wycentrowaną na stronie
- **Główne elementy:**
  - `<div>` - kontener z beżowym tłem (`bg-background`)
  - `<Header>` - nawigacja desktop
  - `<main>` - biała karta z treścią (`bg-card`, `rounded-2xl`, `shadow-sm`)
  - `<BottomNav>` - nawigacja mobile (widoczna tylko poniżej md)
  - Padding bottom na mobile dla BottomNav
- **Obsługiwane interakcje:** Brak (statyczny wrapper)
- **Walidacja:** Brak
- **Typy:**
  ```typescript
  interface MainLayoutProps {
    children: React.ReactNode;
    maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  }
  ```
- **Propsy:** `children`, `maxWidth` (domyślnie `"lg"`)

### 4.3 Header (`components/layout/Header.tsx`)

- **Opis:** Górna nawigacja desktop z logo, linkami nawigacji i menu użytkownika/przyciskami autoryzacji
- **Główne elementy:**
  - `<header>` z rolą `banner`
  - `<Logo>` - link do strony głównej
  - `<nav>` z linkami (widoczne `hidden md:flex`)
  - Warunkowe renderowanie:
    - Zalogowany: Generator, Moja biblioteka, Galeria, ProfileDropdown
    - Niezalogowany: Galeria, Zaloguj się, Zarejestruj się
- **Obsługiwane interakcje:**
  - Kliknięcie logo → `/`
  - Kliknięcie linków nawigacji → odpowiednie ścieżki
  - Kliknięcie ProfileDropdown → rozwija menu
- **Walidacja:** Brak
- **Typy:**
  ```typescript
  interface HeaderProps {
    user: User | null;
  }
  ```
- **Propsy:** `user` - obiekt użytkownika z Supabase Auth lub null

### 4.4 BottomNav (`components/layout/BottomNav.tsx`)

- **Opis:** Dolny pasek nawigacji dla urządzeń mobilnych, widoczny tylko dla zalogowanych użytkowników
- **Główne elementy:**
  - `<nav>` fixed na dole ekranu (`fixed bottom-0 left-0 right-0`)
  - 4 ikony nawigacji: Generator (🎨), Biblioteka (📚), Galeria (🖼️), Profil (👤)
  - Każda ikona to `<NavLink>` z ikoną i etykietą
  - Wysokość: 64px, z-index wyższy od treści
- **Obsługiwane interakcje:**
  - Kliknięcie ikony → nawigacja do odpowiedniej ścieżki
- **Walidacja:** Brak
- **Typy:**
  ```typescript
  interface BottomNavProps {
    activeRoute: string;
  }
  ```
- **Propsy:** `activeRoute` - aktualna ścieżka do podświetlenia aktywnego linku

### 4.5 ProfileDropdown (`components/layout/ProfileDropdown.tsx`)

- **Opis:** Menu rozwijane użytkownika z opcją wylogowania
- **Główne elementy:**
  - `<DropdownMenu>` z ShadCN
  - Trigger: Avatar/ikona użytkownika
  - Zawartość:
    - Email użytkownika (disabled, tylko informacja)
    - Separator
    - "Wyloguj się" - przycisk akcji
- **Obsługiwane interakcje:**
  - Kliknięcie triggera → rozwija/zwija menu
  - Kliknięcie "Wyloguj się" → wywołanie server action signOut
- **Walidacja:** Brak
- **Typy:**
  ```typescript
  interface ProfileDropdownProps {
    user: User;
  }
  ```
- **Propsy:** `user` - obiekt użytkownika z Supabase Auth

### 4.6 Logo (`components/layout/Logo.tsx`)

- **Opis:** Logo aplikacji Malowanko, link do strony głównej
- **Główne elementy:**
  - `<Link href="/">` - wrapper
  - Tekst "Malowanko" z charakterystycznym stylem lub SVG logo
  - Kolory akcentowe (koralowy/turkusowy)
- **Obsługiwane interakcje:**
  - Kliknięcie → nawigacja do `/`
- **Walidacja:** Brak
- **Typy:** Brak propsów
- **Propsy:** Brak

### 4.7 NavLink (`components/layout/NavLink.tsx`)

- **Opis:** Stylizowany link nawigacji z podświetleniem aktywnego stanu
- **Główne elementy:**
  - `<Link>` z Next.js
  - Warunkowe style dla aktywnego linku
  - Opcjonalna ikona (dla BottomNav)
- **Obsługiwane interakcje:**
  - Kliknięcie → nawigacja do href
- **Walidacja:** Brak
- **Typy:**
  ```typescript
  interface NavLinkProps {
    href: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    isActive?: boolean;
    className?: string;
  }
  ```
- **Propsy:** `href`, `children`, `icon`, `isActive`, `className`

---

## 5. Typy

### 5.1 Istniejące typy (z `app/types.ts`)

```typescript
// Już zdefiniowane w projekcie
export interface ProfileDTO {
  id: string;
  email: string;
  createdAt: string;
  generationsToday: number;
  remainingGenerations: number;
}

export interface GenerationLimitDTO {
  used: number;
  remaining: number;
  limit: number;
  resetsAt: string;
}
```

### 5.2 Nowe typy dla layoutu

```typescript
// components/layout/types.ts

import type { User } from "@supabase/supabase-js";

/** Props dla MainLayout */
export interface MainLayoutProps {
  children: React.ReactNode;
  /** Maksymalna szerokość karty treści */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

/** Props dla Header */
export interface HeaderProps {
  /** Użytkownik z Supabase Auth lub null dla niezalogowanych */
  user: User | null;
}

/** Props dla BottomNav */
export interface BottomNavProps {
  /** Aktualna ścieżka URL do podświetlenia aktywnego linku */
  activeRoute: string;
}

/** Props dla ProfileDropdown */
export interface ProfileDropdownProps {
  /** Zalogowany użytkownik */
  user: User;
}

/** Props dla NavLink */
export interface NavLinkProps {
  /** Docelowa ścieżka */
  href: string;
  /** Treść linku (tekst lub elementy) */
  children: React.ReactNode;
  /** Opcjonalna ikona (dla BottomNav) */
  icon?: React.ReactNode;
  /** Czy link jest aktywny */
  isActive?: boolean;
  /** Dodatkowe klasy CSS */
  className?: string;
}

/** Konfiguracja elementu nawigacji */
export interface NavItem {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Czy wymaga zalogowania */
  requiresAuth?: boolean;
  /** Czy widoczne tylko dla niezalogowanych */
  guestOnly?: boolean;
}
```

---

## 6. Zarządzanie stanem

### 6.1 Stan użytkownika

Stan użytkownika (czy zalogowany, dane profilu) pobierany jest z Supabase Auth na poziomie Server Components:

```typescript
// W layout.tsx lub komponencie serwerowym
import { createClient } from "@/app/db/server";

const supabase = await createClient();
const {
  data: { user },
} = await supabase.auth.getUser();
```

### 6.2 Przekazywanie stanu

- `user` przekazywany jako prop do `Header` i `BottomNav`
- `MainLayout` pobiera użytkownika i przekazuje do komponentów potomnych
- Brak potrzeby globalnego stanu (Context API) na tym etapie

### 6.3 Aktywna ścieżka

```typescript
// W komponencie Server lub Client
import { usePathname } from "next/navigation";

// Lub w Server Component:
import { headers } from "next/headers";
const pathname = (await headers()).get("x-pathname");
```

### 6.4 Przyszły Context dla limitu generowań

W przyszłości (przy implementacji generatora) zostanie dodany Context dla limitu generowań:

```typescript
// src/contexts/GenerationLimitContext.tsx (do implementacji później)
export const GenerationLimitContext = createContext<GenerationLimitDTO | null>(
  null
);
```

---

## 7. Integracja API

### 7.1 Pobieranie użytkownika (Server Component)

```typescript
// app/(main)/layout.tsx
import { createClient } from "@/app/db/server";

export default async function MainGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <MainLayout user={user}>{children}</MainLayout>;
}
```

### 7.2 Wylogowanie (Server Action)

```typescript
// src/lib/actions/auth.ts
"use server";

import { createClient } from "@/app/db/server";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
```

---

## 8. Interakcje użytkownika

| Interakcja                     | Komponent       | Rezultat                                |
| ------------------------------ | --------------- | --------------------------------------- |
| Kliknięcie logo                | Logo            | Nawigacja do `/`                        |
| Kliknięcie linku nawigacji     | NavLink         | Nawigacja do odpowiedniej ścieżki       |
| Kliknięcie ikony w BottomNav   | BottomNav       | Nawigacja do odpowiedniej ścieżki       |
| Kliknięcie avatara użytkownika | ProfileDropdown | Otwarcie menu dropdown                  |
| Kliknięcie "Wyloguj się"       | ProfileDropdown | Wywołanie signOut, redirect do `/`      |
| Kliknięcie "Zaloguj się"       | Header          | Nawigacja do `/auth`                    |
| Kliknięcie "Zarejestruj się"   | Header          | Nawigacja do `/auth`                    |
| Dostęp do chronionej ścieżki   | Middleware      | Redirect do `/auth?redirect={pathname}` |

---

## 9. Warunki i walidacja

### 9.1 Middleware autoryzacji

**Ścieżki chronione:** `/generator`, `/biblioteka`

**Warunki:**

- Jeśli użytkownik nie jest zalogowany i próbuje uzyskać dostęp do chronionej ścieżki → redirect do `/auth?redirect={originalPath}`
- Jeśli użytkownik jest zalogowany → przepuść żądanie

```typescript
// middleware.ts - rozszerzenie
const protectedRoutes = ["/generator", "/biblioteka"];

if (
  protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = new URL("/auth", request.url);
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
}
```

### 9.2 Warunkowe renderowanie nawigacji

**Header:**

- Niezalogowany: Galeria, Zaloguj się, Zarejestruj się
- Zalogowany: Generator, Moja biblioteka, Galeria, ProfileDropdown

**BottomNav:**

- Widoczny tylko dla zalogowanych użytkowników
- Na desktop (`md+`) ukryty

---

## 10. Obsługa błędów

### 10.1 Błąd pobierania użytkownika

Jeśli `supabase.auth.getUser()` zwróci błąd, traktujemy użytkownika jako niezalogowanego:

```typescript
const {
  data: { user },
  error,
} = await supabase.auth.getUser();
// Jeśli error lub !user - użytkownik niezalogowany
```

### 10.2 Błąd wylogowania

```typescript
export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    // Loguj błąd, ale kontynuuj redirect
    console.error("Sign out error:", error);
  }

  redirect("/");
}
```

### 10.3 Toast notifications (Sonner)

Konfiguracja w RootLayout:

```typescript
import { Toaster } from "sonner";

<Toaster position="top-right" richColors closeButton duration={4000} />;
```

---

## 11. Kroki implementacji

### Krok 1: Zainstaluj wymagane zależności

```bash
# Toast notifications
pnpm add sonner

# Ikony (jeśli nie zainstalowane)
pnpm add lucide-react

# Dodaj brakujące komponenty ShadCN
npx shadcn@latest add avatar
npx shadcn@latest add sheet
npx shadcn@latest add tooltip
```

### Krok 2: Zaktualizuj globalne style (`app/globals.css`)

Zastąp domyślne style kolorystyką Malowanko:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* ... zachowaj istniejące zmienne theme ... */
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
}

:root {
  /* Tła */
  --background: oklch(0.978 0.004 85); /* #FAF7F2 - beżowy */
  --foreground: oklch(0.205 0.015 285); /* ciemny tekst */

  /* Karta */
  --card: oklch(1 0 0); /* #FFFFFF - biały */
  --card-foreground: oklch(0.205 0.015 285);

  /* Primary - koralowy #FF6B6B */
  --primary: oklch(0.68 0.19 25);
  --primary-foreground: oklch(1 0 0);

  /* Secondary - turkusowy #4ECDC4 */
  --secondary: oklch(0.77 0.12 180);
  --secondary-foreground: oklch(0.205 0.015 285);

  /* Accent - żółty #FFE66D */
  --accent: oklch(0.91 0.15 95);
  --accent-foreground: oklch(0.205 0.015 285);

  /* Muted */
  --muted: oklch(0.96 0.005 85);
  --muted-foreground: oklch(0.45 0.015 285);

  /* Border & Input */
  --border: oklch(0.91 0.01 85);
  --input: oklch(0.91 0.01 85);
  --ring: oklch(0.68 0.19 25); /* primary */

  /* Destructive */
  --destructive: oklch(0.58 0.22 27);

  /* Radius - zaokrąglone rogi */
  --radius: 0.75rem; /* 12px base */

  /* ... pozostałe zmienne ... */
}

.dark {
  /* Dark mode - do uzupełnienia później */
  --background: oklch(0.145 0.01 285);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0.01 285);
  --card-foreground: oklch(0.985 0 0);
  --primary: oklch(0.72 0.17 25);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.7 0.1 180);
  --secondary-foreground: oklch(0.985 0 0);
  /* ... */
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Krok 3: Zaktualizuj RootLayout (`app/layout.tsx`)

```typescript
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Malowanko - Kolorowanki dla dzieci",
  description: "Generuj spersonalizowane kolorowanki dla dzieci za pomocą AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={nunito.variable}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </body>
    </html>
  );
}
```

### Krok 4: Utwórz typy layoutu (`components/layout/types.ts`)

Utwórz plik z interfejsami opisanymi w sekcji 5.2.

### Krok 5: Utwórz komponent Logo (`components/layout/Logo.tsx`)

```typescript
import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 text-xl font-bold tracking-tight"
    >
      <span className="text-primary">Malo</span>
      <span className="text-secondary">wanko</span>
    </Link>
  );
}
```

### Krok 6: Utwórz komponent NavLink (`components/layout/NavLink.tsx`)

```typescript
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { NavLinkProps } from "./types";

export function NavLink({
  href,
  children,
  icon,
  isActive,
  className,
}: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
        className
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
```

### Krok 7: Utwórz komponent Header (`components/layout/Header.tsx`)

Implementuj nawigację desktop z warunkowym renderowaniem dla zalogowanych/niezalogowanych.

### Krok 8: Utwórz komponent ProfileDropdown (`components/layout/ProfileDropdown.tsx`)

Użyj `DropdownMenu` z ShadCN i zintegruj z server action `signOut`.

### Krok 9: Utwórz komponent BottomNav (`components/layout/BottomNav.tsx`)

Implementuj fixed bottom nav z ikonami dla urządzeń mobilnych.

### Krok 10: Utwórz komponent MainLayout (`components/layout/MainLayout.tsx`)

```typescript
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  user: User | null;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

const maxWidthClasses = {
  sm: "max-w-xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
  full: "max-w-full",
};

export function MainLayout({
  children,
  user,
  maxWidth = "lg",
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      <main
        className={cn(
          "mx-auto px-4 py-6 pb-20 md:pb-6",
          maxWidthClasses[maxWidth]
        )}
      >
        <div className="bg-card rounded-2xl shadow-sm p-6">{children}</div>
      </main>

      {user && <BottomNav />}
    </div>
  );
}
```

### Krok 11: Utwórz server action signOut (`src/lib/actions/auth.ts`)

```typescript
"use server";

import { createClient } from "@/app/db/server";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
```

### Krok 12: Zaktualizuj middleware (`middleware.ts`)

Dodaj ochronę ścieżek `/generator` i `/biblioteka`.

### Krok 13: Utwórz route group `(main)` z layoutem

```typescript
// app/(main)/layout.tsx
import { createClient } from "@/app/db/server";
import { MainLayout } from "@/components/layout/MainLayout";

export default async function MainGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <MainLayout user={user}>{children}</MainLayout>;
}
```

### Krok 14: Utwórz placeholder pages

Utwórz podstawowe strony dla `/galeria`, `/generator`, `/biblioteka` z placeholderem "W budowie".

### Krok 15: Przetestuj responsywność

- Sprawdź Header na desktop (md+)
- Sprawdź BottomNav na mobile (<md)
- Sprawdź kartę treści na różnych szerokościach
- Sprawdź middleware redirect dla chronionych ścieżek

### Krok 16: Dodaj Skip Link dla dostępności

```typescript
// W MainLayout lub Header
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg z-50"
>
  Przejdź do treści
</a>

// W main
<main id="main-content" ...>
```

---

## 12. Podsumowanie

Po wykonaniu wszystkich kroków aplikacja będzie posiadała:

1. ✅ Spójną kolorystykę (beżowy, koralowy, turkusowy, żółty)
2. ✅ Responsywny layout "karta na tle"
3. ✅ Nawigację desktop w headerze
4. ✅ Nawigację mobile jako fixed bottom bar
5. ✅ Menu użytkownika z wylogowaniem
6. ✅ Ochronę ścieżek wymagających autoryzacji
7. ✅ Toast notifications z Sonner
8. ✅ Poprawne metadata i język polski
9. ✅ Przygotowaną strukturę pod dark mode

Ten szkielet stanowi fundament dla wszystkich widoków aplikacji Malowanko.
