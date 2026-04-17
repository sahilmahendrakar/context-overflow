"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Github, LayoutGrid, ListChecks, Moon, Settings, ShieldCheck, Sun } from "lucide-react";
import { PendingInvitesSidebarLink } from "@/components/pending-invites-sidebar-link";
import { ProjectSwitcher } from "@/components/project-switcher";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useCoThemeToggle } from "@/app/components/ThemeToggle";
import { useAuth } from "@/app/context/AuthContext";
import { useActiveProject } from "@/app/context/ActiveProjectContext";

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { activeProject } = useActiveProject();
  const { setOpenMobile, state, isMobile } = useSidebar();
  const { isDark, toggleTheme } = useCoThemeToggle();

  const activeProjectSlug = activeProject?.slug ?? null;
  const navigationProjectSlug = user ? activeProjectSlug : null;
  const showWideChrome = isMobile || state === "expanded";
  const homeHref = navigationProjectSlug ? `/p/${navigationProjectSlug}/home` : "/";

  const closeMobile = () => setOpenMobile(false);

  function postsActive(slug: string) {
    if (pathname === `/p/${slug}`) return true;
    if (pathname.startsWith(`/p/${slug}/posts/`)) return true;
    if (pathname === `/p/${slug}/post`) return true;
    if (pathname === `/p/${slug}/home`) return true;
    return false;
  }

  function tasksActive(slug: string) {
    return pathname.startsWith(`/p/${slug}/tasks`);
  }

  function accessActive(slug: string) {
    return pathname.startsWith(`/p/${slug}/access`);
  }

  function settingsActive(slug: string) {
    return pathname.startsWith(`/p/${slug}/settings`);
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-border">
      <SidebarHeader className="gap-2 border-b border-border border-transparent p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Home"
              size="lg"
              render={<Link href={homeHref} onClick={closeMobile} />}
            >
              <img
                src="/context-overflow-icon.png"
                alt=""
                className="size-8 shrink-0 rounded-lg object-contain"
              />
              {showWideChrome && (
                <span className="truncate text-sm font-semibold leading-tight text-foreground">
                  Context<span className="text-primary">Overflow</span>
                </span>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <ProjectSwitcher />
      </SidebarHeader>

      <SidebarContent className="px-0">
        {navigationProjectSlug && (
          <SidebarGroup className="p-2">
            <SidebarGroupLabel>Project</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={postsActive(navigationProjectSlug)}
                    tooltip="Browse"
                    render={
                      <Link href={`/p/${navigationProjectSlug}`} onClick={closeMobile} />
                    }
                  >
                    <LayoutGrid strokeWidth={2} />
                    <span>Browse</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={tasksActive(navigationProjectSlug)}
                    tooltip="Tasks"
                    render={
                      <Link
                        href={`/p/${navigationProjectSlug}/tasks`}
                        onClick={closeMobile}
                      />
                    }
                  >
                    <ListChecks strokeWidth={2} />
                    <span>Tasks</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={accessActive(navigationProjectSlug)}
                    tooltip="Access"
                    render={
                      <Link
                        href={`/p/${navigationProjectSlug}/access`}
                        onClick={closeMobile}
                      />
                    }
                  >
                    <ShieldCheck strokeWidth={2} />
                    <span>Access</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={settingsActive(navigationProjectSlug)}
                    tooltip="Settings"
                    render={
                      <Link
                        href={`/p/${navigationProjectSlug}/settings`}
                        onClick={closeMobile}
                      />
                    }
                  >
                    <Settings strokeWidth={2} />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {!navigationProjectSlug && (
          <SidebarGroup className="p-2">
            <SidebarGroupLabel>Public</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname === "/browse"}
                    tooltip="Browse"
                    render={<Link href="/browse" onClick={closeMobile} />}
                  >
                    <LayoutGrid strokeWidth={2} />
                    <span>Browse</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {!user && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={pathname.startsWith("/tasks")}
                      tooltip="Tasks"
                      render={<Link href="/tasks" onClick={closeMobile} />}
                    >
                      <ListChecks strokeWidth={2} />
                      <span>Tasks</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {user && (
          <SidebarGroup className="p-2">
            <SidebarGroupLabel>User</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={pathname === "/agents"}
                    tooltip="Agents"
                    render={<Link href="/agents" onClick={closeMobile} />}
                  >
                    <Bot strokeWidth={2} />
                    <span>Agents</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <PendingInvitesSidebarLink closeMobile={closeMobile} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border border-transparent p-2">
        <div className="flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="GitHub"
                render={
                  <a
                    href="https://github.com/sahilmahendrakar/context-overflow"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <Github className="size-4" strokeWidth={2} />
                <span className="group-data-[collapsible=icon]:hidden">GitHub</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Toggle theme"
                type="button"
                aria-label="Toggle theme"
                onClick={toggleTheme}
              >
                {isDark ? (
                  <Moon className="size-4" strokeWidth={2} />
                ) : (
                  <Sun className="size-4" strokeWidth={2} />
                )}
                <span className="group-data-[collapsible=icon]:hidden">
                  {isDark ? "Dark" : "Light"}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <NavUser />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
