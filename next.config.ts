import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

// Enforcing as of 2026-09-08 — verified clean on the live site in Report-Only
// mode first (no violations across home / course / lesson-with-video /
// dashboard). 'unsafe-inline' on script/style is the pragmatic choice for a
// Next app with no nonce pipeline (Next's hydration bootstrap + framer-motion
// inline styles); the value still adds object-src 'none', base-uri,
// frame-ancestors, upgrade-insecure-requests, and an external-script lockdown.
// If a new integration breaks, switch the header key back to
// `Content-Security-Policy-Report-Only`, add its host, re-verify, re-enforce.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.youtube.com", // YouTube IFrame API (lesson video progress)
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:", // course thumbnails are arbitrary admin HTTPS URLs
  "font-src 'self'", // next/font self-hosts Cairo
  "connect-src 'self' https://*.sentry.io", // Sentry error/trace ingest (inert until NEXT_PUBLIC_SENTRY_DSN is set)
  "frame-src https:", // admin-supplied lesson video embeds (YouTube/Vimeo/…)
  "media-src 'self' blob: https:", // direct-file .mp4 lessons
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  images: {
    // Course thumbnails are admin-supplied URLs (src/components/admin/EditCourseDetailsForm.tsx),
    // not from a fixed CDN, so any HTTPS host must be allowed. Only admins (requireAdmin()) can
    // set this field, so this isn't attacker-controlled user input.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Force HTTPS for a year. No `preload` yet — that's a one-way commitment
          // best made once the custom domain is settled.
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

// Wrapping is harmless without a DSN — the runtime SDK stays inert (see the
// sentry.*.config.ts guards). Source-map upload only runs when SENTRY_AUTH_TOKEN
// (+ SENTRY_ORG / SENTRY_PROJECT) are set; otherwise it's skipped, not fatal.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
