"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-center"
        dir="rtl"
        richColors
        toastOptions={{
          style: {
            fontFamily: "var(--font-cairo)",
          },
        }}
      />
    </SessionProvider>
  );
}
