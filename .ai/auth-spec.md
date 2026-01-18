# Specyfikacja architektury modułu autentykacji - Malowanko

## 1. Przegląd

Moduł autentykacji implementuje system rejestracji, logowania i wylogowywania użytkowników oparty wyłącznie na magic linkach (OTP) wysyłanych na adres e-mail. System wykorzystuje Supabase Auth do zarządzania sesjami, weryfikacji użytkowników i integracji z bazą danych.

### 1.1 Wymagania funkcjonalne

- **US-001**: Rejestracja nowego użytkownika przez magic link
- **US-002**: Logowanie istniejącego użytkownika przez magic link
- **US-003**: Wylogowanie z aplikacji
- **US-004**: Obsługa wygasłego magic linka
- **US-005**: Obsługa nieistniejącego konta przy logowaniu

### 1.2 Założenia techniczne

- Autoryzacja wyłącznie przez magic link (e-mail) - bez haseł
- Sesja użytkownika utrzymywana między wizytami
- Automatyczne tworzenie profilu w tabeli `profiles` przy rejestracji (trigger w bazie)
- Integracja z istniejącym middleware Next.js
- Zgodność z istniejącą strukturą projektu (App Router, Server Components, Server Actions)

---

## 2. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 2.1 Struktura stron i routingu

#### 2.1.1 Nowa grupa routingu: `(auth)`

Utworzenie nowej grupy routingu `app/(auth)/` dla stron autentykacji, która będzie miała własny layout bez nawigacji głównej.

**Struktura:**
```
app/
  (auth)/
    auth/
      page.tsx          # Główna strona autentykacji (rejestracja/logowanie)
      verify/
        page.tsx        # Weryfikacja magic linka
    layout.tsx          # Layout dla stron autentykacji (bez nawigacji)
```

**Layout `(auth)/layout.tsx`:**
- Minimalistyczny layout bez Header i BottomNav
- Tylko logo i treść strony
- Tło spójne z resztą aplikacji
- Responsywny design

#### 2.1.2 Strona główna autentykacji: `/auth`

**Komponent:** `app/(auth)/auth/page.tsx` (Server Component)

**Funkcjonalność:**
- Wyświetla formularz rejestracji/logowania w zależności od stanu
- Przekierowuje zalogowanych użytkowników do `/galeria`
- Obsługuje parametr `redirect` z query string dla powrotu po zalogowaniu
- Wyświetla odpowiednie komunikaty błędów i sukcesu

**Renderowanie:**
- Server Component sprawdza stan sesji użytkownika
- Jeśli użytkownik jest zalogowany → redirect do `/galeria` lub `redirect` param
- Jeśli niezalogowany → renderuje formularz autentykacji

#### 2.1.3 Strona weryfikacji: `/auth/verify`

**Komponent:** `app/(auth)/auth/verify/page.tsx` (Server Component)

**Funkcjonalność:**
- Odbiera token z query string (`token_hash`, `type`)
- Weryfikuje magic link przez Supabase Auth
- Obsługuje różne typy tokenów (signup, recovery, email_change)
- Przekierowuje po udanej weryfikacji
- Obsługuje błędy weryfikacji (wygasły/nieprawidłowy token) - przekierowanie do `/auth` z parametrem błędu

**Scenariusze:**
1. **Udana weryfikacja nowego użytkownika:**
   - Tworzy konto w Supabase Auth
   - Trigger automatycznie tworzy profil w `profiles`
   - Loguje użytkownika
   - Przekierowuje do `/galeria` lub `redirect` param

2. **Udana weryfikacja istniejącego użytkownika:**
   - Loguje użytkownika
   - Przekierowuje do `/galeria` lub `redirect` param

3. **Wygasły lub nieprawidłowy token:**
   - Przekierowuje do `/auth` z parametrem `error=expired` lub `error=invalid_token`
   - Formularz autentykacji wyświetla odpowiedni komunikat błędu
   - Użytkownik może ponownie wysłać magic link

### 2.2 Komponenty client-side

#### 2.2.1 `AuthForm` - Główny formularz autentykacji

**Lokalizacja:** `components/auth/AuthForm.tsx`

**Typ:** Client Component (`"use client"`)

**Props:**
```typescript
interface AuthFormProps {
  initialMode?: 'signin' | 'signup';
  initialEmail?: string;
  redirectTo?: string;
  error?: 'expired' | 'invalid_token' | 'verification_failed';
}
```

**Funkcjonalność:**
- Przełączanie między trybem rejestracji i logowania
- Walidacja formatu e-mail po stronie klienta (Zod)
- Wyświetlanie stanów: idle, loading, success, error
- Integracja z Server Actions dla wysyłania magic linków
- Obsługa komunikatów błędów i sukcesu (toast notifications)
- Automatyczne przełączanie trybu na podstawie odpowiedzi serwera (np. konto nie istnieje → rejestracja)
- Obsługa błędów weryfikacji z query string (wygasły/nieprawidłowy token) - wyświetlanie komunikatów przy formularzu

