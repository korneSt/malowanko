import type { Metadata } from "next";
import { Suspense } from "react";
import { getPublicGallery } from "@/src/lib/queries/gallery";
import { ColoringCard } from "@/components/colorings";
import { EmptyState } from "@/components/shared";
import { LoadingSpinner } from "@/components/shared";
import { logger } from "@/src/lib/utils/logger";

export const metadata: Metadata = {
  title: "Galeria - Malowanko",
  description: "Przeglądaj kolorowanki stworzone przez społeczność Malowanko",
};

interface GaleriaPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    ageGroups?: string;
    styles?: string;
    sortBy?: "newest" | "popular";
  }>;
}

async function GalleryContent({ searchParams }: GaleriaPageProps) {
  const params = await searchParams;

  // Parse query parameters
  const page = params.page ? parseInt(params.page, 10) : 1;
  const limit = params.limit ? parseInt(params.limit, 10) : 20;
  const search = params.search;
  const ageGroups = params.ageGroups
    ? (params.ageGroups.split(",") as Array<"0-3" | "4-8" | "9-12">)
    : undefined;
  const styles = params.styles
    ? (params.styles.split(",") as Array<
        "prosty" | "klasyczny" | "szczegolowy" | "mandala"
      >)
    : undefined;
  const sortBy = params.sortBy || "newest";

  try {
    const result = await getPublicGallery({
      page,
      limit,
      search,
      ageGroups,
      styles,
      sortBy,
    });

    if (result.data.length === 0) {
      return (
        <EmptyState
          variant="search"
          searchQuery={search}
        />
      );
    }

    return (
      <div className="space-y-6">
        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Znaleziono {result.pagination.total} kolorowanek
          {result.pagination.totalPages > 1 &&
            ` (strona ${result.pagination.page} z ${result.pagination.totalPages})`}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {result.data.map((coloring) => (
            <ColoringCard
              key={coloring.id}
              coloring={coloring}
              variant="gallery"
              animate
            />
          ))}
        </div>

        {/* Pagination info */}
        {result.pagination.totalPages > 1 && (
          <div className="text-center text-sm text-muted-foreground">
            Strona {result.pagination.page} z {result.pagination.totalPages}
          </div>
        )}
      </div>
    );
  } catch (error) {
    logger.error("Failed to load gallery", { error });
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="mb-2 text-lg font-semibold">Błąd ładowania galerii</h2>
        <p className="max-w-md text-muted-foreground">
          Nie udało się pobrać kolorowanek. Spróbuj ponownie później.
        </p>
      </div>
    );
  }
}

export default async function GaleriaPage({ searchParams }: GaleriaPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Galeria</h1>
        <p className="text-muted-foreground">
          Przeglądaj kolorowanki stworzone przez społeczność. Dodawaj do
          ulubionych i inspiruj się!
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        }
      >
        <GalleryContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

