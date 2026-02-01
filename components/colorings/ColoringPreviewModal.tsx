"use client";

import { useState } from "react";
import {
  Heart,
  Printer,
  Trash2,
  Calendar,
  Tag,
  Users,
  Palette,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type {
  ColoringDTO,
  GalleryColoringDTO,
  GalleryColoringListItem,
  LibraryColoringDTO,
  LibraryColoringListItem,
} from "@/app/types";
import { useColoringImage } from "@/hooks/useColoringImage";

// ============================================================================
// Types
// ============================================================================

type PreviewColoring =
  | ColoringDTO
  | LibraryColoringDTO
  | LibraryColoringListItem
  | GalleryColoringDTO
  | GalleryColoringListItem;

function isLibraryColoring(
  c: PreviewColoring
): c is LibraryColoringDTO | LibraryColoringListItem {
  return "addedAt" in c && "isLibraryFavorite" in c;
}

interface ColoringPreviewModalProps {
  /** Coloring data to display (library or gallery) */
  coloring: PreviewColoring;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when print is requested */
  onPrint: () => void;
  /** Callback when library favorite is toggled (library only) */
  onToggleLibraryFavorite?: () => void;
  /** Callback when global favorite is toggled */
  onToggleGlobalFavorite?: () => void;
  /** Callback when delete is requested (library only) */
  onDelete?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const AGE_GROUP_LABELS: Record<string, string> = {
  "0-3": "0-3 lata",
  "4-8": "4-8 lat",
  "9-12": "9-12 lat",
};

const STYLE_LABELS: Record<string, string> = {
  prosty: "Prosty",
  klasyczny: "Klasyczny",
  szczegolowy: "Szczegółowy",
  mandala: "Mandala",
};

// ============================================================================
// Component
// ============================================================================

/**
 * Modal component for previewing a coloring with full details and actions.
 * Uses centered Dialog modal.
 */
export function ColoringPreviewModal({
  coloring,
  isOpen,
  onClose,
  onPrint,
  onToggleLibraryFavorite,
  onToggleGlobalFavorite,
  onDelete,
}: ColoringPreviewModalProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const needLazyImage = coloring.imageUrl == null && isOpen;
  const { imageUrl: lazyImageUrl, isLoading: isLazyLoading } = useColoringImage(
    needLazyImage ? coloring.id : undefined,
    needLazyImage
  );
  const displayImageUrl = coloring.imageUrl ?? lazyImageUrl ?? null;
  const hasImage = displayImageUrl != null;
  const showImageLoading = (!hasImage && needLazyImage && isLazyLoading) || (hasImage && isImageLoading);

  // Format dates
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formattedCreatedAt = formatDate(coloring.createdAt);
  const isLibrary = isLibraryColoring(coloring);
  const formattedAddedAt = isLibrary
    ? formatDate(coloring.addedAt)
    : null;
  const isGlobalFavorite = isLibrary
    ? coloring.isGlobalFavorite
    : ("isFavorited" in coloring ? coloring.isFavorited : false) ?? false;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "max-w-4xl max-h-[85vh] overflow-hidden p-0 flex flex-col"
        )}
      >
        <div className="flex h-full flex-col overflow-hidden">
          {/* Header */}
          <DialogHeader className="border-b p-4 sm:p-6 shrink-0">
            <DialogTitle className="line-clamp-2 text-left">
              {coloring.prompt}
            </DialogTitle>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
            {/* Image (uses same useColoringImage cache as card – no refetch when opening from loaded card) */}
            <div className="relative mb-6 aspect-square w-full overflow-hidden rounded-2xl bg-muted">
              {(showImageLoading || !hasImage) && (
                <div className="absolute inset-0 animate-pulse bg-muted" />
              )}
              {hasImage ? (
                <img
                  src={displayImageUrl}
                  alt={coloring.prompt}
                  className={cn(
                    "w-full object-contain transition-opacity duration-300",
                    isImageLoading ? "opacity-0" : "opacity-100"
                  )}
                  onLoad={() => setIsImageLoading(false)}
                />
              ) : needLazyImage ? (
                <div className="flex absolute inset-0 items-center justify-center text-sm text-muted-foreground">
                  Ładowanie…
                </div>
              ) : null}
            </div>

            {/* Metadata */}
            <div className="space-y-4">
              {/* Tags */}
              {coloring.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {coloring.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="gap-1 text-xs"
                    >
                      <Tag className="size-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Details Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Created Date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="size-4 shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">
                      Data utworzenia
                    </div>
                    <div>{formattedCreatedAt}</div>
                  </div>
                </div>

                {/* Added Date (library only) */}
                {isLibrary && formattedAddedAt != null && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="size-4 shrink-0" />
                    <div>
                      <div className="font-medium text-foreground">
                        Data dodania
                      </div>
                      <div>{formattedAddedAt}</div>
                    </div>
                  </div>
                )}

                {/* Age Group */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="size-4 shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">
                      Grupa wiekowa
                    </div>
                    <div>{AGE_GROUP_LABELS[coloring.ageGroup]}</div>
                  </div>
                </div>

                {/* Style */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Palette className="size-4 shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">Styl</div>
                    <div>{STYLE_LABELS[coloring.style]}</div>
                  </div>
                </div>
              </div>

              {/* Favorite Status */}
              <div className="flex flex-wrap gap-4 rounded-lg border bg-muted/30 p-4">
                {isLibrary && (
                  <div className="flex items-center gap-2">
                    <Heart
                      className={cn(
                        "size-4",
                        coloring.isLibraryFavorite
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                    <span className="text-sm">
                      {coloring.isLibraryFavorite
                        ? "Ulubione w bibliotece"
                        : "Nie w ulubionych (biblioteka)"}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Heart
                    className={cn(
                      "size-4",
                      isGlobalFavorite
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                  <span className="text-sm">
                    {isGlobalFavorite
                      ? "Ulubione globalnie"
                      : "Nie w ulubionych (globalne)"}
                  </span>
                  {coloring.favoritesCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({coloring.favoritesCount} polubień)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Actions */}
          <DialogFooter className="border-t p-4 sm:p-6 shrink-0">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
              {/* Print Button */}
              <Button
                type="button"
                variant="outline"
                onClick={onPrint}
                className="gap-2"
              >
                <Printer className="size-4" />
                Drukuj
              </Button>

              {/* Library Favorite Toggle (library only) */}
              {onToggleLibraryFavorite && isLibrary && (
                <Button
                  type="button"
                  variant={coloring.isLibraryFavorite ? "default" : "outline"}
                  onClick={onToggleLibraryFavorite}
                  className="gap-2"
                >
                  <Heart
                    className={cn(
                      "size-4",
                      coloring.isLibraryFavorite && "fill-current"
                    )}
                  />
                  {coloring.isLibraryFavorite
                    ? "Usuń z ulubionych (biblioteka)"
                    : "Dodaj do ulubionych (biblioteka)"}
                </Button>
              )}

              {/* Global Favorite Toggle */}
              {onToggleGlobalFavorite != null && (
                <Button
                  type="button"
                  variant={isGlobalFavorite ? "default" : "outline"}
                  onClick={onToggleGlobalFavorite}
                  className="gap-2"
                >
                  <Heart
                    className={cn(
                      "size-4",
                      isGlobalFavorite && "fill-current"
                    )}
                  />
                  {isGlobalFavorite
                    ? "Usuń z ulubionych (globalne)"
                    : "Dodaj do ulubionych (globalne)"}
                </Button>
              )}

              {/* Delete Button (library only) */}
              {onDelete != null && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  className="gap-2"
                >
                  <Trash2 className="size-4" />
                  Usuń
                </Button>
              )}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
