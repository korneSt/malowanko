/**
 * Zod Validation Schemas for Gallery Queries
 *
 * Provides type-safe validation for gallery query parameters.
 * Schemas are used by query functions before executing database queries.
 *
 * @module validations/gallery
 */

import { z } from "zod";

/**
 * Age group validation schema.
 * Validates that the value is one of the allowed age groups.
 */
export const ageGroupSchema = z.enum(["0-3", "4-8", "9-12"]);

/**
 * Coloring style validation schema.
 * Validates that the value is one of the allowed styles.
 */
export const styleSchema = z.enum([
  "prosty",
  "klasyczny",
  "szczegolowy",
  "mandala",
]);

/**
 * Sort order validation schema.
 * Validates that the value is one of the allowed sort orders.
 */
export const sortOrderSchema = z.enum(["newest", "popular"]);

/**
 * Complete schema for gallery query parameters.
 * Validates all fields required to query the public gallery.
 *
 * @example
 * ```typescript
 * const result = galleryQueryParamsSchema.safeParse({
 *   page: 1,
 *   limit: 20,
 *   search: "kot",
 *   ageGroups: ["4-8"],
 *   styles: ["klasyczny"],
 *   sortBy: "popular"
 * });
 *
 * if (!result.success) {
 *   console.error(result.error.format());
 * }
 * ```
 */
export const galleryQueryParamsSchema = z
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
    search: z
      .string()
      .max(200, "Wyszukiwanie może mieć maksymalnie 200 znaków")
      .trim()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : undefined)),
    ageGroups: z
      .array(ageGroupSchema)
      .max(3, "Maksymalnie 3 grupy wiekowe")
      .optional()
      .transform((val) => (val && val.length > 0 ? val : undefined)),
    styles: z
      .array(styleSchema)
      .max(4, "Maksymalnie 4 style")
      .optional()
      .transform((val) => (val && val.length > 0 ? val : undefined)),
    sortBy: sortOrderSchema.default("newest"),
  })
  .default({
    page: 1,
    limit: 20,
    sortBy: "newest",
    search: undefined,
    ageGroups: undefined,
    styles: undefined,
  });

/**
 * UUID validation schema for coloring ID.
 * Validates that the ID is a properly formatted UUID.
 */
export const coloringIdSchema = z
  .string()
  .uuid("Nieprawidłowy format ID kolorowanki");

/**
 * Input type for the gallery query params schema (before transformation).
 * Use this type for function parameters that accept raw user input.
 */
export type GalleryQueryParamsSchemaInput = z.input<
  typeof galleryQueryParamsSchema
>;

/**
 * Output type for the gallery query params schema (after transformation).
 * Use this type for validated and transformed data.
 */
export type GalleryQueryParamsSchemaOutput = z.output<
  typeof galleryQueryParamsSchema
>;

/**
 * Extracts formatted error messages from a Zod error.
 *
 * @param error - Zod error object
 * @returns Formatted error message string
 *
 * @example
 * ```typescript
 * const result = galleryQueryParamsSchema.safeParse(input);
 * if (!result.success) {
 *   const message = formatZodError(result.error);
 *   // "Strona musi być większa od 0. Limit nie może przekraczać 50."
 * }
 * ```
 */
export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(". ");
}
