"use client";

import { useState, useEffect, useCallback } from "react";
import { getColoringImageUrl } from "@/src/lib/actions/gallery";

/** In-memory cache so we don't refetch the same image. */
const imageUrlCache = new Map<string, string>();

export interface UseColoringImageResult {
  imageUrl: string | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetches a single coloring image by ID when enabled (e.g. when card is in view).
 * Results are cached so the same ID is not fetched twice.
 *
 * @param coloringId - Coloring UUID (undefined = do nothing)
 * @param enabled - When true, start fetch (e.g. when element is in viewport)
 * @returns { imageUrl, isLoading, error }
 */
export function useColoringImage(
  coloringId: string | undefined,
  enabled: boolean
): UseColoringImageResult {
  const [imageUrl, setImageUrl] = useState<string | null>(() =>
    coloringId ? imageUrlCache.get(coloringId) ?? null : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchImage = useCallback(async (id: string) => {
    if (imageUrlCache.has(id)) {
      setImageUrl(imageUrlCache.get(id)!);
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await getColoringImageUrl(id);

    if (result.success) {
      imageUrlCache.set(id, result.data);
      setImageUrl(result.data);
    } else {
      setError(new Error(result.error.message));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!coloringId || !enabled) return;

    if (imageUrlCache.has(coloringId)) {
      setImageUrl(imageUrlCache.get(coloringId)!);
      return;
    }

    fetchImage(coloringId);
  }, [coloringId, enabled, fetchImage]);

  return { imageUrl, isLoading, error };
}
