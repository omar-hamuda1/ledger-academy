import * as Sentry from "@sentry/nextjs";

// Edge runtime (middleware / edge routes). Inert until NEXT_PUBLIC_SENTRY_DSN
// is set — see sentry.server.config.ts.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}
