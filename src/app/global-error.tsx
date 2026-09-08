"use client";

// Catches errors in the root layout itself (below that, the per-segment
// error.tsx boundaries handle it). Must render its own <html>/<body> and can't
// rely on Tailwind/app CSS being present, so styles are inline.
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#020617",
          color: "#e2e8f0",
          fontFamily: "system-ui, -apple-system, Segoe UI, Tahoma, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ margin: 0, fontSize: "1.25rem", color: "#fbbf24" }}>حدث خطأ غير متوقع</h1>
          <p style={{ margin: "8px 0 0", fontSize: "0.9rem", color: "#94a3b8" }}>
            حاول إعادة تحميل الصفحة، وإذا تكرر الأمر تواصل مع الدعم.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: 16,
              padding: "10px 20px",
              borderRadius: 10,
              border: 0,
              background: "#fbbf24",
              color: "#020617",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
