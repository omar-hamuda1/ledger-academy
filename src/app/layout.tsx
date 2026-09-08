import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Cairo } from "next/font/google";
import { Providers } from "@/components/providers";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import "./globals.css";
import { cn } from "@/lib/utils";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "Ledger Academy | منصة إدارة الأعمال",
  description: "منصة Ledger Academy لتعليم إدارة الأعمال لطلاب المرحلة الثانوية بأسلوب عصري وتفاعلي.",
};

// Runs before first paint: if the visitor previously chose English, flip the
// document direction so there's no RTL→LTR flash. Arabic (the default) is a
// no-op. Inline is allowed by the CSP ('unsafe-inline' on script-src).
const setDirScript = `try{var m=document.cookie.match(/(?:^|;\\s*)locale=([^;]+)/);if(m&&m[1]==='en'){var e=document.documentElement;e.lang='en';e.dir='ltr';}}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", "font-sans", cairo.variable)}
    >
      <body className={`${cairo.className} flex min-h-screen flex-col`}>
        <script dangerouslySetInnerHTML={{ __html: setDirScript }} />
        <LocaleProvider>
          <Providers>{children}</Providers>
        </LocaleProvider>
      </body>
    </html>
  );
}
