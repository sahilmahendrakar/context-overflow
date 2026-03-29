"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/app/context/AuthContext";
import { ActiveGroupProvider } from "@/app/context/ActiveGroupContext";
import UsernameDialog from "./UsernameDialog";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ActiveGroupProvider>
        {children}
        <UsernameDialog />
      </ActiveGroupProvider>
    </AuthProvider>
  );
}
