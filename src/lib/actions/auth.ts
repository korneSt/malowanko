"use server";

import { AuthError } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createAdminClient } from "@/app/db/admin";
import { createClient } from "@/app/db/server";
import { emailSchema } from "@/src/lib/validations/auth";

// ============================================================================
// Types
// ============================================================================

/**
 * Result type for authentication actions.
 */
export interface AuthActionResult {
  success: boolean;
  error?: string;
  message?: string;
  /** Error code for specific error handling (e.g., account_exists, account_not_found) */
  errorCode?: "account_exists" | "account_not_found" | "rate_limit" | "unknown";
}

/**
 * Result type for magic link verification.
 */
export interface VerifyMagicLinkResult {
  success: boolean;
  error?: string;
  errorCode?: "expired" | "invalid" | "used";
  redirectTo?: string;
}

/**
 * Result type for OTP code verification.
 */
export interface VerifyOtpCodeResult {
  success: boolean;
  error?: string;
  errorCode?: "expired" | "invalid" | "used";
  redirectTo?: string;
}

// ============================================================================
// Error Mapping
// ============================================================================

/**
 * Maps Supabase Auth errors to user-friendly Polish messages.
 *
 * @param error - Supabase AuthError
 * @returns Object with user-friendly message and error code
 */
function mapSupabaseError(error: AuthError): {
  message: string;
  code: AuthActionResult["errorCode"];
} {
  const errorMessage = error.message.toLowerCase();

  // Rate limiting
  if (
    errorMessage.includes("rate limit") ||
    errorMessage.includes("too many requests")
  ) {
    return {
      message: "Zbyt wiele prób. Spróbuj ponownie za kilka minut.",
      code: "rate_limit",
    };
  }

  // Invalid email
  if (errorMessage.includes("invalid email")) {
    return {
      message: "Podaj prawidłowy adres e-mail.",
      code: "unknown",
    };
  }

  // User not found (for signIn with shouldCreateUser: false)
  if (
    errorMessage.includes("user not found") ||
    errorMessage.includes("no user found")
  ) {
    return {
      message:
        "Konto z tym adresem e-mail nie istnieje. Chcesz się zarejestrować?",
      code: "account_not_found",
    };
  }

  // User already exists
  if (
    errorMessage.includes("user already registered") ||
    errorMessage.includes("already exists")
  ) {
    return {
      message: "Konto z tym adresem e-mail już istnieje. Zaloguj się?",
      code: "account_exists",
    };
  }

  // Email not confirmed (shouldn't happen with magic links)
  if (errorMessage.includes("email not confirmed")) {
    return {
      message: "Sprawdź swoją skrzynkę e-mail i kliknij link weryfikacyjny.",
      code: "unknown",
    };
  }

  // Default error
  console.error("Unhandled Supabase Auth error:", error);
  return {
    message: "Wystąpił błąd. Spróbuj ponownie.",
    code: "unknown",
  };
}

/**
 * Maps verification errors to user-friendly messages and error codes.
 *
 * @param error - Supabase AuthError
 * @returns Object with error code for redirect
 */
function mapVerificationError(error: AuthError): {
  message: string;
  code: VerifyMagicLinkResult["errorCode"];
} {
  const errorMessage = error.message.toLowerCase();

  // Token expired
  if (errorMessage.includes("expired") || errorMessage.includes("otp expired")) {
    return {
      message:
        "Link weryfikacyjny wygasł. Wpisz swój adres e-mail ponownie, aby otrzymać nowy link.",
      code: "expired",
    };
  }

  // Invalid token
  if (
    errorMessage.includes("invalid") ||
    errorMessage.includes("malformed") ||
    errorMessage.includes("otp")
  ) {
    return {
      message:
        "Link weryfikacyjny jest nieprawidłowy. Wpisz swój adres e-mail, aby otrzymać nowy link.",
      code: "invalid",
    };
  }

  // Token already used
  if (errorMessage.includes("already used") || errorMessage.includes("used")) {
    return {
      message:
        "Link weryfikacyjny został już użyty. Wpisz swój adres e-mail, aby otrzymać nowy link.",
      code: "used",
    };
  }

  // Default
  console.error("Unhandled verification error:", error);
  return {
    message: "Wystąpił błąd podczas weryfikacji. Spróbuj ponownie.",
    code: "invalid",
  };
}

