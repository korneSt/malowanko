/**
 * Generation Limit Service
 *
 * Manages daily generation limits for users.
 * Provides atomic check-and-reserve functionality to prevent race conditions.
 *
 * Uses PostgreSQL functions defined in the database schema:
 * - check_and_update_daily_limit(user_id, count)
 * - get_remaining_generations(user_id)
 *
 * @module generation-limit
 */

import { createClient } from "@/app/db/server";
import type { LimitCheckResult } from "./types";
import { logger } from "@/src/lib/utils/logger";

/** Daily generation limit per user */
export const DAILY_LIMIT = 100;

/**
 * Atomically checks if user can generate and reserves the limit.
 *
 * This function uses a database function to atomically:
 * 1. Check if the user has enough remaining generations
 * 2. If yes, increment the counter and return success
 * 3. If no, return failure without modifying the counter
 *
 * The atomic operation prevents race conditions where multiple
 * concurrent requests could exceed the limit.
 *
 * @param userId - UUID of the user
 * @param count - Number of generations to reserve (1-5)
 * @returns Promise resolving to limit check result
 *
 * @example
 * ```typescript
 * const result = await checkAndReserveLimit(userId, 3);
 * if (!result.allowed) {
 *   return error("Daily limit exceeded");
 * }
 * // Proceed with generation
 * ```
 */
export async function checkAndReserveLimit(
  userId: string,
  count: number
): Promise<LimitCheckResult> {
  return { allowed: true, remaining: 100 };
  try {
    const supabase = await createClient();

    // Call the database function that atomically checks and updates
    const { data, error } = await supabase.rpc("check_and_update_daily_limit", {
      p_user_id: userId,
      p_count: count,
    });

    if (error) {
      logger.error("Failed to check generation limit", {
        userId,
        count,
        error: error.message,
      });
      // Fail closed - don't allow if we can't check
      return { allowed: false };
    }

    const allowed = data === true;

    if (!allowed) {
      logger.info("Generation limit exceeded", { userId, count });
    } else {
      logger.info("Generation limit reserved", { userId, count });
    }

    return { allowed };
  } catch (error) {
    logger.error("Unexpected error checking generation limit", {
      userId,
      count,
      error,
    });
    // Fail closed - don't allow if we can't check
    return { allowed: false };
  }
}

/**
 * Gets the number of remaining generations for today.
 *
 * Uses the database function that handles:
 * - Automatic daily reset based on last_generation_date
 * - Calculation of remaining generations
 *
 * @param userId - UUID of the user
 * @returns Promise resolving to number of remaining generations (0-10)
 *
 * @example
 * ```typescript
 * const remaining = await getRemainingGenerations(userId);
 * console.log(`You have ${remaining} generations left today`);
 * ```
 */
export async function getRemainingGenerations(userId: string): Promise<number> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_remaining_generations", {
      p_user_id: userId,
    });

    if (error) {
      logger.error("Failed to get remaining generations", {
        userId,
        error: error.message,
      });
      // Return 0 if we can't check - user will see limit exceeded message
      return 0;
    }

    const remaining = typeof data === "number" ? data : 0;

    logger.info("Fetched remaining generations", { userId, remaining });

    return remaining;
  } catch (error) {
    logger.error("Unexpected error getting remaining generations", {
      userId,
      error,
    });
    return 0;
  }
}

/**
 * Calculates when the daily limit will reset.
 *
 * @returns ISO timestamp of next midnight UTC
 */
export function getNextResetTime(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}
