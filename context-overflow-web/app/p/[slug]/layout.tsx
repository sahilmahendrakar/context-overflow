"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useActiveProject } from "@/app/context/ActiveProjectContext";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProjectProvider } from "./ProjectContext";

interface ProjectInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  inviteCode?: string;
}

function AccessDenied({ message, showSignIn, onSignIn }: { message: string; showSignIn: boolean; onSignIn: () => void }) {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Access denied</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{message}</p>
      {showSignIn && (
        <Button onClick={onSignIn} className="mt-6">Sign in with Google</Button>
      )}
    </div>
  );
}

export default function ProjectLayout({ children }: { children: ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading, signIn, getIdToken } = useAuth();
  const { setActiveProject } = useActiveProject();
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "forbidden" | "not_found">("loading");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const id = window.setTimeout(() => setStatus("forbidden"), 0);
      return () => clearTimeout(id);
    }

    let cancelled = false;
    (async () => {
      const token = await getIdToken();
      if (cancelled) return;
      if (!token) {
        window.setTimeout(() => setStatus("forbidden"), 0);
        return;
      }

      const res = await fetch(`/api/projects/${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (cancelled) return;
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        setActiveProject({ id: data.id, slug: data.slug, name: data.name });
        setStatus("ok");
      } else if (res.status === 403) {
        setStatus("forbidden");
      } else {
        setStatus("not_found");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, user, loading, getIdToken, setActiveProject]);

  if (loading || status === "loading") {
    return <p className="py-16 text-center text-sm text-[var(--text-secondary)]">Loading...</p>;
  }

  if (status === "not_found") {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Project not found</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          The project &ldquo;{slug}&rdquo; doesn&apos;t exist.
        </p>
        <Button asChild className="mt-6"><Link href="/">Go home</Link></Button>
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <AccessDenied
        message={user ? "You are not a member of this project." : "Sign in to access this project."}
        showSignIn={!user}
        onSignIn={signIn}
      />
    );
  }

  return (
    <ProjectProvider value={project!}>
      {children}
    </ProjectProvider>
  );
}
