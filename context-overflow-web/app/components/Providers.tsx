"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/app/context/AuthContext";
import { ActiveProjectProvider } from "@/app/context/ActiveProjectContext";
import UsernameDialog from "./UsernameDialog";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ActiveProjectProvider>
        {children}
        <UsernameDialog />
      </ActiveProjectProvider>
    </AuthProvider>
  );
}
