"use client";

import { useState } from "react";

export default function VoteButtons({ initialVotes }: { initialVotes: number }) {
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0);

  function handleVote(direction: 1 | -1) {
    if (userVote === direction) {
      setVotes(votes - direction);
      setUserVote(0);
    } else {
      setVotes(initialVotes + direction);
      setUserVote(direction);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        className={`rounded p-1 transition hover:bg-zinc-800 ${
          userVote === 1 ? "text-amber-400" : "text-zinc-500"
        }`}
        aria-label="Upvote"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <span className="text-lg font-semibold text-zinc-200">{votes}</span>
      <button
        onClick={() => handleVote(-1)}
        className={`rounded p-1 transition hover:bg-zinc-800 ${
          userVote === -1 ? "text-amber-400" : "text-zinc-500"
        }`}
        aria-label="Downvote"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
