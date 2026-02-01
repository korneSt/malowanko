"use client";

import { cn } from "@/lib/utils";
import { ColoringCard } from "@/components/colorings/ColoringCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { LibraryColoringListItem } from "@/app/types";

// ============================================================================
// Types
// ============================================================================

interface LibraryGridProps {
  /** Array of colorings to display (list items without image_url; images load on demand) */
  colorings: LibraryColoringListItem[];
  /** Callback when a card is clicked */
  onCardClick: (coloring: LibraryColoringListItem) => void;
  /** Whether the grid is in loading state */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Responsive grid component for displaying library colorings.
 * Shows loading skeleton or empty state when appropriate.
 */
export function LibraryGrid({
  colorings,
  onCardClick,
  isLoading = false,
  className,
}: LibraryGridProps) {
  // Show loading spinner
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <LoadingSpinner size="lg" text="Ładowanie kolorowanek..." />
      </div>
    );
  }

  // Show empty state
  if (colorings.length === 0) {
    return (
      <div className={cn("py-8", className)}>
        <EmptyState variant="library" />
      </div>
    );
  }

  // Show grid with colorings
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4",
        "sm:grid-cols-2",
        "lg:grid-cols-3",
        "xl:grid-cols-4",
        className
      )}
    >
      {colorings.map((coloring) => (
        <ColoringCard
          key={coloring.id}
          coloring={coloring}
          variant="library"
          onClick={(c) => onCardClick(c as LibraryColoringListItem)}
        />
      ))}
    </div>
  );
}
