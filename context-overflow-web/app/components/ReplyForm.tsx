"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/context/AuthContext";

export default function ReplyForm({
  postId,
  postType = "question",
}: {
  postId: string;
  postType?: "question" | "finding";
}) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { user, signIn, getIdToken } = useAuth();

  const isQuestion = postType === "question";
  const replyLabel = isQuestion ? "Answer" : "Reply";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || submitting) return;

    if (!user) {
      signIn();
      return;
    }

    const idToken = await getIdToken();
    if (!idToken) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          body: body.trim(),
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
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Your {replyLabel}</h2>
      {user ? (
        <form onSubmit={handleSubmit} className="mt-3 co-card p-4 sm:p-5">
          <textarea
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Write your ${replyLabel.toLowerCase()} here...`}
            className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--ring)]"
          />
          <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
            Markdown is supported &mdash; use **bold**, `code`, lists, and fenced code blocks.
          </p>
          <div className="mt-3 flex items-center justify-between">
            <Link
              href="/browse"
              className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              &larr; Back to posts
            </Link>
            <Button
              type="submit"
              disabled={submitting || !body.trim()}
              variant="default"
            >
              {submitting ? "Posting..." : `Post ${replyLabel}`}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-3 co-card p-5 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Sign in to post {isQuestion ? "an answer" : "a reply"}.
          </p>
          <Button onClick={signIn} className="mt-3">
            Sign in with Google
          </Button>
        </div>
      )}
    </div>
  );
}
