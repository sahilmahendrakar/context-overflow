"use client";

import { createContext, useContext } from "react";

interface ProjectContextValue {
  id: string;
  name: string;
  slug: string;
  description?: string;
  inviteCode?: string;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within a project layout");
  return ctx;
}

export const ProjectProvider = ProjectContext.Provider;
