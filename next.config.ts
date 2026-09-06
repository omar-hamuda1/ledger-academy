import type { NextConfig } from "next";

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
        ],
      },
    ];
  },
};

export default nextConfig;
