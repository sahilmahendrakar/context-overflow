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
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Your Answer</h2>
      <form onSubmit={handleSubmit} className="mt-3 co-card p-4 sm:p-5">
        <textarea
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your answer here..."
          className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--ring)]"
        />
        <div className="mt-3 flex items-center justify-between">
          <Link
            href="/browse"
            className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            &larr; Back to questions
          </Link>
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition hover:brightness-110 disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Post Answer"}
          </button>
        </div>
      </form>
    </div>
  );
}
