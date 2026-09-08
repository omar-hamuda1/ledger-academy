import * as Sentry from "@sentry/nextjs";

// Inert until NEXT_PUBLIC_SENTRY_DSN is set (same nullable-config pattern as
// email / Upstash / storage). Add the DSN in Vercel to turn it on.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    // Students are minors — don't ship IPs / request bodies by default.
    sendDefaultPii: false,
    debug: process.env.SENTRY_DEBUG === "1",
  });
}
