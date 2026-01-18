/**
 * Error helper utilities for server actions.
 *
 * Provides consistent error creation and handling patterns
 * for all server actions in the application.
 */

import type { ActionResult, ErrorCode } from "@/app/types";

/**
 * Creates a standardized error result for server actions.
 *
 * @template T - The expected data type for the successful case
 * @param code - Machine-readable error code from ERROR_CODES
 * @param message - User-friendly error message in Polish
 * @returns ActionResult with success: false and error details
 *
 * @example
 * ```typescript
 * if (!user) {
 *   return createActionError(
 *     ERROR_CODES.UNAUTHORIZED,
 *     "Musisz być zalogowany, aby wykonać tę akcję."
 *   );
 * }
 * ```
 */
export function createActionError<T>(
  code: ErrorCode,
  message: string
): ActionResult<T> {
  return {
    success: false,
    error: { code, message },
  };
}

/**
 * Creates a standardized success result for server actions.
 *
 * @template T - The data type being returned
 * @param data - The data to return in the success response
 * @returns ActionResult with success: true and the provided data
 *
 * @example
 * ```typescript
 * return createActionSuccess({
 *   colorings: generatedColorings,
 *   remainingGenerations: 8
 * });
 * ```
 */
export function createActionSuccess<T>(data: T): ActionResult<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Error messages in Polish for user-facing error responses.
 * Centralized here for consistency across the application.
 */
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Musisz być zalogowany, aby wykonać tę akcję.",
  DAILY_LIMIT_EXCEEDED: "Wykorzystałeś dzienny limit generowań. Wróć jutro!",
  INVALID_PROMPT: "Opis kolorowanki jest nieprawidłowy.",
  VALIDATION_ERROR: "Wprowadzone dane są nieprawidłowe.",
  UNSAFE_CONTENT:
    "Ups! Ten temat nie nadaje się do kolorowanki. Spróbuj czegoś innego.",
  GENERATION_FAILED:
    "Nie udało się wygenerować kolorowanki. Spróbuj ponownie.",
  GENERATION_TIMEOUT: "Generowanie trwa zbyt długo. Spróbuj ponownie.",
  INTERNAL_ERROR: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
  NOT_FOUND: "Nie znaleziono zasobu.",
} as const;