**Stany formularza:**
- `idle`: Formularz gotowy do wypełnienia
- `loading`: Wysyłanie żądania
- `success`: Magic link wysłany (wyświetla komunikat z instrukcjami)
- `error`: Błąd walidacji lub wysyłania

**Walidacja:**
- Format e-mail (regex + Zod schema)
- Komunikaty błędów w języku polskim
- Real-time walidacja podczas wpisywania

**Integracja:**
- Używa `sendMagicLink` Server Action
- Wyświetla toast notifications przez `sonner` (Toaster)
- Obsługuje przekierowania po sukcesie

#### 2.2.2 `EmailInput` - Pole wprowadzania e-mail

**Lokalizacja:** `components/auth/EmailInput.tsx`

**Typ:** Client Component

**Funkcjonalność:**
- Pole tekstowe z walidacją formatu e-mail
- Wyświetlanie ikony i etykiety
- Obsługa błędów walidacji
- Integracja z react-hook-form (opcjonalnie) lub własny state management

**Props:**
```typescript
interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}
```

#### 2.2.3 `AuthModeToggle` - Przełącznik trybu

**Lokalizacja:** `components/auth/AuthModeToggle.tsx`

**Typ:** Client Component

**Funkcjonalność:**
- Przełączanie między "Zarejestruj się" i "Zaloguj się"
- Wyświetlanie aktualnego trybu
- Linki do przełączania trybu

**Props:**
```typescript
interface AuthModeToggleProps {
  mode: 'signin' | 'signup';
  onModeChange: (mode: 'signin' | 'signup') => void;
}
```

#### 2.2.4 `AuthLayout` - Layout dla stron autentykacji

**Lokalizacja:** `components/auth/AuthLayout.tsx`

**Typ:** Client Component lub Server Component (w zależności od potrzeb)

**Funkcjonalność:**
- Minimalistyczny layout bez nawigacji
- Logo aplikacji
- Spójny design z resztą aplikacji
- Responsywny

### 2.3 Integracja z istniejącymi komponentami

#### 2.3.1 Aktualizacja `Header.tsx`

**Zmiany:**
- Przyciski "Zaloguj się" i "Zarejestruj się" przekierowują do `/auth`
- Dla zalogowanych użytkowników wyświetla `ProfileDropdown`
- Logika widoczności przycisków pozostaje bez zmian

**Lokalizacja:** `components/layout/Header.tsx`

#### 2.3.2 Aktualizacja `ProfileDropdown.tsx`

**Zmiany:**
- Przycisk "Wyloguj się" używa istniejącej akcji `signOut`
- Możliwość rozszerzenia o dodatkowe opcje (np. ustawienia konta w przyszłości)

**Lokalizacja:** `components/layout/ProfileDropdown.tsx`

#### 2.3.3 Aktualizacja `MainLayout.tsx`

**Zmiany:**
- Brak zmian - komponent już otrzymuje `user` jako prop
- Logika wyświetlania nawigacji pozostaje bez zmian

### 2.4 Walidacja i komunikaty błędów

#### 2.4.1 Walidacja po stronie klienta

**Biblioteka:** Zod (zgodnie z regułami projektu)

**Schematy walidacji:**
```typescript
// src/lib/validations/auth.ts
import { z } from 'zod';

export const emailSchema = z
  .string()
  .email('Podaj prawidłowy adres e-mail')
  .min(1, 'Adres e-mail jest wymagany')
  .max(255, 'Adres e-mail jest za długi');

export const authFormSchema = z.object({
  email: emailSchema,
  mode: z.enum(['signin', 'signup']),
});
```

**Komponenty używają schematów do:**
- Real-time walidacji podczas wpisywania
- Wyświetlania komunikatów błędów pod polami
- Blokowania wysłania formularza przy błędach

#### 2.4.2 Komunikaty błędów

**Typy błędów i komunikaty:**

1. **Nieprawidłowy format e-mail:**
   - Komunikat: "Podaj prawidłowy adres e-mail"
   - Wyświetlany pod polem e-mail

2. **Konto nie istnieje (przy logowaniu):**
   - Komunikat: "Konto z tym adresem e-mail nie istnieje. Chcesz się zarejestrować?"
   - Oferuje przełączenie do trybu rejestracji
   - Pre-wypełnia e-mail w formularzu rejestracji

3. **Konto już istnieje (przy rejestracji):**
   - Komunikat: "Konto z tym adresem e-mail już istnieje. Zaloguj się?"
   - Oferuje przełączenie do trybu logowania

4. **Błąd wysyłania e-mail:**
   - Komunikat: "Nie udało się wysłać e-maila. Spróbuj ponownie za chwilę."
   - Toast notification z możliwością ponowienia

