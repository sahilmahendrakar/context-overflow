"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

const STORAGE_KEY = "co-sidebar-collapsed";

export function SidebarShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        if (localStorage.getItem(STORAGE_KEY) === "true") setOpen(false);
      } catch {
        /* ignore */
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "false" : "true");
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <SidebarProvider open={open} onOpenChange={onOpenChange}>
      {children}
    </SidebarProvider>
  );
}
