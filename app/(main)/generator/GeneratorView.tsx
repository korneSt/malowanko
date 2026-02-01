"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import { Palette, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  GenerationLimitBadge,
  GeneratorForm,
  GeneratedGrid,
} from "@/components/generator";
import { LoadingSpinner, EmptyState } from "@/components/shared";
import {
  generateColorings,
  getGenerationLimit,
} from "@/src/lib/actions/colorings";
import type { ColoringDTO, GenerateColoringInput } from "@/app/types";

// ============================================================================
// Types
// ============================================================================

interface GenerationState {
  colorings: ColoringDTO[];
  remainingGenerations: number;
  lastInput: GenerateColoringInput | null;
  isInitialized: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function GeneratorView() {
  // State
  const [state, setState] = useState<GenerationState>({
    colorings: [],
    remainingGenerations: 100, // Initial optimistic value
    lastInput: null,
    isInitialized: false,
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [isLoadingLimit, setIsLoadingLimit] = useState(true);
  const [hoursUntilReset, setHoursUntilReset] = useState(24);

  // Compute hours until reset after mount (avoids new Date() during prerender)
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    setHoursUntilReset(
      Math.ceil((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60))
    );
  }, []);

  // Fetch initial limit on mount
  useEffect(() => {
    async function fetchLimit() {
      try {
        const result = await getGenerationLimit();
        if (result.success) {
          setState((prev) => ({
            ...prev,
            remainingGenerations: 100,
            isInitialized: true,
          }));
        }
      } catch {
        // Keep default value on error
        setState((prev) => ({ ...prev, isInitialized: true }));
      } finally {
        setIsLoadingLimit(false);
      }
    }

    fetchLimit();
  }, []);

  // Handlers
  const handleGenerate = useCallback(async (input: GenerateColoringInput) => {
    startTransition(async () => {
      try {
        const result = await generateColorings(input);

        if (result.success) {
          setState((prev) => ({
            ...prev,
            colorings: result.data.colorings,
            remainingGenerations: result.data.remainingGenerations,
            lastInput: input,
          }));
          // Select all generated colorings by default
          setSelectedIds(new Set(result.data.colorings.map((c) => c.id)));
          toast.success(
            `Wygenerowano ${result.data.colorings.length} ${
              result.data.colorings.length === 1
                ? "kolorowankę"
                : result.data.colorings.length < 5
                ? "kolorowanki"
                : "kolorowanek"
            }!`
          );
        } else {
          toast.error(result.error.message);
        }
      } catch {
        toast.error("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
      }
    });
  }, []);

  const handleGenerateAgain = useCallback(() => {
    if (state.lastInput) {
      handleGenerate(state.lastInput);
    }
  }, [state.lastInput, handleGenerate]);

  const handleSaveSelected = useCallback(() => {
    // Colorings are auto-saved during generation, this is just for UX feedback
    const count = selectedIds.size;
    toast.success(
      `Zapisano ${count} ${
        count === 1 ? "kolorowankę" : count < 5 ? "kolorowanki" : "kolorowanek"
      } do biblioteki!`
    );
  }, [selectedIds]);

  const handleSaveAll = useCallback(() => {
    // Colorings are auto-saved during generation, this is just for UX feedback
    const count = state.colorings.length;
    toast.success(
      `Zapisano ${count} ${
        count === 1 ? "kolorowankę" : count < 5 ? "kolorowanki" : "kolorowanek"
      } do biblioteki!`
    );
  }, [state.colorings]);

  const handlePrintSelected = useCallback(() => {
    // TODO: Implement print modal
    toast.info("Funkcja drukowania będzie dostępna wkrótce!");
  }, []);

  // Derived state
  const hasColorings = state.colorings.length > 0;
  const isLimitExhausted = state.remainingGenerations === 0;

  // Loading state for initial limit fetch
  if (isLoadingLimit) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" text="Ładowanie..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
              <Palette className="size-6 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Generator kolorowanek
              </h1>
              <p className="text-sm text-muted-foreground">
                Opisz swoją wymarzoną kolorowankę
              </p>
            </div>
          </div>

          {/* Limit Badge */}
          <GenerationLimitBadge remaining={state.remainingGenerations} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative min-h-[300px]">
        {/* Loading Overlay */}
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <LoadingSpinner size="lg" text="Generuję kolorowanki..." />
              <p className="max-w-xs text-center text-sm text-muted-foreground">
                To może zająć do 30 sekund. Nasza AI tworzy unikalne rysunki
                specjalnie dla Ciebie!
              </p>
            </div>
          </div>
        )}

        {/* Limit Exhausted State */}
        {isLimitExhausted && !hasColorings && !isPending && (
          <EmptyState
            variant="limit"
            hoursUntilReset={hoursUntilReset}
            className="min-h-[300px]"
          />
        )}

        {/* Empty State */}
        {!hasColorings && !isPending && !isLimitExhausted && (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-secondary/10">
              <Sparkles className="size-8 text-primary" aria-hidden="true" />
            </div>
            <h2 className="mb-2 text-lg font-semibold">Gotowy do tworzenia?</h2>
            <p className="mb-6 max-w-md text-muted-foreground">
              Wypełnij formularz poniżej, opisz swoją wymarzoną kolorowankę i
              kliknij &ldquo;Generuj&rdquo;. AI stworzy unikalne rysunki do
              kolorowania!
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-3 py-1">
                🐱 Zwierzęta
              </span>
              <span className="rounded-full bg-muted px-3 py-1">🏰 Zamki</span>
              <span className="rounded-full bg-muted px-3 py-1">🚀 Kosmos</span>
              <span className="rounded-full bg-muted px-3 py-1">🌈 Tęcza</span>
              <span className="rounded-full bg-muted px-3 py-1">
                🦖 Dinozaury
              </span>
            </div>
          </div>
        )}

        {/* Generated Grid */}
        {hasColorings && !isPending && (
          <GeneratedGrid
            colorings={state.colorings}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onSaveSelected={handleSaveSelected}
            onSaveAll={handleSaveAll}
            onPrintSelected={handlePrintSelected}
            onGenerateAgain={
              state.lastInput && state.remainingGenerations > 0
                ? handleGenerateAgain
                : undefined
            }
          />
        )}
      </div>

      {/* Generator Form - Sticky at bottom on larger screens */}
      {!isLimitExhausted && (
        <div
          className={cn("mt-auto", {
            "opacity-50 pointer-events-none": isPending,
          })}
        >
          <GeneratorForm
            remainingGenerations={state.remainingGenerations}
            onSubmit={handleGenerate}
            isLoading={isPending}
          />
        </div>
      )}
    </div>
  );
}
