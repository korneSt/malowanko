"use client";

import { cn } from "@/lib/utils";
import { Sparkles, AlertCircle, Clock } from "lucide-react";

interface GenerationLimitBadgeProps {
  /** Number of generations remaining today */
  remaining: number;
  /** Daily limit (default: 10) */
  limit?: number;
  /** Additional CSS classes */
  className?: string;
}

export function GenerationLimitBadge({
  remaining,
  limit = 100,
  className,
}: GenerationLimitBadgeProps) {
  const isWarning = remaining > 0 && remaining <= 3;
  const isExhausted = remaining === 0;

  // Calculate reset time (next midnight)
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const hoursUntilReset = Math.ceil(
    (tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60)
  );

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
        {
          "bg-muted text-muted-foreground": !isWarning && !isExhausted,
          "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400":
            isWarning,
          "bg-destructive/10 text-destructive": isExhausted,
        },
        className
      )}
      role="status"
      aria-live="polite"
    >
      {isExhausted ? (
        <>
          <AlertCircle className="size-4" aria-hidden="true" />
          <span>Limit wyczerpany</span>
          <span className="flex items-center gap-1 text-xs opacity-75">
            <Clock className="size-3" aria-hidden="true" />
            Reset za {hoursUntilReset}h
          </span>
        </>
      ) : (
        <>
          <Sparkles className="size-4" aria-hidden="true" />
          <span>
            Pozostało{" "}
            <strong className="font-bold">
              {remaining}/{limit}
            </strong>{" "}
            generowań dzisiaj
          </span>
        </>
      )}
    </div>
  );
}
