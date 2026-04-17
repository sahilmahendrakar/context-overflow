"use client";

import { ChevronsUpDown, LogIn, LogOut, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/app/context/AuthContext";
import { useActiveProject } from "@/app/context/ActiveProjectContext";
import { cn } from "@/lib/utils";

const triggerClass = cn(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding]",
  "h-12 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground",
  "group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! group-data-[collapsible=icon]:justify-center",
);

export function NavUser() {
  const { user, loading, signIn, signOut, switchAccount } = useAuth();
  const { setActiveProject } = useActiveProject();
  const { isMobile, setOpenMobile } = useSidebar();

  const closeMobile = () => setOpenMobile(false);

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Sign in"
            className="border border-border bg-muted hover:bg-accent"
            onClick={() => {
              void signIn();
              closeMobile();
            }}
          >
            <LogIn className="size-4" strokeWidth={2} />
            <span>Sign in</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger className={triggerClass} type="button">
            <Avatar className="size-8 rounded-lg">
              {user.photoURL ? (
                <AvatarImage src={user.photoURL} alt="" className="rounded-lg" />
              ) : null}
              <AvatarFallback className="rounded-lg text-xs font-semibold uppercase">
                {user.username[0]}
              </AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium">{user.username}</span>
              <span className="truncate text-xs text-muted-foreground">Account</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-60 group-data-[collapsible=icon]:hidden" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1.5 py-1.5 text-left text-sm">
                  <Avatar className="size-8 rounded-lg">
                    {user.photoURL ? (
                      <AvatarImage src={user.photoURL} alt="" className="rounded-lg" />
                    ) : null}
                    <AvatarFallback className="rounded-lg text-xs font-semibold uppercase">
                      {user.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 leading-tight">
                    <span className="truncate font-medium">{user.username}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="rounded-lg"
              onClick={() => {
                setActiveProject(null);
                void switchAccount();
                closeMobile();
              }}
            >
              <Users className="size-4" />
              Switch account
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              className="rounded-lg"
              onClick={() => {
                setActiveProject(null);
                void signOut();
                closeMobile();
              }}
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
