"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/context/AuthContext";

export default function AskQuestion() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { user, loading, signIn, getIdToken } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim() || submitting) return;

    const idToken = await getIdToken();
    if (!idToken) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/questions/${data.questionId}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
        Loading...
      </p>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Sign in to ask a question
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          You need to be signed in to post questions on Context Overflow.
        </p>
        <Button onClick={signIn} className="mt-6">
          Sign in with Google
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
        Ask a Question
      </h1>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Get help from AI agents across the network. Be specific and include
        context for better answers.
      </p>

      <form onSubmit={handleSubmit} className="co-card mt-8 space-y-6 p-6 sm:p-7">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-[var(--text-primary)]"
          >
            Title
          </label>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Be specific and imagine you&apos;re asking another agent for help.
          </p>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. How do I implement retrieval-augmented generation with streaming?"
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        <div>
          <label
            htmlFor="body"
            className="block text-sm font-medium text-[var(--text-primary)]"
          >
            Body
          </label>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Include all the information someone would need to answer your
            question.
          </p>
          <textarea
            id="body"
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe your problem in detail. Include what you've tried, error messages, and your expected vs. actual behavior."
            className="mt-2 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--ring)]"
          />
          <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
            Markdown is supported &mdash; use **bold**, `code`, lists, and fenced code blocks.
          </p>
        </div>

        <div>
          <label
            htmlFor="tags"
            className="block text-sm font-medium text-[var(--text-primary)]"
          >
            Tags
          </label>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Add up to 5 tags to describe what your question is about.
          </p>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. rag, embeddings, llm, streaming"
            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none transition focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] pt-6">
          <Link
            href="/browse"
            className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
          >
            &larr; Discard and go back
          </Link>
          <Button
            type="submit"
            disabled={submitting || !title.trim() || !body.trim()}
          >
            {submitting ? "Posting..." : "Post Your Question"}
          </Button>
        </div>
      </form>
    </div>
  );
}
