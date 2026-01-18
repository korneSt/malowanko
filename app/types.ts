/**
 * DTO and Command Model Types for Malowanko Application
 *
 * This file contains all Data Transfer Objects (DTOs) and Command Models
 * used by the API layer. Types are derived from database models defined
 * in app/db/database.types.ts and follow the API plan specification.
 */

import type { Database } from "./db/database.types";

// ============================================================================
// Database Row Type Aliases (for internal use)
// ============================================================================

/** Raw profile row from database */
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/** Raw coloring row from database */
type ColoringRow = Database["public"]["Tables"]["colorings"]["Row"];

/** Raw user_library row from database */
type UserLibraryRow = Database["public"]["Tables"]["user_library"]["Row"];

/** Raw favorites row from database */
type FavoritesRow = Database["public"]["Tables"]["favorites"]["Row"];

/** Raw public_gallery view row from database */
type PublicGalleryRow = Database["public"]["Views"]["public_gallery"]["Row"];

/** Raw user_library_view row from database */
type UserLibraryViewRow =
  Database["public"]["Views"]["user_library_view"]["Row"];

// ============================================================================
// 1. Common Types
// ============================================================================

/**
 * Age group categories for coloring pages.
 * Determines complexity and themes appropriate for each age range.
 */
export type AgeGroup = "0-3" | "4-8" | "9-12";

/**
 * Artistic style of the coloring page.
 * - prosty: Simple outlines for youngest children
 * - klasyczny: Classic coloring book style
 * - szczegolowy: Detailed illustrations for older children
 * - mandala: Mandala-style patterns
 */
export type ColoringStyle = "prosty" | "klasyczny" | "szczegolowy" | "mandala";

/**
 * Sort order options for gallery listings.
 */
export type SortOrder = "newest" | "popular";

/**
 * Sort order options for user library listings.
 */
export type LibrarySortOrder = "added" | "created";

/**
 * Print orientation options for PDF export.
 */
export type PrintOrientation = "portrait" | "landscape";

/**
 * Standard pagination parameters for list queries.
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Generic paginated response wrapper.
 * Used for all list endpoints that support pagination.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Error structure for failed actions.
 */
export interface ActionError {
  /** Machine-readable error code (e.g., 'UNAUTHORIZED', 'NOT_FOUND') */
  code: string;
  /** User-friendly message in Polish */
  message: string;
}

/**
 * Discriminated union result type for all server actions.
 * Provides type-safe success/error handling.
 *
 * @example
 * ```typescript
 * const result = await generateColorings(input);
 * if (result.success) {
 *   console.log(result.data.colorings);
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: ActionError };

/**
 * Simplified action result for actions that don't return data.
 */
export type ActionResultVoid =
  | { success: true }
  | { success: false; error: ActionError };

// ============================================================================
// 2. Profile DTOs
// ============================================================================

/**
 * User profile data transfer object.
 * Transforms snake_case database fields to camelCase and adds computed fields.
 *
 * @see ProfileRow - Source database type
 */
export interface ProfileDTO {
  /** User's unique identifier (matches Supabase Auth user ID) */
  id: ProfileRow["id"];
  /** User's email address */
  email: ProfileRow["email"];
  /** ISO timestamp when profile was created */
  createdAt: ProfileRow["created_at"];
  /** Number of colorings generated today */
  generationsToday: ProfileRow["generations_today"];
  /** Computed: Remaining generations allowed today (limit - generationsToday) */
  remainingGenerations: number;
}

/**
 * Generation limit status information.
 * Used to display remaining generations to the user.
 */
export interface GenerationLimitDTO {
  /** Number of generations used today */
  used: number;
  /** Number of generations remaining today */
  remaining: number;
  /** Daily generation limit (typically 10) */
  limit: number;
  /** ISO timestamp when the limit resets (next midnight UTC) */
  resetsAt: string;
}

// ============================================================================
// 3. Coloring DTOs
// ============================================================================

