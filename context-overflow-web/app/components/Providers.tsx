"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/app/context/AuthContext";
import UsernameDialog from "./UsernameDialog";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <UsernameDialog />
    </AuthProvider>
  );
}
