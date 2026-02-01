/**
 * Library Query Functions
 *
 * Functions for querying the user's personal library of colorings.
 * Designed to be used in Server Components.
 *
 * @module queries/library
 */

import { createClient } from "@/app/db/server";
import type {
  LibraryQueryParams,
  LibraryColoringDTO,
  LibraryColoringListItem,
  PaginatedResponse,
  AgeGroup,
  ColoringStyle,
} from "@/app/types";
import type { Database } from "@/app/db/database.types";
import { logger } from "@/src/lib/utils/logger";
import {
  libraryQueryParamsSchema,
  formatZodError,
} from "@/src/lib/validations/library";
import type { SupabaseClient } from "@supabase/supabase-js";

type UserLibraryViewRow =
  Database["public"]["Views"]["user_library_view"]["Row"];

type UserLibraryListRow = Omit<UserLibraryViewRow, "image_url">;

const LIBRARY_LIST_COLUMNS =
  "added_at, age_group, coloring_id, created_at, favorites_count, is_global_favorite, library_favorite, prompt, style, tags, user_id" as const;

/**
 * Normalizes and validates library query parameters.
 * Applies default values and validates all constraints.
 *
 * @param params - Raw query parameters from user input
 * @returns Validated and normalized parameters
 * @throws Error if validation fails
 */
function normalizeLibraryParams(
  params: Partial<LibraryQueryParams>
): Required<Omit<LibraryQueryParams, "favoritesOnly">> & {
  favoritesOnly: boolean;
} {
  const result = libraryQueryParamsSchema.safeParse(params);

  if (!result.success) {
    const errorMessage = formatZodError(result.error);
    logger.error("Library query params validation failed", {
      params,
      errors: result.error.issues,
    });
    throw new Error(errorMessage);
  }

  return result.data;
}

/**
 * Maps a library list row (no image_url) to LibraryColoringListItem.
 *
 * @param row - Database row from user_library_view without image_url
 * @returns LibraryColoringListItem (imageUrl omitted, loaded separately)
 * @throws Error if required fields are null
 */
function mapLibraryRowToListDTO(
  row: UserLibraryListRow
): LibraryColoringListItem {
  if (
    !row.coloring_id ||
    !row.prompt ||
    !row.age_group ||
    !row.style ||
    !row.created_at ||
    row.favorites_count === null ||
    !row.added_at
  ) {
    logger.error("Invalid library row with null required fields", {
      coloringId: row.coloring_id,
    });
    throw new Error("Nieprawidłowe dane kolorowanki w bibliotece.");
  }

  return {
    id: row.coloring_id,
    prompt: row.prompt,
    tags: row.tags ?? [],
    ageGroup: row.age_group as AgeGroup,
    style: row.style as ColoringStyle,
    createdAt: row.created_at,
    favoritesCount: row.favorites_count,
    addedAt: row.added_at,
    isLibraryFavorite: row.library_favorite ?? false,
    isGlobalFavorite: row.is_global_favorite ?? false,
  };
}

/**
 * Builds a Supabase query for library listings with filters and sorting.
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user ID
 * @param params - Normalized query parameters
 * @returns Supabase query builder with all filters applied
 */
function buildLibraryQuery(
  supabase: SupabaseClient<Database>,
  userId: string,
  params: ReturnType<typeof normalizeLibraryParams>
) {
  let query = supabase
    .from("user_library_view")
    .select(LIBRARY_LIST_COLUMNS, { count: "exact" })
    .eq("user_id", userId);

  // Filtrowanie po ulubionych w bibliotece
  if (params.favoritesOnly) {
    query = query.eq("library_favorite", true);
  }

  // Sortowanie
  if (params.sortBy === "added") {
    query = query.order("added_at", { ascending: false });
  } else {
    // created - sortowanie po dacie utworzenia kolorowanki
    query = query.order("created_at", { ascending: false });
  }

  return query;
}

/**
 * Gets the current authenticated user ID.
 * Throws error if user is not authenticated.
 *
 * @param supabase - Supabase client instance
 * @returns User ID
 * @throws Error if user is not authenticated
 */
async function getUserId(
  supabase: SupabaseClient<Database>
): Promise<string> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      logger.warn("User not authenticated", {
        error: error?.message,
      });
      throw new Error("Musisz być zalogowany, aby przeglądać bibliotekę.");
    }

    return user.id;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    logger.error("Error checking auth", { error });
    throw new Error("Nie udało się zweryfikować autentykacji.");
  }
}

/**
 * Fetches paginated list of colorings from the user's personal library.
 *
 * Supports filtering by favorites and sorting by date added or created.
 * Requires authentication - only returns colorings for the current user.
 *
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Paginated response with colorings and pagination metadata
 * @throws Error if validation fails, user is not authenticated, or database query fails
 *
 * @example
 * ```typescript
 * const result = await getUserLibrary({
 *   page: 1,
 *   limit: 20,
 *   favoritesOnly: true,
 *   sortBy: "added"
 * });
 * ```
 */
export async function getUserLibrary(
  params: Partial<LibraryQueryParams>
): Promise<PaginatedResponse<LibraryColoringListItem>> {
  // 1. Walidacja i normalizacja parametrów
  const validatedParams = normalizeLibraryParams(params);
  const { page, limit } = validatedParams;

  // 2. Utworzenie klienta Supabase
  const supabase = await createClient();

  // 3. Sprawdzenie autentykacji (wymagane)
  const userId = await getUserId(supabase);

  // 4. Budowa zapytania
  let query = buildLibraryQuery(supabase, userId, validatedParams);

  // 5. Paginacja
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  // 6. Wykonanie zapytania
  const { data: rows, error, count } = await query;

  if (error) {
    logger.error("Failed to fetch library", {
      userId,
      params: validatedParams,
      error: error.message,
    });
    throw new Error("Nie udało się pobrać biblioteki.");
  }

  // 7. Mapowanie wyników do list DTO (bez image_url; obrazy ładowane osobno)
  const data: LibraryColoringListItem[] = (rows ?? []).map((row) =>
    mapLibraryRowToListDTO(row as UserLibraryListRow)
  );

  // 8. Zwrócenie wyniku
  const total = count ?? 0;
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
