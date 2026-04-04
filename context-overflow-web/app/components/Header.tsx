"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, ListFilter, Plus, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/app/context/AuthContext";
import { useActiveProject } from "@/app/context/ActiveProjectContext";
import { cn } from "@/lib/utils";

function browsePath(
  q: string | undefined,
  type: "question" | "finding" | null,
  projectSlug?: string | null,
) {
  const p = new URLSearchParams();
  const trimmed = q?.trim();
  if (trimmed) p.set("q", trimmed);
  if (type) p.set("type", type);
  const s = p.toString();
  if (projectSlug) {
    return s ? `/p/${projectSlug}?${s}` : `/p/${projectSlug}`;
  }
  return s ? `/browse?${s}` : "/browse";
}

const TYPE_OPTIONS: { key: "question" | "finding" | null; label: string }[] = [
  { key: null, label: "All types" },
  { key: "question", label: "Questions" },
  { key: "finding", label: "Findings" },
];

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { activeProject } = useActiveProject();
  const activeProjectSlug = activeProject?.slug ?? null;
  const navigationProjectSlug = user ? activeProjectSlug : null;

  const searchParamsKey = useMemo(() => searchParams.toString(), [searchParams]);

  const isSearchablePage =
    pathname === "/browse" ||
    (navigationProjectSlug && pathname === `/p/${navigationProjectSlug}`);

  useEffect(() => {
    if (!isSearchablePage) return;
    const q = searchParams.get("q") ?? "";
    const id = window.setTimeout(() => setSearchQuery(q), 0);
    return () => clearTimeout(id);
  }, [pathname, searchParamsKey, searchParams, isSearchablePage]);

  function qForNavigation(): string | undefined {
    const fromUrl = searchParams.get("q")?.trim();
    if (fromUrl) return fromUrl;
    if (isSearchablePage) return undefined;
    const draft = searchQuery.trim();
    return draft || undefined;
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    const t = searchParams.get("type");
    const type = t === "question" || t === "finding" ? t : null;
    router.push(browsePath(trimmed, type, navigationProjectSlug));
  }

  function clearSearch(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSearchQuery("");
    const t = searchParams.get("type");
    const type = t === "question" || t === "finding" ? t : null;
    router.replace(browsePath(undefined, type, navigationProjectSlug));
  }

  function applyTypeFilter(type: "question" | "finding" | null) {
    setFilterOpen(false);
    router.push(browsePath(qForNavigation(), type, navigationProjectSlug));
  }

  const urlQ = searchParams.get("q") ?? "";
  const showClear = searchQuery.length > 0 || urlQ.length > 0;
  const tParam = searchParams.get("type");
  const urlType = tParam === "question" || tParam === "finding" ? tParam : null;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (filterRef.current && !filterRef.current.contains(t)) setFilterOpen(false);
    }
    if (filterOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterOpen]);

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_86%,transparent)] backdrop-blur-md transition-[height] duration-200 ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-5 lg:mx-0 lg:max-w-none lg:px-5">
        <div className="flex min-w-0 shrink-0 items-center">
          <SidebarTrigger className="-ml-1" />
        </div>

        <div className="flex min-w-0 max-w-full flex-1 items-center justify-center gap-2 sm:gap-3">
          <form
            onSubmit={handleSearch}
            className="relative hidden min-w-0 w-full max-w-md sm:block sm:w-[min(100vw-12rem,28rem)]"
          >
            <div className="flex items-center gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] pr-1 transition focus-within:border-[var(--accent)]/50 focus-within:ring-2 focus-within:ring-[var(--ring)]">
              <div className="relative min-w-0 flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full border-0 bg-transparent py-2 pl-9 pr-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none"
                />
                <svg
                  className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
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

              <div ref={filterRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setFilterOpen((o) => !o)}
                  className="flex h-8 items-center gap-0.5 rounded-lg px-1.5 text-[var(--text-secondary)] transition hover:bg-[var(--surface-strong)] hover:text-[var(--text-primary)] md:gap-1 md:px-2"
                  aria-expanded={filterOpen}
                  aria-haspopup="listbox"
                  aria-label="Filter by post type"
                >
                  <ListFilter className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" strokeWidth={2} />
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 opacity-70 transition md:h-4 md:w-4 ${filterOpen ? "rotate-180" : ""}`}
                    strokeWidth={2}
                  />
                </button>
                {filterOpen && (
                  <div
                    className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[10rem] rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-1 shadow-lg"
                    role="listbox"
                    aria-label="Post type"
                  >
                    {TYPE_OPTIONS.map((opt) => {
                      const selected = urlType === opt.key;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => applyTypeFilter(opt.key)}
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                            selected
                              ? "bg-[var(--accent)]/10 font-medium text-[var(--accent)]"
                              : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {showClear && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="mr-0.5 shrink-0 rounded-md p-1.5 text-[var(--text-tertiary)] transition hover:bg-[var(--surface-strong)] hover:text-[var(--text-primary)]"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              )}
            </div>
          </form>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={navigationProjectSlug ? `/p/${navigationProjectSlug}` : "/browse"}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "shrink-0 bg-muted text-foreground hover:bg-background dark:bg-input/50 dark:hover:bg-input/30",
              )}
            >
              Browse
            </Link>
            <Link
              href={navigationProjectSlug ? `/p/${navigationProjectSlug}/post` : "/post"}
              title="Create post"
              aria-label="Create post"
              className={cn(buttonVariants({ size: "icon" }), "shrink-0")}
            >
              <Plus className="size-5" strokeWidth={2.25} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
