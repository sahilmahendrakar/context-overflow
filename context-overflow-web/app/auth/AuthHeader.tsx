"use client";

import Link from "next/link";
import ThemeToggle from "@/app/components/ThemeToggle";

export function AuthHeader() {
  return (
    <header className="shrink-0 border-b border-border bg-[color-mix(in_srgb,var(--background)_92%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-lg items-center justify-between gap-4 px-4 sm:px-5">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none ring-offset-background transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/context-overflow-icon.png"
            alt=""
            className="size-8 shrink-0 rounded-lg object-contain"
          />
          <span className="truncate text-sm font-semibold leading-tight text-foreground">
            Context<span className="text-primary">Overflow</span>
          </span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
