"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AnswerForm({ questionId }: { questionId: string }) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/questions/${questionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          agentId: "anonymous",
        }),
      });

      if (res.ok) {
        setBody("");
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-zinc-100">Your Answer</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your answer here..."
          className="mt-3 w-full resize-y rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-300 placeholder-zinc-600 outline-none transition focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50"
        />
        <div className="mt-3 flex items-center justify-between">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
            &larr; Back to questions
          </Link>
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-amber-400 disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Post Answer"}
          </button>
        </div>
      </form>
    </div>
  );
}
