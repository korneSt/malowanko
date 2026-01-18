/**
 * Logger utility for structured JSON logging.
 *
 * Provides consistent log formatting across the application with
 * automatic timestamp injection and JSON serialization.
 *
 * @example
 * ```typescript
 * logger.info("User generated coloring", { userId, prompt });
 * logger.error("Generation failed", { error, userId });
 * ```
 */

type LogLevel = "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry extends LogContext {
  level: LogLevel;
  message: string;
  timestamp: string;
}

/**
 * Creates a structured log entry and outputs it to the console.
 *
 * @param level - Log severity level
 * @param message - Human-readable log message
 * @param context - Additional contextual data to include in the log
 */
function log(level: LogLevel, message: string, context: LogContext = {}): void {
  const entry: LogEntry = {
    level,
    message,
    ...context,
    timestamp: new Date().toISOString(),
  };

  const output = JSON.stringify(entry);

  switch (level) {
    case "error":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    default:
      console.info(output);
  }
}

/**
 * Structured logger with info, warn, and error levels.
 * All logs are output as JSON for easy parsing and aggregation.
 */
export const logger = {
  /**
   * Log informational messages.
   * Use for general application events and debugging.
   */
  info: (message: string, context?: LogContext): void =>
    log("info", message, context),

  /**
   * Log warning messages.
   * Use for potentially problematic situations that don't prevent operation.
   */
  warn: (message: string, context?: LogContext): void =>
    log("warn", message, context),

  /**
   * Log error messages.
   * Use for errors that need attention or investigation.
   */
  error: (message: string, context?: LogContext): void =>
    log("error", message, context),
};

