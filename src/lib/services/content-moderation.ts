/**
 * Content Moderation Service
 *
 * Validates user prompts for safety before generating coloring pages.
 * Uses GPT-4o-mini via OpenRouter to analyze prompts and ensure they
 * are appropriate for children aged 0-12.
 *
 * @module content-moderation
 */

import type { PromptSafetyResult } from "./types";
import {
  chatCompletion,
  OpenRouterError,
  type ResponseSchema,
} from "./openrouter";
import { logger } from "@/src/lib/utils/logger";

/**
 * List of keywords that should trigger immediate rejection.
 * Used as a quick pre-filter before more expensive API calls.
 */
const BLOCKED_KEYWORDS = [
  "przemoc",
  "violence",
  "krew",
  "blood",
  "śmierć",
  "death",
  "zabić",
  "kill",
  "broń",
  "weapon",
  "nóż",
  "knife",
  "pistolet",
  "gun",
  "strach",
  "horror",
  "zombie",
  "demon",
  "diabeł",
  "devil",
  "narkotyki",
  "drugs",
  "alkohol",
  "alcohol",
  "papieros",
  "cigarette",
  "seks",
  "sex",
  "nago",
  "naked",
];

/**
 * System prompt for content moderation.
 * Instructs the model to analyze prompts for child-appropriateness.
 */
const MODERATION_SYSTEM_PROMPT = `Jesteś moderatorem treści dla aplikacji kolorowanek dla dzieci 0-12 lat.
Oceń czy prompt jest BEZPIECZNY.

ODRZUĆ: przemoc, treści dla dorosłych, horror, narkotyki, dyskryminację.
AKCEPTUJ: zwierzęta, pojazdy, fantasy, sport, jedzenie, święta.`;

/**
 * JSON schema for safety check response.
 * Note: OpenAI strict mode requires all properties to be in 'required'.
 */
const safetySchema: ResponseSchema = {
  name: "safety_check",
  schema: {
    type: "object",
    properties: {
      safe: { type: "boolean" },
      reason: { type: "string" },
    },
    required: ["safe", "reason"],
    additionalProperties: false,
  },
};

/**
 * Validates a user prompt for safety using GPT-4o-mini via OpenRouter.
 *
 * This function performs a two-stage validation:
 * 1. Quick keyword check for obviously inappropriate content
 * 2. AI analysis for more nuanced content moderation
 *
 * @param prompt - The user's description for the coloring page
 * @returns Promise resolving to safety validation result
 *
 * @example
 * ```typescript
 * const result = await validatePromptSafety("kot grający na gitarze");
 * if (!result.safe) {
 *   console.log("Rejected:", result.reason);
 * }
 * ```
 */
export async function validatePromptSafety(
  prompt: string
): Promise<PromptSafetyResult> {
  // Quick keyword check first (cheap operation)
  const lowerPrompt = prompt.toLowerCase();
  for (const keyword of BLOCKED_KEYWORDS) {
    if (lowerPrompt.includes(keyword)) {
      logger.warn("Prompt blocked by keyword filter", {
        keyword,
        promptLength: prompt.length,
      });
      return {
        safe: false,
        reason: "Niedozwolone słowo",
      };
    }
  }

  try {
    const result = await chatCompletion<{ safe: boolean; reason?: string }>({
      systemMessage: MODERATION_SYSTEM_PROMPT,
      userMessage: prompt,
      responseSchema: safetySchema,
      temperature: 0,
      maxTokens: 100,
    });

    if (!result.content.safe) {
      logger.warn("Prompt rejected by AI moderation", {
        reason: result.content.reason,
        promptLength: prompt.length,
      });
    }

    return result.content;
  } catch (error) {
    logger.error("Content moderation failed", { error });

    // Fail open - allow if API fails to prevent blocking legitimate use
    if (error instanceof OpenRouterError) {
      return { safe: true };
    }

    return { safe: true };
  }
}