5. **Wygasły magic link:**
   - Komunikat: "Link weryfikacyjny wygasł. Wpisz swój adres e-mail ponownie, aby otrzymać nowy link."
   - Wyświetlany przy formularzu autentykacji (`/auth?error=expired`)
   - Użytkownik może ponownie wysłać magic link

6. **Nieprawidłowy token:**
   - Komunikat: "Link weryfikacyjny jest nieprawidłowy lub został już użyty. Wpisz swój adres e-mail, aby otrzymać nowy link."
   - Wyświetlany przy formularzu autentykacji (`/auth?error=invalid_token`)
   - Użytkownik może ponownie wysłać magic link

#### 2.4.3 Komunikaty sukcesu

1. **Magic link wysłany:**
   - Toast: "Sprawdź swoją skrzynkę e-mail. Wysłaliśmy link do logowania."
   - Wyświetlany na stronie formularza
   - Instrukcje: "Kliknij link w e-mailu, aby zalogować się do aplikacji."

2. **Pomyślne zalogowanie:**
   - Przekierowanie do docelowej strony
   - Toast: "Witaj z powrotem!" (opcjonalnie)

3. **Pomyślna rejestracja:**
   - Przekierowanie do docelowej strony
   - Toast: "Konto zostało utworzone! Witamy w Malowanko!" (opcjonalnie)

### 2.5 Obsługa scenariuszy

#### 2.5.1 Scenariusz: Rejestracja nowego użytkownika (US-001)

**Flow:**
1. Użytkownik wchodzi na `/auth` (lub klika "Zarejestruj się" w Header)
2. Formularz wyświetla tryb rejestracji (domyślnie lub po przełączeniu)
3. Użytkownik wpisuje e-mail
4. Walidacja formatu e-mail (client-side)
5. Kliknięcie "Zarejestruj się" → wywołanie `signUp` Server Action
6. Server Action:
   - Waliduje e-mail (server-side)
   - Sprawdza czy konto już istnieje
   - Jeśli nie istnieje → wysyła magic link przez Supabase Auth
   - Zwraca sukces lub błąd
7. Klient wyświetla komunikat sukcesu z instrukcjami
8. Użytkownik klika link w e-mailu
9. Przekierowanie do `/auth/verify?token_hash=...&type=signup`
10. Server Component weryfikuje token
11. Supabase tworzy konto i loguje użytkownika
12. Trigger tworzy profil w `profiles`
13. Przekierowanie do `/galeria` (lub `redirect` param)

#### 2.5.2 Scenariusz: Logowanie istniejącego użytkownika (US-002)

**Flow:**
1. Użytkownik wchodzi na `/auth` (lub klika "Zaloguj się" w Header)
2. Formularz wyświetla tryb logowania
3. Użytkownik wpisuje e-mail
4. Walidacja formatu e-mail
5. Kliknięcie "Zaloguj się" → wywołanie `signIn` Server Action
6. Server Action:
   - Waliduje e-mail
   - Sprawdza czy konto istnieje
   - Jeśli istnieje → wysyła magic link
   - Jeśli nie istnieje → zwraca błąd z sugestią rejestracji
7. Klient wyświetla komunikat sukcesu lub błąd
8. Użytkownik klika link w e-mailu
9. Przekierowanie do `/auth/verify?token_hash=...&type=recovery`
10. Server Component weryfikuje token
11. Supabase loguje użytkownika
12. Przekierowanie do `/galeria` (lub `redirect` param)

#### 2.5.3 Scenariusz: Wylogowanie (US-003)

**Flow:**
1. Zalogowany użytkownik klika avatar w Header
2. Wybiera "Wyloguj się" z dropdown menu
3. Wywołanie `signOut` Server Action (już istnieje)
4. Server Action:
   - Wywołuje `supabase.auth.signOut()`
   - Czyści sesję
5. Przekierowanie do `/` (które przekierowuje do `/galeria`)
6. Header wyświetla przyciski logowania/rejestracji

#### 2.5.4 Scenariusz: Wygasły magic link (US-004)

**Flow:**
1. Użytkownik klika wygasły magic link
2. Przekierowanie do `/auth/verify?token_hash=...&type=...`
3. Server Component próbuje zweryfikować token
4. Supabase zwraca błąd wygaśnięcia
5. Przekierowanie do `/auth?error=expired`
6. Formularz autentykacji wyświetla komunikat o wygaśnięciu linka
7. Użytkownik wpisuje e-mail i wysyła ponownie magic link
8. Wywołanie odpowiedniej Server Action (`signIn` lub `signUp`)
9. Nowy magic link wysłany

#### 2.5.5 Scenariusz: Nieistniejące konto przy logowaniu (US-005)

**Flow:**
1. Użytkownik próbuje się zalogować z nieistniejącym e-mailem
2. Server Action `signIn` sprawdza istnienie konta
3. Zwraca błąd: "Konto nie istnieje"
4. Klient wyświetla komunikat z opcją rejestracji
5. Formularz automatycznie przełącza się do trybu rejestracji
6. E-mail jest pre-wypełniony
7. Użytkownik może kliknąć "Zarejestruj się"

