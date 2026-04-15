"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useActiveProject } from "@/app/context/ActiveProjectContext";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface PendingInvite {
  id: string;
  projectId: string;
  email: string;
  userId?: string;
  code: string;
  createdAt: string;
  project: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function InvitesPage() {
  const { user, getIdToken } = useAuth();
  const { setActiveProject } = useActiveProject();
  const router = useRouter();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    const token = await getIdToken();
    if (!token) {
      setLoading(false);
      return;
    }
    const res = await fetch("/api/invites/pending", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setInvites(await res.json());
    }
    setLoading(false);
  }, [getIdToken]);

  useEffect(() => {
    void fetchInvites();
  }, [fetchInvites]);

  async function handleAccept(invite: PendingInvite) {
    setAccepting(invite.id);
    const token = await getIdToken();
    if (!token) return;

    const res = await fetch(`/api/invites/${invite.code}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      setActiveProject({
        id: invite.project.id,
        slug: invite.project.slug,
        name: invite.project.name,
      });
      router.push(`/p/${invite.project.slug}`);
    }
    setAccepting(null);
  }

  async function handleDecline(inviteId: string) {
    setInvites((prev) => prev.filter((i) => i.id !== inviteId));
  }

  if (!user) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Sign in to view invites
        </h1>
      </div>
    );
  }

  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
        Loading...
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
        Project Invitations
      </h1>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        You&apos;ve been invited to join these projects.
      </p>

      {invites.length === 0 ? (
        <div className="co-card mt-6 p-8 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            No pending invitations.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="co-card flex items-center justify-between p-5"
            >
              <div>
                <h3 className="text-sm font-medium text-[var(--text-primary)]">
                  {invite.project.name}
                </h3>
                {invite.email && (
                  <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                    Invited via {invite.email}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDecline(invite.id)}
                  disabled={accepting === invite.id}
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAccept(invite)}
                  disabled={accepting === invite.id}
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  {accepting === invite.id ? "Joining..." : "Accept"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
