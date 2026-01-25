/**
 * Server Actions for Global Favorites
 *
 * Contains server actions for managing global favorites that affect
 * the public favorites_count of colorings.
 *
 * Actions:
 * - toggleGlobalFavorite: Toggle global favorite status for a coloring
 *
 * @module actions/favorites
 */

"use server";

import { createClient } from "@/app/db/server";
import type {
  ActionResult,
  ToggleGlobalFavoriteResult,
} from "@/app/types";
import { ERROR_CODES } from "@/app/types";
import { coloringIdSchema } from "@/src/lib/validations/gallery";
import {
  createActionError,
  createActionSuccess,
  ERROR_MESSAGES,
} from "@/src/lib/utils/error-helpers";
import { logger } from "@/src/lib/utils/logger";

/**
 * Toggles global favorite status for a coloring.
 *
 * This action:
 * - Validates the coloring ID
 * - Ensures the user is authenticated
 * - Checks if the coloring exists
 * - Adds or removes an entry in the `favorites` table
 * - Updates and returns the current favorites count
 *
 * @param coloringId - UUID of the coloring to toggle favorite
 * @returns ActionResult with new favorite status and favorites count
 */
export async function toggleGlobalFavorite(
  coloringId: string
): Promise<ActionResult<ToggleGlobalFavoriteResult>> {
  // =========================================================================
  // 1. INPUT VALIDATION
  // =========================================================================
  const validationResult = coloringIdSchema.safeParse(coloringId);

  if (!validationResult.success) {
    logger.warn("Invalid coloring ID format (global favorite)", {
      coloringId,
      errors: validationResult.error.issues,
    });
    return createActionError(
      ERROR_CODES.VALIDATION_ERROR,
      ERROR_MESSAGES.VALIDATION_ERROR
    );
  }

  const validatedId = validationResult.data;

  // =========================================================================
  // 2. AUTHENTICATION
  // =========================================================================
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    logger.warn("Unauthorized global favorite toggle attempt", {
      coloringId: validatedId,
      error: authError?.message,
    });
    return createActionError(
      ERROR_CODES.UNAUTHORIZED,
      ERROR_MESSAGES.UNAUTHORIZED
    );
  }

  const userId = user.id;

  // =========================================================================
  // 3. CHECK IF COLORING EXISTS
  // =========================================================================
  const {
    data: coloring,
    error: coloringError,
  } = await supabase
    .from("colorings")
    .select("id, favorites_count")
    .eq("id", validatedId)
    .single();

  if (coloringError || !coloring) {
    logger.warn("Coloring not found for global favorite toggle", {
      userId,
      coloringId: validatedId,
      error: coloringError?.message,
    });
    return createActionError(
      ERROR_CODES.NOT_FOUND,
      ERROR_MESSAGES.NOT_FOUND
    );
  }

  // =========================================================================
  // 4. TOGGLE FAVORITE ENTRY
  // =========================================================================
  try {
    // Check if favorite already exists
    const {
      data: existingFavorite,
      error: favoriteError,
    } = await supabase
      .from("favorites")
      .select("user_id, coloring_id")
      .eq("user_id", userId)
      .eq("coloring_id", validatedId)
      .maybeSingle();

    if (favoriteError) {
      logger.error("Failed to check existing favorite", {
        userId,
        coloringId: validatedId,
        error: favoriteError.message,
      });
      return createActionError(
        ERROR_CODES.INTERNAL_ERROR,
        ERROR_MESSAGES.INTERNAL_ERROR
      );
    }

    let isFavorite: boolean;

    if (existingFavorite) {
      // Remove favorite
      const { error: deleteError } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("coloring_id", validatedId);

      if (deleteError) {
        logger.error("Failed to remove global favorite", {
          userId,
          coloringId: validatedId,
          error: deleteError.message,
        });
        return createActionError(
          ERROR_CODES.INTERNAL_ERROR,
          ERROR_MESSAGES.INTERNAL_ERROR
        );
      }

      isFavorite = false;
    } else {
      // Add favorite
      const { error: insertError } = await supabase
        .from("favorites")
        .insert({
          user_id: userId,
          coloring_id: validatedId,
        });

      if (insertError) {
        logger.error("Failed to add global favorite", {
          userId,
          coloringId: validatedId,
          error: insertError.message,
        });
        return createActionError(
          ERROR_CODES.INTERNAL_ERROR,
          ERROR_MESSAGES.INTERNAL_ERROR
        );
      }

      isFavorite = true;
    }

    // =========================================================================
    // 5. RECALCULATE FAVORITES COUNT
    // =========================================================================
    const {
      count,
      error: countError,
    } = await supabase
      .from("favorites")
      .select("coloring_id", { count: "exact", head: true })
      .eq("coloring_id", validatedId);

    if (countError) {
      logger.error("Failed to recalculate favorites count", {
        userId,
        coloringId: validatedId,
        error: countError.message,
      });
      return createActionError(
        ERROR_CODES.INTERNAL_ERROR,
        ERROR_MESSAGES.INTERNAL_ERROR
      );
    }

    const favoritesCount = count ?? 0;

    // Optionally update cached favorites_count in colorings table
    const { error: updateError } = await supabase
      .from("colorings")
      .update({ favorites_count: favoritesCount })
      .eq("id", validatedId);

    if (updateError) {
      logger.warn("Failed to update favorites_count cache", {
        userId,
        coloringId: validatedId,
        error: updateError.message,
      });
    }

    logger.info("Global favorite toggled", {
      userId,
      coloringId: validatedId,
      isFavorite,
      favoritesCount,
    });

    return createActionSuccess({
      isFavorite,
      favoritesCount,
    });
  } catch (error) {
    logger.error("Unexpected error toggling global favorite", {
      userId,
      coloringId: validatedId,
      error,
    });
    return createActionError(
      ERROR_CODES.INTERNAL_ERROR,
      ERROR_MESSAGES.INTERNAL_ERROR
    );
  }
}