---

## 3. LOGIKA BACKENDOWA

### 3.1 Server Actions

#### 3.1.1 `signUp` - Rejestracja nowego użytkownika

**Lokalizacja:** `src/lib/actions/auth.ts`

**Funkcjonalność:**
- Waliduje adres e-mail (Zod)
- Sprawdza czy konto już istnieje w Supabase Auth
- Wysyła magic link przez `supabase.auth.signInWithOtp()`
- Obsługuje błędy i zwraca odpowiednie komunikaty

**Signature:**
```typescript
export async function signUp(
  email: string,
  redirectTo?: string
): Promise<{ success: boolean; error?: string; message?: string }>
```

**Implementacja:**
1. Walidacja e-mail przez `emailSchema`
2. Utworzenie Supabase client (server)
3. Sprawdzenie czy użytkownik istnieje:
   ```typescript
   const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
   ```
   (lub alternatywnie przez próbę logowania)
4. Jeśli istnieje → zwróć błąd "Konto już istnieje"
5. Jeśli nie istnieje → wyślij magic link:
   ```typescript
   const { error } = await supabase.auth.signInWithOtp({
     email,
     options: {
       emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify`,
       shouldCreateUser: true, // Tworzy konto jeśli nie istnieje
     },
   });
   ```
6. Obsługa błędów i zwrócenie wyniku

**Błędy:**
- Nieprawidłowy format e-mail → walidacja przed wysłaniem
- Konto już istnieje → komunikat z sugestią logowania
- Błąd Supabase → ogólny komunikat błędu

#### 3.1.2 `signIn` - Logowanie istniejącego użytkownika

**Lokalizacja:** `src/lib/actions/auth.ts`

**Funkcjonalność:**
- Waliduje adres e-mail
- Sprawdza czy konto istnieje
- Wysyła magic link dla istniejącego użytkownika
- Zwraca błąd jeśli konto nie istnieje

**Signature:**
```typescript
export async function signIn(
  email: string,
  redirectTo?: string
): Promise<{ success: boolean; error?: string; message?: string }>
```

**Implementacja:**
1. Walidacja e-mail
2. Utworzenie Supabase client
3. Sprawdzenie czy użytkownik istnieje
4. Jeśli nie istnieje → zwróć błąd "Konto nie istnieje" z sugestią rejestracji
5. Jeśli istnieje → wyślij magic link:
   ```typescript
   const { error } = await supabase.auth.signInWithOtp({
     email,
     options: {
       emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify`,
       shouldCreateUser: false, // Nie tworzy konta
     },
   });
   ```
6. Obsługa błędów

**Błędy:**
- Nieprawidłowy format e-mail
- Konto nie istnieje → komunikat z sugestią rejestracji
- Błąd Supabase

#### 3.1.3 `signOut` - Wylogowanie (już istnieje)

**Lokalizacja:** `src/lib/actions/auth.ts`

**Status:** Już zaimplementowane, bez zmian

**Funkcjonalność:**
- Wylogowuje użytkownika przez `supabase.auth.signOut()`
- Przekierowuje na stronę główną

#### 3.1.4 `verifyMagicLink` - Weryfikacja magic linka

**Lokalizacja:** `src/lib/actions/auth.ts`

**Funkcjonalność:**
- Weryfikuje token magic linka przez Supabase Auth
- Obsługuje różne typy tokenów (signup, recovery, email_change)
- Zwraca wynik weryfikacji z odpowiednimi komunikatami błędów

**Signature:**
```typescript
export async function verifyMagicLink(
  tokenHash: string,
  type: string
): Promise<{ 
  success: boolean; 
  error?: string; 
  errorCode?: 'expired' | 'invalid' | 'used';
  redirectTo?: string;
}>
```

**Implementacja:**
1. Utworzenie Supabase client
2. Weryfikacja tokena:
   ```typescript
   const { data, error } = await supabase.auth.verifyOtp({
     token_hash: tokenHash,
     type: type as 'email' | 'signup' | 'recovery',
   });
   ```
3. Obsługa błędów:
   - `expired_token` → zwróć `{ success: false, errorCode: 'expired' }`
   - `invalid_token` → zwróć `{ success: false, errorCode: 'invalid' }`
   - `token_already_used` → zwróć `{ success: false, errorCode: 'used' }`
4. Jeśli sukces → zwróć `{ success: true, redirectTo: ... }`

### 3.2 Walidacja danych wejściowych

#### 3.2.1 Schematy Zod

**Lokalizacja:** `src/lib/validations/auth.ts`

**Schematy:**
```typescript
import { z } from 'zod';

export const emailSchema = z
  .string()
  .email('Podaj prawidłowy adres e-mail')
  .min(1, 'Adres e-mail jest wymagany')
  .max(255, 'Adres e-mail jest za długi')
  .toLowerCase()
  .trim();

export const signUpSchema = z.object({
  email: emailSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
});
```

**Użycie:**
- Server Actions używają schematów do walidacji przed przetwarzaniem
- Client Components używają schematów do real-time walidacji
- Komunikaty błędów w języku polskim

#### 3.2.2 Walidacja po stronie serwera

**Zasady:**
- Wszystkie Server Actions walidują dane wejściowe przez Zod
- Błędy walidacji zwracane jako obiekty z `error` i `message`
- Nigdy nie ufamy danym z klienta

### 3.3 Obsługa wyjątków

#### 3.3.1 Typy błędów

**Kategorie błędów:**

1. **Błędy walidacji:**
   - Nieprawidłowy format e-mail
   - Puste pola
   - Obsługiwane przez Zod z przyjaznymi komunikatami

2. **Błędy autentykacji:**
   - Konto nie istnieje (przy logowaniu)
   - Konto już istnieje (przy rejestracji)
   - Wygasły token
   - Nieprawidłowy token
   - Obsługiwane przez sprawdzanie odpowiedzi Supabase

3. **Błędy sieciowe:**
   - Błąd połączenia z Supabase
   - Timeout
   - Obsługiwane przez try-catch w Server Actions

4. **Błędy systemowe:**
   - Brak zmiennych środowiskowych
   - Błąd konfiguracji
   - Logowane do konsoli, zwracane jako ogólny błąd dla użytkownika

#### 3.3.2 Strategia obsługi błędów

**W Server Actions:**
```typescript
try {
  // Walidacja
  const validatedData = schema.parse(input);
  
  // Operacja
  const result = await supabaseOperation();
  
  if (result.error) {
    // Błąd Supabase - mapowanie na przyjazne komunikaty
    return { success: false, error: mapSupabaseError(result.error) };
  }
  
  return { success: true, message: 'Sukces' };
} catch (error) {
  if (error instanceof z.ZodError) {
    // Błąd walidacji
    return { success: false, error: error.errors[0].message };
  }
  
  // Nieoczekiwany błąd
  console.error('Unexpected error:', error);
  return { success: false, error: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.' };
}
```

**Mapowanie błędów Supabase:**
```typescript
function mapSupabaseError(error: AuthError): string {
  // Mapowanie kodów błędów Supabase na przyjazne komunikaty
  switch (error.message) {
    case 'Email rate limit exceeded':
      return 'Zbyt wiele prób. Spróbuj ponownie za chwilę.';
    case 'Invalid email':
      return 'Podaj prawidłowy adres e-mail.';
    default:
      return 'Wystąpił błąd. Spróbuj ponownie.';
  }
}
```

### 3.4 Renderowanie stron server-side

#### 3.4.1 Strona `/auth` - Server Component

**Implementacja:**
```typescript
// app/(auth)/auth/page.tsx
import { createClient } from '@/app/db/server';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth/AuthForm';

export default async function AuthPage({
  searchParams,
}: {
  searchParams: { 
    redirect?: string; 
    mode?: 'signin' | 'signup';
    error?: 'expired' | 'invalid_token' | 'verification_failed';
  };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Przekieruj zalogowanych użytkowników
  if (user) {
    const redirectTo = searchParams.redirect || '/galeria';
    redirect(redirectTo);
  }

  return (
    <AuthForm
      initialMode={searchParams.mode || 'signup'}
      redirectTo={searchParams.redirect}
      error={searchParams.error}
    />
  );
}
```

**Funkcjonalność:**
- Sprawdza sesję użytkownika po stronie serwera
- Przekierowuje zalogowanych
- Przekazuje parametry do Client Component (w tym parametry błędów z query string)
- Obsługuje parametry `error` z query string dla wyświetlania komunikatów błędów

#### 3.4.2 Strona `/auth/verify` - Server Component

**Implementacja:**
```typescript
// app/(auth)/auth/verify/page.tsx
import { redirect } from 'next/navigation';
import { verifyMagicLink } from '@/src/lib/actions/auth';

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: { token_hash?: string; type?: string; redirect?: string };
}) {
  const { token_hash, type, redirect: redirectTo } = searchParams;

  if (!token_hash || !type) {
    const errorUrl = new URL('/auth', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    errorUrl.searchParams.set('error', 'invalid_token');
    if (redirectTo) errorUrl.searchParams.set('redirect', redirectTo);
    redirect(errorUrl.toString());
  }

  const result = await verifyMagicLink(token_hash, type);

  if (!result.success) {
    const errorUrl = new URL('/auth', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    errorUrl.searchParams.set('error', result.errorCode || 'verification_failed');
    if (redirectTo) errorUrl.searchParams.set('redirect', redirectTo);
    redirect(errorUrl.toString());
  }

  // Przekieruj po udanej weryfikacji
  redirect(result.redirectTo || redirectTo || '/galeria');
}
```

**Funkcjonalność:**
- Odbiera token z query string
- Weryfikuje token przez Server Action
- Obsługuje różne scenariusze (sukces, wygaśnięcie, błąd)
- Przekierowuje do `/auth` z odpowiednim parametrem błędu w przypadku niepowodzenia
- Formularz autentykacji wyświetla komunikat błędu

### 3.5 Integracja z middleware

#### 3.5.1 Aktualizacja `middleware.ts`

**Zmiany:**
- Dodanie ścieżek wymagających autoryzacji do `protectedRoutes`
- Przekierowanie niezalogowanych do `/auth` z parametrem `redirect`

**Implementacja:**
```typescript
// middleware.ts
const protectedRoutes = ['/generator', '/biblioteka'];

export async function middleware(request: NextRequest) {
  // ... istniejący kod ...

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
```

**Funkcjonalność:**
- Chroni ścieżki wymagające autoryzacji
- Przekierowuje z zachowaniem docelowej ścieżki
- Odświeża sesję użytkownika (już zaimplementowane)

---

## 4. SYSTEM AUTENTYKACJI

### 4.1 Konfiguracja Supabase Auth

#### 4.1.1 Ustawienia magic linków

**Konfiguracja w Supabase Dashboard:**
- Włączone: Email OTP (magic links)
- Wyłączone: Email + Password
- Wyłączone: Social providers (Google, Facebook, etc.)
- Wyłączone: SMS OTP

**Ustawienia e-mail:**
- Template e-maila z magic linkiem
- Redirect URL: `${NEXT_PUBLIC_APP_URL}/auth/verify`
- Czas ważności linku: 1 godzina (domyślne)
- Rate limiting: zgodnie z ustawieniami Supabase

#### 4.1.2 Konfiguracja redirect URLs

**Dozwolone redirect URLs:**
- `${NEXT_PUBLIC_APP_URL}/auth/verify`
- `${NEXT_PUBLIC_APP_URL}/auth/verify?*` (dla parametrów)

**Konfiguracja w Supabase:**
- Authentication → URL Configuration
- Site URL: `${NEXT_PUBLIC_APP_URL}`
- Redirect URLs: lista dozwolonych URL-i

### 4.2 Flow autentykacji

#### 4.2.1 Flow rejestracji

**Diagram:**
```
Użytkownik → Formularz → Server Action (signUp)
  ↓
Supabase Auth (signInWithOtp)
  ↓
E-mail z magic linkiem
  ↓
Kliknięcie linka → /auth/verify
  ↓
Weryfikacja tokena → Supabase Auth
  ↓
Utworzenie konta w auth.users
  ↓
Trigger → Utworzenie profilu w profiles
  ↓
Logowanie użytkownika
  ↓
Przekierowanie do /galeria
```

**Kroki szczegółowe:**

1. **Wysyłanie magic linka:**
   ```typescript
   await supabase.auth.signInWithOtp({
     email,
     options: {
       emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify`,
       shouldCreateUser: true,
     },
   });
   ```

2. **Weryfikacja tokena:**
   ```typescript
   const { data, error } = await supabase.auth.verifyOtp({
     token_hash,
     type: 'email', // lub 'signup', 'recovery'
   });
   ```

3. **Automatyczne tworzenie profilu:**
   - Trigger `on_auth_user_created` w bazie danych
   - Funkcja `handle_new_user()` tworzy wpis w `profiles`
   - Zgodnie z `db-plan.md` sekcja 4.3

#### 4.2.2 Flow logowania

**Diagram:**
```
Użytkownik → Formularz → Server Action (signIn)
  ↓
