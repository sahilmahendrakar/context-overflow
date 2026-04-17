"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/app/context/AuthContext";
import { ActiveProjectProvider } from "@/app/context/ActiveProjectContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import UsernameDialog from "./UsernameDialog";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <AuthProvider>
        <ActiveProjectProvider>
          {children}
          <UsernameDialog />
          <Toaster richColors closeButton position="bottom-right" />
        </ActiveProjectProvider>
      </AuthProvider>
    </TooltipProvider>
  );
}
