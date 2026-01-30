/**
 * OpenRouter Service
 *
 * Provides a unified interface for all AI operations via OpenRouter API:
 * - Text operations (moderation, tag generation) via GPT-4o-mini
 * - Image generation via FLUX.2 Max
 *
 * @module openrouter
 */

import { logger } from "@/src/lib/utils/logger";

// =============================================================================
// Configuration
// =============================================================================

const OPENROUTER_CONFIG = {
  baseUrl: "https://openrouter.ai/api/v1",
  models: {
    text: "openai/gpt-4o-mini", // Cheap model for text (moderation, tags)
    image: "bytedance-seed/seedream-4.5", // Seedream 4.5 for image generation ($0.04/image)
  },
  timeout: {
    text: 15000, // 15s for text operations
    image: 90000, // 90s for image generation
  },
} as const;

/**
 * System prompt for coloring book image generation.
 * Instructs the model to create child-friendly black and white line art.
 */
const IMAGE_SYSTEM_PROMPT = `You are an expert illustrator specializing in children's coloring books.
Your task is to create black and white line art coloring pages.

STYLE REQUIREMENTS:
- Pure black outlines on white (#FFFFFF) background
- No shading, gradients, or filled areas
- Clear, well-defined lines suitable for coloring with crayons or markers
- Child-friendly, appealing designs
- Centered composition with good use of space
- No text or letters in the image

OUTPUT:
Generate a single coloring page image based on the user's description.`;

// =============================================================================
// Error Class
// =============================================================================

/**
 * Custom error class for OpenRouter API errors.
 * Used to distinguish OpenRouter-specific errors from other errors.
 */
export class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterError";
  }
}

// =============================================================================
// Types
// =============================================================================

interface SchemaProperty {
  type: "string" | "boolean" | "array" | "number";
  description?: string;
  items?: { type: "string" };
}

/**
 * JSON Schema for structured responses.
 * Used to ensure consistent response format from the model.
 */
export interface ResponseSchema {
  name: string;
  schema: {
    type: "object";
    properties: Record<string, SchemaProperty>;
    required: string[];
    additionalProperties: false;
  };
}

/**
 * Options for chat completion requests.
 */
export interface ChatCompletionOptions {
  /** System message defining the model's behavior */
  systemMessage: string;
  /** User message to process */
  userMessage: string;
  /** JSON schema for structured response */
  responseSchema: ResponseSchema;
  /** Model to use (defaults to gpt-4o-mini) */
  model?: string;
  /** Temperature for response randomness (0-1) */
  temperature?: number;
  /** Maximum tokens in response */
  maxTokens?: number;
}

/**
 * Result of a chat completion request.
 */
export interface ChatCompletionResult<T> {
  /** Parsed content from the model */
  content: T;
  /** Token usage statistics */
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

/**
 * Options for image generation requests.
 */
export interface GenerateImageOptions {
  /** Prompt describing the image to generate */
  prompt: string;
  /** Model to use (defaults to Gemini) */
  model?: string;
}

/**
 * Result of an image generation request.
 */
export interface GenerateImageResult {
  /** Base64 encoded image data */
  imageBase64: string;
  /** MIME type of the image (e.g., "image/png") */
  mimeType: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Creates headers for OpenRouter API requests.
 *
 * @throws OpenRouterError if API key is not configured
 */
function getHeaders(): HeadersInit {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new OpenRouterError("OPENROUTER_API_KEY nie jest skonfigurowany");
  }

  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "Malowanko",
  };
}

// =============================================================================
// Public Methods
// =============================================================================

/**
 * Performs a chat completion request with structured JSON response.
 *
 * @param options - Configuration for the chat completion
 * @returns Parsed response content and usage statistics
 * @throws OpenRouterError on API errors or timeout
 *
 * @example
 * ```typescript
 * const result = await chatCompletion<{ safe: boolean }>({
 *   systemMessage: "You are a content moderator...",
 *   userMessage: "Check this prompt",
 *   responseSchema: safetySchema,
 *   temperature: 0,
 * });
 * ```
 */
