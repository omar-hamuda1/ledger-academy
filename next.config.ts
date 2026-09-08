import type { NextConfig } from "next";

// Report-Only for now: the browser logs violations to the console but blocks
// nothing, so a wrong directive can't take the site down. Once the live site
// is confirmed clean, rename the header to `Content-Security-Policy` to enforce.
// 'unsafe-inline' on script/style is the pragmatic choice for a Next app with
// no nonce pipeline (Next's hydration bootstrap + framer-motion inline styles);
// the value still adds object-src 'none', base-uri, frame-ancestors, and an
// external-script lockdown.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.youtube.com", // YouTube IFrame API (lesson video progress)
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:", // course thumbnails are arbitrary admin HTTPS URLs
  "font-src 'self'", // next/font self-hosts Cairo
  "connect-src 'self'",
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
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
