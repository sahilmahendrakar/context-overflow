"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Github,
  LayoutGrid,
  LogIn,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/context/AuthContext";
import { useActiveProject } from "@/app/context/ActiveProjectContext";
import { useSidebar } from "@/app/context/SidebarContext";
import ThemeToggle from "./ThemeToggle";

interface UserProject {
  project: { id: string; slug: string; name: string };
  role: string;
}

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [projectSwitcherOpen, setProjectSwitcherOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [projects, setProjects] = useState<UserProject[]>([]);
  const projectRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, signIn, signOut, getIdToken } = useAuth();
  const { activeProject, setActiveProject } = useActiveProject();
  const { mobileOpen, setMobileOpen, closeMobileSidebar } = useSidebar();

  const activeProjectSlug = activeProject?.slug ?? null;
  const navigationProjectSlug = user ? activeProjectSlug : null;

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      return;
    }
    const token = await getIdToken();
    if (!token) return;
    const res = await fetch("/api/projects", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setProjects(await res.json());
  }, [user, getIdToken]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetchProjects();
    }, 0);
    return () => clearTimeout(id);
  }, [fetchProjects]);

  useEffect(() => {
    if (!projectSwitcherOpen) return;
    const id = window.setTimeout(() => {
      void fetchProjects();
    }, 0);
    return () => clearTimeout(id);
  }, [projectSwitcherOpen, fetchProjects]);

  useEffect(() => {
    const w = collapsed ? "4.5rem" : "15rem";
    document.documentElement.style.setProperty("--co-sidebar-width", w);
    return () => {
      document.documentElement.style.removeProperty("--co-sidebar-width");
    };
  }, [collapsed]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (projectRef.current && !projectRef.current.contains(t)) {
        setProjectSwitcherOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(t)) {
        setUserMenuOpen(false);
      }
    }
    if (projectSwitcherOpen || userMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [projectSwitcherOpen, userMenuOpen]);

  const displayName =
    !user || !activeProjectSlug
      ? "Public"
      : activeProject?.slug === activeProjectSlug
        ? activeProject.name
        : projects.find((p) => p.project.slug === activeProjectSlug)?.project.name ||
          activeProjectSlug;

  const homeHref = navigationProjectSlug ? `/p/${navigationProjectSlug}/home` : "/";

  function postsActive(slug: string) {
    if (pathname === `/p/${slug}`) return true;
    if (pathname.startsWith(`/p/${slug}/posts/`)) return true;
    if (pathname === `/p/${slug}/post`) return true;
    if (pathname === `/p/${slug}/home`) return true;
    return false;
  }

  function settingsActive(slug: string) {
    return pathname.startsWith(`/p/${slug}/settings`);
  }

  function navLinkClass(active: boolean) {
    return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-200 ${
      collapsed ? "justify-center px-2" : ""
    } ${
      active
        ? "bg-[var(--accent-soft)] text-[var(--accent)]"
        : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
    }`;
  }

  const panel = (
    <aside
      className={`co-sidebar-panel flex h-full w-[min(17rem,88vw)] shrink-0 flex-col border-r border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_86%,transparent)] backdrop-blur-md lg:w-[var(--co-sidebar-width,15rem)] lg:min-w-0 lg:transition-[width] lg:duration-200 lg:ease-out`}
      aria-label="App navigation"
    >
      <div className={`flex items-center gap-2 border-b border-[var(--border)] px-3 py-4 ${collapsed ? "flex-col gap-3" : "justify-between"}`}>
        {!collapsed && (
          <Link
            href={homeHref}
            onClick={closeMobileSidebar}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 py-0.5 transition hover:opacity-90"
          >
            <img
              src="/context-overflow-icon.png"
              alt=""
              className="h-9 w-9 shrink-0 rounded-lg object-contain"
            />
            <span className="truncate text-base font-semibold text-[var(--text-primary)]">
              Context<span className="text-[var(--accent)]">Overflow</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <Link
            href={homeHref}
            onClick={closeMobileSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-[var(--surface-muted)]"
            title="Home"
          >
            <img src="/context-overflow-icon.png" alt="Home" className="h-9 w-9 rounded-lg object-contain" />
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" strokeWidth={2} /> : <ChevronLeft className="h-4 w-4" strokeWidth={2} />}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3">
        <div ref={projectRef} className="relative px-1">
          <button
            type="button"
            onClick={() => setProjectSwitcherOpen((o) => !o)}
            className={`flex w-full items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5 text-left text-sm transition hover:border-[var(--text-tertiary)]/30 hover:bg-[var(--surface-strong)] ${collapsed ? "justify-center px-2" : ""}`}
            aria-expanded={projectSwitcherOpen}
            aria-haspopup="listbox"
            aria-label="Project scope"
          >
            <Users className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" strokeWidth={2} />
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 truncate font-medium text-[var(--text-primary)]">{displayName}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-[var(--text-tertiary)] transition ${projectSwitcherOpen ? "rotate-180" : ""}`}
                  strokeWidth={2}
                />
              </>
            )}
          </button>
          {projectSwitcherOpen && (
            <div
              className={`absolute left-1 right-1 top-[calc(100%+6px)] z-50 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-1 shadow-lg ${collapsed ? "left-0 right-auto min-w-[12rem]" : ""}`}
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
                  closeMobileSidebar();
                  router.push("/");
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  !navigationProjectSlug
                    ? "bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
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
                        closeMobileSidebar();
                        router.push(`/p/${p.project.slug}`);
                      }}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                        activeProjectSlug === p.project.slug
                          ? "bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
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
                    closeMobileSidebar();
                    router.push("/projects/new");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--text-tertiary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                >
                  <Plus className="h-4 w-4" strokeWidth={2} />
                  Create Project
                </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      role="option"
                      aria-selected={false}
                      aria-disabled
                      className="flex w-full cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--text-tertiary)] opacity-50"
                    >
                  <Plus className="h-4 w-4" strokeWidth={2} />
                  Create Project
                </button>
              )}
            </div>
          )}
        </div>

        {navigationProjectSlug && (
          <nav className="mt-2 flex flex-col gap-0.5 px-1" aria-label="Project">
            {!collapsed && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Project
              </p>
            )}
            <Link
              href={`/p/${navigationProjectSlug}`}
              onClick={closeMobileSidebar}
              className={navLinkClass(postsActive(navigationProjectSlug))}
              title={collapsed ? "Posts" : undefined}
            >
              <FileText className="h-4 w-4 shrink-0" strokeWidth={2} />
              {!collapsed && <span>Posts</span>}
            </Link>
            <Link
              href={`/p/${navigationProjectSlug}/settings`}
              onClick={closeMobileSidebar}
              className={navLinkClass(settingsActive(navigationProjectSlug))}
              title={collapsed ? "Settings" : undefined}
            >
              <Settings className="h-4 w-4 shrink-0" strokeWidth={2} />
              {!collapsed && <span>Settings</span>}
            </Link>
          </nav>
        )}

        {!navigationProjectSlug && !collapsed && (
          <div className="mt-2 px-2">
            <Link
              href="/browse"
              onClick={closeMobileSidebar}
              className={navLinkClass(pathname === "/browse")}
            >
              <LayoutGrid className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span>Browse</span>
            </Link>
          </div>
        )}
        {!navigationProjectSlug && collapsed && (
          <div className="mt-2 flex flex-col gap-0.5 px-1">
            <Link
              href="/browse"
              onClick={closeMobileSidebar}
              className={navLinkClass(pathname === "/browse")}
              title="Browse"
            >
              <LayoutGrid className="h-4 w-4 shrink-0" strokeWidth={2} />
            </Link>
          </div>
        )}
      </div>

      <div className={`mt-auto border-t border-[var(--border)] p-3 ${collapsed ? "flex flex-col items-center gap-2" : "space-y-2"}`}>
        {!loading &&
          (user ? (
            <div className={`relative ${collapsed ? "flex flex-col items-center" : ""}`} ref={userMenuRef}>
              {collapsed ? (
                <>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((o) => !o)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-muted)] transition hover:ring-2 hover:ring-[var(--ring)]"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                    title={user.username}
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold uppercase text-[var(--text-secondary)]">
                        {user.username[0]}
                      </span>
                    )}
                  </button>
                  {userMenuOpen && (
                    <div
                      className="absolute bottom-full left-1/2 z-50 mb-2 w-44 -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-1 shadow-lg"
                      role="menu"
                    >
                      <p className="px-3 py-2 text-xs text-[var(--text-secondary)]">
                        <span className="block truncate font-medium text-[var(--text-primary)]">{user.username}</span>
                      </p>
                      <hr className="border-[var(--border)]" />
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setActiveProject(null);
                          signOut();
                          closeMobileSidebar();
                        }}
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-muted)]">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold uppercase text-[var(--text-secondary)]">
                        {user.username[0]}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-[var(--text-primary)]">{user.username}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveProject(null);
                        signOut();
                        closeMobileSidebar();
                      }}
                      className="text-xs text-[var(--text-tertiary)] transition hover:text-[var(--accent)]"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className={collapsed ? "h-9 w-9 p-0" : "w-full"}
              onClick={signIn}
              title="Sign in"
            >
              {collapsed ? <LogIn className="h-4 w-4" strokeWidth={2} /> : "Sign in"}
            </Button>
          ))}

        <div className={`flex items-center ${collapsed ? "flex-col gap-1" : "justify-between gap-2"}`}>
          <Button asChild variant="ghost" size="icon" className="rounded-full shrink-0" title="GitHub">
            <a
              href="https://github.com/sahilmahendrakar/context-overflow"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <Github size={18} strokeWidth={2} />
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );

  return (
    <>
      <div
        className={`co-sidebar-backdrop fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden
        onClick={() => setMobileOpen(false)}
      />
      <div
        className={`co-sidebar-rail fixed inset-y-0 left-0 z-50 flex lg:z-30 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } co-sidebar-slide`}
      >
        {panel}
      </div>
    </>
  );
}