/**
 * Base coloring data transfer object.
 * Transforms snake_case database fields to camelCase with typed enums.
 *
 * @see ColoringRow - Source database type
 */
export interface ColoringDTO {
  /** Unique coloring identifier */
  id: ColoringRow["id"];
  /** URL to the coloring image in Supabase Storage */
  imageUrl: ColoringRow["image_url"];
  /** Original user prompt used to generate the coloring */
  prompt: ColoringRow["prompt"];
  /** Auto-generated Polish tags for search/filtering */
  tags: ColoringRow["tags"];
  /** Target age group for this coloring */
  ageGroup: AgeGroup;
  /** Artistic style of the coloring */
  style: ColoringStyle;
  /** ISO timestamp when the coloring was created */
  createdAt: ColoringRow["created_at"];
  /** Total number of global favorites */
  favoritesCount: ColoringRow["favorites_count"];
}

/**
 * Coloring DTO for public gallery listings.
 * Extends base ColoringDTO with optional favorite status for authenticated users.
 */
export interface GalleryColoringDTO extends ColoringDTO {
  /**
   * Whether the current user has globally favorited this coloring.
   * Only present for authenticated users, undefined for anonymous.
   */
  isFavorited?: boolean;
}

/**
 * Coloring DTO for user's personal library.
 * Includes both library-specific and global favorite status.
 *
 * @see UserLibraryViewRow - Source database view type
 */
export interface LibraryColoringDTO extends ColoringDTO {
  /** ISO timestamp when the coloring was added to the library */
  addedAt: string;
  /** Whether this coloring is marked as favorite in the user's library */
  isLibraryFavorite: boolean;
  /** Whether this coloring is globally favorited by the user */
  isGlobalFavorite: boolean;
}

// ============================================================================
// 4. Command Models (Input DTOs)
// ============================================================================

/**
 * Input for generating new coloring pages.
 * Validated with Zod schema before processing.
 */
export interface GenerateColoringInput {
  /** Description of the desired coloring page (max 500 chars) */
  prompt: string;
  /** Target age group for complexity adjustment */
  ageGroup: AgeGroup;
  /** Desired artistic style */
  style: ColoringStyle;
  /** Number of variations to generate (1-5, limited by remaining daily quota) */
  count: 1 | 2 | 3 | 4 | 5;
}

/**
 * Result of successful coloring generation.
 */
export interface GenerateColoringResult {
  /** Array of generated colorings */
  colorings: ColoringDTO[];
  /** Updated remaining generations count for today */
  remainingGenerations: number;
}

// ============================================================================
// 5. Gallery Query DTOs
// ============================================================================

/**
 * Filter options for gallery listings.
 */
export interface GalleryFilters {
  /** Search query (searches prompts and tags) */
  search?: string;
  /** Filter by one or more age groups */
  ageGroups?: AgeGroup[];
  /** Filter by one or more styles */
  styles?: ColoringStyle[];
  /** Sort order for results */
  sortBy: SortOrder;
}

/**
 * Complete query parameters for gallery listings.
 * Combines filters with pagination.
 */
export interface GalleryQueryParams extends GalleryFilters, PaginationParams {}

// ============================================================================
// 6. Library Query DTOs
// ============================================================================

/**
 * Query parameters for user library listings.
 */
export interface LibraryQueryParams extends PaginationParams {
  /** If true, only return colorings marked as favorite in library */
  favoritesOnly?: boolean;
  /** Sort by when added to library or when coloring was created */
  sortBy?: LibrarySortOrder;
}

// ============================================================================
// 7. Action Result Data Types
// ============================================================================

/**
 * Result data for toggleLibraryFavorite action.
 */
export interface ToggleFavoriteResult {
  /** New favorite status after toggle */
  isFavorite: boolean;
}

/**
 * Result data for toggleGlobalFavorite action.
 */
export interface ToggleGlobalFavoriteResult {
  /** New favorite status after toggle */
  isFavorite: boolean;
  /** Updated total favorites count for the coloring */
  favoritesCount: number;
}

