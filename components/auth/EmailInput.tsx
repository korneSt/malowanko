"use client";

import { useId } from "react";
import { Mail } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";

// ============================================================================
// Types
// ============================================================================

interface EmailInputProps {
  /** Current email value */
  value: string;
  /** Callback when email changes */
  onChange: (value: string) => void;
  /** Error message to display */
  error?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Optional description text */
  description?: string;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function EmailInput({
  value,
  onChange,
  error,
  disabled = false,
  placeholder = "twoj@email.pl",
  description,
  className,
}: EmailInputProps) {
  const inputId = useId();
  const errorId = useId();
  const descriptionId = useId();

  const describedBy = [
    error ? errorId : null,
    description ? descriptionId : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Field
      className={cn(className)}
      data-invalid={error ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
    >
      <FieldLabel htmlFor={inputId}>Adres e-mail</FieldLabel>

      <InputGroup data-disabled={disabled ? "true" : undefined}>
        <InputGroupAddon align="inline-start">
          <Mail className="size-4" aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          id={inputId}
          type="email"
          inputMode="email"
          autoComplete="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy || undefined}
        />
      </InputGroup>

      {description && !error && (
        <FieldDescription id={descriptionId}>{description}</FieldDescription>
      )}

      {error && <FieldError id={errorId}>{error}</FieldError>}
    </Field>
  );
}