Sprawdzenie istnienia konta
  ↓
Supabase Auth (signInWithOtp)
  ↓
E-mail z magic linkiem
  ↓
Kliknięcie linka → /auth/verify
  ↓
Weryfikacja tokena → Supabase Auth
  ↓
Logowanie użytkownika (sesja)
  ↓
Przekierowanie do /galeria
```

**Różnice względem rejestracji:**
- `shouldCreateUser: false` w `signInWithOtp`
- Sprawdzenie istnienia konta przed wysłaniem linka
- Brak tworzenia nowego konta

#### 4.2.3 Flow wylogowania

**Diagram:**
```
Użytkownik → ProfileDropdown → signOut()
  ↓
supabase.auth.signOut()
  ↓
Usunięcie sesji (cookies)
  ↓
Przekierowanie do /
```

### 4.3 Zarządzanie sesjami

#### 4.3.1 Mechanizm sesji

**Supabase Auth:**
- Sesje przechowywane w cookies (httpOnly)
- Automatyczne odświeżanie tokenów przez middleware
- Czas ważności sesji: zgodnie z ustawieniami Supabase (domyślnie 1 tydzień)

**Middleware Next.js:**
- Odświeża sesję przy każdym żądaniu
- Sprawdza autoryzację dla protected routes
- Używa `createServerClient` z `@supabase/ssr`

#### 4.3.2 Sprawdzanie stanu autoryzacji

**W Server Components:**
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
```

