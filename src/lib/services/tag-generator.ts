/**
 * Tag Generator Service
 *
 * Generates descriptive Polish language tags for coloring pages.
 * Uses GPT-4o-mini via OpenRouter to analyze the prompt and create
 * relevant tags for search and categorization.
 *
 * @module tag-generator
 */

import {
  chatCompletion,
  OpenRouterError,
  type ResponseSchema,
} from "./openrouter";
import { logger } from "@/src/lib/utils/logger";

/**
 * System prompt for tag generation.
 * Instructs the model to generate Polish language tags.
 */
const TAG_PROMPT = `Wygeneruj 3-5 tagów po polsku dla kolorowanki. Tagi to pojedyncze słowa, małe litery.`;

/**
 * JSON schema for tags response.
 */
const tagsSchema: ResponseSchema = {
  name: "tags",
  schema: {
    type: "object",
    properties: {
      tags: { type: "array", items: { type: "string" } },
    },
    required: ["tags"],
    additionalProperties: false,
  },
};

/**
 * Default tags when generation fails or no specific theme is detected.
 */
const DEFAULT_TAGS = ["kolorowanka", "dla dzieci"];

/**
 * Generates descriptive tags for a coloring page using GPT-4o-mini via OpenRouter.
 *
 * Tags are used for:
 * - Search functionality in the gallery
 * - Categorization and filtering
 * - Related content suggestions
 *
 * @param prompt - User's description of the coloring page
 * @returns Promise resolving to array of 3-5 Polish tags
 *
 * @example
 * ```typescript
 * const tags = await generateTags("kot grający na gitarze");
 * // Returns: ["kot", "zwierzęta", "muzyka", "gitara", "zabawa"]
 * ```
 */
export async function generateTags(prompt: string): Promise<string[]> {
  try {
    const result = await chatCompletion<{ tags: string[] }>({
      systemMessage: TAG_PROMPT,
      userMessage: prompt,
      responseSchema: tagsSchema,
      temperature: 0.3,
      maxTokens: 100,
    });

    const tags = result.content.tags;

    // Validate and limit tags
    if (!Array.isArray(tags) || tags.length === 0) {
      logger.warn("Invalid tags response, using defaults", { prompt });
      return DEFAULT_TAGS;
    }

    const validTags = tags
      .filter((tag): tag is string => typeof tag === "string" && tag.length > 0)
      .map((tag) => tag.toLowerCase().trim())
      .slice(0, 5);

    if (validTags.length === 0) {
      return DEFAULT_TAGS;
    }

    logger.info("Tags generated successfully", { prompt, tags: validTags });
    return validTags;
  } catch (error) {
    logger.error("Tag generation failed", { prompt, error });

    // Return default tags on error
    if (error instanceof OpenRouterError) {
      return DEFAULT_TAGS;
    }

    return DEFAULT_TAGS;
  }
}
