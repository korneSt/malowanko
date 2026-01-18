/**
 * Zod Validation Schemas for Authentication
 *
 * Provides type-safe validation for authentication-related inputs.
 * Schemas are used by both client components and server actions.
 *
 * @module validations/auth
 */

import { z } from "zod";

/**
 * Email validation schema.
 * Validates and sanitizes email input.
 *
 * Constraints:
 * - Must be a valid email format
 * - Minimum 1 character (required)
 * - Maximum 255 characters
 * - Automatically trimmed and lowercased
 */
export const emailSchema = z
  .string({ error: "Adres e-mail musi być tekstem" })
  .min(1, "Adres e-mail jest wymagany")
  .max(255, "Adres e-mail jest za długi")
  .email("Podaj prawidłowy adres e-mail")
  .transform((val) => val.trim().toLowerCase());

/**
 * Auth mode validation schema.
 * Validates authentication mode (signin or signup).
 */
export const authModeSchema = z.enum(["signin", "signup"], {
  error: "Nieprawidłowy tryb autoryzacji",
});

/**
 * Schema for sign up form.
 * Validates email for new user registration.
 *
 * @example
 * ```typescript
 * const result = signUpSchema.safeParse({
 *   email: "user@example.com",
 * });
 *
 * if (!result.success) {
 *   console.error(formatAuthError(result.error));
 * }
 * ```
 */
export const signUpSchema = z.object({
  email: emailSchema,
});

/**
 * Schema for sign in form.
 * Validates email for existing user login.
 *
 * @example
 * ```typescript
 * const result = signInSchema.safeParse({
 *   email: "user@example.com",
 * });
 *
 * if (!result.success) {
 *   console.error(formatAuthError(result.error));
 * }
 * ```
 */
export const signInSchema = z.object({
  email: emailSchema,
});

/**
 * Complete auth form schema.
 * Validates both email and mode for the combined auth form.
 */
export const authFormSchema = z.object({
  email: emailSchema,
  mode: authModeSchema,
});

/**
 * Input type for the signUp schema (before transformation).
 */
export type SignUpSchemaInput = z.input<typeof signUpSchema>;

/**
 * Output type for the signUp schema (after transformation).
 */
export type SignUpSchemaOutput = z.output<typeof signUpSchema>;

/**
 * Input type for the signIn schema (before transformation).
 */
export type SignInSchemaInput = z.input<typeof signInSchema>;

/**
 * Output type for the signIn schema (after transformation).
 */
export type SignInSchemaOutput = z.output<typeof signInSchema>;

/**
 * Auth mode type.
 */
export type AuthMode = z.infer<typeof authModeSchema>;

/**
 * Auth error types that can be passed via query params.
 */
export type AuthErrorType = "expired" | "invalid_token" | "verification_failed";

/**
 * Map of error types to user-friendly messages.
 */
export const AUTH_ERROR_MESSAGES: Record<AuthErrorType, string> = {
  expired:
    "Link weryfikacyjny wygasł. Wpisz swój adres e-mail ponownie, aby otrzymać nowy link.",
  invalid_token:
    "Link weryfikacyjny jest nieprawidłowy. Wpisz swój adres e-mail, aby otrzymać nowy link.",
  verification_failed: "Weryfikacja nie powiodła się. Spróbuj ponownie.",
};

/**
 * Gets a user-friendly error message for an auth error type.
 *
 * @param errorType - The error type from query params
 * @returns User-friendly error message
 */
export function getAuthErrorMessage(errorType: AuthErrorType): string {
  return AUTH_ERROR_MESSAGES[errorType] || "Wystąpił nieoczekiwany błąd.";
}

/**
 * Extracts formatted error messages from a Zod error.
 *
 * @param error - Zod error object
 * @returns Formatted error message string
 *
 * @example
 * ```typescript
 * const result = signUpSchema.safeParse(input);
 * if (!result.success) {
 *   const message = formatAuthError(result.error);
 *   // "Podaj prawidłowy adres e-mail"
 * }
 * ```
 */
export function formatAuthError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(". ");
}

/**
 * Validates email and returns validation result.
 * Useful for real-time validation in forms.
 *
 * @param email - Email string to validate
 * @returns Object with isValid boolean and optional error message
 *
 * @example
 * ```typescript
 * const { isValid, error } = validateEmail("invalid-email");
 * if (!isValid) {
 *   console.log(error); // "Podaj prawidłowy adres e-mail"
 * }
 * ```
 */
export function validateEmail(email: string): {
  isValid: boolean;
  error?: string;
} {
  const result = emailSchema.safeParse(email);

  if (result.success) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: result.error.issues[0]?.message || "Nieprawidłowy adres e-mail",
  };
}
