/**
 * Server Actions for Colorings
 *
 * Contains server actions for coloring generation and management.
 *
 * Actions:
 * - generateColorings: Generate new coloring pages
 * - getGenerationLimit: Get current user's generation limit status
 *
 * @module actions/colorings
 */

"use server";

import { createClient } from "@/app/db/server";
import { createAdminClient } from "@/app/db/admin";
import type {
  ActionResult,
  GenerateColoringInput,
  GenerateColoringResult,
  ColoringDTO,
  AgeGroup,
  ColoringStyle,
} from "@/app/types";
import { ERROR_CODES } from "@/app/types";
import { generateColoringSchema } from "@/src/lib/validations/coloring";
import { validatePromptSafety } from "@/src/lib/services/content-moderation";
import { generateColoringImage } from "@/src/lib/services/image-generator";
import { generateTags } from "@/src/lib/services/tag-generator";
import {
  checkAndReserveLimit,
  getRemainingGenerations,
} from "@/src/lib/services/generation-limit";
import { logger } from "@/src/lib/utils/logger";
import {
  createActionError,
  createActionSuccess,
  ERROR_MESSAGES,
} from "@/src/lib/utils/error-helpers";

/**
 * Generates new coloring pages based on user description.
 *
 * This server action handles the complete flow of generating
 * coloring pages for children, including safety validation,
 * image generation, and storage.
 *
 * @param input - Generation parameters including prompt, age group, style, and count
 * @returns ActionResult containing generated colorings or error details
 *
 * @example
 * ```typescript
 * const result = await generateColorings({
 *   prompt: "kot grający na gitarze",
 *   ageGroup: "4-8",
 *   style: "klasyczny",
 *   count: 2,
 * });
 *
 * if (result.success) {
 *   console.log("Generated:", result.data.colorings);
 *   console.log("Remaining:", result.data.remainingGenerations);
 * } else {
 *   console.error("Error:", result.error.message);
 * }
 * ```
 */
