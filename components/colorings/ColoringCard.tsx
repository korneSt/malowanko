"use client";

import Image from "next/image";
import { Heart, Check, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type {
  ColoringDTO,
  LibraryColoringDTO,
  GalleryColoringListItem,
} from "@/app/types";
import { useInView } from "@/hooks/useInView";
import { useColoringImage } from "@/hooks/useColoringImage";

type ColoringCardColoring =
  | ColoringDTO
  | LibraryColoringDTO
  | GalleryColoringListItem;

interface ColoringCardProps {
  coloring: ColoringCardColoring;
  variant: "gallery" | "library" | "generated";
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  /** Called when card is clicked (gallery/library). Receives the coloring. */
  onClick?: (coloring: ColoringCardColoring) => void;
  animate?: boolean;
  className?: string;
}

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

export function ColoringCard({
  coloring,
  variant,
  isSelected = false,
  onSelect,
  onClick,
  animate = false,
  className,
}: ColoringCardProps) {
  const [inViewRef, inView] = useInView<HTMLElement>({ rootMargin: "200px" });
  const needLazyImage =
    (variant === "gallery" || variant === "library") &&
    coloring.imageUrl === undefined;
  const { imageUrl: lazyImageUrl } = useColoringImage(
      needLazyImage ? coloring.id : undefined,
      needLazyImage && inView
    );
  const displayImageUrl = coloring.imageUrl ?? lazyImageUrl ?? null;

  const handleClick = () => {
    if (variant === "generated" && onSelect) {
      onSelect(!isSelected);
    } else if (onClick) {
      onClick(coloring);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  // Truncate prompt for display
  const truncatedPrompt =
    coloring.prompt.length > 60
      ? coloring.prompt.slice(0, 60) + "..."
      : coloring.prompt;

  // Get max 3 tags for display
  const displayTags = coloring.tags.slice(0, 3);

  const isLibraryVariant = variant === "library";
  const libraryColoring = isLibraryVariant
    ? (coloring as LibraryColoringDTO)
    : null;

  const addedAtLabel =
    libraryColoring != null
      ? new Date(libraryColoring.addedAt).toLocaleDateString("pl-PL", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null;

  return (
    <article
      ref={inViewRef}
      role={variant === "generated" ? "checkbox" : "button"}
      aria-checked={variant === "generated" ? isSelected : undefined}
      aria-label={`Kolorowanka: ${coloring.prompt}`}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300",
        "hover:border-primary/30 hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        {
          "ring-2 ring-primary ring-offset-2": isSelected,
          "animate-in fade-in-0 zoom-in-95 duration-500": animate,
        },
        className
      )}
    >
      {/* Selection Checkbox Overlay (for generated variant) */}
      {variant === "generated" && (
        <div
          className={cn(
            "absolute left-3 top-3 z-10 flex size-6 items-center justify-center rounded-full border-2 transition-all",
            {
              "border-primary bg-primary text-primary-foreground": isSelected,
              "border-white/80 bg-black/20 backdrop-blur-sm": !isSelected,
            }
          )}
          aria-hidden="true"
        >
          {isSelected && <Check className="size-4" />}
        </div>
      )}

      {/* Favorites Count (for gallery variant) */}
      {variant === "gallery" && coloring.favoritesCount > 0 && (
        <div
          className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm"
          aria-label={`${coloring.favoritesCount} polubień`}
        >
          <Heart className="size-3 fill-current" aria-hidden="true" />
          <span>{coloring.favoritesCount}</span>
        </div>
      )}

      {/* Library favorite badge (for library variant) */}
      {isLibraryVariant && libraryColoring?.isLibraryFavorite && (
        <div
          className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-primary/90 px-2 py-1 text-xs font-medium text-primary-foreground shadow-sm"
          aria-label="Ulubione w bibliotece"
        >
          <Heart className="size-3 fill-current" aria-hidden="true" />
          <span>Ulubione</span>
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {displayImageUrl ? (
          <Image
            src={displayImageUrl}
            alt={coloring.prompt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={cn(
              "object-cover transition-all duration-300",
              "group-hover:scale-105"
            )}
          />
        ) : (
          <div
            className="absolute inset-0 animate-pulse bg-muted-foreground/10"
            aria-hidden
          />
        )}

        {/* Hover Overlay */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/0 transition-colors",
            "group-hover:bg-black/10"
          )}
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="space-y-2 p-3">
        {/* Prompt */}
        <p
          className="line-clamp-2 text-sm font-medium leading-snug"
          title={coloring.prompt}
        >
          {truncatedPrompt}
        </p>

        {/* Tags */}
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {displayTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs font-normal"
              >
                {tag}
              </Badge>
            ))}
            {coloring.tags.length > 3 && (
              <Badge variant="outline" className="text-xs font-normal">
                +{coloring.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Metadata Row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{AGE_GROUP_LABELS[coloring.ageGroup]}</span>
          <span>{STYLE_LABELS[coloring.style]}</span>
        </div>

        {/* Added date for library variant */}
        {isLibraryVariant && addedAtLabel && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="size-3" aria-hidden="true" />
            <span>Dodano {addedAtLabel}</span>
          </div>
        )}
      </div>
    </article>
  );
}