**W Client Components:**
```typescript
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

**W Server Actions:**
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return { success: false, error: 'Nieautoryzowany' };
}
```

### 4.4 Integracja z bazą danych

#### 4.4.1 Automatyczne tworzenie profilu

**Trigger w bazie danych:**
- Zgodnie z `db-plan.md` sekcja 4.3
- Trigger `on_auth_user_created` na `auth.users`
- Funkcja `handle_new_user()` tworzy wpis w `profiles`

**Struktura profilu:**
```sql
INSERT INTO profiles (id, email, created_at)
VALUES (NEW.id, NEW.email, NOW());
```

**Kolumny:**
- `id`: UUID z `auth.users.id`
- `email`: z `auth.users.email`
- `created_at`: aktualna data
- `generations_today`: 0 (domyślnie)
- `last_generation_date`: NULL (domyślnie)

#### 4.4.2 Row Level Security (RLS)

**Polityki dla `profiles`:**
- Zgodnie z `db-plan.md` sekcja 5.2
- Użytkownik może odczytać tylko swój profil
- Użytkownik może aktualizować tylko swój profil

**Użycie w aplikacji:**
- Server Actions używają `auth.uid()` do filtrowania danych
- RLS zapewnia dodatkową warstwę bezpieczeństwa

### 4.5 Obsługa błędów autentykacji

