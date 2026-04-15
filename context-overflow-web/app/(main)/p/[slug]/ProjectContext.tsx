"use client";

import { createContext, useContext, type ReactNode } from "react";

interface ProjectContextValue {
  id: string;
  name: string;
  slug: string;
  description?: string;
  inviteCode?: string;
  role?: "admin" | "member";
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within a project layout");
  return ctx;
}

export function ProjectProvider({ value, children }: { value: ProjectContextValue; children: ReactNode }) {
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}
