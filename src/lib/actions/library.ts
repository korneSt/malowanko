/**
 * Server Actions for Library Management
 *
 * Contains server actions for managing user's personal library.
 *
 * Actions:
 * - removeFromLibrary: Remove a coloring from user's library
 * - toggleLibraryFavorite: Toggle favorite status in library
 *
 * @module actions/library
 */

"use server";

import { createClient } from "@/app/db/server";
import type {
  ActionResult,
  ActionResultVoid,
  ToggleFavoriteResult,
  ERROR_CODES,
} from "@/app/types";
import { ERROR_CODES as ERROR_CODES_CONST } from "@/app/types";
import { coloringIdSchema } from "@/src/lib/validations/library";
import { logger } from "@/src/lib/utils/logger";
import {
  createActionError,
  createActionSuccess,
  ERROR_MESSAGES,
} from "@/src/lib/utils/error-helpers";
import type { Database } from "@/app/db/database.types";

/**
 * Removes a coloring from the user's personal library.
 *
 * This action validates that:
 * - User is authenticated
 * - Coloring exists in user's library
 * - Coloring is not the user's own generated coloring (cannot remove own)
 *
 * @param coloringId - UUID of the coloring to remove
 * @returns ActionResultVoid indicating success or error
 *
 * @example
 * ```typescript
 * const result = await removeFromLibrary("123e4567-e89b-12d3-a456-426614174000");
 *
 * if (result.success) {
 *   toast.success("Usunięto kolorowankę z biblioteki");
 * } else {
 *   toast.error(result.error.message);
 * }
 * ```
 */
