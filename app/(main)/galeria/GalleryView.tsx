"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { GalleryColoringDTO } from "@/app/types";
import type { PaginatedResponse } from "@/app/types";
import { ColoringCard } from "@/components/colorings";
import { ColoringPreviewModal } from "@/components/colorings/ColoringPreviewModal";
import { PrintModal } from "@/components/colorings/PrintModal";
import { toggleGlobalFavorite } from "@/src/lib/actions/favorites";

interface GalleryViewProps {
  /** Initial gallery data from server */
  initialData: PaginatedResponse<GalleryColoringDTO>;
}

/**
 * Client component for the public gallery.
 * Renders the grid with click-to-preview and print (same flow as library).
 */
export function GalleryView({ initialData }: GalleryViewProps) {
  const router = useRouter();
  const [selectedColoring, setSelectedColoring] =
    useState<GalleryColoringDTO | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCardClick = useCallback((coloring: GalleryColoringDTO) => {
    setSelectedColoring(coloring);
    setIsPreviewModalOpen(true);
  }, []);

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
            onClick={() => handleCardClick(coloring)}
          />
        ))}
      </div>

      {/* Pagination info */}
      {initialData.pagination.totalPages > 1 && (
        <div className="text-center text-sm text-muted-foreground">
          Strona {initialData.pagination.page} z{" "}
          {initialData.pagination.totalPages}
        </div>
      )}

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
