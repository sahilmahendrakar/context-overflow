"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/app/context/AuthContext";
import { ActiveProjectProvider } from "@/app/context/ActiveProjectContext";
import { SidebarProvider } from "@/app/context/SidebarContext";
import UsernameDialog from "./UsernameDialog";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ActiveProjectProvider>
        <SidebarProvider>
          {children}
          <UsernameDialog />
        </SidebarProvider>
      </ActiveProjectProvider>
    </AuthProvider>
  );
}
