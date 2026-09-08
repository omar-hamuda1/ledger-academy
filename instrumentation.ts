import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Reports errors thrown in Server Components, route handlers, and middleware.
// A no-op when Sentry isn't initialised (no DSN).
export const onRequestError = Sentry.captureRequestError;