#### 4.5.1 Typy błędów Supabase Auth

**Błędy związane z OTP:**
- `invalid_token`: Nieprawidłowy token
- `expired_token`: Wygasły token
- `token_already_used`: Token już użyty
- `email_rate_limit_exceeded`: Zbyt wiele prób

**Mapowanie błędów:**
```typescript
function mapAuthError(error: AuthError): { 
  message: string; 
  code: 'expired' | 'invalid' | 'used' | 'other';
} {
  if (error.message.includes('expired')) {
    return { 
      message: 'Link weryfikacyjny wygasł. Wpisz swój adres e-mail ponownie, aby otrzymać nowy link.', 
      code: 'expired'
    };
  }
  
  if (error.message.includes('invalid') || error.message.includes('malformed')) {
    return { 
      message: 'Link weryfikacyjny jest nieprawidłowy. Wpisz swój adres e-mail, aby otrzymać nowy link.', 
      code: 'invalid' 
    };
  }
  
  if (error.message.includes('already_used')) {
    return { 
      message: 'Link weryfikacyjny został już użyty. Wpisz swój adres e-mail, aby otrzymać nowy link.', 
      code: 'used' 
    };
  }
  
  return { 
    message: 'Wystąpił błąd podczas weryfikacji. Spróbuj ponownie.', 
    code: 'other' 
  };
}
```

#### 4.5.2 Rate limiting

**Ograniczenia Supabase:**
- Domyślnie: 3 e-maile na godzinę na adres
- Konfigurowalne w Supabase Dashboard

**Obsługa w aplikacji:**
- Sprawdzanie błędu `email_rate_limit_exceeded`
- Wyświetlanie komunikatu z informacją o limicie
- Sugestia spróbowania później

### 4.6 Bezpieczeństwo

#### 4.6.1 Ochrona przed atakami

**Zabezpieczenia:**
- Rate limiting przez Supabase
- Walidacja formatu e-mail (Zod)
- HTTPS wymagany (produkcja)
- HttpOnly cookies dla sesji
- CSRF protection przez Supabase

#### 4.6.2 Sprawdzanie istnienia konta

**Bezpieczne sprawdzanie:**
- Używanie `supabase.auth.admin.getUserByEmail()` (wymaga service role key)
- Lub alternatywnie: próba logowania i sprawdzenie odpowiedzi
- Unikanie wycieku informacji o istnieniu kont (opcjonalnie - zgodnie z wymaganiami)

**Implementacja:**
```typescript
// Opcja 1: Admin API (wymaga service role)
const adminClient = createAdminClient();
const { data: user } = await adminClient.auth.admin.getUserByEmail(email);

// Opcja 2: Próba logowania (bezpieczniejsze)
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: { shouldCreateUser: false },
});
// Sprawdzenie typu błędu
```

---

## 5. Integracja z istniejącą aplikacją

### 5.1 Zgodność z istniejącymi komponentami

#### 5.1.1 MainLayout

**Status:** Bez zmian
- Komponent już otrzymuje `user` jako prop
- Wyświetla `Header` i `BottomNav` odpowiednio do stanu autoryzacji

#### 5.1.2 Header

**Zmiany:**
- Przyciski "Zaloguj się" i "Zarejestruj się" → linki do `/auth`
- `ProfileDropdown` dla zalogowanych (już istnieje)

#### 5.1.3 BottomNav

**Status:** Bez zmian
- Wyświetlane tylko dla zalogowanych użytkowników
- Logika już zaimplementowana

### 5.2 Aktualizacja protected routes

#### 5.2.1 Ścieżki wymagające autoryzacji

