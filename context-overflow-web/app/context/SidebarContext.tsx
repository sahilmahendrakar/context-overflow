"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface SidebarContextValue {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  closeMobileSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileSidebar = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <SidebarContext.Provider value={{ mobileOpen, setMobileOpen, closeMobileSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}
