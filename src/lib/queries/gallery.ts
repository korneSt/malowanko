/**
 * Gallery Query Functions
 *
 * Functions for querying the public gallery of colorings.
 * Designed to be used in Server Components.
 *
 * @module queries/gallery
 */

import { createClient } from "@/app/db/server";
import type {
  GalleryQueryParams,
  GalleryColoringDTO,
  GalleryColoringListItem,
  PaginatedResponse,
  AgeGroup,
  ColoringStyle,
} from "@/app/types";
import type { Database } from "@/app/db/database.types";
import { logger } from "@/src/lib/utils/logger";
import {
  galleryQueryParamsSchema,
  coloringIdSchema,
  formatZodError,
} from "@/src/lib/validations/gallery";
import type { SupabaseClient } from "@supabase/supabase-js";

type ColoringRow = Database["public"]["Tables"]["colorings"]["Row"];

/** Row shape when selecting gallery list without image_url (avoids loading base64). */
type ColoringListRow = Omit<ColoringRow, "image_url">;

/**
 * Normalizes and validates gallery query parameters.
 * Applies default values and validates all constraints.
 *
 * @param params - Raw query parameters from user input
 * @returns Validated and normalized parameters
 * @throws Error if validation fails
 */
function normalizeGalleryParams(
  params: Partial<GalleryQueryParams>
): Required<Omit<GalleryQueryParams, "search" | "ageGroups" | "styles">> &
  Pick<GalleryQueryParams, "search" | "ageGroups" | "styles"> {
  const result = galleryQueryParamsSchema.safeParse(params);

  if (!result.success) {
    const errorMessage = formatZodError(result.error);
    logger.error("Gallery query params validation failed", {
      params,
      errors: result.error.issues,
    });
    throw new Error(errorMessage);
  }

  return result.data;
}

/** Columns selected for gallery list (excludes image_url to avoid loading base64). */
const GALLERY_LIST_COLUMNS =
  "id, prompt, tags, age_group, style, created_at, favorites_count, user_id" as const;

/**
 * Maps a gallery list row (no image_url) to GalleryColoringListItem.
 *
 * @param coloring - Database row without image_url
 * @param isFavorited - Whether the coloring is favorited by current user
 * @returns GalleryColoringListItem (imageUrl omitted, loaded separately)
 */
function mapColoringToListDTO(
  coloring: ColoringListRow,
  isFavorited?: boolean
): GalleryColoringListItem {
  return {
    id: coloring.id,
    prompt: coloring.prompt,
    tags: coloring.tags,
    ageGroup: coloring.age_group as AgeGroup,
    style: coloring.style as ColoringStyle,
    createdAt: coloring.created_at,
    favoritesCount: coloring.favorites_count,
    ...(isFavorited !== undefined && { isFavorited }),
  };
}

/**
 * Maps a full database coloring row to GalleryColoringDTO (includes imageUrl).
 *
 * @param coloring - Database row from colorings table
 * @param isFavorited - Whether the coloring is favorited by current user
 * @returns GalleryColoringDTO with transformed fields
 */
function mapColoringToDTO(
  coloring: ColoringRow,
  isFavorited?: boolean
): GalleryColoringDTO {
  return {
    id: coloring.id,
    imageUrl: coloring.image_url,
    prompt: coloring.prompt,
    tags: coloring.tags,
    ageGroup: coloring.age_group as AgeGroup,
    style: coloring.style as ColoringStyle,
    createdAt: coloring.created_at,
    favoritesCount: coloring.favorites_count,
    ...(isFavorited !== undefined && { isFavorited }),
  };
}

/**
 * Builds a Supabase query for gallery listings with filters, search, and sorting.
 *
 * @param supabase - Supabase client instance
 * @param params - Normalized query parameters
 * @returns Supabase query builder with all filters applied
 */
function buildGalleryQuery(
  supabase: SupabaseClient<Database>,
  params: ReturnType<typeof normalizeGalleryParams>
) {
  let query = supabase
    .from("colorings")
    .select(GALLERY_LIST_COLUMNS, { count: "exact" });

  // Filtrowanie po grupach wiekowych
  if (params.ageGroups && params.ageGroups.length > 0) {
    query = query.in("age_group", params.ageGroups);
  }

  // Filtrowanie po stylach
  if (params.styles && params.styles.length > 0) {
    query = query.in("style", params.styles);
  }

  // Wyszukiwanie w promptach i tagach
  if (params.search) {
    // Wyszukiwanie w promptach (case-insensitive) i tagach (array contains)
    query = query.or(
      `prompt.ilike.%${params.search}%,tags.cs.{${params.search}}`
    );
  }

  // Sortowanie
  if (params.sortBy === "newest") {
    query = query.order("created_at", { ascending: false });
  } else {
    // popular - sortowanie po liczbie ulubionych
    query = query.order("favorites_count", { ascending: false });
  }

  return query;
}

/**
 * Fetches user's favorite coloring IDs.
 * Returns empty set if user is not authenticated or on error.
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID (null for anonymous users)
 * @returns Set of favorite coloring IDs
 */
