"use client";

import { useState, useCallback, useId } from "react";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  generateColoringSchema,
  formatZodError,
} from "@/src/lib/validations/coloring";
import type {
  AgeGroup,
  ColoringStyle,
  GenerateColoringInput,
} from "@/app/types";

// ============================================================================
// Types
// ============================================================================

interface GeneratorFormProps {
  /** Number of remaining generations for today */
  remainingGenerations: number;
  /** Callback when form is submitted */
  onSubmit: (input: GenerateColoringInput) => Promise<void>;
  /** Whether generation is in progress */
  isLoading: boolean;
  /** Additional CSS classes */
  className?: string;
}

interface FormState {
  prompt: string;
  ageGroup: AgeGroup;
  style: ColoringStyle;
  count: 1 | 2 | 3 | 4 | 5;
}

interface FormErrors {
  prompt?: string;
  ageGroup?: string;
  style?: string;
  count?: string;
}

// ============================================================================
// Constants
// ============================================================================

const AGE_GROUP_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: "0-3", label: "0-3 lata (bardzo proste)" },
  { value: "4-8", label: "4-8 lat (średnie)" },
  { value: "9-12", label: "9-12 lat (szczegółowe)" },
];

const STYLE_OPTIONS: { value: ColoringStyle; label: string }[] = [
  { value: "prosty", label: "Prosty" },
  { value: "klasyczny", label: "Klasyczny" },
  { value: "szczegolowy", label: "Szczegółowy" },
  { value: "mandala", label: "Mandala" },
];

const PROMPT_MAX_LENGTH = 500;

const PROMPT_PLACEHOLDER = `Opisz swoją wymarzoną kolorowankę...

Przykłady:
• "kot grający na gitarze"
• "zamek księżniczki z tęczą"
• "dinozaur w kosmosie"`;

// ============================================================================
// Component
// ============================================================================

export function GeneratorForm({
  remainingGenerations,
  onSubmit,
  isLoading,
  className,
}: GeneratorFormProps) {
  // Form state
  const [formState, setFormState] = useState<FormState>({
    prompt: "",
    ageGroup: "4-8",
    style: "klasyczny",
    count: 1,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Generate unique IDs for accessibility
  const promptId = useId();
  const ageGroupId = useId();
  const styleId = useId();
  const countId = useId();
  const promptErrorId = useId();

  // Derived state
  const isDisabled = isLoading || remainingGenerations === 0;
  const maxCount = Math.min(5, remainingGenerations) as 1 | 2 | 3 | 4 | 5;
  const countOptions = Array.from(
    { length: maxCount },
    (_, i) => (i + 1) as 1 | 2 | 3 | 4 | 5
  );

  // Handlers
  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= PROMPT_MAX_LENGTH) {
        setFormState((prev) => ({ ...prev, prompt: value }));
        if (errors.prompt) {
          setErrors((prev) => ({ ...prev, prompt: undefined }));
        }
      }
    },
    [errors.prompt]
  );

  const handleAgeGroupChange = useCallback((value: string | null) => {
    if (value) {
      setFormState((prev) => ({ ...prev, ageGroup: value as AgeGroup }));
    }
  }, []);

  const handleStyleChange = useCallback((value: string | null) => {
    if (value) {
      setFormState((prev) => ({ ...prev, style: value as ColoringStyle }));
    }
  }, []);

  const handleCountChange = useCallback((value: string | null) => {
    if (value) {
      setFormState((prev) => ({
        ...prev,
        count: parseInt(value, 10) as 1 | 2 | 3 | 4 | 5,
      }));
    }
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Clear previous errors
      setErrors({});

      // Validate with Zod
      const result = generateColoringSchema.safeParse(formState);

      if (!result.success) {
        const errorMessage = formatZodError(result.error);
        toast.error(errorMessage);

        // Map errors to fields
        const fieldErrors: FormErrors = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0] as keyof FormErrors;
          if (field) {
            fieldErrors[field] = issue.message;
          }
        }
        setErrors(fieldErrors);
        return;
      }

      // Submit the form
      await onSubmit(result.data as GenerateColoringInput);
    },
    [formState, onSubmit]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-sm",
        "md:sticky md:bottom-4",
        className
      )}
      aria-label="Formularz generowania kolorowanki"
    >
      <div className="space-y-4">
        {/* Prompt Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={promptId} className="text-sm font-medium">
              Opisz kolorowankę
            </Label>
            <span
              className={cn("text-xs", {
                "text-muted-foreground":
                  formState.prompt.length < PROMPT_MAX_LENGTH * 0.9,
                "text-amber-600 dark:text-amber-400":
                  formState.prompt.length >= PROMPT_MAX_LENGTH * 0.9,
              })}
              aria-live="polite"
            >
              {formState.prompt.length}/{PROMPT_MAX_LENGTH}
            </span>
          </div>
          <Textarea
            id={promptId}
            value={formState.prompt}
            onChange={handlePromptChange}
            placeholder={PROMPT_PLACEHOLDER}
            disabled={isDisabled}
            aria-invalid={!!errors.prompt}
            aria-describedby={errors.prompt ? promptErrorId : undefined}
            className="min-h-24 resize-none"
          />
          {errors.prompt && (
            <p
              id={promptErrorId}
              className="text-sm text-destructive"
              role="alert"
            >
              {errors.prompt}
            </p>
          )}
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Age Group */}
          <div className="space-y-2">
            <Label htmlFor={ageGroupId} className="text-sm font-medium">
              Grupa wiekowa
            </Label>
            <Select
              value={formState.ageGroup}
              onValueChange={handleAgeGroupChange}
              disabled={isDisabled}
            >
              <SelectTrigger id={ageGroupId} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGE_GROUP_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Style */}
          <div className="space-y-2">
            <Label htmlFor={styleId} className="text-sm font-medium">
              Styl
            </Label>
            <Select
              value={formState.style}
              onValueChange={handleStyleChange}
              disabled={isDisabled}
            >
              <SelectTrigger id={styleId} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Count */}
          <div className="space-y-2">
            <Label htmlFor={countId} className="text-sm font-medium">
              Liczba obrazków
            </Label>
            <Select
              value={formState.count.toString()}
              onValueChange={handleCountChange}
              disabled={isDisabled || remainingGenerations === 0}
            >
              <SelectTrigger id={countId} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {countOptions.map((count) => (
                  <SelectItem key={count} value={count.toString()}>
                    {count}{" "}
                    {count === 1
                      ? "obrazek"
                      : count < 5
                      ? "obrazki"
                      : "obrazków"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          disabled={isDisabled || formState.prompt.trim().length === 0}
          className="w-full gap-2"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              Generuję...
            </>
          ) : (
            <>
              <Wand2 className="size-5" aria-hidden="true" />
              Generuj kolorowankę
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