/**
 * Gets the app URL for redirects.
 * 
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL (manually configured)
 * 2. Request headers (host from incoming request)
 * 3. VERCEL_URL (automatically provided by Vercel)
 * 4. localhost (development fallback)
 */
async function getAppUrl(): Promise<string> {
  // 1. Check for manually configured URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // 2. Try to get from request headers (works in server actions)
  try {
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = headersList.get("x-forwarded-proto") || "https";
    
    if (host) {
      return `${protocol}://${host}`;
    }
  } catch {
    // Headers might not be available in all contexts
    // This is fine, we'll fall back to other methods
  }

  // 3. Use Vercel's automatically provided URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 4. Development fallback
  return "http://localhost:3000";
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Wylogowuje użytkownika i przekierowuje na stronę główną.
 */
export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Sign out error:", error);
  }

  redirect("/");
}

/**
 * Rejestruje nowego użytkownika przez magic link.
 * 
 * Spełnia wymagania US-001:
 * - Walidacja formatu e-mail
 * - Sprawdzenie czy konto już istnieje
 * - Wysłanie magic linka dla nowego użytkownika
 * - Odpowiednie komunikaty błędów
 *
 * @param email - Adres e-mail użytkownika
 * @param redirectTo - Opcjonalna ścieżka przekierowania po weryfikacji
 * @returns Wynik operacji z komunikatem sukcesu lub błędu
 */
export async function signUp(
  email: string,
  redirectTo?: string
): Promise<AuthActionResult> {
  try {
    // 1. Validate email
    const validationResult = emailSchema.safeParse(email);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || "Nieprawidłowy adres e-mail",
      };
    }
    const validatedEmail = validationResult.data;

    // 2. Check if user already exists using admin client
    const adminClient = createAdminClient();
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(
      (user) => user.email?.toLowerCase() === validatedEmail
    );

    if (userExists) {
      return {
        success: false,
        error: "Konto z tym adresem e-mail już istnieje. Zaloguj się?",
        errorCode: "account_exists",
      };
    }

    // 3. Send magic link for new user
    const supabase = await createClient();
    const appUrl = await getAppUrl();
    const emailRedirectTo = `${appUrl}/auth/verify${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: validatedEmail,
      options: {
        emailRedirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      const mappedError = mapSupabaseError(error);
      return {
        success: false,
        error: mappedError.message,
        errorCode: mappedError.code,
      };
    }

    return {
      success: true,
      message: "Sprawdź swoją skrzynkę e-mail. Wysłaliśmy link do rejestracji.",
    };
  } catch (error) {
    console.error("SignUp error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Błąd walidacji",
      };
    }

    return {
      success: false,
      error: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
      errorCode: "unknown",
    };
  }
}

/**
 * Loguje istniejącego użytkownika przez magic link.
 * 
 * Spełnia wymagania US-002 i US-005:
 * - Walidacja formatu e-mail
 * - Sprawdzenie czy konto istnieje (US-005: błąd jeśli nie istnieje)
 * - Wysłanie magic linka dla istniejącego użytkownika
 * - Odpowiednie komunikaty błędów z sugestią rejestracji
 *
 * @param email - Adres e-mail użytkownika
 * @param redirectTo - Opcjonalna ścieżka przekierowania po weryfikacji
 * @returns Wynik operacji z komunikatem sukcesu lub błędu
 */
export async function signIn(
  email: string,
  redirectTo?: string
): Promise<AuthActionResult> {
  try {
    // 1. Validate email
    const validationResult = emailSchema.safeParse(email);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.issues[0]?.message || "Nieprawidłowy adres e-mail",
      };
    }
    const validatedEmail = validationResult.data;

    // 2. Check if user exists using admin client
    const adminClient = createAdminClient();
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some(
      (user) => user.email?.toLowerCase() === validatedEmail
    );

    if (!userExists) {
      return {
        success: false,
        error: "Konto z tym adresem e-mail nie istnieje. Chcesz się zarejestrować?",
        errorCode: "account_not_found",
      };
    }

    // 3. Send magic link for existing user
    const supabase = await createClient();
    const appUrl = await getAppUrl();
    const emailRedirectTo = `${appUrl}/auth/verify${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: validatedEmail,
      options: {
        emailRedirectTo,
        shouldCreateUser: false,
      },
    });

    if (error) {
      const mappedError = mapSupabaseError(error);
      return {
        success: false,
        error: mappedError.message,
        errorCode: mappedError.code,
      };
    }

    return {
      success: true,
      message: "Sprawdź swoją skrzynkę e-mail. Wysłaliśmy link do logowania.",
    };
  } catch (error) {
    console.error("SignIn error:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Błąd walidacji",
      };
    }

    return {
      success: false,
      error: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
      errorCode: "unknown",
    };
  }
}

