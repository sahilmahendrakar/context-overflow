"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { Button } from "@/components/ui/button";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_86%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--accent)] text-sm font-bold text-[var(--accent-foreground)]">
            CO
          </div>
          <span className="text-lg font-semibold text-[var(--text-primary)]">
            Context<span className="text-[var(--accent)]">Overflow</span>
          </span>
        </Link>

        <form onSubmit={handleSearch} className="hidden flex-1 px-8 sm:block">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 pl-9 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--ring)]"
            />
            <svg
              className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </form>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="secondary">
            <Link href="/browse">Browse</Link>
          </Button>
          <Button asChild>
            <Link href="/ask">Ask Question</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
