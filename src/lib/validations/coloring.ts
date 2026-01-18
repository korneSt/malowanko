/**
 * Zod Validation Schemas for Coloring Generation
 *
 * Provides type-safe validation for all coloring-related inputs.
 * Schemas are used by server actions before processing requests.
 *
 * @module validations/coloring
 */

import { z } from "zod";

/**
 * Age group validation schema.
 * Validates that the value is one of the allowed age groups.
 */
export const ageGroupSchema = z.enum(["0-3", "4-8", "9-12"], {
  errorMap: () => ({ message: "Nieprawidłowa grupa wiekowa" }),
});

/**
 * Coloring style validation schema.
 * Validates that the value is one of the allowed styles.
 */
export const styleSchema = z.enum(
  ["prosty", "klasyczny", "szczegolowy", "mandala"],
  {
    errorMap: () => ({ message: "Nieprawidłowy styl kolorowanki" }),
  }
);

/**
 * Count validation schema.
 * Limits generation to 1-5 images at once.
 */
export const countSchema = z
  .union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ])
  .default(1);

/**
 * Prompt validation schema.
 * Validates and sanitizes user input for the coloring description.
 *
 * Constraints:
 * - Minimum 1 character (after trimming)
 * - Maximum 500 characters
 * - Automatically trimmed of leading/trailing whitespace
 */
export const promptSchema = z
  .string({
    required_error: "Opis kolorowanki jest wymagany",
    invalid_type_error: "Opis musi być tekstem",
  })
  .min(1, "Opis kolorowanki jest wymagany")
  .max(500, "Opis może mieć maksymalnie 500 znaków")
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, {
    message: "Opis kolorowanki nie może być pusty",
  });

/**
 * Complete schema for coloring generation input.
 * Validates all fields required to generate a coloring page.
 *
 * @example
 * ```typescript
 * const result = generateColoringSchema.safeParse({
 *   prompt: "kot grający na gitarze",
 *   ageGroup: "4-8",
 *   style: "klasyczny",
 *   count: 2,
 * });
 *
 * if (!result.success) {
 *   console.error(result.error.format());
 * }
 * ```
 */
export const generateColoringSchema = z.object({
  prompt: promptSchema,
  ageGroup: ageGroupSchema,
  style: styleSchema,
  count: countSchema,
});

/**
 * Input type for the generateColoring schema (before transformation).
 * Use this type for function parameters that accept raw user input.
 */
export type GenerateColoringSchemaInput = z.input<
  typeof generateColoringSchema
>;

/**
 * Output type for the generateColoring schema (after transformation).
 * Use this type for validated and transformed data.
 */
export type GenerateColoringSchemaOutput = z.output<
  typeof generateColoringSchema
>;

/**
 * Extracts formatted error messages from a Zod error.
 *
 * @param error - Zod error object
 * @returns Formatted error message string
 *
 * @example
 * ```typescript
 * const result = generateColoringSchema.safeParse(input);
 * if (!result.success) {
 *   const message = formatZodError(result.error);
 *   // "Opis kolorowanki jest wymagany. Nieprawidłowa grupa wiekowa."
 * }
 * ```
 */
export function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(". ");
}

