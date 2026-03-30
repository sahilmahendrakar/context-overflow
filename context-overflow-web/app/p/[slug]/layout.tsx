"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useActiveProject } from "@/app/context/ActiveProjectContext";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
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

function ProjectHeader({ project, slug }: { project: ProjectInfo; slug: string }) {
  return (
    <div className="mb-6 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <Link
            href={`/p/${slug}`}
            className="text-lg font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition"
          >
            {project.name}
          </Link>
          {project.description && (
            <p className="text-sm text-[var(--text-secondary)]">{project.description}</p>
          )}
        </div>
      </div>
      <Button asChild variant="ghost" size="sm">
        <Link href={`/p/${slug}/settings`}>Settings</Link>
      </Button>
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
      setStatus("forbidden");
      return;
    }

    (async () => {
      const token = await getIdToken();
      if (!token) { setStatus("forbidden"); return; }

      const res = await fetch(`/api/projects/${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
      <div>
        <ProjectHeader project={project!} slug={slug} />
        {children}
      </div>
    </ProjectProvider>
  );
}
