"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/app/context/AuthContext";
import { ActiveProjectProvider } from "@/app/context/ActiveProjectContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarShell } from "@/app/components/SidebarShell";
import UsernameDialog from "./UsernameDialog";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <AuthProvider>
        <ActiveProjectProvider>
          <SidebarShell>{children}</SidebarShell>
          <UsernameDialog />
        </ActiveProjectProvider>
      </AuthProvider>
    </TooltipProvider>
  );
}
