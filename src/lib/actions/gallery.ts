/**
 * Server Actions for Gallery
 *
 * Actions for fetching gallery coloring data on demand (e.g. single image
 * for lazy-loaded cards, full coloring for preview/print).
 *
 * @module actions/gallery
 */

"use server";

import { createClient } from "@/app/db/server";
import type { ActionResult, GalleryColoringDTO } from "@/app/types";
import { ERROR_CODES } from "@/app/types";
import {
  createActionError,
  createActionSuccess,
  ERROR_MESSAGES,
} from "@/src/lib/utils/error-helpers";
import { getColoringById } from "@/src/lib/queries/gallery";
import { coloringIdSchema, formatZodError } from "@/src/lib/validations/gallery";
import { logger } from "@/src/lib/utils/logger";

/**
 * Fetches only the image URL (base64) for a coloring by ID.
 * Used for progressive image loading in the gallery (one image per request).
 *
 * @param id - UUID of the coloring
 * @returns ActionResult with image data URL or error
 */
export async function getColoringImageUrl(
  id: string
): Promise<ActionResult<string>> {
  const validationResult = coloringIdSchema.safeParse(id);
  if (!validationResult.success) {
    return createActionError(
      ERROR_CODES.VALIDATION_ERROR,
      formatZodError(validationResult.error)
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("colorings")
      .select("image_url")
      .eq("id", id)
      .single();

    if (error) {
      logger.error("Failed to fetch coloring image", { id, error: error.message });
      return createActionError(
        ERROR_CODES.INTERNAL_ERROR,
        "Nie udało się pobrać obrazu kolorowanki."
      );
    }

    if (!data?.image_url) {
      return createActionError(ERROR_CODES.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND);
    }

    return createActionSuccess(data.image_url);
  } catch (err) {
    logger.error("Error fetching coloring image", { id, error: err });
    return createActionError(
      ERROR_CODES.INTERNAL_ERROR,
      "Nie udało się pobrać obrazu kolorowanki."
    );
  }
}

/**
 * Fetches a full coloring (including image) by ID for preview/print.
 * Use when the user opens the preview modal and the list item had no image.
 *
 * @param id - UUID of the coloring
 * @returns Full GalleryColoringDTO or null if not found
 */
export async function getColoringForPreview(
  id: string
): Promise<GalleryColoringDTO | null> {
  return getColoringById(id);
}
