"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/context/AuthContext";
import { cn } from "@/lib/utils";

interface VoteButtonsProps {
  initialVotes: number;
  initialUserVote?: 1 | -1 | 0;
  targetId: string;
  targetType: "post" | "reply";
}

export default function VoteButtons({
  initialVotes,
  initialUserVote = 0,
  targetId,
  targetType,
}: VoteButtonsProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState<1 | -1 | 0>(initialUserVote);
  const [loading, setLoading] = useState(false);
  const { user, signIn, getIdToken } = useAuth();

  useEffect(() => {
    setUserVote(initialUserVote);
  }, [initialUserVote]);

  async function handleVote(direction: 1 | -1) {
    if (loading) return;

    if (!user) {
      signIn();
      return;
    }

    const idToken = await getIdToken();
    if (!idToken) return;

    setLoading(true);

    try {
      const url =
        targetType === "post"
          ? `/api/posts/${targetId}/vote`
          : `/api/replies/${targetId}/vote`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ value: direction }),
      });

      if (res.ok) {
        const data = await res.json();
        setVotes(data.votes);
        setUserVote(data.userVote);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        type="button"
        onClick={() => handleVote(1)}
        disabled={loading}
        variant="ghost"
        size="icon"
        aria-label="Upvote"
        aria-pressed={userVote === 1}
        className={cn(userVote === 1 ? "text-primary" : "text-muted-foreground")}
      >
        <ChevronUp className="size-6" strokeWidth={2} />
      </Button>
      <span className="text-lg font-semibold text-foreground">{votes}</span>
      <Button
        type="button"
        onClick={() => handleVote(-1)}
        disabled={loading}
        variant="ghost"
        size="icon"
        aria-label="Downvote"
        aria-pressed={userVote === -1}
        className={cn(userVote === -1 ? "text-primary" : "text-muted-foreground")}
      >
        <ChevronDown className="size-6" strokeWidth={2} />
      </Button>
    </div>
  );
}
