# Stos technologiczny - Malowanko

## Przegląd

## Frontend

### Next.js 16

Zastosowanie w projekcie:

- App Router do obsługi routingu aplikacji
- Server Components do optymalizacji wydajności
- Server Actions do obsługi formularzy i mutacji danych
- API Routes do tworzenia endpointów backendowych
- Middleware do obsługi autoryzacji i przekierowań
- Image Optimization do optymalizacji obrazków kolorowanek

### TypeScript

Zastosowanie w projekcie:

- Typowanie wszystkich komponentów React
- Interfejsy dla modeli danych (kolorowanki, użytkownicy, tagi)
- Typowanie odpowiedzi z API OpenAI i Supabase
- Walidacja props i state w komponentach

### Tailwind CSS

### ShadCN

## Backend

### Supabase

Platforma Backend-as-a-Service (BaaS) oparta na PostgreSQL.

Zastosowanie w projekcie:

Baza danych PostgreSQL:

- Tabela users (profile użytkowników)
- Tabela coloring_pages (wygenerowane kolorowanki)
- Tabela tags (tagi kolorowanek)
- Tabela favorites (ulubione kolorowanki)
- Tabela daily_usage (tracking limitu dziennego)

Storage:

- Bucket na obrazki kolorowanek
- Automatyczna optymalizacja i CDN
- Publiczny dostęp do kolorowanek w galerii

Row Level Security (RLS):

- Użytkownicy widzą tylko swoje kolorowanki w bibliotece
- Publiczny dostęp do galerii (tylko odczyt)
- Ochrona przed nieautoryzowanym dostępem

### Supabase Auth

System autoryzacji zintegrowany z Supabase.

Zastosowanie w projekcie:

- Magic link authentication (logowanie przez e-mail)
- Zarządzanie sesjami użytkowników
- Middleware Next.js do ochrony tras
- Automatyczne odświeżanie tokenów

Flow autoryzacji:

1. Użytkownik podaje e-mail
2. Supabase wysyła magic link
3. Kliknięcie linka weryfikuje użytkownika
4. Sesja jest tworzona i przechowywana w cookies
5. Middleware sprawdza sesję przy każdym żądaniu

## Integracje zewnętrzne

### OpenAI API

API do generowania obrazków i analizy tekstu.

Zastosowanie w projekcie:

Generowanie kolorowanek (DALL-E 3):

- Generowanie obrazków line art na podstawie promptów
- Parametryzacja stylu i poziomu szczegółowości
- Format wyjściowy zoptymalizowany do druku

Walidacja bezpieczeństwa (GPT-4):

- Analiza promptów przed generowaniem
- Wykrywanie nieodpowiednich treści
- Generowanie przyjaznych komunikatów o błędach

Automatyczne tagowanie (GPT-4):

- Ekstrakcja 3-5 tagów z promptu i obrazka
- Tagi w języku polskim
- Kategoryzacja tematyczna

## Hosting i infrastruktura

### Vercel

## Narzędzia developerskie

### ESLint

### Prettier

### pnpm

## Diagram architektury

```
┌─────────────────────────────────────────────────────────────┐
│                         Klient                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Next.js App                       │    │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────────────┐  │    │
│  │  │  ShadCN   │ │  Tailwind │ │    TypeScript     │  │    │
│  │  │    UI     │ │    CSS    │ │                   │  │    │
│  │  └───────────┘ └───────────┘ └───────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Vercel Edge                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Next.js API Routes                      │    │
│  │         Server Actions / Middleware                  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│       Supabase          │     │      OpenAI API         │
│  ┌───────────────────┐  │     │  ┌───────────────────┐  │
│  │    PostgreSQL     │  │     │  │     DALL-E 3      │  │
│  │    (Database)     │  │     │  │  (Generowanie)    │  │
│  └───────────────────┘  │     │  └───────────────────┘  │
│  ┌───────────────────┐  │     │  ┌───────────────────┐  │
│  │     Storage       │  │     │  │      GPT-4        │  │
│  │    (Obrazki)      │  │     │  │   (Walidacja)     │  │
│  └───────────────────┘  │     │  └───────────────────┘  │
│  ┌───────────────────┐  │     └─────────────────────────┘
│  │      Auth         │  │
│  │   (Magic Link)    │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

## Wymagania systemowe

### Development

- Node.js 20+
- pnpm 9+
- Git

### Zmienne środowiskowe

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

## Wersje zależności

| Pakiet                | Wersja |
| --------------------- | ------ |
| Next.js               | 16.x   |
| React                 | 19.x   |
| TypeScript            | 5.x    |
| Tailwind CSS          | 4.x    |
| @supabase/supabase-js | 2.x    |
| @supabase/ssr         | 0.x    |
| openai                | 4.x    |