/**
 * Weryfikuje magic link i loguje użytkownika.
 * 
 * Spełnia wymagania US-004:
 * - Weryfikacja tokena magic linka
 * - Obsługa wygasłego tokena z odpowiednim komunikatem
 * - Obsługa nieprawidłowego tokena
 * - Przekierowanie po udanej weryfikacji
 *
 * @param tokenHash - Hash tokena z query string
 * @param type - Typ tokena (email, signup, recovery)
 * @returns Wynik weryfikacji z kodem błędu lub ścieżką przekierowania
 */
export async function verifyMagicLink(
  tokenHash: string,
  type: string
): Promise<VerifyMagicLinkResult> {
  try {
    const supabase = await createClient();

    // Verify the OTP token
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email" | "signup" | "recovery" | "magiclink",
    });

    if (error) {
      const mappedError = mapVerificationError(error);
      return {
        success: false,
        error: mappedError.message,
        errorCode: mappedError.code,
      };
    }

    // Verification successful
    if (data.user) {
      return {
        success: true,
        redirectTo: "/galeria",
      };
    }

    // Unexpected state - no error but no user
    return {
      success: false,
      error: "Weryfikacja nie powiodła się. Spróbuj ponownie.",
      errorCode: "invalid",
    };
  } catch (error) {
    console.error("VerifyMagicLink error:", error);

    return {
      success: false,
      error: "Wystąpił nieoczekiwany błąd podczas weryfikacji.",
      errorCode: "invalid",
    };
  }
}

/**
 * Weryfikuje kod OTP wprowadzony przez użytkownika.
 * 
 * Kod OTP jest wysyłany w e-mailu razem z magic linkiem.
 * Użytkownik może albo kliknąć link, albo wpisać kod.
 *
 * @param email - Adres e-mail użytkownika
 * @param otpCode - 6-cyfrowy kod OTP z e-maila
 * @returns Wynik weryfikacji z kodem błędu lub ścieżką przekierowania
 */
export async function verifyOtpCode(
  email: string,
  otpCode: string
): Promise<VerifyOtpCodeResult> {
  try {
    // Validate email
    const validationResult = emailSchema.safeParse(email);
    if (!validationResult.success) {
      return {
        success: false,
        error: "Nieprawidłowy adres e-mail",
        errorCode: "invalid",
      };
    }
    const validatedEmail = validationResult.data;

    // Validate OTP code format (should be 6 digits)
    const otpCodeTrimmed = otpCode.trim();
    if (!/^\d{6}$/.test(otpCodeTrimmed)) {
      return {
        success: false,
        error: "Kod musi składać się z 6 cyfr",
        errorCode: "invalid",
      };
    }

    const supabase = await createClient();

    // Verify the OTP code
    const { data, error } = await supabase.auth.verifyOtp({
      email: validatedEmail,
      token: otpCodeTrimmed,
      type: "email",
    });

    if (error) {
      const mappedError = mapVerificationError(error);
      return {
        success: false,
        error: mappedError.message,
        errorCode: mappedError.code,
      };
    }

    // Verification successful
    if (data.user) {
      return {
        success: true,
        redirectTo: "/galeria",
      };
    }

    // Unexpected state - no error but no user
    return {
      success: false,
      error: "Weryfikacja nie powiodła się. Spróbuj ponownie.",
      errorCode: "invalid",
    };
  } catch (error) {
    console.error("VerifyOtpCode error:", error);

    return {
      success: false,
      error: "Wystąpił nieoczekiwany błąd podczas weryfikacji.",
      errorCode: "invalid",
    };
  }
}

