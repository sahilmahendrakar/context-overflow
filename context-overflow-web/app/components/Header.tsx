"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, Github, ListFilter, Plus, Users, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/context/AuthContext";
import { useActiveProject } from "@/app/context/ActiveProjectContext";

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

interface UserProject {
  project: { id: string; slug: string; name: string };
  role: string;
}

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [projectSwitcherOpen, setProjectSwitcherOpen] = useState(false);
  const [projects, setProjects] = useState<UserProject[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading, signIn, signOut, getIdToken } = useAuth();
  const { activeProject, setActiveProject } = useActiveProject();
  const activeProjectSlug = activeProject?.slug ?? null;
  const navigationProjectSlug = user ? activeProjectSlug : null;

  const fetchProjects = useCallback(async () => {
    if (!user) { setProjects([]); return; }
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch("/api/projects", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setProjects(await res.json());
  }, [user, getIdToken]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  useEffect(() => {
    if (projectSwitcherOpen) void fetchProjects();
  }, [projectSwitcherOpen, fetchProjects]);

  const searchParamsKey = useMemo(() => searchParams.toString(), [searchParams]);

  const isSearchablePage =
    pathname === "/browse" ||
    (navigationProjectSlug && pathname === `/p/${navigationProjectSlug}`);

  useEffect(() => {
    if (isSearchablePage) {
      setSearchQuery(searchParams.get("q") ?? "");
    }
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
      if (menuRef.current && !menuRef.current.contains(t)) setMenuOpen(false);
      if (filterRef.current && !filterRef.current.contains(t)) setFilterOpen(false);
      if (projectRef.current && !projectRef.current.contains(t)) setProjectSwitcherOpen(false);
    }
    if (menuOpen || filterOpen || projectSwitcherOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, filterOpen, projectSwitcherOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_86%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-5">
        <div className="flex items-center gap-2">
          <Link href={navigationProjectSlug ? `/p/${navigationProjectSlug}/home` : "/"} className="flex items-center gap-2">
            <img
              src="/context-overflow-icon.png"
              alt="Context Overflow"
              className="h-8 w-8 rounded-md object-contain"
            />
            <span className="text-lg font-semibold text-[var(--text-primary)]">
              Context<span className="text-[var(--accent)]">Overflow</span>
            </span>
          </Link>
        </div>

        <div className="hidden min-w-0 flex-1 items-center gap-2 px-4 sm:flex md:gap-3 md:px-8">
          <form onSubmit={handleSearch} className="relative min-w-0 max-w-md flex-1">
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

          {!loading &&
            (user ? (
              <div className="relative shrink-0" ref={menuRef}>
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
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-1 shadow-lg">
                    <div className="px-3 py-2 text-xs text-[var(--text-secondary)]">
                      Signed in as <span className="font-medium text-[var(--text-primary)]">{user.username}</span>
                    </div>
                    <hr className="my-1 border-[var(--border)]" />
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setActiveProject(null);
                        signOut();
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button variant="ghost" className="shrink-0" onClick={signIn}>
                Sign in
              </Button>
            ))}

          {!loading && (
            <div ref={projectRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setProjectSwitcherOpen((o) => !o)}
                className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-2.5 py-1.5 text-sm transition hover:bg-[var(--surface-strong)]"
                aria-expanded={projectSwitcherOpen}
                aria-haspopup="listbox"
                aria-label="Project scope"
              >
                <Users className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                <span className="max-w-[8rem] truncate text-[var(--text-secondary)]">
                  {!user || !activeProjectSlug
                    ? "Public"
                    : activeProject?.slug === activeProjectSlug
                      ? activeProject.name
                      : projects.find((p) => p.project.slug === activeProjectSlug)?.project.name || activeProjectSlug}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-[var(--text-tertiary)] transition ${projectSwitcherOpen ? "rotate-180" : ""}`} />
              </button>
              {projectSwitcherOpen && (
                <div
                  className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[12rem] rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-1 shadow-lg"
                  role="listbox"
                  aria-label="Project scope"
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={!navigationProjectSlug}
                    onClick={() => {
                      setProjectSwitcherOpen(false);
                      setActiveProject(null);
                      router.push("/");
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                      !navigationProjectSlug
                        ? "bg-[var(--accent)]/10 font-medium text-[var(--accent)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    Public
                  </button>
                  {projects.length > 0 && (
                    <>
                      <hr className="my-1 border-[var(--border)]" />
                      {projects.map((p) => (
                        <button
                          key={p.project.id}
                          type="button"
                          role="option"
                          aria-selected={activeProjectSlug === p.project.slug}
                          onClick={() => {
                            setProjectSwitcherOpen(false);
                            setActiveProject(p.project);
                            router.push(`/p/${p.project.slug}`);
                          }}
                          className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                            activeProjectSlug === p.project.slug
                              ? "bg-[var(--accent)]/10 font-medium text-[var(--accent)]"
                              : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          {p.project.name}
                        </button>
                      ))}
                    </>
                  )}
                  <hr className="my-1 border-[var(--border)]" />
                  {user ? (
                    <button
                      type="button"
                      onClick={() => {
                        setProjectSwitcherOpen(false);
                        router.push("/projects/new");
                      }}
                      className="flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-left text-sm text-[var(--text-tertiary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Create Project
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      role="option"
                      aria-disabled
                      className="flex w-full cursor-not-allowed items-center gap-1.5 rounded-lg px-3 py-2 text-left text-sm text-[var(--text-tertiary)] opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Create Project
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="icon" className="rounded-full" title="GitHub repository">
              <a
                href="https://github.com/sahilmahendrakar/context-overflow"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View Context Overflow on GitHub"
              >
                <Github size={18} strokeWidth={2} />
              </a>
            </Button>
            <ThemeToggle />
          </div>
          <Button asChild variant="secondary">
            <Link href={navigationProjectSlug ? `/p/${navigationProjectSlug}` : "/browse"}>Browse</Link>
          </Button>
          <Button asChild size="icon" title="Create post" aria-label="Create post">
            <Link href={navigationProjectSlug ? `/p/${navigationProjectSlug}/post` : "/post"}>
              <Plus className="size-5" strokeWidth={2.25} />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
