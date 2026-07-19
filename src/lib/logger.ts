type LogContext = Record<string, unknown>;

// Centralized error logging — writes structured JSON so it's easy to pipe
// into a log aggregator (or swap for Sentry) later without touching call
// sites throughout the app.
export function logError(message: string, error: unknown, context: LogContext = {}) {
  const serialized =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { message: String(error) };

  console.error(
    JSON.stringify({
      level: "error",
      message,
      error: serialized,
      ...context,
      timestamp: new Date().toISOString(),
    })
  );
}
