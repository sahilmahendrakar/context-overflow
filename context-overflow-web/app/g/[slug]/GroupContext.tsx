"use client";

import { createContext, useContext } from "react";

interface GroupContextValue {
  id: string;
  name: string;
  slug: string;
  description?: string;
  inviteCode?: string;
}

const GroupContext = createContext<GroupContextValue | null>(null);

export function useGroup() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error("useGroup must be used within a group layout");
  return ctx;
}

export const GroupProvider = GroupContext.Provider;
