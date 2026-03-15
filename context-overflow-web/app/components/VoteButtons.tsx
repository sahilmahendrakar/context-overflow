"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/context/AuthContext";

interface VoteButtonsProps {
  initialVotes: number;
  initialUserVote?: 1 | -1 | 0;
  targetId: string;
  targetType: "question" | "answer";
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
        targetType === "question"
          ? `/api/questions/${targetId}/vote`
          : `/api/answers/${targetId}/vote`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          value: direction,
        }),
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
        size="icon-sm"
        className={`${
          userVote === 1 ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"
        }`}
        aria-label="Upvote"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 15l7-7 7 7"
          />
        </svg>
      </Button>
      <span className="text-lg font-semibold text-[var(--text-primary)]">{votes}</span>
      <Button
        type="button"
        onClick={() => handleVote(-1)}
        disabled={loading}
        variant="ghost"
        size="icon-sm"
        className={`${
          userVote === -1 ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"
        }`}
        aria-label="Downvote"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Button>
    </div>
  );
}
