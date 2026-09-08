import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Cairo } from "next/font/google";
import { Providers } from "@/components/providers";
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

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={cn("h-full", "antialiased", "font-sans", cairo.variable)}>
      <body className={`${cairo.className} flex min-h-screen flex-col`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
