# Przewodnik Deploymentu - Malowanko

Kompleksowy przewodnik deploymentu aplikacji Malowanko na Vercel oraz migracji lokalnej konfiguracji Supabase do środowiska produkcyjnego.

## Spis treści

1. [Przygotowanie do deploymentu](#przygotowanie-do-deploymentu)
2. [Deployment na Vercel](#deployment-na-vercel)
3. [Migracja Supabase do produkcji](#migracja-supabase-do-produkcji)
4. [Konfiguracja zmiennych środowiskowych](#konfiguracja-zmiennych-środowiskowych)
5. [Weryfikacja deploymentu](#weryfikacja-deploymentu)
6. [Rozwiązywanie problemów](#rozwiązywanie-problemów)

---

## Przygotowanie do deploymentu

### Wymagania wstępne

Przed rozpoczęciem deploymentu upewnij się, że masz:

- ✅ Konto na [Vercel](https://vercel.com)
- ✅ Konto na [Supabase](https://supabase.com)
- ✅ Repozytorium Git (GitHub, GitLab lub Bitbucket)
- ✅ Lokalna aplikacja działa poprawnie (`pnpm dev`)
- ✅ Wszystkie testy przechodzą (`pnpm test:all`)

### Checklist przed deploymentem

- [ ] Kod jest w repozytorium Git
- [ ] Wszystkie zmiany są commitowane
- [ ] Testy jednostkowe przechodzą
- [ ] Testy E2E przechodzą
- [ ] Linter nie zgłasza błędów
- [ ] Build produkcyjny działa lokalnie (`pnpm build`)
- [ ] Migracje Supabase są gotowe do wdrożenia

---

## Deployment na Vercel

### Metoda 1: Deployment przez Vercel Dashboard (Rekomendowane)

#### Krok 1: Połącz repozytorium z Vercel

1. Zaloguj się do [Vercel Dashboard](https://vercel.com/dashboard)
2. Kliknij **"Add New..."** → **"Project"**
3. Wybierz repozytorium z listy lub połącz nowe repozytorium
4. Vercel automatycznie wykryje projekt Next.js

#### Krok 2: Konfiguracja projektu

Vercel automatycznie wykryje następujące ustawienia:

- **Framework Preset**: Next.js
- **Build Command**: `pnpm build` (lub automatycznie wykryty)
- **Output Directory**: `.next` (automatycznie)
- **Install Command**: `pnpm install` (automatycznie)

**Uwaga**: Jeśli używasz `pnpm`, upewnij się, że w projekcie jest plik `.npmrc` z zawartością:
```
engine-strict=true
```

#### Krok 3: Konfiguracja zmiennych środowiskowych

Przejdź do sekcji **"Environment Variables"** i dodaj wszystkie wymagane zmienne (szczegóły w sekcji [Konfiguracja zmiennych środowiskowych](#konfiguracja-zmiennych-środowiskowych)).

#### Krok 4: Deploy

1. Kliknij **"Deploy"**
2. Vercel automatycznie:
   - Zainstaluje zależności (`pnpm install`)
   - Zbuduje aplikację (`pnpm build`)
   - Wdroży aplikację na Edge Network
3. Po zakończeniu otrzymasz URL aplikacji (np. `https://malowanko.vercel.app`)

### Metoda 2: Deployment przez Vercel CLI

#### Krok 1: Instalacja Vercel CLI

```bash
npm i -g vercel
# lub
pnpm add -g vercel
```

#### Krok 2: Logowanie

```bash
vercel login
```

#### Krok 3: Deployment

```bash
# Pierwszy deployment (wymaga konfiguracji)
vercel

# Kolejne deploymenty
vercel --prod
```

#### Krok 4: Konfiguracja zmiennych środowiskowych przez CLI

```bash
# Dodaj zmienną dla wszystkich środowisk
vercel env add NEXT_PUBLIC_SUPABASE_URL production

# Dodaj zmienną tylko dla preview
vercel env add NEXT_PUBLIC_SUPABASE_URL preview

# Dodaj zmienną tylko dla development
vercel env add NEXT_PUBLIC_SUPABASE_URL development
```

### Automatyczny deployment z Git

Vercel automatycznie wdraża aplikację przy każdym pushu do głównej gałęzi:

- **Push do `main`** → automatyczny deployment do produkcji
- **Push do innych gałęzi** → automatyczny deployment do preview environment
- **Pull Request** → automatyczny deployment do preview environment

### Konfiguracja domeny niestandardowej (opcjonalnie)

1. W Vercel Dashboard przejdź do **Settings** → **Domains**
2. Dodaj domenę (np. `malowanko.pl`)
3. Skonfiguruj DNS zgodnie z instrukcjami Vercel
4. Zaktualizuj `NEXT_PUBLIC_APP_URL` w zmiennych środowiskowych

---

## Migracja Supabase do produkcji

### Krok 1: Utworzenie projektu produkcyjnego w Supabase

1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com)
2. Kliknij **"New Project"**
3. Wypełnij formularz:
   - **Name**: `malowanko-production` (lub inna nazwa)
   - **Database Password**: Wygeneruj silne hasło (zapisz je!)
   - **Region**: Wybierz region najbliższy użytkownikom (np. `West Europe`)
   - **Pricing Plan**: Wybierz odpowiedni plan
4. Kliknij **"Create new project"**
5. Poczekaj na utworzenie projektu (2-3 minuty)

### Krok 2: Pobranie danych dostępowych

Po utworzeniu projektu:

1. Przejdź do **Settings** → **API**
2. Skopiuj następujące wartości:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ **NIGDY nie udostępniaj publicznie!**)

### Krok 3: Linkowanie lokalnego projektu z produkcją

#### Instalacja Supabase CLI (jeśli jeszcze nie masz)

```bash
npm install -g supabase
# lub
pnpm add -g supabase
```

#### Linkowanie projektu

```bash
# Zaloguj się do Supabase
supabase login

# Linkuj lokalny projekt z projektem produkcyjnym
supabase link --project-ref <project-ref>
```

**Gdzie znaleźć `project-ref`?**
- W Supabase Dashboard: **Settings** → **General** → **Reference ID**
- Lub w URL projektu: `https://app.supabase.com/project/<project-ref>`

### Krok 4: Weryfikacja migracji lokalnych

Przed wdrożeniem migracji do produkcji, upewnij się, że wszystkie migracje są gotowe:

```bash
# Sprawdź listę migracji
ls -la supabase/migrations/

# Powinieneś zobaczyć:
# - 20260103100000_initial_schema.sql
# - 20260104230000_increase_daily_limit.sql
```

### Krok 5: Wdrożenie migracji do produkcji

#### Metoda 1: Przez Supabase CLI (Rekomendowane)

```bash
# Wdróż wszystkie migracje do produkcji
supabase db push

# Lub wdróż konkretną migrację
supabase migration up --db-url "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

**Uwaga**: Dla bezpieczeństwa, użyj connection string z zmiennych środowiskowych:

```bash
# Pobierz connection string z Supabase Dashboard
# Settings → Database → Connection string → URI
supabase db push --db-url "$DATABASE_URL"
```

#### Metoda 2: Przez Supabase Dashboard

1. Przejdź do **SQL Editor** w Supabase Dashboard
2. Otwórz każdą migrację z `supabase/migrations/`
3. Skopiuj zawartość SQL
4. Wklej do SQL Editor
5. Uruchom zapytanie

**⚠️ UWAGA**: Upewnij się, że wykonujesz migracje w odpowiedniej kolejności (chronologicznie).

### Krok 6: Konfiguracja Storage Bucket

Migracja `20260103100000_initial_schema.sql` automatycznie tworzy bucket `colorings`, ale upewnij się, że jest poprawnie skonfigurowany:

1. Przejdź do **Storage** w Supabase Dashboard
2. Sprawdź, czy bucket `colorings` istnieje
3. Jeśli nie istnieje, utwórz go:
   - **Name**: `colorings`
   - **Public bucket**: ✅ Tak (publiczny dostęp do obrazków)
   - **File size limit**: 50MB (lub zgodnie z potrzebami)
   - **Allowed MIME types**: `image/png`, `image/jpeg`, `image/webp`

### Krok 7: Konfiguracja Row Level Security (RLS)

RLS jest automatycznie konfigurowany przez migracje, ale warto zweryfikować:

1. Przejdź do **Authentication** → **Policies**
2. Sprawdź, czy wszystkie tabele mają włączone RLS:
   - `profiles`
   - `colorings`
   - `user_library`
   - `favorites`
3. Sprawdź, czy wszystkie polityki są aktywne

### Krok 8: Konfiguracja Auth (Magic Links)

1. Przejdź do **Authentication** → **URL Configuration**
2. Ustaw **Site URL**: URL Twojej aplikacji na Vercel (np. `https://malowanko.vercel.app`)
3. Dodaj **Redirect URLs**:
   - `https://malowanko.vercel.app/auth/verify`
   - `https://malowanko.vercel.app/auth/verify?*` (dla parametrów)

### Krok 9: Konfiguracja Email (opcjonalnie)

Domyślnie Supabase używa własnego serwera SMTP. Dla produkcji zalecane jest użycie zewnętrznego dostawcy:

1. Przejdź do **Authentication** → **Email Templates**
2. Opcjonalnie: Przejdź do **Settings** → **Auth** → **SMTP Settings**
3. Skonfiguruj zewnętrznego dostawcę SMTP (np. SendGrid, AWS SES, Mailgun)

---

## Konfiguracja zmiennych środowiskowych

### Wymagane zmienne środowiskowe

Dodaj następujące zmienne w Vercel Dashboard (**Settings** → **Environment Variables**):

#### Dla wszystkich środowisk (Production, Preview, Development)

```env
# Supabase - Dane dostępowe do projektu produkcyjnego
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenRouter - API do generowania obrazków
OPENROUTER_API_KEY=sk-or-v1-xxxxx...

# App - URL aplikacji (różny dla każdego środowiska)
NEXT_PUBLIC_APP_URL=https://malowanko.vercel.app
```

#### Tylko dla Production

```env
NEXT_PUBLIC_APP_URL=https://malowanko.vercel.app
# lub domena niestandardowa
NEXT_PUBLIC_APP_URL=https://malowanko.pl
```

#### Tylko dla Preview (opcjonalnie - dla testów)

```env
NEXT_PUBLIC_APP_URL=https://malowanko-git-main-username.vercel.app
```

### Gdzie znaleźć wartości?

#### Supabase

1. **NEXT_PUBLIC_SUPABASE_URL**: 
   - Supabase Dashboard → **Settings** → **API** → **Project URL**

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**: 
   - Supabase Dashboard → **Settings** → **API** → **anon public** key

3. **SUPABASE_SERVICE_ROLE_KEY**: 
   - Supabase Dashboard → **Settings** → **API** → **service_role** key
   - ⚠️ **NIGDY nie udostępniaj publicznie!**

#### OpenRouter

1. Zaloguj się do [OpenRouter](https://openrouter.ai)
2. Przejdź do **Keys**
3. Skopiuj klucz API

#### NEXT_PUBLIC_APP_URL

- **Production**: URL Twojej aplikacji na Vercel (np. `https://malowanko.vercel.app`)
- **Preview**: Automatycznie generowany przez Vercel dla każdego PR

### Konfiguracja w Vercel Dashboard

1. Przejdź do projektu w Vercel Dashboard
2. Kliknij **Settings** → **Environment Variables**
3. Dodaj każdą zmienną:
   - **Key**: Nazwa zmiennej (np. `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: Wartość zmiennej
   - **Environment**: Wybierz środowisko (Production, Preview, Development)
4. Kliknij **Save**

### Weryfikacja zmiennych środowiskowych

Po dodaniu zmiennych, wykonaj redeploy:

```bash
# Przez Vercel Dashboard
# Settings → Deployments → Kliknij "..." → "Redeploy"

# Przez CLI
vercel --prod
```

---

## Weryfikacja deploymentu

### 1. Sprawdzenie działania aplikacji

1. Otwórz URL aplikacji na Vercel
2. Sprawdź, czy strona się ładuje
3. Sprawdź konsolę przeglądarki (F12) pod kątem błędów

### 2. Test autoryzacji

1. Przejdź do `/auth`
2. Wprowadź adres email
3. Sprawdź, czy magic link został wysłany
4. Kliknij link w emailu
5. Sprawdź, czy logowanie działa

### 3. Test generowania kolorowanek

1. Zaloguj się do aplikacji
2. Przejdź do `/generator`
3. Wygeneruj testową kolorowankę
4. Sprawdź, czy obrazek został zapisany w Supabase Storage
5. Sprawdź, czy kolorowanka pojawiła się w bibliotece

### 4. Test biblioteki

1. Przejdź do `/biblioteka`
2. Sprawdź, czy wygenerowane kolorowanki są widoczne
3. Sprawdź paginację i filtrowanie

### 5. Test galerii

1. Przejdź do `/galeria`
2. Sprawdź, czy publiczne kolorowanki są widoczne
3. Sprawdź wyszukiwanie i filtrowanie

### 6. Sprawdzenie logów

#### Vercel Logs

1. W Vercel Dashboard przejdź do **Deployments**
2. Kliknij na najnowszy deployment
3. Przejdź do zakładki **Functions** lub **Runtime Logs**
4. Sprawdź, czy nie ma błędów

#### Supabase Logs

1. W Supabase Dashboard przejdź do **Logs**
2. Sprawdź:
   - **API Logs**: Zapytania do API
   - **Auth Logs**: Logi autoryzacji
   - **Database Logs**: Zapytania do bazy danych
   - **Storage Logs**: Operacje na Storage

### 7. Sprawdzenie wydajności

1. Użyj [Vercel Analytics](https://vercel.com/analytics) (jeśli włączone)
2. Sprawdź czasy odpowiedzi w Vercel Dashboard
3. Sprawdź wykorzystanie zasobów w Supabase Dashboard

---

## Rozwiązywanie problemów

### Problem: Build fails na Vercel

**Możliwe przyczyny:**

1. **Brakujące zmienne środowiskowe**
   - **Rozwiązanie**: Sprawdź, czy wszystkie wymagane zmienne są dodane w Vercel Dashboard

2. **Błędy TypeScript**
   - **Rozwiązanie**: Uruchom lokalnie `pnpm build` i napraw błędy

3. **Problemy z zależnościami**
   - **Rozwiązanie**: Sprawdź `package.json` i upewnij się, że wszystkie zależności są poprawnie zdefiniowane

**Debugowanie:**

```bash
# Sprawdź logi builda w Vercel Dashboard
# Deployments → Kliknij na failed deployment → Build Logs
```

### Problem: Aplikacja nie łączy się z Supabase

**Możliwe przyczyny:**

1. **Nieprawidłowy URL Supabase**
   - **Rozwiązanie**: Sprawdź `NEXT_PUBLIC_SUPABASE_URL` w Vercel Dashboard

2. **Nieprawidłowy klucz API**
   - **Rozwiązanie**: Sprawdź `NEXT_PUBLIC_SUPABASE_ANON_KEY` w Vercel Dashboard

3. **RLS blokuje zapytania**
   - **Rozwiązanie**: Sprawdź polityki RLS w Supabase Dashboard

**Debugowanie:**

```javascript
// Dodaj tymczasowo do kodu (tylko do debugowania!)
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20));
```

### Problem: Magic links nie działają

**Możliwe przyczyny:**

1. **Nieprawidłowy redirect URL**
   - **Rozwiązanie**: Sprawdź konfigurację w Supabase Dashboard → **Authentication** → **URL Configuration**

2. **Email nie jest wysyłany**
   - **Rozwiązanie**: Sprawdź logi w Supabase Dashboard → **Logs** → **Auth Logs**

3. **Nieprawidłowy NEXT_PUBLIC_APP_URL**
   - **Rozwiązanie**: Upewnij się, że `NEXT_PUBLIC_APP_URL` wskazuje na poprawny URL aplikacji

**Debugowanie:**

1. Sprawdź logi autoryzacji w Supabase Dashboard
2. Sprawdź, czy email został wysłany (w Supabase Dashboard → **Authentication** → **Users**)

### Problem: Migracje nie działają

**Możliwe przyczyny:**

1. **Błędy w SQL**
   - **Rozwiązanie**: Sprawdź składnię SQL w migracjach

2. **Konflikty z istniejącymi danymi**
   - **Rozwiązanie**: Sprawdź, czy migracje są idempotentne (używają `IF NOT EXISTS`, `ON CONFLICT`, etc.)

3. **Brakujące uprawnienia**
   - **Rozwiązanie**: Upewnij się, że używasz service role key lub masz odpowiednie uprawnienia

**Debugowanie:**

```bash
# Sprawdź status migracji
supabase migration list

# Sprawdź szczegóły błędu
supabase db push --debug
```

### Problem: Storage bucket nie działa

**Możliwe przyczyny:**

1. **Bucket nie istnieje**
   - **Rozwiązanie**: Utwórz bucket `colorings` w Supabase Dashboard → **Storage**

2. **Nieprawidłowe polityki Storage**
   - **Rozwiązanie**: Sprawdź polityki RLS dla Storage w Supabase Dashboard

3. **Nieprawidłowe uprawnienia**
   - **Rozwiązanie**: Upewnij się, że bucket jest publiczny (jeśli wymagane)

**Debugowanie:**

1. Sprawdź Storage w Supabase Dashboard → **Storage**
2. Sprawdź polityki RLS dla Storage
3. Sprawdź logi Storage w Supabase Dashboard → **Logs** → **Storage Logs**

### Problem: Obrazki nie ładują się

**Możliwe przyczyny:**

1. **Nieprawidłowa konfiguracja Next.js Image**
   - **Rozwiązanie**: Sprawdź `next.config.ts` - czy URL Supabase jest dodany do `remotePatterns`

2. **CORS issues**
   - **Rozwiązanie**: Sprawdź konfigurację CORS w Supabase Dashboard

3. **Nieprawidłowe URL-e obrazków**
   - **Rozwiązanie**: Sprawdź, czy `image_url` w bazie danych jest poprawny

**Debugowanie:**

```typescript
// Sprawdź konfigurację w next.config.ts
console.log('Remote patterns:', nextConfig.images.remotePatterns);
```

---

## Najlepsze praktyki

### Bezpieczeństwo

1. **Nigdy nie commituj kluczy API do Git**
   - Używaj zmiennych środowiskowych
   - Sprawdź `.gitignore` (powinien zawierać `.env*`)

2. **Ogranicz dostęp do SUPABASE_SERVICE_ROLE_KEY**
   - Używaj tylko po stronie serwera
   - Nigdy nie eksportuj do klienta

3. **Włącz RLS na wszystkich tabelach**
   - Sprawdź, czy wszystkie tabele mają włączone RLS
   - Przetestuj polityki RLS przed deploymentem

### Wydajność

1. **Używaj Edge Functions dla operacji serverless**
   - Vercel automatycznie optymalizuje Next.js API routes

2. **Optymalizuj obrazy**
   - Używaj Next.js Image component
   - Konfiguruj odpowiednie rozmiary obrazków

3. **Cache'uj zapytania gdzie to możliwe**
   - Używaj `revalidate` w Next.js
   - Konfiguruj odpowiednie cache headers

### Monitoring

1. **Włącz Vercel Analytics** (opcjonalnie)
   - Przejdź do **Analytics** w Vercel Dashboard
   - Włącz Web Analytics

2. **Monitoruj logi Supabase**
   - Regularnie sprawdzaj logi w Supabase Dashboard
   - Skonfiguruj alerty dla błędów

3. **Używaj Error Tracking** (opcjonalnie)
   - Rozważ integrację z Sentry lub podobnym narzędziem

### Backup

1. **Regularnie rób backup bazy danych**
   - Supabase automatycznie tworzy backupy, ale warto mieć własne
   - Używaj `pg_dump` do eksportu danych

2. **Versionuj migracje**
   - Wszystkie zmiany w bazie danych powinny być w migracjach
   - Nigdy nie modyfikuj bazy produkcyjnej ręcznie

---

## Przydatne linki

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase CLI](https://supabase.com/docs/reference/cli)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## Checklist deploymentu

### Przed deploymentem

- [ ] Kod jest w repozytorium Git
- [ ] Wszystkie testy przechodzą lokalnie
- [ ] Build produkcyjny działa lokalnie
- [ ] Migracje Supabase są gotowe
- [ ] Projekt produkcyjny Supabase jest utworzony

### Deployment Vercel

- [ ] Projekt jest połączony z Vercel
- [ ] Wszystkie zmienne środowiskowe są dodane
- [ ] Build przechodzi pomyślnie
- [ ] Aplikacja jest dostępna pod URL-em

### Migracja Supabase

- [ ] Projekt produkcyjny Supabase jest utworzony
- [ ] Migracje są wdrożone do produkcji
- [ ] Storage bucket `colorings` jest utworzony
- [ ] RLS jest skonfigurowany
- [ ] Auth redirect URLs są skonfigurowane

### Weryfikacja

- [ ] Aplikacja ładuje się poprawnie
- [ ] Autoryzacja działa (magic links)
- [ ] Generowanie kolorowanek działa
- [ ] Biblioteka działa
- [ ] Galeria działa
- [ ] Logi nie pokazują błędów

---

**Ostatnia aktualizacja**: 2026-01-25
