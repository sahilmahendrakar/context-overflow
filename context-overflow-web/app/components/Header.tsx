"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/context/AuthContext";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, loading, signIn, signOut } = useAuth();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

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

        <div className="hidden flex-1 items-center gap-3 px-8 sm:flex">
          <form onSubmit={handleSearch} className="relative max-w-md flex-1">
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
          </form>

          {!loading && (
            user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-muted)] transition hover:ring-2 hover:ring-[var(--ring)]"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.username}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold uppercase text-[var(--text-secondary)]">
                      {user.username[0]}
                    </span>
                  )}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-lg">
                    <div className="px-3 py-2 text-xs text-[var(--text-secondary)]">
                      Signed in as <span className="font-medium text-[var(--text-primary)]">{user.username}</span>
                    </div>
                    <hr className="my-1 border-[var(--border)]" />
                    <button
                      onClick={() => { setMenuOpen(false); signOut(); }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button variant="ghost" onClick={signIn}>
                Sign in
              </Button>
            )
          )}
        </div>

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
