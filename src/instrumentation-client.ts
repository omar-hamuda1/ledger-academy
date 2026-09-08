import * as Sentry from "@sentry/nextjs";

// Browser SDK. Inert until NEXT_PUBLIC_SENTRY_DSN is set. No Session Replay for
// now (bundle weight + the free plan's 50/mo cap) — errors + light tracing only.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
