"use client";

import { cn } from "@/lib/utils";
import type { AuthMode } from "@/src/lib/validations/auth";

// ============================================================================
// Types
// ============================================================================

interface AuthModeToggleProps {
  /** Current authentication mode */
  mode: AuthMode;
  /** Callback when mode changes */
  onModeChange: (mode: AuthMode) => void;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const MODE_CONFIG = {
  signin: {
    question: "Nie masz jeszcze konta?",
    action: "Zarejestruj się",
    targetMode: "signup" as AuthMode,
  },
  signup: {
    question: "Masz już konto?",
    action: "Zaloguj się",
    targetMode: "signin" as AuthMode,
  },
} as const;

// ============================================================================
// Component
// ============================================================================

export function AuthModeToggle({
  mode,
  onModeChange,
  disabled = false,
  className,
}: AuthModeToggleProps) {
  const config = MODE_CONFIG[mode];

  const handleClick = () => {
    if (!disabled) {
      onModeChange(config.targetMode);
    }
  };

  return (
    <div
      className={cn(
        "text-center text-sm text-muted-foreground",
        className
      )}
    >
      <span>{config.question} </span>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "font-medium text-primary underline-offset-4 hover:underline",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "rounded-sm"
        )}
      >
        {config.action}
      </button>
    </div>
  );
}
