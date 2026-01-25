/**
 * Zod Validation Schemas for Library Queries
 *
 * Provides type-safe validation for library query parameters.
 * Schemas are used by query functions before executing database queries.
 *
 * @module validations/library
 */

import { z } from "zod";

/**
 * Library sort order validation schema.
 * Validates that the value is one of the allowed sort orders.
 */
export const librarySortOrderSchema = z.enum(["added", "created"]);

/**
 * Complete schema for library query parameters.
 * Validates all fields required to query the user library.
 *
 * @example
 * ```typescript
 * const result = libraryQueryParamsSchema.safeParse({
 *   page: 1,
 *   limit: 20,
 *   favoritesOnly: true,
 *   sortBy: "added"
 * });
 *
 * if (!result.success) {
 *   console.error(result.error.format());
 * }
 * ```
 */
export const libraryQueryParamsSchema = z
  .object({
    page: z
      .number()
      .int("Strona musi być liczbą całkowitą")
      .min(1, "Strona musi być większa od 0")
      .default(1),
    limit: z
      .number()
      .int("Limit musi być liczbą całkowitą")
      .min(1, "Limit musi być większy od 0")
      .max(50, "Limit nie może przekraczać 50")
      .default(20),
    favoritesOnly: z
      .boolean()
      .optional()
      .transform((val) => val ?? false),
    sortBy: librarySortOrderSchema.default("added"),
  })
  .default({
    page: 1,
    limit: 20,
    favoritesOnly: false,
    sortBy: "added",
  });

/**
 * UUID validation schema for coloring ID.
 * Validates that the ID is a properly formatted UUID.
 */
export const coloringIdSchema = z
  .string()
  .uuid("Nieprawidłowy format ID kolorowanki");

/**
 * Extracts formatted error messages from a Zod error.
 *
 * @param error - Zod error object
 * @returns Formatted error message string
 *
 * @example
 * ```typescript
 * const result = libraryQueryParamsSchema.safeParse(input);
 * if (!result.success) {
 *   const message = formatZodError(result.error);
 *   // "Strona musi być większa od 0. Limit nie może przekraczać 50."
 * }
 * ```
 */
export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(". ");
}
