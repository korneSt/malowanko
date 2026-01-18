/**
 * Image Generator Service
 *
 * Generates coloring page images using Gemini via OpenRouter.
 * Creates black and white line art suitable for children to color.
 *
 * @module image-generator
 */

import type { AgeGroup, ColoringStyle } from "@/app/types";
import type { ImageGenerationResult } from "./types";
import { generateImage, OpenRouterError } from "./openrouter";
import { logger } from "@/src/lib/utils/logger";

/**
 * Style descriptions for different complexity levels.
 * Used to construct the image generation prompt.
 */
const STYLE_DESCRIPTIONS: Record<ColoringStyle, string> = {
  prosty:
    "Very simple shapes with thick bold lines, minimal details, large areas to color. For toddlers aged 0-3.",
  klasyczny:
    "Classic coloring book style with medium detail and clear outlines. For children aged 4-8.",
  szczegolowy:
    "Detailed illustration with many elements and finer lines. For older children aged 9-12.",
  mandala: "Circular symmetrical pattern with repeating geometric elements.",
};

/**
 * Age-appropriate complexity adjustments.
 * Provides additional guidance based on target age group.
 */
const AGE_ADJUSTMENTS: Record<AgeGroup, string> = {
  "0-3": "Use very large, simple shapes. Maximum 3-4 main elements.",
  "4-8": "Use clear shapes with moderate complexity. Include 5-8 elements.",
  "9-12": "Can include intricate details. Allow for 10+ elements.",
};

/**
 * Builds the complete prompt for image generation.
 *
 * @param userPrompt - The user's description of the coloring page
 * @param ageGroup - Target age group for complexity adjustment
 * @param style - Desired artistic style
 * @returns Complete prompt string for Gemini
 */
function buildImagePrompt(
  userPrompt: string,
  ageGroup: AgeGroup,
  style: ColoringStyle
): string {
  return `Create a black and white line art coloring page for children.

Subject: ${userPrompt}
Target age: ${ageGroup} years old
Style: ${STYLE_DESCRIPTIONS[style]}

Requirements:
- Pure black outlines on white background
- No shading, gradients, or filled areas
- Clear, well-defined lines suitable for coloring
- Complexity: ${AGE_ADJUSTMENTS[ageGroup]}
- Friendly, child-appropriate design
- Centered composition
- No text or letters`;
}

/**
 * Generates a coloring page image using Gemini via OpenRouter.
 *
 * This function:
 * 1. Builds an appropriate prompt from user input and parameters
 * 2. Calls Gemini via OpenRouter with timeout protection
 * 3. Returns the generated image as a Buffer
 *
 * @param prompt - User's description of the desired coloring page
 * @param ageGroup - Target age group for complexity adjustment
 * @param style - Desired artistic style
 * @returns Promise resolving to the generated image data
 * @throws Error if generation fails or times out
 *
 * @example
 * ```typescript
 * const result = await generateColoringImage(
 *   "kot grający na gitarze",
 *   "4-8",
 *   "klasyczny"
 * );
 * // result.imageData contains the PNG buffer
 * ```
 */
export async function generateColoringImage(
  prompt: string,
  ageGroup: AgeGroup,
  style: ColoringStyle
): Promise<ImageGenerationResult> {
  const fullPrompt = buildImagePrompt(prompt, ageGroup, style);

  logger.info("Generating coloring image", {
    prompt,
    ageGroup,
    style,
  });

  try {
    const result = await generateImage({ prompt: fullPrompt });

    // Convert base64 to Buffer (for backward compatibility)
    const imageData = Buffer.from(result.imageBase64, "base64");

    logger.info("Image generated successfully", {
      imageSize: imageData.length,
      mimeType: result.mimeType,
    });

    return {
      imageData,
      imageBase64: result.imageBase64, // Include base64 string for direct storage
      mimeType: result.mimeType,
      revisedPrompt: fullPrompt,
    };
  } catch (error) {
    logger.error("Image generation failed", { prompt, error });

    if (error instanceof OpenRouterError) {
      throw new Error(error.message);
    }

    throw new Error("Nie udało się wygenerować obrazka");
  }
}