export async function generateColorings(
  input: GenerateColoringInput
): Promise<ActionResult<GenerateColoringResult>> {
  // =========================================================================
  // 1. INPUT VALIDATION
  // =========================================================================
  const parseResult = generateColoringSchema.safeParse(input);

  if (!parseResult.success) {
    logger.warn("Validation failed", {
      errors: parseResult.error.issues,
    });
    return createActionError(
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_MESSAGES.VALIDATION_ERROR
    );
  }

  const { prompt, ageGroup, style, count } = parseResult.data;

  // =========================================================================
  // 2. AUTHENTICATION
  // =========================================================================
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.warn("Unauthorized coloring generation attempt", {
      error: authError?.message,
    });
    return createActionError(
      ERROR_CODES.UNAUTHORIZED,
      ERROR_MESSAGES.UNAUTHORIZED
    );
  }

  const userId = user.id;

  // =========================================================================
  // 3. DAILY LIMIT CHECK
  // =========================================================================
  const limitResult = await checkAndReserveLimit(userId, count);

  if (!limitResult.allowed) {
    return createActionError(
      ERROR_CODES.DAILY_LIMIT_EXCEEDED,
      ERROR_MESSAGES.DAILY_LIMIT_EXCEEDED
    );
  }

  // =========================================================================
  // 4. PROMPT SAFETY VALIDATION
  // =========================================================================
  const safetyResult = await validatePromptSafety(prompt);

  if (!safetyResult.safe) {
    logger.warn("Unsafe prompt rejected", {
      userId,
      reason: safetyResult.reason,
    });
    return createActionError(
      ERROR_CODES.UNSAFE_CONTENT,
      ERROR_MESSAGES.UNSAFE_CONTENT
    );
  }

  // =========================================================================
  // 5. GENERATE IMAGES AND TAGS IN PARALLEL
  // =========================================================================
  try {
    logger.info("Starting generation", {
      userId,
      prompt,
      ageGroup,
      style,
      count,
    });

    // Generate all images in parallel + tags
    const [images, tags] = await Promise.all([
      Promise.all(
        Array.from({ length: count }, () =>
          generateColoringImage(prompt, ageGroup, style)
        )
      ),
      generateTags(prompt),
    ]);

    logger.info("Generation completed", {
      userId,
      imageCount: images.length,
      tagCount: tags.length,
    });

    // =========================================================================
    // 6. SAVE IMAGES AS BASE64 AND SAVE TO DATABASE
    // Use admin client to bypass RLS for server-side operations
    // =========================================================================
    const adminClient = createAdminClient();
    const colorings: ColoringDTO[] = [];

    for (const image of images) {
      const coloringId = crypto.randomUUID();
      // const storagePath = `${userId}/${coloringId}.png`;

      // =======================================================================
      // STORAGE UPLOAD COMMENTED OUT - Testing base64 storage
      // =======================================================================
      // Upload image to Supabase Storage (using admin client to bypass RLS)
      // const { error: uploadError } = await adminClient.storage
      //   .from("colorings")
      //   .upload(storagePath, image.imageData, {
      //     contentType: "image/png",
      //     cacheControl: "31536000", // 1 year cache
      //     upsert: false,
      //   });

      // if (uploadError) {
      //   logger.error("Storage upload failed", {
      //     userId,
      //     coloringId,
      //     error: uploadError.message,
      //   });
      //   throw new Error(`Upload failed: ${uploadError.message}`);
      // }

      // Get public URL for the uploaded image
      // const {
      //   data: { publicUrl },
      // } = adminClient.storage.from("colorings").getPublicUrl(storagePath);

      // Convert base64 to data URL format for direct storage
      const dataUrl = `data:${image.mimeType};base64,${image.imageBase64}`;

      // Insert coloring record into database (using admin client to bypass RLS)
      const { data: coloring, error: dbError } = await adminClient
        .from("colorings")
        .insert({
          id: coloringId,
          user_id: userId,
          image_url: dataUrl, // Save base64 data URL directly
          prompt,
          tags,
          age_group: ageGroup,
          style,
        })
        .select()
        .single();

      if (dbError) {
        // =====================================================================
        // STORAGE ROLLBACK COMMENTED OUT - No storage to rollback
        // =====================================================================
        // Rollback: remove uploaded image
        // await adminClient.storage.from("colorings").remove([storagePath]);

        logger.error("Database insert failed", {
          userId,
          coloringId,
          error: dbError.message,
        });
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      // Map database record to DTO
      colorings.push({
        id: coloring.id,
        imageUrl: coloring.image_url,
        prompt: coloring.prompt,
        tags: coloring.tags,
        ageGroup: coloring.age_group as AgeGroup,
        style: coloring.style as ColoringStyle,
        createdAt: coloring.created_at,
        favoritesCount: coloring.favorites_count,
      });

      logger.info("Coloring saved", {
        coloringId: coloring.id,
        userId,
      });
    }

    // =========================================================================
    // 7. GET REMAINING GENERATIONS AND RETURN RESULT
    // =========================================================================
    const remainingGenerations = await getRemainingGenerations(userId);

    logger.info("Generation request completed", {
      userId,
      generatedCount: colorings.length,
      remainingGenerations,
    });

    return createActionSuccess({
      colorings,
      remainingGenerations,
    });
  } catch (error) {
    // =========================================================================
    // ERROR HANDLING
    // =========================================================================
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    logger.error("Generation failed", {
      userId,
      prompt,
      error: errorMessage,
    });

    // Check for specific error types
    if (error instanceof Error) {
      if (error.name === "AbortError" || errorMessage.includes("timeout")) {
        return createActionError(
          ERROR_CODES.GENERATION_TIMEOUT,
          ERROR_MESSAGES.GENERATION_TIMEOUT
        );
      }
    }

    return createActionError(
      ERROR_CODES.GENERATION_FAILED,
      ERROR_MESSAGES.GENERATION_FAILED
    );
  }
}

// ============================================================================
// GENERATION LIMIT
// ============================================================================

/**
 * Result type for getGenerationLimit action
 */
export interface GenerationLimitResult {
  /** Number of generations remaining today */
  remaining: number;
  /** Daily generation limit */
  limit: number;
  /** ISO timestamp when the limit resets */
  resetsAt: string;
}

/**
 * Gets the current user's generation limit status.
 *
 * This server action returns information about the user's
 * daily generation limit, including remaining generations
 * and reset time.
 *
 * @returns ActionResult containing limit status or error details
 *
 * @example
 * ```typescript
 * const result = await getGenerationLimit();
 *
 * if (result.success) {
 *   console.log(`Remaining: ${result.data.remaining}/${result.data.limit}`);
 *   console.log(`Resets at: ${result.data.resetsAt}`);
 * }
 * ```
 */
export async function getGenerationLimit(): Promise<
  ActionResult<GenerationLimitResult>
> {
  try {
    // =========================================================================
    // AUTHENTICATION
    // =========================================================================
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn("Unauthorized generation limit request", {
        error: authError?.message,
      });
      return createActionError(
        ERROR_CODES.UNAUTHORIZED,
        ERROR_MESSAGES.UNAUTHORIZED
      );
    }

    const userId = user.id;

    const remaining = await getRemainingGenerations(userId);

    // Calculate next midnight for reset time
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return createActionSuccess({
      remaining,
      limit: 100,
      resetsAt: tomorrow.toISOString(),
    });
  } catch (error) {
    logger.error("Failed to get generation limit", { error });
    return createActionError(
      ERROR_CODES.INTERNAL_ERROR,
      "Nie udało się pobrać informacji o limicie."
    );
  }
}
