"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import type { GalleryColoringDTO, GalleryColoringListItem } from "@/app/types";
import type { PaginatedResponse } from "@/app/types";
import { ColoringCard } from "@/components/colorings";
import { ColoringPreviewModal } from "@/components/colorings/ColoringPreviewModal";
import { PrintModal } from "@/components/colorings/PrintModal";
import { LibraryPagination } from "@/components/library/LibraryPagination";
import { toggleGlobalFavorite } from "@/src/lib/actions/favorites";

interface GalleryViewProps {
  /** Initial gallery data from server (list items without image_url; images load on demand) */
  initialData: PaginatedResponse<GalleryColoringListItem>;
}

/**
 * Builds gallery URL with given page, preserving current search/filter params.
 */
function buildGalleryUrl(searchParams: URLSearchParams, page: number): string {
  const params = new URLSearchParams(searchParams);
  params.set("page", String(page));
  const query = params.toString();
  return query ? `/galeria?${query}` : `/galeria?page=${page}`;
}

/**
 * Client component for the public gallery.
 * Renders the grid with click-to-preview, print, and pagination (URL-based).
 */
export function GalleryView({ initialData }: GalleryViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedColoring, setSelectedColoring] =
    useState<GalleryColoringDTO | GalleryColoringListItem | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCardClick = useCallback(
    (coloring: GalleryColoringDTO | GalleryColoringListItem) => {
      setSelectedColoring(coloring);
      setIsPreviewModalOpen(true);
    },
    []
  );

  const handleClosePreview = useCallback(() => {
    setIsPreviewModalOpen(false);
    setSelectedColoring(null);
  }, []);

  const handlePrint = useCallback(() => {
    setIsPrintModalOpen(true);
  }, []);

  const handleClosePrint = useCallback(() => {
    setIsPrintModalOpen(false);
  }, []);

  const handleToggleGlobalFavorite = useCallback(async () => {
    if (!selectedColoring) return;

    setIsLoading(true);
    try {
      const result = await toggleGlobalFavorite(selectedColoring.id);
      if (result.success) {
        toast.success(
          result.data.isFavorite ? "Dodano do ulubionych" : "Usunięto z ulubionych"
        );
        router.refresh();
      } else {
        toast.error(result.error.message);
      }
    } catch {
      toast.error("Nie udało się zaktualizować ulubionych");
    } finally {
      setIsLoading(false);
    }
  }, [selectedColoring, router]);

  const handlePageChange = useCallback(
    (page: number) => {
      router.push(buildGalleryUrl(searchParams, page));
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-6">
      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Znaleziono {initialData.pagination.total} kolorowanek
        {initialData.pagination.totalPages > 1 &&
          ` (strona ${initialData.pagination.page} z ${initialData.pagination.totalPages})`}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {initialData.data.map((coloring) => (
          <ColoringCard
            key={coloring.id}
            coloring={coloring}
            variant="gallery"
            animate
            onClick={handleCardClick}
          />
        ))}
      </div>

      {/* Pagination */}
      <LibraryPagination
        currentPage={initialData.pagination.page}
        totalPages={initialData.pagination.totalPages}
        onPageChange={handlePageChange}
      />

      {/* Preview Modal (same as library: preview then print) */}
      {selectedColoring && (
        <ColoringPreviewModal
          coloring={selectedColoring}
          isOpen={isPreviewModalOpen}
          onClose={handleClosePreview}
          onPrint={handlePrint}
          onToggleGlobalFavorite={handleToggleGlobalFavorite}
        />
      )}

      {/* Print Modal */}
      {selectedColoring && (
        <PrintModal
          coloring={selectedColoring}
          isOpen={isPrintModalOpen}
          onClose={handleClosePrint}
        />
      )}
    </div>
  );
}
