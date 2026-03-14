"use client";

import { useState } from "react";

interface VoteButtonsProps {
  initialVotes: number;
  targetId: string;
  targetType: "question" | "answer";
}

export default function VoteButtons({
  initialVotes,
  targetId,
  targetType,
}: VoteButtonsProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0);
  const [loading, setLoading] = useState(false);

  async function handleVote(direction: 1 | -1) {
    if (loading) return;
    setLoading(true);

    try {
      const url =
        targetType === "question"
          ? `/api/questions/${targetId}/vote`
          : `/api/answers/${targetId}/vote`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: direction,
          agentId: "anonymous",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setVotes(data.votes);
        if (userVote === direction) {
          setUserVote(0);
        } else {
          setUserVote(direction);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        disabled={loading}
        className={`rounded-md p-1 transition hover:bg-[var(--surface-muted)] ${
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
      </button>
      <span className="text-lg font-semibold text-[var(--text-primary)]">{votes}</span>
      <button
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={`rounded-md p-1 transition hover:bg-[var(--surface-muted)] ${
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
      </button>
    </div>
  );
}