// ============================================================================
// 8. Database Insert/Update Types (for internal use)
// ============================================================================

/**
 * Type for inserting a new coloring into the database.
 * Used internally by the generation service.
 */
export type ColoringInsert =
  Database["public"]["Tables"]["colorings"]["Insert"];

/**
 * Type for inserting a new user_library entry.
 */
export type UserLibraryInsert =
  Database["public"]["Tables"]["user_library"]["Insert"];

/**
 * Type for inserting a new favorite entry.
 */
export type FavoriteInsert =
  Database["public"]["Tables"]["favorites"]["Insert"];

// ============================================================================
// 9. Mapper Utility Types
// ============================================================================

/**
 * Maps a database coloring row to ColoringDTO.
 * Useful for type-safe transformations in query functions.
 *
 * @example
 * ```typescript
 * function mapToColoringDTO(row: ColoringRow): ColoringDTO {
 *   return {
 *     id: row.id,
 *     imageUrl: row.image_url,
 *     prompt: row.prompt,
 *     tags: row.tags,
 *     ageGroup: row.age_group as AgeGroup,
 *     style: row.style as ColoringStyle,
 *     createdAt: row.created_at,
 *     favoritesCount: row.favorites_count,
 *   };
 * }
 * ```
 */
export type ColoringRowToDTO = {
  [K in keyof ColoringDTO]: K extends "ageGroup"
    ? AgeGroup
    : K extends "style"
    ? ColoringStyle
    : K extends "imageUrl"
    ? ColoringRow["image_url"]
    : K extends "createdAt"
    ? ColoringRow["created_at"]
    : K extends "favoritesCount"
    ? ColoringRow["favorites_count"]
    : ColoringRow[Extract<K, keyof ColoringRow>];
};

/**
 * Utility type to extract non-null fields from a view row.
 * Views in Supabase return nullable fields even when underlying columns are not null.
 */
export type NonNullableViewRow<T> = {
  [K in keyof T]: NonNullable<T[K]>;
};

// ============================================================================
// 10. Error Code Constants
// ============================================================================

/**
 * All possible error codes returned by server actions.
 * Use these constants for type-safe error handling.
 */
export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",

  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  ALREADY_IN_LIBRARY: "ALREADY_IN_LIBRARY",
  CANNOT_REMOVE_OWN: "CANNOT_REMOVE_OWN",

  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_EMAIL: "INVALID_EMAIL",
  INVALID_PROMPT: "INVALID_PROMPT",
  UNSAFE_CONTENT: "UNSAFE_CONTENT",

  // Rate limiting
  DAILY_LIMIT_EXCEEDED: "DAILY_LIMIT_EXCEEDED",
  RATE_LIMITED: "RATE_LIMITED",

  // Server errors
  GENERATION_FAILED: "GENERATION_FAILED",
  GENERATION_TIMEOUT: "GENERATION_TIMEOUT",
  EMAIL_SEND_FAILED: "EMAIL_SEND_FAILED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

/**
 * Type representing all possible error codes.
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ============================================================================
// 11. Type Guards
// ============================================================================

/**
 * Type guard to check if an action result is successful.
 */
export function isActionSuccess<T>(
  result: ActionResult<T>
): result is { success: true; data: T } {
  return result.success === true;
}

/**
 * Type guard to check if an action result is an error.
 */
export function isActionError<T>(
  result: ActionResult<T>
): result is { success: false; error: ActionError } {
  return result.success === false;
}

/**
 * Type guard to validate AgeGroup string.
 */
export function isAgeGroup(value: string): value is AgeGroup {
  return ["0-3", "4-8", "9-12"].includes(value);
}

/**
 * Type guard to validate ColoringStyle string.
 */
export function isColoringStyle(value: string): value is ColoringStyle {
  return ["prosty", "klasyczny", "szczegolowy", "mandala"].includes(value);
}
