"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function AcceptInviteButton({
  code,
  projectName,
}: {
  code: string;
  projectName: string;
}) {
  const router = useRouter();
  const { user, loading, signIn, getIdToken } = useAuth();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    const token = await getIdToken();
    if (!token) return;

    setJoining(true);
    const res = await fetch(`/api/invites/${code}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/p/${data.project.slug}`);
    } else {
      setError("Failed to accept invite. It may have already been used.");
      setJoining(false);
    }
  }

  if (loading) return null;

  if (error) {
    return <p className="mt-4 text-sm text-destructive">{error}</p>;
  }

  if (user) {
    return (
      <Button onClick={handleAccept} disabled={joining} className="w-full">
        {joining ? "Joining..." : `Join ${projectName}`}
      </Button>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">Sign in to accept this invitation.</p>
      <Button onClick={signIn} className="w-full">Sign in with Google</Button>
    </div>
  );
}
