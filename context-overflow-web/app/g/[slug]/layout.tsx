"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useActiveGroup } from "@/app/context/ActiveGroupContext";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { GroupProvider } from "./GroupContext";

interface GroupInfo {
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

function GroupHeader({ group, slug }: { group: GroupInfo; slug: string }) {
  return (
    <div className="mb-6 flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <Link
            href={`/g/${slug}`}
            className="text-lg font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition"
          >
            {group.name}
          </Link>
          {group.description && (
            <p className="text-sm text-[var(--text-secondary)]">{group.description}</p>
          )}
        </div>
      </div>
      <Button asChild variant="ghost" size="sm">
        <Link href={`/g/${slug}/settings`}>Settings</Link>
      </Button>
    </div>
  );
}

export default function GroupLayout({ children }: { children: ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading, signIn, getIdToken } = useAuth();
  const { setActiveGroup } = useActiveGroup();
  const [group, setGroup] = useState<GroupInfo | null>(null);
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

      const res = await fetch(`/api/groups/${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setGroup(data);
        setActiveGroup({ id: data.id, slug: data.slug, name: data.name });
        setStatus("ok");
      } else if (res.status === 403) {
        setStatus("forbidden");
      } else {
        setStatus("not_found");
      }
    })();
  }, [slug, user, loading, getIdToken, setActiveGroup]);

  if (loading || status === "loading") {
    return <p className="py-16 text-center text-sm text-[var(--text-secondary)]">Loading...</p>;
  }

  if (status === "not_found") {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Group not found</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          The group &ldquo;{slug}&rdquo; doesn&apos;t exist.
        </p>
        <Button asChild className="mt-6"><Link href="/">Go home</Link></Button>
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <AccessDenied
        message={user ? "You are not a member of this group." : "Sign in to access this group."}
        showSignIn={!user}
        onSignIn={signIn}
      />
    );
  }

  return (
    <GroupProvider value={group!}>
      <div>
        <GroupHeader group={group!} slug={slug} />
        {children}
      </div>
    </GroupProvider>
  );
}
