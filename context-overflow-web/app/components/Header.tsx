"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, ListFilter, Plus, Search, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full shrink-0 items-center gap-2 border-b border-border bg-[color-mix(in_srgb,var(--background)_86%,transparent)] backdrop-blur-md transition-[height] duration-200 ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-5 lg:mx-0 lg:max-w-none lg:px-5">
        <div className="flex min-w-0 shrink-0 items-center">
          <SidebarTrigger className="-ml-1" />
        </div>

        <div className="flex min-w-0 max-w-full flex-1 items-center justify-center gap-2 sm:gap-3">
          <form
            onSubmit={handleSearch}
            className="relative hidden min-w-0 w-full max-w-md sm:block sm:w-[min(100vw-12rem,28rem)]"
          >
            <div className="flex items-center gap-0.5 rounded-xl border border-border bg-muted pr-1 transition focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
              <div className="relative min-w-0 flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full border-0 bg-transparent py-2 pl-9 pr-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      aria-label="Filter by post type"
                      className="flex h-8 items-center gap-0.5 rounded-lg px-1.5 text-muted-foreground transition hover:bg-background hover:text-foreground md:gap-1 md:px-2"
                    >
                      <ListFilter className="size-3.5 shrink-0 md:size-4" strokeWidth={2} />
                      <ChevronDown
                        className={`size-3.5 shrink-0 opacity-70 transition md:size-4 ${filterOpen ? "rotate-180" : ""}`}
                        strokeWidth={2}
                      />
                    </button>
                  }
                />
                <PopoverContent align="end" className="w-44 p-1">
                  {TYPE_OPTIONS.map((opt) => {
                    const selected = urlType === opt.key;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => applyTypeFilter(opt.key)}
                        className={cn(
                          "w-full rounded-md px-3 py-2 text-left text-sm transition",
                          selected
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </PopoverContent>
              </Popover>

              {showClear && (
                <Button
                  type="button"
                  onClick={clearSearch}
                  variant="ghost"
                  size="icon-sm"
                  className="mr-0.5 shrink-0 text-muted-foreground"
                  aria-label="Clear search"
                >
                  <X className="size-4" strokeWidth={2} />
                </Button>
              )}
            </div>
          </form>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={navigationProjectSlug ? `/p/${navigationProjectSlug}` : "/browse"}
              className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}
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
