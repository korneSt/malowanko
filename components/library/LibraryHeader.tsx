"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LibrarySortOrder } from "@/app/types";

// ============================================================================
// Types
// ============================================================================

interface LibraryHeaderProps {
  /** Whether to show only favorites */
  favoritesOnly: boolean;
  /** Current sort order */
  sortBy: LibrarySortOrder;
  /** Callback when favorites filter is toggled */
  onFavoritesToggle: () => void;
  /** Callback when sort order changes */
  onSortChange: (sortBy: LibrarySortOrder) => void;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const SORT_OPTIONS = [
  { value: "added" as const, label: "Data dodania" },
  { value: "created" as const, label: "Data utworzenia" },
] as const;

// ============================================================================
// Component
// ============================================================================

/**
 * Header component for the library view.
 * Contains title, favorites filter toggle, and sort select.
 */
export function LibraryHeader({
  favoritesOnly,
  sortBy,
  onFavoritesToggle,
  onSortChange,
  className,
}: LibraryHeaderProps) {
  const handleSortChange = (value: string) => {
    // Validate that value is a valid LibrarySortOrder
    if (value === "added" || value === "created") {
      onSortChange(value);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      {/* Title */}
      <h1 className="text-2xl font-bold">Moja biblioteka</h1>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/* Favorites Filter */}
        <Button
          type="button"
          variant={favoritesOnly ? "default" : "outline"}
          size="default"
          onClick={onFavoritesToggle}
          className="w-full sm:w-auto"
          aria-pressed={favoritesOnly}
          aria-label={favoritesOnly ? "Pokaż wszystkie" : "Pokaż tylko ulubione"}
        >
          <Heart
            className={cn(
              "mr-2 size-4",
              favoritesOnly && "fill-current"
            )}
          />
          Tylko ulubione
        </Button>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="library-sort-select"
            className="text-sm text-muted-foreground whitespace-nowrap"
          >
            Sortuj według:
          </label>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger
              id="library-sort-select"
              className="w-full sm:w-[180px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
