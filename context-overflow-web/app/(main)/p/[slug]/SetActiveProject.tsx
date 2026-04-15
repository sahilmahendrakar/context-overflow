"use client";

import { useEffect } from "react";
import { useActiveProject } from "@/app/context/ActiveProjectContext";

export function SetActiveProject({
  id,
  slug,
  name,
}: {
  id: string;
  slug: string;
  name: string;
}) {
  const { setActiveProject } = useActiveProject();

  useEffect(() => {
    setActiveProject({ id, slug, name });
  }, [id, slug, name, setActiveProject]);

  return null;
}