export async function chatCompletion<T>(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    OPENROUTER_CONFIG.timeout.text
  );

  try {
    logger.info("OpenRouter chat completion request", {
      model: options.model || OPENROUTER_CONFIG.models.text,
      schemaName: options.responseSchema.name,
    });

    const response = await fetch(
      `${OPENROUTER_CONFIG.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          model: options.model || OPENROUTER_CONFIG.models.text,
          messages: [
            { role: "system", content: options.systemMessage },
            { role: "user", content: options.userMessage },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: options.responseSchema.name,
              strict: true,
              schema: options.responseSchema.schema,
            },
          },
          temperature: options.temperature ?? 0,
          max_tokens: options.maxTokens ?? 200,
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      logger.error("OpenRouter API error", {
        status: response.status,
        error: errorText,
      });
      throw new OpenRouterError(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (!data.choices?.[0]?.message?.content) {
      throw new OpenRouterError("Brak odpowiedzi od modelu");
    }

    const content = JSON.parse(data.choices[0].message.content) as T;

    logger.info("OpenRouter chat completion success", {
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens,
    });

    return {
      content,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      logger.error("OpenRouter request timeout");
      throw new OpenRouterError("Timeout");
    }

    if (error instanceof OpenRouterError) {
      throw error;
    }

    if (error instanceof SyntaxError) {
      logger.error("OpenRouter response parse error", { error });
      throw new OpenRouterError("Nieprawidłowy format odpowiedzi");
    }

    logger.error("OpenRouter unexpected error", { error });
    throw new OpenRouterError("Nieoczekiwany błąd");
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Generates an image using Seedream 4.5 via OpenRouter.
 *
 * Uses a coloring book system prompt to ensure the model generates
 * child-friendly black and white line art suitable for coloring.
 *
 * @param options - Configuration for image generation
 * @returns Base64 encoded image data and MIME type
 * @throws OpenRouterError on API errors or timeout
 *
 * @see https://openrouter.ai/bytedance-seed/seedream-4.5/api
 *
 * @example
 * ```typescript
 * const result = await generateImage({
 *   prompt: "A cat playing with a ball of yarn",
 * });
 * // result.imageBase64 contains the base64 image
 * // result.mimeType is "image/png" or similar
 * ```
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    OPENROUTER_CONFIG.timeout.image
  );

  try {
    logger.info("OpenRouter image generation request", {
      model: options.model || OPENROUTER_CONFIG.models.image,
      promptLength: options.prompt.length,
    });

    // Seedream 4.5 has output_modalities: image only. Requesting ["image", "text"]
    // causes 404 "No endpoints found that support the requested output modalities".
    const modelId = options.model || OPENROUTER_CONFIG.models.image;
    const modalities =
      modelId === OPENROUTER_CONFIG.models.image ? ["image"] : ["image", "text"];

    const response = await fetch(
      `${OPENROUTER_CONFIG.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          model: modelId,
          modalities,
          messages: [
            {
              role: "system",
              content: IMAGE_SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: options.prompt,
            },
          ],
        }),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      logger.error("OpenRouter image API error", {
        status: response.status,
        error: errorText,
      });
      throw new OpenRouterError(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;

    // Debug: log raw response structure
    logger.info("OpenRouter raw response", {
      hasMessage: !!message,
      hasImages: !!message?.images,
      imagesCount: Array.isArray(message?.images) ? message.images.length : 0,
      contentType: typeof message?.content,
    });

    // Format 1: Seedream 4.5 and similar models return images in 'images' field
    if (
      message?.images &&
      Array.isArray(message.images) &&
      message.images.length > 0
    ) {
      const imageData = message.images[0];

      // Check if it's a data URL
      if (typeof imageData === "string") {
        const result = parseDataUrl(imageData);
        if (result) {
          logger.info("OpenRouter image generation success (images field)", {
            mimeType: result.mimeType,
          });
          return result;
        }

        // If it's raw base64 without data URL prefix
        if (imageData.length > 100) {
          logger.info("OpenRouter image generation success (raw base64)", {
            mimeType: "image/png",
          });
          return {
            mimeType: "image/png",
            imageBase64: imageData,
          };
        }
      }

      // Check if it's an object
      if (typeof imageData === "object" && imageData !== null) {
        // Seedream format: { type: "image_url", image_url: { url: "data:..." } }
        if (imageData.type === "image_url" && imageData.image_url?.url) {
          const result = parseDataUrl(imageData.image_url.url);
          if (result) {
            logger.info(
              "OpenRouter image generation success (image_url format)",
              {
                mimeType: result.mimeType,
              }
            );
            return result;
          }
        }

        // OpenAI format: { b64_json: "..." }
        if (imageData.b64_json) {
          logger.info("OpenRouter image generation success (b64_json)", {
            mimeType: "image/png",
          });
          return {
            mimeType: "image/png",
            imageBase64: imageData.b64_json,
          };
        }

        // Direct url field
        if (imageData.url) {
          const result = parseDataUrl(imageData.url);
          if (result) {
            logger.info("OpenRouter image generation success (url in images)", {
              mimeType: result.mimeType,
            });
            return result;
          }
        }
      }
    }

    // Format 2: Try to extract image from content (GPT, Gemini, etc.)
    const imageResult = extractImageFromContent(message?.content);
    if (imageResult) {
      logger.info("OpenRouter image generation success (content)", {
        mimeType: imageResult.mimeType,
      });
      return imageResult;
    }

    // Fallback: check if response is text (model didn't generate image)
    if (
      message?.content &&
      typeof message.content === "string" &&
      message.content.length > 0
    ) {
      logger.error("OpenRouter: Model returned text instead of image", {
        content: message.content.substring(0, 100),
      });
      throw new OpenRouterError("Model nie wygenerował obrazka");
    }

    logger.error("OpenRouter: Unexpected response format", {
      messageKeys: message ? Object.keys(message) : [],
      dataKeys: Object.keys(data),
      imagesPreview: JSON.stringify(message?.images)?.substring(0, 200),
    });
    throw new OpenRouterError("Nieoczekiwany format odpowiedzi");
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      logger.error("OpenRouter image generation timeout");
      throw new OpenRouterError("Timeout generowania obrazka");
    }

    if (error instanceof OpenRouterError) {
      throw error;
    }

    logger.error("OpenRouter image generation unexpected error", { error });
    throw new OpenRouterError("Błąd generowania obrazka");
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Extracts image data from various response content formats.
 * Supports multiple formats used by different models (FLUX.2, GPT, Gemini, etc.)
 */
function extractImageFromContent(content: unknown): GenerateImageResult | null {
  if (!content) return null;

  // Format 1: Array with image_url parts (FLUX.2 Max, GPT, Gemini)
  if (Array.isArray(content)) {
    for (const part of content) {
      // Check for type "image_url" or "image"
      if (
        (part.type === "image_url" || part.type === "image") &&
        part.image_url?.url
      ) {
        const result = parseDataUrl(part.image_url.url);
        if (result) return result;
      }

      // Some models return inline_data format
      if (part.type === "image" && part.inline_data) {
        return {
          mimeType: part.inline_data.mime_type || "image/png",
          imageBase64: part.inline_data.data,
        };
      }
    }
  }

  return null;
}

/**
 * Parses a data URL and extracts MIME type and base64 data.
 */
function parseDataUrl(url: string): GenerateImageResult | null {
  if (typeof url !== "string") return null;

  // Format: data:image/png;base64,xxxxx
  const matches = url.match(/^data:(.+);base64,(.+)$/);
  if (matches) {
    return {
      mimeType: matches[1],
      imageBase64: matches[2],
    };
  }

  return null;
}
