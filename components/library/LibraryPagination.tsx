"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ============================================================================
// Types
// ============================================================================

interface LibraryPaginationProps {
  /** Current page number (1-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Pagination component for library view.
 * Displays previous/next buttons and page information.
 * Hides when there's only one page or less.
 */
export function LibraryPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: LibraryPaginationProps) {
  // Hide pagination if there's only one page or less
  if (totalPages <= 1) {
    return null;
  }

  // Validate current page is within bounds
  const safeCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
  const isFirstPage = safeCurrentPage === 1;
  const isLastPage = safeCurrentPage === totalPages;

  const handlePrevious = () => {
    if (!isFirstPage) {
      onPageChange(safeCurrentPage - 1);
    }
  };

  const handleNext = () => {
    if (!isLastPage) {
      onPageChange(safeCurrentPage + 1);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        "sm:justify-center",
        className
      )}
      role="navigation"
      aria-label="Paginacja"
    >
      {/* Previous Button */}
      <Button
        type="button"
        variant="outline"
        size="default"
        onClick={handlePrevious}
        disabled={isFirstPage}
        aria-label="Poprzednia strona"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Poprzednia</span>
      </Button>

      {/* Page Info */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Strona <span className="font-medium text-foreground">{safeCurrentPage}</span> z{" "}
          <span className="font-medium text-foreground">{totalPages}</span>
        </span>
      </div>

      {/* Next Button */}
      <Button
        type="button"
        variant="outline"
        size="default"
        onClick={handleNext}
        disabled={isLastPage}
        aria-label="Następna strona"
      >
        <span className="hidden sm:inline">Następna</span>
        <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
