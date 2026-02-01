"use client";

import { useCallback, useMemo } from "react";
import { Save, Printer, RefreshCw, CheckSquare, Square } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ColoringCard } from "@/components/colorings/ColoringCard";
import type { ColoringDTO } from "@/app/types";

// ============================================================================
// Types
// ============================================================================

interface GeneratedGridProps {
  /** Array of generated colorings to display */
  colorings: ColoringDTO[];
  /** Set of selected coloring IDs */
  selectedIds: Set<string>;
  /** Callback when selection changes */
  onSelectionChange: (ids: Set<string>) => void;
  /** Callback when "Save selected" is clicked */
  onSaveSelected?: () => void;
  /** Callback when "Save all" is clicked */
  onSaveAll?: () => void;
  /** Callback when "Print selected" is clicked */
  onPrintSelected?: () => void;
  /** Callback when preview is requested for a coloring (card expand icon) */
  onPreviewClick?: (coloring: ColoringDTO) => void;
  /** Callback when "Generate again" is clicked */
  onGenerateAgain?: () => void;
  /** Whether any action is in progress */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function GeneratedGrid({
  colorings,
  selectedIds,
  onSelectionChange,
  onSaveSelected,
  onSaveAll,
  onPrintSelected,
  onPreviewClick,
  onGenerateAgain,
  isLoading = false,
  className,
}: GeneratedGridProps) {
  // Derived state
  const allSelected = useMemo(
    () =>
      colorings.length > 0 &&
      colorings.every((c) => selectedIds.has(c.id)),
    [colorings, selectedIds]
  );

  const noneSelected = selectedIds.size === 0;
  const selectedCount = selectedIds.size;

  // Handlers
  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(colorings.map((c) => c.id)));
    }
  }, [allSelected, colorings, onSelectionChange]);

  const handleToggleSelection = useCallback(
    (coloringId: string, selected: boolean) => {
      const newSelection = new Set(selectedIds);
      if (selected) {
        newSelection.add(coloringId);
      } else {
        newSelection.delete(coloringId);
      }
      onSelectionChange(newSelection);
    },
    [selectedIds, onSelectionChange]
  );

  if (colorings.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
        {/* Selection Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={isLoading}
            className="gap-2"
          >
            {allSelected ? (
              <>
                <Square className="size-4" aria-hidden="true" />
                Odznacz wszystkie
              </>
            ) : (
              <>
                <CheckSquare className="size-4" aria-hidden="true" />
                Zaznacz wszystkie
              </>
            )}
          </Button>

          {selectedCount > 0 && (
            <span className="text-sm text-muted-foreground">
              Wybrano: <strong>{selectedCount}</strong>
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Save Selected */}
          {onSaveSelected && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveSelected}
              disabled={isLoading || noneSelected}
              className="gap-2"
            >
              <Save className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Zapisz wybrane</span>
              <span className="sm:hidden">Zapisz</span>
              {selectedCount > 0 && (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                  {selectedCount}
                </span>
              )}
            </Button>
          )}

          {/* Save All */}
          {onSaveAll && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveAll}
              disabled={isLoading}
              className="gap-2"
            >
              <Save className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Zapisz wszystkie</span>
              <span className="sm:hidden">Wszystkie</span>
            </Button>
          )}

          {/* Print Selected */}
          {onPrintSelected && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPrintSelected}
              disabled={isLoading || noneSelected}
              className="gap-2"
            >
              <Printer className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Drukuj wybrane</span>
              <span className="sm:hidden">Drukuj</span>
            </Button>
          )}

          {/* Generate Again */}
          {onGenerateAgain && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onGenerateAgain}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Generuj ponownie</span>
              <span className="sm:hidden">Ponów</span>
            </Button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        role="group"
        aria-label="Wygenerowane kolorowanki"
      >
        {colorings.map((coloring, index) => (
          <ColoringCard
            key={coloring.id}
            coloring={coloring}
            variant="generated"
            isSelected={selectedIds.has(coloring.id)}
            onSelect={(selected) => handleToggleSelection(coloring.id, selected)}
            onClick={
              onPreviewClick
                ? (coloring) => onPreviewClick(coloring as ColoringDTO)
                : undefined
            }
            animate
            className={cn({
              // Stagger animation delay based on index
              "animation-delay-100": index === 1,
              "animation-delay-200": index === 2,
              "animation-delay-300": index === 3,
              "animation-delay-400": index === 4,
            })}
          />
        ))}
      </div>
    </div>
  );
}

