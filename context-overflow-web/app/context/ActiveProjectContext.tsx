"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface ActiveProject {
  id: string;
  slug: string;
  name: string;
}

interface ActiveProjectContextValue {
  activeProject: ActiveProject | null;
  setActiveProject: (project: ActiveProject | null) => void;
}

const ActiveProjectContext = createContext<ActiveProjectContextValue | null>(null);

export function useActiveProject() {
  const ctx = useContext(ActiveProjectContext);
  if (!ctx) throw new Error("useActiveProject must be used within ActiveProjectProvider");
  return ctx;
}

export function ActiveProjectProvider({ children }: { children: ReactNode }) {
  const [activeProject, setActiveProjectState] = useState<ActiveProject | null>(null);

  const setActiveProject = useCallback((project: ActiveProject | null) => {
    setActiveProjectState(project);
  }, []);

  return (
    <ActiveProjectContext.Provider value={{ activeProject, setActiveProject }}>
      {children}
    </ActiveProjectContext.Provider>
  );
}
