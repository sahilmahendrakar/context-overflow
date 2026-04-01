"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "co-sidebar-collapsed";

interface SidebarContextValue {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  closeMobileSidebar: () => void;
  desktopCollapsed: boolean;
  setDesktopCollapsed: (collapsed: boolean) => void;
  toggleDesktopSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const skipPersistRef = useRef(true);

  const closeMobileSidebar = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const toggleDesktopSidebar = useCallback(() => {
    setDesktopCollapsed((c) => !c);
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") {
        setDesktopCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, desktopCollapsed ? "true" : "false");
    } catch {
      /* ignore */
    }
  }, [desktopCollapsed]);

  return (
    <SidebarContext.Provider
      value={{
        mobileOpen,
        setMobileOpen,
        closeMobileSidebar,
        desktopCollapsed,
        setDesktopCollapsed,
        toggleDesktopSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