**Lista:**
- `/generator` - Generator kolorowanek
- `/biblioteka` - Biblioteka użytkownika

**Implementacja:**
- Aktualizacja `middleware.ts`
- Przekierowanie do `/auth?redirect=...`

### 5.3 Zgodność z bazą danych

#### 5.3.1 Tabela profiles

**Status:** Zgodna z `db-plan.md`
- Trigger automatycznie tworzy profil przy rejestracji
- RLS zapewnia bezpieczeństwo
- Kolumny zgodne z wymaganiami

#### 5.3.2 Relacje z innymi tabelami

**Status:** Bez zmian
- `colorings.user_id` → `profiles.id`
- `user_library.user_id` → `profiles.id`
- `favorites.user_id` → `profiles.id`
- Wszystkie relacje działają z nowymi użytkownikami

### 5.4 Zmienne środowiskowe

#### 5.4.1 Wymagane zmienne

**Już skonfigurowane:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (dla admin operations, opcjonalnie)

**Nowa zmienna (opcjonalnie):**
- `NEXT_PUBLIC_APP_URL` - dla redirect URLs w magic linkach

**Użycie:**
- W Server Actions do konstruowania redirect URLs
- W konfiguracji Supabase Auth

---

## 6. Podsumowanie implementacji

### 6.1 Nowe pliki do utworzenia

**Strony:**
- `app/(auth)/layout.tsx`
- `app/(auth)/auth/page.tsx`
- `app/(auth)/auth/verify/page.tsx`

**Komponenty:**
- `components/auth/AuthForm.tsx`
- `components/auth/EmailInput.tsx`
- `components/auth/AuthModeToggle.tsx`
- `components/auth/AuthLayout.tsx` (opcjonalnie)

**Server Actions:**
- Rozszerzenie `src/lib/actions/auth.ts`:
  - `signUp()`
  - `signIn()`
  - `verifyMagicLink()`

**Walidacja:**
- `src/lib/validations/auth.ts`

### 6.2 Pliki do modyfikacji

**Middleware:**
- `middleware.ts` - dodanie protected routes

**Komponenty:**
- `components/layout/Header.tsx` - linki do `/auth`

**Server Actions:**
- `src/lib/actions/auth.ts` - rozszerzenie istniejącego pliku

### 6.3 Konfiguracja Supabase

**Dashboard:**
- Włączenie Email OTP
- Konfiguracja redirect URLs
- Konfiguracja template e-maila (opcjonalnie)

**Baza danych:**
- Trigger `on_auth_user_created` (już istnieje zgodnie z `db-plan.md`)
- RLS policies (już istnieją)

### 6.4 Testowanie

**Scenariusze testowe:**
1. Rejestracja nowego użytkownika
2. Logowanie istniejącego użytkownika
3. Wylogowanie
4. Wygasły magic link
5. Nieistniejące konto przy logowaniu
6. Konto już istnieje przy rejestracji
7. Nieprawidłowy format e-mail
8. Rate limiting
9. Przekierowania po zalogowaniu
10. Protected routes

---

## 7. Uwagi końcowe

### 7.1 Zgodność z wymaganiami

✅ **US-001**: Rejestracja przez magic link - pełna implementacja
✅ **US-002**: Logowanie przez magic link - pełna implementacja
✅ **US-003**: Wylogowanie - już zaimplementowane
✅ **US-004**: Obsługa wygasłego linka - komunikat błędu przy formularzu autentykacji
✅ **US-005**: Obsługa nieistniejącego konta - komunikat z sugestią rejestracji

### 7.2 Zgodność z architekturą projektu

✅ **Next.js App Router**: Wykorzystanie Server Components i Server Actions
✅ **Supabase Auth**: Pełna integracja z magic linkami
✅ **TypeScript**: Typowanie wszystkich komponentów i akcji
✅ **Zod**: Walidacja danych wejściowych
✅ **ShadCN UI**: Komponenty zgodne z istniejącym design system
✅ **Tailwind CSS**: Spójne style z resztą aplikacji

### 7.3 Bezpieczeństwo

✅ **Rate limiting**: Przez Supabase
✅ **Walidacja**: Po stronie klienta i serwera
✅ **RLS**: Polityki bezpieczeństwa w bazie danych
✅ **HttpOnly cookies**: Sesje przechowywane bezpiecznie
✅ **HTTPS**: Wymagany w produkcji

### 7.4 UX/UI

✅ **Przyjazne komunikaty**: Wszystkie błędy zrozumiałe dla użytkownika
✅ **Responsywność**: Działanie na mobile i desktop
✅ **Dostępność**: ARIA labels, semantic HTML
✅ **Loading states**: Wskaźniki ładowania podczas operacji
✅ **Toast notifications**: Informacje o sukcesie i błędach

---

**Dokument utworzony:** 2025-01-05
**Wersja:** 1.0
**Status:** Specyfikacja gotowa do implementacji