async function getFavoriteIds(
  supabase: SupabaseClient<Database>,
  userId: string | null
): Promise<Set<string>> {
  if (!userId) {
    return new Set<string>();
  }

  try {
    const { data: favorites, error } = await supabase
      .from("favorites")
      .select("coloring_id")
      .eq("user_id", userId);

    if (error) {
      logger.warn("Failed to fetch favorites, continuing without favorites", {
        userId,
        error: error.message,
      });
      return new Set<string>();
    }

    return new Set(favorites?.map((f) => f.coloring_id) ?? []);
  } catch (error) {
    logger.warn("Error fetching favorites, continuing without favorites", {
      userId,
      error,
    });
    return new Set<string>();
  }
}

/**
 * Gets the current authenticated user ID.
 * Returns null if user is not authenticated or on error.
 *
 * @param supabase - Supabase client instance
 * @returns User ID or null
 */
async function getUserId(
  supabase: SupabaseClient<Database>
): Promise<string | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      logger.warn("Auth check failed, continuing without favorites", {
        error: error.message,
      });
      return null;
    }

    return user?.id ?? null;
  } catch (error) {
    logger.warn("Error checking auth, continuing without favorites", { error });
    return null;
  }
}

/**
 * Fetches paginated list of colorings from the public gallery.
 *
 * Supports filtering by age groups and styles, searching in prompts and tags,
 * and sorting by newest or popularity. For authenticated users, also includes
 * favorite status for each coloring.
 *
 * @param params - Query parameters for filtering, searching, and pagination
 * @returns Paginated response with colorings and pagination metadata
 * @throws Error if validation fails or database query fails
 *
 * @example
 * ```typescript
 * const result = await getPublicGallery({
 *   page: 1,
 *   limit: 20,
 *   search: "kot",
 *   ageGroups: ["4-8"],
 *   styles: ["klasyczny"],
 *   sortBy: "popular"
 * });
 * ```
 */
export async function getPublicGallery(
  params: Partial<GalleryQueryParams>
): Promise<PaginatedResponse<GalleryColoringListItem>> {
  // 1. Walidacja i normalizacja parametrów
  const validatedParams = normalizeGalleryParams(params);
  const { page, limit } = validatedParams;

  // 2. Utworzenie klienta Supabase
  const supabase = await createClient();

  // 3. Sprawdzenie autentykacji (opcjonalne)
  const userId = await getUserId(supabase);

  // 4. Budowa zapytania
  let query = buildGalleryQuery(supabase, validatedParams);

  // 5. Paginacja
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  // 6. Wykonanie zapytania
  const { data: colorings, error, count } = await query;

  if (error) {
    logger.error("Failed to fetch gallery", {
      params: validatedParams,
      error: error.message,
    });
    throw new Error("Nie udało się pobrać kolorowanek z galerii.");
  }

  // 7. Pobranie ulubionych (dla zalogowanych użytkowników)
  const favoriteIds = await getFavoriteIds(supabase, userId);

  // 8. Mapowanie wyników do list DTO (bez image_url; obrazy ładowane osobno)
  const data: GalleryColoringListItem[] = (colorings ?? []).map((coloring) =>
    mapColoringToListDTO(
      coloring as ColoringListRow,
      userId ? favoriteIds.has(coloring.id) : undefined
    )
  );

  // 9. Zwrócenie wyniku
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

/**
 * Fetches a single coloring by ID from the public gallery.
 *
 * For authenticated users, also includes favorite status.
 * Returns null if coloring does not exist.
 *
 * @param id - UUID of the coloring
 * @returns Coloring DTO or null if not found
 * @throws Error if ID format is invalid or database query fails
 *
 * @example
 * ```typescript
 * const coloring = await getColoringById("123e4567-e89b-12d3-a456-426614174000");
 * if (coloring) {
 *   console.log(coloring.prompt);
 * }
 * ```
 */
export async function getColoringById(
  id: string
): Promise<GalleryColoringDTO | null> {
  // 1. Walidacja ID
  const validationResult = coloringIdSchema.safeParse(id);
  if (!validationResult.success) {
    const errorMessage = formatZodError(validationResult.error);
    logger.error("Invalid coloring ID format", { id, errors: validationResult.error.issues });
    throw new Error(errorMessage);
  }

  // 2. Utworzenie klienta Supabase
  const supabase = await createClient();

  // 3. Sprawdzenie autentykacji (opcjonalne)
  const userId = await getUserId(supabase);

  // 4. Pobranie kolorowanki
  const { data: coloring, error } = await supabase
    .from("colorings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    // PGRST116 to kod błędu Supabase dla "not found"
    if (error.code === "PGRST116") {
      return null;
    }

    logger.error("Failed to fetch coloring", {
      id,
      error: error.message,
      code: error.code,
    });
    throw new Error("Nie udało się pobrać kolorowanki.");
  }

  if (!coloring) {
    return null;
  }

  // 5. Sprawdzenie ulubionych (dla zalogowanych użytkowników)
  let isFavorited: boolean | undefined = undefined;
  if (userId) {
    const favoriteIds = await getFavoriteIds(supabase, userId);
    isFavorited = favoriteIds.has(coloring.id);
  }

  // 6. Mapowanie do DTO
  return mapColoringToDTO(coloring, isFavorited);
}
