"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import type {
  LibraryColoringDTO,
  LibraryQueryParams,
  PaginatedResponse,
  LibrarySortOrder,
} from "@/app/types";
import { LibraryHeader } from "./LibraryHeader";
import { LibraryGrid } from "./LibraryGrid";
import { LibraryPagination } from "./LibraryPagination";
import { ColoringPreviewModal } from "@/components/colorings/ColoringPreviewModal";
import { PrintModal } from "@/components/colorings/PrintModal";
import { DeleteConfirmDialog } from "@/components/colorings/DeleteConfirmDialog";
import { removeFromLibrary, toggleLibraryFavorite } from "@/src/lib/actions/library";
import { toggleGlobalFavorite } from "@/src/lib/actions/favorites";

// ============================================================================
// Types
// ============================================================================

interface LibraryViewProps {
  /** Initial data from server */
  initialData: PaginatedResponse<LibraryColoringDTO>;
  /** Initial query parameters */
  initialParams: LibraryQueryParams;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Main client component for the library view.
 * Manages state, URL synchronization, and user interactions.
 */
export function LibraryView({
  initialData,
  initialParams,
}: LibraryViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state for modals and selected coloring
  const [selectedColoring, setSelectedColoring] =
    useState<LibraryColoringDTO | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Local state for optimistic updates
  const [colorings, setColorings] = useState<LibraryColoringDTO[]>(
    initialData.data
  );
  const [pagination, setPagination] = useState(initialData.pagination);

  // Sync with initial data when it changes (e.g., after navigation)
  useEffect(() => {
    setColorings(initialData.data);
    setPagination(initialData.pagination);
  }, [initialData]);

  // Update URL search params
  const updateSearchParams = useCallback(
    (updates: Partial<LibraryQueryParams>) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.page !== undefined) {
        if (updates.page === 1) {
          params.delete("page");
        } else {
          params.set("page", updates.page.toString());
        }
      }

      if (updates.favoritesOnly !== undefined) {
        if (updates.favoritesOnly) {
          params.set("favoritesOnly", "true");
        } else {
          params.delete("favoritesOnly");
        }
      }

      if (updates.sortBy !== undefined) {
        if (updates.sortBy === "added") {
          params.delete("sortBy");
        } else {
          params.set("sortBy", updates.sortBy);
        }
      }

      if (updates.limit !== undefined && updates.limit !== 20) {
        params.set("limit", updates.limit.toString());
      }

      router.push(`/biblioteka?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Handlers for filters and sorting
  const handleFavoritesToggle = useCallback(() => {
    const currentFavoritesOnly =
      searchParams.get("favoritesOnly") === "true" || initialParams.favoritesOnly;
    updateSearchParams({
      favoritesOnly: !currentFavoritesOnly,
      page: 1, // Reset to first page
    });
  }, [searchParams, initialParams.favoritesOnly, updateSearchParams]);

  const handleSortChange = useCallback(
    (sortBy: LibrarySortOrder) => {
      updateSearchParams({
        sortBy,
        page: 1, // Reset to first page
      });
    },
    [updateSearchParams]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      updateSearchParams({ page });
    },
    [updateSearchParams]
  );

  // Handlers for card interactions
  const handleCardClick = useCallback((coloring: LibraryColoringDTO) => {
    setSelectedColoring(coloring);
    setIsPreviewModalOpen(true);
  }, []);

  // Handlers for modal actions
  const handlePrint = useCallback(() => {
    setIsPrintModalOpen(true);
  }, []);

  const handleToggleLibraryFavorite = useCallback(async () => {
    if (!selectedColoring) return;

    setIsLoading(true);

    // Optimistic update
    const previousColorings = [...colorings];
    setColorings((prev) =>
      prev.map((c) =>
        c.id === selectedColoring.id
          ? { ...c, isLibraryFavorite: !c.isLibraryFavorite }
          : c
      )
    );

    try {
      const result = await toggleLibraryFavorite(selectedColoring.id);

      if (result.success) {
        // Update selected coloring
        setSelectedColoring((prev) =>
          prev
            ? {
                ...prev,
                isLibraryFavorite: result.data.isFavorite,
              }
            : null
        );

        toast.success(
          result.data.isFavorite
            ? "Dodano do ulubionych"
            : "Usunięto z ulubionych"
        );
      } else {
        // Revert optimistic update
        setColorings(previousColorings);
        toast.error(result.error.message);
      }
    } catch (error) {
      // Revert optimistic update
      setColorings(previousColorings);
      toast.error("Nie udało się zaktualizować ulubionych");
    } finally {
      setIsLoading(false);
    }
  }, [selectedColoring, colorings]);

  const handleToggleGlobalFavorite = useCallback(async () => {
    if (!selectedColoring) return;

    setIsLoading(true);

    // Optimistic update
    const previousColorings = [...colorings];
    setColorings((prev) =>
      prev.map((c) =>
        c.id === selectedColoring.id
          ? {
              ...c,
              isGlobalFavorite: !c.isGlobalFavorite,
              favoritesCount: c.isGlobalFavorite
                ? Math.max(0, c.favoritesCount - 1)
                : c.favoritesCount + 1,
            }
          : c
      )
    );

    try {
      const result = await toggleGlobalFavorite(selectedColoring.id);

      if (result.success) {
        // Apply authoritative data from server
        setColorings((prev) =>
          prev.map((c) =>
            c.id === selectedColoring.id
              ? {
                  ...c,
                  isGlobalFavorite: result.data.isFavorite,
                  favoritesCount: result.data.favoritesCount,
                }
              : c
          )
        );

        setSelectedColoring((prev) =>
          prev
            ? {
                ...prev,
                isGlobalFavorite: result.data.isFavorite,
                favoritesCount: result.data.favoritesCount,
              }
            : null
        );

        toast.success(
          result.data.isFavorite
            ? "Dodano do ulubionych"
            : "Usunięto z ulubionych"
        );
      } else {
        // Revert optimistic update
        setColorings(previousColorings);
        toast.error(result.error.message);
      }
    } catch (error) {
      // Revert optimistic update
      setColorings(previousColorings);
      toast.error("Nie udało się zaktualizować ulubionych");
    } finally {
      setIsLoading(false);
    }
  }, [selectedColoring, colorings]);

  const handleDelete = useCallback(() => {
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedColoring) return;

    setIsLoading(true);
    setIsDeleteDialogOpen(false);

    try {
      const result = await removeFromLibrary(selectedColoring.id);

      if (result.success) {
        toast.success("Usunięto kolorowankę z biblioteki");

        // Close modals
        setIsPreviewModalOpen(false);
        setSelectedColoring(null);

        // Refresh page to get updated data
        router.refresh();
      } else {
        toast.error(result.error.message);
      }
    } catch (error) {
      toast.error("Nie udało się usunąć kolorowanki");
    } finally {
      setIsLoading(false);
    }
  }, [selectedColoring, router]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteDialogOpen(false);
  }, []);

  const handleClosePreview = useCallback(() => {
    setIsPreviewModalOpen(false);
    setSelectedColoring(null);
  }, []);

  const handleClosePrint = useCallback(() => {
    setIsPrintModalOpen(false);
  }, []);

  // Get current filter values from URL or initial params
  const favoritesOnly =
    searchParams.get("favoritesOnly") === "true" ||
    initialParams.favoritesOnly ||
    false;
  const sortBy =
    (searchParams.get("sortBy") as LibrarySortOrder) ||
    initialParams.sortBy ||
    "added";

  return (
    <div className="space-y-6">
      {/* Header */}
      <LibraryHeader
        favoritesOnly={favoritesOnly}
        sortBy={sortBy}
        onFavoritesToggle={handleFavoritesToggle}
        onSortChange={handleSortChange}
      />

      {/* Grid */}
      <LibraryGrid
        colorings={colorings}
        onCardClick={handleCardClick}
        isLoading={isLoading}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <LibraryPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Preview Modal */}
      {selectedColoring && (
        <ColoringPreviewModal
          coloring={selectedColoring}
          isOpen={isPreviewModalOpen}
          onClose={handleClosePreview}
          onPrint={handlePrint}
          onToggleLibraryFavorite={handleToggleLibraryFavorite}
          onToggleGlobalFavorite={handleToggleGlobalFavorite}
          onDelete={handleDelete}
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

      {/* Delete Confirm Dialog */}
      {selectedColoring && (
        <DeleteConfirmDialog
          coloring={selectedColoring}
          isOpen={isDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
}