export async function removeFromLibrary(
  coloringId: string
): Promise<ActionResultVoid> {
  // =========================================================================
  // 1. INPUT VALIDATION
  // =========================================================================
  const validationResult = coloringIdSchema.safeParse(coloringId);

  if (!validationResult.success) {
    logger.warn("Invalid coloring ID format", {
      coloringId,
      errors: validationResult.error.issues,
    });
    return createActionError(
      ERROR_CODES_CONST.VALIDATION_ERROR,
      "Nieprawidłowy format ID kolorowanki."
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
    logger.warn("Unauthorized library removal attempt", {
      coloringId: validatedId,
      error: authError?.message,
    });
    return createActionError(
      ERROR_CODES_CONST.UNAUTHORIZED,
      "Musisz być zalogowany, aby usunąć kolorowankę z biblioteki."
    );
  }

  const userId = user.id;

  // =========================================================================
  // 3. CHECK IF COLORING EXISTS IN LIBRARY
  // =========================================================================
  const { data: libraryEntry, error: checkError } = await supabase
    .from("user_library")
    .select("coloring_id")
    .eq("user_id", userId)
    .eq("coloring_id", validatedId)
    .single();

  if (checkError || !libraryEntry) {
    logger.warn("Coloring not found in library", {
      userId,
      coloringId: validatedId,
      error: checkError?.message,
    });
    return createActionError(
      ERROR_CODES_CONST.NOT_FOUND,
      "Kolorowanka nie została znaleziona w Twojej bibliotece."
    );
  }

  // =========================================================================
  // 4. CHECK IF COLORING IS USER'S OWN GENERATED COLORING
  // =========================================================================
  const { data: coloring, error: coloringError } = await supabase
    .from("colorings")
    .select("user_id")
    .eq("id", validatedId)
    .single();

  if (coloringError) {
    logger.error("Failed to fetch coloring", {
      userId,
      coloringId: validatedId,
      error: coloringError.message,
    });
    return createActionError(
      ERROR_CODES_CONST.NOT_FOUND,
      "Kolorowanka nie została znaleziona."
    );
  }

  if (coloring.user_id === userId) {
    logger.warn("Attempt to remove own generated coloring from library", {
      userId,
      coloringId: validatedId,
    });
    return createActionError(
      ERROR_CODES_CONST.CANNOT_REMOVE_OWN,
      "Nie można usunąć własnej wygenerowanej kolorowanki z biblioteki."
    );
  }

  // =========================================================================
  // 5. REMOVE FROM LIBRARY
  // =========================================================================
  const { error: deleteError } = await supabase
    .from("user_library")
    .delete()
    .eq("user_id", userId)
    .eq("coloring_id", validatedId);

  if (deleteError) {
    logger.error("Failed to remove from library", {
      userId,
      coloringId: validatedId,
      error: deleteError.message,
    });
    return createActionError(
      ERROR_CODES_CONST.INTERNAL_ERROR,
      "Nie udało się usunąć kolorowanki z biblioteki."
    );
  }

  logger.info("Coloring removed from library", {
    userId,
    coloringId: validatedId,
  });

  return createActionSuccess();
}

/**
 * Toggles the favorite status of a coloring in the user's library.
 *
 * This action validates that:
 * - User is authenticated
 * - Coloring exists in user's library
 *
 * @param coloringId - UUID of the coloring to toggle favorite
 * @returns ActionResult containing new favorite status
 *
 * @example
 * ```typescript
 * const result = await toggleLibraryFavorite("123e4567-e89b-12d3-a456-426614174000");
 *
 * if (result.success) {
 *   console.log("Is favorite:", result.data.isFavorite);
 * } else {
 *   console.error("Error:", result.error.message);
 * }
 * ```
 */
export async function toggleLibraryFavorite(
  coloringId: string
): Promise<ActionResult<ToggleFavoriteResult>> {
  // =========================================================================
  // 1. INPUT VALIDATION
  // =========================================================================
  const validationResult = coloringIdSchema.safeParse(coloringId);

  if (!validationResult.success) {
    logger.warn("Invalid coloring ID format", {
      coloringId,
      errors: validationResult.error.issues,
    });
    return createActionError(
      ERROR_CODES_CONST.VALIDATION_ERROR,
      "Nieprawidłowy format ID kolorowanki."
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
    logger.warn("Unauthorized library favorite toggle attempt", {
      coloringId: validatedId,
      error: authError?.message,
    });
    return createActionError(
      ERROR_CODES_CONST.UNAUTHORIZED,
      "Musisz być zalogowany, aby oznaczyć kolorowankę jako ulubioną."
    );
  }

  const userId = user.id;

  // =========================================================================
  // 3. CHECK IF COLORING EXISTS IN LIBRARY
  // =========================================================================
  const { data: libraryEntry, error: checkError } = await supabase
    .from("user_library")
    .select("is_favorite")
    .eq("user_id", userId)
    .eq("coloring_id", validatedId)
    .single();

  if (checkError || !libraryEntry) {
    logger.warn("Coloring not found in library", {
      userId,
      coloringId: validatedId,
      error: checkError?.message,
    });
    return createActionError(
      ERROR_CODES_CONST.NOT_FOUND,
      "Kolorowanka nie została znaleziona w Twojej bibliotece."
    );
  }

  // =========================================================================
  // 4. TOGGLE FAVORITE STATUS
  // =========================================================================
  const newFavoriteStatus = !libraryEntry.is_favorite;

  const { error: updateError } = await supabase
    .from("user_library")
    .update({ is_favorite: newFavoriteStatus })
    .eq("user_id", userId)
    .eq("coloring_id", validatedId);

  if (updateError) {
    logger.error("Failed to toggle library favorite", {
      userId,
      coloringId: validatedId,
      error: updateError.message,
    });
    return createActionError(
      ERROR_CODES_CONST.INTERNAL_ERROR,
      "Nie udało się zaktualizować statusu ulubionych."
    );
  }

  logger.info("Library favorite toggled", {
    userId,
    coloringId: validatedId,
    isFavorite: newFavoriteStatus,
  });

  return createActionSuccess({
    isFavorite: newFavoriteStatus,
  });
}
