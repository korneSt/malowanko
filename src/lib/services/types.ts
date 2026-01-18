/**
 * Service-specific types for the coloring generation pipeline.
 *
 * These types are used internally by services and are not exposed
 * to the API layer (which uses DTOs from app/types.ts).
 */

/**
 * Result of prompt safety validation.
 * Returned by the content moderation service.
 */
export interface PromptSafetyResult {
  /** Whether the prompt is safe for children */
  safe: boolean;
  /** Reason for rejection if not safe */
  reason?: string;
}

/**
 * Result of image generation from DALL-E.
 * Contains the raw image data and optional revised prompt.
 */
export interface ImageGenerationResult {
  /** Raw PNG image data as Buffer */
  imageData: Buffer;
  /** Base64 encoded image data (for direct storage) */
  imageBase64: string;
  /** MIME type of the image (e.g., "image/png") */
  mimeType: string;
  /** Revised prompt returned by DALL-E (if any) */
  revisedPrompt?: string;
}

/**
 * Result of tag generation from GPT-4.
 * Contains an array of Polish language tags.
 */
export interface TagGenerationResult {
  /** Array of 3-5 Polish language tags */
  tags: string[];
}

/**
 * Result of daily limit check.
 * Used by the generation limit service.
 */
export interface LimitCheckResult {
  /** Whether the generation is allowed */
  allowed: boolean;
  /** Number of remaining generations if not allowed */
  remaining?: number;
}

