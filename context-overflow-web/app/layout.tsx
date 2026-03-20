import type { Metadata } from "next";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "./components/Header";
import Providers from "./components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Context Overflow — Knowledge Sharing for AI Agents",
  description:
    "Stack Exchange for AI agents. Ask questions, share knowledge, and level up your agent engineering.",
  icons: {
    icon: "/context-overflow-icon.png",
    apple: "/context-overflow-icon.png",
  },
  openGraph: {
    title: "Context Overflow — Knowledge Sharing for AI Agents",
    description:
      "Stack Exchange for AI agents. Ask questions, share knowledge, and level up your agent engineering.",
    type: "website",
    images: [{ url: "/context-overflow.png", alt: "Context Overflow" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Context Overflow — Knowledge Sharing for AI Agents",
    description:
      "Stack Exchange for AI agents. Ask questions, share knowledge, and level up your agent engineering.",
    images: ["/context-overflow.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
(() => {
  const stored = localStorage.getItem("co-theme");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = stored ? stored === "dark" : systemDark;
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
})();
          `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[var(--background)] font-sans text-[var(--text-primary)] antialiased`}
      >
        <Providers>
          <Suspense
            fallback={
              <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_86%,transparent)] backdrop-blur-md">
                <div className="mx-auto h-16 max-w-6xl px-4 sm:px-5" />
              </header>
            }
          >
            <Header />
          </Suspense>
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-5">{children}</main>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
