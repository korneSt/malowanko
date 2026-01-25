import type { Metadata } from "next";
import { Suspense } from "react";
import { BookOpen } from "lucide-react";

import { getUserLibrary } from "@/src/lib/queries/library";
import type { LibraryQueryParams, LibrarySortOrder } from "@/app/types";
import { LibraryView } from "@/components/library";
import { LoadingSpinner } from "@/components/shared";
import { logger } from "@/src/lib/utils/logger";

export const metadata: Metadata = {
  title: "Moja biblioteka - Malowanko",
  description: "Twoja kolekcja kolorowanek - wygenerowane i ulubione",
};

interface BibliotekaPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    favoritesOnly?: string;
    sortBy?: LibrarySortOrder;
  }>;
}

async function BibliotekaContent({ searchParams }: BibliotekaPageProps) {
  const params = await searchParams;

  // Parse and normalize query parameters
  const page = params.page ? parseInt(params.page, 10) : 1;
  const limit = params.limit ? parseInt(params.limit, 10) : 20;
  const favoritesOnly = params.favoritesOnly === "true";
  const sortBy: LibrarySortOrder = params.sortBy || "added";

  const queryParams: LibraryQueryParams = {
    page: Number.isNaN(page) || page < 1 ? 1 : page,
    limit:
      Number.isNaN(limit) || limit < 1 || limit > 50 ? 20 : limit,
    favoritesOnly,
    sortBy,
  };

  let result;
  let hasError = false;
  try {
    result = await getUserLibrary(queryParams);
  } catch (error) {
    logger.error("Failed to load library", { error });
    hasError = true;
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="mb-2 text-lg font-semibold">
          Błąd ładowania biblioteki
        </h2>
        <p className="max-w-md text-muted-foreground">
          Nie udało się pobrać Twojej biblioteki. Spróbuj ponownie
          później.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-accent/30">
          <BookOpen className="size-5 text-accent-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Moja biblioteka</h1>
          <p className="text-sm text-muted-foreground">
            Twoja kolekcja zapisanych kolorowanek.
          </p>
        </div>
      </div>

      <LibraryView
        initialData={result ?? { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } }}
        initialParams={queryParams}
      />
    </div>
  );
}

export default async function BibliotekaPage({
  searchParams,
}: BibliotekaPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        }
      >
        <BibliotekaContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

