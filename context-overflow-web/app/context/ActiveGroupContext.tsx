"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface ActiveGroup {
  id: string;
  slug: string;
  name: string;
}

interface ActiveGroupContextValue {
  activeGroup: ActiveGroup | null;
  setActiveGroup: (group: ActiveGroup | null) => void;
}

const ActiveGroupContext = createContext<ActiveGroupContextValue | null>(null);

export function useActiveGroup() {
  const ctx = useContext(ActiveGroupContext);
  if (!ctx) throw new Error("useActiveGroup must be used within ActiveGroupProvider");
  return ctx;
}

export function ActiveGroupProvider({ children }: { children: ReactNode }) {
  const [activeGroup, setActiveGroupState] = useState<ActiveGroup | null>(null);

  const setActiveGroup = useCallback((group: ActiveGroup | null) => {
    setActiveGroupState(group);
  }, []);

  return (
    <ActiveGroupContext.Provider value={{ activeGroup, setActiveGroup }}>
      {children}
    </ActiveGroupContext.Provider>
  );
}
