"use client";

import Link from "next/link";
import {
  Palette,
  Search,
  Clock,
  ImageOff,
  ArrowRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ============================================================================
// Types
// ============================================================================

type EmptyStateVariant = "library" | "search" | "limit" | "gallery";

interface EmptyStateProps {
  /** Variant determines the message and CTA */
  variant: EmptyStateVariant;
  /** Optional search query for search variant */
  searchQuery?: string;
  /** Optional hours until limit reset for limit variant */
  hoursUntilReset?: number;
  /** Optional suggested tags for search variant */
  suggestedTags?: string[];
  /** Optional callback for action button */
  onAction?: () => void;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Configuration
// ============================================================================

interface VariantConfig {
  icon: React.ElementType;
  title: string;
  description: string | ((props: EmptyStateProps) => string);
  ctaLabel: string;
  ctaHref: string;
  showSuggestedTags?: boolean;
}

const VARIANT_CONFIG: Record<EmptyStateVariant, VariantConfig> = {
  library: {
    icon: ImageOff,
    title: "Nie masz jeszcze żadnych kolorowanek",
    description:
      "Stwórz swoją pierwszą kolorowankę i zacznij budować kolekcję!",
    ctaLabel: "Przejdź do generatora",
    ctaHref: "/generator",
  },
  search: {
    icon: Search,
    title: "Brak wyników",
    description: (props) =>
      props.searchQuery
        ? `Nie znaleziono kolorowanek dla "${props.searchQuery}"`
        : "Nie znaleziono kolorowanek spełniających kryteria",
    ctaLabel: "Stwórz własną kolorowankę",
    ctaHref: "/generator",
    showSuggestedTags: true,
  },
  limit: {
    icon: Clock,
    title: "Dzienny limit wyczerpany",
    description: (props) =>
      props.hoursUntilReset
        ? `Limit generowań zostanie zresetowany za ${props.hoursUntilReset} ${
            props.hoursUntilReset === 1
              ? "godzinę"
              : props.hoursUntilReset < 5
              ? "godziny"
              : "godzin"
          }`
        : "Limit generowań zostanie zresetowany o północy",
    ctaLabel: "Przeglądaj galerię",
    ctaHref: "/galeria",
  },
  gallery: {
    icon: ImageOff,
    title: "Galeria jest pusta",
    description: "Bądź pierwszym, który stworzy kolorowankę!",
    ctaLabel: "Stwórz kolorowankę",
    ctaHref: "/generator",
  },
};

const DEFAULT_SUGGESTED_TAGS = [
  "zwierzęta",
  "pojazdy",
  "natura",
  "zamki",
  "kosmos",
  "dinozaury",
];

// ============================================================================
// Component
// ============================================================================

export function EmptyState({
  variant,
  searchQuery,
  hoursUntilReset,
  suggestedTags = DEFAULT_SUGGESTED_TAGS,
  onAction,
  className,
}: EmptyStateProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  // Get description based on variant
  const description =
    typeof config.description === "function"
      ? config.description({ variant, searchQuery, hoursUntilReset })
      : config.description;

  // Icon colors based on variant
  const iconColors = {
    library: "from-primary/10 to-secondary/10 text-primary",
    search: "from-amber-100 to-orange-100 text-amber-600 dark:from-amber-900/20 dark:to-orange-900/20 dark:text-amber-400",
    limit: "from-destructive/10 to-destructive/5 text-destructive",
    gallery: "from-muted to-muted text-muted-foreground",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 text-center",
        className
      )}
      role="status"
      aria-label={config.title}
    >
      {/* Icon */}
      <div
        className={cn(
          "mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br",
          iconColors[variant]
        )}
      >
        <Icon className="size-8" aria-hidden="true" />
      </div>

      {/* Title */}
      <h2 className="mb-2 text-lg font-semibold">{config.title}</h2>

      {/* Description */}
      <p className="mb-6 max-w-md text-muted-foreground">{description}</p>

      {/* Suggested Tags (for search variant) */}
      {config.showSuggestedTags && suggestedTags.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-sm text-muted-foreground">
            Popularne tematy:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestedTags.slice(0, 6).map((tag) => (
              <Link
                key={tag}
                href={`/galeria?search=${encodeURIComponent(tag)}`}
                className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA Button */}
      <Button asChild onClick={onAction} className="gap-2">
        <Link href={config.ctaHref}>
          {variant === "limit" ? (
            <Palette className="size-4" aria-hidden="true" />
          ) : (
            <ArrowRight className="size-4" aria-hidden="true" />
          )}
          {config.ctaLabel}
        </Link>
      </Button>
    </div>
  );
}

