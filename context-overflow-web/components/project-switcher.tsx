"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Loader2, Plus, Users } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useActiveProject } from "@/app/context/ActiveProjectContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface UserProject {
  project: { id: string; slug: string; name: string };
  role: string;
}

const triggerClass = cn(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding]",
  "h-12 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2",
  "group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! group-data-[collapsible=icon]:justify-center",
  "border border-[var(--border)] bg-[var(--surface-muted)] data-[popup-open]:bg-sidebar-accent",
  "[&_svg]:size-4 [&_svg]:shrink-0",
);

export function ProjectSwitcher() {
  const router = useRouter();
  const { user, getIdToken } = useAuth();
  const { activeProject, setActiveProject } = useActiveProject();
  const { isMobile, setOpenMobile } = useSidebar();
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const activeProjectSlug = activeProject?.slug ?? null;

  const displayName =
    !user || !activeProjectSlug
      ? "Public"
      : activeProject?.slug === activeProjectSlug
        ? activeProject.name
        : projects.find((p) => p.project.slug === activeProjectSlug)?.project.name ||
          activeProjectSlug;

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      return;
    }
    setProjectsLoading(true);
    try {
      const token = await getIdToken();
      if (!token) return;
      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setProjects(await res.json());
    } finally {
      setProjectsLoading(false);
    }
  }, [user, getIdToken]);

  const closeMobile = () => setOpenMobile(false);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        queueMicrotask(() => {
          void fetchProjects();
        });
      }
    },
    [fetchProjects],
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu onOpenChange={handleOpenChange}>
          <DropdownMenuTrigger className={triggerClass} type="button">
            <Users className="text-[var(--text-tertiary)]" strokeWidth={2} />
            <div className="min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium text-[var(--text-primary)]">{displayName}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 shrink-0 text-[var(--text-tertiary)] group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-1 shadow-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">Scope</DropdownMenuLabel>
              <DropdownMenuItem
                className="rounded-lg"
                onClick={() => {
                  setActiveProject(null);
                  closeMobile();
                  router.push("/browse");
                }}
              >
                Public
              </DropdownMenuItem>
              {projects.map((p) => (
                <DropdownMenuItem
                  key={p.project.id}
                  className="rounded-lg"
                  onClick={() => {
                    setActiveProject(p.project);
                    closeMobile();
                    router.push(`/p/${p.project.slug}`);
                  }}
                >
                  {p.project.name}
                </DropdownMenuItem>
              ))}
              {user && projectsLoading && (
                <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
                  <Loader2 className="size-4 shrink-0 animate-spin" strokeWidth={2} />
                  Loading projects...
                </div>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {user ? (
              <DropdownMenuItem
                className="rounded-lg"
                onClick={() => {
                  closeMobile();
                  router.push("/projects/new");
                }}
              >
                <Plus className="size-4" strokeWidth={2} />
                Create project
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="rounded-lg" disabled>
                <Plus className="size-4" strokeWidth={2} />
                Create project
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
